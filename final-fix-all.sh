#!/bin/bash

echo "🚀 CORREÇÃO FINAL DEFINITIVA"
echo "============================"

# Atualizar componentes UI para aceitar className
echo "📝 Atualizando componentes UI..."

# Card com className
cat > src/components/ui/card.tsx << 'EOF'
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border p-6 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-gray-600 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-4 ${className}`}>{children}</div>;
}
EOF

# Progress com className e style
cat > src/components/ui/progress.tsx << 'EOF'
export function Progress({ value = 0, className = '', style = {} }: { 
  value?: number; 
  className?: string; 
  style?: React.CSSProperties;
}) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`} style={style}>
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
EOF

# Badge com className
cat > src/components/ui/badge.tsx << 'EOF'
export function Badge({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode; 
  variant?: string;
  className?: string;
}) {
  const colors = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant as keyof typeof colors] || colors.default} ${className}`}>
      {children}
    </span>
  );
}
EOF

echo "✅ Componentes UI atualizados"

# Build final
echo ""
echo "🔨 Build final..."
npm run build