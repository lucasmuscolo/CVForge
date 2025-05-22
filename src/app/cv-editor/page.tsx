
// src/app/cv-editor/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, type UseFormReturn, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

import { CVForgeLayout } from '@/components/cv-forge/CVForgeLayout';
import { PersonalInfoForm } from '@/components/cv-forge/PersonalInfoForm';
import { ExperienceForm } from '@/components/cv-forge/ExperienceForm';
import { EducationForm } from '@/components/cv-forge/EducationForm';
import { SkillsForm } from '@/components/cv-forge/SkillsForm';
import { ProjectForm } from '@/components/cv-forge/ProjectForm';
import { CVPreview } from '@/components/cv-forge/CVPreview';
import type { CvData, PersonalInfo, ExperienceEntry, EducationEntry, ProjectEntry } from '@/components/cv-forge/types';
import { enhanceResumeLanguage } from '@/ai/flows/enhance-resume-language';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/config';
import { getCvData, saveCvData, getUserProfile, type UserProfile } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { LogOut, Copy, AlertTriangle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// Removed LanguageSwitcher and useTranslation

// Zod Schemas
const personalInfoSchema = z.object({
  name: z.string().min(1, 'El nombre completo es obligatorio'),
  title: z.string().min(1, 'El título profesional es obligatorio'),
  phone: z.string().optional(),
  email: z.string().email('Dirección de correo electrónico inválida').min(1, 'El correo electrónico es obligatorio'),
  linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
  github: z.string().url('URL inválida').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  summary: z.string().optional(),
  photoDataUri: z.string().optional(),
});

const experienceEntrySchema = z.object({
  id: z.string(),
  jobTitle: z.string().min(1, 'El puesto de trabajo es obligatorio'),
  company: z.string().min(1, 'El nombre de la empresa es obligatorio'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().min(1, 'La fecha de fin es obligatoria (usa "Actual" si es el actual)'),
  responsibilities: z.string().optional(),
});

const educationEntrySchema = z.object({
  id: z.string(),
  degree: z.string().min(1, 'El título/certificado es obligatorio'),
  institution: z.string().min(1, 'El nombre de la institución es obligatorio'),
  location: z.string().optional(),
  graduationDate: z.string().min(1, 'La fecha de graduación es obligatoria'),
  details: z.string().optional(),
});

const projectEntrySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre del proyecto es obligatorio'),
  description: z.string().min(1, 'La descripción del proyecto es obligatoria'),
});

const cvDataSchema = z.object({
  personalInfo: personalInfoSchema,
  experience: z.array(experienceEntrySchema),
  education: z.array(educationEntrySchema),
  skills: z.array(z.string()).optional(),
  projects: z.array(projectEntrySchema).optional(),
});

