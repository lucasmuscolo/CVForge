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

interface EducationFormProps {
  form: UseFormReturn<CvData>;
}

export function EducationForm({ form }: EducationFormProps) {
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
        <CardTitle>Education</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEducation}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Education
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
                   <span className="sr-only">Remove Education</span>
                </Button>
                <FormField
                  control={form.control}
                  name={`education.${index}.degree`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree/Certificate</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., B.S. in Computer Science" {...field} />
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
                      <FormLabel>Institution Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., University of Example" {...field} />
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
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., City, State" {...field} />
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
                        <FormLabel>Graduation Date</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="e.g., May 2019 or Expected: May 2025" {...field} />
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
                      <FormLabel>Relevant Details (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., GPA: 3.8, Dean's List, Thesis: ..." {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {index < fields.length - 1 && <Separator />}
              </div>
            ))}
            {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No education history added yet. Click "Add Education" to start.</p>
             )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
