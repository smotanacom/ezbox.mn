import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * Standard page container with consistent max-width and padding
 * Use this for all page layouts to maintain consistency
 */
export function PageContainer({ children, className, noPadding = false }: PageContainerProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <main className={cn(
        'max-w-7xl mx-auto',
        !noPadding && 'px-4 py-8 sm:px-6 lg:px-8'
      )}>
        {children}
      </main>
    </div>
  );
}
