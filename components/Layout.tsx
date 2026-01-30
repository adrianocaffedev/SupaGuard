
import React from 'react';
import { Organization } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  loading: boolean;
  organizations: Organization[];
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout, loading, organizations }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <nav className="glass-card sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between border-b border-gray-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 supabase-gradient rounded flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
            S
          </div>
          <span className="text-lg font-bold tracking-tight text-white hidden sm:inline">SupaGuard <span className="text-emerald-500 font-light">Pro</span></span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {organizations && organizations.length > 0 && (
            <span className="hidden md:inline-block bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700 text-[10px] font-bold text-gray-400 uppercase">
              {organizations[0].name}
            </span>
          )}
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
          )}
          <button 
            onClick={onLogout}
            className="text-[10px] md:text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-700"
          >
            <span className="hidden xs:inline">Sair</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
          </button>
        </div>
      </nav>
      
      <main className="flex-grow pb-10">
        {children}
      </main>

      <footer className="py-10 border-t border-gray-800/20 flex flex-col items-center gap-5">
        {/* Assinatura Minimalista e Leal ao Sistema */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#161b22]/40 backdrop-blur-md border border-emerald-500/10 transition-all hover:border-emerald-500/30 group cursor-default shadow-sm">
           <span className="text-emerald-500 font-bold text-xs tracking-tighter leading-none select-none">
             &lt;/&gt;
           </span>
           <span className="text-white text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">
             POR ADRIANO CAFFÉ
           </span>
        </div>

        <div className="text-[7px] text-gray-700 uppercase tracking-[0.4em] font-bold">
           SUPAGUARD CORE • INFRASTRUCTURE
        </div>
      </footer>
    </div>
  );
};
