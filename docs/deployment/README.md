# Deployment Guide

Complete guide for deploying NEX7 to production environments with automatic monitoring, error recovery, and scaling configurations.

## 🚀 Deployment Overview

NEX7 supports multiple deployment strategies:

- **Vercel** (Recommended): Zero-config deployment with automatic scaling
- **Docker**: Containerized deployment for any platform
- **Traditional Hosting**: VPS, dedicated servers, or cloud platforms
- **Self-hosted**: On-premises deployment with full control

## 🎯 Quick Deployment (Vercel)

### Prerequisites

- GitHub repository with NEX7 code
- Vercel account ([vercel.com](https://vercel.com))
- Environment variables configured
- Database setup (PostgreSQL recommended for production)

### Step-by-Step Deployment

#### 1. Prepare Your Repository

Ensure your repository is production-ready:

```bash
# Clone your repository
git clone https://github.com/your-username/nex7.git
cd nex7

# Install dependencies
npm install

# Run production build locally to test
npm run build

# Check for any build errors
npm run lint
npm run type-check
```

#### 2. Configure Environment Variables

Create production environment configuration:

```env
# .env.production
# Claude AI (Required)
ANTHROPIC_API_KEY=sk-ant-api03-your-production-key

# JWT Security (Required)
JWT_SECRET=your-production-jwt-secret-256-bit
NEXTAUTH_SECRET=your-nextauth-secret

# Database (Required for production)
DATABASE_URL=postgresql://username:password@host:5432/nex7_production

# Base URL (Required)
NEXTAUTH_URL=https://your-domain.com

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Vercel Integration (Optional)
VERCEL_TOKEN=your-vercel-token
VERCEL_PROJECT_ID=your-project-id
VERCEL_TEAM_ID=your-team-id

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Analytics (Optional)
ANALYTICS_ID=your-analytics-id

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
```

#### 3. Deploy to Vercel

**Option A: Vercel Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables
5. Deploy

**Option B: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set production environment variables
vercel env add ANTHROPIC_API_KEY production
vercel env add JWT_SECRET production
vercel env add DATABASE_URL production
# ... add all other environment variables

# Deploy to production
vercel --prod
```

#### 4. Configure Custom Domain

```bash
# Add custom domain
vercel domains add your-domain.com

# Configure DNS records
# Add CNAME record: your-domain.com -> cname.vercel-dns.com
```

#### 5. Setup Auto-Deploy Monitoring

Configure GitHub repository secrets for auto-deploy monitoring:

```bash
# Run the setup script
node scripts/setup-vercel-secrets.js

# Or manually add these secrets to your GitHub repository:
# VERCEL_TOKEN=your-vercel-token
# VERCEL_PROJECT_ID=your-project-id
# VERCEL_TEAM_ID=your-team-id (optional)
```

## 🐳 Docker Deployment

### Dockerfile Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  nex7:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@database:5432/nex7
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - database
      - redis

  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=nex7
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - nex7

volumes:
  postgres_data:
  redis_data:
```

### Deploy with Docker

```bash
# Build and deploy
docker-compose up -d

# View logs
docker-compose logs -f nex7

# Scale the application
docker-compose up -d --scale nex7=3

# Update deployment
docker-compose build nex7
docker-compose up -d nex7
```

## ☁️ Cloud Platform Deployment

### AWS Deployment

#### Using AWS App Runner

```yaml
# apprunner.yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - npm ci
      - npm run build
run:
  runtime-version: 18
  command: npm start
  network:
    port: 3000
    env: PORT
env:
  - name: NODE_ENV
    value: production
  - name: DATABASE_URL
    value: postgresql://...
  - name: ANTHROPIC_API_KEY
    value: sk-ant-api03-...
```

#### Using Elastic Beanstalk

```json
{
  ".platform/nginx/conf.d/proxy.conf": {
    "client_max_body_size": "50M"
  },
  ".ebextensions/01_node.config": {
    "option_settings": {
      "aws:elasticbeanstalk:container:nodejs": {
        "NodeCommand": "npm start"
      }
    }
  }
}
```

### Google Cloud Platform

#### Using Cloud Run

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/nex7', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/nex7']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'nex7'
      - '--image'
      - 'gcr.io/$PROJECT_ID/nex7'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
```

### Azure Deployment

#### Using Container Instances

```bash
# Deploy to Azure Container Instances
az container create \
  --resource-group myResourceGroup \
  --name nex7 \
  --image myregistry.azurecr.io/nex7:latest \
  --dns-name-label nex7 \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    DATABASE_URL=$DATABASE_URL \
    ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
```

## 🗄️ Database Setup

### PostgreSQL (Recommended)

#### Managed Database Services

**Vercel Postgres**:
```bash
# Create Vercel Postgres database
vercel postgres create nex7-db

# Get connection string
vercel env add DATABASE_URL production
```

**AWS RDS**:
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier nex7-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password your-password \
  --allocated-storage 20
```

**PlanetScale**:
```bash
# Create PlanetScale database (MySQL)
pscale database create nex7-db
pscale connect nex7-db main
```

#### Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE nex7_production;
CREATE USER nex7_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE nex7_production TO nex7_user;

# Configure connection
export DATABASE_URL="postgresql://nex7_user:secure_password@localhost:5432/nex7_production"
```

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed production data (if needed)
npx prisma db seed
```

## 🔐 Security Configuration

### SSL/TLS Setup

#### Let's Encrypt with Nginx

```nginx
# /etc/nginx/sites-available/nex7
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Cloudflare SSL

1. Add your domain to Cloudflare
2. Update DNS records to point to Cloudflare
3. Enable "Full (strict)" SSL mode
4. Configure security settings

### Environment Security

```bash
# Secure environment file permissions
chmod 600 .env.production

# Use secret management services
# AWS Secrets Manager, Azure Key Vault, GCP Secret Manager

# Rotate secrets regularly
# API keys, JWT secrets, database passwords
```

### Security Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 📊 Monitoring and Observability

### Application Monitoring

#### Vercel Analytics

```javascript
// pages/_app.js
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

#### Sentry Error Tracking

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

#### Custom Health Checks

```javascript
// pages/api/health.js
export default async function handler(req, res) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check external services
    const claudeHealth = await checkClaudeAPI();
    const vercelHealth = await checkVercelAPI();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        claude: claudeHealth ? 'healthy' : 'degraded',
        vercel: vercelHealth ? 'healthy' : 'degraded'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}
```

### Infrastructure Monitoring

#### Uptime Monitoring

```yaml
# .github/workflows/uptime-check.yml
name: Uptime Check
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  uptime:
    runs-on: ubuntu-latest
    steps:
      - name: Check website
        run: |
          curl -f https://your-domain.com/api/health || exit 1
```

#### Performance Monitoring

```javascript
// lib/analytics.js
export function trackPerformance(metric) {
  if (typeof window !== 'undefined') {
    // Send to analytics service
    gtag('event', 'performance', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating
    });
  }
}

// pages/_app.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals(metric) {
  trackPerformance(metric);
}

export { reportWebVitals };
```

## 🔄 Auto-Deploy and CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  monitor:
    if: github.ref == 'refs/heads/main'
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Monitor Deployment
        run: node scripts/monitor-vercel-deployment.js
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Auto-Recovery System

The NEX7 auto-recovery system automatically fixes common deployment issues:

```javascript
// scripts/auto-fix-errors.sh
#!/bin/bash

echo "🔍 Checking for common deployment issues..."

# TypeScript errors
if npm run type-check 2>&1 | grep -q "error TS"; then
    echo "🔧 Fixing TypeScript errors..."
    npm run type-check -- --noEmit false
fi

# ESLint errors
if npm run lint 2>&1 | grep -q "error"; then
    echo "🔧 Fixing ESLint errors..."
    npm run lint:fix
fi

# Missing dependencies
if npm run build 2>&1 | grep -q "Module not found"; then
    echo "🔧 Installing missing dependencies..."
    npm install
fi

# Build the project
echo "🏗️ Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful after auto-fixes"
    exit 0
else
    echo "❌ Build failed even after auto-fixes"
    exit 1
fi
```

## 📈 Scaling and Performance

### Horizontal Scaling

#### Vercel Scaling
- Automatic scaling based on traffic
- Edge functions for global distribution
- CDN for static assets

#### Manual Scaling with Load Balancer

```nginx
# nginx.conf
upstream nex7_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://nex7_backend;
    }
}
```

### Database Scaling

#### Read Replicas

```javascript
// lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();
export const prismaRead = globalForPrisma.prismaRead || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL || process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaRead = prismaRead;
}
```

#### Connection Pooling

```javascript
// lib/database.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

### Caching Strategy

#### Redis Caching

```javascript
// lib/cache.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCache(key) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCache(key, value, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value));
}
```

#### CDN Configuration

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.nex7.com'],
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/your-cloud/',
  },
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
};
```

