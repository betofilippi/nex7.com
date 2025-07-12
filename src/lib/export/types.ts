export type ExportFormat = 'zip' | 'tar' | 'folder';
export type ExportTarget = 'download' | 'cloud' | 'docker' | 'standalone';
export type FrameworkType = 'next' | 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla';
export type CloudProvider = 'vercel' | 'netlify' | 'aws' | 'gcp' | 'azure';

export interface ExportOptions {
  format: ExportFormat;
  target: ExportTarget;
  includeAssets: boolean;
  includeData: boolean;
  includeDependencies: boolean;
  compression: boolean;
  minify: boolean;
  framework?: FrameworkType;
  cloudProvider?: CloudProvider;
  customConfig?: Record<string, any>;
}

export interface ProjectExportData {
  projectId: string;
  name: string;
  description?: string;
  version: string;
  createdAt: Date;
  settings: Record<string, any>;
  components: ComponentData[];
  pages: PageData[];
  assets: AssetData[];
  dependencies: DependencyData[];
  database?: DatabaseSchema;
  api?: APIDefinition[];
}

export interface ComponentData {
  id: string;
  name: string;
  type: string;
  code: string;
  props: PropertyDefinition[];
  dependencies: string[];
  category: string;
  metadata: Record<string, any>;
}

export interface PageData {
  id: string;
  path: string;
  name: string;
  layout?: string;
  components: string[];
  metadata: Record<string, any>;
  seo?: SEOData;
}

export interface AssetData {
  id: string;
  name: string;
  type: 'image' | 'font' | 'video' | 'audio' | 'document' | 'other';
  url: string;
  size: number;
  mimeType: string;
  metadata: Record<string, any>;
}

export interface DependencyData {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
  description?: string;
}

export interface DatabaseSchema {
  tables: TableSchema[];
  relations: RelationSchema[];
  indexes: IndexSchema[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primaryKey: string[];
  constraints: ConstraintSchema[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  unique: boolean;
  autoIncrement: boolean;
}

export interface RelationSchema {
  name: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface IndexSchema {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
}

export interface ConstraintSchema {
  name: string;
  type: 'primary' | 'foreign' | 'unique' | 'check';
  columns: string[];
  reference?: {
    table: string;
    columns: string[];
  };
}

export interface APIDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  parameters: ParameterDefinition[];
  requestBody?: SchemaDefinition;
  responses: ResponseDefinition[];
  middleware: string[];
}

export interface ParameterDefinition {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  schema: SchemaDefinition;
  description?: string;
}

export interface SchemaDefinition {
  type: string;
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  example?: any;
}

export interface ResponseDefinition {
  status: number;
  description: string;
  schema?: SchemaDefinition;
  headers?: Record<string, SchemaDefinition>;
}

export interface PropertyDefinition {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
  robots?: string;
}

export interface ExportProgress {
  stage: 'preparing' | 'collecting' | 'generating' | 'packaging' | 'uploading' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentFile?: string;
  error?: string;
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  deployUrl?: string;
  containerImage?: string;
  size: number;
  files: string[];
  metadata: Record<string, any>;
  error?: string;
}

export interface DockerConfig {
  baseImage: string;
  workdir: string;
  expose: number[];
  env: Record<string, string>;
  volumes: string[];
  commands: string[];
  entrypoint: string[];
}

export interface DeploymentConfig {
  provider: CloudProvider;
  region?: string;
  domain?: string;
  environment: Record<string, string>;
  buildCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
  features?: string[];
}