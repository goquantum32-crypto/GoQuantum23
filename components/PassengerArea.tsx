
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
    origin: '', destination: '', date: '', seats: 1, paymentMethod: 'MPESA' as 'MPESA' | 'EMOLA' 
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

  const inputClass = "w-full p-4 rounded-2xl bg-gray-950 border border-gray-800 text-white font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all";

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
                <div className="grid grid-cols-2 gap-4">
                  <input required type="date" value={tripForm.date} onChange={e => setTripForm({...tripForm, date: e.target.value})} className={inputClass} />
                  <input required type="number" min="1" value={tripForm.seats} onChange={e => setTripForm({...tripForm, seats: parseInt(e.target.value)})} className={inputClass} placeholder="Lugares" />
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
                         <p className="text-xs text-gray-500 font-bold">{t.date} • {t.seats} Lugares</p>
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
                              <div className="space-y-6">
                                 <div>
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Viatura Detalhes</p>
                                    <p className="text-lg font-black text-white">{driver.vehicleModel}</p>
                                    <p className="text-sm font-bold text-blue-400 mt-1">{driver.vehicleColor} • {driver.vehicleNumber}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Trajeto</p>
                                    <p className="text-lg font-black text-white">{t.origin} ➜ <span className="text-blue-500">{t.destination}</span></p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Botões de Ação da Viagem */}
                        <div className="flex flex-col gap-4">
                           {/* 1. Botões de Gestão (Adiar/Cancelar) - Apenas antes de iniciar */}
                           {canManageTrip && (
                              <div className="flex gap-4">
                                 <button onClick={() => handlePostponeTrip(t)} className="flex-1 bg-gray-950 border border-gray-800 text-yellow-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all">Adiar Viagem</button>
                                 <button onClick={() => handleCancelTrip(t)} className="flex-1 bg-red-900/10 text-red-500 border border-red-900/20 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/20 transition-all">Cancelar</button>
                              </div>
                           )}

                           {/* 2. Botão Principal de Fluxo (Iniciar -> Terminar) */}
                           {t.status === 'PAID' || t.status === 'ASSIGNED' ? (
                              <button onClick={() => onUpdateTrip({...t, status: 'IN_PROGRESS'})} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all">
                                 Iniciar Minha Viagem
                              </button>
                           ) : t.status === 'IN_PROGRESS' ? (
                              <button onClick={() => { onUpdateTrip({...t, status: 'COMPLETED'}); setFeedbackTarget({id: t.id, type: 'TRIP'}); }} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/20 hover:scale-[1.02] transition-all animate-pulse">
                                 Terminar Viagem (Cheguei!)
                              </button>
                           ) : null}
                        </div>
                      </div>
                    )}

                    {(t.status === 'CANCELLED' || t.status === 'POSTPONED') && (
                       <div className="p-8 text-center">
                          <p className="text-gray-500 text-sm">Esta viagem foi {t.status === 'CANCELLED' ? 'cancelada' : 'adiada'}. Contacte o suporte se precisar de ajuda.</p>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
             <div className="sticky top-24 bg-gray-900 p-8 rounded-[3rem] border border-gray-800 shadow-xl space-y-8">
                <h4 className="text-xl font-black text-white border-b border-gray-800 pb-4">Central de Apoio</h4>
                <div className="space-y-6">
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Contas de Depósito</p>
                      <div className="bg-gray-950 p-6 rounded-3xl border border-gray-800 space-y-4">
                         <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                            <span className="text-xs font-bold text-gray-400">M-Pesa:</span>
                            <span className="text-sm font-black text-white">844567470</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">e-Mola:</span>
                            <span className="text-sm font-black text-white">860675792</span>
                         </div>
                         <p className="text-[9px] text-gray-600 text-center font-black uppercase mt-2">Titular: Estevão Sitefane</p>
                      </div>
                   </div>

                   <div className="bg-gray-950 p-6 rounded-3xl border border-gray-800">
                      <p className="text-xs font-bold text-gray-400 mb-2">Validação de Pagamento</p>
                      <p className="text-[10px] text-gray-600 leading-relaxed italic">O sistema GoQuantum valida os pagamentos em até 30 minutos após o envio do comprovativo. Fique atento às notificações!</p>
                   </div>
                   
                   <a href="tel:844567470" className="flex items-center justify-between p-6 bg-blue-600 text-white rounded-[2.5rem] font-black group hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20">
                      <div>
                         <p className="text-[8px] opacity-70 uppercase tracking-widest">Dúvidas?</p>
                         <span className="text-sm uppercase">Fale com o Admin</span>
                      </div>
                      <span className="text-xl">📞</span>
                   </a>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'PACKAGES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4">
           <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 shadow-xl">
              <h3 className="text-2xl font-black text-white mb-8">Novo Pedido de Encomenda</h3>
              <form onSubmit={(e) => { e.preventDefault(); onSubmitPackage({id: 'PKG-'+Math.random().toString(36).substr(2,6).toUpperCase(), passengerId: user.id, senderName: user.name, senderPhone: user.phone, ...pkgForm, price: 0, status: 'REQUESTED'}); alert('Pedido de carga enviado com sucesso! O Admin entrará em contato com a cotação.'); }} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                   <input required placeholder="Nome do Destinatário" value={pkgForm.recipientName} onChange={e => setPkgForm({...pkgForm, recipientName: e.target.value})} className={inputClass} />
                   <input required type="tel" placeholder="Telefone (+258)" value={pkgForm.recipientPhone} onChange={e => setPkgForm({...pkgForm, recipientPhone: e.target.value})} className={inputClass} />
                 </div>
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
                 <textarea required placeholder="Descreva os itens da carga (peso estimado, tipo de mercadoria...)" value={pkgForm.description} onChange={e => setPkgForm({...pkgForm, description: e.target.value})} className={inputClass + " h-32"} />
                 <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-500 transition-all shadow-xl shadow-green-900/20">Solicitar Cotação de Carga</button>
              </form>
           </div>

           <div className="space-y-6">
              <h3 className="text-2xl font-black text-white px-2">Cargas em Logística</h3>
              {packages.length === 0 && <p className="text-gray-600 italic py-20 text-center bg-gray-900 rounded-[2.5rem] border border-gray-800 border-dashed">Sem encomendas registadas.</p>}
              {packages.map(p => {
                const driver = users.find(u => u.id === p.driverId);
                return (
                  <div key={p.id} className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 space-y-6">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-white font-black text-lg">{p.origin} ➜ {p.destination}</p>
                          <p className="text-xs text-gray-500 font-bold">Recetor: {p.recipientName}</p>
                       </div>
                       <span className="text-[10px] font-black text-blue-500 uppercase bg-blue-900/20 px-3 py-1 rounded-lg">{p.status === 'PAYMENT_PENDING' ? 'A VALIDAR' : p.status}</span>
                    </div>

                    {p.status === 'QUOTED' && (
                      <div className="bg-blue-900/10 p-6 rounded-3xl border border-blue-800/30 text-center space-y-4">
                        <p className="text-white font-black text-xl">Preço: {p.price.toLocaleString()} MZN</p>
                        <div className="flex gap-4">
                           <button onClick={() => onUpdatePackage({...p, status: 'PAYMENT_PENDING'})} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg">Aceitar & Pagar</button>
                           <button onClick={() => onUpdatePackage({...p, status: 'REJECTED'})} className="flex-1 bg-red-900/20 text-red-500 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-900/30 transition-all border border-red-900/30">Recusar</button>
                        </div>
                      </div>
                    )}

                    {p.status === 'PAYMENT_PENDING' && (
                      <div className="p-8 bg-blue-900/10 border-t border-blue-900/20 text-center space-y-4 rounded-3xl">
                         <div className="bg-blue-900/20 p-4 rounded-2xl inline-block mb-2">
                           <p className="text-blue-400 font-black text-sm">📲 TIRE SCREENSHOT DO PAGAMENTO!</p>
                         </div>
                         <p className="text-white font-black text-lg">Valor: {p.price.toLocaleString()} MZN</p>
                         <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">Envie o comprovativo para o WhatsApp do Admin indicando o código <b>{p.id}</b> para libertar a carga.</p>
                         <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 my-2">
                            <span>M-PESA: 844567470</span>
                            <span>e-MOLA: 860675792</span>
                         </div>
                         <a href={`https://wa.me/258844567470?text=Olá, aqui está o comprovativo da encomenda ID: ${p.id}. Valor: ${p.price} MZN`} target="_blank" className="inline-block bg-green-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg shadow-green-900/20">Enviar via WhatsApp</a>
                      </div>
                    )}

                    {p.status === 'PAID' && driver && (
                      <div className="bg-gray-950 p-6 rounded-3xl border border-gray-800 space-y-4 shadow-inner">
                         <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Viatura em Transporte</p>
                         <div className="flex justify-between items-center">
                            <p className="text-white font-bold">{driver.name}</p>
                            <a href={`tel:${driver.phone}`} className="text-blue-500 font-black underline text-xs">Ligar</a>
                         </div>
                         <p className="text-[11px] text-gray-400 font-medium">{driver.vehicleModel} • {driver.vehicleColor} • {driver.vehicleNumber}</p>
                         
                         <button onClick={() => onUpdatePackage({...p, status: 'IN_TRANSIT'})} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg mt-4">Entregar Carga ao Motorista</button>
                      </div>
                    )}

                    {p.status === 'IN_TRANSIT' && (
                       <div className="bg-blue-900/10 p-6 rounded-3xl border border-blue-800/30 space-y-4">
                          <p className="text-blue-400 text-center font-black text-sm uppercase animate-pulse">Carga em Movimento</p>
                          <button onClick={() => { onUpdatePackage({...p, status: 'DELIVERED'}); setFeedbackTarget({id: p.id, type: 'PACKAGE'}); }} className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg">Confirmar Receção no Destino</button>
                       </div>
                    )}

                    {p.status === 'DELIVERED' && (
                       <div className="bg-gray-950 p-6 rounded-3xl border border-gray-800 text-center">
                          <p className="text-green-500 font-black text-sm uppercase mb-2">Entregue com Sucesso</p>
                          {p.feedback ? (
                             <div className="space-y-2">
                                <div className="text-yellow-500 text-xl">{'★'.repeat(p.feedback.rating)}</div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {p.feedback.tags?.map(t => (
                                        <span key={t} className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-[9px] text-gray-400">{t}</span>
                                    ))}
                                </div>
                             </div>
                          ) : (
                             <button onClick={() => setFeedbackTarget({id: p.id, type: 'PACKAGE'})} className="text-xs text-gray-500 underline font-bold hover:text-white">Deixar Avaliação</button>
                          )}
                       </div>
                    )}
                  </div>
                )
              })}
           </div>
        </div>
      )}

      {/* --- ABA DE PERFIL (ADICIONADA) --- */}
      {activeTab === 'PROFILE' && (
        <div className="max-w-2xl mx-auto bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 shadow-xl space-y-8 animate-in slide-in-from-bottom-4">
           <h3 className="text-2xl font-black text-white text-center">Meu Perfil</h3>
           
           <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                 <img src={profileForm.photoUrl || 'https://via.placeholder.com/150'} className="w-32 h-32 rounded-full object-cover border-4 border-gray-800 shadow-2xl" />
                 <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-500 transition-all shadow-lg group-hover:scale-110">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoUpdate} />
                 </label>
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Toque no ícone para alterar a foto</p>
           </div>

           <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Nome Completo</label>
                 <input 
                    type="text" 
                    value={profileForm.name} 
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                    className={inputClass} 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Telefone</label>
                 <input 
                    type="tel" 
                    value={profileForm.phone} 
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                    className={inputClass} 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Email</label>
                 <input 
                    type="email" 
                    value={profileForm.email} 
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                    className={inputClass} 
                 />
              </div>
              
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all">
                 Salvar Alterações
              </button>
           </form>
        </div>
      )}

      {/* Modal Feedback Estilo Yango */}
      {feedbackTarget && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-gray-900 p-8 rounded-[3rem] border border-gray-800 w-full max-w-lg text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-2xl font-black text-white">Avalie a Experiência</h3>
              <p className="text-gray-500 text-xs uppercase tracking-widest">O que achou do serviço?</p>
              
              {/* Estrelas */}
              <div className="flex justify-center space-x-3 py-4">
                 {[1,2,3,4,5].map(star => (
                   <button 
                     key={star} 
                     onClick={() => setFeedbackData({...feedbackData, rating: star, tags: []})} // Reset tags on rating change
                     className={`text-4xl transition-all duration-200 hover:scale-110 ${feedbackData.rating >= star ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'text-gray-800'}`}
                   >
                     ★
                   </button>
                 ))}
              </div>

              {/* Etiquetas Selecionáveis (Chips) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {currentTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all truncate ${feedbackData.tags.includes(tag) ? 'bg-white text-black border-white' : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-600'}`}
                    >
                        {tag}
                    </button>
                 ))}
              </div>

              <textarea 
                placeholder="Conte mais detalhes (opcional)..." 
                value={feedbackData.comment} 
                onChange={e => setFeedbackData({...feedbackData, comment: e.target.value})} 
                className={inputClass + " h-24 border-gray-800 placeholder:text-gray-700 font-medium text-xs"} 
              />
              
              <button onClick={handleFeedbackSubmit} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all">
                Enviar Avaliação
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default PassengerArea;
