
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider
import { LanguageProvider } from '@/context/LanguageContext'; // Import LanguageProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CVForge - Build Your Professional CV', // Updated title
  description: 'Create, manage, and enhance your CV with CVForge.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
         <AuthProvider> {/* Wrap children with AuthProvider */}
           <LanguageProvider> {/* Wrap with LanguageProvider */}
              {children}
              <Toaster /> {/* Add Toaster here */}
           </LanguageProvider>
         </AuthProvider>
      </body>
    </html>
  );
}

  