
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
// import { useTranslation } from '@/hooks/useTranslation'; // Removed

interface ExperienceFormProps {
  form: UseFormReturn<CvData>;
   enhanceText: (index: number, fieldName: keyof ExperienceEntry, currentText: string) => Promise<void>;
   isEnhancing: (index: number, fieldName: keyof ExperienceEntry) => boolean;
}

export function ExperienceForm({ form, enhanceText, isEnhancing }: ExperienceFormProps) {
  // const { t } = useTranslation(); // Removed
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
        <CardTitle>Experiencia Laboral</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addExperience}
          className="px-2"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Experiencia
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
                  aria-label="Eliminar Experiencia"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar Experiencia</span>
                </Button>

                <FormField
                  control={form.control}
                  name={`experience.${index}.jobTitle`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puesto de Trabajo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej., Desarrollador de Software" {...field} />
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
                      <FormLabel>Nombre de la Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej., Soluciones Tecnológicas S.A." {...field} />
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
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej., Ciudad de México, MX" {...field} />
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
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Ej., Ene 2020 ó 2020" {...field} />
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
                        <FormLabel>Fecha de Fin</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Ej., Dic 2022 ó Actual" {...field} />
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
                      <FormLabel>Responsabilidades/Logros Clave</FormLabel>
                       <div className="relative">
                        <FormControl>
                           <Textarea placeholder="Describe tus contribuciones y logros clave (usa viñetas si lo deseas)..." {...field} rows={5} />
                        </FormControl>
                         <AIButton
                           onClick={() => enhanceText(index, 'responsibilities', field.value || '')}
                           isLoading={isEnhancing(index, 'responsibilities')}
                           className="absolute bottom-2 right-2"
                           tooltipContent="Mejorar responsabilidades con IA"
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
                <p className="text-sm text-muted-foreground text-center py-4">Aún no has añadido experiencia laboral. Haz clic en "Añadir Experiencia" para empezar.</p>
             )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
