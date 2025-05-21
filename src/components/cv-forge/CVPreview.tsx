
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image'; // Import next/image
import { Mail, Phone, Linkedin, Github, Link as LinkIcon, UserCircle, ArrowRight, Loader2, Languages } from 'lucide-react'; 
import type { CvData, ExperienceEntry, EducationEntry, PersonalInfo } from './types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge'; 
import { Button } from '@/components/ui/button'; 
import { cn } from '@/lib/utils'; 
import { useTranslation } from '@/hooks/useTranslation'; 
import { translateText } from '@/ai/flows/translate-text-flow';
import { Skeleton } from '@/components/ui/skeleton';


interface CVPreviewProps {
  data: CvData;
  showFinalButton?: boolean; 
  onViewFinalClick?: () => Promise<void>; 
  isSaving?: boolean; 
  isEmailVerified?: boolean; // Added for button state
}

// Helper to format responsibilities
const formatResponsibilities = (text: string | undefined | null): React.ReactNode => {
  if (!text) return null;
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length <= 1 && !text.startsWith('- ') && !text.startsWith('* ')) {
      return <p className="text-sm break-inside-avoid">{text}</p>; 
  }
  return (
    <ul className="list-disc list-outside pl-5 space-y-1 break-inside-avoid"> 
      {lines.map((line, index) => (
        <li key={index} className="text-sm">
          {line.replace(/^[-*]\s*/, '')} 
        </li>
      ))}
    </ul>
  );
};


