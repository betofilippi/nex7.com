# Visual Deployment Monitoring System

A comprehensive deployment monitoring and management system with visual pipeline tracking, real-time monitoring, automatic error recovery, and notification management.

## Components

### 1. DeploymentPipeline.tsx
**3D Visual Pipeline with Animation**
- Interactive pipeline stages with 3D card effects
- Real-time progress tracking with animated transitions
- Stage status indicators (pending, running, success, error)
- Error animations (shake effect) and success celebrations
- Progress bar showing overall deployment progress
- Click handlers for detailed stage information

### 2. DeploymentMonitor.tsx
**Real-time Monitoring Dashboard**
- **Build Logs**: Live streaming logs with syntax highlighting
  - Color-coded log levels (info, warning, error, success)
  - Auto-scrolling with timestamps
  - Search and filter capabilities
- **Performance Metrics**: Real-time charts using Chart.js
  - CPU and memory usage graphs
  - Build time tracking
  - Bundle size monitoring
- **Deployment History**: Track past deployments
  - Success/failure rates
  - Duration metrics
  - Triggered by information
- **Error Analysis**: Integrated Claude AI error detection

### 3. AutoRecovery.tsx
**Intelligent Error Recovery System**
- **Error Analysis**: Automatic error detection and analysis
- **Claude AI Integration**: 
  - Analyzes error patterns
  - Suggests fixes with confidence ratings
  - Provides code-level solutions
- **Fix Preview**:
  - Side-by-side code diff view
  - Impact assessment (low/medium/high)
  - One-click fix application
- **Confidence Meter**: Visual indicator of fix reliability
- **Automatic Redeployment**: Retry deployment after fix application

### 4. DeploymentNotifications.tsx
**Multi-channel Notification System**
- **Supported Channels**:
  - In-app toast notifications
  - Browser push notifications
  - Email integration (configuration UI)
  - SMS integration (configuration UI)
  - Slack webhooks (configuration UI)
- **Features**:
  - Real-time notification history
  - Read/unread status tracking
  - Channel-specific configuration
  - Test notification triggers
  - Notification preferences management

### 5. GitHub Webhook Integration
**API Route: `/api/webhooks/github`**
- **Supported Events**:
  - Push events (trigger on main branch)
  - Pull request events (merged PRs)
  - Workflow run events (CI/CD status)
  - Release events
- **Security**: 
  - Signature verification
  - Secret-based authentication
- **Automatic Triggers**: Deploy on main branch pushes

## Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Configure environment variables:
```env
# GitHub Webhook Secret (optional but recommended)
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Notification Channels (optional)
SMTP_HOST=smtp.example.com
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

## Usage

### Basic Implementation
```tsx
import { 
  DeploymentPipeline, 
  DeploymentMonitor, 
  AutoRecovery, 
  DeploymentNotifications 
} from '@/components/deploy';

// Define pipeline stages
const stages = [
  { id: 'source', name: 'Source Code', status: 'pending' },
  { id: 'build', name: 'Build', status: 'pending' },
  { id: 'test', name: 'Test', status: 'pending' },
  { id: 'deploy', name: 'Deploy', status: 'pending' },
];

// Use in your component
<DeploymentPipeline 
  stages={stages} 
  onStageClick={(stage) => console.log('Stage clicked:', stage)}
/>
```

### GitHub Webhook Setup

1. Go to your GitHub repository settings
2. Navigate to Webhooks > Add webhook
3. Configure:
   - Payload URL: `https://your-domain.com/api/webhooks/github`
   - Content type: `application/json`
   - Secret: Your webhook secret (matches `GITHUB_WEBHOOK_SECRET`)
   - Events: Select individual events or "Send me everything"

### Notification Configuration

```tsx
<DeploymentNotifications
  onChannelUpdate={(channel) => {
    // Handle channel updates
    console.log('Channel updated:', channel);
  }}
/>
```

## Features

### Visual Excellence
- 3D effects and smooth animations using Framer Motion
- Dark theme optimized for developer environments
- Responsive design for all screen sizes
- Interactive elements with hover states

### Real-time Capabilities
- Live log streaming
- Real-time performance metrics
- Instant error detection
- WebSocket-ready architecture

### AI-Powered Recovery
- Automatic error analysis
- Intelligent fix suggestions
- Code-level recommendations
- Confidence scoring

### Comprehensive Monitoring
- Full deployment lifecycle tracking
- Performance metrics and trends
- Historical data analysis
- Multi-stage pipeline visualization

## Demo

Access the full demo at `/deploy` route to see all components in action:
- Interactive deployment pipeline
- Real-time monitoring dashboard
- Error simulation and recovery
- Notification management

## Future Enhancements

- WebSocket integration for real-time updates
- Database integration for persistent history
- Advanced error pattern recognition
- Custom pipeline stage configuration
- Integration with more CI/CD platforms
- Advanced notification routing rules
- Deployment rollback capabilities
- A/B deployment strategies