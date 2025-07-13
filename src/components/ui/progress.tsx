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
