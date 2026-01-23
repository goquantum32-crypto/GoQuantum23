import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { sanitizeInput, checkAdminCredentials } from '../utils/security';
import { auth } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

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

  const handleGoogleLogin = async () => {
    if (isLocked) return;
    setIsLoading(true);
    console.log("Iniciando processo de login Google...");

    try {
      // Cria uma nova instância do provedor para garantir estado limpo
      const provider = new GoogleAuthProvider();
      
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      console.log("Login Google realizado:", googleUser.email);

      // 1. Verifica se o usuário já existe na nossa base de dados (Realtime DB)
      const existingUser = users.find(u => u.email === googleUser.email);

      if (existingUser) {
        // Login direto se já existe
        onLogin(existingUser);
        setLoginAttempts(0);
      } else {
        // 2. Se não existe, cria um novo registo automático
        const newUser: User = {
          id: googleUser.uid, // Usa o UID do Firebase Auth
          name: googleUser.displayName || 'Utilizador Google',
          email: googleUser.email || '',
          phone: googleUser.phoneNumber || '', // Google nem sempre retorna telefone
          role: UserRole.PASSENGER, // Google Login padrão para Passageiro
          photoUrl: googleUser.photoURL || '',
          password: 'google-auth-secured', // Placeholder seguro
        };
        
        // Regista na base de dados (App.tsx vai salvar no Firebase)
        await onRegister(newUser);
      }
    } catch (error: any) {
      console.error("Erro detalhado Google:", error);
      
      let errorMsg = "Erro ao conectar com Google.";
      
      // Tratamento de erros comuns do Firebase Auth
      if (error.code === 'auth/popup-blocked') {
        errorMsg = "O seu navegador bloqueou o popup do Google. Por favor, permita popups para este site.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = "O login foi cancelado (janela fechada).";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMsg = "Operação cancelada.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = "O Login com Google não está ativado no Firebase Console. Contacte o administrador.";
      } else if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        errorMsg = `DOMÍNIO NÃO AUTORIZADO (${currentDomain}).\n\n1. Vá ao Firebase Console\n2. Menu Authentication > Settings > Authorized Domains\n3. Adicione este domínio: ${currentDomain}`;
      } else {
        errorMsg = error.message;
      }

      alert(errorMsg);
    } finally {
      setIsLoading(false);
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

          {/* GOOGLE SIGN IN BUTTON */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLocked || isLoading}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer"
          >
            {isLoading ? (
               <span className="animate-pulse">A Conectar...</span>
            ) : (
               <>
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
                 Entrar com Google
               </>
            )}
          </button>

          <div className="flex items-center gap-4 py-2">
             <div className="h-px bg-gray-800 flex-1"></div>
             <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">OU EMAIL</span>
             <div className="h-px bg-gray-800 flex-1"></div>
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