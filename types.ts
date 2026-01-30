
export interface Organization {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  region: string;
  created_at: string;
  status: 'ACTIVE_HEALTHY' | 'RESTORING' | 'INIT_FAILED' | 'PAUSED';
}

export interface Backup {
  id: string;
  project_id: string;
  inserted_at: string;
  is_physical: boolean;
  status: string;
}

export interface TableColumn {
  name: string;
  format: string;
  data_type: string;
  is_nullable: boolean;
  is_identity: boolean;
}

export interface Table {
  id: number;
  name: string;
  schema: string;
  rowCount?: number;
  columns?: TableColumn[];
}

export interface AppState {
  token: string | null;
  proxyUrl: string;
  organizations: Organization[];
  projects: Project[];
  selectedProject: Project | null;
  backups: Backup[];
  tables: Table[];
  loading: boolean;
  error: string | null;
  activeView: 'dashboard' | 'explorer' | 'sql' | 'backup';
}
