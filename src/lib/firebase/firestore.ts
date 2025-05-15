
// src/lib/firebase/firestore.ts
import { doc, getDoc, setDoc, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { db } from './config';
import type { CvData } from '@/components/cv-forge/types';

// --- User Profile Types and Functions ---
export interface UserProfile {
  email: string;
  userType: 'creator' | 'recruiter';
  // Add other profile fields here if needed in the future
}

// Function to save user profile data
export const saveUserProfile = async (userId: string, profileData: UserProfile): Promise<void> => {
  if (!userId) throw new Error("User ID is required to save user profile.");
  const userDocRef: DocumentReference<DocumentData> = doc(db, 'users', userId);
  try {
    await setDoc(userDocRef, profileData, { merge: true }); // Use merge to avoid overwriting other fields if any
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

// Function to get user profile data
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  const userDocRef: DocumentReference<DocumentData> = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      console.log("No user profile found for user:", userId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};


// --- CV Data Functions ---

// Function to get CV data for a specific user
export const getCvData = async (userId: string): Promise<CvData | null> => {
  if (!userId) return null;
  const docRef: DocumentReference<DocumentData> = doc(db, 'cvs', userId);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CvData;
    } else {
      console.log("No CV data found for user:", userId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching CV data:", error);
    throw error;
  }
};

// Function to save CV data for a specific user
export const saveCvData = async (userId: string, data: CvData): Promise<void> => {
   if (!userId) throw new Error("User ID is required to save CV data.");
   const docRef: DocumentReference<DocumentData> = doc(db, 'cvs', userId);
   try {
     await setDoc(docRef, data);
   } catch (error) {
     console.error("Error saving CV data:", error);
     throw error;
   }
};
