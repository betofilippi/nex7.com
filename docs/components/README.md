# Component Library Documentation

Complete reference for NEX7's React component library built with shadcn/ui, Tailwind CSS, and TypeScript.

## 🎨 Design System Overview

NEX7's component library follows these design principles:

- **Consistency**: Uniform styling and behavior across components
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation
- **Modularity**: Composable components for flexible layouts
- **Theming**: Support for light/dark modes and custom themes
- **TypeScript**: Full type safety with intelligent autocomplete

## 🧩 Component Categories

### Core UI Components

#### [Button](./button.md)
Versatile button component with multiple variants and states.

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="md">
  Click me
</Button>
```

#### [Card](./card.md)
Container component for grouping related content.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

#### [Input](./input.md)
Text input component with validation support.

```tsx
import { Input } from '@/components/ui/input';

<Input 
  type="email" 
  placeholder="Enter your email"
  error={errors.email?.message}
/>
```

#### [Dialog](./dialog.md)
Modal dialog for overlays and forms.

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    Dialog content
  </DialogContent>
</Dialog>
```

### Form Components

#### [Label](./label.md)
Accessible labels for form controls.

#### [Select](./select.md)
Dropdown selection component.

#### [Switch](./switch.md)
Toggle switch for boolean values.

#### [Tabs](./tabs.md)
Tab navigation component.

### Layout Components

#### [Scroll Area](./scroll-area.md)
Custom scrollable container.

#### [Sheet](./sheet.md)
Slide-out panel component.

#### [Progress](./progress.md)
Progress indicator component.

### Feedback Components

#### [Alert](./alert.md)
Alert messages and notifications.

#### [Badge](./badge.md)
Small status indicators.

#### [Toast](./toast.md)
Temporary notification messages.

### Navigation Components

#### [Dropdown Menu](./dropdown-menu.md)
Context menus and dropdowns.

#### [Avatar](./avatar.md)
User profile pictures and placeholders.

## 🤖 Agent Components

### [Agent Chat](./agent-chat.md)
Chat interface for AI agent interactions.

```tsx
import { AgentChat } from '@/components/agents/AgentChat';

<AgentChat 
  agentId="nexy"
  conversationId={conversationId}
  onMessageSent={handleMessage}
/>
```

### [Agent Avatar](./agent-avatar.md)
Displays agent profile pictures and status.

```tsx
import { AgentAvatar } from '@/components/agents/AgentAvatar';

<AgentAvatar 
  agent="dev"
  size="lg"
  showStatus={true}
/>
```

### [Agent Selector](./agent-selector.md)
Dropdown for choosing AI agents.

```tsx
import { AgentSelector } from '@/components/agents/AgentSelector';

<AgentSelector 
  selectedAgent={selectedAgent}
  onAgentChange={setSelectedAgent}
  availableAgents={agents}
/>
```

### [Agent Personality](./agent-personality.md)
Displays agent personality traits and capabilities.

## 🎨 Canvas Components

### [Canvas](./canvas.md)
Main visual workflow editor.

```tsx
import { Canvas } from '@/components/canvas/Canvas';

<Canvas 
  workflow={workflow}
  onWorkflowChange={handleWorkflowChange}
  onNodeSelect={handleNodeSelect}
/>
```

### [Node Palette](./node-palette.md)
Draggable node collection.

```tsx
import { NodePalette } from '@/components/canvas/NodePalette';

<NodePalette 
  categories={nodeCategories}
  onNodeDrag={handleNodeDrag}
  searchable={true}
/>
```

### [Node Editor](./node-editor.md)
Properties panel for configuring nodes.

```tsx
import { NodeEditor } from '@/components/canvas/NodeEditor';

<NodeEditor 
  node={selectedNode}
  onNodeUpdate={handleNodeUpdate}
  schema={nodeSchema}
/>
```

### Canvas Nodes

#### [Claude Node](./nodes/claude-node.md)
AI-powered content generation node.

#### [GitHub Node](./nodes/github-node.md)
GitHub repository integration node.

#### [Vercel Node](./nodes/vercel-node.md)
Vercel deployment management node.

#### [API Node](./nodes/api-node.md)
HTTP request node for external APIs.

#### [Database Node](./nodes/database-node.md)
Database operation node.

## 🚀 Deployment Components

### [Deployment Monitor](./deployment-monitor.md)
Real-time deployment status tracking.

```tsx
import { DeploymentMonitor } from '@/components/deploy/DeploymentMonitor';

<DeploymentMonitor 
  projectId={projectId}
  onStatusChange={handleStatusChange}
  autoRefresh={true}
/>
```

### [Build Logs Viewer](./build-logs-viewer.md)
Interactive build log display.

### [Auto Recovery](./auto-recovery.md)
Visual auto-recovery system status.

## 🎯 Onboarding Components

### [Onboarding Wizard](./onboarding-wizard.md)
Multi-step setup process.

