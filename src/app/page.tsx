
// src/app/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, type UseFormReturn, type FieldValues, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation'; // Import useRouter
import Image from 'next/image';
import { signOut } from 'firebase/auth'; // Import signOut

import { CVForgeLayout } from '@/components/cv-forge/CVForgeLayout';
import { PersonalInfoForm } from '@/components/cv-forge/PersonalInfoForm';
import { ExperienceForm } from '@/components/cv-forge/ExperienceForm';
import { EducationForm } from '@/components/cv-forge/EducationForm';
import { SkillsForm } from '@/components/cv-forge/SkillsForm';
import { CVPreview } from '@/components/cv-forge/CVPreview';
import type { CvData, PersonalInfo, ExperienceEntry, EducationEntry } from '@/components/cv-forge/types';
import { enhanceResumeLanguage } from '@/ai/flows/enhance-resume-language';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { auth } from '@/lib/firebase/config'; // Import auth instance
import { getCvData, saveCvData } from '@/lib/firebase/firestore'; // Import Firestore helpers
import { Button } from '@/components/ui/button'; // Import Button
import { LogOut } from 'lucide-react'; // Import LogOut icon
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from '@/hooks/useTranslation'; // Import useTranslation
import { LanguageSwitcher } from '@/components/LanguageSwitcher'; // Import LanguageSwitcher


// Zod Schemas remain the same (no translation needed for validation logic)
const personalInfoSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  title: z.string().min(1, 'Professional title is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  summary: z.string().optional(),
  photoDataUri: z.string().optional(),
});

const experienceEntrySchema = z.object({
  id: z.string(),
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required (use "Present" if current)'),
  responsibilities: z.string().optional(),
});

const educationEntrySchema = z.object({
  id: z.string(),
  degree: z.string().min(1, 'Degree/Certificate is required'),
  institution: z.string().min(1, 'Institution name is required'),
  location: z.string().optional(),
  graduationDate: z.string().min(1, 'Graduation date is required'),
  details: z.string().optional(),
});

const cvDataSchema = z.object({
  personalInfo: personalInfoSchema,
  experience: z.array(experienceEntrySchema),
  education: z.array(educationEntrySchema),
  skills: z.array(z.string()).optional(),
});

// Default empty state remains the same
const defaultCvData: CvData = {
  personalInfo: {
    name: '', title: '', phone: '', email: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: ''
  },
  experience: [],
  education: [],
  skills: [],
};

