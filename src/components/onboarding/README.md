# Onboarding Wizard Component

A beautiful, animated onboarding wizard for guiding new users through the setup process.

## Features

- **Animated Mascot (Nexy)**: A friendly AI assistant that guides users through each step
- **Step-by-Step Progression**: Smooth transitions between steps with progress tracking
- **Experience Level Selection**: Customizes the experience based on user skill level
- **Project Type Selection**: Visual cards for different project templates
- **Natural Language Input**: Users can describe their project in their own words
- **Agent Integration**: Contextual AI agents provide personalized guidance
- **Animations**: Smooth transitions using framer-motion
- **Confetti Celebration**: Celebrates completion with confetti animation
- **Tooltips & Hints**: Helpful guidance throughout the process

## Components

### Main Components

- `OnboardingWizard`: Core wizard component with step management
- `OnboardingWithAgents`: Enhanced version with AI agent integration
- `Nexy`: Animated mascot component with different emotions

### Step Components

1. **WelcomeStep**: Animated introduction with feature highlights
2. **ExperienceLevelStep**: Visual selection of skill level (beginner/intermediate/advanced)
3. **ProjectTypeStep**: Template selection with popular options highlighted
4. **ProjectDetailsStep**: Project customization with natural language description
5. **SetupCompleteStep**: Celebration screen with next steps

### Supporting Components

- `OnboardingTooltip`: Contextual hints that appear automatically
- `useOnboarding`: Hook for managing onboarding state

## Usage

### Basic Usage

```tsx
import { OnboardingWizard } from '@/components/onboarding';

function App() {
  const handleComplete = (data) => {
    console.log('Onboarding completed:', data);
    // Save data and redirect
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}
```

### With Agent Integration

```tsx
import { OnboardingWithAgents } from '@/components/onboarding';

function App() {
  const handleComplete = (data) => {
    console.log('Onboarding completed:', data);
    // Data includes preferredAgent
  };

  return <OnboardingWithAgents onComplete={handleComplete} />;
}
```

### Using the Hook

```tsx
import { useOnboarding } from '@/hooks/useOnboarding';

function Dashboard() {
  const { isOnboardingCompleted, onboardingData, shouldShowOnboarding } = useOnboarding();

  if (shouldShowOnboarding()) {
    return <Redirect to="/onboarding" />;
  }

  // Use onboardingData to customize dashboard
}
```

## Data Structure

The onboarding wizard collects the following data:

```typescript
interface OnboardingData {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  projectType?: string;
  projectName?: string;
  projectDescription?: string;
  selectedFeatures?: string[];
  preferredAgent?: string; // When using OnboardingWithAgents
}
```

## Customization

### Adding New Project Types

Edit `ProjectTypeStep.tsx` and add to the `projectTypes` array:

```tsx
{
  id: 'new-type',
  title: 'New Project Type',
  description: 'Description here',
  icon: IconComponent,
  color: 'from-color-500 to-color-600',
  tags: ['Tag1', 'Tag2'],
  popular: true // Optional
}
```

### Customizing Features

Features are dynamically selected based on project type in `ProjectDetailsStep.tsx`.

### Styling

The component uses Tailwind CSS and follows the design system established in the UI components.

## Dependencies

- React 19
- framer-motion: For animations
- canvas-confetti: For celebration effects
- lucide-react: For icons
- @radix-ui components: For UI primitives