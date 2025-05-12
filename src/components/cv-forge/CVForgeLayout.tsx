import type React from 'react';
import { cn } from "@/lib/utils";
// Removed FooterToolbar import

interface CVForgeLayoutProps {
  inputSection: React.ReactNode;
  previewSection: React.ReactNode;
  // Removed toolbar props
}

export function CVForgeLayout({ inputSection, previewSection }: CVForgeLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-secondary"> {/* Removed relative positioning and bottom padding */}
      {/* Input Section */}
      <div className="w-full md:w-1/2 lg:w-2/5 p-4 md:p-6 lg:p-8 overflow-y-auto bg-background shadow-lg md:h-screen"> {/* Ensure height for scrolling */}
        {inputSection}
      </div>

      {/* Preview Section */}
      {/* Kept print styles as they are generally useful */}
      <div className="w-full md:w-1/2 lg:w-3/5 p-4 md:p-6 lg:p-8 overflow-y-auto md:h-screen print:p-0 print:m-0 print:overflow-visible print:h-auto print:shadow-none">
        {previewSection}
      </div>

      {/* Footer Toolbar Removed */}
    </div>
  );
}
