
// src/app/(auth)/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider, // Import GoogleAuthProvider
    signInWithPopup // Import signInWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Chrome } from 'lucide-react'; // Import Chrome for Google icon
import { Separator } from '@/components/ui/separator'; // Import Separator
import { useTranslation } from '@/hooks/useTranslation'; // Import useTranslation
import { LanguageSwitcher } from '@/components/LanguageSwitcher'; // Import LanguageSwitcher


const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const signupSchema = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // path of error
});


type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function LoginPage() {
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false); // Loading state for Google Sign-In
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation(); // Get translation function

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormValues>({
      resolver: zodResolver(signupSchema),
      defaultValues: { email: '', password: '', confirmPassword: '' },
  });


  const handleLogin = async (values: LoginFormValues) => {
    setIsLoadingLogin(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: t('loginPage.loginSuccess'), description: t('loginPage.loginSuccessDesc') });
      router.push('/'); // Redirect to home page after successful login
    } catch (error: any) {
      console.error('Login failed:', error);
      // The catch block correctly handles errors like 'auth/invalid-credential'
      // by showing a toast message to the user.
      toast({
        title: t('loginPage.loginFailed'),
        description: error.message || t('loginPage.loginFailedDesc'), // Provide a more specific default message if needed
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
     setIsLoadingSignup(true);
     try {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: t('loginPage.signUpSuccess'), description: t('loginPage.signUpSuccessDesc') });
        router.push('/'); // Redirect to home page after successful signup
     } catch (error: any) {
        console.error('Signup failed:', error);
        toast({
            title: t('loginPage.signUpFailed'),
            description: error.message || t('loginPage.signUpFailedDesc'),
            variant: 'destructive',
        });
     } finally {
        setIsLoadingSignup(false);
     }
   };

   // --- Google Sign-In Handler ---
   const handleGoogleSignIn = async () => {
       setIsLoadingGoogle(true);
       const provider = new GoogleAuthProvider();
       try {
           await signInWithPopup(auth, provider);
           toast({ title: t('loginPage.googleSignInSuccess'), description: t('loginPage.googleSignInSuccessDesc') });
           router.push('/'); // Redirect to home page after successful sign-in
       } catch (error: any) {
           console.error('Google Sign-In failed:', error);
           // Handle specific errors like popup closed by user
           if (error.code === 'auth/popup-closed-by-user') {
                 toast({
                    title: t('loginPage.signInCancelled'),
                    description: t('loginPage.signInCancelledDesc'),
                    variant: 'default', // Use default or warning variant
                 });
           } else {
               toast({
                   title: t('loginPage.googleSignInFailed'),
                   description: error.message || t('loginPage.googleSignInFailedDesc'),
                   variant: 'destructive',
               });
            }
       } finally {
           setIsLoadingGoogle(false);
       }
   };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
      <div className="absolute top-4 right-4">
          <LanguageSwitcher />
      </div>
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">{t('loginPage.login')}</TabsTrigger>
          <TabsTrigger value="signup">{t('loginPage.signUp')}</TabsTrigger>
        </TabsList>

        {/* Login Tab */}
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>{t('loginPage.loginTitle')}</CardTitle>
              <CardDescription>{t('loginPage.loginDescription')}</CardDescription>
            </CardHeader>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                <CardContent className="space-y-4">
                   <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                           <Label htmlFor="login-email">{t('loginPage.emailLabel')}</Label>
                           <FormControl>
                             <Input id="login-email" type="email" placeholder={t('loginPage.emailPlaceholder')} {...field} disabled={isLoadingLogin || isLoadingGoogle} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                   <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                           <Label htmlFor="login-password">{t('loginPage.passwordLabel')}</Label>
                            <FormControl>
                              <Input id="login-password" type="password" {...field} disabled={isLoadingLogin || isLoadingGoogle} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                <CardFooter className="flex-col space-y-4">
                   <Button type="submit" className="w-full" disabled={isLoadingLogin || isLoadingGoogle}>
                     {isLoadingLogin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {t('loginPage.loginButton')}
                   </Button>
                   <div className="relative w-full">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">{t('loginPage.or')}</span>
                    </div>
                   <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoadingLogin || isLoadingGoogle || isLoadingSignup}>
                     {isLoadingGoogle ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                        <Chrome className="mr-2 h-4 w-4" /> // Using Chrome icon for Google
                     )}
                     {t('loginPage.googleSignIn')}
                   </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

         {/* Sign Up Tab */}
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>{t('loginPage.signUpTitle')}</CardTitle>
              <CardDescription>{t('loginPage.signUpDescription')}</CardDescription>
            </CardHeader>
            <Form {...signupForm}>
               <form onSubmit={signupForm.handleSubmit(handleSignup)}>
                <CardContent className="space-y-4">
                   <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                           <Label htmlFor="signup-email">{t('loginPage.emailLabel')}</Label>
                            <FormControl>
                                <Input id="signup-email" type="email" placeholder={t('loginPage.emailPlaceholder')} {...field} disabled={isLoadingSignup || isLoadingGoogle} />
                            </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                   <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                           <Label htmlFor="signup-password">{t('loginPage.passwordLabel')}</Label>
                           <FormControl>
                             <Input id="signup-password" type="password" {...field} disabled={isLoadingSignup || isLoadingGoogle} />
                            </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                       control={signupForm.control}
                       name="confirmPassword"
                       render={({ field }) => (
                         <FormItem>
                           <Label htmlFor="signup-confirm-password">{t('loginPage.confirmPasswordLabel')}</Label>
                           <FormControl>
                             <Input id="signup-confirm-password" type="password" {...field} disabled={isLoadingSignup || isLoadingGoogle} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                </CardContent>
                 <CardFooter className="flex-col space-y-4">
                   <Button type="submit" className="w-full" disabled={isLoadingSignup || isLoadingGoogle}>
                     {isLoadingSignup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {t('loginPage.signUpButton')}
                   </Button>
                    <div className="relative w-full">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">{t('loginPage.or')}</span>
                    </div>
                   <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoadingLogin || isLoadingGoogle || isLoadingSignup}>
                     {isLoadingGoogle ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                        <Chrome className="mr-2 h-4 w-4" /> // Using Chrome icon for Google
                     )}
                     {t('loginPage.googleSignUp')}
                   </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
