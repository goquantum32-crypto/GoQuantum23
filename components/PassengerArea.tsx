
import React, { useState, useMemo, useEffect } from 'react';
import { User, TripRequest, PackageRequest, PackageSize } from '../types';
import { MOZ_ROUTES, calculatePrice } from '../constants';

interface PassengerAreaProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onSubmitTrip: (trip: TripRequest) => void;
  onUpdateTrip: (trip: TripRequest) => void;
  onSubmitPackage: (pkg: PackageRequest) => void;
  onUpdatePackage: (pkg: PackageRequest) => void;
  trips: TripRequest[];
  packages: PackageRequest[];
  users: User[];
}

// Configuração das etiquetas de feedback (Estilo Yango)
const FEEDBACK_TAGS = {
  POSITIVE_TRIP: ["Condução Segura", "Viatura Limpa", "Boa Música", "Pontualidade", "Simpatia", "Ar Condicionado"],
  NEGATIVE_TRIP: ["Condução Perigosa", "Viatura Suja", "Atraso", "Motorista Rude", "Barulho", "Sem Cinto"],
  POSITIVE_PKG: ["Entrega Rápida", "Cuidado com a Carga", "Boa Comunicação", "Preço Justo"],
  NEGATIVE_PKG: ["Carga Danificada", "Atraso na Entrega", "Difícil Contacto", "Valor Alto"]
};

