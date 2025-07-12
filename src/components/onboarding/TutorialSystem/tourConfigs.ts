import { TutorialTour } from './types';

export const tutorialTours: TutorialTour[] = [
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    description: 'Get familiar with the main dashboard features and navigation',
    category: 'overview',
    icon: 'LayoutDashboard',
    estimatedTime: '3-5 minutes',
    steps: [
      {
        id: 'welcome-dashboard',
        title: 'Welcome to Your Dashboard',
        content: 'This is your main command center where you can access all Nex7 features. Let me show you around!',
        target: '.dashboard-container',
        placement: 'center',
        spotlight: false
      },
      {
        id: 'main-navigation',
        title: 'Main Navigation',
        content: 'Use this navigation menu to access different sections of the platform. Each icon represents a key feature area.',
        target: '.main-navigation',
        placement: 'right',
        spotlight: true
      },
      {
        id: 'project-overview',
        title: 'Project Overview',
        content: 'Here you can see your active projects, recent activity, and quick stats about your development progress.',
        target: '.project-overview',
        placement: 'bottom',
        spotlight: true
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        content: 'These buttons provide fast access to common tasks like creating new projects, deploying, or opening the Visual Canvas.',
        target: '.quick-actions',
        placement: 'top',
        spotlight: true
      },
      {
        id: 'tutorial-menu',
        title: 'Tutorial Menu',
        content: 'You can access all tutorials from this menu anytime. Click here whenever you need help with specific features.',
        target: '.tutorial-trigger',
        placement: 'left',
        spotlight: true
      }
    ]
  },
  {
    id: 'visual-canvas',
    title: 'Visual Canvas Guide',
    description: 'Learn how to use the Visual Canvas for drag-and-drop development',
    category: 'canvas',
    icon: 'Palette',
    estimatedTime: '5-7 minutes',
    steps: [
      {
        id: 'canvas-intro',
        title: 'Welcome to Visual Canvas',
        content: 'The Visual Canvas lets you build applications visually by connecting different nodes and components together.',
        target: '.canvas-container',
        placement: 'center',
        spotlight: false
      },
      {
        id: 'node-palette',
        title: 'Node Palette',
        content: 'Drag components from this palette onto the canvas. You can find UI components, API integrations, and more.',
        target: '.node-palette',
        placement: 'right',
        spotlight: true
      },
      {
        id: 'canvas-workspace',
        title: 'Canvas Workspace',
        content: 'This is your visual workspace. Drop nodes here and connect them to build your application flow.',
        target: '.canvas-workspace',
        placement: 'top',
        spotlight: true
      },
      {
        id: 'node-connections',
        title: 'Connecting Nodes',
        content: 'Click and drag from the connection points on nodes to link them together. This creates data flow between components.',
        target: '.connection-demo',
        placement: 'bottom',
        spotlight: true,
        action: 'hover'
      },
      {
        id: 'canvas-controls',
        title: 'Canvas Controls',
        content: 'Use these controls to zoom, pan, and organize your canvas. You can also save and export your work from here.',
        target: '.canvas-controls',
        placement: 'left',
        spotlight: true
      }
    ]
  },
  {
    id: 'ai-agents',
    title: 'AI Agents Interaction',
    description: 'Discover how to work with AI agents for code assistance and automation',
    category: 'agents',
    icon: 'Bot',
    estimatedTime: '4-6 minutes',
    steps: [
      {
        id: 'agents-intro',
        title: 'Meet Your AI Agents',
        content: 'AI Agents are your intelligent coding assistants. They can help write code, debug issues, and provide suggestions.',
        target: '.agents-container',
        placement: 'center',
        spotlight: false
      },
      {
        id: 'agent-selector',
        title: 'Agent Selection',
        content: 'Choose different agents based on your needs. Each agent has specialized skills in different areas of development.',
        target: '.agent-selector',
        placement: 'bottom',
        spotlight: true
      },
      {
        id: 'agent-chat',
        title: 'Chat Interface',
        content: 'Communicate with agents through this chat interface. Ask questions, request code, or get explanations.',
        target: '.agent-chat',
        placement: 'left',
        spotlight: true
      },
      {
        id: 'code-assistance',
        title: 'Code Assistance',
        content: 'Agents can generate code, explain existing code, and suggest improvements. Try asking for help with specific problems.',
        target: '.code-assistance',
        placement: 'top',
        spotlight: true
      },
      {
        id: 'agent-integration',
        title: 'Canvas Integration',
        content: 'Agents can also work directly with your Visual Canvas, suggesting node connections and optimizations.',
        target: '.agent-canvas-integration',
        placement: 'right',
        spotlight: true
      }
    ]
  },
  {
    id: 'project-deployment',
    title: 'Project Deployment',
    description: 'Learn how to deploy your projects with one-click deployment',
    category: 'deploy',
    icon: 'Rocket',
    estimatedTime: '3-5 minutes',
    steps: [
      {
        id: 'deploy-intro',
        title: 'Deployment Made Easy',
        content: 'Deploy your projects to production with just a few clicks. Nex7 handles all the complex deployment configuration.',
        target: '.deploy-container',
        placement: 'center',
        spotlight: false
      },
      {
        id: 'deployment-options',
        title: 'Deployment Options',
        content: 'Choose from various deployment platforms like Vercel, Netlify, or custom servers. Each option is pre-configured for you.',
        target: '.deployment-options',
        placement: 'bottom',
        spotlight: true
      },
      {
        id: 'environment-config',
        title: 'Environment Configuration',
        content: 'Set up environment variables and configuration for different deployment environments (dev, staging, production).',
        target: '.environment-config',
        placement: 'right',
        spotlight: true
      },
      {
        id: 'deployment-monitor',
        title: 'Deployment Monitoring',
        content: 'Monitor your deployment status in real-time. See build logs, deployment progress, and any potential issues.',
        target: '.deployment-monitor',
        placement: 'left',
        spotlight: true
      },
      {
        id: 'auto-recovery',
        title: 'Auto Recovery',
        content: 'Nex7 automatically handles deployment failures and provides recovery suggestions to get your project live.',
        target: '.auto-recovery',
        placement: 'top',
        spotlight: true
      }
    ]
  },
  {
    id: 'project-management',
    title: 'Project Management Basics',
    description: 'Master project organization, collaboration, and workflow management',
    category: 'projects',
    icon: 'FolderOpen',
    estimatedTime: '4-6 minutes',
    steps: [
      {
        id: 'project-intro',
        title: 'Project Organization',
        content: 'Learn how to organize and manage your projects effectively within the Nex7 workspace.',
        target: '.project-management',
        placement: 'center',
        spotlight: false
      },
      {
        id: 'project-creation',
        title: 'Creating Projects',
        content: 'Start new projects using templates or from scratch. Choose the right foundation for your application type.',
        target: '.project-creation',
        placement: 'bottom',
        spotlight: true
      },
      {
        id: 'project-structure',
        title: 'Project Structure',
        content: 'Understand how projects are organized with components, assets, configurations, and deployment settings.',
        target: '.project-structure',
        placement: 'right',
        spotlight: true
      },
      {
        id: 'collaboration',
        title: 'Team Collaboration',
        content: 'Invite team members, manage permissions, and collaborate on projects in real-time.',
        target: '.collaboration-panel',
        placement: 'left',
        spotlight: true
      },
      {
        id: 'version-control',
        title: 'Version Control',
        content: 'Track changes, create branches, and manage project versions with integrated Git functionality.',
        target: '.version-control',
        placement: 'top',
        spotlight: true
      },
      {
        id: 'project-settings',
        title: 'Project Settings',
        content: 'Configure project-specific settings including build configuration, environment variables, and integrations.',
        target: '.project-settings',
        placement: 'bottom',
        spotlight: true
      }
    ]
  }
];

export const getTourById = (tourId: string): TutorialTour | undefined => {
  return tutorialTours.find(tour => tour.id === tourId);
};

export const getToursByCategory = (category: TutorialTour['category']): TutorialTour[] => {
  return tutorialTours.filter(tour => tour.category === category);
};

export const getAllTours = (): TutorialTour[] => {
  return tutorialTours;
};