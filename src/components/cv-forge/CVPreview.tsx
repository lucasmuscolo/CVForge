
import React from 'react';
import Image from 'next/image';
import { Mail, Phone, Linkedin, Github, Link as LinkIcon, UserCircle, ArrowRight, Loader2, Briefcase, BookOpen, PencilLine, Lightbulb } from 'lucide-react';
import type { CvData } from './types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

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
}


export function CVPreview({ 
  data, 
  showFinalButton = true, 
  onViewFinalClick, 
  isSaving = false, 
  isEmailVerified = true
}: CVPreviewProps) {
  const { t } = useTranslation();

  const { personalInfo, experience, education, skills, projects } = data || {};
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
                   {safePersonalInfo.title || t('cvPreview.yourTitle')}
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
          {safePersonalInfo.summary && (
            <section className="mb-6 break-inside-avoid">
                <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                    <PencilLine className="mr-2 h-5 w-5" /> {t('cvPreview.summaryTitle')}
                </h2>
                <div className="text-sm">
                  {formatMultilineText(safePersonalInfo.summary)}
                </div>
            </section>
          )}

          {/* Skills */}
          {safeSkills.length > 0 && (
            <section className="mb-6 break-inside-avoid">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <Lightbulb className="mr-2 h-5 w-5" /> {t('cvPreview.skillsTitle')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {safeSkills.map((skill, index) => (
                  <Badge key={`${skill}-${index}`} variant="secondary" className="print:badge-print">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {safeProjects.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <Briefcase className="mr-2 h-5 w-5" /> {t('cvPreview.projectsTitle')}
              </h2>
              <div className="space-y-4">
                {safeProjects.map((proj) => (
                  <div key={proj.id} className="break-inside-avoid">
                    <h3 className="text-md font-semibold">
                      {proj.name || t('cvPreview.projectName')}
                    </h3>
                    {formatMultilineText(proj.description)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {safeEducation.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <BookOpen className="mr-2 h-5 w-5" /> {t('cvPreview.educationTitle')}
              </h2>
              <div className="space-y-4">
                {safeEducation.map((edu) => (
                  <div key={edu.id} className="break-inside-avoid">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-md font-semibold">
                           {edu.degree || t('cvPreview.degree')}
                        </h3>
                        <span className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">
                          {edu.graduationDate || t('cvPreview.graduationDate')}
                        </span>
                      </div>
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium">
                        {edu.institution || t('cvPreview.institutionName')}
                      </div>
                        <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">{edu.location || t('cvPreview.location')}</p>
                    </div>
                    { edu.details &&
                        <div className="text-sm italic text-muted-foreground print:text-black">
                           {edu.details}
                        </div>
                    }
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {safeExperience.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3 print:text-black print:border-black flex items-center">
                <Briefcase className="mr-2 h-5 w-5" /> {t('cvPreview.experienceTitle')}
              </h2>
              <div className="space-y-4">
                {safeExperience.map((exp) => (
                  <div key={exp.id} className="break-inside-avoid">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-md font-semibold">
                         {exp.jobTitle || t('cvPreview.jobTitle')}
                      </h3>
                      <span className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">
                        {exp.startDate || t('cvPreview.startDate')} - {exp.endDate || t('cvPreview.endDate')}
                      </span>
                    </div>

                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium">
                        {exp.company || t('cvPreview.companyName')}
                      </div>
                      <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2 print:text-black">{exp.location || t('cvPreview.location')}</p>
                    </div>
                     {formatMultilineText(exp.responsibilities)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Placeholder if empty */}
          {!safePersonalInfo?.name && safeSkills.length === 0 && safeExperience.length === 0 && safeEducation.length === 0 && safeProjects.length === 0 && (
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
