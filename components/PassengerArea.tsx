
import React, { useState, useMemo } from 'react';
import { User, TripRequest, PackageRequest, PackageSize } from '../types';
import { MOZ_ROUTES, calculatePrice } from '../constants';

interface PassengerAreaProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onSubmitTrip: (trip: TripRequest) => void;
  onSubmitPackage: (pkg: PackageRequest) => void;
  trips: TripRequest[];
  packages: PackageRequest[];
  users: User[];
}

const PassengerArea: React.FC<PassengerAreaProps> = ({ user, onUpdateUser, onSubmitTrip, onSubmitPackage, trips, packages, users }) => {
  const [activeTab, setActiveTab] = useState<'RESERVE' | 'PACKAGES' | 'PROFILE'>('RESERVE');
  
  // Estados para Perfil
  const [profileData, setProfileData] = useState({ ...user });

  // Estados para Viagem
  const [tripForm, setTripForm] = useState({ 
    origin: '', 
    destination: '', 
    date: '', 
    seats: 1, 
    paymentMethod: 'MPESA' as 'MPESA' | 'EMOLA' 
  });

  // Estados para Encomendas
  const [pkgForm, setPkgForm] = useState({ 
    origin: '', 
    destination: '', 
    size: 'SMALL' as PackageSize, 
    type: '', 
    description: '' 
  });

  const currentTripPrice = useMemo(() => {
    if (!tripForm.origin || !tripForm.destination) return 0;
    const base = calculatePrice(tripForm.origin, tripForm.destination);
    return base ? base * tripForm.seats : 0;
  }, [tripForm.origin, tripForm.destination, tripForm.seats]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(profileData);
    alert('Perfil atualizado com sucesso!');
  };

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripForm.origin || !tripForm.destination || !tripForm.date) {
      alert('Por favor, preencha todos os campos da viagem.');
      return;
    }
    const newTrip: TripRequest = {
      id: 'T' + Math.random().toString(36).substr(2, 7).toUpperCase(),
      passengerId: user.id,
      passengerName: user.name,
      passengerPhone: user.phone,
      ...tripForm,
      price: currentTripPrice,
      status: 'PENDING',
      paymentConfirmed: false
    };
    onSubmitTrip(newTrip);
    alert(`Pedido enviado! Por favor, realize o pagamento via ${tripForm.paymentMethod === 'MPESA' ? 'M-Pesa' : 'e-Mola'} para Estevão Sitefane.`);
  };

  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgForm.origin || !pkgForm.destination || !pkgForm.type) {
        alert('Por favor, preencha os dados da encomenda.');
        return;
    }
    const newPkg: PackageRequest = {
      id: 'PKG' + Math.random().toString(36).substr(2, 7).toUpperCase(),
      passengerId: user.id,
      senderName: user.name,
      senderPhone: user.phone,
      ...pkgForm,
      price: 0,
      status: 'REQUESTED'
    };
    onSubmitPackage(newPkg);
    alert('Pedido de encomenda enviado! O Admin irá negociar o preço com um motorista e enviar-lhe-á a cotação.');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileData(prev => ({ ...prev, photoUrl: base64 }));
        // Se estiver na aba de perfil, podemos atualizar logo para dar feedback visual
      };
      reader.readAsDataURL(file);
    }
  };

  const inputClass = "w-full p-4 rounded-2xl bg-gray-950 border border-gray-800 text-white font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all";

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24">
      {/* Header com Navegação Interna */}
      <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center space-x-6">
           <div className="relative group cursor-pointer" onClick={() => setActiveTab('PROFILE')}>
             <img src={user.photoUrl || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-2xl object-cover border border-gray-700 transition-transform group-hover:scale-105" />
             <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[8px] font-black text-white uppercase">Editar</span>
             </div>
           </div>
           <div>
             <h2 className="text-2xl font-black text-white">Olá, {user.name}</h2>
             <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Painel do Passageiro</p>
           </div>
        </div>
        <div className="flex bg-gray-950 p-1.5 rounded-2xl border border-gray-800 overflow-x-auto">
           <button onClick={() => setActiveTab('RESERVE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'RESERVE' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Viagens</button>
           <button onClick={() => setActiveTab('PACKAGES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'PACKAGES' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Encomendas</button>
           <button onClick={() => setActiveTab('PROFILE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'PROFILE' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Meu Perfil</button>
        </div>
      </div>

      {activeTab === 'RESERVE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 shadow-xl">
              <h3 className="text-2xl font-black text-white mb-8">Reservar Viagem</h3>
              <form onSubmit={handleTripSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">De (Origem)</label>
                      <select value={tripForm.origin} onChange={e => setTripForm({...tripForm, origin: e.target.value})} className={inputClass}>
                        <option value="">Origem...</option>
                        {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Para (Destino)</label>
                      <select value={tripForm.destination} onChange={e => setTripForm({...tripForm, destination: e.target.value})} className={inputClass}>
                        <option value="">Destino...</option>
                        {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data da Viagem</label>
                      <input type="date" value={tripForm.date} onChange={e => setTripForm({...tripForm, date: e.target.value})} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Lugares</label>
                      <input type="number" min="1" value={tripForm.seats} onChange={e => setTripForm({...tripForm, seats: parseInt(e.target.value)})} className={inputClass} />
                    </div>
                 </div>
                 
                 {currentTripPrice > 0 && (
                   <div className="bg-blue-600/10 p-6 rounded-3xl border border-blue-900/30 flex justify-between items-center animate-in zoom-in-95 duration-300">
                      <span className="text-gray-400 font-black uppercase text-[10px]">Total a Pagar</span>
                      <span className="text-3xl font-black text-blue-400">{currentTripPrice.toLocaleString()} MZN</span>
                   </div>
                 )}

                 {/* Seção de Pagamento Restaurada */}
                 <div className="bg-gray-950 p-8 rounded-[2rem] border border-gray-800 space-y-6">
                    <h3 className="text-lg font-black text-white">Método de Pagamento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        type="button" 
                        onClick={() => setTripForm({...tripForm, paymentMethod: 'MPESA'})} 
                        className={`flex flex-col items-center p-6 rounded-3xl border-2 transition-all ${tripForm.paymentMethod === 'MPESA' ? 'border-red-600 bg-red-950/20 shadow-lg' : 'border-gray-800 bg-gray-900 hover:border-red-900'}`}
                      >
                        <span className="font-black text-red-500 text-xl">M-PESA</span>
                        <span className="text-sm font-black text-white mt-1">844567470</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setTripForm({...tripForm, paymentMethod: 'EMOLA'})} 
                        className={`flex flex-col items-center p-6 rounded-3xl border-2 transition-all ${tripForm.paymentMethod === 'EMOLA' ? 'border-orange-600 bg-orange-950/20 shadow-lg' : 'border-gray-800 bg-gray-900 hover:border-orange-900'}`}
                      >
                        <span className="font-black text-orange-500 text-xl">e-Mola</span>
                        <span className="text-sm font-black text-white mt-1">860675792</span>
                      </button>
                    </div>
                    <div className="bg-gray-900 p-5 rounded-2xl text-center border border-gray-800 shadow-inner">
                      <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Titular: Estevão Sitefane</p>
                      <p className="text-blue-400 font-bold text-[10px]">Após solicitar, o Admin validará o seu pagamento.</p>
                    </div>
                 </div>

                 <button type="submit" disabled={!currentTripPrice} className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-900/20 transition-all ${currentTripPrice > 0 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
                    Confirmar Reserva
                 </button>
              </form>
            </div>

            <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800">
              <h3 className="text-2xl font-black text-white mb-8">Minhas Viagens</h3>
              <div className="space-y-4">
                 {trips.length === 0 ? (
                   <p className="text-gray-600 italic text-center py-10">Nenhuma viagem solicitada.</p>
                 ) : (
                   trips.map(t => (
                    <div key={t.id} className="p-6 bg-gray-950 rounded-3xl border border-gray-800 flex justify-between items-center">
                       <div>
                         <p className="text-white font-black">{t.origin} ➜ {t.destination}</p>
                         <p className="text-xs text-gray-500">{t.date}</p>
                       </div>
                       <div className="text-right">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${t.paymentConfirmed ? 'bg-green-900/20 text-green-500 border-green-800' : 'bg-yellow-900/20 text-yellow-500 border-yellow-800'}`}>
                           {t.paymentConfirmed ? 'Paga & Confirmada' : 'Pendente de Validação'}
                         </span>
                       </div>
                    </div>
                   ))
                 )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800">
                <h4 className="text-lg font-black text-white mb-6">Suporte GoQuantum</h4>
                <div className="space-y-4">
                   <a href="tel:844567470" className="flex items-center space-x-4 p-4 bg-gray-950 rounded-2xl border border-gray-800 hover:border-blue-500 transition-all">
                      <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center text-lg">📞</div>
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chamadas</p>
                        <p className="text-sm font-bold text-white">844567470</p>
                      </div>
                   </a>
                   <a href="https://wa.me/258844567470" className="flex items-center space-x-4 p-4 bg-gray-950 rounded-2xl border border-gray-800 hover:border-green-500 transition-all">
                      <div className="w-10 h-10 bg-green-600/10 text-green-500 rounded-xl flex items-center justify-center text-lg">💬</div>
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">WhatsApp</p>
                        <p className="text-sm font-bold text-white">844567470</p>
                      </div>
                   </a>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'PACKAGES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
           <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 shadow-xl">
              <h3 className="text-2xl font-black text-white mb-8">Enviar Encomenda</h3>
              <form onSubmit={handlePackageSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <select value={pkgForm.origin} onChange={e => setPkgForm({...pkgForm, origin: e.target.value})} className={inputClass}>
                        <option value="">Origem...</option>
                        {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <select value={pkgForm.destination} onChange={e => setPkgForm({...pkgForm, destination: e.target.value})} className={inputClass}>
                        <option value="">Destino...</option>
                        {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <select value={pkgForm.size} onChange={e => setPkgForm({...pkgForm, size: e.target.value as PackageSize})} className={inputClass}>
                       <option value="SMALL">Pequena (Documentos, Envelopes)</option>
                       <option value="MEDIUM">Média (Caixas, Sacos)</option>
                       <option value="LARGE">Grande (Mobília, Volumes Pesados)</option>
                    </select>
                    <input placeholder="Tipo de Carga (ex: Vidro, Roupa)" value={pkgForm.type} onChange={e => setPkgForm({...pkgForm, type: e.target.value})} className={inputClass} />
                    <textarea placeholder="Descrição adicional..." value={pkgForm.description} onChange={e => setPkgForm({...pkgForm, description: e.target.value})} className={inputClass + " h-32 pt-4 resize-none"} />
                 </div>
                 <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-green-900/20 hover:bg-green-500 transition-all">Solicitar Cotação</button>
              </form>
           </div>

           <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800">
              <h3 className="text-2xl font-black text-white mb-8">Status das Encomendas</h3>
              <div className="space-y-4">
                 {packages.filter(p => p.passengerId === user.id).length === 0 ? (
                   <p className="text-gray-600 italic text-center py-20">Nenhuma encomenda registrada.</p>
                 ) : (
                   packages.filter(p => p.passengerId === user.id).map(p => (
                   <div key={p.id} className="p-6 bg-gray-950 rounded-3xl border border-gray-800 space-y-4">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-white font-black">{p.origin} ➜ {p.destination}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{p.size} • {p.type}</p>
                         </div>
                         <span className="text-xs font-black text-blue-500">REF: {p.id}</span>
                      </div>
                      <div className="pt-4 border-t border-gray-900 flex justify-between items-center">
                         <span className="text-[9px] font-black text-gray-600 uppercase">Status:</span>
                         <span className="bg-blue-900/20 text-blue-400 border border-blue-800 px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                            {p.status === 'REQUESTED' ? 'Aguardando Motorista' : p.status === 'NEGOTIATING' ? 'Negociando Preço' : p.status === 'QUOTED' ? `Cotação: ${p.price} MZN` : p.status}
                         </span>
                      </div>
                      {p.status === 'QUOTED' && (
                        <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20">Pagar Cotação</button>
                      )}
                   </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'PROFILE' && (
        <div className="max-w-2xl mx-auto bg-gray-900 p-12 rounded-[3rem] border border-gray-800 shadow-2xl animate-in zoom-in-95 duration-300">
           <h3 className="text-3xl font-black text-white mb-10 text-center">Gestão de Conta</h3>
           <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex flex-col items-center mb-10">
                 <div className="relative group cursor-pointer overflow-hidden rounded-[2.5rem]">
                    <img src={profileData.photoUrl || 'https://via.placeholder.com/150'} className="w-32 h-32 object-cover border-4 border-gray-800 shadow-2xl transition-all group-hover:opacity-50" />
                    <input type="file" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none bg-black/30">
                       <span className="text-[10px] font-black text-white uppercase tracking-widest text-center px-2">Clique para mudar foto</span>
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Nome Completo</label>
                    <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className={inputClass} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Telefone de Contacto</label>
                    <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className={inputClass} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Email (Não editável)</label>
                    <input type="email" value={profileData.email} disabled className={inputClass + " opacity-50"} />
                 </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all mt-6">Guardar Alterações</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default PassengerArea;
