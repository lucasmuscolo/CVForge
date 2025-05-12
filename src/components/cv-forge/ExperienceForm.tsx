
// src/components/cv-forge/ExperienceForm.tsx
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
import type { CvData, ExperienceEntry } from './types';
import { AIButton } from './AIButton';
import { useTranslation } from '@/hooks/useTranslation'; // Import useTranslation


interface ExperienceFormProps {
  form: UseFormReturn<CvData>;
   // Corresponds to enhanceExperienceText in parent
   enhanceText: (index: number, fieldName: keyof ExperienceEntry, currentText: string) => Promise<void>;
   // Corresponds to isEnhancingExperience in parent
   isEnhancing: (index: number, fieldName: keyof ExperienceEntry) => boolean;
}

export function ExperienceForm({ form, enhanceText, isEnhancing }: ExperienceFormProps) {
  const { t } = useTranslation(); // Get translation function
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "experience",
  });

  const addExperience = () => {
    append({
      id: crypto.randomUUID(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      responsibilities: '',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('experience.title')}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addExperience}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('experience.addExperience')}
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
                  aria-label={t('experience.removeExperience')}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t('experience.removeExperience')}</span>
                </Button>

                <FormField
                  control={form.control}
                  name={`experience.${index}.jobTitle`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('experience.jobTitleLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('experience.jobTitlePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`experience.${index}.company`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('experience.companyLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('experience.companyPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`experience.${index}.location`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('experience.locationLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('experience.locationPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name={`experience.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('experience.startDateLabel')}</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder={t('experience.startDatePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`experience.${index}.endDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('experience.endDateLabel')}</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder={t('experience.endDatePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`experience.${index}.responsibilities`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('experience.responsibilitiesLabel')}</FormLabel>
                       <div className="relative">
                        <FormControl>
                           <Textarea placeholder={t('experience.responsibilitiesPlaceholder')} {...field} rows={5} />
                        </FormControl>
                         <AIButton
                           // Call the props with arguments expected by the wrapper functions in parent
                           onClick={() => enhanceText(index, 'responsibilities', field.value || '')}
                           isLoading={isEnhancing(index, 'responsibilities')}
                           className="absolute bottom-2 right-2"
                           tooltipContent={t('experience.enhanceResponsibilitiesTooltip')}
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
                <p className="text-sm text-muted-foreground text-center py-4">{t('experience.noExperience')}</p>
             )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

  