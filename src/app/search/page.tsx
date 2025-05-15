
// src/app/search/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, findUserByEmail, getCvData } from '@/lib/firebase/firestore';
import type { CvData } from '@/components/cv-forge/types';
import { CVPreview } from '@/components/cv-forge/CVPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Search, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Define handleLogout outside the component to ensure stable reference
const performLogout = async (authInstance: typeof auth, toastFn: ReturnType<typeof useToast>['toast'], tFn: ReturnType<typeof useTranslation>['t']) => {
  try {
    await signOut(authInstance);
    toastFn({ title: tFn('loginPage.loggedOut'), description: tFn('loginPage.loggedOutDesc') });
    // AuthProvider will handle redirecting
  } catch (error) {
    console.error('Logout failed:', error);
    toastFn({
      title: tFn('loginPage.logoutFailed'),
      description: tFn('loginPage.logoutFailedDesc'),
      variant: 'destructive',
    });
  }
};

export default function RecruiterSearchPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [localLoading, setLocalLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const [isRecruiter, setIsRecruiter] = useState(false);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchedCvData, setSearchedCvData] = useState<CvData | null | undefined>(undefined); // undefined: not searched, null: not found, CvData: found
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');


  // useCallback for stable function references for dependencies
  const stableRouterPush = useCallback((path: string) => router.push(path), [router]);
  const stableToast = useCallback(toast, []); 
  const stableT = useCallback(t, [t]);


  useEffect(() => {
    if (authLoading) {
      setLocalLoading(true);
      setProfileChecked(false); 
      setIsRecruiter(false);   
      return;
    }

    if (!currentUser) {
      stableRouterPush('/login');
      setLocalLoading(false); 
      return;
    }

    if (!profileChecked) {
      setLocalLoading(true); 
      getUserProfile(currentUser.uid)
        .then((profile) => {
          if (profile && profile.userType === 'recruiter') {
            setIsRecruiter(true);
          } else {
            setIsRecruiter(false);
            stableToast({
              title: stableT('searchPage.accessDenied'),
              description: stableT('searchPage.mustBeRecruiter'),
              variant: 'destructive',
            });
            stableRouterPush('/');
          }
        })
        .catch((error) => {
          console.error("Error fetching user profile for search page:", error);
          setIsRecruiter(false);
          stableToast({
            title: stableT('cvForge.errorSaving'), // Consider a more generic error message here
            description: stableT('loginPage.signUpFailedDesc'), // Or a specific one for profile load failure
            variant: 'destructive',
          });
          stableRouterPush('/');
        })
        .finally(() => {
          setProfileChecked(true);
          setLocalLoading(false);
        });
    } else {
      if (localLoading) { 
        setLocalLoading(false);
      }
    }
  }, [currentUser, authLoading, profileChecked, stableRouterPush, stableToast, stableT, localLoading]);


  const handleLogoutClick = useCallback(() => {
    performLogout(auth, toast, t);
  }, [toast, t]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchEmail.trim()) {
      setSearchMessage(t('searchPage.enterEmailPrompt'));
      setSearchedCvData(undefined);
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(searchEmail)) {
        setSearchMessage(t('searchPage.invalidEmail'));
        setSearchedCvData(undefined);
        toast({ title: t('searchPage.invalidEmail'), variant: 'destructive' });
        return;
    }

    setIsSearching(true);
    setSearchedCvData(undefined);
    setSearchMessage('');

    try {
      const userFound = await findUserByEmail(searchEmail);
      if (userFound && userFound.userId) {
        const cvData = await getCvData(userFound.userId);
        if (cvData) {
          setSearchedCvData(cvData);
          setSearchMessage(''); // Clear message on success
        } else {
          setSearchedCvData(null);
          setSearchMessage(t('searchPage.cvNotFound'));
        }
      } else {
        setSearchedCvData(null);
        setSearchMessage(t('searchPage.emailNotFound'));
      }
    } catch (error) {
      console.error("Error during CV search:", error);
      setSearchedCvData(null);
      setSearchMessage(t('cvForge.errorSavingDesc')); // Generic error
      toast({ title: t('cvForge.errorSaving'), description: t('cvForge.errorSavingDesc'), variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };


  if (localLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-12 w-full max-w-md mb-6" />
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  if (!isRecruiter) {
    return <div className="flex justify-center items-center min-h-screen">{t('searchPage.accessDenied')}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <header className="bg-background shadow-md print:hidden">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">{t('searchPage.title')}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button onClick={handleLogoutClick} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> {t('cvForge.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('searchPage.searchCVsTitle')}</CardTitle>
            <CardDescription>{t('searchPage.searchCVsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="w-full sm:flex-grow">
                <Label htmlFor="search-email" className="mb-1 block">{t('searchPage.searchByEmailLabel')}</Label>
                <Input
                  id="search-email"
                  type="email"
                  placeholder={t('searchPage.searchByEmailPlaceholder')}
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  disabled={isSearching}
                />
              </div>
              <Button type="submit" disabled={isSearching} className="w-full sm:w-auto">
                {isSearching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {t('searchPage.searchButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isSearching && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">{t('searchPage.searching')}</p>
          </div>
        )}

        {!isSearching && searchMessage && (
          <div className="text-center py-10 text-muted-foreground">
            {searchMessage}
          </div>
        )}

        {!isSearching && searchedCvData === undefined && !searchMessage && (
             <div className="text-center py-10 text-muted-foreground">
                {t('searchPage.enterEmailPrompt')}
             </div>
        )}


        {!isSearching && searchedCvData && (
          <Card>
            <CardHeader>
              <CardTitle>{t('searchPage.cvResultTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CVPreview data={searchedCvData} showFinalButton={false} />
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="bg-background text-center p-4 text-sm text-muted-foreground print:hidden">
        © {new Date().getFullYear()} CVForge. {t('searchPage.footerRights')}
      </footer>
    </div>
  );
}
