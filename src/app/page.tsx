
// src/app/page.tsx (New Landing Page)
'use client'; 

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';
import { CheckCircle, Search, Edit3, FileText, Users, Cpu, Briefcase } from 'lucide-react'; 
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import React from 'react';


export default function LandingPage() {
  const { t } = useTranslation();
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (currentUser) {
        // If user is logged in, check their type and redirect
        // This requires getUserProfile to be accessible or user type to be on currentUser
        // For simplicity, this might be better handled by a redirect from /login if already logged in
        // Or fetch profile here:
        // getUserProfile(currentUser.uid).then(profile => { ... })
        // For now, just go to /login, which will then redirect appropriately
        router.push('/login');

    } else {
        router.push('/login');
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <header className="bg-background sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary flex items-center">
            <Briefcase className="h-7 w-7 mr-2 text-accent"/> {/* Logo Icon */}
            CVForge
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <Button asChild variant="default" size="sm">
              <Link href="/login">{currentUser ? t('landingPage.dashboardNav') : t('landingPage.navLoginSignup')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-blue-700 text-primary-foreground py-20 sm:py-28"> {/* Gradient Background */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-6 text-accent" /> {/* Larger Logo Icon */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-md">
              {t('landingPage.heroTitle')}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-blue-100">
              {t('landingPage.heroSubtitle')}
            </p>
            <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg transform hover:scale-105 transition-transform duration-150 ease-in-out px-10 py-3 text-lg"
            >
              {t('landingPage.heroCta')}
            </Button>
            <div className="mt-16 relative">
              <div className="absolute inset-0 bg-black opacity-10 rounded-lg transform skew-y-1"></div> {/* Shadow Effect */}
              <Image
                src="/CVForge-Logo.jpeg" 
                alt={t('landingPage.heroLogoAlt')}
                width={500}
                height={150}
                className="rounded-lg shadow-2xl mx-auto relative object-contain"
                priority
              />
            </div>
          </div>
        </section>

        {/* For Creators Section */}
        <section id="creators" className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                {t('landingPage.creatorsTitle')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('landingPage.creatorsSubtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-teal-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <Image
                  src="/captura-cv.png"
                  alt={t('landingPage.creatorsImageAlt')}
                  width={600}
                  height={400}
                  className="rounded-lg shadow-xl relative object-contain"
                />
              </div>
              <div className="space-y-8">
                {[
                  { icon: Edit3, textKey: 'landingPage.creatorBenefit1' },
                  { icon: Cpu, textKey: 'landingPage.creatorBenefit2' },
                  { icon: FileText, textKey: 'landingPage.creatorBenefit3' },
                  { icon: CheckCircle, textKey: 'landingPage.creatorBenefit4' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 bg-accent/10 p-3 rounded-full">
                        <item.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-primary mb-1">{t(`${item.textKey}Title`)}</h3>
                      <p className="text-muted-foreground">{t(`${item.textKey}Desc`)}</p>
                    </div>
                  </div>
                ))}
                <Button size="lg" asChild className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 text-base">
                  <Link href="/login">{t('landingPage.creatorsCta')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* For Recruiters Section */}
        <section id="recruiters" className="py-16 sm:py-24 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                {t('landingPage.recruitersTitle')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('landingPage.recruitersSubtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 md:order-last">
                 {[
                  { icon: Search, textKey: 'landingPage.recruiterBenefit1' },
                  { icon: Users, textKey: 'landingPage.recruiterBenefit2' },
                  { icon: CheckCircle, textKey: 'landingPage.recruiterBenefit3' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                        <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-primary mb-1">{t(`${item.textKey}Title`)}</h3>
                      <p className="text-muted-foreground">{t(`${item.textKey}Desc`)}</p>
                    </div>
                  </div>
                ))}
                <Button size="lg" asChild className="mt-8 px-8 py-3 text-base">
                  <Link href="/login">{t('landingPage.recruitersCta')}</Link>
                </Button>
              </div>
              <div className="md:order-first relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-700 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <Image
                  src="/captura-busqueda.png"
                  alt={t('landingPage.recruitersImageAlt')}
                  width={600}
                  height={450}
                  className="rounded-lg shadow-xl relative object-contain"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} CVForge. {t('landingPage.footerRights')}</p>
        </div>
      </footer>
    </div>
  );
}
