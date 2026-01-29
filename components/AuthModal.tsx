
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
  // Step 1: Email, Step 2: Código, Step 3: Nova Senha
  const [recoveryStep, setRecoveryStep] = useState(1); 
  const [recoveryData, setRecoveryData] = useState({ email: '', newPassword: '', confirmNewPassword: '' });
  const [userToRecover, setUserToRecover] = useState<User | null>(null);
  
  // Lógica do Código de Verificação
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');

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
    setRecoveryData({ email: '', newPassword: '', confirmNewPassword: '' });
    setRecoveryStep(1);
    setUserToRecover(null);
    setGeneratedCode('');
    setInputCode('');
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
        // Passo 1: Enviar Código
        const email = sanitizeInput(recoveryData.email.trim());
        const user = users.find(u => u.email === email);

        if (user) {
          setUserToRecover(user);
          // Gerar código de 6 dígitos
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedCode(code);
          
          // SIMULAÇÃO DE ENVIO DE EMAIL
          setTimeout(() => {
            alert(`[SIMULAÇÃO DE EMAIL]\n\nOlá ${user.name},\nO seu código de verificação GoQuantum é: ${code}\n\n(Copie este código para continuar)`);
            setRecoveryStep(2);
            setIsLoading(false);
          }, 1500); // Pequeno delay para parecer real
          
        } else {
          alert("Não encontramos uma conta com este Email.");
          setIsLoading(false);
        }
      } else if (recoveryStep === 2) {
        // Passo 2: Verificar Código
        if (inputCode === generatedCode) {
          setRecoveryStep(3);
        } else {
          alert("Código incorreto. Por favor verifique o seu email novamente.");
        }
        setIsLoading(false);
      } else {
        // Passo 3: Redefinir Senha
        if (recoveryData.newPassword !== recoveryData.confirmNewPassword) {
          alert("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }
        if (!userToRecover) return;
        
        // Simular atualização
        const updatedUser = { ...userToRecover, password: recoveryData.newPassword };
        await onRegister(updatedUser); 
        
        alert("Senha redefinida com sucesso! Por favor, faça login.");
        resetForm();
        setViewMode('LOGIN');
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao processar pedido.");
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
