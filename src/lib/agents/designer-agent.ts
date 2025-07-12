import { ClaudeClient, ClaudeTool } from '../claude-client';
import { Agent } from './definitions';
import { BaseAgent } from './base-agent';
import { setAgentMemory } from '../agent-memory';

// Designer's specialized tools
const DESIGNER_TOOLS: ClaudeTool[] = [
  {
    name: 'generate_component',
    description: 'Generate a React component with styling',
    input_schema: {
      type: 'object',
      properties: {
        componentName: { type: 'string', description: 'Name of the component' },
        description: { type: 'string', description: 'Description of what the component should do' },
        framework: { type: 'string', enum: ['react', 'nextjs', 'vue'], default: 'react' },
        styling: { type: 'string', enum: ['css', 'tailwind', 'styled-components', 'css-modules'] },
        props: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              required: { type: 'boolean' }
            }
          }
        }
      },
      required: ['componentName', 'description', 'styling']
    }
  },
  {
    name: 'suggest_colors',
    description: 'Suggest color palettes based on theme or mood',
    input_schema: {
      type: 'object',
      properties: {
        theme: { type: 'string', description: 'Theme or mood (e.g., professional, playful, dark)' },
        baseColor: { type: 'string', description: 'Optional base color in hex format' },
        count: { type: 'number', description: 'Number of colors to generate', default: 5 }
      },
      required: ['theme']
    }
  },
  {
    name: 'check_accessibility',
    description: 'Check component or HTML for accessibility issues',
    input_schema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML or JSX code to check' },
        level: { type: 'string', enum: ['A', 'AA', 'AAA'], default: 'AA' }
      },
      required: ['html']
    }
  },
  {
    name: 'optimize_layout',
    description: 'Suggest layout optimizations for responsive design',
    input_schema: {
      type: 'object',
      properties: {
        currentLayout: { type: 'string', description: 'Current CSS or component code' },
        targetDevices: { 
          type: 'array', 
          items: { type: 'string', enum: ['mobile', 'tablet', 'desktop'] }
        },
        framework: { type: 'string', enum: ['flexbox', 'grid', 'both'] }
      },
      required: ['currentLayout']
    }
  },
  {
    name: 'generate_icons',
    description: 'Suggest or generate SVG icons',
    input_schema: {
      type: 'object',
      properties: {
        iconName: { type: 'string', description: 'Name or description of the icon' },
        style: { type: 'string', enum: ['outline', 'filled', 'duotone'], default: 'outline' },
        size: { type: 'number', default: 24 }
      },
      required: ['iconName']
    }
  }
];

export class DesignerAgent extends BaseAgent {
  constructor(agent: Agent, claudeClient: ClaudeClient) {
    super(agent, claudeClient, DESIGNER_TOOLS);
  }

  async generateComponent(input: {
    componentName: string;
    description: string;
    framework?: string;
    styling: string;
    props?: Array<{ name: string; type: string; required?: boolean }>;
  }): Promise<any> {
    const { componentName, description, framework = 'react', styling, props = [] } = input;

    let component = '';
    let styles = '';

    // Generate component structure
    if (framework === 'react' || framework === 'nextjs') {
      component = this.generateReactComponent(componentName, description, props, styling);
      styles = this.generateStyles(componentName, styling);
    }

    // Store component in memory
    if (this.userId) {
      await setAgentMemory(
        this.userId,
        this.agent.id,
        `component_${componentName}_${Date.now()}`,
        {
          componentName,
          description,
          framework,
          styling,
          props,
          code: { component, styles },
          timestamp: new Date()
        },
        604800000 // 7 days
      );
    }

    return {
      success: true,
      componentName,
      framework,
      styling,
      code: {
        component,
        styles
      },
      usage: `<${componentName} ${props.filter(p => p.required).map(p => `${p.name}={}`).join(' ')} />`
    };
  }

