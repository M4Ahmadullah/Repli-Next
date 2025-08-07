import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

export const createFirebaseTokenForUser = async (clerkUserId: string): Promise<string | null> => {
  try {
    console.log('🔍 [DEBUG] Creating Firebase token for Clerk user:', clerkUserId);
    
    // Client-side: Call the API route to get Firebase token
    const response = await fetch('/api/auth/firebase-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    console.log('📡 Firebase token API response:', data);

    if (!data.success) {
      console.error('❌ Firebase token API error:', data.error);
      throw new Error(data.error || 'Failed to get Firebase token');
    }

    if (!data.idToken) {
      console.error('❌ No idToken in response:', data);
      throw new Error('No idToken received from Firebase token API');
    }

    console.log('✅ Firebase ID token received successfully');
    return data.idToken;
  } catch (error) {
    console.error('❌ [DEBUG] Error creating Firebase token:', error);
    throw error;
  }
};

export const getCurrentFirebaseUser = (): User | null => {
  return auth.currentUser;
};

export const signOutFirebase = async (): Promise<void> => {
  try {
    await auth.signOut();
    console.log('✅ [DEBUG] Firebase user signed out');
  } catch (error) {
    console.error('❌ [DEBUG] Error signing out Firebase user:', error);
  }
}; 