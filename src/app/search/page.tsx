
// src/app/search/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/firebase/firestore'; // Import getUserProfile
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecruiterSearchPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);

  useEffect(() => {
    if (authLoading) {
      setIsLoadingProfile(true); // Keep loading screen while auth is resolving
      return;
    }

    if (!currentUser) {
      router.push('/login');
      return; // Stop further execution if no user
    }

    // currentUser exists and authLoading is false
    const checkProfile = async () => {
      setIsLoadingProfile(true); // Explicitly set loading for this async operation
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (profile && profile.userType === 'recruiter') {
          // User is a recruiter, allow access.
          // isLoadingProfile will be set to false in finally.
        } else {
          // Not a recruiter, or profile doesn't exist/specify type
          toast({
            title: t('searchPage.accessDenied'),
            description: profile ? t('searchPage.mustBeRecruiter') : "User profile not found or user is not a recruiter.",
            variant: 'destructive'
          });
          router.push('/'); // Redirect
        }
      } catch (error) {
        console.error("Error fetching user profile for search page:", error);
        toast({ title: "Error", description: "Failed to verify your user role.", variant: 'destructive' });
        router.push('/'); // Redirect on error
      } finally {
        setIsLoadingProfile(false); // Ensure loading state is always updated
      }
    };

    checkProfile();

  }, [currentUser, authLoading, router, toast, t]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
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

  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-12 w-full max-w-md mb-6" />
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the useEffect redirecting before this point,
    // or by the loading screen if currentUser is null during auth check.
    return <div className="flex justify-center items-center min-h-screen">{t('cvForge.redirectingLogin')}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <header className="bg-background shadow-md print:hidden">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">{t('searchPage.title')}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button onClick={handleLogout} variant="outline" size="sm">
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
          {/* Placeholder for search functionality */}
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
