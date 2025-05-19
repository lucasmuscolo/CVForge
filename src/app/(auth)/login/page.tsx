
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
    sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { saveUserProfile, getUserProfile } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { generateCvCode } from '@/lib/utils';


const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const signupSchema = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    userType: z.enum(['creator', 'recruiter'], { required_error: "Please select a user type." }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function LoginPage() {
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormValues>({
      resolver: zodResolver(signupSchema),
      defaultValues: { email: '', password: '', confirmPassword: '', userType: undefined },
  });


  const handleLogin = async (values: LoginFormValues) => {
    setIsLoadingLogin(true);
    console.log('[Login] Attempting login for email:', values.email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      console.log('[Login] signInWithEmailAndPassword successful for UID:', user.uid, 'Email verified:', user.emailVerified);

      if (!user.emailVerified) {
          console.log('[Login] User email not verified:', user.uid);
          toast({
              title: t('loginPage.emailNotVerifiedTitle'),
              description: t('loginPage.loginNeedsVerification'),
              variant: 'default',
              duration: 9000,
          });
      } else {
          toast({ title: t('loginPage.loginSuccess'), description: t('loginPage.loginSuccessDesc') });
      }
      
      console.log('[Login] Fetching profile for UID:', user.uid);
      const profile = await getUserProfile(user.uid);
      console.log('[Login] Profile fetched:', profile);
      if (profile && profile.userType === 'recruiter') {
        console.log('[Login] User is recruiter, redirecting to /search');
        router.push('/search');
      } else {
        console.log('[Login] User is creator or profile not found/default, redirecting to /cv-editor');
        router.push('/cv-editor');
      }
    } catch (error: any) {
      console.error('[Login] Login failed. Email:', values.email, 'Error:', error, 'Error code:', error.code);
      let errorMessage = t('loginPage.loginFailedDesc');
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = t('loginPage.invalidCredentials');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('loginPage.tooManyRequests');
      }
      toast({
        title: t('loginPage.loginFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogin(false);
      console.log('[Login] Login attempt finished for email:', values.email);
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
     setIsLoadingSignup(true);
     console.log('[Signup] Attempting signup for email:', values.email, 'User type:', values.userType);
     try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        console.log('[Signup] createUserWithEmailAndPassword successful for UID:', user.uid);
        
        if (user) {
            console.log('[Signup] Sending email verification for UID:', user.uid);
            await sendEmailVerification(user);
            console.log('[Signup] Email verification sent for UID:', user.uid);

            const cvCode = values.userType === 'creator' ? generateCvCode() : undefined;
            const userProfileData = { email: user.email!, userType: values.userType, ...(cvCode && { cvCode }) };
            
            console.log('[Signup] Attempting to save profile for UID:', user.uid, 'Data:', userProfileData);
            await saveUserProfile(user.uid, userProfileData);
            console.log('[Signup] Profile saved successfully for UID:', user.uid);

            toast({ title: t('loginPage.signUpSuccess'), description: t('loginPage.signUpSuccessWithVerificationDesc') });
            
            if (values.userType === 'recruiter') {
                console.log('[Signup] User is recruiter, redirecting to /search (pending verification)');
                router.push('/search');
            } else {
                console.log('[Signup] User is creator, redirecting to /cv-editor (pending verification)');
                router.push('/cv-editor');
            }
        } else {
            console.error('[Signup] User object was null after successful userCredential. UID:', userCredential.user?.uid);
            throw new Error("User creation failed silently post-credential generation.");
        }
     } catch (error: any)
      {
        let errorTitle = t('loginPage.signUpFailed');
        let errorMessage = t('loginPage.signUpFailedDesc');

        if (error.code === 'auth/email-already-in-use') {
          console.error('[Signup] Signup failed: Email already in use.', error.message, 'Email:', values.email);
          errorMessage = t('loginPage.emailAlreadyInUseDesc');
        } else if (error.code === 'auth/weak-password') {
          console.error('[Signup] Signup failed: Weak password.', error.message, 'Email:', values.email);
          errorMessage = t('loginPage.weakPasswordDesc');
        } else {
          console.error('[Signup] Signup failed: An unexpected error occurred.', error, 'Error code:', error.code, 'Email:', values.email);
        }

        toast({
            title: errorTitle,
            description: errorMessage,
            variant: 'destructive',
        });
     } finally {
        setIsLoadingSignup(false);
        console.log('[Signup] Signup attempt finished for email:', values.email);
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
                             <Input id="login-email" type="email" placeholder={t('loginPage.emailPlaceholder')} {...field} disabled={isLoadingLogin} />
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
                              <Input id="login-password" type="password" placeholder={t('loginPage.passwordPlaceholder')} {...field} disabled={isLoadingLogin} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                <CardFooter className="flex-col space-y-4">
                   <Button type="submit" className="w-full" disabled={isLoadingLogin}>
                     {isLoadingLogin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {t('loginPage.loginButton')}
                   </Button>
                   {/* Google Sign-In button removed
                   <div className="relative w-full">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">{t('loginPage.or')}</span>
                    </div>
                   <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoadingLogin || isLoadingGoogle || isLoadingSignup}>
                     {isLoadingGoogle ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                        <Chrome className="mr-2 h-4 w-4" />
                     )}
                     {t('loginPage.googleSignIn')}
                   </Button>
                   */}
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
                                <Input id="signup-email" type="email" placeholder={t('loginPage.emailPlaceholder')} {...field} disabled={isLoadingSignup} />
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
                             <Input id="signup-password" type="password" placeholder={t('loginPage.passwordPlaceholder')} {...field} disabled={isLoadingSignup} />
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
                             <Input id="signup-confirm-password" type="password" placeholder={t('loginPage.passwordPlaceholder')} {...field} disabled={isLoadingSignup} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                    <FormField
                        control={signupForm.control}
                        name="userType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>{t('loginPage.userTypeLabel')}</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                        disabled={isLoadingSignup}
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="creator" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                {t('loginPage.userTypeCreator')}
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="recruiter" />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                {t('loginPage.userTypeRecruiter')}
                                            </FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                 <CardFooter className="flex-col space-y-4">
                   <Button type="submit" className="w-full" disabled={isLoadingSignup}>
                     {isLoadingSignup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {t('loginPage.signUpButton')}
                   </Button>
                   {/* Google Sign-Up button removed
                    <div className="relative w-full">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">{t('loginPage.or')}</span>
                    </div>
                   <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoadingLogin || isLoadingGoogle || isLoadingSignup}>
                     {isLoadingGoogle ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                        <Chrome className="mr-2 h-4 w-4" />
                     )}
                     {t('loginPage.googleSignUp')}
                   </Button>
                  */}
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    