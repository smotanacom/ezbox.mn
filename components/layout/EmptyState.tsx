import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Standard empty state component
 * Use for cart, search results, etc.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn('p-12', className)}>
      <div className="flex flex-col items-center text-center">
        <Icon className="h-20 w-20 mb-4 text-muted-foreground opacity-20" />
        <p className="text-xl mb-2 text-muted-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
        )}
        {action && <div>{action}</div>}
      </div>
    </Card>
  );
}
