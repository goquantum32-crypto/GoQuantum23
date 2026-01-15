
import React from 'react';

interface LandingPageProps {
  onAction: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-white">
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in">
        Transporte Seguro em <span className="text-blue-400">Moçambique</span>
      </h1>
      <p className="text-xl md:text-2xl max-w-2xl mb-12 opacity-90 leading-relaxed">
        Viaje entre províncias com conforto ou envie as suas encomendas com a rapidez que o seu negócio exige.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <div className="glass-card p-8 rounded-2xl text-gray-800 hover:transform hover:-translate-y-2 transition-all duration-300">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </div>
          <h3 className="text-2xl font-bold mb-4">Passageiros</h3>
          <p className="mb-6 text-gray-600">Reserve o seu lugar nas melhores rotas interprovinciais.</p>
          <button onClick={onAction} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">Reservar Agora</button>
        </div>

        <div className="glass-card p-8 rounded-2xl text-gray-800 hover:transform hover:-translate-y-2 transition-all duration-300">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>
          <h3 className="text-2xl font-bold mb-4">Encomendas</h3>
          <p className="mb-6 text-gray-600">Envie cargas e encomendas para qualquer ponto da rota.</p>
          <button onClick={onAction} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">Enviar Encomenda</button>
        </div>

        <div className="glass-card p-8 rounded-2xl text-gray-800 hover:transform hover:-translate-y-2 transition-all duration-300">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h3 className="text-2xl font-bold mb-4">Motoristas</h3>
          <p className="mb-6 text-gray-600">Seja um parceiro GoQuantum e rentabilize as suas viagens.</p>
          <button onClick={onAction} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700">Trabalhar Conosco</button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
