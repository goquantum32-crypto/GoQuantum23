
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
  const [activeTab, setActiveTab] = useState<'USERS' | 'TRIPS' | 'PACKAGES' | 'REPORTS'>('TRIPS');
  const [userSubTab, setUserSubTab] = useState<'PASSENGERS' | 'DRIVERS'>('DRIVERS');
  const [revenueShare, setRevenueShare] = useState(15);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [pkgQuoteInputs, setPkgQuoteInputs] = useState<Record<string, { price: string, driverId: string }>>({});

  // Filtragem de Dados
  const passengers = users.filter(u => u.role === UserRole.PASSENGER);
  const drivers = users.filter(u => u.role === UserRole.DRIVER);

  const filteredTrips = trips.filter(t => t.date.startsWith(selectedMonth));
  const totalGross = filteredTrips.filter(t => t.paymentConfirmed).reduce((acc, t) => acc + t.price, 0) + packages.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.price, 0);
  const platformProfit = (totalGross * revenueShare) / 100;

  // Lógica de Inteligência de Rota + PRIORIDADE
  const getCompatibleDrivers = (date: string, origin: string, destination: string) => {
    const compatible = drivers.filter(d => {
      if (!d.isApproved) return false;
      
      // 1. Verifica se tem o dia na agenda
      if (!d.availableDates?.includes(date)) return false;

      // 2. Verifica a rota configurada para aquele dia
      const dayRoute = d.dayRoutes?.[date];
      if (!dayRoute) return false;

      const driverStartIdx = MOZ_ROUTES.indexOf(dayRoute.start);
      const driverEndIdx = MOZ_ROUTES.indexOf(dayRoute.end);
      const tripStartIdx = MOZ_ROUTES.indexOf(origin);
      const tripEndIdx = MOZ_ROUTES.indexOf(destination);

      if (driverStartIdx === -1 || driverEndIdx === -1) return false;

      // Lógica de Direção (Norte vs Sul) e Cobertura
      if (driverStartIdx < driverEndIdx) { // Indo para o Norte (ex: Maputo -> Vilanculos)
        return tripStartIdx >= driverStartIdx && tripEndIdx <= driverEndIdx && tripStartIdx < tripEndIdx;
      } else { // Indo para o Sul (ex: Vilanculos -> Maputo)
        return tripStartIdx <= driverStartIdx && tripEndIdx >= driverEndIdx && tripStartIdx > tripEndIdx;
      }
    });

    // Ordenar por prioridade (True primeiro)
    return compatible.sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));
  };

  const getDriversForPackageRoute = (origin: string, destination: string) => {
    const compatible = drivers.filter(d => {
        if (!d.isApproved) return false;
        const hasRoute = d.availableDates?.some(date => {
            const route = d.dayRoutes?.[date];
            if (!route) return false;
            const sIdx = MOZ_ROUTES.indexOf(route.start);
            const eIdx = MOZ_ROUTES.indexOf(route.end);
            const oIdx = MOZ_ROUTES.indexOf(origin);
            const dIdx = MOZ_ROUTES.indexOf(destination);
            if (sIdx < eIdx) return oIdx >= sIdx && dIdx <= eIdx && oIdx < dIdx;
            else return oIdx <= sIdx && dIdx >= eIdx && oIdx > dIdx;
        });
        return hasRoute;
    });

    // Ordenar por prioridade (True primeiro)
    return compatible.sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));
  };

  const inputClass = "p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all";

  // Helpers para contagem de pagamentos pendentes
  const pendingTrips = trips.filter(t => !t.paymentConfirmed && t.status === 'PENDING');
  const pendingPackages = packages.filter(p => p.status === 'PAYMENT_PENDING');
  const hasPendingPayments = pendingTrips.length > 0 || pendingPackages.length > 0;

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-500">
      {/* Header Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Bruto ({selectedMonth})</p>
          <p className="text-2xl font-black text-white">{totalGross.toLocaleString()} MZN</p>
        </div>
        <div className="bg-blue-600 p-8 rounded-[2.5rem] border border-blue-500 shadow-xl shadow-blue-900/30">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Lucro Plataforma ({revenueShare}%)</p>
          <p className="text-2xl font-black text-white">{platformProfit.toLocaleString()} MZN</p>
        </div>
        <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Pagamentos Pendentes</p>
          <p className="text-2xl font-black text-yellow-500">{pendingTrips.length + pendingPackages.length}</p>
        </div>
        <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Cargas a Cotar</p>
          <p className="text-2xl font-black text-orange-500">{packages.filter(p => p.status === 'REQUESTED').length}</p>
        </div>
      </div>

      {/* Menu Principal */}
      <div className="flex bg-gray-900 p-2 rounded-2xl border border-gray-800 overflow-x-auto">
         <button onClick={() => setActiveTab('TRIPS')} className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'TRIPS' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Gestão de Viagens</button>
         <button onClick={() => setActiveTab('PACKAGES')} className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'PACKAGES' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Encomendas & Cotações</button>
         <button onClick={() => setActiveTab('USERS')} className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'USERS' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Base de Dados</button>
         <button onClick={() => setActiveTab('REPORTS')} className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeTab === 'REPORTS' ? 'bg-gray-800 text-blue-400' : 'text-gray-500'}`}>Relatórios & Lucros</button>
      </div>

      {/* --- ABA DE VIAGENS --- */}
      {activeTab === 'TRIPS' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4">
           {/* 1. Validação de Pagamentos */}
           <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                 <span className="bg-yellow-500/20 text-yellow-500 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                 Validação de Pagamentos
              </h3>
              {!hasPendingPayments ? (
                 <p className="text-gray-600 italic pl-12">Nenhum pagamento pendente (Viagens ou Encomendas).</p>
              ) : (
                 <div className="grid gap-4">
                    {/* Viagens Pendentes */}
                    {pendingTrips.map(t => (
                       <div key={t.id} className="bg-gray-950 p-6 rounded-[2rem] border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 ml-0 md:ml-11">
                          <div>
                             <p className="text-white font-black">Viagem: {t.passengerName} <span className="text-gray-600">|</span> {t.price} MZN</p>
                             <p className="text-xs text-gray-500">{t.origin} ➜ {t.destination} ({t.date})</p>
                             <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">Via {t.paymentMethod}</p>
                          </div>
                          <button 
                             onClick={() => onUpdateTrip({...t, paymentConfirmed: true, status: 'PAID'})}
                             className="bg-green-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-green-500 shadow-lg shadow-green-900/20"
                          >
                             Confirmar (Viagem)
                          </button>
                       </div>
                    ))}
                    {/* Encomendas Pendentes */}
                    {pendingPackages.map(p => (
                       <div key={p.id} className="bg-gray-950 p-6 rounded-[2rem] border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 ml-0 md:ml-11 border-l-4 border-l-blue-600">
                          <div>
                             <p className="text-white font-black">Carga: {p.senderName} <span className="text-gray-600">|</span> {p.price} MZN</p>
                             <p className="text-xs text-gray-500">{p.origin} ➜ {p.destination}</p>
                             <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">Ref: {p.id}</p>
                          </div>
                          <button 
                             onClick={() => onUpdatePackage({...p, status: 'PAID'})}
                             className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                          >
                             Confirmar (Carga)
                          </button>
                       </div>
                    ))}
                 </div>
              )}
           </div>

           {/* 2. Atribuição de Motorista */}
           <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                 <span className="bg-blue-500/20 text-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                 Atribuir Motorista
              </h3>
              {trips.filter(t => t.paymentConfirmed && !t.driverId && t.status !== 'CANCELLED').length === 0 ? (
                 <p className="text-gray-600 italic pl-12">Todas as viagens pagas já têm motorista.</p>
              ) : (
                 <div className="grid gap-6">
                    {trips.filter(t => t.paymentConfirmed && !t.driverId && t.status !== 'CANCELLED').map(t => {
                       const availableDrivers = getCompatibleDrivers(t.date, t.origin, t.destination);
                       return (
                          <div key={t.id} className="bg-gray-950 p-8 rounded-[2rem] border border-gray-800 ml-0 md:ml-11 space-y-4">
                             <div className="flex justify-between items-start">
                                <div>
                                   <p className="text-lg font-black text-white">{t.origin} ➜ {t.destination}</p>
                                   <p className="text-sm text-gray-400 font-bold">{t.date} • {t.seats} Lugares</p>
                                   <p className="text-xs text-blue-400 mt-1">Passageiro: {t.passengerName}</p>
                                </div>
                                <span className="bg-green-900/20 text-green-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Pago</span>
                             </div>

                             <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                <p className="text-[10px] font-black text-gray-500 uppercase mb-3">Motoristas Disponíveis (Ordenados por Prioridade):</p>
                                {availableDrivers.length === 0 ? (
                                   <p className="text-red-500 text-xs italic">Nenhum motorista com rota marcada para {t.date} cobrindo este trajeto.</p>
                                ) : (
                                   <div className="grid grid-cols-1 gap-2">
                                      {availableDrivers.map(d => (
                                         <div key={d.id} className={`flex justify-between items-center p-3 rounded-lg border ${d.isPriority ? 'bg-yellow-900/10 border-yellow-500/50' : 'bg-gray-950 border-gray-800'}`}>
                                            <div>
                                               <p className="text-white font-bold text-xs flex items-center gap-1">
                                                  {d.isPriority && <span className="text-yellow-500">★</span>} 
                                                  {d.name}
                                               </p>
                                               <p className="text-[10px] text-gray-500">{d.vehicleModel} ({d.availableSeats} lug.)</p>
                                            </div>
                                            <button 
                                               onClick={() => onUpdateTrip({...t, driverId: d.id, status: 'ASSIGNED'})}
                                               className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-blue-500"
                                            >
                                               Atribuir
                                            </button>
                                         </div>
                                      ))}
                                   </div>
                                )}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              )}
           </div>

           {/* 3. Histórico Permanente */}
           <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                 <span className="bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                 Relatório Completo de Viagens
              </h3>
              <div className="overflow-x-auto rounded-3xl border border-gray-800">
                 <table className="w-full text-left bg-gray-950/50">
                    <thead>
                       <tr className="bg-gray-900 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                          <th className="p-4">Data</th>
                          <th className="p-4">Rota</th>
                          <th className="p-4">Passageiro</th>
                          <th className="p-4">Motorista</th>
                          <th className="p-4">Feedback</th>
                          <th className="p-4">Estado</th>
                       </tr>
                    </thead>
                    <tbody className="text-xs text-gray-300">
                       {[...trips].reverse().map(t => (
                          <tr key={t.id} className="border-t border-gray-800 hover:bg-gray-900/30">
                             <td className="p-4 font-bold">{t.date}</td>
                             <td className="p-4">{t.origin} ➜ {t.destination}</td>
                             <td className="p-4">{t.passengerName}<br/><span className="text-gray-600 text-[10px]">{t.passengerPhone}</span></td>
                             <td className="p-4">{users.find(u => u.id === t.driverId)?.name || '-'}</td>
                             <td className="p-4">
                                {t.feedback ? (
                                   <div className="space-y-1">
                                      <div className="text-yellow-500 text-xs">{'★'.repeat(t.feedback.rating)}</div>
                                      <div className="flex flex-wrap gap-1">
                                        {t.feedback.tags?.map(tag => (
                                          <span key={tag} className="text-[8px] bg-gray-800 px-1 rounded text-gray-400">{tag}</span>
                                        ))}
                                      </div>
                                   </div>
                                ) : <span className="text-gray-700">-</span>}
                             </td>
                             <td className="p-4">
                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${t.status === 'COMPLETED' ? 'bg-green-900/20 text-green-500' : 'bg-gray-800 text-gray-500'}`}>{t.status}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* --- ABA DE ENCOMENDAS --- */}
      {activeTab === 'PACKAGES' && (
         <div className="space-y-12 animate-in slide-in-from-bottom-4">
            <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 space-y-8">
               <h3 className="text-2xl font-black text-white">Gestão de Encomendas</h3>
               
               <div className="grid gap-8">
                  {packages.map(p => {
                     const compatibleDrivers = getDriversForPackageRoute(p.origin, p.destination);
                     const currentQuote = pkgQuoteInputs[p.id] || { price: '', driverId: '' };

                     return (
                        <div key={p.id} className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-xl">
                           {/* Cabeçalho do Pedido */}
                           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-900 pb-6 mb-6">
                              <div>
                                 <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase mb-2 inline-block ${p.status === 'REQUESTED' ? 'bg-blue-900/20 text-blue-400 animate-pulse' : 'bg-gray-800 text-gray-500'}`}>{p.status}</span>
                                 <h4 className="text-xl font-black text-white">{p.origin} ➜ {p.destination}</h4>
                                 <p className="text-xs text-gray-500 font-bold mt-1">Cliente: {p.senderName} ({p.senderPhone})</p>
                              </div>
                              <div className="bg-gray-900 p-4 rounded-xl max-w-sm">
                                 <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Descrição da Carga:</p>
                                 <p className="text-sm text-gray-300 italic">"{p.description}"</p>
                              </div>
                           </div>

                           {/* Área de Ação: Negociação e Cotação */}
                           {p.status === 'REQUESTED' && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                 {/* Lado Esquerdo: Encontrar Motorista */}
                                 <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">1. Negociar com Motorista</p>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                       {compatibleDrivers.length === 0 ? (
                                          <p className="text-gray-600 text-xs italic">Sem motoristas nesta rota.</p>
                                       ) : compatibleDrivers.map(d => (
                                          <div key={d.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${currentQuote.driverId === d.id ? 'bg-blue-900/20 border-blue-500' : (d.isPriority ? 'bg-yellow-900/10 border-yellow-600/30' : 'bg-gray-900 border-gray-800')}`}>
                                             <div>
                                                <p className="text-white font-bold text-xs flex items-center gap-1">
                                                   {d.isPriority && <span className="text-yellow-500">★</span>}
                                                   {d.name}
                                                </p>
                                                <a href={`tel:${d.phone}`} className="text-blue-500 text-[10px] font-black underline flex items-center gap-1 mt-1">
                                                   <span>📞</span> {d.phone} (Ligar)
                                                </a>
                                             </div>
                                             <button 
                                                onClick={() => setPkgQuoteInputs({ ...pkgQuoteInputs, [p.id]: { ...currentQuote, driverId: d.id } })}
                                                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${currentQuote.driverId === d.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                                             >
                                                {currentQuote.driverId === d.id ? 'Selecionado' : 'Escolher'}
                                             </button>
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 {/* Lado Direito: Definir Preço */}
                                 <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
                                    <div>
                                       <p className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">2. Cotação para o Cliente</p>
                                       <div className="flex items-center gap-3">
                                          <input 
                                             type="number" 
                                             placeholder="Valor em MZN"
                                             className="flex-1 bg-gray-950 border border-gray-700 text-white p-3 rounded-xl font-bold outline-none focus:border-blue-500"
                                             value={currentQuote.price}
                                             onChange={e => setPkgQuoteInputs({ ...pkgQuoteInputs, [p.id]: { ...currentQuote, price: e.target.value } })}
                                          />
                                          <span className="text-gray-500 font-black text-xs">MZN</span>
                                       </div>
                                    </div>
                                    <button 
                                       disabled={!currentQuote.price || !currentQuote.driverId}
                                       onClick={() => {
                                          onUpdatePackage({ 
                                             ...p, 
                                             price: parseInt(currentQuote.price), 
                                             driverId: currentQuote.driverId,
                                             status: 'QUOTED' 
                                          });
                                          // Limpa o input
                                          const newInputs = { ...pkgQuoteInputs };
                                          delete newInputs[p.id];
                                          setPkgQuoteInputs(newInputs);
                                       }}
                                       className="w-full mt-6 bg-blue-600 disabled:bg-gray-800 disabled:text-gray-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg"
                                    >
                                       Enviar Cotação
                                    </button>
                                 </div>
                              </div>
                           )}

                           {/* Visualização Pós-Cotação */}
                           {p.status !== 'REQUESTED' && (
                              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                                 <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase">Cotação Enviada</p>
                                    <p className="text-lg font-black text-white">{p.price} MZN</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase">Motorista Pré-alocado</p>
                                    <p className="text-sm font-bold text-blue-400">{users.find(u => u.id === p.driverId)?.name || 'N/A'}</p>
                                 </div>
                              </div>
                           )}
                        </div>
                     );
                  })}
                  {packages.length === 0 && <p className="text-gray-600 italic text-center">Nenhuma encomenda registada.</p>}
               </div>
            </div>
         </div>
      )}

      {/* --- ABA DE UTILIZADORES --- */}
      {activeTab === 'USERS' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 flex justify-center space-x-4">
              <button onClick={() => setUserSubTab('DRIVERS')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${userSubTab === 'DRIVERS' ? 'bg-blue-600 text-white' : 'bg-gray-950 text-gray-600'}`}>Motoristas ({drivers.length})</button>
              <button onClick={() => setUserSubTab('PASSENGERS')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${userSubTab === 'PASSENGERS' ? 'bg-blue-600 text-white' : 'bg-gray-950 text-gray-600'}`}>Passageiros ({passengers.length})</button>
           </div>
           
           {userSubTab === 'DRIVERS' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {drivers.map(d => (
                 <div key={d.id} className={`bg-gray-950 p-8 rounded-[3rem] border space-y-6 ${d.isPriority ? 'border-yellow-500/30' : 'border-gray-800'}`}>
                    <div className="flex items-center space-x-5">
                       <img src={d.photoUrl || 'https://via.placeholder.com/80'} className="w-16 h-16 rounded-[1.5rem] object-cover border border-gray-800" />
                       <div className="flex-1">
                          <p className="text-white font-black flex items-center gap-1">
                              {d.name}
                              {d.isPriority && <span className="text-yellow-500 text-xs" title="Motorista Prioritário">★</span>}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">{d.phone}</p>
                          
                          <div className="flex gap-2 mt-2">
                              <button onClick={() => onUpdateUser({...d, isApproved: !d.isApproved})} className={`text-[8px] font-black px-3 py-1 rounded-full uppercase flex-1 ${d.isApproved ? 'bg-red-900/20 text-red-500' : 'bg-green-600 text-white'}`}>{d.isApproved ? 'Suspender' : 'Aprovar'}</button>
                              <button onClick={() => onUpdateUser({...d, isPriority: !d.isPriority})} className={`text-[8px] font-black px-3 py-1 rounded-full uppercase flex-1 ${d.isPriority ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                                 {d.isPriority ? '★ VIP' : '☆ Normal'}
                              </button>
                          </div>
                       </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                       <p className="text-[9px] font-black text-gray-600 uppercase">Viatura</p>
                       <p className="text-xs text-white font-bold">{d.vehicleModel} ({d.vehicleNumber})</p>
                    </div>
                    <button onClick={() => window.open(d.licenseUrl, '_blank')} className="w-full py-3 bg-gray-900 border border-gray-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white">Ver Carta Condução</button>
                 </div>
               ))}
             </div>
           )}
           
           {userSubTab === 'PASSENGERS' && (
              <div className="overflow-hidden rounded-[2.5rem] border border-gray-800">
                 <table className="w-full text-left bg-gray-950">
                    <thead className="bg-gray-900 text-[9px] font-black text-gray-500 uppercase">
                       <tr><th className="p-4">Nome</th><th className="p-4">Telefone</th><th className="p-4">Email</th></tr>
                    </thead>
                    <tbody className="text-xs text-gray-400">
                       {passengers.map(p => (
                          <tr key={p.id} className="border-t border-gray-800">
                             <td className="p-4 font-bold text-white">{p.name}</td>
                             <td className="p-4">{p.phone}</td>
                             <td className="p-4">{p.email}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}
        </div>
      )}

      {/* --- ABA DE RELATÓRIOS (Mantida) --- */}
      {activeTab === 'REPORTS' && (
        <div className="bg-gray-900 p-10 rounded-[3rem] border border-gray-800 space-y-10 animate-in slide-in-from-bottom-4">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                 <h3 className="text-3xl font-black text-white">Relatório Mensal</h3>
                 <p className="text-gray-500 text-sm mt-1">Dados financeiros e operacionais.</p>
              </div>
              <div className="flex items-center space-x-4">
                 <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={inputClass} />
                 <div className="flex items-center space-x-3 bg-gray-950 px-5 py-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] font-black text-gray-500 uppercase">Taxa:</span>
                    <input type="number" value={revenueShare} onChange={e => setRevenueShare(parseInt(e.target.value))} className="w-12 bg-transparent text-sm font-black text-blue-400 outline-none" />
                    <span className="text-sm text-gray-500">%</span>
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto rounded-[2.5rem] border border-gray-800">
              <table className="w-full text-left border-collapse bg-gray-950/30">
                 <thead>
                    <tr className="border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-900/50">
                       <th className="py-5 px-6">Tipo</th>
                       <th className="py-5 px-6">Rota</th>
                       <th className="py-5 px-6">Total</th>
                       <th className="py-5 px-6">Lucro ({revenueShare}%)</th>
                       <th className="py-5 px-6">Motorista</th>
                    </tr>
                 </thead>
                 <tbody className="text-xs">
                    {filteredTrips.map(t => (
                      <tr key={t.id} className="border-b border-gray-800/30">
                         <td className="py-5 px-6 text-blue-500 font-bold">Viagem</td>
                         <td className="py-5 px-6 text-white">{t.origin} ➜ {t.destination}</td>
                         <td className="py-5 px-6 text-white">{t.price} MZN</td>
                         <td className="py-5 px-6 text-green-500 font-bold">{(t.price * revenueShare / 100).toFixed(2)}</td>
                         <td className="py-5 px-6 text-gray-400">{users.find(u => u.id === t.driverId)?.name || '-'}</td>
                      </tr>
                    ))}
                    {packages.filter(p => p.status === 'PAID').map(p => (
                      <tr key={p.id} className="border-b border-gray-800/30">
                         <td className="py-5 px-6 text-orange-500 font-bold">Carga</td>
                         <td className="py-5 px-6 text-white">{p.origin} ➜ {p.destination}</td>
                         <td className="py-5 px-6 text-white">{p.price} MZN</td>
                         <td className="py-5 px-6 text-green-500 font-bold">{(p.price * revenueShare / 100).toFixed(2)}</td>
                         <td className="py-5 px-6 text-gray-400">{users.find(u => u.id === p.driverId)?.name || '-'}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           <button onClick={() => window.print()} className="w-full bg-gray-950 text-white border border-gray-800 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800">Imprimir Relatório</button>
        </div>
      )}
    </div>
  );
};

export default AdminArea;
