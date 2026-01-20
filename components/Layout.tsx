
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfe] selection:bg-navy selection:text-white transition-all duration-500">
      <header className="bg-navy text-white sticky top-0 z-50 shadow-sm border-b border-white/5 px-6 md:px-12 py-4 backdrop-blur-xl bg-navy/95">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center text-center sm:text-left">
            <h1 className="text-base md:text-lg lg:text-xl font-normal tracking-wide uppercase">
              Consultoría en Propaganda. By Ricardo Rodríguez Inda
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-[1800px] mx-auto p-4 md:p-8 lg:p-12">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 text-center no-print">
        <p className="text-navy/40 text-[10px] font-normal uppercase tracking-widest">
          Consultoría en Propaganda. By Ricardo Rodríguez Inda. 2026.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
