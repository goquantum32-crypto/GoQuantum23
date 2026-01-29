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
  const [viewMode, setViewMode] = useState<'LOGIN' | 'REGISTER' | 'RECOVERY'>('LOGIN');
  const [role, setRole] = useState<UserRole>(UserRole.PASSENGER);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para visibilidade de senha
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    vehicleNumber: '', vehicleColor: '', vehicleModel: '', availableSeats: '15',
    photoUrl: '', licenseUrl: ''
  });

  // Estados para Recuperação
  // Step 1: Identificação (Email + Phone), Step 2: Nova Senha
  const [recoveryStep, setRecoveryStep] = useState(1); 
  const [recoveryData, setRecoveryData] = useState({ email: '', phone: '', newPassword: '', confirmNewPassword: '' });
  const [userToRecover, setUserToRecover] = useState<User | null>(null);

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setViewMode(initialMode === 'REGISTER' ? 'REGISTER' : 'LOGIN');
      setRole(initialRole);
    }
  }, [isOpen, initialMode, initialRole]);

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', password: '', confirmPassword: '',
      vehicleNumber: '', vehicleColor: '', vehicleModel: '', availableSeats: '15',
      photoUrl: '', licenseUrl: ''
    });
    setRecoveryData({ email: '', phone: '', newPassword: '', confirmNewPassword: '' });
    setRecoveryStep(1);
    setUserToRecover(null);
    setIsLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

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

      // Lógica de Registo
      if (viewMode === 'REGISTER') {
        if (formData.password !== formData.confirmPassword) {
          alert("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }

        const cleanName = sanitizeInput(formData.name);
        const cleanPhone = sanitizeInput(formData.phone);
        const cleanVehicleNumber = sanitizeInput(formData.vehicleNumber);

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
        return;
      } 
      
      // Lógica de Login
      if (viewMode === 'LOGIN') {
        const adminEmail = "goquantum32@gmail.com";
        if (cleanEmail === adminEmail) {
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

        const user = users.find(u => u.email === cleanEmail && u.password === cleanPassword);
        if (user) {
          onLogin(user);
          setLoginAttempts(0);
        } else {
          handleLoginFailure();
        }
      }
    } catch (error) {
      console.error("Erro no AuthModal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (recoveryStep === 1) {
        // Passo 1: Verificar Identidade (Email + Telefone)
        const email = sanitizeInput(recoveryData.email.trim());
        const phone = sanitizeInput(recoveryData.phone.trim());
        
        const user = users.find(u => u.email === email && u.phone === phone);

        if (user) {
          setUserToRecover(user);
          setRecoveryStep(2);
        } else {
          alert("Dados incorretos. Verifique se o Email e o Telefone correspondem à sua conta.");
          setIsLoading(false);
        }
      } else {
        // Passo 2: Definir Nova Senha
        if (recoveryData.newPassword !== recoveryData.confirmNewPassword) {
          alert("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }
        if (!userToRecover) return;
        
        // Atualizar utilizador
        const updatedUser = { ...userToRecover, password: recoveryData.newPassword };
        await onRegister(updatedUser); 
        
        alert("Senha redefinida com sucesso! Por favor, faça login com a nova senha.");
        resetForm();
        setViewMode('LOGIN');
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao processar o pedido. Tente novamente.");
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
  
  const eyeIcon = (visible: boolean) => (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {visible ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      )}
      {!visible && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
    </svg>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="bg-gray-900 rounded-[2.5rem] w-full max-w-lg p-10 relative shadow-2xl border border-gray-800 overflow-y-auto max-h-[95vh]">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-white tracking-tight">
            {viewMode === 'REGISTER' ? 'Criar Conta' : (viewMode === 'RECOVERY' ? 'Recuperar Senha' : 'Aceder')}
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

        {/* Abas de Navegação (Escondidas no Modo Recuperação) */}
        {viewMode !== 'RECOVERY' && (
          <div className="flex bg-gray-950 p-1.5 rounded-2xl mb-6 border border-gray-800">
            <button type="button" onClick={() => setViewMode('LOGIN')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'LOGIN' ? 'bg-gray-800 shadow-md text-blue-400' : 'text-gray-500'}`}>Login</button>
            <button type="button" onClick={() => setViewMode('REGISTER')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'REGISTER' ? 'bg-gray-800 shadow-md text-blue-400' : 'text-gray-500'}`}>Registo</button>
          </div>
        )}

        {/* --- FORMULÁRIO DE LOGIN / REGISTO --- */}
        {viewMode !== 'RECOVERY' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {viewMode === 'REGISTER' && (
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

            {/* Campos Específicos do Motorista */}
            {viewMode === 'REGISTER' && role === UserRole.DRIVER && (
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

            {/* Campo de Senha com Ícone de Olho */}
            <div className="relative">
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                placeholder="Palavra-passe" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                className={`${inputClass} pr-12`} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {eyeIcon(showPassword)}
              </button>
            </div>

            {/* Campo de Confirmar Senha (Apenas Registo) */}
            {viewMode === 'REGISTER' && (
              <div className="relative animate-in fade-in duration-300">
                <input 
                  required 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirmar Palavra-passe" 
                  value={formData.confirmPassword} 
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                  className={`${inputClass} pr-12`} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {eyeIcon(showConfirmPassword)}
                </button>
              </div>
            )}

            {viewMode === 'LOGIN' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setViewMode('RECOVERY')}
                  className="text-xs font-bold text-blue-500 hover:text-blue-400 hover:underline"
                >
                  Esqueci a senha
                </button>
              </div>
            )}

            <button type="submit" disabled={isLocked || isLoading} className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl mt-6 ${isLocked || isLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40'}`}>
              {isLoading ? 'A Processar...' : (viewMode === 'REGISTER' ? 'Confirmar Registo' : 'Entrar Agora')}
            </button>
          </form>
        )}

        {/* --- FLUXO DE RECUPERAÇÃO DE SENHA --- */}
        {viewMode === 'RECOVERY' && (
          <form onSubmit={handleRecoverySubmit} className="space-y-6 animate-in slide-in-from-right-4">
             <div className="bg-gray-950 p-6 rounded-[2rem] border border-gray-800 text-center">
                <p className="text-gray-400 text-sm mb-2">
                  {recoveryStep === 1 ? 'Confirme a sua identidade para continuar.' : 'Defina a sua nova palavra-passe.'}
                </p>
                <div className="flex justify-center gap-2 mt-4">
                   <div className={`h-2 w-2 rounded-full transition-all ${recoveryStep >= 1 ? 'bg-blue-500 scale-125' : 'bg-gray-700'}`}></div>
                   <div className={`h-2 w-2 rounded-full transition-all ${recoveryStep >= 2 ? 'bg-blue-500 scale-125' : 'bg-gray-700'}`}></div>
                </div>
             </div>

             {/* PASSO 1: Email e Telefone */}
             {recoveryStep === 1 && (
               <div className="space-y-4 animate-in fade-in">
                 <input required type="email" placeholder="Email Registado" value={recoveryData.email} onChange={e => setRecoveryData({...recoveryData, email: e.target.value})} className={inputClass} />
                 <input required type="tel" placeholder="Telefone Registado" value={recoveryData.phone} onChange={e => setRecoveryData({...recoveryData, phone: e.target.value})} className={inputClass} />
               </div>
             )}

             {/* PASSO 2: Nova Senha */}
             {recoveryStep === 2 && (
               <div className="space-y-4 animate-in fade-in">
                 <div className="bg-green-900/20 p-4 rounded-xl border border-green-900/50 mb-4">
                    <p className="text-green-500 text-xs font-bold text-center">Identidade Verificada: {userToRecover?.name}</p>
                 </div>
                 <div className="relative">
                    <input required type={showPassword ? "text" : "password"} placeholder="Nova Senha" value={recoveryData.newPassword} onChange={e => setRecoveryData({...recoveryData, newPassword: e.target.value})} className={inputClass} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">{eyeIcon(showPassword)}</button>
                 </div>
                 <div className="relative">
                    <input required type={showConfirmPassword ? "text" : "password"} placeholder="Confirmar Nova Senha" value={recoveryData.confirmNewPassword} onChange={e => setRecoveryData({...recoveryData, confirmNewPassword: e.target.value})} className={inputClass} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">{eyeIcon(showConfirmPassword)}</button>
                 </div>
               </div>
             )}

             <div className="flex gap-4 pt-2">
               <button type="button" onClick={() => { setViewMode('LOGIN'); resetForm(); }} className="flex-1 py-4 bg-gray-950 border border-gray-800 text-gray-500 rounded-2xl font-black text-sm uppercase hover:bg-gray-900 transition-all">Cancelar</button>
               <button type="submit" disabled={isLoading} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase hover:bg-blue-500 shadow-lg transition-all disabled:opacity-50">
                 {isLoading ? 'A Processar...' : (recoveryStep === 1 ? 'Verificar' : 'Alterar Senha')}
               </button>
             </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;