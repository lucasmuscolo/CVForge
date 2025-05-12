
// src/app/cv/final/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CVPreview } from '@/components/cv-forge/CVPreview';
import type { CvData } from '@/components/cv-forge/types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { getCvData } from '@/lib/firebase/firestore'; // Import Firestore helper
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { useTranslation } from '@/hooks/useTranslation'; // Import useTranslation
import { LanguageSwitcher } from '@/components/LanguageSwitcher'; // Import LanguageSwitcher

// Default empty state
const defaultCvData: CvData = {
  personalInfo: { name: '', title: '', phone: '', email: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: '' },
  experience: [],
  education: [],
  skills: [],
};

export default function FinalCVPage() {
  const { currentUser, loading: authLoading } = useAuth(); // Get user and loading state
  const { t } = useTranslation(); // Get translation function
  const router = useRouter();
  const [cvData, setCvData] = useState<CvData | null>(null); // Start with null to indicate loading
  const [isLoadingData, setIsLoadingData] = useState(true); // Separate loading state for Firestore data
  const { toast } = useToast();

   // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);


  // Load data from Firestore on mount for the logged-in user
  useEffect(() => {
    if (currentUser && isLoadingData) { // Only load if user exists and data hasn't been loaded yet
      const loadData = async () => {
        try {
          const loadedData = await getCvData(currentUser.uid);
           const dataToSet = loadedData ? {
                ...defaultCvData, // Ensure all base fields exist
                ...loadedData,
                personalInfo: { ...defaultCvData.personalInfo, ...(loadedData.personalInfo || {}) },
                experience: (loadedData.experience || []).map(exp => ({ ...exp, id: exp.id || crypto.randomUUID() })),
                education: (loadedData.education || []).map(edu => ({ ...edu, id: edu.id || crypto.randomUUID() })),
                skills: Array.isArray(loadedData.skills) ? loadedData.skills : [],
            } : defaultCvData; // Use default if no data found in Firestore

          setCvData(dataToSet);
        } catch (error) {
          console.error("Failed to load CV data from Firestore:", error);
          toast({
            title: t('finalCvPage.errorLoading'),
            description: t('finalCvPage.errorLoadingDesc'),
            variant: "destructive",
          });
           setCvData(defaultCvData); // Set to default on error
        } finally {
          setIsLoadingData(false); // Mark data loading as complete
        }
      };
      loadData();
    } else if (!currentUser && !authLoading) {
        // Handle case where user logs out or was never logged in
        setCvData(defaultCvData);
        setIsLoadingData(false);
    }
  }, [currentUser, isLoadingData, toast, authLoading, t]); // Added authLoading and t

  const handlePrint = () => {
      if (typeof window !== 'undefined') {
        window.print();
      }
  };

  const handleBack = () => {
    router.back();
  };

   // Show loading state while checking auth or fetching data
   if (authLoading || isLoadingData) {
     return (
        <div className="bg-secondary min-h-screen p-4 md:p-8">
           <div className="max-w-4xl mx-auto bg-background shadow-lg rounded-lg overflow-hidden">
              {/* Skeleton Header */}
              <div className="p-4 flex justify-between items-center border-b">
                 <Skeleton className="h-10 w-10" />
                 <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                 </div>
              </div>
               {/* Skeleton Preview */}
               <div className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                         <Skeleton className="h-24 w-24 rounded-full" />
                         <div className="flex-grow space-y-2">
                             <Skeleton className="h-8 w-3/4" />
                             <Skeleton className="h-6 w-1/2" />
                             <Skeleton className="h-4 w-full" />
                         </div>
                    </div>
                    <Skeleton className="h-20 w-full" /> {/* Summary */}
                    <Skeleton className="h-16 w-full" /> {/* Skills */}
                    <Skeleton className="h-40 w-full" /> {/* Experience */}
                    <Skeleton className="h-32 w-full" /> {/* Education */}
               </div>
           </div>
        </div>
     );
   }

    // Ensure currentUser exists before rendering the main content
    if (!currentUser) {
         // Should be redirected by the effect, but render this as fallback
        return <div className="flex justify-center items-center min-h-screen">{t('cvForge.redirectingLogin')}</div>;
    }

   // Ensure cvData is loaded before rendering the preview
   if (!cvData) {
        // This state might occur briefly or if loading fails without setting default
        return <div className="flex justify-center items-center min-h-screen">{t('finalCvPage.loadingCV')}</div>;
    }

  return (
    <div className="bg-secondary min-h-screen p-4 md:p-8 print:bg-transparent print:p-0">
      <div className="max-w-4xl mx-auto bg-background shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none print:border-none print:bg-transparent">
         <div className="p-4 flex justify-between items-center border-b print:hidden">
            <Button onClick={handleBack} variant="outline" size="icon" aria-label={t('finalCvPage.back')}>
               <ArrowLeft className="h-4 w-4" />
               <span className="sr-only">{t('finalCvPage.back')}</span>
            </Button>
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Button onClick={handlePrint} variant="outline">
                   <Printer className="mr-2 h-4 w-4" />
                   {t('finalCvPage.print')}
                </Button>
            </div>
         </div>
        {/* Wrap CVPreview in a div with specific ID for print styling */}
        <div id="cv-preview-container" className="print:p-0 print:m-0">
            <CVPreview data={cvData} showFinalButton={false} />
        </div>
      </div>
    </div>
  );
}

  