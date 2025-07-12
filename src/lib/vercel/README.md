# Vercel Integration

This module provides comprehensive Vercel integration for the nex7.com project, including OAuth authentication, project management, deployment operations, domain configuration, and real-time monitoring.

## Features

### Authentication
- OAuth 2.0 flow with Vercel
- Secure token storage in HTTP-only cookies
- State parameter for CSRF protection

### Project Management
- Create, list, and delete projects
- Support for various frameworks (Next.js, React, Vue.js, etc.)
- Environment variables management
- Git repository integration

### Deployment Operations
- Create deployments from files or Git repositories
- Cancel ongoing deployments
- Redeploy previous deployments
- Real-time deployment status monitoring
- Build progress tracking

### Domain Management
- Add custom domains to projects
- Domain verification process
- SSL certificate management
- DNS record configuration
- Redirect setup

### Build Logs
- Real-time log streaming with Server-Sent Events
- Syntax highlighting for different log types
- Download and copy logs functionality
- Filter logs by type (command, stdout, stderr, etc.)

## API Routes

### Authentication: `/api/vercel/auth`
- `GET ?action=login` - Start OAuth flow
- `GET ?action=callback` - Handle OAuth callback
- `GET ?action=logout` - Clear authentication
- `GET ?action=status` - Check authentication status

### Projects: `/api/vercel/projects`
- `GET` - List all projects
- `GET ?projectId={id}` - Get specific project
- `POST` - Create new project
- `DELETE ?projectId={id}` - Delete project

### Deployments: `/api/vercel/deployments`
- `GET` - List deployments
- `GET ?deploymentId={id}` - Get specific deployment
- `POST` - Create deployment, cancel, or redeploy

### Domains: `/api/vercel/domains`
- `GET ?projectId={id}` - List project domains
- `POST` - Add domain or verify domain
- `DELETE ?projectId={id}&domain={name}` - Remove domain

### Logs: `/api/vercel/logs`
- `GET ?deploymentId={id}` - Get build logs
- `GET ?deploymentId={id}&stream=true` - Stream logs with SSE

## Canvas Nodes

### VercelDeployNode
Visual node for deployment management with:
- Real-time status indicators
- Deploy button with loading states
- Deployment information display
- Quick actions menu

### VercelProjectNode
Project overview node featuring:
- Framework detection and icons
- Repository information
- Analytics preview
- Configuration options

### VercelDomainNode
Domain configuration node with:
- Domain verification status
- SSL certificate indicators
- DNS record display
- Verification tools

## Components

### DeploymentStatus
Real-time deployment status monitoring component:
- Live status updates
- Progress tracking for builds
- Creator and timing information
- Quick actions (preview, logs, inspector)

### BuildLogsViewer
Interactive log viewer with:
- Real-time streaming via SSE
- Syntax highlighting
- Log filtering by type
- Download and copy functionality
- Auto-scroll with pause option

### DeploymentHistory
Timeline view of deployments:
- Success rate visualization
- Sortable deployment list
- Quick redeploy actions
- Deployment details

### QuickDeploy
One-click deployment component:
- Project selection
- Environment configuration
- Branch selection
- Deploy message input

## Environment Variables

Required environment variables for Vercel integration:

```env
VERCEL_CLIENT_ID=your_vercel_client_id
VERCEL_CLIENT_SECRET=your_vercel_client_secret
VERCEL_REDIRECT_URI=http://localhost:3000/api/vercel/auth/callback
```

## Usage Example

```tsx
import { 
  DeploymentStatus, 
  BuildLogsViewer, 
  DeploymentHistory, 
  QuickDeploy 
} from '@/components/vercel';

function VercelDashboard() {
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DeploymentStatus 
        deploymentId={selectedDeployment} 
        onLogsClick={setSelectedDeployment}
      />
      <QuickDeploy onDeploy={setSelectedDeployment} />
      <DeploymentHistory onDeploymentClick={setSelectedDeployment} />
      <BuildLogsViewer deploymentId={selectedDeployment} />
    </div>
  );
}
```

## Security Considerations

- OAuth tokens are stored in secure HTTP-only cookies
- CSRF protection with state parameters
- API rate limiting recommended
- Input validation on all endpoints
- Proper error handling to prevent information leakage

## Rate Limits

Vercel API has rate limits:
- 100 requests per 10 seconds for authenticated requests
- Consider implementing client-side caching
- Use webhook notifications for real-time updates when possible