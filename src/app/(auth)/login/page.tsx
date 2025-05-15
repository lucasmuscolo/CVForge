
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
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { saveUserProfile, getUserProfile } from '@/lib/firebase/firestore'; // Import getUserProfile
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Chrome } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';


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
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
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
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      toast({ title: t('loginPage.loginSuccess'), description: t('loginPage.loginSuccessDesc') });

      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile && profile.userType === 'recruiter') {
          router.push('/search');
        } else {
          router.push('/');
        }
      } else {
        // Fallback, should not happen if signInWithEmailAndPassword was successful
        router.push('/');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = t('loginPage.loginFailedDesc');
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = t('loginPage.invalidCredentials');
      }
      toast({
        title: t('loginPage.loginFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
     setIsLoadingSignup(true);
     try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        if (user) {
            await saveUserProfile(user.uid, { email: user.email!, userType: values.userType });
            toast({ title: t('loginPage.signUpSuccess'), description: t('loginPage.signUpSuccessDesc') });
            if (values.userType === 'recruiter') {
                router.push('/search');
            } else {
                router.push('/');
            }
        } else {
            throw new Error("User creation failed silently.");
        }
     } catch (error: any) {
        let errorTitle = t('loginPage.signUpFailed');
        let errorMessage = t('loginPage.signUpFailedDesc');

        if (error.code === 'auth/email-already-in-use') {
          console.error('Signup failed: Email already in use.', error.message);
          errorMessage = t('loginPage.emailAlreadyInUseDesc');
        } else if (error.code === 'auth/weak-password') {
          console.error('Signup failed: Weak password.', error.message);
          errorMessage = t('loginPage.weakPasswordDesc');
        } else {
          console.error('Signup failed: An unexpected error occurred.', error);
        }

        toast({
            title: errorTitle,
            description: errorMessage,
            variant: 'destructive',
        });
     } finally {
        setIsLoadingSignup(false);
     }
   };

   const handleGoogleSignIn = async () => {
       setIsLoadingGoogle(true);
       const provider = new GoogleAuthProvider();
       try {
           const result = await signInWithPopup(auth, provider);
           const user = result.user;
           if (user) {
               let userProfile = await getUserProfile(user.uid);
               if (!userProfile) {
                   // New user or profile doesn't exist, create one defaulting to 'creator'
                   await saveUserProfile(user.uid, { email: user.email!, userType: 'creator' });
                   userProfile = { email: user.email!, userType: 'creator' }; // Update local variable for redirection
               }
               toast({ title: t('loginPage.googleSignInSuccess'), description: t('loginPage.googleSignInSuccessDesc') });
               if (userProfile && userProfile.userType === 'recruiter') {
                   router.push('/search');
               } else {
                   router.push('/');
               }
           } else {
                // Fallback, should ideally not be reached if signInWithPopup is successful
                router.push('/');
           }
       } catch (error: any) {
           console.error('Google Sign-In failed:', error);
           let errorMessage = t('loginPage.googleSignInFailedDesc');
           if (error.code === 'auth/popup-closed-by-user') {
                 errorMessage = t('loginPage.signInCancelledDesc');
                 toast({
                    title: t('loginPage.signInCancelled'),
                    description: errorMessage,
                    variant: 'default',
                 });
           } else if (error.code === 'auth/account-exists-with-different-credential') {
               errorMessage = t('loginPage.googleAccountExists');
               toast({
                   title: t('loginPage.googleSignInFailed'),
                   description: errorMessage,
                   variant: 'destructive',
               });
           }
           else {
               toast({
                   title: t('loginPage.googleSignInFailed'),
                   description: errorMessage,
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
                              <Input id="login-password" type="password" placeholder={t('loginPage.passwordPlaceholder')} {...field} disabled={isLoadingLogin || isLoadingGoogle} />
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
                        <Chrome className="mr-2 h-4 w-4" />
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
                             <Input id="signup-password" type="password" placeholder={t('loginPage.passwordPlaceholder')} {...field} disabled={isLoadingSignup || isLoadingGoogle} />
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
                             <Input id="signup-confirm-password" type="password" placeholder={t('loginPage.passwordPlaceholder')} {...field} disabled={isLoadingSignup || isLoadingGoogle} />
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
                                        disabled={isLoadingSignup || isLoadingGoogle}
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
                        <Chrome className="mr-2 h-4 w-4" />
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

