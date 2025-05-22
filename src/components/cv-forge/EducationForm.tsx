
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
// import { useTranslation } from '@/hooks/useTranslation'; // Removed

interface EducationFormProps {
  form: UseFormReturn<CvData>;
}

export function EducationForm({ form }: EducationFormProps) {
  // const { t } = useTranslation(); // Removed
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
        <CardTitle>Educación</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEducation}
          className="px-2"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Educación
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
                  aria-label="Eliminar Educación"
                >
                  <Trash2 className="h-4 w-4" />
                   <span className="sr-only">Eliminar Educación</span>
                </Button>
                <FormField
                  control={form.control}
                  name={`education.${index}.degree`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título/Certificado</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej., Lic. en Ciencias de la Computación" {...field} />
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
                      <FormLabel>Nombre de la Institución</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej., Universidad de Ejemplo" {...field} />
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
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej., Ciudad, País" {...field} />
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
                        <FormLabel>Fecha de Graduación</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Ej., Mayo 2019 ó Previsto: Mayo 2025" {...field} />
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
                      <FormLabel>Detalles Relevantes (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ej., Promedio: 9.5, Mención Honorífica, Tesis: ..." {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {index < fields.length - 1 && <Separator />}
              </div>
            ))}
            {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aún no has añadido historial educativo. Haz clic en "Añadir Educación" para empezar.</p>
             )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
