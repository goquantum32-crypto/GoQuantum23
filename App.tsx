
import React, { useState, useEffect } from 'react';
import { User, UserRole, TripRequest, PackageRequest } from './types';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import PassengerArea from './components/PassengerArea';
import DriverArea from './components/DriverArea';
import AdminArea from './components/AdminArea';
import AuthModal from './components/AuthModal';
import { db } from './services/firebase';
import { ref, onValue, set, update } from 'firebase/database';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [packages, setPackages] = useState<PackageRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>(UserRole.PASSENGER);

  const [view, setView] = useState<'LANDING' | 'PASSENGER' | 'DRIVER' | 'ADMIN'>('LANDING');

  // 1. Sincronização em Tempo Real (Leitura)
  useEffect(() => {
    // Escutar Utilizadores
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Converte objeto Firebase em Array
        const usersArray = Object.values(data) as User[];
        setUsers(usersArray);
        
        // Atualiza o utilizador atual se os seus dados mudarem remotamente (ex: aprovação do admin)
        if (currentUser) {
          const updatedCurrent = usersArray.find(u => u.id === currentUser.id);
          if (updatedCurrent) {
            setCurrentUser(updatedCurrent);
          }
        }
      } else {
        setUsers([]);
      }
    });

    // Escutar Viagens
    const tripsRef = ref(db, 'trips');
    const unsubscribeTrips = onValue(tripsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTrips(Object.values(data) as TripRequest[]);
      } else {
        setTrips([]);
      }
    });

    // Escutar Encomendas
    const packagesRef = ref(db, 'packages');
    const unsubscribePackages = onValue(packagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPackages(Object.values(data) as PackageRequest[]);
      } else {
        setPackages([]);
      }
    });

    // Cleanup listeners ao desmontar
    return () => {
      unsubscribeUsers();
      unsubscribeTrips();
      unsubscribePackages();
    };
  }, [currentUser?.id]); // Dependência apenas do ID para atualizar referência interna

  // 2. Funções de Escrita no Firebase
  
  // Registo de novo utilizador ou Login
  const handleRegisterUser = async (newUser: User) => {
    try {
      await set(ref(db, `users/${newUser.id}`), newUser);
      handleLogin(newUser);
      alert('Conta criada com sucesso! Bem-vindo ao GoQuantum.');
    } catch (error: any) {
      console.error("Erro ao registar:", error);
      if (error.code === 'PERMISSION_DENIED') {
         alert('Erro de Permissão: O banco de dados está bloqueado. Por favor, configure as Regras do Firebase para "read": true, "write": true.');
      } else {
         alert(`Erro ao criar conta: ${error.message}. Verifique a sua conexão.`);
      }
      throw error; // Re-lança para o modal saber que falhou
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    // Atualiza apenas os campos necessários na base de dados
    update(ref(db, `users/${updatedUser.id}`), updatedUser)
      .catch((error) => console.error("Erro ao atualizar utilizador:", error));
  };

  // Gestão de Viagens
  const handleSubmitTrip = (trip: TripRequest) => {
    set(ref(db, `trips/${trip.id}`), trip);
  };

  const handleUpdateTrip = (updatedTrip: TripRequest) => {
    update(ref(db, `trips/${updatedTrip.id}`), updatedTrip);
  };

  // Gestão de Encomendas
  const handleSubmitPackage = (pkg: PackageRequest) => {
    set(ref(db, `packages/${pkg.id}`), pkg);
  };

  const handleUpdatePackage = (updatedPkg: PackageRequest) => {
    update(ref(db, `packages/${updatedPkg.id}`), updatedPkg);
  };

  // Fluxo de Autenticação
  const handleOpenAuth = (mode: 'LOGIN' | 'REGISTER', role: UserRole = UserRole.PASSENGER) => {
    setAuthInitialMode(mode);
    setAuthInitialRole(role);
    setIsAuthModalOpen(true);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    
    // Redirecionamento baseado no cargo
    if (user.role === UserRole.PASSENGER) setView('PASSENGER');
    else if (user.role === UserRole.DRIVER) setView('DRIVER');
    else if (user.role === UserRole.ADMIN) setView('ADMIN');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('LANDING');
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${view === 'LANDING' ? 'quantum-bg' : 'bg-gray-950 text-gray-100'}`}>
      <Navbar 
        user={currentUser} 
        onLoginClick={() => handleOpenAuth('LOGIN')} 
        onLogout={handleLogout}
        onViewChange={setView}
      />

      <main className="container mx-auto px-4 py-8">
        {view === 'LANDING' && <LandingPage onAction={handleOpenAuth} />}
        
        {view === 'PASSENGER' && currentUser?.role === UserRole.PASSENGER && (
          <PassengerArea 
            user={currentUser} 
            users={users} // Passamos a lista completa sincronizada
            onUpdateUser={handleUpdateUser}
            onSubmitTrip={handleSubmitTrip} 
            onUpdateTrip={handleUpdateTrip}
            onSubmitPackage={handleSubmitPackage}
            onUpdatePackage={handleUpdatePackage}
            trips={trips.filter(t => t.passengerId === currentUser.id)} 
            packages={packages.filter(p => p.passengerId === currentUser.id)}
          />
        )}

        {view === 'DRIVER' && currentUser?.role === UserRole.DRIVER && (
          <DriverArea 
            user={currentUser} 
            onUpdateUser={handleUpdateUser}
            trips={trips.filter(t => t.driverId === currentUser.id)} 
            packages={packages.filter(p => p.driverId === currentUser.id)} 
            onUpdateTrip={handleUpdateTrip} 
          />
        )}

        {view === 'ADMIN' && currentUser?.role === UserRole.ADMIN && (
          <AdminArea 
            users={users} 
            onUpdateUser={handleUpdateUser}
            trips={trips} 
            onUpdateTrip={handleUpdateTrip}
            packages={packages} 
            onUpdatePackage={handleUpdatePackage}
          />
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin}
        users={users} // Lista sincronizada do Firebase para verificar login
        onRegister={handleRegisterUser}
        initialMode={authInitialMode}
        initialRole={authInitialRole}
      />
    </div>
  );
};

export default App;
