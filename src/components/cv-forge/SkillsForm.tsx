
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
// import { useTranslation } from '@/hooks/useTranslation'; // Removed

interface SkillsFormProps {
  form: UseFormReturn<CvData>;
}

export function SkillsForm({ form }: SkillsFormProps) {
  // const { t } = useTranslation(); // Removed
  const [currentSkill, setCurrentSkill] = useState('');
  const skills = form.watch('skills') || [];

  const handleAddSkill = () => {
    const skillToAdd = currentSkill.trim();
    if (skillToAdd && !skills.includes(skillToAdd)) {
      const updatedSkills = [...skills, skillToAdd];
      form.setValue('skills', updatedSkills, { shouldValidate: true, shouldDirty: true });
      setCurrentSkill('');
    } else if (skills.includes(skillToAdd)) {
        console.warn(`La habilidad "${skillToAdd}" ya existe.`);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    form.setValue('skills', updatedSkills, { shouldValidate: true, shouldDirty: true });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habilidades</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            <FormItem>
              <FormLabel>Añadir Habilidad</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input
                    placeholder="Ej., JavaScript, Python, Gestión de Proyectos"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </FormControl>
                <Button type="button" size="icon" onClick={handleAddSkill} aria-label="Añadir Habilidad">
                  <PlusCircle className="h-4 w-4" />
                   <span className="sr-only">Añadir Habilidad</span>
                </Button>
              </div>
            </FormItem>

            <div className="space-y-2">
              <FormLabel>Tus Habilidades</FormLabel>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="rounded-full hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                        aria-label={`Eliminar ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no has añadido habilidades.</p>
              )}
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
