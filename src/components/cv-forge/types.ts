
export interface PersonalInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  linkedin: string;
  github?: string;
  website?: string;
  summary: string;
  photoDataUri?: string; // Added photo field
}

export interface ExperienceEntry {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string; // Use "Present" or a date string
  responsibilities: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location: string;
  graduationDate: string; // Use "Expected: " or a date string
  details?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
}

export interface CvData {
  personalInfo: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  projects: ProjectEntry[]; // Added projects field
}
