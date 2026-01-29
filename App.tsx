
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

// Chaves para o LocalStorage
const CACHE_KEY_USERS = 'gq_users_cache';
const CACHE_KEY_SESSION = 'gq_user_session';

const App: React.FC = () => {
  // Tenta carregar a sessão salva imediatamente ao iniciar
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(CACHE_KEY_SESSION);
    return saved ? JSON.parse(saved) : null;
  });

  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [packages, setPackages] = useState<PackageRequest[]>([]);
  
  // Inicializa users com o cache para evitar "Erro de dados incorretos" enquanto o Firebase carrega
  const [users, setUsers] = useState<User[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY_USERS);
    return cached ? JSON.parse(cached) : [];
  });
  
  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>(UserRole.PASSENGER);

  // Define a view inicial baseada na sessão recuperada
  const [view, setView] = useState<'LANDING' | 'PASSENGER' | 'DRIVER' | 'ADMIN'>(() => {
    const saved = localStorage.getItem(CACHE_KEY_SESSION);
    if (saved) {
      const user = JSON.parse(saved);
      if (user.role === UserRole.PASSENGER) return 'PASSENGER';
      if (user.role === UserRole.DRIVER) return 'DRIVER';
      if (user.role === UserRole.ADMIN) return 'ADMIN';
    }
    return 'LANDING';
  });

  // Estado para controlar modo offline/demo e erro
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string>("");

  // 1. Sincronização em Tempo Real (Leitura)
  useEffect(() => {
    try {
      // Escutar Utilizadores
      const usersRef = ref(db, 'users');
      const unsubscribeUsers = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        setIsOfflineMode(false); // Conexão bem sucedida
        setFirebaseError("");
        if (data) {
          const usersArray = Object.values(data) as User[];
          setUsers(usersArray);
          // Atualiza o Cache Local
          localStorage.setItem(CACHE_KEY_USERS, JSON.stringify(usersArray));
          
          if (currentUser) {
            const updatedCurrent = usersArray.find(u => u.id === currentUser.id);
            if (updatedCurrent) {
              setCurrentUser(updatedCurrent);
              // Atualiza a sessão salva com dados frescos
              localStorage.setItem(CACHE_KEY_SESSION, JSON.stringify(updatedCurrent));
            }
          }
        } else {
          // Se vier vazio do Firebase, não limpamos o cache imediatamente para segurança
          // setUsers([]); 
        }
      }, (error) => {
        console.warn("Firebase bloqueado ou offline.", error);
        setIsOfflineMode(true);
        setFirebaseError(error.message || "Erro de permissão ou conexão");
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
    } catch (e: any) {
      console.error("Erro fatal ao conectar Firebase:", e);
      setIsOfflineMode(true);
      setFirebaseError(e.message || "Erro desconhecido");
    }
  }, [currentUser?.id]);

  // 2. Funções de Escrita no Firebase com Fallback
  
  const handleRegisterUser = async (newUser: User) => {
    try {
      console.log("Tentando registar no Firebase...", newUser);
      
      const userToSave = JSON.parse(JSON.stringify(newUser));

      await set(ref(db, `users/${newUser.id}`), userToSave);
      
      // Atualizar cache local manualmente para garantir login imediato
      const newUsersList = [...users, newUser];
      setUsers(newUsersList);
      localStorage.setItem(CACHE_KEY_USERS, JSON.stringify(newUsersList));

      alert('Conta criada com sucesso no servidor!');
      handleLogin(newUser);
    } catch (error: any) {
      console.error("Erro no Firebase:", error);
      
      const errorMsg = error.code === 'PERMISSION_DENIED' 
        ? 'Aviso: Banco de dados bloqueado (Permissões).' 
        : 'Aviso: Erro de conexão com o servidor.';
      
      const confirmOffline = window.confirm(`${errorMsg}\n\nDeseja entrar no "Modo Offline" para testar o sistema? (Os dados serão salvos apenas neste dispositivo).`);
      
      if (confirmOffline) {
        const localUsers = [...users, newUser];
        setUsers(localUsers);
        localStorage.setItem(CACHE_KEY_USERS, JSON.stringify(localUsers)); // Persistir offline
        handleLogin(newUser);
        setIsOfflineMode(true);
        setFirebaseError("Modo Manual (Erro ao Registar)");
        alert('Bem-vindo! Você está operando em Modo Offline.');
      } else {
        throw error;
      }
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    if (isOfflineMode) {
      const updatedList = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUsers(updatedList);
      localStorage.setItem(CACHE_KEY_USERS, JSON.stringify(updatedList));
      
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
        localStorage.setItem(CACHE_KEY_SESSION, JSON.stringify(updatedUser));
      }
    } else {
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
    // Salvar Sessão
    localStorage.setItem(CACHE_KEY_SESSION, JSON.stringify(user));
    setIsAuthModalOpen(false);
    
    if (user.role === UserRole.PASSENGER) setView('PASSENGER');
    else if (user.role === UserRole.DRIVER) setView('DRIVER');
    else if (user.role === UserRole.ADMIN) setView('ADMIN');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CACHE_KEY_SESSION);
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
        <div className="bg-orange-600 text-white text-xs font-black text-center py-2 uppercase tracking-widest flex items-center justify-center gap-2">
          <span>⚠ Modo Offline Ativado:</span>
          <span className="bg-black/20 px-2 py-0.5 rounded text-[10px] lowercase font-mono">{firebaseError || "Conexão falhou"}</span>
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
