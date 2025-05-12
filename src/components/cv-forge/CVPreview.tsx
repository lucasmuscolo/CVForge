import type React from 'react';
import { Mail, Phone, Linkedin, Github, Link as LinkIcon } from 'lucide-react';
import type { CvData } from './types';
import { Separator } from '@/components/ui/separator';

interface CVPreviewProps {
  data: CvData;
}

// Helper to format responsibilities (basic attempt to handle bullet points)
const formatResponsibilities = (text: string): React.ReactNode => {
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

  return (
    <div className="bg-card text-card-foreground p-6 md:p-8 rounded-lg shadow-md h-full print:shadow-none print:p-0">
      {/* Header / Personal Info */}
      <div className="text-center mb-6 print:text-left">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">{personalInfo.name || 'Your Name'}</h1>
        <p className="text-lg text-primary mb-3">{personalInfo.title || 'Your Professional Title'}</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground print:justify-start">
          {personalInfo.email && (
            <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-1 hover:text-primary">
              <Mail className="w-3 h-3" />
              <span>{personalInfo.email}</span>
            </a>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{personalInfo.phone}</span>
            </span>
          )}
          {personalInfo.linkedin && (
            <a href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
              <Linkedin className="w-3 h-3" />
              <span>LinkedIn</span>
            </a>
          )}
           {personalInfo.github && (
            <a href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
              <Github className="w-3 h-3" />
              <span>GitHub</span>
            </a>
          )}
           {personalInfo.website && (
            <a href={personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
              <LinkIcon className="w-3 h-3" />
              <span>Website</span>
            </a>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
         <section className="mb-6">
            <h2 className="text-xl font-semibold text-primary border-b pb-1 mb-3">Summary</h2>
            <p className="text-sm">{personalInfo.summary}</p>
         </section>
       )}


      {/* Experience */}
      {experience.length > 0 && (
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
                {exp.responsibilities && formatResponsibilities(exp.responsibilities)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
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
       {!personalInfo.name && experience.length === 0 && education.length === 0 && (
          <p className="text-center text-muted-foreground mt-10">Start filling out the forms on the left to see your CV preview here.</p>
       )}
    </div>
  );
}
