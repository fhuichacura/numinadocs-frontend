import React from 'react';
import Sidebar from '../components/Sidebar';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      {/* Cambiamos max-w-screen-xl por una clase que permite más ancho */}
      <div 
        className="w-full h-[calc(100vh-4rem)] flex 
                   bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 
                   rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        style={{ maxWidth: '1600px' }} // Controla el ancho máximo
      >
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;