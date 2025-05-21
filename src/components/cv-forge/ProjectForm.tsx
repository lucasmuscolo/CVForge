
// src/components/cv-forge/ProjectForm.tsx
'use client';

import type React from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { CvData, ProjectEntry } from './types'; // Ensure ProjectEntry is imported
import { AIButton } from './AIButton';
import { useTranslation } from '@/hooks/useTranslation';

interface ProjectFormProps {
  form: UseFormReturn<CvData>;
  enhanceText: (index: number, fieldName: keyof ProjectEntry, currentText: string) => Promise<void>;
  isEnhancing: (index: number, fieldName: keyof ProjectEntry) => boolean;
}

export function ProjectForm({ form, enhanceText, isEnhancing }: ProjectFormProps) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "projects",
  });

  const addProject = () => {
    append({
      id: crypto.randomUUID(),
      name: '',
      description: '',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('projects.title')}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProject}
          className="px-2"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> {t('projects.addProject')}
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-6">
            {fields.map((item, index) => (
              <div key={item.id} className="space-y-4 border p-4 rounded-md relative shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
                  onClick={() => remove(index)}
                  aria-label={t('projects.removeProject')}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t('projects.removeProject')}</span>
                </Button>

                <FormField
                  control={form.control}
                  name={`projects.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('projects.nameLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('projects.namePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`projects.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('projects.descriptionLabel')}</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Textarea placeholder={t('projects.descriptionPlaceholder')} {...field} rows={4} />
                        </FormControl>
                        {/* AIButton for project description (currently non-functional as per parent component's placeholder) */}
                        <AIButton
                          onClick={() => enhanceText(index, 'description', field.value || '')}
                          isLoading={isEnhancing(index, 'description')}
                          className="absolute bottom-2 right-2"
                          tooltipContent={t('projects.enhanceDescriptionTooltip')}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {index < fields.length - 1 && <Separator />}
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('projects.noProjects')}</p>
            )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
