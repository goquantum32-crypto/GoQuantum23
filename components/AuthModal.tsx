
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { sanitizeInput, checkAdminCredentials } from '../utils/security';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onRegister: (user: User) => Promise<void> | void; 
  users: User[];
  initialMode?: 'LOGIN' | 'REGISTER';
  initialRole?: UserRole;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, onClose, onLogin, onRegister, users, 
  initialMode = 'LOGIN', initialRole = UserRole.PASSENGER 
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.PASSENGER);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', 
    vehicleNumber: '', vehicleColor: '', vehicleModel: '', availableSeats: '15',
    photoUrl: '', licenseUrl: ''
  });

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '', email: '', phone: '', password: '', 
        vehicleNumber: '', vehicleColor: '', vehicleModel: '', availableSeats: '15',
        photoUrl: '', licenseUrl: ''
      });
      setIsRegistering(initialMode === 'REGISTER');
      setRole(initialRole);
      setIsLoading(false);
    }
  }, [isOpen, initialMode, initialRole]);

  useEffect(() => {
    let interval: any;
    if (isLocked && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (lockoutTimer === 0) {
      setIsLocked(false);
      setLoginAttempts(0);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockoutTimer]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'licenseUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Apenas ficheiros de imagem são permitidos.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem é demasiado grande. Máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (isLocked) {
      alert(`Muitas tentativas falhadas. Aguarde ${lockoutTimer} segundos.`);
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = sanitizeInput(formData.email.trim());
      const cleanPassword = formData.password;
      const cleanName = sanitizeInput(formData.name);
      const cleanPhone = sanitizeInput(formData.phone);
      const cleanVehicleNumber = sanitizeInput(formData.vehicleNumber);

      const adminEmail = "goquantum32@gmail.com";

      if (!isRegistering && cleanEmail === adminEmail) {
        if (checkAdminCredentials(cleanPassword)) {
          onLogin({
            id: 'adm-root',
            name: 'Administrador Master',
            email: adminEmail,
            phone: '+258 844567470',
            role: UserRole.ADMIN
          });
          setLoginAttempts(0);
          return;
        } else {
          handleLoginFailure();
          return;
        }
      }

      if (isRegistering) {
        const newUser: User = {
          id: 'u-' + Date.now(),
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password: cleanPassword, 
          role: role,
          photoUrl: formData.photoUrl || '',
          licenseUrl: formData.licenseUrl || ''
        };

        if (role === UserRole.DRIVER) {
          newUser.vehicleNumber = cleanVehicleNumber;
          newUser.vehicleColor = sanitizeInput(formData.vehicleColor);
          newUser.vehicleModel = sanitizeInput(formData.vehicleModel);
          newUser.availableSeats = parseInt(formData.availableSeats) || 15;
        }
        
        await onRegister(newUser);
      } else {
        const user = users.find(u => u.email === cleanEmail && u.password === cleanPassword);
        if (user) {
          onLogin(user);
          setLoginAttempts(0);
        } else {
          handleLoginFailure();
        }
      }
    } catch (error) {
      console.error("Erro no AuthModal (interface):", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginFailure = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    if (newAttempts >= 3) {
      setIsLocked(true);
      setLockoutTimer(30);
      alert('Muitas tentativas incorretas. O login foi bloqueado por 30 segundos.');
    } else {
      alert(`Dados incorretos. Tentativa ${newAttempts} de 3.`);
    }
  };

  const inputClass = "w-full px-5 py-4 rounded-2xl border border-gray-700 focus:ring-2 focus:ring-blue-600 outline-none bg-gray-900 text-gray-100 font-semibold placeholder-gray-500 transition-all";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="bg-gray-900 rounded-[2.5rem] w-full max-w-lg p-10 relative shadow-2xl border border-gray-800 overflow-y-auto max-h-[95vh]">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-white tracking-tight">
            {isRegistering ? 'Criar Conta' : 'Aceder'}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
             <span className="text-blue-500 font-bold uppercase tracking-widest text-xs">Sistema GoQuantum</span>
             <span className="bg-green-900/30 text-green-500 text-[8px] px-2 py-0.5 rounded border border-green-900/50 font-black uppercase">Seguro v2.2</span>
          </div>
        </div>

        {isLocked && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-2xl text-center animate-pulse">
            <p className="text-red-500 font-bold text-sm">Bloqueio de Segurança Ativo</p>
            <p className="text-gray-400 text-xs mt-1">Tente novamente em {lockoutTimer}s</p>
          </div>
        )}

        <div className="space-y-5">
          <div className="flex bg-gray-950 p-1.5 rounded-2xl mb-2 border border-gray-800">
            <button type="button" onClick={() => setIsRegistering(false)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isRegistering ? 'bg-gray-800 shadow-md text-blue-400' : 'text-gray-500'}`}>Login</button>
            <button type="button" onClick={() => setIsRegistering(true)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isRegistering ? 'bg-gray-800 shadow-md text-blue-400' : 'text-gray-500'}`}>Registo</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="bg-gray-950 p-5 rounded-3xl border border-gray-800">
                  <label className="block text-[10px] font-black text-gray-500 mb-3 uppercase tracking-widest text-center">Tipo de Conta</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole(UserRole.PASSENGER)} className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${role === UserRole.PASSENGER ? 'border-blue-600 bg-blue-900/20 text-blue-400' : 'border-gray-800 bg-gray-900 text-gray-500'}`}>Passageiro</button>
                    <button type="button" onClick={() => setRole(UserRole.DRIVER)} className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${role === UserRole.DRIVER ? 'border-blue-600 bg-blue-900/20 text-blue-400' : 'border-gray-800 bg-gray-900 text-gray-500'}`}>Motorista</button>
                  </div>
                </div>

                <input required type="text" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} maxLength={50} />
                <input required type="tel" placeholder="Telefone (+258)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} maxLength={15} />
              </div>
            )}

            <input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} maxLength={100} />

            {isRegistering && role === UserRole.DRIVER && (
              <div className="space-y-4 pt-4 border-t border-gray-800 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Foto Perfil</label>
                    <div className="relative group overflow-hidden bg-gray-950 border border-gray-800 rounded-2xl h-24 flex items-center justify-center cursor-pointer">
                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'photoUrl')} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                        {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <span className="text-gray-600 text-[10px] font-bold">CARREGAR</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Carta Condução</label>
                    <div className="relative group overflow-hidden bg-gray-950 border border-gray-800 rounded-2xl h-24 flex items-center justify-center cursor-pointer">
                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'licenseUrl')} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                        {formData.licenseUrl ? <img src={formData.licenseUrl} className="w-full h-full object-cover" /> : <span className="text-gray-600 text-[10px] font-bold">CARREGAR</span>}
                    </div>
                  </div>
                </div>
                <input required type="text" placeholder="Matrícula" value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} className={inputClass} maxLength={20} />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="Modelo do Carro" value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})} className={inputClass} maxLength={30} />
                  <input required type="text" placeholder="Cor" value={formData.vehicleColor} onChange={e => setFormData({...formData, vehicleColor: e.target.value})} className={inputClass} maxLength={20} />
                </div>
              </div>
            )}

            <input required type="password" placeholder="Palavra-passe" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={inputClass} />

            <button type="submit" disabled={isLocked || isLoading} className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl mt-6 ${isLocked || isLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40'}`}>
              {isLoading ? 'A Processar...' : (isRegistering ? 'Confirmar Registo' : 'Entrar Agora')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
