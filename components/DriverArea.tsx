
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
  const [selectedDayConfig, setSelectedDayConfig] = useState<string | null>(null);

  useEffect(() => { setProfileData({ ...user }); }, [user]);

  const saveDayConfig = (date: string, start: string, end: string, time: string) => {
    if (!date) {
      alert('Por favor, escolha uma data.');
      return;
    }
    if (!time) {
      alert('Por favor, defina um horário de partida.');
      return;
    }
    const updatedDayRoutes = { ...(profileData.dayRoutes || {}), [date]: { start, end, time } };
    const currentDates = profileData.availableDates || [];
    const updatedDates = currentDates.includes(date) ? currentDates : [...currentDates, date];
    
    const updated = { ...profileData, dayRoutes: updatedDayRoutes, availableDates: updatedDates };
    setProfileData(updated);
    onUpdateUser(updated);
    setSelectedDayConfig(null);
    alert('Agenda guardada para o dia ' + date);
  };

  const removeDay = (date: string) => {
    const updatedDates = (profileData.availableDates || []).filter(d => d !== date);
    const updatedRoutes = { ...(profileData.dayRoutes || {}) };
    delete updatedRoutes[date];
    const updated = { ...profileData, availableDates: updatedDates, dayRoutes: updatedRoutes };
    setProfileData(updated);
    onUpdateUser(updated);
  };

  const inputClass = "w-full p-4 rounded-2xl bg-gray-950 border border-gray-800 text-white font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm";

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24">
      {/* Header do Motorista */}
      <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in duration-500">
        <div className="flex items-center space-x-6">
           <div className="relative">
              <img src={user.photoUrl || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-[1.5rem] object-cover border-2 border-blue-600 shadow-xl" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-gray-900 rounded-full"></div>
           </div>
           <div>
             <h2 className="text-2xl font-black text-white">{user.name}</h2>
             <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">{user.isApproved ? 'Verificado GoQuantum' : 'Revisão Pendente'}</p>
           </div>
        </div>
        <div className="flex bg-gray-950 p-2 rounded-2xl border border-gray-800 overflow-x-auto">
           <button onClick={() => setActiveTab('TRIPS')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'TRIPS' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Viagens Ativas</button>
           <button onClick={() => setActiveTab('CALENDAR')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'CALENDAR' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Agenda & Disponibilidade</button>
           <button onClick={() => setActiveTab('PROFILE')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'PROFILE' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Meu Perfil</button>
        </div>
      </div>

      {activeTab === 'CALENDAR' && (
        <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                 <h3 className="text-3xl font-black text-white">Minha Agenda</h3>
                 <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-black opacity-60">Planeamento de Rotas e Datas</p>
              </div>
              <button 
                onClick={() => setSelectedDayConfig(new Date().toISOString().slice(0, 10))} 
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-500 hover:scale-105 transition-all"
              >
                + Adicionar Novo Dia
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(profileData.availableDates || []).sort().map(date => (
                <div key={date} className="bg-gray-950 p-8 rounded-[2.5rem] border border-gray-800 space-y-5 hover:border-blue-700 transition-all shadow-lg">
                   <div className="flex justify-between items-center">
                      <p className="text-white font-black text-lg">{date.split('-').reverse().join('/')}</p>
                      <button onClick={() => removeDay(date)} className="text-gray-700 hover:text-red-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                   </div>
                   <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Trajeto definido:</p>
                      <p className="text-xs font-bold text-white">{(profileData.dayRoutes?.[date]?.start || 'Indefinida')}</p>
                      <p className="text-blue-500 text-center my-1 text-[10px]">⬇</p>
                      <p className="text-xs font-bold text-white">{(profileData.dayRoutes?.[date]?.end || 'Indefinida')}</p>
                   </div>
                   <div className="bg-gray-900 p-3 rounded-2xl border border-gray-800 text-center">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Partida:</p>
                      <p className="text-xl font-black text-blue-400">{(profileData.dayRoutes?.[date]?.time || '--:--')}</p>
                   </div>
                   <button onClick={() => setSelectedDayConfig(date)} className="w-full py-3 bg-gray-900 border border-gray-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-gray-800 transition-all">Alterar Rota/Hora</button>
                </div>
              ))}
              {(profileData.availableDates || []).length === 0 && (
                <div className="col-span-full py-32 text-center text-gray-700 border-2 border-dashed border-gray-800 rounded-[3rem] bg-gray-950/20">
                   <p className="text-lg font-bold mb-2">Nenhum dia de trabalho registado.</p>
                   <p className="text-sm opacity-60">Adicione as datas em que estará disponível para começar a receber passageiros.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {selectedDayConfig && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-gray-900 p-12 rounded-[4rem] border border-gray-800 w-full max-w-md space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center">
                 <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Gestão de Agenda</h4>
                 <p className="text-blue-500 font-black text-[10px] mt-2 uppercase tracking-widest">Escolha a Data, Hora e Rota</p>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Selecione o Dia:</label>
                    <input 
                      type="date" 
                      id="datePicker" 
                      className={inputClass} 
                      defaultValue={selectedDayConfig} 
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Horário de Partida:</label>
                    <input 
                      type="time" 
                      id="timePicker" 
                      className={inputClass} 
                      defaultValue={profileData.dayRoutes?.[selectedDayConfig]?.time || ''} 
                    />
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Início da Rota:</label>
                       <select id="startSelect" className={inputClass} defaultValue={profileData.dayRoutes?.[selectedDayConfig]?.start}>
                          {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Fim da Rota:</label>
                       <select id="endSelect" className={inputClass} defaultValue={profileData.dayRoutes?.[selectedDayConfig]?.end}>
                          {MOZ_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={() => setSelectedDayConfig(null)} className="flex-1 py-5 bg-gray-950 border border-gray-800 text-gray-600 rounded-[2rem] font-black text-xs uppercase transition-all hover:bg-gray-800">Fechar</button>
                 <button 
                   onClick={() => {
                     const date = (document.getElementById('datePicker') as HTMLInputElement).value;
                     const time = (document.getElementById('timePicker') as HTMLInputElement).value;
                     const start = (document.getElementById('startSelect') as HTMLSelectElement).value;
                     const end = (document.getElementById('endSelect') as HTMLSelectElement).value;
                     saveDayConfig(date, start, end, time);
                   }} 
                   className="flex-1 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all"
                 >
                   Guardar
                 </button>
              </div>
           </div>
        </div>
      )}
      
      {activeTab === 'TRIPS' && (
        <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 animate-in fade-in duration-500">
           <h3 className="text-2xl font-black text-white mb-8">Passageiros para Transporte</h3>
           <div className="space-y-4">
              {trips.filter(t => t.status !== 'COMPLETED').map(t => (
                <div key={t.id} className="bg-gray-950 p-8 rounded-[2.5rem] border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div>
                      <div className="flex items-center space-x-3">
                         <span className="text-[9px] font-black text-blue-500 bg-blue-900/20 px-2 py-0.5 rounded uppercase">REF: {t.id}</span>
                         <p className="text-white font-black">{t.origin} ➜ {t.destination}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 font-bold">{t.passengerName} • {t.passengerPhone}</p>
                      <p className="text-xs text-blue-400 mt-1 font-bold">Horário: {t.time}</p>
                   </div>
                   <div className="text-right flex items-center space-x-8">
                      <div>
                         <p className="text-lg font-black text-white">{t.price} MZN</p>
                         <p className="text-[10px] font-black text-green-500 uppercase">Confirmado</p>
                      </div>
                      <a href={`tel:${t.passengerPhone}`} className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">📞</a>
                   </div>
                </div>
              ))}
              {trips.filter(t => t.status !== 'COMPLETED').length === 0 && <p className="text-gray-600 italic text-center py-20">Sem viagens agendadas para o momento.</p>}
           </div>
        </div>
      )}
    </div>
  );
};

export default DriverArea;