## 🔧 Maintenance and Updates

### Rolling Updates

```bash
# Zero-downtime deployment script
#!/bin/bash

# Deploy to staging first
vercel --prod --target staging

# Run health checks
curl -f https://staging.nex7.com/api/health

# If health checks pass, promote to production
if [ $? -eq 0 ]; then
    vercel --prod
    echo "✅ Deployment successful"
else
    echo "❌ Health check failed, rolling back"
    vercel rollback
fi
```

### Database Migrations

```bash
# Safe database migration process
npx prisma migrate deploy --preview-feature
npx prisma generate
npm run db:seed:production
```

### Backup Strategy

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backups/nex7_backup_${DATE}.sql"
aws s3 cp "backups/nex7_backup_${DATE}.sql" s3://nex7-backups/
```

## 🚨 Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

**Database Connection Issues**:
```bash
# Test database connection
npx prisma studio

# Check connection string
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT version();"
```

**Performance Issues**:
```bash
# Analyze bundle size
npm run analyze

# Check for memory leaks
node --inspect-brk=0.0.0.0:9229 server.js
```

### Rollback Procedures

**Vercel Rollback**:
```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

**Database Rollback**:
```bash
# Rollback to previous migration
npx prisma migrate reset

# Restore from backup
psql $DATABASE_URL < backups/nex7_backup_20240101_120000.sql
```

## 📞 Support and Resources

### Monitoring Dashboards
- **Vercel Dashboard**: Monitor deployments and performance
- **Database Metrics**: Monitor query performance and connections
- **Error Tracking**: Sentry dashboard for error monitoring

### Alerts and Notifications
- **Uptime Alerts**: Get notified of service outages
- **Performance Alerts**: Detect performance degradation
- **Error Rate Alerts**: Monitor error rates and spikes

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)

---

**Ready to deploy NEX7 to production?** Follow the [Quick Deployment](#quick-deployment-vercel) section to get started with Vercel, or choose your preferred deployment method from the options above.