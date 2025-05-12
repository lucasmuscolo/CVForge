'use client';

import type React from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AIButtonProps {
  onClick: () => void;
  isLoading: boolean;
  tooltipContent?: string;
  className?: string;
}

export function AIButton({ onClick, isLoading, tooltipContent = 'Enhance with AI', className }: AIButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={isLoading}
            className={className}
          >
            <Wand2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Enhance with AI</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
