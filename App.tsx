
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

  // Estado para controlar modo offline/demo
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // 1. Sincronização em Tempo Real (Leitura)
  useEffect(() => {
    try {
      // Escutar Utilizadores
      const usersRef = ref(db, 'users');
      const unsubscribeUsers = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const usersArray = Object.values(data) as User[];
          setUsers(usersArray);
          
          if (currentUser) {
            const updatedCurrent = usersArray.find(u => u.id === currentUser.id);
            if (updatedCurrent) setCurrentUser(updatedCurrent);
          }
        } else {
          setUsers([]);
        }
      }, (error) => {
        console.warn("Firebase bloqueado ou offline. Ativando modo local.", error);
        setIsOfflineMode(true);
      });

      // Escutar Viagens
      const tripsRef = ref(db, 'trips');
      const unsubscribeTrips = onValue(tripsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setTrips(Object.values(data) as TripRequest[]);
        else setTrips([]);
      });

      // Escutar Encomendas
      const packagesRef = ref(db, 'packages');
      const unsubscribePackages = onValue(packagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setPackages(Object.values(data) as PackageRequest[]);
        else setPackages([]);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeTrips();
        unsubscribePackages();
      };
    } catch (e) {
      console.error("Erro fatal ao conectar Firebase:", e);
      setIsOfflineMode(true);
    }
  }, [currentUser?.id]);

  // 2. Funções de Escrita no Firebase com Fallback
  
  const handleRegisterUser = async (newUser: User) => {
    try {
      console.log("Tentando registar no Firebase...", newUser);
      
      // Sanitização: Firebase rejeita valores 'undefined'. 
      // JSON.stringify remove automaticamente chaves com valor undefined.
      const userToSave = JSON.parse(JSON.stringify(newUser));

      await set(ref(db, `users/${newUser.id}`), userToSave);
      alert('Conta criada com sucesso no servidor!');
      handleLogin(newUser);
    } catch (error: any) {
      console.error("Erro no Firebase:", error);
      
      // Fallback para LocalStorage (Modo Demo)
      const errorMsg = error.code === 'PERMISSION_DENIED' 
        ? 'Aviso: Banco de dados bloqueado (Permissões).' 
        : 'Aviso: Erro de conexão com o servidor.';
      
      const confirmOffline = window.confirm(`${errorMsg}\n\nDeseja entrar no "Modo Offline" para testar o sistema? (Os dados serão salvos apenas neste dispositivo).`);
      
      if (confirmOffline) {
        // Simular salvamento
        const localUsers = [...users, newUser];
        setUsers(localUsers);
        handleLogin(newUser);
        setIsOfflineMode(true);
        alert('Bem-vindo! Você está operando em Modo Offline.');
      } else {
        throw error; // Relança para o modal saber que falhou
      }
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    if (isOfflineMode) {
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
    } else {
      // Também sanitizamos aqui por segurança
      const userToSave = JSON.parse(JSON.stringify(updatedUser));
      update(ref(db, `users/${updatedUser.id}`), userToSave)
        .catch(err => console.error("Erro update:", err));
    }
  };

  const handleSubmitTrip = (trip: TripRequest) => {
    if (isOfflineMode) {
      setTrips([...trips, trip]);
    } else {
      const tripToSave = JSON.parse(JSON.stringify(trip));
      set(ref(db, `trips/${trip.id}`), tripToSave);
    }
  };

  const handleUpdateTrip = (updatedTrip: TripRequest) => {
    if (isOfflineMode) {
      setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    } else {
      const tripToSave = JSON.parse(JSON.stringify(updatedTrip));
      update(ref(db, `trips/${updatedTrip.id}`), tripToSave);
    }
  };

  const handleSubmitPackage = (pkg: PackageRequest) => {
    if (isOfflineMode) {
      setPackages([...packages, pkg]);
    } else {
      const pkgToSave = JSON.parse(JSON.stringify(pkg));
      set(ref(db, `packages/${pkg.id}`), pkgToSave);
    }
  };

  const handleUpdatePackage = (updatedPkg: PackageRequest) => {
    if (isOfflineMode) {
      setPackages(packages.map(p => p.id === updatedPkg.id ? updatedPkg : p));
    } else {
      const pkgToSave = JSON.parse(JSON.stringify(updatedPkg));
      update(ref(db, `packages/${updatedPkg.id}`), pkgToSave);
    }
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
      
      {isOfflineMode && (
        <div className="bg-orange-600 text-white text-xs font-black text-center py-1 uppercase tracking-widest">
          ⚠ Modo Offline / Demo Ativado
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {view === 'LANDING' && <LandingPage onAction={handleOpenAuth} />}
        
        {view === 'PASSENGER' && currentUser?.role === UserRole.PASSENGER && (
          <PassengerArea 
            user={currentUser} 
            users={users} 
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
        users={users} 
        onRegister={handleRegisterUser}
        initialMode={authInitialMode}
        initialRole={authInitialRole}
      />
    </div>
  );
};

export default App;