const PassengerArea: React.FC<PassengerAreaProps> = ({ 
  user, onUpdateUser, onSubmitTrip, onUpdateTrip, onSubmitPackage, onUpdatePackage, trips, packages, users 
}) => {
  const [activeTab, setActiveTab] = useState<'RESERVE' | 'PACKAGES' | 'PROFILE'>('RESERVE');
  
  // State para o Perfil (Edição)
  const [profileForm, setProfileForm] = useState(user);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });

  // Sincronizar formulário se o utilizador atualizar externamente
  useEffect(() => {
    setProfileForm(user);
  }, [user]);

  // State do Feedback
  const [feedbackTarget, setFeedbackTarget] = useState<{id: string, type: 'TRIP' | 'PACKAGE'} | null>(null);
  const [feedbackData, setFeedbackData] = useState<{rating: number, comment: string, tags: string[]}>({ 
    rating: 5, comment: '', tags: [] 
  });

  const [tripForm, setTripForm] = useState({ 
    origin: '', destination: '', date: '', time: '', seats: 1, paymentMethod: 'MPESA' as 'MPESA' | 'EMOLA' 
  });

  const [pkgForm, setPkgForm] = useState({ 
    origin: '', destination: '', size: 'SMALL' as PackageSize, type: '', description: '',
    recipientName: '', recipientPhone: ''
  });

  const currentTripPrice = useMemo(() => {
    if (!tripForm.origin || !tripForm.destination) return 0;
    const base = calculatePrice(tripForm.origin, tripForm.destination);
    return base ? base * tripForm.seats : 0;
  }, [tripForm.origin, tripForm.destination, tripForm.seats]);

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripForm.time) {
      alert('Por favor, selecione um horário de partida.');
      return;
    }
    const newTrip: TripRequest = {
      id: 'GQ-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      passengerId: user.id,
      passengerName: user.name,
      passengerPhone: user.phone,
      ...tripForm,
      price: currentTripPrice,
      status: 'PENDING',
      paymentConfirmed: false
    };
    onSubmitTrip(newTrip);
    alert('Viagem solicitada com sucesso! Siga as instruções de pagamento abaixo.');
  };

  const toggleTag = (tag: string) => {
    setFeedbackData(prev => {
      if (prev.tags.includes(tag)) {
        return { ...prev, tags: prev.tags.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...prev.tags, tag] };
      }
    });
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackTarget) return;

    if (feedbackTarget.type === 'TRIP') {
      const trip = trips.find(t => t.id === feedbackTarget.id);
      if (trip) {
        onUpdateTrip({ ...trip, feedback: feedbackData });
      }
    } else {
      const pkg = packages.find(p => p.id === feedbackTarget.id);
      if (pkg) {
        onUpdatePackage({ ...pkg, feedback: feedbackData });
      }
    }

    setFeedbackTarget(null);
    setFeedbackData({ rating: 5, comment: '', tags: [] });
    alert('Obrigado pelo seu feedback! Isso ajuda o Admin a manter a qualidade.');
  };

  const handleCancelTrip = (trip: TripRequest) => {
     if (window.confirm("Tem a certeza que deseja cancelar esta viagem? O reembolso estará sujeito às políticas da empresa.")) {
        onUpdateTrip({ ...trip, status: 'CANCELLED' });
     }
  };

  const handlePostponeTrip = (trip: TripRequest) => {
     if (window.confirm("Deseja adiar a viagem? O estado mudará para 'ADIADO' e o suporte entrará em contacto.")) {
        onUpdateTrip({ ...trip, status: 'POSTPONED' });
     }
  };

  // Upload de Foto de Perfil
  const handleProfilePhotoUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem é demasiado grande. Máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(profileForm);
    alert('Perfil atualizado com sucesso!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      alert('As novas senhas não coincidem.');
      return;
    }
    if (passwordData.oldPassword !== user.password) {
      alert('A senha antiga está incorreta.');
      return;
    }
    onUpdateUser({ ...profileForm, password: passwordData.newPassword });
    setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    alert('Senha alterada com sucesso!');
  };

  const inputClass = "w-full p-4 rounded-2xl bg-gray-950 border border-gray-800 text-white font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm";

  // Determinar quais tags mostrar baseado no rating e tipo
  const currentTags = useMemo(() => {
    if (!feedbackTarget) return [];
    const isPositive = feedbackData.rating >= 4;
    if (feedbackTarget.type === 'TRIP') {
      return isPositive ? FEEDBACK_TAGS.POSITIVE_TRIP : FEEDBACK_TAGS.NEGATIVE_TRIP;
    } else {
      return isPositive ? FEEDBACK_TAGS.POSITIVE_PKG : FEEDBACK_TAGS.NEGATIVE_PKG;
    }
  }, [feedbackTarget, feedbackData.rating]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24">
      {/* Header */}
      <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center space-x-6">
           <img src={user.photoUrl || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-2xl object-cover border border-gray-700" />
           <div>
             <h2 className="text-2xl font-black text-white">{user.name}</h2>
             <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Painel do Passageiro</p>
           </div>
        </div>
        <div className="flex bg-gray-950 p-1.5 rounded-2xl border border-gray-800">
           <button onClick={() => setActiveTab('RESERVE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'RESERVE' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Minhas Viagens</button>
           <button onClick={() => setActiveTab('PACKAGES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'PACKAGES' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Encomendas</button>
           <button onClick={() => setActiveTab('PROFILE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'PROFILE' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Meu Perfil</button>
        </div>
      </div>

      {activeTab === 'RESERVE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-4">
          <div className="lg:col-span-7 space-y-8">
            {/* Form de Reserva */}
            <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 shadow-xl">
              <h3 className="text-2xl font-black text-white mb-8">Nova Reserva</h3>
              <form onSubmit={handleTripSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <select required value={tripForm.origin} onChange={e => setTripForm({...tripForm, origin: e.target.value})} className={inputClass}>
                    <option value="">Origem</option>
                    {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select required value={tripForm.destination} onChange={e => setTripForm({...tripForm, destination: e.target.value})} className={inputClass}>
                    <option value="">Destino</option>
                    {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                     <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block tracking-widest">Data</label>
                     <input required type="date" value={tripForm.date} onChange={e => setTripForm({...tripForm, date: e.target.value})} className={inputClass} />
                  </div>
                  <div className="col-span-1">
                     <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block tracking-widest">Horário</label>
                     <input required type="time" value={tripForm.time} onChange={e => setTripForm({...tripForm, time: e.target.value})} className={inputClass} />
                  </div>
                  <div className="col-span-1">
                     <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block tracking-widest">Lugares</label>
                     <input required type="number" min="1" value={tripForm.seats} onChange={e => setTripForm({...tripForm, seats: parseInt(e.target.value)})} className={inputClass} placeholder="Lugares" />
                  </div>
                </div>
                
                <div className="bg-gray-950 p-6 rounded-3xl border border-gray-800">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-4 text-center tracking-widest">Escolha o Método de Pagamento</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setTripForm({...tripForm, paymentMethod: 'MPESA'})} className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center ${tripForm.paymentMethod === 'MPESA' ? 'border-red-600 bg-red-900/10' : 'border-gray-800'}`}>
                      <span className="text-red-500 font-black text-lg">M-PESA</span>
                      <span className="text-[10px] text-gray-500 mt-1 font-bold">844567470</span>
                    </button>
                    <button type="button" onClick={() => setTripForm({...tripForm, paymentMethod: 'EMOLA'})} className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center ${tripForm.paymentMethod === 'EMOLA' ? 'border-orange-600 bg-orange-900/10' : 'border-gray-800'}`}>
                      <span className="text-orange-500 font-black text-lg">e-MOLA</span>
                      <span className="text-[10px] text-gray-500 mt-1 font-bold">860675792</span>
                    </button>
                  </div>
                  <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-800 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Titular da Conta:</p>
                    <p className="text-sm font-black text-white mt-1 uppercase">Estevão Sitefane</p>
                  </div>
                </div>

                <button type="submit" disabled={!currentTripPrice} className="w-full bg-blue-600 py-5 rounded-2xl text-white font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all">
                  Confirmar Reserva ({currentTripPrice} MZN)
                </button>
              </form>
            </div>

            {/* Listagem de Viagens / Recibos */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white px-2">Meus Bilhetes Digitais</h3>
              {trips.length === 0 && <p className="text-gray-600 italic px-2 py-10 text-center bg-gray-900 rounded-[2rem] border border-gray-800 border-dashed">Ainda não solicitou nenhuma viagem.</p>}
              {trips.map(t => {
                const driver = users.find(u => u.id === t.driverId);
                const canManageTrip = ['ASSIGNED', 'PAID'].includes(t.status);

                return (
                  <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-6 flex justify-between items-center ${t.status === 'PAID' ? 'bg-green-600/10 border-b border-green-900/30' : 'bg-gray-950 border-b border-gray-800'}`}>
                       <div>
                         <span className="text-[10px] font-black text-blue-500 bg-blue-900/20 px-2 py-0.5 rounded mb-2 inline-block">COD: {t.id}</span>
                         <h4 className="text-xl font-black text-white">{t.origin} ➜ {t.destination}</h4>
                         <p className="text-xs text-gray-500 font-bold">{t.date} às <span className="text-blue-400">{t.time || 'N/A'}</span> • {t.seats} Lugares</p>
                       </div>
                       <div className="text-right">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${t.status === 'COMPLETED' ? 'bg-gray-800 text-gray-500 border-gray-700' : (t.status === 'CANCELLED' ? 'bg-red-900/20 text-red-500 border-red-900' : 'bg-blue-900/20 text-blue-400 border-blue-800 animate-pulse')}`}>{t.status === 'POSTPONED' ? 'ADIADO' : t.status}</span>
                       </div>
                    </div>

                    {t.status === 'PENDING' && (
                      <div className="p-8 bg-blue-900/10 border-t border-blue-900/20 text-center space-y-4">
                         <div className="bg-blue-900/20 p-4 rounded-2xl inline-block mb-2">
                           <p className="text-blue-400 font-black text-sm">📲 TIRE SCREENSHOT DO PAGAMENTO!</p>
                         </div>
                         <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">Envie o comprovativo para o WhatsApp do Admin indicando o código <b>{t.id}</b> para validação rápida.</p>
                         <a href={`https://wa.me/258844567470?text=Olá, aqui está o meu comprovativo de reserva ID: ${t.id}. Nome: ${t.passengerName}`} target="_blank" className="inline-block bg-green-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg shadow-green-900/20">Enviar via WhatsApp</a>
                      </div>
                    )}

                    {driver && t.status !== 'CANCELLED' && t.status !== 'POSTPONED' && (
                      <div className="p-8 space-y-8 animate-in fade-in duration-700">
                        {/* O Bilhete / Recibo Digital */}
                        <div className="bg-gray-950 p-8 rounded-[2.5rem] border-2 border-dashed border-gray-800 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-5">
                              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M15 5l-1.41 1.41L18.17 11H2v2h16.17l-4.58 4.59L15 19l7-7-7-7z"/></svg>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                              <div className="space-y-6">
                                 <div>
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Passageiro</p>
                                    <p className="text-lg font-black text-white">{t.passengerName}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Motorista GoQuantum</p>
                                    <p className="text-lg font-black text-white">{driver.name}</p>
                                    <div className="flex space-x-4 mt-3">
                                       <a href={`tel:${driver.phone}`} className="bg-blue-600/10 text-blue-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Ligar</a>
                                       <a href={`https://wa.me/258${driver.phone}`} className="bg-green-600/10 text-green-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all">WhatsApp</a>
                                    </div>
                                 </div>
                              </div>
                              <div className="space-y-6 md:text-right">
                                 <div>
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Viatura</p>
                                    <p className="text-lg font-black text-white">{driver.vehicleModel} - {driver.vehicleColor}</p>
                                    <p className="text-sm text-gray-400 font-black">{driver.vehicleNumber}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Partida</p>
                                    <p className="text-2xl font-black text-blue-400">{t.time}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Área de Feedback */}
                        {t.status === 'COMPLETED' && !t.feedback && (
                           <div className="text-center bg-gray-900 p-6 rounded-3xl border border-gray-800">
                              <p className="text-sm font-bold text-white mb-4">Como foi a sua viagem?</p>
                              <button onClick={() => setFeedbackTarget({id: t.id, type: 'TRIP'})} className="bg-white text-gray-900 px-6 py-2 rounded-xl font-black text-xs uppercase hover:bg-gray-200">Avaliar Motorista</button>
                           </div>
                        )}
                        
                        {/* Ações de Cancelamento */}
                        {['ASSIGNED', 'PAID'].includes(t.status) && (
                           <div className="flex justify-center gap-4">
                              <button onClick={() => handlePostponeTrip(t)} className="text-orange-500 text-[10px] font-black uppercase hover:underline">Adiar Viagem</button>
                              <button onClick={() => handleCancelTrip(t)} className="text-red-500 text-[10px] font-black uppercase hover:underline">Cancelar Viagem</button>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
             <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-xl sticky top-24">
                <h4 className="text-xl font-black text-white mb-6">Informações Úteis</h4>
                <div className="space-y-4">
                   <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800">
                      <p className="text-blue-500 font-black text-xs uppercase mb-1">Pagamentos</p>
                      <p className="text-gray-400 text-xs">Os pagamentos devem ser feitos via M-PESA ou e-MOLA imediatamente após a reserva para garantir o seu lugar.</p>
                   </div>
                   <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800">
                      <p className="text-green-500 font-black text-xs uppercase mb-1">Bagagem</p>
                      <p className="text-gray-400 text-xs">Cada passageiro tem direito a uma mala média. Cargas extra devem ser registadas como "Encomendas".</p>
                   </div>
                   <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800">
                      <p className="text-orange-500 font-black text-xs uppercase mb-1">Pontualidade</p>
                      <p className="text-gray-400 text-xs">Esteja no local de embarque 15 minutos antes da hora marcada. Os motoristas não aguardam mais de 10 min.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'PACKAGES' && (
        <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 animate-in slide-in-from-bottom-4">
           <h3 className="text-2xl font-black text-white mb-8">Enviar Encomenda</h3>
           
           <form onSubmit={(e) => {
             e.preventDefault();
             onSubmitPackage({
               id: 'PKG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
               passengerId: user.id,
               senderName: user.name,
               senderPhone: user.phone,
               ...pkgForm,
               price: 0, 
               status: 'REQUESTED'
             });
             alert('Pedido de cotação enviado! Aguarde a resposta do Admin.');
           }} className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <select required value={pkgForm.origin} onChange={e => setPkgForm({...pkgForm, origin: e.target.value})} className={inputClass}>
                  <option value="">Origem</option>
                  {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select required value={pkgForm.destination} onChange={e => setPkgForm({...pkgForm, destination: e.target.value})} className={inputClass}>
                  <option value="">Destino</option>
                  {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="Nome do Destinatário" value={pkgForm.recipientName} onChange={e => setPkgForm({...pkgForm, recipientName: e.target.value})} className={inputClass} />
                <input required type="tel" placeholder="Telefone do Destinatário" value={pkgForm.recipientPhone} onChange={e => setPkgForm({...pkgForm, recipientPhone: e.target.value})} className={inputClass} />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <select required value={pkgForm.size} onChange={e => setPkgForm({...pkgForm, size: e.target.value as PackageSize})} className={inputClass}>
                   <option value="SMALL">Pequena (ex: Envelope)</option>
                   <option value="MEDIUM">Média (ex: Caixa Sapatos)</option>
                   <option value="LARGE">Grande (ex: Mala)</option>
                </select>
                <input required type="text" placeholder="Tipo (ex: Eletrónicos, Roupa)" value={pkgForm.type} onChange={e => setPkgForm({...pkgForm, type: e.target.value})} className={inputClass} />
             </div>

             <textarea required placeholder="Descrição detalhada da carga..." value={pkgForm.description} onChange={e => setPkgForm({...pkgForm, description: e.target.value})} className={`${inputClass} h-32 resize-none`} />

             <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl text-white font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all">Solicitar Cotação</button>
           </form>

           <div className="mt-12 space-y-6">
             <h4 className="text-xl font-black text-white">Minhas Encomendas</h4>
             {packages.map(p => (
               <div key={p.id} className="bg-gray-950 p-6 rounded-[2rem] border border-gray-800">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <span className="text-[10px] font-black text-blue-500 bg-blue-900/20 px-2 py-0.5 rounded uppercase">REF: {p.id}</span>
                        <h5 className="text-white font-bold mt-1">{p.origin} ➜ {p.destination}</h5>
                     </div>
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${p.status === 'REQUESTED' ? 'bg-yellow-900/20 text-yellow-500' : (p.status === 'QUOTED' ? 'bg-blue-900/20 text-blue-400' : 'bg-green-900/20 text-green-500')}`}>{p.status}</span>
                  </div>
                  
                  {p.status === 'QUOTED' && (
                     <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl text-center">
                        <p className="text-gray-400 text-xs mb-1">Cotação Recebida:</p>
                        <p className="text-2xl font-black text-white">{p.price} MZN</p>
                        <p className="text-[10px] text-gray-500 mb-3">Motorista disponível para transporte</p>
                        <button 
                           onClick={() => onUpdatePackage({ ...p, status: 'PAYMENT_PENDING' })}
                           className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase hover:bg-blue-500 w-full"
                        >
                           Aceitar & Pagar
                        </button>
                     </div>
                  )}

                  {p.status === 'PAYMENT_PENDING' && (
                     <div className="text-center mt-4">
                        <p className="text-xs text-yellow-500 font-bold animate-pulse">Aguardando Pagamento ({p.price} MZN)</p>
                        <p className="text-[10px] text-gray-600">Envie o comprovativo para o Admin.</p>
                     </div>
                  )}
               </div>
             ))}
             {packages.length === 0 && <p className="text-gray-600 italic text-center">Sem registos.</p>}
           </div>
        </div>
      )}

      {activeTab === 'PROFILE' && (
         <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 animate-in slide-in-from-bottom-4 space-y-8">
            <h3 className="text-2xl font-black text-white">Editar Perfil</h3>
            <form onSubmit={handleSaveProfile} className="space-y-6">
               <div className="flex justify-center mb-6">
                  <div className="relative group w-32 h-32">
                     <img src={profileForm.photoUrl || 'https://via.placeholder.com/150'} className="w-full h-full rounded-full object-cover border-4 border-gray-800 group-hover:border-blue-500 transition-all" />
                     <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                        <span className="text-xs font-bold text-white">Alterar</span>
                        <input type="file" accept="image/*" onChange={handleProfilePhotoUpdate} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Nome</label>
                     <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Telefone</label>
                     <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className={inputClass} />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Email</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className={inputClass} />
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20">Guardar Alterações</button>
            </form>

            {/* Secção de Segurança (Troca de Senha) - ADICIONADA */}
            <div className="bg-gray-950 p-8 rounded-[2.5rem] border border-gray-800 mt-8">
               <h4 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                 <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                 Segurança
               </h4>
               <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Senha Atual</label>
                     <input type="password" value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} className={inputClass} placeholder="Digite a sua senha atual" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Nova Senha</label>
                        <input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className={inputClass} placeholder="Nova senha" required />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Confirmar Nova Senha</label>
                        <input type="password" value={passwordData.confirmNewPassword} onChange={e => setPasswordData({...passwordData, confirmNewPassword: e.target.value})} className={inputClass} placeholder="Repita a nova senha" required />
                     </div>
                  </div>
                  <button type="submit" className="px-8 py-4 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl font-black text-xs uppercase hover:bg-gray-800 hover:text-white transition-all">Alterar Senha</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default PassengerArea;
