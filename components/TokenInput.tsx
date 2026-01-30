
import React, { useState, useEffect } from 'react';

interface TokenInputProps {
  onSetToken: (token: string, proxy: string) => void;
}

export const TokenInput: React.FC<TokenInputProps> = ({ onSetToken }) => {
  const [token, setToken] = useState('');
  const [proxy, setProxy] = useState('https://cors-anywhere.herokuapp.com/');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorType, setErrorType] = useState<'permission' | 'invalid' | null>(null);

  // Validação simples: Tokens do Supabase geralmente começam com 'sbp_'
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
          // Limpa o erro após alguns segundos
          setTimeout(() => setErrorType(null), 4000);
        }
      }
    } catch (err) {
      console.error('Falha ao ler área de transferência:', err);
      setErrorType('permission');
      setTimeout(() => setErrorType(null), 3000);
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
          <p className="text-gray-400 text-sm font-medium">Gerencie seus projetos e backups via API.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5">Access Token (sbp_...)</label>
            <div className="relative group">
              <input
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (errorType === 'invalid' && isValidFormat(e.target.value)) setErrorType(null);
                }}
                placeholder="Cole seu Access Token"
                className={`w-full bg-gray-900 border ${errorType ? 'border-red-500/50' : 'border-gray-800'} text-white pl-4 pr-24 py-3.5 rounded-xl focus:ring-2 ${errorType === 'invalid' ? 'focus:ring-red-500' : 'focus:ring-emerald-500'} outline-none transition-all text-base placeholder:text-gray-700`}
              />
              <button
                type="button"
                onClick={handlePaste}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg border transition-all uppercase tracking-tighter text-[10px] font-black flex items-center gap-1.5 ${
                  errorType 
                    ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                }`}
              >
                {errorType === 'permission' ? 'Use Ctrl+V' : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Colar
                  </>
                )}
              </button>
            </div>
            
            {errorType === 'invalid' && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-bounce">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider leading-tight">
                  Token Inválido! O token deve começar com <span className="underline">sbp_</span>
                </p>
              </div>
            )}

            {errorType === 'permission' && (
              <p className="text-[10px] text-red-400 mt-2 font-bold uppercase tracking-wider animate-pulse text-center">
                Acesso bloqueado pelo navegador. Use o teclado.
              </p>
            )}
          </div>

          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Configuração de Proxy</span>
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
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-emerald-500"
              />
            ) : (
              <p className="text-[11px] text-gray-600 truncate font-mono">{proxy || 'Sem Proxy'}</p>
            )}
            
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <p className="text-[10px] text-emerald-400/80 leading-snug font-medium">
                <strong>Dica:</strong> O token é gerado em <i>Account Settings &gt; Access Tokens</i> no painel do Supabase.
              </p>
            </div>
          </div>
          
          <button
            type="submit"
            className={`w-full mt-2 text-white font-black py-4 rounded-xl shadow-xl transition-all active:scale-[0.98] text-lg uppercase tracking-tight ${
              token.length > 0 && !isValidFormat(token)
                ? 'bg-gray-800 cursor-not-allowed opacity-50'
                : 'supabase-gradient hover:brightness-110 shadow-emerald-500/10'
            }`}
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