export function CVPreview({ data, showFinalButton = true, onViewFinalClick, isSaving = false, isEmailVerified = true }: CVPreviewProps) {
  const { t, locale } = useTranslation(); 
  
  const [originalData, setOriginalData] = useState<CvData>(data);
  const [displayedCvData, setDisplayedCvData] = useState<CvData>(data);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // When the base data prop changes, update both original and displayed data
    setOriginalData(JSON.parse(JSON.stringify(data))); // Deep clone
    setDisplayedCvData(JSON.parse(JSON.stringify(data)));// Deep clone
  }, [data]);

  useEffect(() => {
    let isMounted = true;

    const translateCvDataFields = async (
      cvDataToTranslate: CvData,
      targetLang: 'en' | 'es'
    ): Promise<CvData> => {
      const translatedOutput: CvData = JSON.parse(JSON.stringify(cvDataToTranslate)); // Deep clone

      const translateSingleString = async (text: string): Promise<string> => {
        if (!text || !text.trim()) return text;
        try {
          const result = await translateText({ textToTranslate: text, targetLanguage: targetLang });
          return result.translatedText;
        } catch (error) {
          console.error(`Error translating text "${text}" to ${targetLang}:`, error);
          return text; // Fallback to original text on error
        }
      };
      
      // Personal Info
      if (translatedOutput.personalInfo) {
        translatedOutput.personalInfo.title = await translateSingleString(cvDataToTranslate.personalInfo.title || '');
        translatedOutput.personalInfo.summary = await translateSingleString(cvDataToTranslate.personalInfo.summary || '');
      }

      // Experience
      if (translatedOutput.experience) {
        for (let i = 0; i < translatedOutput.experience.length; i++) {
          translatedOutput.experience[i].jobTitle = await translateSingleString(cvDataToTranslate.experience[i].jobTitle || '');
          translatedOutput.experience[i].responsibilities = await translateSingleString(cvDataToTranslate.experience[i].responsibilities || '');
        }
      }

      // Education
      if (translatedOutput.education) {
        for (let i = 0; i < translatedOutput.education.length; i++) {
          translatedOutput.education[i].degree = await translateSingleString(cvDataToTranslate.education[i].degree || '');
          translatedOutput.education[i].details = await translateSingleString(cvDataToTranslate.education[i].details || '');
        }
      }
      
      // Skills
      if (translatedOutput.skills) {
        translatedOutput.skills = await Promise.all(
          cvDataToTranslate.skills.map(skill => translateSingleString(skill || ''))
        );
      }
      
      return translatedOutput;
    };

    const processTranslation = async () => {
      if (!originalData || !isMounted) return;

      // Assuming 'en' is the original/base language. If locale is 'en', show original data.
      // This is a simplification. A more robust system would store the original entry language.
      if (locale === 'en') { 
        setDisplayedCvData(JSON.parse(JSON.stringify(originalData)));
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);
      try {
        const translated = await translateCvDataFields(originalData, locale);
        if (isMounted) {
          setDisplayedCvData(translated);
        }
      } catch (error) {
        console.error("Error during CV data translation process:", error);
        if (isMounted) {
          // Fallback to original data in case of a major error in the process
          setDisplayedCvData(JSON.parse(JSON.stringify(originalData)));
        }
      } finally {
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    };

    processTranslation();

    return () => {
      isMounted = false;
    };
  }, [locale, originalData]);

  const { personalInfo, experience, education, skills } = displayedCvData || originalData;
  const safePersonalInfo = personalInfo || { name: '', title: '', email: '', phone: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: '' };
  const safeSkills = skills || [];

  const renderTextWithLoading = (text: string | undefined, originalText: string | undefined) => {
    if (isTranslating && text === originalText) { // Show skeleton if translating and text hasn't updated yet
      return <Skeleton className="h-4 w-3/4 my-1" />;
    }
    return text || '';
  };

  const renderFormattedResponsibilitiesWithLoading = (text: string | undefined, originalText: string | undefined) => {
      if (isTranslating && text === originalText) {
        return (
          <>
            <Skeleton className="h-4 w-full my-1" />
            <Skeleton className="h-4 w-5/6 my-1" />
            <Skeleton className="h-4 w-full my-1" />
          </>
        );
      }
      return formatResponsibilities(text);
  }


  return (
    <div id="cv-preview-card" className="bg-card text-card-foreground p-6 md:p-8 rounded-lg shadow-md h-full print:shadow-none print:p-0 print:border-none print:bg-transparent flex flex-col">
       <div className="flex-grow"> 
          {/* Header / Personal Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 print:flex-row print:items-start break-inside-avoid"> 
              <div className="flex-shrink-0">
                {safePersonalInfo.photoDataUri ? (
                  <Image
                    src={safePersonalInfo.photoDataUri}
                    alt={`${safePersonalInfo.name || t('cvPreview.yourName')}'s profile photo`}
                    width={100} 
                    height={100}
                    className="rounded-full object-cover border-2 border-border print:border-black" 
                    data-ai-hint="profile avatar"
                  />
                ) : (
                  <UserCircle className="w-24 h-24 text-muted-foreground print:text-black" /> 
                )}
              </div>

              <div className="text-center sm:text-left flex-grow print:text-left">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">{safePersonalInfo.name || t('cvPreview.yourName')}</h1>
                <div className="text-lg text-primary mb-3 print:text-black">
                   {renderTextWithLoading(safePersonalInfo.title, originalData?.personalInfo?.title)}
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground print:justify-start print:text-black">
                  {safePersonalInfo.email && (
                    <a href={`mailto:${safePersonalInfo.email}`} className="flex items-center gap-1 hover:text-primary print:text-black print:hover:text-black">
                      <Mail className="w-3 h-3" />
                      <span>{safePersonalInfo.email}</span>
                    </a>
                  )}
                  {safePersonalInfo.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{safePersonalInfo.phone}</span>
                    </span>
                  )}
                  {safePersonalInfo.linkedin && (
                    <a href={safePersonalInfo.linkedin.startsWith('http') ? safePersonalInfo.linkedin : `https://${safePersonalInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary print:text-black print:hover:text-black">
                      <Linkedin className="w-3 h-3" />
                      <span>{t('cvPreview.linkedIn')}</span>
                    </a>
                  )}
                  {safePersonalInfo.github && (
                    <a href={safePersonalInfo.github.startsWith('http') ? safePersonalInfo.github : `https://${safePersonalInfo.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary print:text-black print:hover:text-black">
                      <Github className="w-3 h-3" />
                      <span>{t('cvPreview.github')}</span>
                    </a>
                  )}
                  {safePersonalInfo.website && (
                    <a href={safePersonalInfo.website.startsWith('http') ? safePersonalInfo.website : `https://${safePersonalInfo.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary print:text-black print:hover:text-black">
                      <LinkIcon className="w-3 h-3" />
                      <span>{t('cvPreview.website')}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>


          {/* Summary */}
          {safePersonalInfo.summary || (isTranslating && originalData?.personalInfo?.summary) ? (
            <section className="mb-6 break-inside-avoid"> 
                <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black">{t('cvPreview.summaryTitle')}</h2>
                <div className="text-sm">
                  {renderTextWithLoading(safePersonalInfo.summary, originalData?.personalInfo?.summary)}
                </div>
            </section>
          ): null}

          {/* Skills */}
          {(safeSkills.length > 0 || (isTranslating && originalData?.skills?.length > 0)) && (
            <section className="mb-6 break-inside-avoid"> 
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black">{t('cvPreview.skillsTitle')}</h2>
              <div className="flex flex-wrap gap-2">
                {isTranslating && (!displayedCvData?.skills || displayedCvData.skills.length === 0) && originalData?.skills?.map((_, index) => (
                    <Skeleton key={`skill-skeleton-${index}`} className="h-6 w-20" />
                ))}
                {!isTranslating && safeSkills.map((skill, index) => (
                  <Badge key={`${skill}-${index}`} variant="secondary" className="print:badge-print"> 
                    {skill}
                  </Badge>
                ))}
                 {isTranslating && displayedCvData?.skills?.map((skill, index) => (
                  <Badge key={`translated-skill-${skill}-${index}`} variant="secondary" className="print:badge-print">
                    {renderTextWithLoading(skill, originalData?.skills?.[index])}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black">{t('cvPreview.educationTitle')}</h2>
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={edu.id} className="break-inside-avoid"> 
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-md font-semibold">
                           {renderTextWithLoading(edu.degree, originalData?.education?.[index]?.degree)}
                        </h3>
                        <span className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">
                          {edu.graduationDate || t('cvPreview.graduationDate')}
                        </span>
                      </div>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">{edu.institution || t('cvPreview.institutionName')}</p>
                        <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">{edu.location || t('cvPreview.location')}</p>
                    </div>
                    { (edu.details || (isTranslating && originalData?.education?.[index]?.details) ) && 
                        <div className="text-sm italic text-muted-foreground print:text-black">
                           {renderTextWithLoading(edu.details, originalData?.education?.[index]?.details)}
                        </div>
                    }
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black">{t('cvPreview.experienceTitle')}</h2>
              <div className="space-y-4">
                {experience.map((exp, index) => (
                  <div key={exp.id} className="break-inside-avoid"> 
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-md font-semibold">
                         {renderTextWithLoading(exp.jobTitle, originalData?.experience?.[index]?.jobTitle)}
                      </h3>
                      <span className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">
                        {exp.startDate || t('cvPreview.startDate')} - {exp.endDate || t('cvPreview.endDate')}
                      </span>
                    </div>

                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">{exp.company || t('cvPreview.companyName')}</p>
                      <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">{exp.location || t('cvPreview.location')}</p>
                    </div>
                    {renderFormattedResponsibilitiesWithLoading(exp.responsibilities, originalData?.experience?.[index]?.responsibilities)}
                  </div>
                ))}
              </div>
            </section>
          )}


          {/* Placeholder if empty and not translating */}
          {!isTranslating && !safePersonalInfo.name && safeSkills.length === 0 && (!experience || experience.length === 0) && (!education || education.length === 0) && (
              <p className="text-center text-muted-foreground mt-10 print:hidden">{t('cvPreview.placeholder')}</p>
          )}
           {/* Global translating indicator */}
           {isTranslating && (
             <div className="flex items-center justify-center text-muted-foreground py-4">
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               {t('cvPreview.translatingContent', { lang: locale === 'es' ? 'Español' : 'English' })}
             </div>
           )}
       </div> 

       {showFinalButton && (
         <div className="mt-8 text-center print:hidden">
            <Button
                onClick={onViewFinalClick}
                variant="default"
                size="lg"
                disabled={isSaving || !isEmailVerified} // Disable button if saving OR if email is not verified
                title={!isEmailVerified ? t('cvForge.verifyEmailToProceed') : undefined}
            >
                {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {isSaving ? t('cvForge.saving') : t('cvForge.saveAndNavigate')}
             </Button>
         </div>
       )}
    </div>
  );
}

