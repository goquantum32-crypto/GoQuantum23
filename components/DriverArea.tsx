
import React, { useState, useEffect } from 'react';
import { User, TripRequest, PackageRequest } from '../types';
import { MOZ_ROUTES } from '../constants';

interface DriverAreaProps {
  user: User;
  onUpdateUser: (user: User) => void;
  trips: TripRequest[];
  packages: PackageRequest[];
  onUpdateTrip: (trip: TripRequest) => void;
}

const DriverArea: React.FC<DriverAreaProps> = ({ user, onUpdateUser, trips, packages, onUpdateTrip }) => {
  const [activeTab, setActiveTab] = useState<'TRIPS' | 'CALENDAR' | 'PROFILE'>('TRIPS');
  const [profileData, setProfileData] = useState({ ...user });
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    setProfileData({ ...user });
  }, [user]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(profileData);
    alert('Dados atualizados com sucesso!');
  };

  const addDate = () => {
    if (!newDate) return;
    const currentDates = profileData.availableDates || [];
    if (currentDates.includes(newDate)) return;
    const updated = { ...profileData, availableDates: [...currentDates, newDate] };
    setProfileData(updated);
    onUpdateUser(updated);
    setNewDate('');
  };

  const removeDate = (date: string) => {
    const updated = { ...profileData, availableDates: (profileData.availableDates || []).filter(d => d !== date) };
    setProfileData(updated);
    onUpdateUser(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'licenseUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          alert('A foto é muito grande. Escolha uma imagem com menos de 2MB.');
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setProfileData(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const inputClass = "w-full p-4 rounded-2xl bg-gray-950 border border-gray-800 text-white font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all";

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24">
      <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center space-x-6">
           <img src={user.photoUrl || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-xl" />
           <div>
             <h2 className="text-2xl font-black text-white">{user.name}</h2>
             <div className="flex items-center space-x-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${user.isApproved ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest">{user.isApproved ? 'Verificado' : 'Aguardando Aprovação'}</p>
             </div>
           </div>
        </div>
        <div className="flex bg-gray-950 p-1.5 rounded-2xl border border-gray-800 overflow-x-auto">
           <button onClick={() => setActiveTab('TRIPS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'TRIPS' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Serviços</button>
           <button onClick={() => setActiveTab('CALENDAR')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'CALENDAR' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Calendário & Rotas</button>
           <button onClick={() => setActiveTab('PROFILE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'PROFILE' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Configurações</button>
        </div>
      </div>

      {activeTab === 'TRIPS' && user.isApproved && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
           <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800">
              <h3 className="text-2xl font-black text-white mb-8">Viagens Atribuídas</h3>
              <div className="space-y-4">
                 {trips.filter(t => t.status === 'PAID' || t.status === 'ASSIGNED').length === 0 ? (
                   <p className="text-gray-600 text-center py-20 italic">Sem viagens ativas no momento.</p>
                 ) : (
                   trips.filter(t => t.status === 'PAID' || t.status === 'ASSIGNED').map(t => (
                     <div key={t.id} className="p-6 bg-gray-950 border border-gray-800 rounded-3xl space-y-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-white font-black">{t.origin} ➜ {t.destination}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t.date} • {t.seats} Lugares</p>
                           </div>
                           <span className="text-xs font-black text-green-500">{t.price} MZN</span>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-xl flex items-center justify-between border border-gray-800">
                           <span className="text-[9px] font-black text-gray-500 uppercase">Passageiro: {t.passengerName}</span>
                           <a href={`tel:${t.passengerPhone}`} className="text-blue-500 font-black text-xs underline decoration-2 underline-offset-4">Ligar</a>
                        </div>
                        <button onClick={() => onUpdateTrip({...t, status: 'COMPLETED'})} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all">Finalizar Serviço</button>
                     </div>
                   ))
                 )}
              </div>
           </div>

           <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800">
              <h3 className="text-2xl font-black text-white mb-8">Logística de Encomendas</h3>
              <div className="space-y-4">
                 {packages.filter(p => p.status === 'NEGOTIATING' || p.status === 'PAID').length === 0 ? (
                   <p className="text-gray-600 text-center py-20 italic">Sem cargas para gerir.</p>
                 ) : (
                   packages.filter(p => p.status === 'NEGOTIATING' || p.status === 'PAID').map(p => (
                     <div key={p.id} className="p-6 bg-gray-950 border border-gray-800 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                           <p className="text-white font-black">{p.origin} ➜ {p.destination}</p>
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${p.status === 'PAID' ? 'bg-green-900/20 text-green-500 border-green-800' : 'bg-blue-900/20 text-blue-500 border-blue-800'}`}>
                              {p.status === 'PAID' ? 'Confirmada' : 'Em Negociação'}
                           </span>
                        </div>
                        <p className="text-xs text-gray-400 font-bold">{p.type} ({p.size})</p>
                        <div className="pt-4 border-t border-gray-900">
                           <p className="text-[9px] font-black text-gray-600 uppercase mb-2">Discussão com Admin:</p>
                           <a href="tel:844567470" className="text-xs text-blue-400 font-black tracking-widest hover:underline">Contactar Admin para Preço ➜</a>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'CALENDAR' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 shadow-xl">
             <h3 className="text-2xl font-black text-white mb-6">Minha Rota Operacional</h3>
             <p className="text-xs text-gray-500 mb-8 uppercase font-black tracking-widest">Defina o trajeto que a sua carrinha costuma percorrer.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Ponto de Início</label>
                   <select 
                      value={profileData.routeStart || ''} 
                      onChange={e => setProfileData({...profileData, routeStart: e.target.value})} 
                      className={inputClass}
                   >
                      <option value="">Selecione...</option>
                      {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Ponto Final</label>
                   <select 
                      value={profileData.routeEnd || ''} 
                      onChange={e => setProfileData({...profileData, routeEnd: e.target.value})} 
                      className={inputClass}
                   >
                      <option value="">Selecione...</option>
                      {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
             </div>
             <button onClick={handleProfileUpdate} className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20">Salvar Rota</button>
          </div>

          <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 shadow-xl">
             <h3 className="text-2xl font-black text-white mb-6">Disponibilidade por Data</h3>
             <div className="flex gap-4 mb-8">
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={e => setNewDate(e.target.value)} 
                  className={inputClass + " flex-1"} 
                />
                <button onClick={addDate} className="bg-green-600 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/20">Adicionar Dia</button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(profileData.availableDates || []).map(date => (
                   <div key={date} className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{date}</span>
                      <button onClick={() => removeDate(date)} className="text-red-500 hover:text-red-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'PROFILE' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
           <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-8">Dados Pessoais</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                 <div className="flex flex-col items-center mb-6">
                    <div className="relative group overflow-hidden rounded-[2.5rem]">
                       <img src={profileData.photoUrl || 'https://via.placeholder.com/150'} className="w-32 h-32 object-cover border-4 border-gray-800 transition-all group-hover:opacity-40" />
                       <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'photoUrl')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">Alterar Foto</span>
                       </div>
                    </div>
                    <span className="text-[9px] font-black text-gray-600 uppercase mt-4 tracking-widest">Foto de Perfil</span>
                 </div>
                 <div className="space-y-4">
                    <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className={inputClass} placeholder="Nome" />
                    <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className={inputClass} placeholder="Telefone" />
                 </div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all">Guardar Dados</button>
              </form>
           </div>

           <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-8">Dados da Viatura</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                 <div className="space-y-4">
                    <input type="text" value={profileData.vehicleNumber} onChange={e => setProfileData({...profileData, vehicleNumber: e.target.value})} className={inputClass} placeholder="Matrícula" />
                    <input type="text" value={profileData.vehicleModel} onChange={e => setProfileData({...profileData, vehicleModel: e.target.value})} className={inputClass} placeholder="Modelo (ex: Toyota Hiace)" />
                    <input type="text" value={profileData.vehicleColor} onChange={e => setProfileData({...profileData, vehicleColor: e.target.value})} className={inputClass} placeholder="Cor da Viatura" />
                 </div>
                 <div className="pt-6">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Actualizar Carta de Condução</label>
                    <div className="mt-2 relative h-32 bg-gray-950 border border-gray-800 rounded-3xl flex items-center justify-center overflow-hidden border-dashed hover:border-blue-600 transition-all">
                       <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'licenseUrl')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                       {profileData.licenseUrl ? <img src={profileData.licenseUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-gray-700 uppercase">Clique para Carregar</span>}
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-gray-950 text-white border border-gray-800 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all">Actualizar Veículo</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default DriverArea;
