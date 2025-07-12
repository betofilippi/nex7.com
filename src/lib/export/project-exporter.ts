import { 
  ExportOptions, 
  ProjectExportData, 
  ExportProgress, 
  ExportResult,
  FrameworkType 
} from './types';
import { CodeGenerator } from './code-generator';
import { DockerGenerator } from './docker-generator';
import { CloudDeployer } from './cloud-deployer';
import { AssetManager } from './asset-manager';
import JSZip from 'jszip';

export class ProjectExporter {
  private codeGenerator: CodeGenerator;
  private dockerGenerator: DockerGenerator;
  private cloudDeployer: CloudDeployer;
  private assetManager: AssetManager;
  private progressCallback?: (progress: ExportProgress) => void;

  constructor() {
    this.codeGenerator = new CodeGenerator();
    this.dockerGenerator = new DockerGenerator();
    this.cloudDeployer = new CloudDeployer();
    this.assetManager = new AssetManager();
  }

  async exportProject(
    projectData: ProjectExportData,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    this.progressCallback = onProgress;

    try {
      this.updateProgress('preparing', 0, 'Preparing export...');

      // Validate project data
      this.validateProjectData(projectData);

      this.updateProgress('collecting', 10, 'Collecting project files...');

      // Generate code files
      const generatedFiles = await this.generateProjectFiles(projectData, options);

      this.updateProgress('generating', 40, 'Generating framework files...');

      // Generate framework-specific files
      const frameworkFiles = await this.generateFrameworkFiles(
        generatedFiles,
        options.framework || 'react'
      );

      this.updateProgress('packaging', 70, 'Packaging files...');

      // Package files based on target
      const result = await this.packageFiles(
        { ...generatedFiles, ...frameworkFiles },
        projectData,
        options
      );

      this.updateProgress('complete', 100, 'Export completed successfully!');

      return result;
    } catch (error) {
      this.updateProgress('error', 0, 'Export failed', undefined, error.message);
      throw error;
    }
  }

  private validateProjectData(projectData: ProjectExportData): void {
    if (!projectData.projectId || !projectData.name) {
      throw new Error('Invalid project data: missing required fields');
    }

    if (!projectData.components || projectData.components.length === 0) {
      throw new Error('Project must have at least one component');
    }
  }

  private async generateProjectFiles(
    projectData: ProjectExportData,
    options: ExportOptions
  ): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    // Generate component files
    for (const component of projectData.components) {
      const componentFiles = await this.codeGenerator.generateComponent(component, options);
      Object.assign(files, componentFiles);
      
      this.updateProgress(
        'collecting',
        10 + (projectData.components.indexOf(component) / projectData.components.length) * 20,
        `Generated component: ${component.name}`
      );
    }

    // Generate page files
    for (const page of projectData.pages) {
      const pageFiles = await this.codeGenerator.generatePage(page, projectData.components);
      Object.assign(files, pageFiles);
    }

    // Generate API files if present
    if (projectData.api && projectData.api.length > 0) {
      const apiFiles = await this.codeGenerator.generateAPI(projectData.api);
      Object.assign(files, apiFiles);
    }

    // Generate database files if present
    if (projectData.database) {
      const dbFiles = await this.codeGenerator.generateDatabase(projectData.database);
      Object.assign(files, dbFiles);
    }

    // Include assets if requested
    if (options.includeAssets) {
      const assetFiles = await this.assetManager.collectAssets(projectData.assets);
      Object.assign(files, assetFiles);
    }

    return files;
  }

  private async generateFrameworkFiles(
    files: Record<string, string>,
    framework: FrameworkType
  ): Promise<Record<string, string>> {
    const frameworkFiles: Record<string, string> = {};

    switch (framework) {
      case 'next':
        Object.assign(frameworkFiles, await this.generateNextJSFiles(files));
        break;
      case 'react':
        Object.assign(frameworkFiles, await this.generateReactFiles(files));
        break;
      case 'vue':
        Object.assign(frameworkFiles, await this.generateVueFiles(files));
        break;
      case 'angular':
        Object.assign(frameworkFiles, await this.generateAngularFiles(files));
        break;
      case 'svelte':
        Object.assign(frameworkFiles, await this.generateSvelteFiles(files));
        break;
      case 'vanilla':
        Object.assign(frameworkFiles, await this.generateVanillaFiles(files));
        break;
    }

    return frameworkFiles;
  }

  private async generateNextJSFiles(files: Record<string, string>): Promise<Record<string, string>> {
    return {
      'package.json': JSON.stringify({
        name: 'exported-nex7-project',
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
        devDependencies: {
          '@types/node': '^20.0.0',
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
          eslint: '^8.0.0',
          'eslint-config-next': '^14.0.0',
          typescript: '^5.0.0',
        },
      }, null, 2),
      'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'es5',
          lib: ['dom', 'dom.iterable', 'es6'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths: { '@/*': ['./src/*'] },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules'],
      }, null, 2),
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'src/app/layout.tsx': `import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NeX7 Exported Project',
  description: 'Generated by NeX7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
      'src/app/page.tsx': `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Welcome to your NeX7 Project</h1>
      <p className="text-lg text-gray-600">This project was exported from NeX7</p>
    </main>
  )
}`,
      'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      '.eslintrc.json': JSON.stringify({
        extends: 'next/core-web-vitals',
      }),
      'README.md': `# NeX7 Exported Project

This project was exported from NeX7 and generated using Next.js.

