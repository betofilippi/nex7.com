# Canvas Component System

A drag-and-drop visual canvas system built with React Flow and Framer Motion.

## Installation

Before using the canvas components, install the required dependencies:

```bash
npm install reactflow @reactflow/core @reactflow/controls @reactflow/background framer-motion lucide-react
```

## Usage

```tsx
import { Canvas } from '@/components/canvas';

function MyPage() {
  return <Canvas />;
}
```

## Features

### Node Types

1. **GitHub Node** - Integration with GitHub repositories
   - Repository configuration
   - Branch selection
   - Webhook URL setup

2. **Claude Node** - AI integration
   - Model selection (Opus, Sonnet, Haiku)
   - Prompt configuration
   - Temperature control

3. **Vercel Node** - Deployment integration
   - Project name
   - Domain configuration
   - Environment selection

4. **Conditional Node** - Logic branching
   - Condition expression
   - True/False outputs
   - Multiple output handles

### Canvas Features

- **Drag & Drop** - Drag nodes from the palette onto the canvas
- **Connections** - Create bezier curve connections between nodes
- **Zoom & Pan** - Navigate the canvas with mouse controls
- **Mini Map** - Overview of the entire canvas
- **Grid Background** - Visual alignment aid
- **Context Menus** - Right-click node actions
- **Inline Editing** - Edit node labels directly
- **Node Editor** - Advanced properties editor modal

### Interactions

- **Add Nodes**: Drag from the node palette on the left
- **Connect Nodes**: Drag from output handle to input handle
- **Edit Node**: Click the menu icon and select "Edit Properties"
- **Delete Node**: Click the menu icon and select "Delete"
- **Duplicate Node**: Click the menu icon and select "Duplicate"
- **Pan Canvas**: Click and drag on empty space
- **Zoom**: Use mouse wheel or zoom controls

## Customization

### Adding New Node Types

1. Create a new node component:
```tsx
const CustomNode: React.FC<NodeProps<CustomNodeData>> = (props) => {
  const context = useContext(CanvasContext);
  return (
    <DraggableNode
      {...props}
      nodeType="custom"
      onEdit={context?.onEdit}
      onDelete={context?.onDelete}
      onDuplicate={context?.onDuplicate}
    />
  );
};
```

2. Add to node types in Canvas.tsx:
```tsx
const nodeTypes = {
  // ... existing types
  custom: CustomNode,
};
```

3. Add to NodePalette.tsx:
```tsx
const nodes = [
  // ... existing nodes
  {
    type: 'custom',
    label: 'Custom Node',
    icon: <CustomIcon className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
  },
];
```

### Styling

The canvas uses Tailwind CSS classes. Key color schemes:
- GitHub: Gray gradient
- Claude: Orange gradient
- Vercel: Black gradient
- Conditional: Blue gradient

## Architecture

- **Canvas.tsx** - Main container with React Flow setup
- **DraggableNode.tsx** - Base node component with common functionality
- **Node Components** - Specific node type implementations
- **CustomEdge.tsx** - Styled connection lines
- **NodePalette.tsx** - Draggable node selector
- **NodeEditor.tsx** - Modal for editing node properties
- **CanvasContext.tsx** - Context for sharing callbacks
- **types.ts** - TypeScript interfaces and types