
// src/components/cv-forge/PersonalInfoForm.tsx
'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { PersonalInfo } from './types';
import { AIButton } from './AIButton';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Upload, Replace } from 'lucide-react';
// import { useTranslation } from '@/hooks/useTranslation'; // Removed

interface PersonalInfoFormProps {
  form: UseFormReturn<any>;
  enhanceText: (fieldName: keyof Omit<PersonalInfo, 'photoDataUri'>, currentText: string) => Promise<void>;
  isEnhancing: (fieldName: keyof Omit<PersonalInfo, 'photoDataUri'>) => boolean;
}

export function PersonalInfoForm({ form, enhanceText, isEnhancing }: PersonalInfoFormProps) {
    // const { t } = useTranslation(); // Removed
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>, field: any) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Archivo Demasiado Grande",
                description: "Por favor, selecciona una imagen de menos de 5MB.",
                variant: "destructive",
            });
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const result = loadEvent.target?.result;
          if (typeof result === 'string') {
            field.onChange(result);
          } else {
             toast({ title: "Error al Leer Archivo", description: "No se pudo leer la imagen seleccionada.", variant: "destructive" });
          }
        };
         reader.onerror = () => {
            toast({ title: "Error al Leer Archivo", description: "No se pudo leer la imagen seleccionada.", variant: "destructive" });
         };
        reader.readAsDataURL(file);
      }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="personalInfo.photoDataUri"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto de Perfil (Opcional)</FormLabel>
                  <div className="flex items-center gap-4">
                     {field.value ? (
                      <Image
                        src={field.value}
                        alt="Profile Preview"
                        width={64}
                        height={64}
                        className="rounded-full object-cover border border-border"
                        data-ai-hint="profile picture"
                      />
                    ) : (
                        <UserCircle className="h-16 w-16 text-muted-foreground" />
                    )}
                     <FormControl>
                         <Input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={(e) => handlePhotoChange(e, field)}
                            className="hidden"
                            id="photo-upload-input"
                          />
                     </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerFileInput}
                        className="flex-1"
                      >
                         {field.value ? (
                           <>
                             <Replace className="mr-2 h-4 w-4" /> Cambiar Foto
                           </>
                         ) : (
                           <>
                             <Upload className="mr-2 h-4 w-4" /> Subir Foto
                           </>
                         )}
                      </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej., Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Profesional</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej., Ingeniero de Software Senior" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Teléfono</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Ej., (123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Ej., juan.perez@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Perfil de LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej., linkedin.com/in/juanperez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.github"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Perfil de GitHub (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej., github.com/juanperez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio Web/Portafolio Personal (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej., juanperez.dev" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="personalInfo.summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumen/Objetivo</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Textarea placeholder="Breve descripción profesional..." {...field} value={field.value ?? ''} rows={4} />
                    </FormControl>
                     <AIButton
                      onClick={() => enhanceText('summary', field.value ?? '')}
                      isLoading={isEnhancing('summary')}
                      className="absolute bottom-2 right-2"
                      tooltipContent="Mejorar resumen con IA"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