## Getting Started

First, install dependencies:

\`\`\`bash
npm install
# or
yarn install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
`,
    };
  }

  private async generateReactFiles(files: Record<string, string>): Promise<Record<string, string>> {
    return {
      'package.json': JSON.stringify({
        name: 'exported-nex7-project',
        version: '1.0.0',
        private: true,
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'react-scripts': '5.0.1',
          'web-vitals': '^2.1.4',
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test',
          eject: 'react-scripts eject',
        },
        eslintConfig: {
          extends: ['react-app', 'react-app/jest'],
        },
        browserslist: {
          production: ['>0.2%', 'not dead', 'not op_mini all'],
          development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version'],
        },
      }, null, 2),
      'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="NeX7 Exported Project" />
    <title>NeX7 Project</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
      'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      'src/App.js': `import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to your NeX7 Project</h1>
        <p>This project was exported from NeX7</p>
      </header>
    </div>
  );
}

export default App;`,
      'src/App.css': `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}`,
      'src/index.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
    };
  }

  private async generateVueFiles(files: Record<string, string>): Promise<Record<string, string>> {
    // Vue.js specific files
    return {
      'package.json': JSON.stringify({
        name: 'exported-nex7-project',
        version: '1.0.0',
        private: true,
        scripts: {
          serve: 'vue-cli-service serve',
          build: 'vue-cli-service build',
          lint: 'vue-cli-service lint',
        },
        dependencies: {
          'core-js': '^3.8.3',
          vue: '^3.2.13',
        },
        devDependencies: {
          '@babel/core': '^7.12.16',
          '@babel/eslint-parser': '^7.12.16',
          '@vue/cli-plugin-babel': '~5.0.0',
          '@vue/cli-plugin-eslint': '~5.0.0',
          '@vue/cli-service': '~5.0.0',
          eslint: '^7.32.0',
          'eslint-plugin-vue': '^8.0.3',
        },
      }, null, 2),
    };
  }

  private async generateAngularFiles(files: Record<string, string>): Promise<Record<string, string>> {
    // Angular specific files
    return {};
  }

  private async generateSvelteFiles(files: Record<string, string>): Promise<Record<string, string>> {
    // Svelte specific files
    return {};
  }

  private async generateVanillaFiles(files: Record<string, string>): Promise<Record<string, string>> {
    // Vanilla JavaScript/HTML files
    return {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NeX7 Exported Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app">
        <h1>Welcome to your NeX7 Project</h1>
        <p>This project was exported from NeX7</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
      'styles.css': `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

#app {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    margin-bottom: 16px;
}

p {
    color: #666;
    font-size: 18px;
}`,
      'script.js': `console.log('NeX7 Project loaded successfully!');

// Your project logic will be added here`,
    };
  }

  private async packageFiles(
    files: Record<string, string>,
    projectData: ProjectExportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    switch (options.target) {
      case 'download':
        return this.createDownloadPackage(files, options);
      case 'docker':
        return this.createDockerImage(files, projectData, options);
      case 'cloud':
        return this.deployToCloud(files, projectData, options);
      case 'standalone':
        return this.createStandaloneApp(files, projectData, options);
      default:
        throw new Error(`Unsupported export target: ${options.target}`);
    }
  }

  private async createDownloadPackage(
    files: Record<string, string>,
    options: ExportOptions
  ): Promise<ExportResult> {
    if (options.format === 'zip') {
      const zip = new JSZip();
      
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path, content);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);

      return {
        success: true,
        downloadUrl,
        size: zipBlob.size,
        files: Object.keys(files),
        metadata: {
          format: 'zip',
          compressed: options.compression,
        },
      };
    }

    throw new Error(`Unsupported format: ${options.format}`);
  }

  private async createDockerImage(
    files: Record<string, string>,
    projectData: ProjectExportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const dockerFiles = await this.dockerGenerator.generateDockerFiles(
      files,
      projectData,
      options
    );

    // Combine project files with Docker files
    const allFiles = { ...files, ...dockerFiles };

    return {
      success: true,
      size: Object.values(allFiles).reduce((size, content) => size + content.length, 0),
      files: Object.keys(allFiles),
      containerImage: `nex7-project:${projectData.version}`,
      metadata: {
        type: 'docker',
        baseImage: 'node:18-alpine',
      },
    };
  }

  private async deployToCloud(
    files: Record<string, string>,
    projectData: ProjectExportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const deployResult = await this.cloudDeployer.deploy(files, projectData, options);
    
    return {
      success: true,
      deployUrl: deployResult.url,
      size: Object.values(files).reduce((size, content) => size + content.length, 0),
      files: Object.keys(files),
      metadata: {
        provider: options.cloudProvider,
        region: deployResult.region,
        deploymentId: deployResult.deploymentId,
      },
    };
  }

  private async createStandaloneApp(
    files: Record<string, string>,
    projectData: ProjectExportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    // Generate executable or self-contained application
    // This would typically use tools like Electron, Tauri, or similar
    
    return {
      success: true,
      size: Object.values(files).reduce((size, content) => size + content.length, 0),
      files: Object.keys(files),
      metadata: {
        type: 'standalone',
        platform: process.platform,
      },
    };
  }

  private updateProgress(
    stage: ExportProgress['stage'],
    progress: number,
    message: string,
    currentFile?: string,
    error?: string
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        progress,
        message,
        currentFile,
        error,
      });
    }
  }
}