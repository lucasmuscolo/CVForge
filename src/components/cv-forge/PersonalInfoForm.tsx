
// src/components/cv-forge/PersonalInfoForm.tsx
'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import Image from 'next/image'; // Import Image
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'; // Import Button
import { Textarea } from '@/components/ui/textarea';
import type { PersonalInfo } from './types';
import { AIButton } from './AIButton';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Upload, Replace } from 'lucide-react'; // Placeholder icon, Upload, Replace
import { cn } from '@/lib/utils'; // Import cn
import { useTranslation } from '@/hooks/useTranslation'; // Import useTranslation

interface PersonalInfoFormProps {
  form: UseFormReturn<any>; // Allow wider type for nested structure
  enhanceText: (fieldName: keyof Omit<PersonalInfo, 'photoDataUri'>, currentText: string) => Promise<void>; // Exclude photoDataUri
  isEnhancing: (fieldName: keyof Omit<PersonalInfo, 'photoDataUri'>) => boolean; // Exclude photoDataUri
}

export function PersonalInfoForm({ form, enhanceText, isEnhancing }: PersonalInfoFormProps) {
    const { t } = useTranslation(); // Get translation function
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null); // Ref for the hidden file input

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>, field: any) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // Limit file size (e.g., 5MB)
            toast({
                title: t('personalInfo.fileTooLarge'),
                description: t('personalInfo.fileTooLargeDesc'),
                variant: "destructive",
            });
            event.target.value = ''; // Clear the input
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const result = loadEvent.target?.result;
          if (typeof result === 'string') {
            field.onChange(result); // Use field.onChange provided by Controller
          } else {
             toast({ title: t('personalInfo.errorReadingFile'), description: t('personalInfo.errorReadingFileDesc'), variant: "destructive" });
          }
        };
         reader.onerror = () => {
            toast({ title: t('personalInfo.errorReadingFile'), description: t('personalInfo.errorReadingFileDesc'), variant: "destructive" });
         };
        reader.readAsDataURL(file);
      }
    };

     // Function to trigger the hidden file input click
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('personalInfo.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Use form instance directly, assuming it's correctly typed in parent */}
        <Form {...form}>
          {/* We only need one form tag, provided by Form component */}
          <div className="space-y-4">
            {/* Photo Upload Field */}
            <FormField
              control={form.control}
              name="personalInfo.photoDataUri" // Adjusted name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('personalInfo.photoLabel')}</FormLabel>
                  <div className="flex items-center gap-4">
                     {/* Image Preview */}
                     {field.value ? (
                      <Image
                        src={field.value}
                        alt="Profile Preview"
                        width={64} // Adjust size as needed
                        height={64}
                        className="rounded-full object-cover border border-border"
                        data-ai-hint="profile picture"
                      />
                    ) : (
                        <UserCircle className="h-16 w-16 text-muted-foreground" /> // Placeholder
                    )}
                     {/* Hidden Actual File Input */}
                     <FormControl>
                         <Input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={(e) => handlePhotoChange(e, field)}
                            className="hidden" // Hide the actual input
                            id="photo-upload-input" // Add id for label association
                          />
                     </FormControl>
                     {/* Custom Button Trigger */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerFileInput}
                        className="flex-1" // Adjust width as needed
                      >
                         {field.value ? (
                           <>
                             <Replace className="mr-2 h-4 w-4" /> {t('personalInfo.changePhoto')}
                           </>
                         ) : (
                           <>
                             <Upload className="mr-2 h-4 w-4" /> {t('personalInfo.uploadPhoto')}
                           </>
                         )}
                      </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other Fields */}
            <FormField
              control={form.control}
              name="personalInfo.name" // Adjusted name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('personalInfo.nameLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('personalInfo.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.title" // Adjusted name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('personalInfo.titleLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('personalInfo.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.phone" // Adjusted name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('personalInfo.phoneLabel')}</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder={t('personalInfo.phonePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.email" // Adjusted name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('personalInfo.emailLabel')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('personalInfo.emailPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.linkedin" // Adjusted name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('personalInfo.linkedinLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('personalInfo.linkedinPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.github" // Adjusted name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('personalInfo.githubLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('personalInfo.githubPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.website" // Adjusted name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('personalInfo.websiteLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('personalInfo.websitePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="personalInfo.summary" // Adjusted name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('personalInfo.summaryLabel')}</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Textarea placeholder={t('personalInfo.summaryPlaceholder')} {...field} value={field.value ?? ''} rows={4} />
                    </FormControl>
                     <AIButton
                      onClick={() => enhanceText('summary', field.value ?? '')}
                      isLoading={isEnhancing('summary')}
                      className="absolute bottom-2 right-2"
                      tooltipContent={t('personalInfo.enhanceSummaryTooltip')}
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

  