import type React from 'react';
import { cn } from "@/lib/utils";

interface CVForgeLayoutProps {
  inputSection: React.ReactNode;
  previewSection: React.ReactNode;
}

export function CVForgeLayout({ inputSection, previewSection }: CVForgeLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-secondary">
      {/* Input Section */}
      <div className="w-full md:w-1/2 lg:w-2/5 p-4 md:p-6 lg:p-8 bg-background shadow-lg overflow-y-auto">
        {inputSection}
      </div>

      {/* Preview Section */}
      {/* Kept print styles as they are generally useful */}
      <div className="w-full md:w-1/2 lg:w-3/5 p-4 md:p-6 lg:p-8 print:p-0 print:m-0 print:overflow-visible print:h-auto print:shadow-none overflow-y-auto">
        {previewSection}
      </div>
    </div>
  );
}
