
// src/lib/firebase/firestore.ts
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { db } from './config';
import type { CvData } from '@/components/cv-forge/types';

// --- User Profile Types and Functions ---
export interface UserProfile {
  email: string;
  userType: 'creator' | 'recruiter';
  cvCode?: string;
}

// Function to save user profile data
export const saveUserProfile = async (userId: string, profileData: UserProfile): Promise<void> => {
  if (!userId) throw new Error("User ID is required to save user profile.");
  const userDocRef: DocumentReference<DocumentData> = doc(db, 'users', userId);
  try {
    console.log(`[saveUserProfile] Saving profile for userId: ${userId}, data:`, JSON.stringify(profileData));
    await setDoc(userDocRef, profileData, { merge: true });
    console.log(`[saveUserProfile] Profile saved successfully for userId: ${userId}`);
  } catch (error) {
    console.error("[saveUserProfile] Error saving user profile:", error);
    throw error;
  }
};

// Function to get user profile data
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) {
    console.warn("[getUserProfile] Called with no userId.");
    return null;
  }
  const userDocRef: DocumentReference<DocumentData> = doc(db, 'users', userId);
  try {
    console.log(`[getUserProfile] Attempting to fetch profile for userId: ${userId}`);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`[getUserProfile] Raw data for ${userId}:`, JSON.stringify(data));

      // Validate the structure of the fetched data
      if (data && typeof data.email === 'string' && (data.userType === 'creator' || data.userType === 'recruiter')) {
        if (data.userType === 'creator') {
          // For creators, cvCode can be a string or undefined/null.
          // If it exists, it must be a string.
          if (data.cvCode === undefined || data.cvCode === null || typeof data.cvCode === 'string') {
            console.log(`[getUserProfile] Valid creator profile for ${userId}. cvCode: ${data.cvCode}`);
            return data as UserProfile;
          } else {
            console.error(`[getUserProfile] Invalid cvCode type for creator ${userId}. Type: ${typeof data.cvCode}, Data:`, JSON.stringify(data));
            return null; // Data integrity issue
          }
        } else { // Recruiter
          // Recruiters should not have cvCode, or if it's there (e.g. old data), it's ignored by the cast.
          // The main check is that userType is 'recruiter'.
          console.log(`[getUserProfile] Valid recruiter profile for ${userId}.`);
          return data as UserProfile;
        }
      } else {
        console.error(`[getUserProfile] Invalid base data structure for user profile ${userId}. Data:`, JSON.stringify(data));
        return null; // Data integrity issue
      }
    } else {
      console.log(`[getUserProfile] No profile document found for user: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`[getUserProfile] Firebase error fetching profile for ${userId}:`, error);
    throw error; // Re-throw to be caught by the caller, allowing specific error handling there
  }
};

// Function to find a user by CV Code
export const findUserByCvCode = async (cvCode: string): Promise<{ userId: string; userProfile: UserProfile } | null> => {
  if (!cvCode) return null;
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where("cvCode", "==", cvCode), where("userType", "==", "creator"), limit(1));
  try {
    console.log(`[findUserByCvCode] Searching for CV code: ${cvCode}`);
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userProfile = userDoc.data() as UserProfile
      console.log(`[findUserByCvCode] Found user ${userDoc.id} with profile:`, JSON.stringify(userProfile));
      return { userId: userDoc.id, userProfile };
    } else {
      console.log("[findUserByCvCode] No creator user found with CV code:", cvCode);
      return null;
    }
  } catch (error) {
    console.error("[findUserByCvCode] Error finding user by CV code:", error);
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
      console.log("[getCvData] No CV data found for user:", userId);
      return null;
    }
  } catch (error) {
    console.error("[getCvData] Error fetching CV data:", error);
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
     console.error("[saveCvData] Error saving CV data:", error);
     throw error;
   }
};
