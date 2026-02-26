
import React, { useState, useEffect } from 'react';

interface TokenInputProps {
  onSetToken: (token: string, proxy: string) => void;
}

export const TokenInput: React.FC<TokenInputProps> = ({ onSetToken }) => {
  const [token, setToken] = useState('');
  const [proxy, setProxy] = useState('https://cors-anywhere.herokuapp.com/');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorType, setErrorType] = useState<'permission' | 'invalid' | 'proxy' | null>(null);

  const isValidFormat = (t: string) => t.trim().startsWith('sbp_');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    if (isValidFormat(token)) {
      onSetToken(token.trim(), proxy.trim());
    } else {
      setErrorType('invalid');
      setTimeout(() => setErrorType(null), 4000);
    }
  };

  const handlePaste = async () => {
    setErrorType(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleanText = text.trim();
        setToken(cleanText);
        if (!isValidFormat(cleanText)) {
          setErrorType('invalid');
          setTimeout(() => setErrorType(null), 4000);
        }
      }
    } catch (err) {
      setErrorType('permission');
      setTimeout(() => setErrorType(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0d1117] font-sans">
      <div className="glass-card max-w-md w-full p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-800 mb-6 relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-16 h-16 supabase-gradient rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-emerald-500/20">
            S
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Conectar Supabase</h2>
          <p className="text-gray-400 text-sm font-medium">Gerencie seus projetos e backups via API.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5">Access Token (sbp_...)</label>
            <div className="relative group">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole seu Access Token"
                className={`w-full bg-gray-900 border ${errorType ? 'border-red-500/50' : 'border-gray-800'} text-white pl-4 pr-24 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-base placeholder:text-gray-700`}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-lg transition-all uppercase tracking-tighter text-[10px] font-black"
              >
                Colar
              </button>
            </div>
            
            {errorType === 'invalid' && (
              <p className="mt-2 text-[10px] text-red-500 font-bold uppercase tracking-wider animate-pulse">Token Inválido! Use o formato sbp_...</p>
            )}
          </div>

          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Status do Proxy</span>
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:brightness-125"
              >
                {showAdvanced ? 'Recolher' : 'Editar'}
              </button>
            </div>
            
            {showAdvanced ? (
              <input
                type="text"
                value={proxy}
                onChange={(e) => setProxy(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-emerald-500 font-mono"
              />
            ) : (
              <p className="text-[11px] text-gray-600 truncate font-mono">{proxy || 'Sem Proxy'}</p>
            )}
            
            {proxy.includes('cors-anywhere.herokuapp.com') && (
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <p className="text-[9px] text-blue-400 leading-snug font-medium mb-2">
                  <strong>IMPORTANTE:</strong> Se o login falhar, você deve ativar o proxy clicando no link abaixo:
                </p>
                <a 
                  href="https://cors-anywhere.herokuapp.com/opt-in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-500 text-white text-[9px] font-black px-3 py-1.5 rounded uppercase tracking-widest hover:brightness-110"
                >
                  Ativar Acesso Temporário
                </a>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full mt-2 text-white font-black py-4 rounded-xl shadow-xl transition-all active:scale-[0.98] text-lg uppercase tracking-tight supabase-gradient hover:brightness-110 shadow-emerald-500/10"
          >
            Entrar no Painel
          </button>
        </form>
      </div>

      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#161b22]/40 backdrop-blur-md border border-emerald-500/5 opacity-40 hover:opacity-100 transition-all group">
         <span className="text-emerald-500 font-bold text-xs tracking-tighter leading-none select-none">
           &lt;/&gt;
         </span>
         <span className="text-white text-[8px] font-black uppercase tracking-[0.3em]">
           POR ADRIANO CAFFÉ
         </span>
      </div>
    </div>
  );
};
