import type React from 'react';
import { cn } from "@/lib/utils";
import { FooterToolbar } from './FooterToolbar'; // Import the FooterToolbar

interface CVForgeLayoutProps {
  inputSection: React.ReactNode;
  previewSection: React.ReactNode;
  // Add handlers for toolbar actions
  onPreview: () => void;
  onChangeColor: () => void;
  onChangeLanguage: () => void;
}

export function CVForgeLayout({ inputSection, previewSection, onPreview, onChangeColor, onChangeLanguage }: CVForgeLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-secondary relative pb-16 md:pb-0"> {/* Added relative positioning and bottom padding for mobile */}
      {/* Input Section */}
      <div className="w-full md:w-1/2 lg:w-2/5 p-4 md:p-6 lg:p-8 overflow-y-auto bg-background shadow-lg md:h-screen"> {/* Ensure height for scrolling */}
        {inputSection}
      </div>

      {/* Preview Section */}
      {/* Added print styles to hide toolbar and ensure full height */}
      <div className="w-full md:w-1/2 lg:w-3/5 p-4 md:p-6 lg:p-8 overflow-y-auto md:h-screen print:p-0 print:m-0 print:overflow-visible print:h-auto print:shadow-none">
        {previewSection}
      </div>

      {/* Footer Toolbar */}
      {/* Added print:hidden to hide during printing */}
      <FooterToolbar
        onPreview={onPreview}
        onChangeColor={onChangeColor}
        onChangeLanguage={onChangeLanguage}
        className="print:hidden"
      />
    </div>
  );
}
