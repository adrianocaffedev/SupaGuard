
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppState, Project, Organization, Backup, Table } from './types';
import { supabaseApi } from './services/supabaseService';
import { Layout } from './components/Layout';
import { ProjectCard } from './components/ProjectCard';
import { BackupList } from './components/BackupList';
import { TokenInput } from './components/TokenInput';
import { TableExplorer } from './components/TableExplorer';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      return {
        token: localStorage.getItem('sb_token'),
        proxyUrl: localStorage.getItem('sb_proxy') || 'https://cors-anywhere.herokuapp.com/',
        organizations: [],
        projects: [],
        selectedProject: null,
        backups: [],
        tables: [],
        loading: false,
        error: null,
        activeView: 'dashboard',
      };
    } catch {
      return {
        token: null,
        proxyUrl: 'https://cors-anywhere.herokuapp.com/',
        organizations: [],
        projects: [],
        selectedProject: null,
        backups: [],
        tables: [],
        loading: false,
        error: null,
        activeView: 'dashboard',
      };
    }
  });

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM information_schema.tables WHERE table_schema = \'public\';');
  const [sqlResults, setSqlResults] = useState<any[] | null>(null);
  const [backupProgress, setBackupProgress] = useState<{active: boolean, percent: number, stage: string}>({active: false, percent: 0, stage: ''});

  const fetchData = useCallback(async (token: string, proxy: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [orgs, projs] = await Promise.all([
        supabaseApi.getOrganizations(token, proxy),
        supabaseApi.getProjects(token, proxy),
      ]);
      setState(prev => ({
        ...prev,
        organizations: orgs || [],
        projects: projs || [],
        loading: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Falha na conexão com a API',
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    if (state.token) {
      fetchData(state.token, state.proxyUrl);
    }
  }, [state.token, state.proxyUrl, fetchData]);

  const handleSetToken = (token: string, proxy: string) => {
    try {
      localStorage.setItem('sb_token', token);
      localStorage.setItem('sb_proxy', proxy);
    } catch (e) {}
    setState(prev => ({ ...prev, token, proxyUrl: proxy }));
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_proxy');
    } catch (e) {}
    setState({
      token: null,
      proxyUrl: 'https://cors-anywhere.herokuapp.com/',
      organizations: [],
      projects: [],
      selectedProject: null,
      backups: [],
      tables: [],
      loading: false,
      error: null,
      activeView: 'dashboard',
    });
  };

  const handleSelectProject = async (project: Project) => {
    if (!state.token) return;
    setState(prev => ({ ...prev, selectedProject: project, loading: true, tables: [], backups: [] }));
    try {
      const [backups, tables] = await Promise.all([
        supabaseApi.getBackups(state.token, project.id, state.proxyUrl),
        supabaseApi.getTables(state.token, project.id, state.proxyUrl),
      ]);
      
      const updatedTables = [...tables];
      for (const table of updatedTables) {
         try {
           const countResult = await supabaseApi.executeSql(state.token, project.id, `SELECT count(*) FROM "${table.schema}"."${table.name}"`, state.proxyUrl);
           if (countResult && countResult[0]) {
             table.rowCount = parseInt(countResult[0].count);
           }
         } catch (e) {
           table.rowCount = 0;
         }
      }

      setState(prev => ({ ...prev, backups, tables: updatedTables, loading: false }));
      generateAiInsight(project, updatedTables);
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Erro ao carregar projeto' }));
    }
  };

  const runFullSqlBackup = async () => {
    if (!state.token || !state.selectedProject || state.tables.length === 0) {
      alert("Nenhuma tabela encontrada para backup.");
      return;
    }
    
    setBackupProgress({active: true, percent: 0, stage: 'Iniciando extração SQL...'});
    let fullSqlScript = `-- BACKUP SUPAGUARD PRO\n-- PROJETO: ${state.selectedProject.name}\n-- DATA: ${new Date().toLocaleString()}\n\n`;

    try {
      setBackupProgress(p => ({...p, stage: 'Extraindo Estrutura (DDL)...'}));
      const ddlQuery = `
        SELECT 
          t.table_name,
          'CREATE TABLE IF NOT EXISTS public."' || t.table_name || '" (' || 
          string_agg('"' || c.column_name || '" ' || c.data_type || 
          CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, ', ') || 
          ');' as ddl
        FROM information_schema.tables t
        JOIN information_schema.columns c ON c.table_name = t.table_name
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_name;
      `;
      const ddlResults = await supabaseApi.executeSql(state.token, state.selectedProject.id, ddlQuery, state.proxyUrl);
      
      ddlResults.forEach(res => {
        fullSqlScript += `-- Estrutura da tabela ${res.table_name}\n${res.ddl}\n\n`;
      });

      for (let i = 0; i < state.tables.length; i++) {
        const table = state.tables[i];
        setBackupProgress({
          active: true, 
          percent: Math.round(((i + 1) / state.tables.length) * 100),
          stage: `Extraindo dados: ${table.name}...`
        });

        const dataQuery = `SELECT * FROM "${table.schema}"."${table.name}" LIMIT 5000`;
        const rows = await supabaseApi.executeSql(state.token, state.selectedProject.id, dataQuery, state.proxyUrl);

        if (rows && rows.length > 0) {
          fullSqlScript += `-- Dados da tabela ${table.name} (${rows.length} registros)\n`;
          const columns = Object.keys(rows[0]);
          
          rows.forEach(row => {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            fullSqlScript += `INSERT INTO public."${table.name}" ("${columns.join('", "')}") VALUES (${values.join(', ')});\n`;
          });
          fullSqlScript += '\n';
        }
      }

      const blob = new Blob([fullSqlScript], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supabase_backup_${state.selectedProject.name}_${new Date().toISOString().split('T')[0]}.sql`;
      link.click();
      URL.revokeObjectURL(url);
      
      alert("✅ Backup .SQL gerado com sucesso!");
    } catch (err) {
      alert("Erro ao gerar backup SQL: " + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setBackupProgress({active: false, percent: 0, stage: ''});
    }
  };

  const generateAiInsight = async (project: Project, tables: Table[]) => {
    setAnalyzing(true);
    setAiAnalysis('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const tableNames = tables.map(t => t.name).join(', ');
      const prompt = `Analise o projeto ${project.name} (${tableNames}). Dê um conselho curto de backup em Português (máximo 12 palavras).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiAnalysis(response.text || 'Insight indisponível.');
    } catch (error) {
      setAiAnalysis('Gemini AI offline.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!state.token) {
    return <TokenInput onSetToken={handleSetToken} />;
  }

  return (
    <Layout 
      onLogout={handleLogout} 
      loading={state.loading} 
      organizations={state.organizations}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <header className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-3xl font-black text-white mb-1 tracking-tight">Painel Operacional</h1>
              <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                PROJETO: <span className="text-emerald-500 font-mono">{state.selectedProject?.name || 'Aguardando Seleção'}</span>
              </p>
            </div>
            
            <div className="flex flex-wrap bg-gray-900/80 p-1 rounded-2xl border border-gray-800 w-full md:w-auto shadow-2xl">
              {['dashboard', 'backup', 'explorer', 'sql'].map((view) => (
                <button
                  key={view}
                  onClick={() => setState(prev => ({...prev, activeView: view as any}))}
                  className={`flex-1 px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-tighter md:tracking-widest transition-all ${state.activeView === view ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  {view === 'dashboard' ? 'Geral' : view === 'explorer' ? 'Tabelas' : view.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-2">Projetos Ativos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-2">
              {state.projects.map(p => (
                <ProjectCard 
                  key={p.id} 
                  project={p} 
                  isSelected={state.selectedProject?.id === p.id}
                  onClick={() => handleSelectProject(p)}
                />
              ))}
            </div>
          </aside>

          <section className="lg:col-span-3">
            {state.selectedProject ? (
              <div className="space-y-6">
                {state.activeView === 'dashboard' && (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl md:rounded-3xl p-5 md:p-10 border border-gray-800 shadow-2xl relative overflow-hidden">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-8 mb-8 md:mb-10">
                        <div className="flex-1 w-full">
                          <h2 className="text-2xl md:text-4xl font-black text-white mb-2 md:mb-3 tracking-tighter truncate">{state.selectedProject.name}</h2>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[9px] md:text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 md:px-3 py-1 rounded-full border border-emerald-500/20">{state.selectedProject.id}</span>
                            <span className="text-[9px] md:text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 md:px-3 py-1 rounded-full border border-blue-500/20">{state.selectedProject.region}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                           <button 
                            onClick={runFullSqlBackup}
                            disabled={backupProgress.active}
                            className={`w-full md:w-auto bg-emerald-500 text-white font-black text-xs px-6 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl shadow-2xl shadow-emerald-500/20 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${backupProgress.active ? 'opacity-50' : 'hover:brightness-110'}`}
                           >
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="text-[10px] md:text-xs">{backupProgress.active ? `PROCESSANDO...` : 'BAIXAR BACKUP (.SQL)'}</span>
                              </div>
                              {backupProgress.active && (
                                <span className="text-[8px] md:text-[9px] opacity-70 truncate max-w-[200px]">{backupProgress.stage}</span>
                              )}
                           </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
                        <div className="bg-gray-900/60 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-800/50">
                          <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase mb-3 md:mb-4 tracking-widest">Resumo do Banco</p>
                          <div className="space-y-3 md:space-y-4">
                             <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                                <span className="text-xs md:text-sm text-gray-400">Tabelas</span>
                                <span className="text-2xl md:text-3xl font-black text-white">{state.tables.length}</span>
                             </div>
                             <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                                <span className="text-xs md:text-sm text-gray-400">Registros</span>
                                <span className="text-2xl md:text-3xl font-black text-white">{state.tables.reduce((acc, t) => acc + (t.rowCount || 0), 0).toLocaleString()}</span>
                             </div>
                          </div>
                        </div>

                        <div className="bg-gray-900/60 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-800/50">
                          <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase mb-3 md:mb-4 tracking-widest">Tabelas Ativas</p>
                          <div className="flex flex-wrap gap-1.5 max-h-24 md:max-h-32 overflow-y-auto custom-scrollbar">
                             {state.tables.length > 0 ? state.tables.map(t => (
                               <span key={t.id} className="text-[9px] md:text-[10px] bg-emerald-500/5 text-emerald-400 px-2 md:px-3 py-1 rounded-lg border border-emerald-500/10 font-black">
                                 {t.name}
                               </span>
                             )) : (
                               <span className="text-xs text-gray-600 italic">Buscando schema...</span>
                             )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-start gap-4">
                        <div className="mt-1 text-emerald-500 flex-shrink-0">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                        </div>
                        <div>
                          <h3 className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest">Backup & Restauração</h3>
                          <p className="text-gray-300 text-xs md:text-sm font-medium leading-relaxed">
                            {analyzing ? "Gemini está analisando seu banco..." : aiAnalysis || "Aguardando dados para análise de segurança."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {state.activeView === 'backup' && (
                  <BackupList 
                    backups={state.backups} 
                    tables={state.tables}
                    projectRef={state.selectedProject.id}
                    token={state.token!}
                    proxy={state.proxyUrl}
                  />
                )}

                {state.activeView === 'explorer' && (
                  <TableExplorer tables={state.tables} loading={state.loading} />
                )}

                {state.activeView === 'sql' && (
                  <div className="glass-card rounded-2xl md:rounded-3xl p-5 md:p-8 border border-gray-800 space-y-6">
                    <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Console SQL</h2>
                    <textarea 
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full h-32 md:h-48 bg-gray-900/80 text-emerald-400 font-mono text-xs md:text-sm p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-800 outline-none focus:border-emerald-500/50"
                      placeholder="SELECT * FROM public.tabela LIMIT 10;"
                    />
                    <button 
                      onClick={async () => {
                         setState(s => ({...s, loading: true}));
                         try {
                           const res = await supabaseApi.executeSql(state.token!, state.selectedProject!.id, sqlQuery, state.proxyUrl);
                           setSqlResults(res);
                         } catch (e) { alert(e instanceof Error ? e.message : 'Erro'); }
                         finally { setState(s => ({...s, loading: false})); }
                      }}
                      className="w-full md:w-auto bg-emerald-500 text-white font-black text-[10px] md:text-xs px-8 md:px-10 py-4 rounded-xl md:rounded-2xl hover:brightness-110 active:scale-95"
                    >
                      EXECUTAR QUERY
                    </button>
                    {sqlResults && (
                      <div className="mt-8 overflow-x-auto border border-gray-800 rounded-xl md:rounded-2xl max-h-[400px]">
                        <table className="w-full text-left text-[10px] md:text-[11px] border-collapse">
                          <thead className="bg-gray-900 text-gray-500 font-bold uppercase sticky top-0">
                            <tr>{sqlResults.length > 0 && Object.keys(sqlResults[0]).map(k => <th key={k} className="px-4 py-3 border-b border-gray-800 whitespace-nowrap">{k}</th>)}</tr>
                          </thead>
                          <tbody>
                            {sqlResults.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-800/30">
                                {Object.values(row).map((v: any, j) => <td key={j} className="px-4 py-2 text-gray-300 border-b border-gray-800/30 truncate max-w-[150px] md:max-w-[200px]">{String(v)}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-2xl md:rounded-3xl p-10 md:p-20 text-center border-dashed border-2 border-gray-800 flex flex-col items-center gap-4 text-gray-500">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-900 rounded-xl md:rounded-2xl flex items-center justify-center">
                   <svg className="w-6 h-6 md:w-8 md:h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7a2 2 0 012-2h12a2 2 0 012 2M4 7l8 5 8-5" /></svg>
                </div>
                <p className="font-bold text-xs md:text-base">Selecione um projeto na lista lateral.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default App;
