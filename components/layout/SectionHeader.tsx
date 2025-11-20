import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  spacing?: 'default' | 'large';
}

/**
 * Standard section header with optional action element
 * Use for major page sections
 */
export function SectionHeader({
  children,
  action,
  className,
  spacing = 'default'
}: SectionHeaderProps) {
  return (
    <div className={cn(
      'flex items-center justify-between',
      spacing === 'default' ? 'mb-6' : 'mb-8',
      className
    )}>
      <h2 className="text-2xl font-bold tracking-tight">{children}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}
