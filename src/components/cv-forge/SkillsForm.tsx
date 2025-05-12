
// src/components/cv-forge/SkillsForm.tsx
'use client';

import React, { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, PlusCircle } from 'lucide-react';
import type { CvData } from './types';
import { useTranslation } from '@/hooks/useTranslation'; // Import useTranslation

interface SkillsFormProps {
  form: UseFormReturn<CvData>;
}

export function SkillsForm({ form }: SkillsFormProps) {
  const { t } = useTranslation(); // Get translation function
  const [currentSkill, setCurrentSkill] = useState('');
  // Watch the skills array from the form state to display them
  const skills = form.watch('skills') || [];

  const handleAddSkill = () => {
    const skillToAdd = currentSkill.trim();
    if (skillToAdd && !skills.includes(skillToAdd)) {
      const updatedSkills = [...skills, skillToAdd];
      form.setValue('skills', updatedSkills, { shouldValidate: true, shouldDirty: true });
      setCurrentSkill(''); // Clear input after adding
    } else if (skills.includes(skillToAdd)) {
        // Optional: Add toast notification if skill already exists
        console.warn(`Skill "${skillToAdd}" already exists.`);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    form.setValue('skills', updatedSkills, { shouldValidate: true, shouldDirty: true });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission on Enter
      handleAddSkill();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('skills.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            {/* Skill Input */}
            <FormItem>
              <FormLabel>{t('skills.addSkillLabel')}</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input
                    placeholder={t('skills.addSkillPlaceholder')}
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </FormControl>
                <Button type="button" size="icon" onClick={handleAddSkill} aria-label={t('skills.addSkillButton')}>
                  <PlusCircle className="h-4 w-4" />
                   <span className="sr-only">{t('skills.addSkillButton')}</span>
                </Button>
              </div>
              {/* You might want a FormMessage here if you add specific validation for the input field */}
            </FormItem>

            {/* Display Skills */}
            <div className="space-y-2">
              <FormLabel>{t('skills.yourSkillsLabel')}</FormLabel>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="rounded-full hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                        aria-label={t('skills.removeSkill', { skill: skill })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('skills.noSkills')}</p>
              )}
               {/* General FormMessage for the 'skills' array if needed (e.g., minimum number of skills) */}
                <FormField
                  control={form.control}
                  name="skills"
                  render={() => <FormMessage />}
                />
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

  