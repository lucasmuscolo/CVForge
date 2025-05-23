
// src/app/cv/final/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CVPreview } from '@/components/cv-forge/CVPreview';
import type { CvData } from '@/components/cv-forge/types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2, Copy } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext'; 
import { getCvData, getUserProfile, type UserProfile } from '@/lib/firebase/firestore'; 
import { Skeleton } from '@/components/ui/skeleton'; 
import { useTranslation } from '@/hooks/useTranslation'; 
import { LanguageSwitcher } from '@/components/LanguageSwitcher'; 

// Default empty state
const defaultCvData: CvData = {
  personalInfo: { name: '', title: '', phone: '', email: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: '' },
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

export default function FinalCVPage() {
  const { currentUser, loading: authLoading } = useAuth(); 
  const { t } = useTranslation(); 
  const router = useRouter();
  const [cvData, setCvData] = useState<CvData | null>(null); 
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const { toast } = useToast();

   // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);


  // Load data from Firestore on mount for the logged-in user
  useEffect(() => {
    if (currentUser && isLoadingData) { 
      const loadData = async () => {
        try {
          // Load CV Data
          const loadedCvData = await getCvData(currentUser.uid);
           const dataToSet = loadedCvData ? {
                ...defaultCvData, 
                ...loadedCvData,
                personalInfo: { ...defaultCvData.personalInfo, ...(loadedCvData.personalInfo || {}) },
                experience: (loadedCvData.experience || []).map(exp => ({ ...exp, id: exp.id || crypto.randomUUID() })),
                education: (loadedCvData.education || []).map(edu => ({ ...edu, id: edu.id || crypto.randomUUID() })),
                skills: Array.isArray(loadedCvData.skills) ? loadedCvData.skills : [],
                projects: (loadedCvData.projects || []).map(proj => ({ ...proj, id: proj.id || crypto.randomUUID() })),
            } : defaultCvData; 
          setCvData(dataToSet);

          // Load User Profile
          const loadedUserProfile = await getUserProfile(currentUser.uid);
          setUserProfile(loadedUserProfile);

        } catch (error) {
          console.error("Failed to load user data from Firestore:", error);
          toast({
            title: t('finalCvPage.errorLoading'),
            description: t('finalCvPage.errorLoadingDesc'),
            variant: "destructive",
          });
           setCvData(defaultCvData); 
           setUserProfile(null); 
        } finally {
          setIsLoadingData(false); 
        }
      };
      loadData();
    } else if (!currentUser && !authLoading) {
        setCvData(defaultCvData);
        setUserProfile(null);
        setIsLoadingData(false);
    }
  }, [currentUser, isLoadingData, toast, authLoading, t]); 

  const handlePrint = () => {
      if (typeof window !== 'undefined') {
        window.print();
      }
  };

  const handleBack = () => {
    router.push('/cv-editor'); // Explicitly go to editor page
  };

  const handleCopyCode = useCallback(async () => {
    if (userProfile && userProfile.userType === 'creator' && userProfile.cvCode) {
    try {
        await navigator.clipboard.writeText(userProfile.cvCode);
        toast({ title: t('cvForge.codeCopied'), description: t('cvForge.codeCopiedDesc') });
    } catch (err) {
        console.error('Failed to copy CV code: ', err);
        toast({ title: t('cvForge.copyFailed'), description: t('cvForge.copyFailedDesc'), variant: 'destructive' });
    }
    }
  }, [userProfile, toast, t]);


   if (authLoading || isLoadingData) {
     return (
        <div className="bg-secondary min-h-screen p-4 md:p-8">
           <div className="max-w-4xl mx-auto bg-background shadow-lg rounded-lg overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b">
                 <Skeleton className="h-10 w-10" /> 
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-20" /> 
                    <Skeleton className="h-8 w-24" /> 
                    <Skeleton className="h-10 w-32" /> 
                 </div>
              </div>
               <div className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                         <Skeleton className="h-24 w-24 rounded-full" />
                         <div className="flex-grow space-y-2">
                             <Skeleton className="h-8 w-3/4" />
                             <Skeleton className="h-6 w-1/2" />
                             <Skeleton className="h-4 w-full" />
                         </div>
                    </div>
                    <Skeleton className="h-20 w-full" /> 
                    <Skeleton className="h-16 w-full" /> 
                    <Skeleton className="h-24 w-full" /> 
                    <Skeleton className="h-32 w-full" /> 
                    <Skeleton className="h-40 w-full" /> 
               </div>
           </div>
        </div>
     );
   }

    if (!currentUser) {
        return <div className="flex justify-center items-center min-h-screen">{t('cvForge.redirectingLogin')}</div>;
    }

   if (!cvData) {
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
                {userProfile && userProfile.userType === 'creator' && userProfile.cvCode && (
                    <div className="flex items-center gap-1 p-1 border border-input rounded-md bg-card shadow-sm shrink-0">
                        <code className="font-mono text-xs px-2 py-1 bg-muted rounded-sm">{userProfile.cvCode}</code>
                        <Button variant="ghost" size="icon" onClick={handleCopyCode} aria-label={t('cvForge.copyCodeButton')} className="h-6 w-6">
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                )}
                <LanguageSwitcher />
                <Button onClick={handlePrint} variant="outline">
                   <Printer className="mr-2 h-4 w-4" />
                   {t('finalCvPage.print')}
                </Button>
            </div>
         </div>
        <div id="cv-preview-container" className="print:p-0 print:m-0">
            <CVPreview 
              data={cvData} 
              showFinalButton={false} 
              enableContentTranslation={true} // Enable content translation here
            />
        </div>
      </div>
    </div>
  );
}
