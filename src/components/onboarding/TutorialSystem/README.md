# Tutorial System

A comprehensive, context-aware tutorial overlay system for the Nex7 dashboard that provides guided tours and interactive learning experiences.

## Features

- **🎯 Context-Aware Tours**: Intelligent spotlight highlighting with automatic positioning
- **📱 Responsive Design**: Works seamlessly across desktop and mobile devices
- **🎨 Smooth Animations**: Beautiful transitions using Framer Motion
- **💾 Progress Tracking**: Automatic save/restore of tutorial progress
- **🎮 Interactive Controls**: Intuitive navigation with keyboard shortcuts
- **📊 Analytics Ready**: Built-in event tracking for tutorial analytics
- **🎨 Customizable**: Easy to modify tours and styling to match your brand

## Quick Start

### 1. Basic Integration

Wrap your app with the Tutorial Provider and add the overlay:

```tsx
import { TutorialProvider, TutorialOverlay, TutorialTrigger } from '@/components/onboarding';

function App() {
  return (
    <TutorialProvider>
      <TutorialOverlay />
      <YourDashboard />
      <TutorialTrigger variant="floating" />
    </TutorialProvider>
  );
}
```

### 2. Add Tutorial Targets

Add CSS classes to elements you want to target in tutorials:

```tsx
<div className="dashboard-container">
  <nav className="main-navigation">
    <button className="tutorial-trigger">Help</button>
  </nav>
  
  <main>
    <section className="project-overview">
      <h2>Your Projects</h2>
    </section>
    
    <div className="quick-actions">
      <button>New Project</button>
      <button>Open Canvas</button>
    </div>
  </main>
</div>
```

### 3. Customize Tours

Edit `tourConfigs.ts` to match your actual selectors and content:

```typescript
{
  id: 'dashboard-overview',
  title: 'Dashboard Overview',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Your Dashboard',
      content: 'This is your main command center...',
      target: '.dashboard-container',
      placement: 'center'
    },
    // ... more steps
  ]
}
```

## Components

### TutorialProvider

The main context provider that manages tutorial state.

```tsx
<TutorialProvider onEvent={handleTutorialEvent}>
  {children}
</TutorialProvider>
```

**Props:**
- `onEvent?: (event: TutorialEvent) => void` - Optional event handler for analytics

### TutorialOverlay

The main overlay component that renders the guided tour interface.

```tsx
<TutorialOverlay className="custom-overlay" />
```

### TutorialTrigger

Flexible trigger component with multiple variants.

```tsx
{/* Button variant */}
<TutorialTrigger variant="button" showQuickActions={true} />

{/* Icon variant with dropdown */}
<TutorialTrigger variant="icon" />

{/* Floating help button */}
<TutorialTrigger variant="floating" />
```

### TutorialProgress

Progress tracking component for learning dashboards.

```tsx
{/* Simple progress card */}
<TutorialProgress />

{/* Detailed progress with achievements */}
<TutorialProgress showDetailed={true} />
```

## Available Tours

The system comes with 5 pre-configured tours:

1. **Dashboard Overview** (`dashboard-overview`)
   - Introduction to main interface
   - Navigation explanation
   - Quick actions overview

2. **Visual Canvas** (`visual-canvas`)
   - Canvas workspace introduction
   - Node palette usage
   - Connection creation
   - Canvas controls

3. **AI Agents** (`ai-agents`)
   - Agent selection and interaction
   - Chat interface usage
   - Code assistance features
   - Canvas integration

4. **Project Deployment** (`project-deployment`)
   - Deployment options overview
   - Environment configuration
   - Monitoring and recovery

5. **Project Management** (`project-management`)
   - Project creation and organization
   - Team collaboration features
   - Version control integration

## Customization

### Creating New Tours

Add new tours to `tourConfigs.ts`:

```typescript
export const customTour: TutorialTour = {
  id: 'my-custom-tour',
  title: 'My Custom Feature',
  description: 'Learn how to use this amazing feature',
  category: 'overview',
  icon: 'Star',
  estimatedTime: '3-5 minutes',
  steps: [
    {
      id: 'step-1',
      title: 'First Step',
      content: 'This is the first step...',
      target: '.my-element',
      placement: 'bottom',
      spotlight: true
    }
  ]
};
```

### Styling

The system uses CSS variables for theming. Override these in your global CSS:

```css
:root {
  --tutorial-overlay-bg: rgba(0, 0, 0, 0.6);
  --tutorial-spotlight-border: hsl(var(--primary));
  --tutorial-tooltip-bg: hsl(var(--background));
}
```

### Step Actions

Steps can include interactive actions:

```typescript
{
  id: 'interactive-step',
  title: 'Try It Out',
  content: 'Click on the highlighted button',
  target: '.action-button',
  action: 'click', // 'click' | 'hover' | 'input' | 'none'
  validation: () => document.querySelector('.action-button')?.classList.contains('active'),
  onEnter: () => console.log('Step entered'),
  onExit: () => console.log('Step completed')
}
```

## API Reference

### useTutorial Hook

```typescript
const {
  state,           // Current tutorial state
  startTour,       // Start a specific tour
  nextStep,        // Go to next step
  previousStep,    // Go to previous step
  skipStep,        // Skip current step
  skipTour,        // Skip entire tour
  restartTour,     // Restart current tour
  exitTutorial,    // Exit tutorial mode
  getCurrentTour,  // Get current tour data
  getCurrentStep,  // Get current step data
} = useTutorial();
```

### Tutorial Events

Track user interactions for analytics:

```typescript
type TutorialEventType = 
  | 'tour_started'
  | 'tour_completed' 
  | 'tour_skipped'
  | 'step_completed'
  | 'step_skipped'
  | 'tutorial_exited';
```

### CSS Selector Targets

Use these classes for consistent targeting:

- `.dashboard-container` - Main dashboard wrapper
- `.main-navigation` - Primary navigation area
- `.project-overview` - Project overview section
- `.quick-actions` - Quick action buttons
- `.canvas-workspace` - Visual Canvas area
- `.agents-container` - AI Agents section
- `.deploy-container` - Deployment section
- `.tutorial-trigger` - Tutorial trigger buttons

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with modern CSS support

## Performance

- Lazy loading of tutorial content
- Efficient DOM queries with caching
- Smooth 60fps animations
- Local storage for progress persistence
- Memory-efficient cleanup on unmount

## Accessibility

- Keyboard navigation support (ESC to exit, Tab to navigate)
- ARIA labels and descriptions
- High contrast mode support
- Screen reader friendly
- Focus management during tours

## Contributing

When adding new tutorials:

1. Add tour configuration to `tourConfigs.ts`
2. Ensure target elements have proper CSS classes
3. Test across different screen sizes
4. Verify accessibility with screen readers
5. Add appropriate analytics events

## Troubleshooting

**Tutorial not showing?**
- Check that target elements exist in the DOM
- Verify CSS selectors match your actual elements
- Ensure TutorialProvider wraps your components

**Positioning issues?**
- Use placement options: 'top', 'bottom', 'left', 'right', 'center'
- Add custom offsets: `offset: { x: 10, y: -20 }`
- Check for conflicting CSS transforms

**Performance issues?**
- Limit number of simultaneous tours
- Use efficient CSS selectors
- Avoid complex DOM structures in target elements