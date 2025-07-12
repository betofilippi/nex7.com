'use client';

import React from 'react';
import { 
  TutorialProvider, 
  TutorialOverlay, 
  TutorialTrigger, 
  TutorialProgress 
} from './index';

/**
 * Example Dashboard component showing how to integrate the Tutorial System
 * 
 * This component demonstrates:
 * 1. Wrapping your app with TutorialProvider
 * 2. Adding the TutorialOverlay for guided tours
 * 3. Including tutorial triggers in appropriate locations
 * 4. Using the tutorial-aware CSS classes for targeting
 */

const ExampleDashboard: React.FC = () => {
  // Handle tutorial events for analytics/tracking
  const handleTutorialEvent = (event: any) => {
    console.log('Tutorial Event:', event);
    // Send to analytics service
    // Example: analytics.track(event.type, event);
  };

  return (
    <TutorialProvider onEvent={handleTutorialEvent}>
      <div className="min-h-screen bg-background">
        {/* Tutorial Overlay - Add this to render guided tours */}
        <TutorialOverlay />
        
        {/* Your main dashboard layout */}
        <div className="dashboard-container">
          
          {/* Header with tutorial trigger */}
          <header className="main-navigation border-b p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Nex7 Dashboard</h1>
              
              <div className="flex items-center gap-4">
                {/* Tutorial trigger button */}
                <TutorialTrigger variant="icon" />
                
                {/* User menu, notifications, etc. */}
                <div className="flex items-center gap-2">
                  {/* Other header items */}
                </div>
              </div>
            </div>
          </header>

          <div className="flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r p-4">
              <nav className="space-y-2">
                <div className="project-overview p-3 rounded-lg bg-muted/5 border">
                  <h3 className="font-semibold mb-2">Projects</h3>
                  <p className="text-sm text-muted-foreground">
                    Your active projects and recent activity
                  </p>
                </div>
                
                <div className="canvas-workspace p-3 rounded-lg hover:bg-muted/5">
                  <h4 className="font-medium">Visual Canvas</h4>
                  <p className="text-xs text-muted-foreground">
                    Drag-and-drop development
                  </p>
                </div>
                
                <div className="agents-container p-3 rounded-lg hover:bg-muted/5">
                  <h4 className="font-medium">AI Agents</h4>
                  <p className="text-xs text-muted-foreground">
                    Intelligent assistants
                  </p>
                </div>
                
                <div className="deploy-container p-3 rounded-lg hover:bg-muted/5">
                  <h4 className="font-medium">Deploy</h4>
                  <p className="text-xs text-muted-foreground">
                    One-click deployment
                  </p>
                </div>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6">
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="quick-actions grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button className="p-4 border rounded-lg hover:bg-muted/5 text-left">
                    <h3 className="font-semibold">New Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Start building something amazing
                    </p>
                  </button>
                  
                  <button className="p-4 border rounded-lg hover:bg-muted/5 text-left">
                    <h3 className="font-semibold">Open Canvas</h3>
                    <p className="text-sm text-muted-foreground">
                      Visual development environment
                    </p>
                  </button>
                  
                  <button className="p-4 border rounded-lg hover:bg-muted/5 text-left">
                    <h3 className="font-semibold">Chat with AI</h3>
                    <p className="text-sm text-muted-foreground">
                      Get help from AI agents
                    </p>
                  </button>
                  
                  <button className="p-4 border rounded-lg hover:bg-muted/5 text-left">
                    <h3 className="font-semibold">Deploy Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Share your work with the world
                    </p>
                  </button>
                </div>

                {/* Tutorial Progress Card */}
                <TutorialProgress showDetailed={false} />

                {/* Mock content areas for tutorials */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="project-creation border rounded-lg p-6">
                    <h3 className="font-semibold mb-2">Recent Projects</h3>
                    <div className="space-y-3">
                      <div className="p-3 border rounded bg-muted/5">
                        <h4 className="font-medium">E-commerce App</h4>
                        <p className="text-sm text-muted-foreground">
                          Last edited 2 hours ago
                        </p>
                      </div>
                      <div className="p-3 border rounded bg-muted/5">
                        <h4 className="font-medium">Portfolio Site</h4>
                        <p className="text-sm text-muted-foreground">
                          Last edited yesterday
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="agent-chat border rounded-lg p-6">
                    <h3 className="font-semibold mb-2">AI Assistant</h3>
                    <div className="bg-muted/5 rounded p-3 mb-3">
                      <p className="text-sm">
                        👋 Hi! I'm ready to help you build your next project. 
                        What would you like to work on today?
                      </p>
                    </div>
                    <input 
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Ask me anything about development..."
                    />
                  </div>
                </div>

                {/* Additional tutorial target areas */}
                <div className="deployment-options border rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Deployment Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded hover:bg-muted/5">
                      <h4 className="font-medium">Vercel</h4>
                      <p className="text-sm text-muted-foreground">
                        Deploy frontend apps
                      </p>
                    </div>
                    <div className="p-4 border rounded hover:bg-muted/5">
                      <h4 className="font-medium">Netlify</h4>
                      <p className="text-sm text-muted-foreground">
                        Static site deployment
                      </p>
                    </div>
                    <div className="p-4 border rounded hover:bg-muted/5">
                      <h4 className="font-medium">Custom Server</h4>
                      <p className="text-sm text-muted-foreground">
                        Deploy to your own infrastructure
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Floating tutorial trigger (optional) */}
        <TutorialTrigger variant="floating" />
      </div>
    </TutorialProvider>
  );
};

export default ExampleDashboard;

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Wrap your main app component with TutorialProvider:
 *    <TutorialProvider onEvent={handleTutorialEvent}>
 *      <YourApp />
 *    </TutorialProvider>
 * 
 * 2. Add TutorialOverlay somewhere in your app (preferably at the root level):
 *    <TutorialOverlay />
 * 
 * 3. Add tutorial triggers where appropriate:
 *    - <TutorialTrigger variant="button" /> - Full button
 *    - <TutorialTrigger variant="icon" /> - Icon button with dropdown
 *    - <TutorialTrigger variant="floating" /> - Floating help button
 * 
 * 4. Add CSS classes to elements you want to target in tutorials:
 *    - .dashboard-container - Main dashboard area
 *    - .main-navigation - Primary navigation
 *    - .project-overview - Project overview section
 *    - .quick-actions - Quick action buttons
 *    - .canvas-workspace - Visual Canvas area
 *    - .agents-container - AI Agents section
 *    - .deploy-container - Deployment section
 *    - .tutorial-trigger - Tutorial trigger button
 * 
 * 5. Customize tour configurations in tourConfigs.ts to match your actual selectors
 * 
 * 6. Optional: Add TutorialProgress component to show learning progress:
 *    <TutorialProgress showDetailed={true} />
 */