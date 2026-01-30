
import React, { useState } from 'react';

interface TokenInputProps {
  onSetToken: (token: string, proxy: string) => void;
}

export const TokenInput: React.FC<TokenInputProps> = ({ onSetToken }) => {
  const [token, setToken] = useState('');
  const [proxy, setProxy] = useState('https://cors-anywhere.herokuapp.com/');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onSetToken(token.trim(), proxy.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0d1117] font-sans">
      <div className="glass-card max-w-md w-full p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-800 mb-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 supabase-gradient rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-emerald-500/20">
            S
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Conectar Supabase</h2>
          <p className="text-gray-400 text-sm">Gerencie seus projetos e backups via API.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Access Token (sbp_...)</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole seu Access Token"
              className="w-full bg-gray-900 border border-gray-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base"
            />
          </div>

          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase">Configuração de Proxy</span>
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-emerald-500 text-[10px] font-bold uppercase"
              >
                {showAdvanced ? 'Recolher' : 'Editar'}
              </button>
            </div>
            
            {showAdvanced ? (
              <input
                type="text"
                value={proxy}
                onChange={(e) => setProxy(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-xs px-3 py-2 rounded-lg"
              />
            ) : (
              <p className="text-[11px] text-gray-500 truncate">{proxy || 'Sem Proxy'}</p>
            )}
            
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <p className="text-[10px] text-emerald-400 leading-tight">
                <strong>Dica:</strong> Se usar o proxy padrão, ative o acesso em <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" rel="noopener noreferrer" className="underline font-bold">cors-anywhere</a>.
              </p>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full mt-2 supabase-gradient hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] text-lg"
          >
            Entrar no Painel
          </button>
        </form>
      </div>

      {/* Assinatura Minimalista Esmeralda no Login */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b22]/30 border border-emerald-500/5 opacity-40 hover:opacity-100 transition-all group">
         <span className="text-emerald-500 font-bold text-[10px] tracking-tighter">&lt;/&gt;</span>
         <span className="text-white text-[7px] font-black uppercase tracking-[0.3em]">POR ADRIANO CAFFÉ</span>
      </div>
    </div>
  );
};
