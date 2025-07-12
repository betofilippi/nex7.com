'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Book, Code, Settings, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocSearchResult {
  id: string;
  title: string;
  description: string;
  path: string;
  category: string;
  tags: string[];
  content?: string;
}

// Mock documentation index - in a real app, this would come from a search service
const documentationIndex: DocSearchResult[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Quick setup guide to get NEX7 running in minutes',
    path: '/docs/getting-started',
    category: 'setup',
    tags: ['beginner', 'installation', 'quick-start'],
    content: 'NEX7 setup installation environment Claude API key'
  },
  {
    id: 'agent-system',
    title: 'Agent System Guide',
    description: 'Learn to work with AI agents and multi-agent collaboration',
    path: '/docs/user-guide/agent-system',
    category: 'agents',
    tags: ['ai', 'agents', 'collaboration', 'nexy', 'dev'],
    content: 'AI agents Claude Nexy Dev Designer Teacher Debugger collaboration'
  },
  {
    id: 'canvas-workflow',
    title: 'Canvas Workflow Tutorial',
    description: 'Master visual drag-and-drop workflow creation',
    path: '/docs/user-guide/canvas-workflow',
    category: 'workflows',
    tags: ['canvas', 'visual', 'workflows', 'automation'],
    content: 'canvas visual workflow drag drop nodes connections automation'
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Complete REST API documentation with examples',
    path: '/docs/api-reference',
    category: 'api',
    tags: ['api', 'rest', 'endpoints', 'reference'],
    content: 'API REST endpoints authentication projects agents workflows'
  },
  {
    id: 'deployment',
    title: 'Deployment Guide',
    description: 'Deploy NEX7 to production with auto-recovery',
    path: '/docs/deployment',
    category: 'deployment',
    tags: ['deployment', 'production', 'vercel', 'docker'],
    content: 'deployment production Vercel Docker auto-recovery monitoring'
  },
  {
    id: 'architecture',
    title: 'Architecture Overview',
    description: 'System architecture and technical implementation',
    path: '/docs/developer-guide/architecture',
    category: 'development',
    tags: ['architecture', 'technical', 'design', 'system'],
    content: 'architecture system design technical implementation patterns'
  },
  {
    id: 'components',
    title: 'Component Library',
    description: 'UI component documentation and examples',
    path: '/docs/components',
    category: 'components',
    tags: ['components', 'ui', 'react', 'storybook'],
    content: 'components UI React TypeScript shadcn Tailwind CSS'
  },
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Frequently asked questions and answers',
    path: '/docs/user-guide/faq',
    category: 'help',
    tags: ['faq', 'questions', 'help', 'support'],
    content: 'FAQ questions answers help support troubleshooting'
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting Guide',
    description: 'Solutions for common issues and problems',
    path: '/docs/user-guide/troubleshooting',
    category: 'help',
    tags: ['troubleshooting', 'issues', 'problems', 'solutions'],
    content: 'troubleshooting problems solutions errors debugging fixes'
  }
];

const categoryIcons = {
  setup: FileText,
  agents: Users,
  workflows: Settings,
  api: Code,
  deployment: Settings,
  development: Code,
  components: Book,
  help: FileText
};

const categoryColors = {
  setup: 'bg-blue-100 text-blue-800',
  agents: 'bg-purple-100 text-purple-800',
  workflows: 'bg-green-100 text-green-800',
  api: 'bg-orange-100 text-orange-800',
  deployment: 'bg-red-100 text-red-800',
  development: 'bg-gray-100 text-gray-800',
  components: 'bg-pink-100 text-pink-800',
  help: 'bg-yellow-100 text-yellow-800'
};

export function DocumentationSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return documentationIndex
      .map(doc => {
        let score = 0;
        const titleLower = doc.title.toLowerCase();
        const descriptionLower = doc.description.toLowerCase();
        const contentLower = doc.content?.toLowerCase() || '';
        const tagsLower = doc.tags.join(' ').toLowerCase();

        searchTerms.forEach(term => {
          // Title matches get highest score
          if (titleLower.includes(term)) score += 10;
          // Description matches get medium score
          if (descriptionLower.includes(term)) score += 5;
          // Tag matches get medium score
          if (tagsLower.includes(term)) score += 5;
          // Content matches get low score
          if (contentLower.includes(term)) score += 1;
        });

        return { ...doc, score };
      })
      .filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Limit to top 8 results
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          window.location.href = filteredResults[selectedIndex].path;
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    let highlightedText = text;
    
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(
        regex, 
        '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>'
      );
    });
    
    return highlightedText;
  };

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
          }}
          onFocus={() => setIsOpen(query.trim().length > 0)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
          >
            ×
          </Button>
        )}
      </div>

      {isOpen && filteredResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 border shadow-lg">
          <ScrollArea className="max-h-96">
            <CardContent className="p-0">
              {filteredResults.map((result, index) => {
                const Icon = categoryIcons[result.category as keyof typeof categoryIcons] || FileText;
                const isSelected = index === selectedIndex;
                
                return (
                  <div
                    key={result.id}
                    className={`p-4 border-b last:border-b-0 cursor-pointer transition-colors ${
                      isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => window.location.href = result.path}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 
                            className="font-medium text-sm"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(result.title, query)
                            }}
                          />
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${categoryColors[result.category as keyof typeof categoryColors]}`}
                          >
                            {result.category}
                          </Badge>
                        </div>
                        <p 
                          className="text-sm text-muted-foreground mb-2"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(result.description, query)
                          }}
                        />
                        {result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.tags.slice(0, 3).map(tag => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {result.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{result.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </ScrollArea>
          
          <div className="border-t p-2 text-xs text-muted-foreground bg-muted/30">
            <div className="flex items-center justify-between">
              <span>
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 text-xs bg-background border rounded">↑↓</kbd>
                <span>navigate</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-background border rounded">↵</kbd>
                <span>select</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-background border rounded">esc</kbd>
                <span>close</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {isOpen && query.trim().length > 0 && filteredResults.length === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 border shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Search className="h-8 w-8" />
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs">Try different keywords or check the FAQ</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Quick search command palette component
export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
        <Card className="border shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search Documentation</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                ×
              </Button>
            </div>
            <DocumentationSearch />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DocumentationSearch;