import type React from 'react';
import Image from 'next/image'; // Import next/image
import { Mail, Phone, Linkedin, Github, Link as LinkIcon, UserCircle } from 'lucide-react'; // Added UserCircle
import type { CvData } from './types';
import { Separator } from '@/components/ui/separator';

interface CVPreviewProps {
  data: CvData;
}

// Helper to format responsibilities (basic attempt to handle bullet points)
const formatResponsibilities = (text: string | undefined | null): React.ReactNode => {
  if (!text) return null;
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length <= 1 && !text.startsWith('- ') && !text.startsWith('* ')) {
      return <p className="text-sm">{text}</p>;
  }
  return (
    <ul className="list-disc list-outside pl-5 space-y-1">
      {lines.map((line, index) => (
        <li key={index} className="text-sm">
          {line.replace(/^[-*]\s*/, '')} {/* Remove leading bullet characters */}
        </li>
      ))}
    </ul>
  );
};


export function CVPreview({ data }: CVPreviewProps) {
  const { personalInfo, experience, education } = data;

  // Ensure personalInfo exists, providing default empty values if not
  const safePersonalInfo = personalInfo || { name: '', title: '', email: '', phone: '', linkedin: '', github: '', website: '', summary: '', photoDataUri: '' };


  return (
    <div className="bg-card text-card-foreground p-6 md:p-8 rounded-lg shadow-md h-full print:shadow-none print:p-0">
      {/* Header / Personal Info - Adjusted Layout */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 print:flex-row print:items-start">
         {/* Profile Photo */}
          <div className="flex-shrink-0">
            {safePersonalInfo.photoDataUri ? (
              <Image
                src={safePersonalInfo.photoDataUri}
                alt={`${safePersonalInfo.name || 'User'}'s profile photo`}
                width={100} // Increased size
                height={100}
                className="rounded-full object-cover border-2 border-border"
                data-ai-hint="profile avatar"
              />
            ) : (
              <UserCircle className="w-24 h-24 text-muted-foreground" /> // Placeholder icon
            )}
          </div>

          {/* Text Details */}
          <div className="text-center sm:text-left flex-grow print:text-left">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{safePersonalInfo.name || 'Your Name'}</h1>
            <p className="text-lg text-primary mb-3">{safePersonalInfo.title || 'Your Professional Title'}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground print:justify-start">
              {safePersonalInfo.email && (
                <a href={`mailto:${safePersonalInfo.email}`} className="flex items-center gap-1 hover:text-primary">
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
                <a href={safePersonalInfo.linkedin.startsWith('http') ? safePersonalInfo.linkedin : `https://${safePersonalInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                  <Linkedin className="w-3 h-3" />
                  <span>LinkedIn</span>
                </a>
              )}
               {safePersonalInfo.github && (
                <a href={safePersonalInfo.github.startsWith('http') ? safePersonalInfo.github : `https://${safePersonalInfo.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                  <Github className="w-3 h-3" />
                  <span>GitHub</span>
                </a>
              )}
               {safePersonalInfo.website && (
                <a href={safePersonalInfo.website.startsWith('http') ? safePersonalInfo.website : `https://${safePersonalInfo.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                  <LinkIcon className="w-3 h-3" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>


      {/* Summary */}
      {safePersonalInfo.summary && (
         <section className="mb-6">
            <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3">Summary</h2>
            <p className="text-sm">{safePersonalInfo.summary}</p>
         </section>
       )}


      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3">Work Experience</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start mb-1">
                   <h3 className="text-md font-semibold">{exp.jobTitle || 'Job Title'}</h3>
                   <span className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2">
                     {exp.startDate || 'Start Date'} - {exp.endDate || 'End Date'}
                   </span>
                 </div>

                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium">{exp.company || 'Company Name'}</p>
                  <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2">{exp.location || 'Location'}</p>
                </div>
                {formatResponsibilities(exp.responsibilities)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3">Education</h2>
          <div className="space-y-4">
            {education.map((edu) => (
               <div key={edu.id}>
                 <div className="flex justify-between items-start mb-1">
                    <h3 className="text-md font-semibold">{edu.degree || 'Degree/Certificate'}</h3>
                    <span className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2">
                      {edu.graduationDate || 'Graduation Date'}
                    </span>
                  </div>
                 <div className="flex justify-between items-start mb-1">
                   <p className="text-sm font-medium">{edu.institution || 'Institution Name'}</p>
                    <p className="text-xs text-muted-foreground text-right whitespace-nowrap pl-2">{edu.location || 'Location'}</p>
                 </div>
                 {edu.details && <p className="text-sm italic text-muted-foreground">{edu.details}</p>}
               </div>
            ))}
          </div>
        </section>
      )}

       {/* Placeholder if empty */}
       {!safePersonalInfo.name && (!experience || experience.length === 0) && (!education || education.length === 0) && (
          <p className="text-center text-muted-foreground mt-10">Start filling out the forms on the left to see your CV preview here.</p>
       )}
    </div>
  );
}
