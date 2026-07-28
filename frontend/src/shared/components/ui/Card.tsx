import React from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glass = false, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-200',
        glass
          ? 'glass-card shadow-lg shadow-slate-200/50'
          : 'bg-white border border-slate-200/80 shadow-md shadow-slate-200/40',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
