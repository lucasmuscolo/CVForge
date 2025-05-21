
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CvData, ExperienceEntry, EducationEntry, ProjectEntry } from "@/components/cv-forge/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateCvCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function cvDataToMarkdown(data: CvData): string {
  let markdown = "";

  // Personal Info
  if (data.personalInfo) {
    const pi = data.personalInfo;
    markdown += `# ${pi.name || 'N/A'}\n`;
    markdown += `_${pi.title || 'N/A'}_\n\n`;

    markdown += `## Contact\n`;
    if (pi.email) markdown += `- **Email:** ${pi.email}\n`;
    if (pi.phone) markdown += `- **Phone:** ${pi.phone}\n`;
    if (pi.linkedin) markdown += `- **LinkedIn:** ${pi.linkedin}\n`;
    if (pi.github) markdown += `- **GitHub:** ${pi.github}\n`;
    if (pi.website) markdown += `- **Website:** ${pi.website}\n`;
    markdown += `\n`;
  }

  // Summary
  if (data.personalInfo?.summary) {
    markdown += `## Summary\n`;
    markdown += `${data.personalInfo.summary}\n\n`;
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    markdown += `## Skills\n`;
    data.skills.forEach(skill => {
      markdown += `- ${skill}\n`;
    });
    markdown += `\n`;
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    markdown += `## Projects\n\n`;
    data.projects.forEach((proj: ProjectEntry) => {
      markdown += `### ${proj.name || 'N/A'}\n`;
      if (proj.description) {
        const descLines = proj.description.split('\n').filter(line => line.trim() !== '');
        descLines.forEach(line => {
          markdown += `- ${line.replace(/^[-*]\s*/, '')}\n`;
        });
      }
      markdown += `\n---\n\n`;
    });
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    markdown += `## Experience\n\n`;
    data.experience.forEach((exp: ExperienceEntry) => {
      markdown += `### ${exp.jobTitle || 'N/A'} at ${exp.company || 'N/A'}\n`;
      markdown += `_(${exp.startDate || 'N/A'} - ${exp.endDate || 'N/A'})_\n`;
      if (exp.location) markdown += `**Location:** ${exp.location}\n`;
      if (exp.responsibilities) {
        markdown += `\n**Responsibilities:**\n`;
        const resLines = exp.responsibilities.split('\n').filter(line => line.trim() !== '');
        resLines.forEach(line => {
          markdown += `- ${line.replace(/^[-*]\s*/, '')}\n`;
        });
      }
      markdown += `\n---\n\n`;
    });
  }

  // Education
  if (data.education && data.education.length > 0) {
    markdown += `## Education\n\n`;
    data.education.forEach((edu: EducationEntry) => {
      markdown += `### ${edu.degree || 'N/A'} - ${edu.institution || 'N/A'}\n`;
      markdown += `_(${edu.graduationDate || 'N/A'})_\n`;
      if (edu.location) markdown += `**Location:** ${edu.location}\n`;
      if (edu.details) {
        markdown += `\n**Details:**\n${edu.details}\n`;
      }
      markdown += `\n---\n\n`;
    });
  }

  return markdown.trim();
}
