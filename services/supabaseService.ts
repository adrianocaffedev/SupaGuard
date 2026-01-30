
import { Organization, Project, Backup, Table } from '../types';

const BASE_URL = 'https://api.supabase.com/v1';

const handleResponse = async (res: Response, context: string) => {
  if (res.ok) return res.json();
  
  if (res.status === 401) throw new Error(`Não Autorizado (401): Seu token sbp_... é inválido.`);
  if (res.status === 403) throw new Error(`Acesso Negado (403): O token não tem permissão para ${context}.`);
  if (res.status === 404) throw new Error(`O recurso ${context} não está disponível para o seu tipo de projeto (404).`);
  
  const errorData = await res.json().catch(() => ({}));
  throw new Error(`${context} falhou (${res.status}): ${errorData.message || res.statusText}`);
};

export const supabaseApi = {
  getOrganizations: async (token: string, proxy: string = ''): Promise<Organization[]> => {
    try {
      const url = `${proxy}${BASE_URL}/organizations`;
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });
      return handleResponse(res, 'Organizações');
    } catch (err) {
      console.error('Fetch error:', err);
      throw new Error('Erro de Conexão: O navegador ou o Proxy bloqueou a requisição.');
    }
  },

  getProjects: async (token: string, proxy: string = ''): Promise<Project[]> => {
    const url = `${proxy}${BASE_URL}/projects`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(res, 'Projetos');
  },

  getBackups: async (token: string, projectRef: string, proxy: string = ''): Promise<Backup[]> => {
    try {
      const url = `${proxy}${BASE_URL}/projects/${projectRef}/backups`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  executeSql: async (token: string, projectRef: string, query: string, proxy: string = ''): Promise<any[]> => {
    const url = `${proxy}${BASE_URL}/projects/${projectRef}/database/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    return handleResponse(res, 'Query SQL');
  },

  getTables: async (token: string, projectRef: string, proxy: string = ''): Promise<Table[]> => {
    // Forçamos a descoberta via SQL pois é mais confiável para listar tabelas reais
    try {
      const fallbackQuery = `
        SELECT 
          t.table_name as name, 
          t.table_schema as schema
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name ASC;
      `;
      const sqlResults = await supabaseApi.executeSql(token, projectRef, fallbackQuery, proxy);
      return sqlResults.map((r, idx) => ({ 
        id: idx + 1000, // ID artificial para evitar conflitos
        name: r.name, 
        schema: r.schema 
      }));
    } catch (e) {
      // Se SQL falhar, tenta a API oficial como última alternativa
      try {
        const url = `${proxy}${BASE_URL}/projects/${projectRef}/database/tables`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) return await res.json();
      } catch {}
      return [];
    }
  }
};
