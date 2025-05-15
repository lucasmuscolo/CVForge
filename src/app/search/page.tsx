
// src/app/search/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Skeleton } from '@/components/ui/skeleton';

// Define handleLogout outside the component to ensure stable reference
const performLogout = async (authInstance: typeof auth, toast: ReturnType<typeof useToast>['toast'], t: ReturnType<typeof useTranslation>['t']) => {
  try {
    await signOut(authInstance);
    toast({ title: t('loginPage.loggedOut'), description: t('loginPage.loggedOutDesc') });
    // AuthProvider will handle redirecting
  } catch (error) {
    console.error('Logout failed:', error);
    toast({
      title: t('loginPage.logoutFailed'),
      description: t('loginPage.logoutFailedDesc'),
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

  // useCallback for stable function references for dependencies
  const stableRouterPush = useCallback((path: string) => router.push(path), [router]);
  const stableToast = useCallback(toast, [toast]); // Assuming toast itself is stable or useToast provides stable functions
  const stableT = useCallback(t, [t]); // Assuming t itself is stable


  useEffect(() => {
    if (authLoading) {
      setLocalLoading(true);
      setProfileChecked(false); // Reset profile check if auth state changes
      setIsRecruiter(false);   // Reset recruiter status
      return;
    }

    if (!currentUser) {
      stableRouterPush('/login');
      setLocalLoading(false); // Stop loading as we are redirecting
      return;
    }

    // CurrentUser exists and auth is done
    if (!profileChecked) {
      setLocalLoading(true); // Start loading for profile check
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
            title: stableT('cvForge.errorSaving'),
            description: stableT('loginPage.signUpFailedDesc'),
            variant: 'destructive',
          });
          stableRouterPush('/');
        })
        .finally(() => {
          setProfileChecked(true);
          setLocalLoading(false);
        });
    } else {
      // Profile has been checked, localLoading should be false if not already.
      // This handles cases where effect might re-run with profileChecked = true.
      if (localLoading) { // only update if necessary
        setLocalLoading(false);
      }
    }
  }, [currentUser, authLoading, profileChecked, stableRouterPush, stableToast, stableT, localLoading]);


  const handleLogoutClick = useCallback(() => {
    performLogout(auth, toast, t);
  }, [toast, t]);


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

  // After loading, if user is not a recruiter (and profile has been checked),
  // they should have been redirected. This is a fallback.
  if (!isRecruiter) {
    // This content might show briefly if redirection from useEffect is asynchronous.
    // Or if the user somehow lands here when they shouldn't.
    return <div className="flex justify-center items-center min-h-screen">{t('searchPage.accessDenied')}</div>;
  }

  // If we reach here: user is authenticated, profile checked, is a recruiter, and not loading.
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
        <div className="bg-background p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">{t('searchPage.welcome')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('searchPage.description')}
          </p>
          <div className="border-2 border-dashed border-border rounded-lg p-10 text-center">
            <p className="text-muted-foreground">{t('searchPage.searchPlaceholder')}</p>
          </div>
        </div>
      </main>

      <footer className="bg-background text-center p-4 text-sm text-muted-foreground print:hidden">
        © {new Date().getFullYear()} CVForge. {t('searchPage.footerRights')}
      </footer>
    </div>
  );
}
