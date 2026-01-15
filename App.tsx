
import React, { useState, useEffect } from 'react';
import { User, UserRole, TripRequest, PackageRequest } from './types';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import PassengerArea from './components/PassengerArea';
import DriverArea from './components/DriverArea';
import AdminArea from './components/AdminArea';
import AuthModal from './components/AuthModal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [packages, setPackages] = useState<PackageRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [view, setView] = useState<'LANDING' | 'PASSENGER' | 'DRIVER' | 'ADMIN'>('LANDING');

  useEffect(() => {
    try {
      const savedTrips = localStorage.getItem('gq_trips');
      const savedPackages = localStorage.getItem('gq_packages');
      const savedUsers = localStorage.getItem('gq_users');
      if (savedTrips) setTrips(JSON.parse(savedTrips));
      if (savedPackages) setPackages(JSON.parse(savedPackages));
      if (savedUsers) setUsers(JSON.parse(savedUsers));
    } catch (e) {
      console.error("Erro ao carregar dados locais:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('gq_trips', JSON.stringify(trips));
      localStorage.setItem('gq_packages', JSON.stringify(packages));
      localStorage.setItem('gq_users', JSON.stringify(users));
    } catch (e) {
      console.warn("LocalStorage cheio. As fotos podem ser demasiado grandes para guardar localmente.", e);
      // Não bloqueia a aplicação, apenas avisa no console
    }
  }, [trips, packages, users]);

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    // Atualiza o utilizador atual sem causar perda de sessão
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
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
        onLoginClick={() => setIsAuthModalOpen(true)} 
        onLogout={handleLogout}
        onViewChange={setView}
      />

      <main className="container mx-auto px-4 py-8">
        {view === 'LANDING' && <LandingPage onAction={() => setIsAuthModalOpen(true)} />}
        
        {view === 'PASSENGER' && currentUser?.role === UserRole.PASSENGER && (
          <PassengerArea 
            user={currentUser} 
            users={users}
            onUpdateUser={handleUpdateUser}
            onSubmitTrip={(t) => setTrips(prev => [t, ...prev])} 
            onSubmitPackage={(p) => setPackages(prev => [p, ...prev])}
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
            onUpdateTrip={(ut) => setTrips(prev => prev.map(t => t.id === ut.id ? ut : t))} 
          />
        )}

        {view === 'ADMIN' && currentUser?.role === UserRole.ADMIN && (
          <AdminArea 
            users={users} 
            onUpdateUser={handleUpdateUser}
            trips={trips} 
            onUpdateTrip={(ut) => setTrips(prev => prev.map(t => t.id === ut.id ? ut : t))}
            packages={packages} 
            onUpdatePackage={(up) => setPackages(prev => prev.map(p => p.id === up.id ? up : p))}
          />
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin}
        users={users}
        onRegister={(u) => { setUsers(prev => [...prev, u]); handleLogin(u); }}
      />
    </div>
  );
};

export default App;
