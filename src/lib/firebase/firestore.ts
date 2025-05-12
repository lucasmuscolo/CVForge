// src/lib/firebase/firestore.ts
import { doc, getDoc, setDoc, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { db } from './config';
import type { CvData } from '@/components/cv-forge/types';

// Function to get CV data for a specific user
export const getCvData = async (userId: string): Promise<CvData | null> => {
  if (!userId) return null;
  const docRef: DocumentReference<DocumentData> = doc(db, 'cvs', userId);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // Basic validation can be added here if needed
      return docSnap.data() as CvData;
    } else {
      console.log("No CV data found for user:", userId);
      return null; // Return null if no document exists
    }
  } catch (error) {
    console.error("Error fetching CV data:", error);
    throw error; // Re-throw the error for the caller to handle
  }
};

// Function to save CV data for a specific user
export const saveCvData = async (userId: string, data: CvData): Promise<void> => {
   if (!userId) throw new Error("User ID is required to save data.");
   const docRef: DocumentReference<DocumentData> = doc(db, 'cvs', userId);
   try {
     // Use setDoc with merge: true if you want to merge data instead of overwriting
     // await setDoc(docRef, data, { merge: true });
     await setDoc(docRef, data); // Overwrites the document with new data
   } catch (error) {
     console.error("Error saving CV data:", error);
     throw error; // Re-throw the error for the caller to handle
   }
};
