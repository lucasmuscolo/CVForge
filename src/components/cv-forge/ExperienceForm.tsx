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


interface ExperienceFormProps {
  form: UseFormReturn<CvData>;
   enhanceText: (section: 'experience', index: number, fieldName: keyof ExperienceEntry, currentText: string) => Promise<void>;
   isEnhancing: (section: 'experience', index: number, fieldName: keyof ExperienceEntry) => boolean;
}

export function ExperienceForm({ form, enhanceText, isEnhancing }: ExperienceFormProps) {
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
        <CardTitle>Work Experience</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addExperience}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
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
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove Experience</span>
                </Button>

                <FormField
                  control={form.control}
                  name={`experience.${index}.jobTitle`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Software Developer" {...field} />
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
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tech Solutions Inc." {...field} />
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
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., San Francisco, CA" {...field} />
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
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="e.g., Jan 2020 or 2020" {...field} />
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
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="e.g., Dec 2022 or Present" {...field} />
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
                      <FormLabel>Key Responsibilities/Achievements</FormLabel>
                       <div className="relative">
                        <FormControl>
                           <Textarea placeholder="Describe your key contributions and accomplishments (use bullet points if desired)..." {...field} rows={5} />
                        </FormControl>
                         <AIButton
                          onClick={() => enhanceText('experience', index, 'responsibilities', field.value)}
                          isLoading={isEnhancing('experience', index, 'responsibilities')}
                          className="absolute bottom-2 right-2"
                           tooltipContent="Enhance responsibilities with AI"
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
                <p className="text-sm text-muted-foreground text-center py-4">No work experience added yet. Click "Add Experience" to start.</p>
             )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
