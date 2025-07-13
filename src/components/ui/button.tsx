export function Button({ children, onClick, variant = 'default', className = '', disabled = false, size = 'md' }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | string;
}) {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
    link: 'text-blue-600 hover:underline',
  };
  
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const sizeClass = sizes[size as keyof typeof sizes] || sizes.md;
  const variantClass = variants[variant as keyof typeof variants] || variants.default;
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClass} rounded-md font-medium transition-colors ${variantClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
}