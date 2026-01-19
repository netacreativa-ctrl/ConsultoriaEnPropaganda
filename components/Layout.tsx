
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-navy text-white py-6 px-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight">Consultoría de Propaganda</h1>
            <p className="text-sm opacity-80">By Ricardo Rodríguez Inda</p>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <span className="bg-white/10 px-3 py-1 rounded-full">Análisis Multimodal</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">IA Estratégica</span>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Consultoría de Propaganda. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Layout;
