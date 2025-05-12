'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, type UseFormReturn, type FieldValues, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image'; // Import next/image

import { CVForgeLayout } from '@/components/cv-forge/CVForgeLayout';
import { PersonalInfoForm } from '@/components/cv-forge/PersonalInfoForm';
import { ExperienceForm } from '@/components/cv-forge/ExperienceForm';
import { EducationForm } from '@/components/cv-forge/EducationForm';
import { SkillsForm } from '@/components/cv-forge/SkillsForm'; // Import SkillsForm
import { CVPreview } from '@/components/cv-forge/CVPreview';
import type { CvData, PersonalInfo, ExperienceEntry, EducationEntry } from '@/components/cv-forge/types';
import { enhanceResumeLanguage } from '@/ai/flows/enhance-resume-language';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'cvForgeData';

// Zod Schemas for validation
const personalInfoSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  title: z.string().min(1, 'Professional title is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  summary: z.string().optional(),
  photoDataUri: z.string().optional(), // Added photo schema
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
  skills: z.array(z.string()).optional(), // Added skills schema
});

// Default empty state
const defaultCvData: CvData = {
  personalInfo: {
    name: '', title: '', phone: '', email: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: '' // Added photo default
  },
  experience: [],
  education: [],
  skills: [], // Added skills default
};