// Default empty state
const defaultCvData: CvData = {
  personalInfo: {
    name: '', title: '', phone: '', email: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: ''
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

export default function CVEditorPage() {
  const { currentUser, loading: authLoading } = useAuth();
  // const { t, locale } = useTranslation(); // Removed locale
  const router = useRouter();
  const [cvData, setCvData] = useState<CvData>(defaultCvData);
  const [initialCvData, setInitialCvData] = useState<CvData>(defaultCvData);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [enhancingState, setEnhancingState] = useState<Record<string, boolean>>({});
  const { toast } = useToast();


  const form = useForm<CvData>({
    resolver: zodResolver(cvDataSchema),
    defaultValues: defaultCvData,
    mode: 'onChange',
  });
  const { reset: formReset } = form;

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      setIsEmailVerified(currentUser.emailVerified);
       getUserProfile(currentUser.uid).then(profile => {
        if (profile && profile.userType === 'recruiter') {
          router.push('/search');
        }
      });
    }
  }, [currentUser, authLoading, router]);


  useEffect(() => {
    setIsLoaded(false); 
  }, [currentUser]);

  useEffect(() => {
    if (authLoading) {
      console.log('[CVEditorPage] Auth loading, returning.');
      return;
    }

    if (currentUser) {
      console.log('[CVEditorPage] Current user found:', currentUser.uid, 'isLoaded:', isLoaded);
      setIsEmailVerified(currentUser.emailVerified); 
      if (!isLoaded) {
        console.log('[CVEditorPage] Data not loaded for current user, initiating load.');
        const loadUserData = async () => {
          try {
            console.log('[CVEditorPage] Fetching CV data for UID:', currentUser.uid);
            const loadedCvData = await getCvData(currentUser.uid);
            const cvDataToSet = loadedCvData ? {
                ...defaultCvData,
                ...loadedCvData,
                personalInfo: { ...defaultCvData.personalInfo, ...(loadedCvData.personalInfo || {}) },
                experience: (loadedCvData.experience || []).map(exp => ({ ...exp, id: exp.id || crypto.randomUUID() })),
                education: (loadedCvData.education || []).map(edu => ({ ...edu, id: edu.id || crypto.randomUUID() })),
                skills: Array.isArray(loadedCvData.skills) ? loadedCvData.skills : [],
                projects: (loadedCvData.projects || []).map(proj => ({ ...proj, id: proj.id || crypto.randomUUID() })),
            } : defaultCvData;
            console.log('[CVEditorPage] CV data to set:', cvDataToSet);
            setCvData(cvDataToSet);
            setInitialCvData(JSON.parse(JSON.stringify(cvDataToSet))); 
            formReset(cvDataToSet);

            console.log('[CVEditorPage] Fetching user profile for UID:', currentUser.uid);
            const loadedUserProfile = await getUserProfile(currentUser.uid);
            console.log('[CVEditorPage] User profile loaded:', loadedUserProfile);
            setUserProfile(loadedUserProfile);
            if (loadedUserProfile && loadedUserProfile.userType === 'recruiter') {
              router.push('/search');
              return;
            }


          } catch (error) {
            console.error("[CVEditorPage] Failed to load user data from Firestore:", error);
            toast({ title: "Error al Cargar Datos", description: "No se pudieron cargar los datos de tu CV desde el servidor.", variant: "destructive" });
            setCvData(defaultCvData);
            setInitialCvData(JSON.parse(JSON.stringify(defaultCvData))); 
            formReset(defaultCvData);
            setUserProfile(null);
          } finally {
            console.log('[CVEditorPage] Data loading process finished.');
            setIsLoaded(true);
          }
        };
        loadUserData();
      } else {
        console.log('[CVEditorPage] Data already loaded for current user.');
      }
    } else {
      console.log('[CVEditorPage] No current user. isLoaded:', isLoaded);
      if (!isLoaded) {
        console.log('[CVEditorPage] Setting default data as no user is logged in.');
        setCvData(defaultCvData);
        setInitialCvData(JSON.parse(JSON.stringify(defaultCvData))); 
        formReset(defaultCvData);
        setUserProfile(null);
        setIsEmailVerified(false);
        setIsLoaded(true);
      }
    }
  }, [currentUser, authLoading, isLoaded, formReset, toast, router]);


   useEffect(() => {
     if (!isLoaded) return; 

     const subscription = form.watch((value) => {
       const currentData = value as Partial<CvData>;
       if (currentData && typeof currentData.personalInfo === 'object' && Array.isArray(currentData.experience) && Array.isArray(currentData.education) && Array.isArray(currentData.projects)) {
         const dataForPreview: CvData = {
           personalInfo: { ...defaultCvData.personalInfo, ...currentData.personalInfo },
           experience: currentData.experience.map(exp => ({ ...exp })),
           education: currentData.education.map(edu => ({ ...edu })),
           skills: Array.isArray(currentData.skills) ? currentData.skills : [],
           projects: currentData.projects.map(proj => ({ ...proj })),
         };
         setCvData(dataForPreview); 
       }
     });
     return () => subscription.unsubscribe();
   }, [form, isLoaded]);


  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Fallo al Cerrar Sesión",
        description: "Ocurrió un error al cerrar sesión.",
        variant: 'destructive',
      });
    }
  }, [toast, router]);

  const handleSaveAndNavigate = async () => {
    if (!currentUser) {
        toast({ title: "No Has Iniciado Sesión", description: "Por favor, inicia sesión para guardar tu CV.", variant: "destructive" });
        return;
    }

    if (userProfile?.userType === 'creator' && !isEmailVerified) {
        toast({ title: "Verificación de Correo Requerida", description: "Por favor, verifica tu correo electrónico para guardar o ver tu CV final.", variant: "destructive" });
        return;
    }

    setIsSaving(true); 
    try {
        const isValid = await form.trigger();
        if (!isValid) {
             toast({ title: "Error de Validación", description: "Por favor, revisa el formulario en busca de errores.", variant: "destructive" });
             setIsSaving(false);
             return;
        }

      const currentFormData = form.getValues(); 
       const dataToSave: CvData = {
         personalInfo: { ...defaultCvData.personalInfo, ...currentFormData.personalInfo },
         experience: currentFormData.experience.map(exp => ({ ...exp })),
         education: currentFormData.education.map(edu => ({ ...edu })),
         skills: Array.isArray(currentFormData.skills) ? currentFormData.skills : [],
         projects: Array.isArray(currentFormData.projects) ? currentFormData.projects.map(proj => ({ ...proj })) : [],
       };

      const hasChanges = JSON.stringify(dataToSave) !== JSON.stringify(initialCvData);

      if (hasChanges) {
        await saveCvData(currentUser.uid, dataToSave);
        setInitialCvData(JSON.parse(JSON.stringify(dataToSave))); 
        toast({ title: "CV Guardado Exitosamente", description: "Tus cambios han sido guardados. Navegando a la vista previa final..." });
      } else {
        toast({ title: "No Se Detectaron Cambios", description: "Navegando a la vista previa final sin guardar." });
      }
      
      router.push('/cv/final'); 

    } catch (error) {
      console.error("Failed to save CV data to Firestore or navigate:", error);
      toast({
        title: "Error al Procesar Solicitud",
        description: "Ocurrió un error al guardar o navegar. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
        setIsSaving(false); 
    }
  };


   const getEnhancingKey = (
     section: 'personalInfo' | 'experience' | 'education' | 'skills' | 'projects',
     fieldName: string,
     index?: number
   ): string => {
     return index !== undefined ? `${section}-${index}-${fieldName}` : `${section}-${fieldName}`;
   };

  const enhanceText = useCallback(async (
     section: 'personalInfo' | 'experience' | 'education' | 'skills' | 'projects',
     fieldName: FieldPath<CvData>,
     currentText: string,
     index?: number 
   ) => {
      const key = getEnhancingKey(section, fieldName, index);
      if (!currentText?.trim()) {
         toast({ title: "Texto Requerido", description: "Por favor, ingresa texto para mejorar.", variant: "destructive" });
         return;
       }

      setEnhancingState(prev => ({ ...prev, [key]: true }));
      try {
         // Forcing 'es' as language for enhancement on this page
         const result = await enhanceResumeLanguage({ sectionText: currentText, language: 'es' });
         if (result?.enhancedText) {
           form.setValue(fieldName as any, result.enhancedText, { shouldValidate: true, shouldDirty: true });
           toast({ title: "Mejora Exitosa", description: "El texto ha sido actualizado." });
         } else {
           throw new Error("AI did not return enhanced text.");
         }
     } catch (error: any) {
       console.error("AI enhancement failed:", error);
       let desc = "No se pudo mejorar el texto. Por favor, inténtalo de nuevo más tarde.";
       if (error.message && error.message.includes('429')) {
           desc = "El servicio de IA está ocupado. Por favor, inténtalo de nuevo en un momento.";
       }
       toast({
         title: "Fallo la Mejora con IA",
         description: desc,
         variant: "destructive",
       });
     } finally {
       setEnhancingState(prev => ({ ...prev, [key]: false }));
     }
   }, [form, toast]); // locale removed from dependencies


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
   
   const enhanceProjectText = useCallback(
    async (index: number, fieldName: keyof ProjectEntry, currentText: string) => {
      console.log('AI enhancement for projects not yet implemented.', index, fieldName, currentText);
      toast({ title: "IA No Activa", description: "La mejora con IA para descripciones de proyecto aún no está activa.", variant: 'default' });
    },
    [toast] 
  );


   const isEnhancing = useCallback(
     (section: 'personalInfo' | 'experience' | 'education' | 'skills' | 'projects', fieldName: string, index?: number): boolean => {
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

    const isEnhancingProject = useCallback(
        (index: number, fieldName: keyof ProjectEntry): boolean => {
             if (fieldName === 'description') { 
                return isEnhancing('projects', fieldName, index);
             }
            return false;
        },
        [isEnhancing]
    );

    const handleCopyCode = useCallback(async () => {
        if (userProfile && userProfile.userType === 'creator' && userProfile.cvCode) {
        try {
            await navigator.clipboard.writeText(userProfile.cvCode);
            toast({ title: "¡Código Copiado!", description: "Tu código de CV ha sido copiado al portapapeles." });
        } catch (err) {
            console.error('Failed to copy CV code: ', err);
            toast({ title: "Fallo al Copiar", description: "No se pudo copiar el código. Por favor, inténtalo de nuevo o cópialo manualmente.", variant: 'destructive' });
        }
        }
    }, [userProfile, toast]);


   const inputSection = useMemo(() => (
       <div className="space-y-6">
         <div className="flex justify-between items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">Editor de CVForge</h1>
            <div className="flex items-center gap-2">
              {/* <LanguageSwitcher /> Removed */}
              {currentUser && (
                   <Button onClick={handleLogout} variant="outline" size="sm">
                       <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                   </Button>
              )}
             </div>
         </div>

         <div className="flex justify-between items-center gap-2">
             <p className="text-muted-foreground flex-grow">Crea y refina tu CV profesional.</p>
             {userProfile && userProfile.userType === 'creator' && userProfile.cvCode && (
                 <div className="flex items-center gap-1 p-1 border border-input rounded-md bg-card shadow-sm shrink-0">
                     <code className="font-mono text-xs px-2 py-1 bg-muted rounded-sm">{userProfile.cvCode}</code>
                     <Button variant="ghost" size="icon" onClick={handleCopyCode} aria-label="Copiar Código" className="h-6 w-6">
                         <Copy className="h-3 w-3" />
                     </Button>
                 </div>
             )}
         </div>

        {currentUser && userProfile?.userType === 'creator' && !isEmailVerified && (
            <Alert variant="default" className="border-yellow-500 bg-yellow-50 text-yellow-700">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <AlertTitle className="font-semibold text-yellow-800">Verificación de Correo Requerida</AlertTitle>
                <AlertDescription>
                    Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación enviado a tu dirección de correo para usar CVForge completamente.
                </AlertDescription>
            </Alert>
        )}

         <PersonalInfoForm
             form={form as UseFormReturn<any>}
            enhanceText={enhancePersonalInfo}
            isEnhancing={isEnhancingPersonalInfo}
         />
         <SkillsForm form={form} />
         <ProjectForm form={form} enhanceText={enhanceProjectText} isEnhancing={isEnhancingProject} />
         <ExperienceForm form={form} enhanceText={enhanceExperienceText} isEnhancing={isEnhancingExperience} />
         <EducationForm form={form} />
       </div>
     // eslint-disable-next-line react-hooks/exhaustive-deps
     ), [form, enhancePersonalInfo, isEnhancingPersonalInfo, enhanceExperienceText, isEnhancingExperience, enhanceProjectText, isEnhancingProject, currentUser, handleLogout, userProfile, handleCopyCode, isEmailVerified]); 

   const previewSection = useMemo(() => (
       <div className="md:sticky md:top-6 print:static print:top-auto">
           <h2 className="text-xl font-semibold mb-4 text-primary print:hidden">Vista Previa en Vivo</h2>
           <CVPreview
             data={cvData}
             onViewFinalClick={handleSaveAndNavigate} 
             isSaving={isSaving} 
             showFinalButton={true} 
             isEmailVerified={userProfile?.userType === 'creator' ? isEmailVerified : true}
             // enableContentTranslation is false by default, so CVPreview uses global locale for its own labels
           />
       </div>
   // eslint-disable-next-line react-hooks/exhaustive-deps
   ), [cvData, isSaving, handleSaveAndNavigate, isEmailVerified, userProfile?.userType]); 


   if (authLoading || (!isLoaded && currentUser)) {
     return (
        <div className="flex flex-col md:flex-row min-h-screen bg-secondary">
             <div className="w-full md:w-1/2 lg:w-2/5 p-4 md:p-6 lg:p-8 bg-background shadow-lg space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-16 w-full" /> 
                <Skeleton className="h-64 w-full" /> {/* PersonalInfo */}
                <Skeleton className="h-40 w-full" /> {/* Skills */}
                <Skeleton className="h-56 w-full" /> {/* Projects (New Skeleton) */}
                <Skeleton className="h-80 w-full" /> {/* Experience */}
                <Skeleton className="h-56 w-full" /> {/* Education */}
             </div>
             <div className="w-full md:w-1/2 lg:w-3/5 p-4 md:p-6 lg:p-8">
                 <Skeleton className="h-6 w-32 mb-4" />
                 <Skeleton className="h-[80vh] w-full" />
             </div>
        </div>
    );
   }

   if (!currentUser && !authLoading) {
       return <div className="flex justify-center items-center min-h-screen">Redirigiendo al inicio de sesión...</div>;
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