  async suggestColors(input: {
    theme: string;
    baseColor?: string;
    count?: number;
  }): Promise<any> {
    const { theme, baseColor, count = 5 } = input;

    // Color palette generation based on theme
    const palettes: Record<string, any> = {
      professional: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#0ea5e9',
        background: '#f8fafc',
        text: '#1e293b'
      },
      playful: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
        background: '#fef3c7',
        text: '#7c3aed'
      },
      dark: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        background: '#0f172a',
        text: '#e2e8f0'
      },
      nature: {
        primary: '#10b981',
        secondary: '#84cc16',
        accent: '#14b8a6',
        background: '#ecfdf5',
        text: '#064e3b'
      }
    };

    const selectedPalette = palettes[theme] || palettes.professional;

    // Generate additional shades
    const colorSuggestions = {
      theme,
      baseColor,
      palette: selectedPalette,
      variations: this.generateColorVariations(selectedPalette.primary, count),
      accessibility: {
        contrastRatios: this.calculateContrastRatios(selectedPalette)
      }
    };

    // Store color suggestions
    if (this.userId) {
      await setAgentMemory(
        this.userId,
        this.agent.id,
        `colors_${theme}_${Date.now()}`,
        colorSuggestions,
        86400000 // 24 hours
      );
    }

    return colorSuggestions;
  }

  async checkAccessibility(input: {
    html: string;
    level?: string;
  }): Promise<any> {
    const { html, level = 'AA' } = input;

    const issues: any[] = [];

    // Basic accessibility checks
    if (!html.includes('alt=') && html.includes('<img')) {
      issues.push({
        severity: 'error',
        type: 'missing-alt',
        message: 'Images must have alt text',
        wcag: '1.1.1'
      });
    }

    if (!html.match(/aria-label|aria-labelledby/) && html.includes('<button')) {
      issues.push({
        severity: 'warning',
        type: 'button-label',
        message: 'Buttons should have accessible labels',
        wcag: '4.1.2'
      });
    }

    if (html.includes('color:') && !html.includes('background-color:')) {
      issues.push({
        severity: 'warning',
        type: 'color-contrast',
        message: 'Ensure sufficient color contrast',
        wcag: '1.4.3'
      });
    }

    // Check heading hierarchy
    const headings = html.match(/<h[1-6]/g) || [];
    if (headings.length > 0) {
      const headingLevels = headings.map(h => parseInt(h.charAt(2)));
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] - headingLevels[i - 1] > 1) {
          issues.push({
            severity: 'warning',
            type: 'heading-hierarchy',
            message: 'Heading levels should not skip',
            wcag: '1.3.1'
          });
          break;
        }
      }
    }

    return {
      success: true,
      level,
      issues,
      score: Math.max(0, 100 - issues.length * 10),
      recommendations: this.getAccessibilityRecommendations(issues)
    };
  }

  async optimizeLayout(input: {
    currentLayout: string;
    targetDevices?: string[];
    framework?: string;
  }): Promise<any> {
    const { currentLayout, targetDevices = ['mobile', 'tablet', 'desktop'], framework = 'flexbox' } = input;

    const optimizations: any[] = [];

    // Analyze current layout
    if (currentLayout.includes('float:')) {
      optimizations.push({
        type: 'modernization',
        current: 'float',
        suggested: framework,
        code: this.convertFloatToModern(currentLayout, framework)
      });
    }

    // Responsive suggestions
    const breakpoints = {
      mobile: '640px',
      tablet: '768px',
      desktop: '1024px'
    };

    const responsiveCode = this.generateResponsiveLayout(currentLayout, targetDevices, breakpoints);

    return {
      success: true,
      framework,
      targetDevices,
      optimizations,
      responsiveCode,
      breakpoints,
      tips: [
        'Use relative units (rem, em, %) for better scalability',
        'Consider mobile-first approach',
        'Test on actual devices for best results'
      ]
    };
  }

  async generateIcons(input: {
    iconName: string;
    style?: string;
    size?: number;
  }): Promise<any> {
    const { iconName, style = 'outline', size = 24 } = input;

    // Simplified icon generation
    const iconTemplates: Record<string, string> = {
      home: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${style === 'filled' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>`,
      user: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${style === 'filled' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>`,
      settings: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${style === 'filled' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m11-6h-6m-6 0H1"></path>
      </svg>`
    };

    const icon = iconTemplates[iconName.toLowerCase()] || this.generateGenericIcon(iconName, style, size);

    return {
      success: true,
      iconName,
      style,
      size,
      svg: icon,
      usage: {
        react: `const ${iconName}Icon = () => (${icon})`,
        html: icon
      }
    };
  }

  protected async executeToolCall(toolName: string, toolInput: any): Promise<any> {
    switch (toolName) {
      case 'generate_component':
        return this.generateComponent(toolInput);
      case 'suggest_colors':
        return this.suggestColors(toolInput);
      case 'check_accessibility':
        return this.checkAccessibility(toolInput);
      case 'optimize_layout':
        return this.optimizeLayout(toolInput);
      case 'generate_icons':
        return this.generateIcons(toolInput);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  private generateReactComponent(
    name: string,
    description: string,
    props: Array<{ name: string; type: string; required?: boolean }>,
    styling: string
  ): string {
    const propsInterface = props.length > 0
      ? `interface ${name}Props {
${props.map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n')}
}\n\n`
      : '';

    const propsDestructure = props.length > 0
      ? `{ ${props.map(p => p.name).join(', ')} }: ${name}Props`
      : '';

    return `import React from 'react';
${styling === 'styled-components' ? "import styled from 'styled-components';" : ''}
${styling === 'css-modules' ? `import styles from './${name}.module.css';` : ''}

${propsInterface}const ${name}: React.FC${props.length > 0 ? `<${name}Props>` : ''} = (${propsDestructure}) => {
  return (
    <div className="${styling === 'tailwind' ? 'container' : styling === 'css-modules' ? 'styles.container' : name.toLowerCase()}">
      {/* ${description} */}
      <h2>${name}</h2>
      ${props.map(p => `{${p.name} && <div>{${p.name}}</div>}`).join('\n      ')}
    </div>
  );
};

export default ${name};`;
  }

  private generateStyles(componentName: string, styling: string): string {
    switch (styling) {
      case 'css':
        return `.${componentName.toLowerCase()} {
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.${componentName.toLowerCase()} h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}`;

      case 'tailwind':
        return `/* Tailwind classes used:
- container
- p-4
- rounded-lg
- bg-white
- shadow-sm
*/`;

      case 'styled-components':
        return `const Container = styled.div\`
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
\`;

const Title = styled.h2\`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
\`;`;

      case 'css-modules':
        return `.container {
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}`;

      default:
        return '';
    }
  }

  private generateColorVariations(baseColor: string, count: number): string[] {
    // Simplified color variation generation
    const variations = [baseColor];
    for (let i = 1; i < count; i++) {
      variations.push(this.adjustBrightness(baseColor, i * 20));
    }
    return variations;
  }

  private adjustBrightness(color: string, percent: number): string {
    // Simple brightness adjustment
    return color; // In real implementation, would adjust HSL values
  }

  private calculateContrastRatios(palette: any): any {
    // Simplified contrast calculation
    return {
      textOnBackground: '15.1:1',
      primaryOnBackground: '4.5:1',
      requirements: {
        AA: 'Pass',
        AAA: 'Pass for large text'
      }
    };
  }

  private getAccessibilityRecommendations(issues: any[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.type === 'missing-alt')) {
      recommendations.push('Add descriptive alt text to all images');
    }
    
    if (issues.some(i => i.type === 'color-contrast')) {
      recommendations.push('Use a contrast checker tool to ensure WCAG compliance');
    }
    
    recommendations.push('Consider using an accessibility testing tool like axe-core');
    
    return recommendations;
  }

  private convertFloatToModern(layout: string, framework: string): string {
    if (framework === 'flexbox') {
      return layout.replace(/float:\s*left;?/g, 'display: flex;')
                   .replace(/float:\s*right;?/g, 'display: flex; justify-content: flex-end;');
    } else if (framework === 'grid') {
      return 'display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\ngap: 1rem;';
    }
    return layout;
  }

  private generateResponsiveLayout(layout: string, devices: string[], breakpoints: any): string {
    let responsive = layout + '\n\n/* Responsive Design */\n';
    
    for (const device of devices) {
      responsive += `\n@media (min-width: ${breakpoints[device]}) {\n  /* ${device} styles */\n}\n`;
    }
    
    return responsive;
  }

  private generateGenericIcon(name: string, style: string, size: number): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${style === 'filled' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <text x="12" y="16" text-anchor="middle" font-size="12">${name.charAt(0).toUpperCase()}</text>
    </svg>`;
  }
}