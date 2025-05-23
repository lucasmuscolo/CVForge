
// src/app/search/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, findUserByCvCode, getCvData } from '@/lib/firebase/firestore';
import type { CvData } from '@/components/cv-forge/types';
import { CVPreview } from '@/components/cv-forge/CVPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Search, Loader2, AlertTriangle, Download, Printer } from 'lucide-react'; 
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cvDataToMarkdown } from '@/lib/utils';

const performLogout = async (authInstance: typeof auth, toastFn: ReturnType<typeof useToast>['toast'], tFn: ReturnType<typeof useTranslation>['t']) => {
  try {
    await signOut(authInstance);
    toastFn({ title: tFn('loginPage.loggedOut'), description: tFn('loginPage.loggedOutDesc') });
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
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [searchCvCode, setSearchCvCode] = useState('');
  const [searchedCvData, setSearchedCvData] = useState<CvData | null | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  const stableRouterPush = useCallback((path: string) => router.push(path), [router]);
  const stableToast = useCallback(toast, []);
  const stableT = useCallback(t, [t]);

  useEffect(() => {
    console.log('[SearchPage useEffect] Triggered. authLoading:', authLoading, 'currentUser:', !!currentUser, 'profileChecked:', profileChecked);

    if (authLoading) {
      console.log('[SearchPage useEffect] Auth loading, setting localLoading to true.');
      setLocalLoading(true);
      return;
    }

    if (!currentUser) {
      console.log('[SearchPage useEffect] No current user, redirecting to login.');
      stableRouterPush('/login');
      setLocalLoading(false);
      return;
    }

    setIsEmailVerified(currentUser.emailVerified);

    if (!profileChecked) {
      console.log('[SearchPage useEffect] Profile not checked, initiating check for UID:', currentUser.uid);
      setLocalLoading(true);
      getUserProfile(currentUser.uid)
        .then((profile) => {
          console.log('[SearchPage useEffect] getUserProfile response:', profile);
          if (profile && profile.userType === 'recruiter') {
            console.log('[SearchPage useEffect] User is recruiter.');
            setIsRecruiter(true);
          } else {
            console.log('[SearchPage useEffect] User is not recruiter or profile not found. Redirecting.');
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
          console.error("[SearchPage useEffect] Error fetching user profile:", error);
          setIsRecruiter(false);
          stableToast({
            title: stableT('cvForge.errorSaving'), 
            description: stableT('loginPage.signUpFailedDesc'), 
            variant: 'destructive',
          });
          stableRouterPush('/');
        })
        .finally(() => {
          console.log('[SearchPage useEffect] Profile check finished.');
          setProfileChecked(true);
          setLocalLoading(false);
        });
    } else {
      if (localLoading) {
          console.log('[SearchPage useEffect] Profile checked, but localLoading still true. Setting to false.');
          setLocalLoading(false);
      }
    }
  }, [currentUser, authLoading, profileChecked, stableRouterPush, stableToast, stableT, localLoading]); 


  const handleLogoutClick = useCallback(() => {
    performLogout(auth, toast, t);
    router.push('/login'); 
  }, [toast, t, router]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEmailVerified) {
        toast({ title: t('searchPage.emailNotVerifiedAlertTitle'), description: t('searchPage.verifyToSearch'), variant: "destructive" });
        return;
    }
    if (!searchCvCode.trim()) {
      setSearchMessage(t('searchPage.enterCvCodePrompt'));
      setSearchedCvData(undefined);
      return;
    }

    setIsSearching(true);
    setSearchedCvData(undefined);
    setSearchMessage('');

    try {
      const userFound = await findUserByCvCode(searchCvCode.trim());

      if (!userFound) {
        setSearchMessage(t('searchPage.cvCodeNotFound'));
        setSearchedCvData(null);
        setIsSearching(false);
        return;
      }

      const cvData = await getCvData(userFound.userId);
      setSearchedCvData(cvData);
      if (!cvData) {
        setSearchMessage(t('searchPage.cvDataNotFoundForUser'));
      } else {
        setSearchMessage('');
      }
    } catch (error) {
      console.error("Error during CV search:", error);
      setSearchedCvData(null);
      setSearchMessage(t('cvForge.searchErrorDesc'));
      toast({ title: t('cvForge.searchFailedTitle'), description: t('cvForge.searchErrorDesc'), variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!searchedCvData) {
      toast({ title: t('searchPage.noCvToDownload'), description: t('searchPage.searchFirstToDownload'), variant: "destructive" });
      return;
    }
    try {
      const markdown = cvDataToMarkdown(searchedCvData);
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileNameBase = searchedCvData.personalInfo?.name?.replace(/\s+/g, '_')?.toLowerCase() || 'cv';
      link.download = `${fileNameBase}_export.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: t('searchPage.downloadInitiated'), description: t('searchPage.markdownDownloaded') });
    } catch (error) {
      console.error("Error generating or downloading Markdown:", error);
      toast({ title: t('searchPage.downloadError'), description: t('searchPage.markdownDownloadErrorDesc'), variant: "destructive" });
    }
  };

  const handlePrint = () => {
      if (typeof window !== 'undefined') {
        window.print();
      }
  };


  if (localLoading) {
    console.log('[SearchPage render] localLoading is true, rendering Skeleton.');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-16 w-full max-w-lg mb-4" />
        <Skeleton className="h-12 w-full max-w-md mb-6" />
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  if (!isRecruiter) {
    console.log('[SearchPage render] Not a recruiter or profile not confirmed as recruiter, rendering access denied.');
    return <div className="flex justify-center items-center min-h-screen">{t('searchPage.accessDenied')}</div>;
  }

  console.log('[SearchPage render] Rendering recruiter search page content. Email Verified:', isEmailVerified);
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
        {!isEmailVerified && isRecruiter && (
             <Alert variant="default" className="mb-6 border-yellow-500 bg-yellow-50 text-yellow-700">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <AlertTitle className="font-semibold text-yellow-800">{t('searchPage.emailNotVerifiedAlertTitle')}</AlertTitle>
                <AlertDescription>
                    {t('searchPage.emailNotVerifiedAlertDescRecruiter')}
                </AlertDescription>
            </Alert>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('searchPage.searchCVsTitle')}</CardTitle>
            <CardDescription>{t('searchPage.searchCVsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="w-full sm:flex-grow">
                <Label htmlFor="search-cv-code" className="mb-1 block">{t('searchPage.searchByCvCodeLabel')}</Label>
                <Input
                  id="search-cv-code"
                  type="text"
                  placeholder={t('searchPage.searchByCvCodePlaceholder')}
                  value={searchCvCode}
                  onChange={(e) => setSearchCvCode(e.target.value)}
                  disabled={isSearching || !isEmailVerified}
                />
              </div>
              <Button type="submit" disabled={isSearching || !searchCvCode.trim() || !isEmailVerified} className="w-full sm:w-auto">
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

        {!isSearching && searchedCvData === undefined && !searchMessage && isEmailVerified && (
             <div className="text-center py-10 text-muted-foreground">
             </div>
        )}


        {!isSearching && searchedCvData && isEmailVerified && (
          <Card>
            <CardContent className="pt-6"> 
              <CVPreview 
                data={searchedCvData} 
                showFinalButton={false}
                enableContentTranslation={true} // Enable content translation here 
              />
              <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row justify-center items-center gap-4 print:hidden">
                <Button onClick={handleDownloadMarkdown} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {t('searchPage.downloadMarkdownButton')}
                </Button>
                <Button onClick={handlePrint} variant="default">
                  <Printer className="mr-2 h-4 w-4" />
                  {t('finalCvPage.print')}
                </Button>
              </div>
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
