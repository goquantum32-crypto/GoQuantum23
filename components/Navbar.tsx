
import React from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onViewChange: (view: any) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onLogout, onViewChange }) => {
  return (
    <nav className="bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => onViewChange('LANDING')}
        >
          {/* Ícone GQ Original Restaurado */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-900 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-500/30 group-hover:rotate-3 transition-transform duration-300">
            <span className="text-white font-black text-xl tracking-tighter">GQ</span>
          </div>

          <span className="text-xl font-black text-white tracking-tighter hidden sm:block">GoQuantum</span>
        </div>

        <div className="flex items-center space-x-4">
          <a 
            href="https://wa.me/258844567470" 
            target="_blank"
            className="hidden md:flex items-center space-x-2 bg-green-600/10 text-green-500 px-4 py-2 rounded-xl border border-green-900/30 hover:bg-green-600/20 transition-all"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Suporte</span>
          </a>

          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Olá,</span>
                <span className="text-xs font-bold text-gray-200">{user.name.split(' ')[0]}</span>
              </div>
              <img 
                src={user.photoUrl || 'https://via.placeholder.com/40'} 
                className="w-10 h-10 rounded-xl object-cover border border-gray-700 cursor-pointer" 
                onClick={() => user.role === UserRole.PASSENGER ? onViewChange('PASSENGER') : (user.role === UserRole.DRIVER ? onViewChange('DRIVER') : onViewChange('ADMIN'))}
              />
              <button 
                onClick={onLogout}
                className="text-gray-500 hover:text-red-400 p-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-xl shadow-blue-900/40"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
