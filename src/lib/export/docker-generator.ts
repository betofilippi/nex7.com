import { ProjectExportData, ExportOptions, DockerConfig } from './types';

export class DockerGenerator {
  async generateDockerFiles(
    files: Record<string, string>,
    projectData: ProjectExportData,
    options: ExportOptions
  ): Promise<Record<string, string>> {
    const dockerFiles: Record<string, string> = {};

    // Generate Dockerfile
    dockerFiles['Dockerfile'] = this.generateDockerfile(options);

    // Generate docker-compose.yml
    dockerFiles['docker-compose.yml'] = this.generateDockerCompose(projectData, options);

    // Generate .dockerignore
    dockerFiles['.dockerignore'] = this.generateDockerIgnore();

    // Generate Docker build script
    dockerFiles['build-docker.sh'] = this.generateBuildScript(projectData);

    // Generate Docker run script
    dockerFiles['run-docker.sh'] = this.generateRunScript(projectData);

    return dockerFiles;
  }

  private generateDockerfile(options: ExportOptions): string {
    const framework = options.framework || 'react';
    
    switch (framework) {
      case 'next':
        return this.generateNextDockerfile();
      case 'react':
        return this.generateReactDockerfile();
      case 'vue':
        return this.generateVueDockerfile();
      case 'angular':
        return this.generateAngularDockerfile();
      default:
        return this.generateGenericDockerfile();
    }
  }

  private generateNextDockerfile(): string {
    return `# Use the official Node.js runtime as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f package-lock.json ]; then npm ci; \\
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \\
  else echo "Lockfile not found." && exit 1; \\
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]`;
  }

  private generateReactDockerfile(): string {
    return `# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]`;
  }

  private generateVueDockerfile(): string {
    return `# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]`;
  }

  private generateAngularDockerfile(): string {
    return `# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build --prod

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]`;
  }

  private generateGenericDockerfile(): string {
    return `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]`;
  }

  private generateDockerCompose(projectData: ProjectExportData, options: ExportOptions): string {
    const serviceName = projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const hasDatabase = !!projectData.database;
    
    let compose = `version: '3.8'

services:
  ${serviceName}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production`;

    if (hasDatabase) {
      compose += `
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/${serviceName}`;
    }

    if (options.includeData) {
      compose += `
    volumes:
      - ./data:/app/data`;
    }

    if (hasDatabase) {
      compose += `

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${serviceName}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"`;
    }

    if (options.framework === 'next' || hasDatabase) {
      compose += `

volumes:`;
      if (hasDatabase) {
        compose += `
  postgres_data:`;
      }
      if (options.includeData) {
        compose += `
  app_data:`;
      }
    }

    return compose;
  }

  private generateDockerIgnore(): string {
    return `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.next
.cache
dist
build
*.log
.DS_Store
Thumbs.db`;
  }

  private generateBuildScript(projectData: ProjectExportData): string {
    const imageName = projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    return `#!/bin/bash

# Build the Docker image
echo "Building Docker image for ${projectData.name}..."

docker build -t ${imageName}:${projectData.version} .
docker build -t ${imageName}:latest .

echo "Docker image built successfully!"
echo "Image name: ${imageName}:${projectData.version}"
echo ""
echo "To run the container:"
echo "  docker run -p 3000:3000 ${imageName}:latest"
echo ""
echo "To run with docker-compose:"
echo "  docker-compose up -d"`;
  }

  private generateRunScript(projectData: ProjectExportData): string {
    const imageName = projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    return `#!/bin/bash

# Run the Docker container
echo "Starting ${projectData.name} container..."

docker run -d \\
  --name ${imageName} \\
  -p 3000:3000 \\
  ${imageName}:latest

echo "Container started successfully!"
echo "Application is running at: http://localhost:3000"
echo ""
echo "To view logs:"
echo "  docker logs ${imageName}"
echo ""
echo "To stop the container:"
echo "  docker stop ${imageName}"
echo ""
echo "To remove the container:"
echo "  docker rm ${imageName}"`;
  }

  generateDockerConfig(options: ExportOptions): DockerConfig {
    const framework = options.framework || 'react';
    
    const baseConfigs: Record<string, Partial<DockerConfig>> = {
      next: {
        baseImage: 'node:18-alpine',
        workdir: '/app',
        expose: [3000],
        env: {
          NODE_ENV: 'production',
          PORT: '3000',
          HOSTNAME: '0.0.0.0',
        },
        entrypoint: ['node', 'server.js'],
      },
      react: {
        baseImage: 'nginx:alpine',
        workdir: '/usr/share/nginx/html',
        expose: [80],
        env: {},
        entrypoint: ['nginx', '-g', 'daemon off;'],
      },
      vue: {
        baseImage: 'nginx:alpine',
        workdir: '/usr/share/nginx/html',
        expose: [80],
        env: {},
        entrypoint: ['nginx', '-g', 'daemon off;'],
      },
      angular: {
        baseImage: 'nginx:alpine',
        workdir: '/usr/share/nginx/html',
        expose: [80],
        env: {},
        entrypoint: ['nginx', '-g', 'daemon off;'],
      },
    };

    const defaultConfig: DockerConfig = {
      baseImage: 'node:18-alpine',
      workdir: '/app',
      expose: [3000],
      env: {
        NODE_ENV: 'production',
      },
      volumes: [],
      commands: [
        'COPY package*.json ./',
        'RUN npm ci --only=production',
        'COPY . .',
      ],
      entrypoint: ['npm', 'start'],
    };

    return {
      ...defaultConfig,
      ...baseConfigs[framework],
    };
  }

  generateKubernetesManifests(
    projectData: ProjectExportData,
    options: ExportOptions
  ): Record<string, string> {
    const manifests: Record<string, string> = {};
    const appName = projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Deployment
    manifests['deployment.yaml'] = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  labels:
    app: ${appName}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      containers:
      - name: ${appName}
        image: ${appName}:${projectData.version}
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"`;

    // Service
    manifests['service.yaml'] = `apiVersion: v1
kind: Service
metadata:
  name: ${appName}-service
spec:
  selector:
    app: ${appName}
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer`;

    // Ingress
    manifests['ingress.yaml'] = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${appName}-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: ${appName}.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${appName}-service
            port:
              number: 80`;

    return manifests;
  }
}