
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Mail, Phone, Linkedin, Github, Link as LinkIcon, UserCircle, ArrowRight, Loader2, Briefcase, BookOpen, PencilLine, Lightbulb } from 'lucide-react';
import type { CvData, ExperienceEntry, EducationEntry, PersonalInfo, ProjectEntry } from './types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';
import { translateText } from '@/ai/flows/translate-text-flow'; // Import the translation flow

// Helper to format multiline text (like responsibilities or project descriptions)
const formatMultilineText = (text: string | undefined | null): React.ReactNode => {
  if (!text) return null;
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length <= 1 && !text.startsWith('- ') && !text.startsWith('* ')) {
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
  enableContentTranslation = false 
}: CVPreviewProps) {
  const { t, locale } = useTranslation();

  const [originalData, setOriginalData] = useState<CvData>(data);
  const [displayedCvData, setDisplayedCvData] = useState<CvData>(data);
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});


  useEffect(() => {
    setOriginalData(JSON.parse(JSON.stringify(data)));
  }, [data]);

  useEffect(() => {
    if (!enableContentTranslation || !originalData) {
      setDisplayedCvData(JSON.parse(JSON.stringify(originalData || data)));
      setIsTranslating({}); 
      return;
    }

    const translateAllFields = async () => {
      const newDisplayedData = JSON.parse(JSON.stringify(originalData));
      const newIsTranslatingState: Record<string, boolean> = {};
      
      // Initialize all potential fields to translating if they have content
      const fieldsToTranslate: { key: string, text: string | undefined | null, path: (keyof CvData | string | number)[] }[] = [];

      if (originalData.personalInfo) {
        if (originalData.personalInfo.title) fieldsToTranslate.push({ key: 'personalInfo.title', text: originalData.personalInfo.title, path: ['personalInfo', 'title'] });
        if (originalData.personalInfo.summary) fieldsToTranslate.push({ key: 'personalInfo.summary', text: originalData.personalInfo.summary, path: ['personalInfo', 'summary'] });
      }
      if (Array.isArray(originalData.skills)) {
        originalData.skills.forEach((skill, index) => {
          if (skill) fieldsToTranslate.push({ key: `skills.${index}`, text: skill, path: ['skills', index] });
        });
      }
      if (Array.isArray(originalData.projects)) {
        originalData.projects.forEach((proj, index) => {
          if (proj.name) fieldsToTranslate.push({ key: `projects.${index}.name`, text: proj.name, path: ['projects', index, 'name'] });
          if (proj.description) fieldsToTranslate.push({ key: `projects.${index}.description`, text: proj.description, path: ['projects', index, 'description'] });
        });
      }
      if (Array.isArray(originalData.education)) {
        originalData.education.forEach((edu, index) => {
          if (edu.degree) fieldsToTranslate.push({ key: `education.${index}.degree`, text: edu.degree, path: ['education', index, 'degree'] });
          if (edu.institution) fieldsToTranslate.push({ key: `education.${index}.institution`, text: edu.institution, path: ['education', index, 'institution'] });
          if (edu.details) fieldsToTranslate.push({ key: `education.${index}.details`, text: edu.details, path: ['education', index, 'details'] });
        });
      }
      if (Array.isArray(originalData.experience)) {
        originalData.experience.forEach((exp, index) => {
          if (exp.jobTitle) fieldsToTranslate.push({ key: `experience.${index}.jobTitle`, text: exp.jobTitle, path: ['experience', index, 'jobTitle'] });
          if (exp.company) fieldsToTranslate.push({ key: `experience.${index}.company`, text: exp.company, path: ['experience', index, 'company'] });
          if (exp.responsibilities) fieldsToTranslate.push({ key: `experience.${index}.responsibilities`, text: exp.responsibilities, path: ['experience', index, 'responsibilities'] });
        });
      }
      
      fieldsToTranslate.forEach(f => { if (f.text && f.text.trim()) newIsTranslatingState[f.key] = true; });
      setIsTranslating(newIsTranslatingState);

      const translationPromises = fieldsToTranslate.map(async (field) => {
        if (!field.text || !field.text.trim()) return { key: field.key, translatedText: field.text || '' };
        try {
          const result = await translateText({ textToTranslate: field.text, targetLanguage: locale });
          return { key: field.key, translatedText: result.translatedText };
        } catch (error) {
          let errorMessage = `Failed to translate field '${field.key}'.`;
          if (error instanceof Error && error.message.includes('429')) {
            errorMessage += ' (Rate limit likely exceeded)';
          }
          console.warn(errorMessage, 'Original error:', error);
          return { key: field.key, translatedText: field.text }; // Fallback to original text on error
        }
      });

      const results = await Promise.all(translationPromises);

      results.forEach(result => {
        const path = result.key.split('.');
        let current = newDisplayedData;
        path.forEach((p, i) => {
          if (i === path.length - 1) {
            current[p] = result.translatedText;
          } else {
            current = current[p];
          }
        });
         // Update translation status for this specific field
        setIsTranslating(prev => ({ ...prev, [result.key]: false }));
      });
      
      setDisplayedCvData(newDisplayedData);
    };

    translateAllFields();

  }, [locale, originalData, enableContentTranslation]);


  const renderTextWithLoading = (text: string | undefined, fieldKey: string, defaultTextKey?: string) => {
    if (isTranslating[fieldKey] && enableContentTranslation) {
      return <Skeleton className="h-4 w-3/4 my-1" />;
    }
    return text || (defaultTextKey ? t(defaultTextKey) : '');
  };
  
  const renderFormattedTextWithLoading = (text: string | undefined, fieldKey: string) => {
      if (isTranslating[fieldKey] && enableContentTranslation) {
        return <Skeleton className="h-10 w-full my-1" />; 
      }
      return formatMultilineText(text);
  };


  const { personalInfo, experience, education, skills, projects } = displayedCvData || {};
  const safePersonalInfo = personalInfo || { name: '', title: '', email: '', phone: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: '' };
  const safeSkills = skills || [];
  const safeProjects = projects || [];
  const safeExperience = experience || [];
  const safeEducation = education || [];


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
          {(safePersonalInfo.summary || (isTranslating['personalInfo.summary'] && enableContentTranslation)) && (
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
          {(safeSkills.length > 0 || (Object.keys(isTranslating).some(k => k.startsWith('skills.')) && enableContentTranslation)) && (
            <section className="mb-6 break-inside-avoid">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <Lightbulb className="mr-2 h-5 w-5" /> {t('cvPreview.skillsTitle')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {safeSkills.map((skill, index) => (
                  <Badge key={`${skill}-${index}`} variant="secondary" className="print:badge-print">
                    {renderTextWithLoading(skill, `skills.${index}`)}
                  </Badge>
                ))}
                {/* Placeholder for skills that might be translating but are empty */}
                {Object.keys(isTranslating).filter(k => k.startsWith('skills.') && isTranslating[k]).length > safeSkills.filter(s => !!s).length &&
                 Array.from({ length: Object.keys(isTranslating).filter(k => k.startsWith('skills.') && isTranslating[k]).length - safeSkills.filter(s => !!s).length }).map((_, i) => (
                    <Skeleton key={`skill-skeleton-${i}`} className="h-6 w-20 rounded-full" />
                 ))
                }
              </div>
            </section>
          )}

          {/* Projects */}
          {(safeProjects.length > 0 || (Object.keys(isTranslating).some(k => k.startsWith('projects.')) && enableContentTranslation)) && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <Briefcase className="mr-2 h-5 w-5" /> {t('cvPreview.projectsTitle')}
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
              </div>
            </section>
          )}

          {/* Education */}
          {(safeEducation.length > 0 || (Object.keys(isTranslating).some(k => k.startsWith('education.')) && enableContentTranslation)) && (
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
                          {edu.graduationDate || t('cvPreview.graduationDate')}
                        </span>
                      </div>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">
                        {renderTextWithLoading(edu.institution, `education.${index}.institution`, 'cvPreview.institutionName')}
                      </p>
                        <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">{edu.location || t('cvPreview.location')}</p>
                    </div>
                    { (edu.details || (isTranslating[`education.${index}.details`] && enableContentTranslation)) &&
                        <div className="text-sm italic text-muted-foreground print:text-black">
                           {renderTextWithLoading(edu.details, `education.${index}.details`)}
                        </div>
                    }
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {(safeExperience.length > 0 || (Object.keys(isTranslating).some(k => k.startsWith('experience.')) && enableContentTranslation)) && (
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
                        {exp.startDate || t('cvPreview.startDate')} - {exp.endDate || t('cvPreview.endDate')}
                      </span>
                    </div>

                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">
                        {renderTextWithLoading(exp.company, `experience.${index}.company`, 'cvPreview.companyName')}
                      </p>
                      <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">{exp.location || t('cvPreview.location')}</p>
                    </div>
                     {renderFormattedTextWithLoading(exp.responsibilities, `experience.${index}.responsibilities`)}
                  </div>
                ))}
              </div>
            </section>
          )}


          {/* Placeholder if empty and not translating */}
          {!safePersonalInfo?.name && safeSkills.length === 0 && safeExperience.length === 0 && safeEducation.length === 0 && safeProjects.length === 0 && 
           Object.keys(isTranslating).filter(k => isTranslating[k]).length === 0 && (
              <p className="text-center text-muted-foreground mt-10 print:hidden">{t('cvPreview.placeholder')}</p>
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