```tsx
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

<OnboardingWizard 
  steps={onboardingSteps}
  onComplete={handleOnboardingComplete}
  agent="nexy"
/>
```

### [Tutorial System](./tutorial-system.md)
Interactive tutorials and tooltips.

### [Nexy Character](./nexy-character.md)
Animated AI guide mascot.

## 🔧 Utility Components

### [Theme Provider](./theme-provider.md)
Theme context and switching.

### [Theme Switcher](./theme-switcher.md)
UI control for theme selection.

### [Language Switcher](./language-switcher.md)
Internationalization controls.

## 📊 Analytics Components

### [Analytics Dashboard](./analytics-dashboard.md)
Usage metrics and insights.

### [Export Dialog](./export-dialog.md)
Data export functionality.

### [Notification Center](./notification-center.md)
Centralized notifications.

## 🎨 Theming and Customization

### Color System

NEX7 uses a semantic color system:

```css
:root {
  /* Primary colors */
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
  
  /* Secondary colors */
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  
  /* Accent colors */
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  
  /* Neutral colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  /* Status colors */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  /* Border and ring */
  --border: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}
```

### Dark Mode

```css
.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 84% 4.9%;
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... other dark mode colors */
}
```

### Custom Themes

Create custom themes by extending the base color system:

```tsx
// themes/custom.ts
export const customTheme = {
  name: 'custom',
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    // ... other custom colors
  }
};
```

## 📱 Responsive Design

All components support responsive design with breakpoints:

```tsx
// Responsive props example
<Button 
  size={{
    base: 'sm',
    md: 'md',
    lg: 'lg'
  }}
  variant={{
    base: 'outline',
    md: 'default'
  }}
>
  Responsive Button
</Button>
```

### Breakpoints

```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

## ♿ Accessibility

All components follow accessibility best practices:

### Keyboard Navigation
- Tab order follows logical flow
- All interactive elements are keyboard accessible
- Focus indicators are clearly visible

### Screen Reader Support
- Semantic HTML elements
- Proper ARIA labels and attributes
- Descriptive text for complex interactions

### Color Contrast
- WCAG 2.1 AA compliance
- Minimum 4.5:1 contrast ratio
- Color is not the only way to convey information

### Example: Accessible Button

```tsx
<Button
  aria-label="Save project"
  aria-describedby="save-help-text"
  disabled={isSaving}
>
  {isSaving ? (
    <>
      <Spinner aria-hidden="true" />
      Saving...
    </>
  ) : (
    'Save Project'
  )}
</Button>
```

## 🧪 Testing Components

### Component Testing

```tsx
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Visual Regression Testing

```bash
# Run visual tests with Storybook
npm run test:visual

# Update visual baselines
npm run test:visual -- --update-snapshots
```

### Accessibility Testing

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 📖 Storybook Integration

All components are documented in Storybook with interactive examples:

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

### Story Example

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Versatile button component with multiple variants and states.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button'
  }
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
};
```

## 🚀 Performance Optimization

### Code Splitting

Components are automatically code-split:

```tsx
// Lazy load heavy components
const Canvas = lazy(() => import('@/components/canvas/Canvas'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Canvas />
    </Suspense>
  );
}
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run analyze

# Check component sizes
npm run bundle-analyzer
```

### Optimization Tips

1. **Use Compound Components**: Reduce bundle size by importing only needed parts
2. **Implement Virtualization**: For large lists and tables
3. **Optimize Images**: Use next/image for automatic optimization
4. **Tree Shaking**: Ensure components support tree shaking

## 🔄 Contributing to Components

### Adding New Components

1. **Create Component File**:
   ```tsx
   // src/components/ui/new-component.tsx
   import { forwardRef } from 'react';
   import { cn } from '@/lib/utils';
   
   export interface NewComponentProps {
     // Define props
   }
   
   export const NewComponent = forwardRef<HTMLDivElement, NewComponentProps>(
     ({ className, ...props }, ref) => {
       return (
         <div
           ref={ref}
           className={cn("base-styles", className)}
           {...props}
         />
       );
     }
   );
   ```

2. **Add to Index**:
   ```tsx
   // src/components/ui/index.ts
   export { NewComponent } from './new-component';
   ```

3. **Create Stories**:
   ```tsx
   // src/components/ui/new-component.stories.tsx
   // Add Storybook stories
   ```

4. **Add Tests**:
   ```tsx
   // src/components/ui/new-component.test.tsx
   // Add component tests
   ```

5. **Update Documentation**:
   ```markdown
   <!-- docs/components/new-component.md -->
   # New Component Documentation
   ```

### Component Guidelines

- **Follow naming conventions**: Use PascalCase for components
- **Export interfaces**: Always export TypeScript interfaces
- **Support refs**: Use forwardRef for DOM components
- **Include className prop**: Allow style customization
- **Add JSDoc comments**: Document complex props
- **Test thoroughly**: Include unit and accessibility tests

---

**Explore the interactive component library in [Storybook](http://localhost:6006) to see all components in action!**