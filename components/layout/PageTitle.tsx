import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Standard page title with optional icon
 * Provides consistent spacing and typography
 */
export function PageTitle({ children, icon: Icon, className }: PageTitleProps) {
  return (
    <div className={cn('flex items-center gap-3 mb-8', className)}>
      {Icon && <Icon className="h-8 w-8" />}
      <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
    </div>
  );
}
