'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import Image from 'next/image'; // Import Image
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { PersonalInfo } from './types';
import { AIButton } from './AIButton';
import { useToast } from '@/hooks/use-toast';
import { UserCircle } from 'lucide-react'; // Placeholder icon

interface PersonalInfoFormProps {
  form: UseFormReturn<PersonalInfo>; // Use PersonalInfo directly
  enhanceText: (fieldName: keyof Omit<PersonalInfo, 'photoDataUri'>, currentText: string) => Promise<void>; // Exclude photoDataUri
  isEnhancing: (fieldName: keyof Omit<PersonalInfo, 'photoDataUri'>) => boolean; // Exclude photoDataUri
}

export function PersonalInfoForm({ form, enhanceText, isEnhancing }: PersonalInfoFormProps) {
    const { toast } = useToast();

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>, field: any) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // Limit file size (e.g., 5MB)
            toast({
                title: "File Too Large",
                description: "Please select an image smaller than 5MB.",
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
             toast({ title: "Error Reading File", description: "Could not read the selected image.", variant: "destructive" });
          }
        };
         reader.onerror = () => {
            toast({ title: "Error Reading File", description: "Could not read the selected image.", variant: "destructive" });
         };
        reader.readAsDataURL(file);
      }
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Use form instance directly, assuming it's correctly typed in parent */}
        <Form {...form}>
          {/* We only need one form tag, provided by Form component */}
          <div className="space-y-4">
            {/* Photo Upload Field */}
            <FormField
              control={form.control}
              // Use the correct name matching the parent form structure
              name="personalInfo.photoDataUri" // Adjust if parent form structure differs
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Photo (Optional)</FormLabel>
                  <div className="flex items-center gap-4">
                     {/* Image Preview */}
                     {field.value ? (
                      <Image
                        src={field.value}
                        alt="Profile Preview"
                        width={64} // Adjust size as needed
                        height={64}
                        className="rounded-full object-cover"
                        data-ai-hint="profile picture"
                      />
                    ) : (
                        <UserCircle className="h-16 w-16 text-muted-foreground" /> // Placeholder
                    )}
                    <FormControl>
                      {/* Pass field properties BUT override onChange */}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, field)}
                        // Omit field.value and field.ref from being passed directly to file input
                        // name={field.name} // Keep name if needed for accessibility/labels
                        // onBlur={field.onBlur} // Keep blur handler
                        // disabled={field.disabled} // Keep disabled state
                        className="flex-1"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other Fields */}
            <FormField
              control={form.control}
              name="personalInfo.name" // Adjust if parent form structure differs
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.title" // Adjust if parent form structure differs
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.phone" // Adjust if parent form structure differs
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g., (123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.email" // Adjust if parent form structure differs
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.linkedin" // Adjust if parent form structure differs
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile URL</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., linkedin.com/in/janedoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.github" // Adjust if parent form structure differs
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Profile URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., github.com/janedoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo.website" // Adjust if parent form structure differs
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Website/Portfolio (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., janedoe.dev" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="personalInfo.summary" // Adjust if parent form structure differs
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary/Objective</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Textarea placeholder="Brief professional overview..." {...field} value={field.value ?? ''} rows={4} />
                    </FormControl>
                     <AIButton
                      onClick={() => enhanceText('summary', field.value ?? '')}
                      isLoading={isEnhancing('summary')}
                      className="absolute bottom-2 right-2"
                      tooltipContent="Enhance summary with AI"
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
