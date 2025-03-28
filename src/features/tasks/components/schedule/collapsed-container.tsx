import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { ChevronRight, X } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Button } from '../../../../shared/components/ui/button';

type CollapsedContainerProps = {
  children: ReactNode;
};

export default function CollapsedContainer({ children }: CollapsedContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div>
      <Collapsible
        open={isCollapsed}
        onOpenChange={setIsCollapsed}
        className="flex w-full items-center"
      >
        <CollapsibleTrigger className="flex items-center justify-between">
          <div className="flex items-center">
            {
              <Button
                size="sm"
                variant="ghost"
                className="flex max-w-max items-center gap-x-1.5 hover:bg-secondary"
              >
                {!isCollapsed && 'Schedule'}
                {isCollapsed ? <X /> : <ChevronRight />}
              </Button>
            }
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
