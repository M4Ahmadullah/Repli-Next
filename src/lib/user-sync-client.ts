// Client-side user synchronization utility
export const syncUserToBotSystem = async (clerkUserId: string) => {
  try {
    console.log('🔍 [DEBUG] Syncing user to bot system:', clerkUserId);
    
    const syncResponse = await fetch('/api/bot/sync-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessProfile: {},
        botSettings: {}
      })
    });

    if (!syncResponse.ok) {
      console.error('❌ [DEBUG] Failed to sync user to bot system');
      return false;
    }

    console.log('✅ [DEBUG] User synced to bot system successfully');
    return true;
  } catch (error) {
    console.error('❌ [DEBUG] Error syncing user to bot system:', error);
    return false;
  }
};

export const getFirebaseCustomToken = async (clerkUserId: string): Promise<string | null> => {
  try {
    console.log('🔍 [DEBUG] Getting Firebase custom token for user:', clerkUserId);
    
    const tokenResponse = await fetch(`/api/auth/firebase-token?userId=${clerkUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!tokenResponse.ok) {
      console.error('❌ [DEBUG] Failed to get Firebase custom token');
      return null;
    }

    const { token } = await tokenResponse.json();
    console.log('✅ [DEBUG] Firebase custom token retrieved successfully');
    return token;
  } catch (error) {
    console.error('❌ [DEBUG] Error getting Firebase custom token:', error);
    return null;
  }
}; 