export default function CVForgePage() {
  const { currentUser, loading: authLoading } = useAuth(); // Get user and loading state
  const { t, locale } = useTranslation(); // Get translation function and current locale
  const router = useRouter();
  const [cvData, setCvData] = useState<CvData>(defaultCvData);
  const [isLoaded, setIsLoaded] = useState(false); // Tracks if data processing for current auth state is complete
  const [isSaving, setIsSaving] = useState(false); // Tracks saving state for navigation
  const [enhancingState, setEnhancingState] = useState<Record<string, boolean>>({});
  const { toast } = useToast();


  const form = useForm<CvData>({
    resolver: zodResolver(cvDataSchema),
    defaultValues: defaultCvData,
    mode: 'onChange', // Keep onChange for live preview updates
  });
  const { reset: formReset } = form; // Get a stable reference to form.reset

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);


  // Effect to reset `isLoaded` to `false` when `currentUser` changes (e.g., on logout or login of a different user).
  // This ensures the main effect re-evaluates and loads data for the new auth state.
  useEffect(() => {
    setIsLoaded(false);
  }, [currentUser, setIsLoaded]);

   // Load data from Firestore or set defaults based on auth state
  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to settle
    }

    if (currentUser) {
      // User is logged in. Load their data if not already loaded for this user.
      if (!isLoaded) {
        const loadUserData = async () => {
          try {
            const loadedData = await getCvData(currentUser.uid);
            const dataToSet = loadedData ? {
                ...defaultCvData,
                ...loadedData,
                personalInfo: { ...defaultCvData.personalInfo, ...(loadedData.personalInfo || {}) },
                experience: (loadedData.experience || []).map(exp => ({ ...exp, id: exp.id || crypto.randomUUID() })),
                education: (loadedData.education || []).map(edu => ({ ...edu, id: edu.id || crypto.randomUUID() })),
                skills: Array.isArray(loadedData.skills) ? loadedData.skills : [],
            } : defaultCvData;
            
            setCvData(dataToSet);
            formReset(dataToSet);
          } catch (error) {
            console.error("Failed to load CV data from Firestore:", error);
            toast({ title: t('cvForge.loadingData'), description: t('cvForge.loadingDataDesc'), variant: "destructive" });
            setCvData(defaultCvData);
            formReset(defaultCvData);
          } finally {
            setIsLoaded(true); // Mark data processing as complete
          }
        };
        loadUserData();
      }
    } else {
      // No current user (logged out or never logged in)
      // Set to defaults if not already processed for anonymous state
      if (!isLoaded) {
        setCvData(defaultCvData);
        formReset(defaultCvData);
        setIsLoaded(true); // Mark data processing (setting defaults) as complete
      }
    }
  }, [currentUser, authLoading, isLoaded, formReset, setCvData, setIsLoaded, toast, t]);


   // Update preview state on form changes
   useEffect(() => {
     if (!isLoaded) return; 

     const subscription = form.watch((value) => {
       const currentData = value as Partial<CvData>;
       if (currentData && currentData.personalInfo && currentData.experience && currentData.education) {
         const dataForPreview: CvData = {
           personalInfo: { ...defaultCvData.personalInfo, ...currentData.personalInfo },
           experience: currentData.experience.map(exp => ({ ...exp })),
           education: currentData.education.map(edu => ({ ...edu })),
           skills: Array.isArray(currentData.skills) ? currentData.skills : [],
         };
         setCvData(dataForPreview); 
       }
     });
     return () => subscription.unsubscribe();
   }, [form, isLoaded, setCvData]); // Removed cvData from deps, ensure setCvData is stable


  // --- Logout Handler ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: t('loginPage.loggedOut'), description: t('loginPage.loggedOutDesc') });
      // AuthProvider will handle redirecting to login via its own effect monitoring currentUser
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: t('loginPage.logoutFailed'),
        description: t('loginPage.logoutFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  // --- Save and Navigate Handler ---
  const handleSaveAndNavigate = async () => {
    if (!currentUser) {
        toast({ title: t('cvForge.notLoggedIn'), description: t('cvForge.notLoggedInDesc'), variant: "destructive" });
        return;
    }

    setIsSaving(true); 
    try {
        const isValid = await form.trigger();
        if (!isValid) {
             toast({ title: t('cvForge.validationError'), description: t('cvForge.validationErrorDesc'), variant: "destructive" });
             setIsSaving(false);
             return;
        }

      const currentFormData = form.getValues(); 
       const dataToSave: CvData = {
         personalInfo: { ...defaultCvData.personalInfo, ...currentFormData.personalInfo },
         experience: currentFormData.experience.map(exp => ({ ...exp })),
         education: currentFormData.education.map(edu => ({ ...edu })),
         skills: Array.isArray(currentFormData.skills) ? currentFormData.skills : [],
       };

      await saveCvData(currentUser.uid, dataToSave);
      toast({ title: t('cvForge.cvSavedSuccess'), description: t('cvForge.cvSavedSuccessDesc') });
      router.push('/cv/final'); 

    } catch (error) {
      console.error("Failed to save CV data to Firestore:", error);
      toast({
        title: t('cvForge.errorSaving'),
        description: t('cvForge.errorSavingDesc'),
        variant: "destructive",
      });
    } finally {
        setIsSaving(false); 
    }
  };


  // --- AI Enhancement Logic ---
   const getEnhancingKey = (
     section: 'personalInfo' | 'experience' | 'education' | 'skills',
     fieldName: string,
     index?: number
   ): string => {
     return index !== undefined ? `${section}-${index}-${fieldName}` : `${section}-${fieldName}`;
   };

  const enhanceText = useCallback(async (
     section: 'personalInfo' | 'experience' | 'education' | 'skills',
     fieldName: FieldPath<CvData>,
     currentText: string,
     index?: number 
   ) => {
      const key = getEnhancingKey(section, fieldName, index);
      if (!currentText?.trim()) {
         toast({ title: t('aiEnhance.inputRequired'), description: t('aiEnhance.inputRequiredDesc'), variant: "destructive" });
         return;
       }

      setEnhancingState(prev => ({ ...prev, [key]: true }));
      try {
         const result = await enhanceResumeLanguage({ sectionText: currentText, language: locale }); // Pass current locale
         if (result?.enhancedText) {
           form.setValue(fieldName as any, result.enhancedText, { shouldValidate: true, shouldDirty: true });
           toast({ title: t('aiEnhance.success'), description: t('aiEnhance.successDesc') });
         } else {
           throw new Error("AI did not return enhanced text.");
         }
     } catch (error) {
       console.error("AI enhancement failed:", error);
       toast({
         title: t('aiEnhance.failed'),
         description: t('aiEnhance.failedDesc'),
         variant: "destructive",
       });
     } finally {
       setEnhancingState(prev => ({ ...prev, [key]: false }));
     }
   }, [form, toast, t, locale]); // Added locale to dependencies


  const enhancePersonalInfo = useCallback(
    async (fieldName: keyof PersonalInfo, currentText: string) => {
        if (fieldName !== 'photoDataUri') {
            await enhanceText('personalInfo', `personalInfo.${fieldName}`, currentText || '');
        }
     },
     [enhanceText]
   );

   const enhanceExperienceText = useCallback(
     async (index: number, fieldName: keyof ExperienceEntry, currentText: string) => {
       await enhanceText('experience', `experience.${index}.${fieldName}`, currentText || '', index);
     },
     [enhanceText]
   );

   const isEnhancing = useCallback(
     (section: 'personalInfo' | 'experience' | 'education' | 'skills', fieldName: string, index?: number): boolean => {
       const key = getEnhancingKey(section, fieldName, index);
       return !!enhancingState[key];
     },
     [enhancingState]
   );

   const isEnhancingPersonalInfo = useCallback(
      (fieldName: keyof PersonalInfo): boolean => {
        if (fieldName !== 'photoDataUri') {
           return isEnhancing('personalInfo', fieldName);
        }
        return false;
      },
      [isEnhancing]
    );


   const isEnhancingExperience = useCallback(
     (index: number, fieldName: keyof ExperienceEntry): boolean => {
        if (fieldName === 'responsibilities') {
             return isEnhancing('experience', fieldName, index);
        }
        return false;
     },
     [isEnhancing]
   );

   // Memoize components
   const inputSection = useMemo(() => (
       <div className="space-y-6">
         <div className="flex justify-between items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">{t('cvForge.title')}</h1>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {currentUser && (
                   <Button onClick={handleLogout} variant="outline" size="sm">
                       <LogOut className="mr-2 h-4 w-4" /> {t('cvForge.logout')}
                   </Button>
              )}
             </div>
         </div>
         <p className="text-muted-foreground">{t('cvForge.description')}</p>
         <PersonalInfoForm
             form={form as UseFormReturn<any>}
            enhanceText={enhancePersonalInfo}
            isEnhancing={isEnhancingPersonalInfo}
         />
         <ExperienceForm form={form} enhanceText={enhanceExperienceText} isEnhancing={isEnhancingExperience} />
         <EducationForm form={form} />
         <SkillsForm form={form} />
       </div>
     ), [form, enhancePersonalInfo, isEnhancingPersonalInfo, enhanceExperienceText, isEnhancingExperience, currentUser, t, handleLogout]); 

   const previewSection = useMemo(() => (
       <div className="md:sticky md:top-6 print:static print:top-auto">
           <h2 className="text-xl font-semibold mb-4 text-primary print:hidden">{t('cvForge.livePreview')}</h2>
           <CVPreview
             data={cvData}
             onViewFinalClick={handleSaveAndNavigate} 
             isSaving={isSaving} 
             showFinalButton={true} 
           />
       </div>
   ), [cvData, isSaving, t, handleSaveAndNavigate]); 


   if (authLoading || (!isLoaded && currentUser)) {
     return (
        <div className="flex flex-col md:flex-row min-h-screen bg-secondary">
             <div className="w-full md:w-1/2 lg:w-2/5 p-4 md:p-6 lg:p-8 bg-background shadow-lg space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-40 w-full" />
             </div>
             <div className="w-full md:w-1/2 lg:w-3/5 p-4 md:p-6 lg:p-8">
                 <Skeleton className="h-6 w-32 mb-4" />
                 <Skeleton className="h-[80vh] w-full" />
             </div>
        </div>
    );
   }

   if (!currentUser && !authLoading) { // If auth is done and still no user, show login redirect message
       return <div className="flex justify-center items-center min-h-screen">{t('cvForge.redirectingLogin')}</div>;
   }


  return (
    <>
      <CVForgeLayout
        inputSection={inputSection}
        previewSection={previewSection}
      />
      <Toaster />
    </>
  );
}

  

