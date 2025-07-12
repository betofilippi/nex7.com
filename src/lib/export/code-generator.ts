import { ComponentData, PageData, APIDefinition, DatabaseSchema, ExportOptions } from './types';

export class CodeGenerator {
  async generateComponent(component: ComponentData, options: ExportOptions): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    
    // Generate main component file
    const componentCode = this.generateComponentCode(component, options);
    files[`src/components/${component.name}.tsx`] = componentCode;
    
    // Generate component types if needed
    if (component.props.length > 0) {
      const typesCode = this.generateComponentTypes(component);
      files[`src/types/${component.name}.types.ts`] = typesCode;
    }
    
    // Generate component styles if needed
    if (component.metadata.hasStyles) {
      const stylesCode = this.generateComponentStyles(component);
      files[`src/styles/${component.name}.module.css`] = stylesCode;
    }
    
    // Generate component tests
    const testCode = this.generateComponentTest(component);
    files[`src/components/__tests__/${component.name}.test.tsx`] = testCode;
    
    return files;
  }

  async generatePage(page: PageData, components: ComponentData[]): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    
    // Generate page component
    const pageCode = this.generatePageCode(page, components);
    files[`src/pages/${page.path.replace(/^\//, '') || 'index'}.tsx`] = pageCode;
    
    // Generate page metadata
    if (page.seo) {
      const metadataCode = this.generatePageMetadata(page);
      files[`src/metadata/${page.name}.meta.ts`] = metadataCode;
    }
    
    return files;
  }

  async generateAPI(apiDefinitions: APIDefinition[]): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    
    for (const api of apiDefinitions) {
      const apiCode = this.generateAPICode(api);
      const fileName = this.getAPIFileName(api);
      files[`src/api/${fileName}`] = apiCode;
    }
    
    // Generate API types
    const apiTypes = this.generateAPITypes(apiDefinitions);
    files['src/types/api.types.ts'] = apiTypes;
    
    // Generate API client
    const apiClient = this.generateAPIClient(apiDefinitions);
    files['src/lib/api-client.ts'] = apiClient;
    
    return files;
  }

  async generateDatabase(schema: DatabaseSchema): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    
    // Generate database schema
    const schemaCode = this.generateDatabaseSchema(schema);
    files['src/db/schema.ts'] = schemaCode;
    
    // Generate migrations
    const migrationCode = this.generateMigrations(schema);
    files['src/db/migrations/001_initial.sql'] = migrationCode;
    
    // Generate ORM models
    for (const table of schema.tables) {
      const modelCode = this.generateModel(table);
      files[`src/models/${table.name}.ts`] = modelCode;
    }
    
    return files;
  }

  private generateComponentCode(component: ComponentData, options: ExportOptions): string {
    const hasProps = component.props.length > 0;
    const propsInterface = hasProps ? `${component.name}Props` : '';
    const propsImport = hasProps ? `import { ${propsInterface} } from '../types/${component.name}.types';` : '';
    
    const imports = [
      "import React from 'react';",
      propsImport,
      ...component.dependencies.map(dep => `import ${dep} from '${dep}';`),
    ].filter(Boolean).join('\n');
    
    const propsType = hasProps ? `: ${propsInterface}` : '';
    const propsDestructuring = hasProps 
      ? `{ ${component.props.map(p => p.name).join(', ')} }`
      : '';
    
    return `${imports}

export function ${component.name}(${propsDestructuring}${propsType}) {
  return (
    <div className="${component.name.toLowerCase()}">
      {/* Generated component content */}
      <h2>{/* Add your component content here */}</h2>
    </div>
  );
}

export default ${component.name};`;
  }

  private generateComponentTypes(component: ComponentData): string {
    const propsInterface = component.props.map(prop => {
      const optional = prop.required ? '' : '?';
      const defaultValue = prop.default !== undefined ? ` // Default: ${JSON.stringify(prop.default)}` : '';
      return `  ${prop.name}${optional}: ${prop.type};${defaultValue}`;
    }).join('\n');

    return `export interface ${component.name}Props {
${propsInterface}
}`;
  }

  private generateComponentStyles(component: ComponentData): string {
    return `.${component.name.toLowerCase()} {
  /* Component styles */
  display: block;
}

.${component.name.toLowerCase()}__title {
  font-size: 1.5rem;
  font-weight: bold;
}`;
  }

  private generateComponentTest(component: ComponentData): string {
    return `import { render, screen } from '@testing-library/react';
import ${component.name} from '../${component.name}';

describe('${component.name}', () => {
  it('renders correctly', () => {
    render(<${component.name} />);
    expect(screen.getByText(/add your component content here/i)).toBeInTheDocument();
  });
});`;
  }

  private generatePageCode(page: PageData, components: ComponentData[]): string {
    const usedComponents = components.filter(c => page.components.includes(c.id));
    const imports = usedComponents.map(c => 
      `import ${c.name} from '../components/${c.name}';`
    ).join('\n');

    const componentUsage = usedComponents.map(c => 
      `        <${c.name} />`
    ).join('\n');

    return `import React from 'react';
${imports}

export default function ${page.name}() {
  return (
    <div className="page">
      <h1>${page.name}</h1>
${componentUsage}
    </div>
  );
}`;
  }

  private generatePageMetadata(page: PageData): string {
    if (!page.seo) return '';

    return `export const metadata = {
  title: '${page.seo.title}',
  description: '${page.seo.description}',
  keywords: ${JSON.stringify(page.seo.keywords)},
  ${page.seo.ogImage ? `openGraph: { images: ['${page.seo.ogImage}'] },` : ''}
  ${page.seo.canonical ? `alternates: { canonical: '${page.seo.canonical}' },` : ''}
  ${page.seo.robots ? `robots: '${page.seo.robots}',` : ''}
};`;
  }

  private generateAPICode(api: APIDefinition): string {
    const method = api.method.toLowerCase();
    const handlerName = `${method}Handler`;
    
    const paramValidation = api.parameters
      .filter(p => p.required)
      .map(p => `    if (!${p.name}) throw new Error('${p.name} is required');`)
      .join('\n');

    return `import { NextRequest, NextResponse } from 'next/server';

export async function ${method.toUpperCase()}(request: NextRequest) {
  try {
    ${paramValidation}
    
    // TODO: Implement your API logic here
    
    return NextResponse.json({ 
      message: 'API endpoint ${api.path} (${api.method}) not implemented yet' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}`;
  }

  private getAPIFileName(api: APIDefinition): string {
    // Convert path to filename
    const path = api.path.replace(/^\/api\//, '').replace(/\[(\w+)\]/g, '[...$1]');
    return path ? `${path}/route.ts` : 'route.ts';
  }

  private generateAPITypes(apiDefinitions: APIDefinition[]): string {
    let types = '// Generated API Types\n\n';
    
    const schemas = new Set<string>();
    
    apiDefinitions.forEach(api => {
      if (api.requestBody) {
        const typeName = this.getTypeNameFromPath(api.path) + 'Request';
        types += this.generateTypeFromSchema(typeName, api.requestBody);
        schemas.add(typeName);
      }
      
      api.responses.forEach(response => {
        if (response.schema) {
          const typeName = this.getTypeNameFromPath(api.path) + `Response${response.status}`;
          types += this.generateTypeFromSchema(typeName, response.schema);
          schemas.add(typeName);
        }
      });
    });
    
    return types;
  }

  private generateAPIClient(apiDefinitions: APIDefinition[]): string {
    const methods = apiDefinitions.map(api => {
      const methodName = this.getMethodNameFromPath(api.path, api.method);
      const pathWithParams = api.path.replace(/\{(\w+)\}/g, '${$1}');
      
      return `  async ${methodName}(${this.generateMethodParams(api)}) {
    const response = await fetch(\`\${this.baseUrl}${pathWithParams}\`, {
      method: '${api.method}',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      ${api.method !== 'GET' && api.requestBody ? 'body: JSON.stringify(data),' : ''}
    });
    
    if (!response.ok) {
      throw new Error(\`API error: \${response.statusText}\`);
    }
    
    return response.json();
  }`;
    }).join('\n\n');

    return `class APIClient {
  private baseUrl: string;
  private headers: Record<string, string> = {};

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.headers['Authorization'] = \`Bearer \${token}\`;
  }

${methods}
}

export const apiClient = new APIClient();`;
  }

  private generateDatabaseSchema(schema: DatabaseSchema): string {
    const tables = schema.tables.map(table => {
      const columns = table.columns.map(col => {
        const nullable = col.nullable ? '.nullable()' : '';
        const defaultValue = col.default !== undefined ? `.default(${JSON.stringify(col.default)})` : '';
        const unique = col.unique ? '.unique()' : '';
        
        return `    ${col.name}: ${this.mapDatabaseType(col.type)}${nullable}${defaultValue}${unique},`;
      }).join('\n');

      return `export const ${table.name} = {
${columns}
};`;
    }).join('\n\n');

    return `// Generated Database Schema

${tables}`;
  }

  private generateMigrations(schema: DatabaseSchema): string {
    const createTables = schema.tables.map(table => {
      const columns = table.columns.map(col => {
        const nullable = col.nullable ? '' : ' NOT NULL';
        const defaultValue = col.default !== undefined ? ` DEFAULT ${this.formatSQLValue(col.default)}` : '';
        const unique = col.unique ? ' UNIQUE' : '';
        
        return `    ${col.name} ${this.mapSQLType(col.type)}${nullable}${defaultValue}${unique}`;
      }).join(',\n');

      const primaryKey = table.primaryKey.length > 0 
        ? `,\n    PRIMARY KEY (${table.primaryKey.join(', ')})`
        : '';

      return `CREATE TABLE ${table.name} (
${columns}${primaryKey}
);`;
    }).join('\n\n');

    return `-- Generated Database Migration

${createTables}`;
  }

  private generateModel(table: any): string {
    const fields = table.columns.map((col: any) => {
      const optional = col.nullable ? '?' : '';
      return `  ${col.name}${optional}: ${this.mapTypeScriptType(col.type)};`;
    }).join('\n');

    return `export interface ${this.capitalize(table.name)} {
${fields}
}

export class ${this.capitalize(table.name)}Model {
  // TODO: Implement model methods
  
  static async findById(id: string): Promise<${this.capitalize(table.name)} | null> {
    // Implementation needed
    return null;
  }
  
  static async create(data: Partial<${this.capitalize(table.name)}>): Promise<${this.capitalize(table.name)}> {
    // Implementation needed
    throw new Error('Not implemented');
  }
  
  static async update(id: string, data: Partial<${this.capitalize(table.name)}>): Promise<${this.capitalize(table.name)}> {
    // Implementation needed
    throw new Error('Not implemented');
  }
  
  static async delete(id: string): Promise<void> {
    // Implementation needed
    throw new Error('Not implemented');
  }
}`;
  }

  // Helper methods
  private getTypeNameFromPath(path: string): string {
    return path.split('/').map(segment => 
      segment.replace(/[^a-zA-Z0-9]/g, '').replace(/^\w/, c => c.toUpperCase())
    ).join('');
  }

  private getMethodNameFromPath(path: string, method: string): string {
    const pathParts = path.split('/').filter(part => part && !part.startsWith('{'));
    const action = method.toLowerCase();
    return action + pathParts.map(part => this.capitalize(part)).join('');
  }

  private generateMethodParams(api: APIDefinition): string {
    const pathParams = api.parameters.filter(p => p.in === 'path');
    const queryParams = api.parameters.filter(p => p.in === 'query');
    const hasBody = api.requestBody && api.method !== 'GET';
    
    const params = [];
    
    if (pathParams.length > 0) {
      params.push(pathParams.map(p => `${p.name}: ${this.mapSchemaType(p.schema)}`).join(', '));
    }
    
    if (hasBody) {
      params.push('data: any');
    }
    
    if (queryParams.length > 0) {
      params.push('params?: Record<string, any>');
    }
    
    return params.join(', ');
  }

  private generateTypeFromSchema(typeName: string, schema: any): string {
    if (schema.type === 'object' && schema.properties) {
      const props = Object.entries(schema.properties).map(([key, prop]: [string, any]) => {
        const optional = schema.required?.includes(key) ? '' : '?';
        return `  ${key}${optional}: ${this.mapSchemaType(prop)};`;
      }).join('\n');
      
      return `export interface ${typeName} {
${props}
}\n\n`;
    }
    
    return `export type ${typeName} = ${this.mapSchemaType(schema)};\n\n`;
  }

  private mapSchemaType(schema: any): string {
    switch (schema.type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'array': return `${this.mapSchemaType(schema.items)}[]`;
      case 'object': return 'Record<string, any>';
      default: return 'any';
    }
  }

  private mapDatabaseType(type: string): string {
    // Map database types to ORM types
    switch (type.toLowerCase()) {
      case 'varchar':
      case 'text':
        return 'text()';
      case 'int':
      case 'integer':
        return 'integer()';
      case 'boolean':
        return 'boolean()';
      case 'timestamp':
        return 'timestamp()';
      default:
        return 'text()';
    }
  }

  private mapSQLType(type: string): string {
    // Map to SQL types
    switch (type.toLowerCase()) {
      case 'string':
        return 'VARCHAR(255)';
      case 'text':
        return 'TEXT';
      case 'number':
      case 'integer':
        return 'INTEGER';
      case 'boolean':
        return 'BOOLEAN';
      case 'date':
        return 'TIMESTAMP';
      default:
        return 'TEXT';
    }
  }

  private mapTypeScriptType(type: string): string {
    switch (type.toLowerCase()) {
      case 'varchar':
      case 'text':
        return 'string';
      case 'int':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'timestamp':
        return 'Date';
      default:
        return 'any';
    }
  }

  private formatSQLValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    return String(value);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}