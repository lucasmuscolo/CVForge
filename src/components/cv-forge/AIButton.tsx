
'use client';

import type React from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation'; // Import useTranslation

interface AIButtonProps {
  onClick: () => void;
  isLoading: boolean;
  tooltipContent?: string; // Keep this prop, but use translation as default
  className?: string;
}

export function AIButton({ onClick, isLoading, tooltipContent, className }: AIButtonProps) {
  const { t } = useTranslation(); // Get translation function
  // Use provided tooltip content or default translated one
  const finalTooltipContent = tooltipContent || t('aiEnhance.buttonTooltip');

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
            aria-label={finalTooltipContent} // Add aria-label for accessibility
          >
            <Wand2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">{finalTooltipContent}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{finalTooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

  