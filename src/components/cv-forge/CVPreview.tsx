
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Mail, Phone, Linkedin, Github, Link as LinkIcon, UserCircle, ArrowRight, Loader2, Briefcase, BookOpen, PencilLine, Lightbulb, Star } from 'lucide-react';
import type { CvData, PersonalInfo, ExperienceEntry, EducationEntry, ProjectEntry } from './types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { translateText } from '@/ai/flows/translate-text-flow';
import { Skeleton } from '@/components/ui/skeleton';
import {cloneDeep} from 'lodash-es';


// Helper to format multiline text (like responsibilities or project descriptions)
const formatMultilineText = (text: string | undefined | null): React.ReactNode => {
  if (!text) return null;
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length <= 1 && !text.startsWith('- ') && !text.startsWith('* ')) {
      // For single lines or non-list paragraphs, render directly
      return <div className="text-sm break-inside-avoid">{text}</div>;
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


interface CVPreviewProps {
  data: CvData;
  showFinalButton?: boolean;
  onViewFinalClick?: () => Promise<void>;
  isSaving?: boolean;
  isEmailVerified?: boolean;
  enableContentTranslation?: boolean; 
}

export function CVPreview({
  data,
  showFinalButton = true,
  onViewFinalClick,
  isSaving = false,
  isEmailVerified = true,
  enableContentTranslation = false, 
}: CVPreviewProps) {
  const { t, locale } = useTranslation();

  const [originalData, setOriginalData] = useState<CvData>(cloneDeep(data));
  const [displayedCvData, setDisplayedCvData] = useState<CvData>(cloneDeep(data));
  const [isTranslating, setIsTranslating] = useState(false);
  const [fieldTranslatingStates, setFieldTranslatingStates] = useState<Record<string, boolean>>({});


  useEffect(() => {
    setOriginalData(cloneDeep(data));
    // If content translation is not enabled, or if it is enabled but we are on the base locale ('es'),
    // ensure displayed data is reset to the current original data.
    if (!enableContentTranslation || (enableContentTranslation && locale === 'es')) {
      setDisplayedCvData(cloneDeep(data));
    }
  }, [data, locale, enableContentTranslation]);


  const translateCvDataFields = useCallback(async (sourceData: CvData, targetLocale: 'en' | 'es') => {
    if (targetLocale === 'es') { // Assuming 'es' is the base language, no translation needed
        setDisplayedCvData(cloneDeep(sourceData));
        setIsTranslating(false);
        setFieldTranslatingStates({});
        return;
    }

    setIsTranslating(true);
    setFieldTranslatingStates({}); // Reset individual field states

    const translatedData = cloneDeep(sourceData);
    let allTranslationsComplete = true;

    const translateField = async (text: string | undefined, fieldKey: string): Promise<string | undefined> => {
      if (!text || !text.trim()) return text;
      setFieldTranslatingStates(prev => ({ ...prev, [fieldKey]: true }));
      try {
        const result = await translateText({ textToTranslate: text, targetLanguage: targetLocale });
        return result.translatedText;
      } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        if (errorMessage.includes('429')) {
            console.warn(`[CVPreview] Rate limit hit for ${fieldKey}. Using original text. Error:`, error);
        } else {
            console.warn(`[CVPreview] Translation failed for ${fieldKey}, using original text. Error:`, error);
        }
        allTranslationsComplete = false; // Mark that at least one translation failed or was skipped
        return text; // Fallback to original text
      } finally {
        setFieldTranslatingStates(prev => ({ ...prev, [fieldKey]: false }));
      }
    };
    
    // PersonalInfo
    translatedData.personalInfo.title = await translateField(sourceData.personalInfo.title, 'personalInfo.title') || sourceData.personalInfo.title;
    translatedData.personalInfo.summary = await translateField(sourceData.personalInfo.summary, 'personalInfo.summary') || sourceData.personalInfo.summary;

    // Experience
    for (let i = 0; i < sourceData.experience.length; i++) {
      translatedData.experience[i].jobTitle = await translateField(sourceData.experience[i].jobTitle, `experience.${i}.jobTitle`) || sourceData.experience[i].jobTitle;
      translatedData.experience[i].responsibilities = await translateField(sourceData.experience[i].responsibilities, `experience.${i}.responsibilities`) || sourceData.experience[i].responsibilities;
    }

    // Education
    for (let i = 0; i < sourceData.education.length; i++) {
      translatedData.education[i].degree = await translateField(sourceData.education[i].degree, `education.${i}.degree`) || sourceData.education[i].degree;
      translatedData.education[i].details = await translateField(sourceData.education[i].details, `education.${i}.details`) || sourceData.education[i].details;
    }
    
    // Skills
    const translatedSkills = [];
    for (let i = 0; i < sourceData.skills.length; i++) {
        const skill = sourceData.skills[i];
        const translatedSkillText = await translateField(skill, `skills.${i}`);
        translatedSkills.push(translatedSkillText || skill);
    }
    translatedData.skills = translatedSkills;

    // Projects
    for (let i = 0; i < sourceData.projects.length; i++) {
        translatedData.projects[i].name = await translateField(sourceData.projects[i].name, `projects.${i}.name`) || sourceData.projects[i].name;
        translatedData.projects[i].description = await translateField(sourceData.projects[i].description, `projects.${i}.description`) || sourceData.projects[i].description;
    }

    setDisplayedCvData(translatedData);
    setIsTranslating(!allTranslationsComplete); // Keep isTranslating true if any field failed, to potentially retry or show partial state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* Removed locale from here to avoid re-triggering by its own change if translateCvDataFields is called from locale change effect */]);


  useEffect(() => {
    if (!enableContentTranslation) {
      setDisplayedCvData(cloneDeep(originalData)); // Show original data if translation is disabled
      setIsTranslating(false);
      setFieldTranslatingStates({});
      return;
    }

    if (locale === 'es') { // Assuming 'es' is the base language of data entry
      setDisplayedCvData(cloneDeep(originalData));
      setIsTranslating(false);
      setFieldTranslatingStates({});
    } else if (locale === 'en') {
      translateCvDataFields(originalData, 'en');
    }
  }, [locale, originalData, enableContentTranslation, translateCvDataFields]);


  const { personalInfo, experience, education, skills, projects } = displayedCvData || {};
  const safePersonalInfo = personalInfo || { name: '', title: '', email: '', phone: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: '' };
  const safeSkills = skills || [];
  const safeProjects = projects || [];
  const safeExperience = experience || [];
  const safeEducation = education || [];

 const renderTextWithLoading = (text: string | undefined, fieldKey: string, defaultKey?: string) => {
    if (enableContentTranslation && (isTranslating || fieldTranslatingStates[fieldKey])) {
      return <Skeleton className="h-4 w-3/4 my-1" />;
    }
    return text || (defaultKey ? t(defaultKey) : '');
  };
  
  const renderFormattedTextWithLoading = (text: string | undefined, fieldKey: string) => {
     if (enableContentTranslation && (isTranslating || fieldTranslatingStates[fieldKey])) {
      return <Skeleton className="h-16 w-full my-1" />;
    }
    return formatMultilineText(text);
  };


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
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {safePersonalInfo.name || t('cvPreview.yourName')}
                </h1>
                 <div className="text-lg text-primary mb-3 print:text-black">
                   {renderTextWithLoading(safePersonalInfo.title, 'personalInfo.title', 'cvPreview.yourTitle')}
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
          {(safePersonalInfo.summary || (enableContentTranslation && (isTranslating || fieldTranslatingStates['personalInfo.summary']))) && (
            <section className="mb-6 break-inside-avoid">
                <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                    <PencilLine className="mr-2 h-5 w-5" /> {t('cvPreview.summaryTitle')}
                </h2>
                <div className="text-sm">
                  {renderFormattedTextWithLoading(safePersonalInfo.summary, 'personalInfo.summary')}
                </div>
            </section>
          )}

          {/* Skills */}
          {(safeSkills.length > 0 || (enableContentTranslation && isTranslating && safeSkills.length === 0 )) && (
            <section className="mb-6 break-inside-avoid">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <Star className="mr-2 h-5 w-5" /> {t('cvPreview.skillsTitle')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {enableContentTranslation && isTranslating && safeSkills.length === 0 && !Object.values(fieldTranslatingStates).some(s => s) ? ( // Show skeletons only if globally translating AND skills specifically haven't been attempted or finished
                    <> <Skeleton className="h-6 w-20" /> <Skeleton className="h-6 w-24" /> <Skeleton className="h-6 w-16" /> </>
                ) : (
                    safeSkills.map((skill, index) => (
                       <React.Fragment key={`${skill}-${index}`}>
                         { (enableContentTranslation && (isTranslating || fieldTranslatingStates[`skills.${index}`])) ? (
                           <Skeleton className="h-6 w-20" />
                         ) : (
                           <Badge variant="secondary" className="print:badge-print">
                             {skill}
                           </Badge>
                         )}
                       </React.Fragment>
                    ))
                )}
              </div>
            </section>
          )}

          {/* Projects */}
          {(safeProjects.length > 0 || (enableContentTranslation && isTranslating)) && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <Lightbulb className="mr-2 h-5 w-5" /> {t('cvPreview.projectsTitle')}
              </h2>
              <div className="space-y-4">
                {safeProjects.map((proj, index) => (
                  <div key={proj.id} className="break-inside-avoid">
                    <h3 className="text-md font-semibold">
                      {renderTextWithLoading(proj.name, `projects.${index}.name`, 'cvPreview.projectName')}
                    </h3>
                    {renderFormattedTextWithLoading(proj.description, `projects.${index}.description`)}
                  </div>
                ))}
                 {enableContentTranslation && isTranslating && safeProjects.length === 0 && !Object.values(fieldTranslatingStates).some(s => s) && (
                  <div>
                    <Skeleton className="h-5 w-1/2 mb-1" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Education */}
          {(safeEducation.length > 0 || (enableContentTranslation && isTranslating )) && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <BookOpen className="mr-2 h-5 w-5" /> {t('cvPreview.educationTitle')}
              </h2>
              <div className="space-y-4">
                {safeEducation.map((edu, index) => (
                  <div key={edu.id} className="break-inside-avoid">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-md font-semibold">
                           {renderTextWithLoading(edu.degree, `education.${index}.degree`, 'cvPreview.degree')}
                        </h3>
                        <span className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">
                          {renderTextWithLoading(edu.graduationDate, `education.${index}.graduationDate`, 'cvPreview.graduationDate')}
                        </span>
                      </div>
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium">
                        {renderTextWithLoading(edu.institution, `education.${index}.institution`, 'cvPreview.institutionName')}
                      </div>
                        <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">{edu.location || t('cvPreview.location')}</p>
                    </div>
                    { (edu.details || (enableContentTranslation && (isTranslating || fieldTranslatingStates[`education.${index}.details`]))) &&
                        <div className="text-sm italic text-muted-foreground print:text-black">
                           {renderFormattedTextWithLoading(edu.details, `education.${index}.details`)}
                        </div>
                    }
                  </div>
                ))}
                {enableContentTranslation && isTranslating && safeEducation.length === 0 && !Object.values(fieldTranslatingStates).some(s => s) &&(
                  <div>
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2 mb-1" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Experience */}
          {(safeExperience.length > 0 || (enableContentTranslation && isTranslating )) && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <Briefcase className="mr-2 h-5 w-5" /> {t('cvPreview.experienceTitle')}
              </h2>
              <div className="space-y-4">
                {safeExperience.map((exp, index) => (
                  <div key={exp.id} className="break-inside-avoid">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-md font-semibold">
                         {renderTextWithLoading(exp.jobTitle, `experience.${index}.jobTitle`, 'cvPreview.jobTitle')}
                      </h3>
                      <span className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">
                        {renderTextWithLoading(exp.startDate, `experience.${index}.startDate`, 'cvPreview.startDate')} - {renderTextWithLoading(exp.endDate, `experience.${index}.endDate`, 'cvPreview.endDate')}
                      </span>
                    </div>

                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium">
                        {renderTextWithLoading(exp.company, `experience.${index}.company`, 'cvPreview.companyName')}
                      </div>
                      <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">{exp.location || t('cvPreview.location')}</p>
                    </div>
                     {renderFormattedTextWithLoading(exp.responsibilities, `experience.${index}.responsibilities`)}
                  </div>
                ))}
                {enableContentTranslation && isTranslating && safeExperience.length === 0 && !Object.values(fieldTranslatingStates).some(s => s) && (
                  <div>
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2 mb-1" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Placeholder if empty */}
          {!isTranslating && !fieldTranslatingStates['personalInfo.name'] && !safePersonalInfo?.name && safeSkills.length === 0 && safeExperience.length === 0 && safeEducation.length === 0 && safeProjects.length === 0 && (
              <p className="text-center text-muted-foreground mt-10 print:hidden">{t('cvPreview.placeholder')}</p>
          )}
          {enableContentTranslation && isTranslating && Object.values(fieldTranslatingStates).every(s => !s) && (
             <div className="text-center text-muted-foreground mt-4 print:hidden">
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                {t('cvPreview.translatingContent')}
             </div>
          )}
       </div>

       {showFinalButton && (
         <div className="mt-8 text-center print:hidden">
            <Button
                onClick={onViewFinalClick}
                variant="default"
                size="lg"
                disabled={isSaving || !isEmailVerified}
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

