// src/components/cv-forge/FooterToolbar.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Palette, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface FooterToolbarProps {
  onPreview: () => void;
  onChangeColor: () => void;
  onChangeLanguage: () => void;
  className?: string;
}

export function FooterToolbar({ onPreview, onChangeColor, onChangeLanguage, className }: FooterToolbarProps) {
  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-2 md:relative md:p-0 md:border-none md:bg-transparent", // Fixed at bottom on mobile, transparent/relative on desktop
        "flex justify-around items-center md:hidden", // Only flex layout on mobile, hidden on md+
        className // Allow parent to override styles (e.g., print:hidden)
      )}
    >
       {/* Desktop Toolbar (Positioned absolutely within the layout parent, potentially on the input side or preview side) */}
       {/* For simplicity, let's integrate actions into the main page for now. We can create a separate desktop toolbar later if needed. */}
       {/* Mobile Buttons */}
       <TooltipProvider>
         <Tooltip>
           <TooltipTrigger asChild>
             <Button variant="ghost" size="icon" onClick={onPreview}>
               <Eye className="h-5 w-5" />
               <span className="sr-only">Preview/Print CV</span>
             </Button>
           </TooltipTrigger>
           <TooltipContent>
             <p>Preview/Print CV</p>
           </TooltipContent>
         </Tooltip>

         <Tooltip>
           <TooltipTrigger asChild>
             <Button variant="ghost" size="icon" onClick={onChangeColor}>
               <Palette className="h-5 w-5" />
               <span className="sr-only">Change Colors</span>
             </Button>
           </TooltipTrigger>
           <TooltipContent>
             <p>Change Colors (Coming Soon)</p>
           </TooltipContent>
         </Tooltip>

         <Tooltip>
           <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onChangeLanguage}>
               <Languages className="h-5 w-5" />
               <span className="sr-only">Change Language</span>
             </Button>
           </TooltipTrigger>
           <TooltipContent>
             <p>Change Language (Coming Soon)</p>
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
    </footer>
  );
}
