import React from 'react';

interface ModernScaleProps {
  className?: string;
  size?: number;
}

export const ModernScale: React.FC<ModernScaleProps> = ({ 
  className = 'w-4 h-4',
  size
}) => {
  const sizeStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <span 
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={sizeStyle}
      role="img"
      aria-label="Weight scale"
    >
      <span className="relative w-full h-full rounded-[24%] border-[1.75px] border-current flex flex-col items-center justify-between p-[12%] select-none overflow-hidden box-border">
        {/* Top Digital Screen */}
        <span className="w-[52%] h-[20%] rounded-[1.5px] bg-current opacity-90 flex items-center justify-center shrink-0">
          <span className="w-[60%] h-[1px] bg-white dark:bg-slate-900 rounded-full opacity-90" />
        </span>

        {/* Center Smart Scale Sensor / Electrode Disc */}
        <span className="w-[46%] h-[46%] rounded-full border border-current opacity-70 flex items-center justify-center shrink-0">
          <span className="w-[36%] h-[36%] rounded-full bg-current opacity-80" />
        </span>

        {/* Subtle base alignment line */}
        <span className="w-[60%] h-[1px] bg-current opacity-35 rounded-full shrink-0" />
      </span>
    </span>
  );
};

export default ModernScale;
