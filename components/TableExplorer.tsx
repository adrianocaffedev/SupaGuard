
import React, { useState } from 'react';
import { Table, TableColumn } from '../types';

interface TableExplorerProps {
  tables: Table[];
  loading: boolean;
}

export const TableExplorer: React.FC<TableExplorerProps> = ({ tables, loading }) => {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  return (
    <div className="flex flex-col md:grid md:grid-cols-4 gap-6">
      <div className="md:col-span-1 space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Suas Tabelas</h3>
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto gap-2 md:space-y-1 custom-scrollbar pb-2 md:pb-0">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              className={`flex-shrink-0 md:flex-shrink w-auto md:w-full text-left px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm transition-all flex items-center justify-between border whitespace-nowrap ${
                selectedTableId === table.id 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' 
                  : 'text-gray-400 border-transparent hover:bg-gray-800/50 bg-gray-900/20'
              }`}
            >
              <span className="truncate mr-3">{table.name}</span>
              <span className="text-[8px] md:text-[9px] font-bold bg-gray-800 px-1.5 py-0.5 rounded opacity-60">
                {table.rowCount !== undefined ? table.rowCount.toLocaleString() : '...'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-3">
        {selectedTable ? (
          <div className="glass-card rounded-xl md:rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
            <div className="bg-gray-800/30 px-5 md:px-6 py-4 md:py-5 flex items-center justify-between border-b border-gray-800">
              <h3 className="text-lg md:text-xl font-bold text-white truncate mr-4">{selectedTable.name}</h3>
              <div className="flex-shrink-0">
                <span className="bg-emerald-500/10 text-emerald-500 px-2 md:px-3 py-1 rounded text-[9px] md:text-[10px] font-bold uppercase whitespace-nowrap">
                  {selectedTable.rowCount?.toLocaleString()} LINHAS
                </span>
              </div>
            </div>
            
            {selectedTable.columns ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-900/50 text-[9px] md:text-[10px] text-gray-500 uppercase font-black">
                    <tr>
                      <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Coluna</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Tipo de Dado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/30">
                    {selectedTable.columns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-emerald-500/5">
                        <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-gray-200">{col.name}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-[10px] md:text-xs text-gray-500">{col.data_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500 italic text-xs md:text-sm">
                Colunas disponíveis via inspeção de schema SQL.
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-xl md:rounded-2xl p-10 md:p-16 text-center border-dashed border-2 border-gray-800 text-gray-600 text-xs md:text-sm">
            Clique em uma tabela à esquerda (ou acima) para ver detalhes.
          </div>
        )}
      </div>
    </div>
  );
};
