
// src/lib/firebase/firestore.ts
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit, type DocumentReference, type DocumentData, serverTimestamp, Timestamp, addDoc, orderBy } from 'firebase/firestore';
import { db } from './config';
import type { CvData } from '@/components/cv-forge/types';

// --- User Profile Types and Functions ---
export interface UserProfile {
  email: string;
  userType: 'creator' | 'recruiter';
  cvCode?: string;
}

// Function to save user profile data
export const saveUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
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

      if (data && typeof data.email === 'string' && (data.userType === 'creator' || data.userType === 'recruiter')) {
        if (data.userType === 'creator') {
          if (data.cvCode === undefined || data.cvCode === null || typeof data.cvCode === 'string') {
            console.log(`[getUserProfile] Valid creator profile for ${userId}. cvCode: ${data.cvCode}`);
            return data as UserProfile;
          } else {
            console.error(`[getUserProfile] Invalid cvCode type for creator ${userId}. Type: ${typeof data.cvCode}, Data:`, JSON.stringify(data));
            return null;
          }
        } else {
          console.log(`[getUserProfile] Valid recruiter profile for ${userId}.`);
          return data as UserProfile;
        }
      } else {
        console.error(`[getUserProfile] Invalid base data structure for user profile ${userId}. Data:`, JSON.stringify(data));
        return null;
      }
    } else {
      console.log(`[getUserProfile] No profile document found for user: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`[getUserProfile] Firebase error fetching profile for ${userId}:`, error);
    throw error;
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

// --- Recruiter Search History ---
export type SearchHistoryStatus = 'found' | 'cv_not_found' | 'user_not_found';

export interface SearchHistoryEntryData {
  searchedCvCode: string;
  cvOwnerName?: string;
  searchTimestamp: Timestamp; // Will be serverTimestamp on write
  status: SearchHistoryStatus;
}

export interface SearchHistoryEntry extends SearchHistoryEntryData {
  id: string;
}

export const addSearchHistoryEntry = async (recruiterId: string, entryData: Omit<SearchHistoryEntryData, 'searchTimestamp'>): Promise<void> => {
  if (!recruiterId) throw new Error("Recruiter ID is required to save search history.");
  const historyCollectionRef = collection(db, 'users', recruiterId, 'searchHistory');
  try {
    const dataToSave = {
      ...entryData,
      searchTimestamp: serverTimestamp(),
    };
    console.log(`[addSearchHistoryEntry] Saving history for recruiterId: ${recruiterId}, data:`, JSON.stringify(dataToSave));
    await addDoc(historyCollectionRef, dataToSave);
    console.log(`[addSearchHistoryEntry] History entry saved for recruiterId: ${recruiterId}`);
  } catch (error) {
    console.error("[addSearchHistoryEntry] Error saving search history entry:", error);
    throw error;
  }
};

export const getSearchHistory = async (recruiterId: string): Promise<SearchHistoryEntry[]> => {
  if (!recruiterId) {
    console.warn("[getSearchHistory] Called with no recruiterId.");
    return [];
  }
  const historyCollectionRef = collection(db, 'users', recruiterId, 'searchHistory');
  const q = query(historyCollectionRef, orderBy("searchTimestamp", "desc"), limit(50)); // Limit to 50 recent entries for now
  try {
    console.log(`[getSearchHistory] Fetching history for recruiterId: ${recruiterId}`);
    const querySnapshot = await getDocs(q);
    const historyEntries: SearchHistoryEntry[] = [];
    querySnapshot.forEach((doc) => {
      historyEntries.push({ id: doc.id, ...doc.data() } as SearchHistoryEntry);
    });
    console.log(`[getSearchHistory] Found ${historyEntries.length} history entries for recruiterId: ${recruiterId}`);
    return historyEntries;
  } catch (error) {
    console.error(`[getSearchHistory] Firebase error fetching history for recruiterId: ${recruiterId}:`, error);
    throw error;
  }
};
