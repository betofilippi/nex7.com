// Project templates for different frameworks
export interface ProjectTemplate {
  name: string;
  framework: string;
  description: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  environmentVariables?: Array<{
    key: string;
    value: string;
    target?: ('production' | 'preview' | 'development')[];
  }>;
}

export const projectTemplates: Record<string, ProjectTemplate> = {
  nextjs: {
    name: 'Next.js',
    framework: 'nextjs',
    description: 'Full-stack React framework with SSR/SSG',
    buildCommand: 'next build',
    outputDirectory: '.next',
    installCommand: 'npm install',
    devCommand: 'next dev',
    environmentVariables: [
      {
        key: 'NEXT_PUBLIC_API_URL',
        value: '',
        target: ['production', 'preview', 'development'],
      },
    ],
  },
  react: {
    name: 'React',
    framework: 'vite',
    description: 'Single-page React application',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    installCommand: 'npm install',
    devCommand: 'npm run dev',
    environmentVariables: [
      {
        key: 'VITE_API_URL',
        value: '',
        target: ['production', 'preview', 'development'],
      },
    ],
  },
  vue: {
    name: 'Vue.js',
    framework: 'vue',
    description: 'Progressive Vue.js application',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    installCommand: 'npm install',
    devCommand: 'npm run dev',
    environmentVariables: [
      {
        key: 'VITE_API_URL',
        value: '',
        target: ['production', 'preview', 'development'],
      },
    ],
  },
  nuxt: {
    name: 'Nuxt.js',
    framework: 'nuxtjs',
    description: 'Full-stack Vue framework',
    buildCommand: 'nuxt build',
    outputDirectory: '.output',
    installCommand: 'npm install',
    devCommand: 'nuxt dev',
    environmentVariables: [
      {
        key: 'NUXT_PUBLIC_API_URL',
        value: '',
        target: ['production', 'preview', 'development'],
      },
    ],
  },
  gatsby: {
    name: 'Gatsby',
    framework: 'gatsby',
    description: 'Static site generator for React',
    buildCommand: 'gatsby build',
    outputDirectory: 'public',
    installCommand: 'npm install',
    devCommand: 'gatsby develop',
    environmentVariables: [
      {
        key: 'GATSBY_API_URL',
        value: '',
        target: ['production', 'preview', 'development'],
      },
    ],
  },
  angular: {
    name: 'Angular',
    framework: 'angular',
    description: 'Full-featured Angular application',
    buildCommand: 'ng build',
    outputDirectory: 'dist',
    installCommand: 'npm install',
    devCommand: 'ng serve',
  },
  svelte: {
    name: 'SvelteKit',
    framework: 'sveltekit',
    description: 'Full-stack Svelte framework',
    buildCommand: 'vite build',
    outputDirectory: '.svelte-kit',
    installCommand: 'npm install',
    devCommand: 'vite dev',
  },
  astro: {
    name: 'Astro',
    framework: 'astro',
    description: 'Content-focused static site generator',
    buildCommand: 'astro build',
    outputDirectory: 'dist',
    installCommand: 'npm install',
    devCommand: 'astro dev',
  },
  remix: {
    name: 'Remix',
    framework: 'remix',
    description: 'Full-stack web framework',
    buildCommand: 'remix build',
    outputDirectory: 'build',
    installCommand: 'npm install',
    devCommand: 'remix dev',
  },
  static: {
    name: 'Static HTML',
    framework: 'static',
    description: 'Plain HTML/CSS/JS site',
    outputDirectory: '.',
  },
};