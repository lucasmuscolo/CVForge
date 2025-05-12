
// src/components/cv-forge/EducationForm.tsx
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
import type { CvData } from './types';
import { useTranslation } from '@/hooks/useTranslation'; // Import useTranslation

interface EducationFormProps {
  form: UseFormReturn<CvData>;
}

export function EducationForm({ form }: EducationFormProps) {
  const { t } = useTranslation(); // Get translation function
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const addEducation = () => {
    append({
      id: crypto.randomUUID(),
      degree: '',
      institution: '',
      location: '',
      graduationDate: '',
      details: '',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('education.title')}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEducation}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('education.addEducation')}
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
                  aria-label={t('education.removeEducation')}
                >
                  <Trash2 className="h-4 w-4" />
                   <span className="sr-only">{t('education.removeEducation')}</span>
                </Button>
                <FormField
                  control={form.control}
                  name={`education.${index}.degree`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('education.degreeLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('education.degreePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`education.${index}.institution`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('education.institutionLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('education.institutionPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`education.${index}.location`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('education.locationLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('education.locationPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name={`education.${index}.graduationDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('education.graduationDateLabel')}</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder={t('education.graduationDatePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name={`education.${index}.details`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('education.detailsLabel')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('education.detailsPlaceholder')} {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {index < fields.length - 1 && <Separator />}
              </div>
            ))}
            {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t('education.noEducation')}</p>
             )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

  