export default function CVForgePage() {
  const [cvData, setCvData] = useState<CvData>(defaultCvData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [enhancingState, setEnhancingState] = useState<Record<string, boolean>>({}); // Track loading state for AI buttons
  const { toast } = useToast();


  const form = useForm<CvData>({
    resolver: zodResolver(cvDataSchema),
    defaultValues: defaultCvData,
    mode: 'onChange', // Validate on change for live feedback
  });

   // Load data from local storage on initial mount
  useEffect(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Basic validation to ensure structure matches before setting
             if (parsedData && parsedData.personalInfo && Array.isArray(parsedData.experience) && Array.isArray(parsedData.education)) {
                 // Ensure IDs are present for array items, photoDataUri exists, and skills is an array
                 const validatedData: CvData = {
                     ...defaultCvData, // Start with defaults to ensure all fields exist
                     ...parsedData,
                     personalInfo: {
                         ...defaultCvData.personalInfo, // Ensure all personalInfo fields exist
                         ...parsedData.personalInfo,
                     },
                     experience: parsedData.experience.map((exp: any) => ({...exp, id: exp.id || crypto.randomUUID()})),
                     education: parsedData.education.map((edu: any) => ({...edu, id: edu.id || crypto.randomUUID()})),
                     skills: Array.isArray(parsedData.skills) ? parsedData.skills : [], // Ensure skills is an array
                 };
                setCvData(validatedData);
                form.reset(validatedData); // Reset form with loaded data
            } else {
                // Saved data structure is invalid, use default
                 localStorage.removeItem(LOCAL_STORAGE_KEY); // Clean up invalid data
                 form.reset(defaultCvData);
            }
        } else {
             form.reset(defaultCvData);
        }
    } catch (error) {
      console.error("Failed to load or parse CV data from local storage:", error);
      // Reset to default if error occurs
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setCvData(defaultCvData);
      form.reset(defaultCvData);
    }
    setIsLoaded(true);
  }, [form]); // form.reset dependency


   // Subscribe to form changes and update state / save to local storage
  useEffect(() => {
    if (!isLoaded) return; // Don't save initial default state before loading

    const subscription = form.watch((value) => {
       // Ensure value is not undefined and has the expected structure
       const currentData = value as Partial<CvData>;
       if (currentData && currentData.personalInfo && currentData.experience && currentData.education) {
            const dataToSave: CvData = {
                personalInfo: { ...defaultCvData.personalInfo, ...currentData.personalInfo },
                experience: currentData.experience.map(exp => ({ ...exp })), // Ensure array items are fully formed
                education: currentData.education.map(edu => ({ ...edu })),
                skills: Array.isArray(currentData.skills) ? currentData.skills : [], // Ensure skills is saved as an array
            };
            setCvData(dataToSave); // Update the state driving the preview
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
            } catch (error) {
                console.error("Failed to save CV data to local storage:", error);
                 toast({
                    title: "Error Saving Data",
                    description: "Could not save changes to local storage. Your browser might be out of space.",
                    variant: "destructive",
                 });
            }
       }
    });
    return () => subscription.unsubscribe();
  }, [form, isLoaded, toast]); // isLoaded ensures we only save after initial load


  // --- AI Enhancement Logic ---
   const getEnhancingKey = (
     section: 'personalInfo' | 'experience' | 'education' | 'skills', // Added 'skills'
     fieldName: string,
     index?: number
   ): string => {
     return index !== undefined ? `${section}-${index}-${fieldName}` : `${section}-${fieldName}`;
   };

  const enhanceText = useCallback(async (
     section: 'personalInfo' | 'experience' | 'education' | 'skills', // Added 'skills'
     fieldName: FieldPath<CvData>,
     currentText: string,
     index?: number // For experience/education arrays
   ) => {
      const key = getEnhancingKey(section, fieldName, index);
      if (!currentText?.trim()) {
         toast({ title: "Input Required", description: "Please enter some text to enhance.", variant: "destructive" });
         return;
       }

      setEnhancingState(prev => ({ ...prev, [key]: true }));
      try {
         const result = await enhanceResumeLanguage({ sectionText: currentText });
         if (result?.enhancedText) {
          // Use setValue from react-hook-form to update the specific field
           form.setValue(fieldName as any, result.enhancedText, { shouldValidate: true, shouldDirty: true });
           toast({ title: "Enhancement Successful", description: "Text has been updated." });
         } else {
           throw new Error("AI did not return enhanced text.");
         }
     } catch (error) {
       console.error("AI enhancement failed:", error);
       toast({
         title: "AI Enhancement Failed",
         description: "Could not enhance the text. Please try again later.",
         variant: "destructive",
       });
     } finally {
       setEnhancingState(prev => ({ ...prev, [key]: false }));
     }
   }, [form, toast]);


  const enhancePersonalInfo = useCallback(
    async (fieldName: keyof PersonalInfo, currentText: string) => {
       // Ensure fieldName is not 'photoDataUri' before calling enhanceText
        if (fieldName !== 'photoDataUri') {
            await enhanceText('personalInfo', `personalInfo.${fieldName}`, currentText || ''); // Pass empty string if currentText is null/undefined
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

    // Note: AI enhancement for individual skills might not be very useful,
    // but the framework allows it if needed later. Currently, no AI button in SkillsForm.


   const isEnhancing = useCallback(
     (section: 'personalInfo' | 'experience' | 'education' | 'skills', fieldName: string, index?: number): boolean => { // Added 'skills'
       const key = getEnhancingKey(section, fieldName, index);
       return !!enhancingState[key];
     },
     [enhancingState]
   );

   const isEnhancingPersonalInfo = useCallback(
      (fieldName: keyof PersonalInfo): boolean => {
        // Check if the key corresponds to a field that allows enhancement
        if (fieldName !== 'photoDataUri') {
           return isEnhancing('personalInfo', fieldName);
        }
        return false; // Don't show enhancing state for photo
      },
      [isEnhancing]
    );


   const isEnhancingExperience = useCallback(
     (index: number, fieldName: keyof ExperienceEntry): boolean => {
        // Check if the key corresponds to a field that allows enhancement
        if (fieldName === 'responsibilities') { // Only responsibilities can be enhanced currently
             return isEnhancing('experience', fieldName, index);
        }
        return false;
     },
     [isEnhancing]
   );

   // Memoize components to prevent unnecessary re-renders
   const inputSection = useMemo(() => (
       <div className="space-y-6">
         <h1 className="text-2xl font-bold text-primary">CVForge</h1>
         <p className="text-muted-foreground">Build and refine your professional CV.</p>
         {/* Pass form correctly typed */}
         <PersonalInfoForm
             form={form as UseFormReturn<any>} // Using 'any' temporarily to avoid deep type issues
            enhanceText={enhancePersonalInfo}
            isEnhancing={isEnhancingPersonalInfo}
         />
         <ExperienceForm form={form} enhanceText={enhanceExperienceText} isEnhancing={isEnhancingExperience} />
         <EducationForm form={form} />
         <SkillsForm form={form} /> {/* Add SkillsForm */}
       </div>
     ), [form, enhancePersonalInfo, isEnhancingPersonalInfo, enhanceExperienceText, isEnhancingExperience]); // Include AI handlers in dependencies

   const previewSection = useMemo(() => (
       <div className="sticky top-6">
           <h2 className="text-xl font-semibold mb-4 text-primary">Live Preview</h2>
           {/* Pass the cvData state which is updated by form.watch */}
           <CVPreview data={cvData} />
       </div>
   ), [cvData]);

   if (!isLoaded) {
     // Optional: Add a loading spinner or skeleton screen here
     return <div className="flex justify-center items-center min-h-screen">Loading CVForge...</div>;
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
