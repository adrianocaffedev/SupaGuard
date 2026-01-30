
import React, { useState } from 'react';
import { Backup, Table } from '../types';
import { supabaseApi } from '../services/supabaseService';

interface BackupListProps {
  backups: Backup[];
  tables: Table[];
  projectRef: string;
  token: string;
  proxy: string;
}

export const BackupList: React.FC<BackupListProps> = ({ backups, tables, projectRef, token, proxy }) => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState('');

  const handleSqlDataBackup = async () => {
    if (tables.length === 0) {
      alert("⚠️ Nenhuma tabela encontrada no esquema público.");
      return;
    }

    setExporting(true);
    setProgress(0);
    let sqlOutput = `-- SUPAGUARD SQL DATA EXPORT\n-- PROJECT: ${projectRef}\n\n`;

    try {
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        setCurrentTable(table.name);
        
        const query = `SELECT * FROM "${table.schema}"."${table.name}" LIMIT 5000`;
        try {
          const rows = await supabaseApi.executeSql(token, projectRef, query, proxy);
          if (rows && rows.length > 0) {
            const columns = Object.keys(rows[0]);
            sqlOutput += `-- Tabela: ${table.name}\n`;
            rows.forEach(row => {
              const vals = columns.map(c => {
                const v = row[c];
                if (v === null) return 'NULL';
                if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                return String(v);
              });
              sqlOutput += `INSERT INTO "${table.name}" ("${columns.join('", "')}") VALUES (${vals.join(', ')});\n`;
            });
            sqlOutput += '\n';
          }
        } catch (e) {
          console.error(`Falha ao exportar tabela ${table.name}:`, e);
        }
        
        setProgress(Math.round(((i + 1) / tables.length) * 100));
      }

      const blob = new Blob([sqlOutput], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_backup_${projectRef}.sql`;
      link.click();
      URL.revokeObjectURL(url);
      
      alert("✅ Backup SQL de dados concluído!");
    } catch (err) {
      alert("❌ Erro no backup: " + (err instanceof Error ? err.message : 'Erro'));
    } finally {
      setExporting(false);
      setCurrentTable('');
    }
  };

  const handleStructureBackup = async () => {
    setExporting(true);
    setCurrentTable('Extraindo Estrutura (DDL)...');
    try {
      const ddlQuery = `
        SELECT 
          'CREATE TABLE IF NOT EXISTS public."' || table_name || '" (' || 
          string_agg('"' || column_name || '" ' || data_type || CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, ', ') || 
          ');' as ddl
        FROM information_schema.columns
        WHERE table_schema = 'public'
        GROUP BY table_name;
      `;
      const results = await supabaseApi.executeSql(token, projectRef, ddlQuery, proxy);
      const sqlContent = results.map(r => r.ddl).join('\n\n');
      
      const blob = new Blob([sqlContent], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schema_${projectRef}.sql`;
      link.click();
      URL.revokeObjectURL(url);
      alert("✅ Estrutura exportada em .SQL");
    } catch (e) {
      alert("Erro ao exportar estrutura: " + (e instanceof Error ? e.message : 'Erro'));
    } finally {
      setExporting(false);
      setCurrentTable('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div>
            <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7a2 2 0 012-2h12a2 2 0 012 2M4 7l8 5 8-5" /></svg>
            </div>
            <h3 className="text-lg md:text-xl font-black text-white mb-2 uppercase tracking-tight">Exportar Dados (.SQL)</h3>
            <p className="text-[11px] md:text-sm text-gray-400 mb-6">Gera comandos INSERT para restaurar seus registros via SQL Editor.</p>
          </div>
          <button 
            onClick={handleSqlDataBackup}
            disabled={exporting}
            className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs tracking-widest uppercase bg-emerald-500 text-white hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {exporting ? 'Exportando...' : 'Baixar Dados SQL'}
          </button>
        </div>

        <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 border border-blue-500/30 bg-blue-500/5 relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div>
            <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <h3 className="text-lg md:text-xl font-black text-white mb-2 uppercase tracking-tight">Estrutura (.SQL)</h3>
            <p className="text-[11px] md:text-sm text-gray-400 mb-6">Apenas os comandos CREATE TABLE das tabelas públicas.</p>
          </div>
          <button 
            onClick={handleStructureBackup}
            disabled={exporting}
            className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs tracking-widest uppercase bg-blue-500 text-white hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {exporting ? 'Exportando...' : 'Baixar Estrutura'}
          </button>
        </div>
      </div>

      {exporting && (
        <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-800 bg-gray-900/40">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm md:text-lg font-bold text-white">Extraindo: <span className="font-mono text-emerald-500">{currentTable}</span></h4>
            <span className="text-xl md:text-2xl font-black text-white">{progress}%</span>
          </div>
          <div className="w-full h-2 md:h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};
