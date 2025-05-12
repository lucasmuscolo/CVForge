// src/app/cv/final/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { CVPreview } from '@/components/cv-forge/CVPreview';
import type { CvData } from '@/components/cv-forge/types';
import { Button } from '@/components/ui/button'; // Import Button
import { Printer, ArrowLeft } from 'lucide-react'; // Import Printer and ArrowLeft icons
import { useToast } from '@/hooks/use-toast'; // Import useToast

const LOCAL_STORAGE_KEY = 'cvForgeData';

// Default empty state in case local storage is empty or invalid
const defaultCvData: CvData = {
  personalInfo: { name: '', title: '', phone: '', email: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: '' },
  experience: [],
  education: [],
  skills: [],
};

export default function FinalCVPage() {
  const [cvData, setCvData] = useState<CvData>(defaultCvData);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const router = useRouter(); // Initialize router

  // Load data from local storage on mount
  useEffect(() => {
    // Use try-catch for window access to avoid SSR errors
    try {
      const savedData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Basic validation
        if (parsedData && parsedData.personalInfo && Array.isArray(parsedData.experience) && Array.isArray(parsedData.education)) {
           // Ensure IDs are present for array items, photoDataUri exists, and skills is an array
            const validatedData: CvData = {
                ...defaultCvData, // Start with defaults to ensure all fields exist
                ...parsedData,
                personalInfo: {
                    ...defaultCvData.personalInfo, // Ensure all personalInfo fields exist
                    ...parsedData.personalInfo,
                },
                experience: parsedData.experience.map((exp: any) => ({ ...exp, id: exp.id || crypto.randomUUID() })),
                education: parsedData.education.map((edu: any) => ({ ...edu, id: edu.id || crypto.randomUUID() })),
                skills: Array.isArray(parsedData.skills) ? parsedData.skills : [], // Ensure skills is an array
            };
            setCvData(validatedData);
        } else {
            // Reset to default if structure is invalid
            setCvData(defaultCvData);
             toast({
                title: "Data Error",
                description: "Could not load valid CV data from storage. Displaying default.",
                variant: "destructive",
            });
        }
      } else {
        // No data found, use default
         setCvData(defaultCvData);
         toast({
            title: "No CV Data Found",
            description: "Start creating your CV on the main page.",
            variant: "default",
         });
      }
    } catch (error) {
      console.error("Failed to load or parse CV data from local storage:", error);
       // Reset to default if error occurs
      setCvData(defaultCvData);
      toast({
          title: "Loading Error",
          description: "Failed to load CV data from local storage.",
          variant: "destructive",
      });
    }
    setIsLoaded(true);
  }, [toast]); // Added toast dependency

  const handlePrint = () => {
      // Access window object safely
      if (typeof window !== 'undefined') {
        window.print();
      }
  };

  const handleBack = () => {
    router.back(); // Navigate to the previous page
  };


  if (!isLoaded) {
    return <div className="flex justify-center items-center min-h-screen">Loading Final CV...</div>;
  }

  return (
    <div className="bg-secondary min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-background shadow-lg rounded-lg overflow-hidden">
         {/* Header with Buttons (Hidden on Print) */}
         <div className="p-4 flex justify-between items-center border-b print:hidden">
            {/* Back Button */}
            <Button onClick={handleBack} variant="outline" size="icon">
               <ArrowLeft className="h-4 w-4" />
               <span className="sr-only">Back</span>
            </Button>
            {/* Print Button */}
            <Button onClick={handlePrint} variant="outline">
               <Printer className="mr-2 h-4 w-4" />
               Print / Save as PDF
            </Button>
         </div>
        {/* Render the CV Preview component */}
        {/* Ensure the preview itself doesn't have extra padding/margins for printing */}
        <div className="print:p-0 print:m-0">
            {/* Pass showFinalButton={false} to hide the button */}
            <CVPreview data={cvData} showFinalButton={false} />
        </div>
      </div>
    </div>
  );
}
