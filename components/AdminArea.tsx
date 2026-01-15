
import React, { useState } from 'react';
import { User, UserRole, TripRequest, PackageRequest } from '../types';
import { MOZ_ROUTES } from '../constants';

interface AdminAreaProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  trips: TripRequest[];
  onUpdateTrip: (trip: TripRequest) => void;
  packages: PackageRequest[];
  onUpdatePackage: (pkg: PackageRequest) => void;
}

const AdminArea: React.FC<AdminAreaProps> = ({ users, onUpdateUser, trips, onUpdateTrip, packages, onUpdatePackage }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'TRIPS' | 'PACKAGES' | 'REVENUE'>('USERS');
  const [pkgPriceInput, setPkgPriceInput] = useState<Record<string, string>>({});

  const drivers = users.filter(u => u.role === UserRole.DRIVER);
  const passengers = users.filter(u => u.role === UserRole.PASSENGER);

  const stats = {
    totalRevenue: trips.filter(t => t.paymentConfirmed).reduce((acc, t) => acc + t.price, 0) + packages.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.price, 0),
    activeDrivers: drivers.filter(d => d.isApproved).length,
    pendingPayments: trips.filter(t => t.status === 'PENDING').length
  };

  const getCompatibleDrivers = (trip: TripRequest) => {
    return drivers.filter(d => {
      if (!d.isApproved) return false;
      
      // 1. Verificar disponibilidade de data
      const dates = d.availableDates || [];
      if (!dates.includes(trip.date)) return false;

      // 2. Verificar se a rota do motorista cobre a viagem do passageiro
      const routeStartIdx = MOZ_ROUTES.indexOf(d.routeStart || '');
      const routeEndIdx = MOZ_ROUTES.indexOf(d.routeEnd || '');
      const tripStartIdx = MOZ_ROUTES.indexOf(trip.origin);
      const tripEndIdx = MOZ_ROUTES.indexOf(trip.destination);

      if (routeStartIdx === -1 || routeEndIdx === -1) return false;

      // Lógica de direção (Maputo -> Vilanculos ou Vilanculos -> Maputo)
      const isGoingNorth = routeStartIdx < routeEndIdx;
      const isTripNorth = tripStartIdx < tripEndIdx;

      if (isGoingNorth !== isTripNorth) return false;

      if (isGoingNorth) {
        return tripStartIdx >= routeStartIdx && tripEndIdx <= routeEndIdx;
      } else {
        return tripStartIdx <= routeStartIdx && tripEndIdx >= routeEndIdx;
      }
    });
  };

  const inputClass = "w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs font-bold text-white outline-none";

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Receita Validada</p>
          <p className="text-3xl font-black text-white">{stats.totalRevenue.toLocaleString()} MZN</p>
        </div>
        <div className="bg-blue-600 p-8 rounded-[2.5rem] border border-blue-500 shadow-xl shadow-blue-900/20">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Motoristas Ativos</p>
          <p className="text-3xl font-black text-white">{stats.activeDrivers}</p>
        </div>
        <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Aguardando Validação</p>
          <p className="text-3xl font-black text-yellow-500">{stats.pendingPayments}</p>
        </div>
      </div>

      <div className="flex bg-gray-900 p-2 rounded-2xl border border-gray-800 overflow-x-auto">
         <button onClick={() => setActiveTab('USERS')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'USERS' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Gestão Utilizadores</button>
         <button onClick={() => setActiveTab('TRIPS')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'TRIPS' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Gestão Viagens</button>
         <button onClick={() => setActiveTab('PACKAGES')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === 'PACKAGES' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Logística Encomendas</button>
      </div>

      {activeTab === 'USERS' && (
        <div className="space-y-8">
           <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800">
              <h3 className="text-2xl font-black text-white mb-8">Aprovação de Motoristas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {drivers.map(d => (
                   <div key={d.id} className="p-6 bg-gray-950 rounded-3xl border border-gray-800 space-y-4">
                      <div className="flex items-center space-x-4">
                         <img src={d.photoUrl} className="w-12 h-12 rounded-xl object-cover border border-gray-800" />
                         <div>
                            <p className="text-white font-black text-sm">{d.name}</p>
                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{d.vehicleNumber}</p>
                         </div>
                      </div>
                      <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                         <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Rota:</p>
                         <p className="text-[10px] font-bold text-blue-400">{d.routeStart || '?'} ➜ {d.routeEnd || '?'}</p>
                      </div>
                      <div className="flex space-x-2">
                         <button onClick={() => window.open(d.licenseUrl, '_blank')} className="flex-1 py-2 bg-gray-900 text-gray-400 border border-gray-800 rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-white">Ver Carta</button>
                         <button 
                           onClick={() => onUpdateUser({...d, isApproved: !d.isApproved})}
                           className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg ${d.isApproved ? 'bg-red-900/20 text-red-500 border border-red-800' : 'bg-green-900/20 text-green-500 border border-green-800'}`}
                         >
                           {d.isApproved ? 'Suspender' : 'Aprovar'}
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'TRIPS' && (
        <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 space-y-8 animate-in fade-in duration-500">
           <h3 className="text-2xl font-black text-white mb-8">Controle Financeiro de Viagens</h3>
           <div className="space-y-4">
              {trips.length === 0 ? (
                <p className="text-gray-600 text-center py-20 italic">Nenhum pedido de viagem.</p>
              ) : (
                trips.map(t => {
                  const compatibleDrivers = getCompatibleDrivers(t);
                  return (
                    <div key={t.id} className="p-6 bg-gray-950 rounded-3xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="text-[10px] font-black text-blue-500 bg-blue-900/20 px-2 py-0.5 rounded-md">REF: {t.id}</span>
                            <p className="text-white font-black">{t.origin} ➜ {t.destination}</p>
                          </div>
                          <p className="text-xs text-gray-500 font-bold">Passageiro: {t.passengerName} • Data: {t.date}</p>
                       </div>
                       <div className="flex items-center space-x-6">
                          <div className="text-right">
                             <p className="text-lg font-black text-white">{t.price} MZN</p>
                             <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{t.paymentMethod}</p>
                          </div>
                          <div className="flex flex-col space-y-2 min-w-[200px]">
                            <select 
                              className={`${inputClass} ${compatibleDrivers.length === 0 ? 'border-red-900 text-red-500' : ''}`}
                              value={t.driverId || ''}
                              onChange={(e) => onUpdateTrip({...t, driverId: e.target.value, status: 'ASSIGNED'})}
                            >
                               <option value="">{compatibleDrivers.length === 0 ? 'Sem Motoristas Disponíveis' : 'Atribuir Motorista...'}</option>
                               {compatibleDrivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.vehicleNumber})</option>)}
                            </select>
                            <button 
                              onClick={() => onUpdateTrip({...t, paymentConfirmed: !t.paymentConfirmed, status: t.paymentConfirmed ? 'PENDING' : 'PAID'})}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all ${t.paymentConfirmed ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}
                            >
                              {t.paymentConfirmed ? 'Pagamento Validado' : 'Validar Pagamento'}
                            </button>
                          </div>
                       </div>
                    </div>
                  );
                })
              )}
           </div>
        </div>
      )}

      {activeTab === 'PACKAGES' && (
        <div className="bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 space-y-8 animate-in fade-in duration-500">
           <h3 className="text-2xl font-black text-white mb-8">Gestão de Logística & Cargas</h3>
           <div className="space-y-6">
              {packages.map(p => (
                <div key={p.id} className="p-8 bg-gray-950 rounded-[2.5rem] border border-gray-800 space-y-6">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-xl font-black text-white">{p.origin} ➜ {p.destination}</p>
                         <p className="text-xs text-blue-500 font-black mt-1 uppercase tracking-tighter">REF: {p.id} • {p.size} ({p.type})</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === 'REQUESTED' ? 'bg-orange-900/20 text-orange-500 border-orange-800' : 'bg-blue-900/20 text-blue-400 border-blue-800'}`}>
                         {p.status}
                      </span>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-900">
                      <div>
                         <label className="text-[10px] font-black text-gray-600 uppercase block mb-3">1. Selecionar Motorista</label>
                         <select 
                           className={inputClass + " p-3"}
                           value={p.driverId || ''}
                           onChange={(e) => onUpdatePackage({...p, driverId: e.target.value, status: 'NEGOTIATING'})}
                         >
                            <option value="">Escolher Carrinha...</option>
                            {drivers.filter(d => d.isApproved).map(d => <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>)}
                         </select>
                      </div>

                      <div>
                         <label className="text-[10px] font-black text-gray-600 uppercase block mb-3">2. Inserir Cotação (MZN)</label>
                         <div className="flex space-x-2">
                            <input 
                              type="number" 
                              placeholder="Preço Final" 
                              className={inputClass + " p-3 flex-1"}
                              value={pkgPriceInput[p.id] || ''}
                              onChange={(e) => setPkgPriceInput({...pkgPriceInput, [p.id]: e.target.value})}
                            />
                            <button 
                              onClick={() => onUpdatePackage({...p, price: parseInt(pkgPriceInput[p.id]), status: 'QUOTED'})}
                              className="bg-blue-600 text-white px-4 rounded-xl font-black text-[10px]"
                            >
                              OK
                            </button>
                         </div>
                      </div>

                      <div className="flex flex-col justify-end">
                         <p className="text-[10px] text-gray-500 font-bold mb-2">Remetente: {p.senderName}</p>
                         <a href={`tel:${p.senderPhone}`} className="text-center py-2 bg-gray-900 border border-gray-800 rounded-xl text-[10px] font-black text-white hover:bg-gray-800">Contactar Cliente</a>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminArea;
