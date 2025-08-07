import { adminDb } from '@/lib/firebase/admin'
import { adminAuth } from '@/lib/firebase/admin'
import { User, CreateUserData, UpdateUserData, UserSubscription, PLAN_LIMITS } from '@/lib/types/user'
import { auth } from '@clerk/nextjs/server'
import { Timestamp } from 'firebase-admin/firestore'

export class UserService {
  private static instance: UserService
  private readonly usersCollection = adminDb.collection('users')

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const now = new Date()
      const planLimits = PLAN_LIMITS.free
      
      // Validate required fields
      if (!userData.clerkId || !userData.email) {
        const error = new Error('Missing required user data')
        throw error
      }

      // Check if user already exists
      const existingUser = await this.getUserById(userData.clerkId)
      if (existingUser) {
        return existingUser
      }

      // Attempt to create or update Firebase Authentication user
      try {
        await adminAuth.createUser({
          uid: userData.clerkId,
          email: userData.email,
          displayName: userData.name || '',
          photoURL: userData.image
        })
      } catch (authError) {
        // If user already exists, continue silently
      }

      // Set custom claims for additional user metadata
      try {
        await adminAuth.setCustomUserClaims(userData.clerkId, {
          plan: 'free',
          source: 'clerk'
        })
      } catch (claimsError) {
        // Continue silently if claims setting fails
      }

      const user: User = {
        id: userData.clerkId,
        clerkId: userData.clerkId,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        createdAt: now,
        updatedAt: now,
        subscription: {
          id: `sub_${userData.clerkId}`,
          plan: 'free',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelAtPeriodEnd: false,
          dailyLimit: planLimits.dailyMessages,
          monthlyLimit: planLimits.monthlyMessages,
        },
        bots: [], // Start with no bots
      }

      // Create user document in Firestore
      try {
        // Create a copy of the user object, converting dates to Firestore Timestamps
        const firestoreUser = {
          ...user,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
          subscription: {
            ...user.subscription,
            currentPeriodStart: Timestamp.fromDate(user.subscription.currentPeriodStart),
            currentPeriodEnd: Timestamp.fromDate(user.subscription.currentPeriodEnd),
          },
          activeBotId: null, // Explicitly set to null
        }

        await this.usersCollection.doc(userData.clerkId).set(firestoreUser, { merge: true })
        
        console.log(`UserService: User created/updated successfully`, { 
          clerkId: userData.clerkId, 
          email: userData.email 
        })
      } catch (firestoreError) {
        console.error('UserService: Firestore user document creation failed', { 
          error: firestoreError instanceof Error ? firestoreError.message : 'Unknown error',
          userData 
        })
        throw firestoreError
      }

      return user
    } catch (error) {
      console.error('UserService: Error creating user', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userData 
      })
      throw error
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const doc = await this.usersCollection.doc(userId).get()
      
      if (!doc.exists) {
        return null
      }

      const data = doc.data()

      if (!data) {
        return null
      }

      const user = {
        id: doc.id,
        ...data,
        // Handle createdAt and updatedAt as Timestamp or Date objects
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : (typeof data.createdAt === 'string' 
            ? new Date(data.createdAt) 
            : new Date()),
        updatedAt: data.updatedAt instanceof Timestamp 
          ? data.updatedAt.toDate() 
          : (typeof data.updatedAt === 'string' 
            ? new Date(data.updatedAt) 
            : new Date()),
        
        // Handle subscription timestamps
        subscription: data.subscription ? {
          ...data.subscription,
          currentPeriodStart: data.subscription.currentPeriodStart instanceof Timestamp
            ? data.subscription.currentPeriodStart.toDate()
            : (typeof data.subscription.currentPeriodStart === 'string'
              ? new Date(data.subscription.currentPeriodStart)
              : new Date()),
          currentPeriodEnd: data.subscription.currentPeriodEnd instanceof Timestamp
            ? data.subscription.currentPeriodEnd.toDate()
            : (typeof data.subscription.currentPeriodEnd === 'string'
              ? new Date(data.subscription.currentPeriodEnd)
              : new Date()),
        } : {
          id: `sub_${userId}`,
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          dailyLimit: PLAN_LIMITS.free.dailyMessages,
          monthlyLimit: PLAN_LIMITS.free.monthlyMessages,
        },
        bots: data.bots || [],
        activeBotId: data.activeBotId || null,
      } as User
      
      return user
    } catch (error) {
      console.error('Error getting user:', error)
      throw error
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const snapshot = await this.usersCollection.where('email', '==', email).limit(1).get()
      if (snapshot.empty) {
        return null
      }

      const doc = snapshot.docs[0]
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      } as User
    } catch (error) {
      console.error('Error getting user by email:', error)
      throw error
    }
  }

  async updateUser(userId: string, updateData: UpdateUserData): Promise<User | null> {
    try {
      const updateDoc = {
        ...updateData,
        updatedAt: new Date(),
      }

      await this.usersCollection.doc(userId).update(updateDoc)
      return this.getUserById(userId)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async updateUserSubscription(userId: string, subscriptionUpdate: Partial<UserSubscription>): Promise<User | null> {
    try {
      // Get current user to merge subscription data
      const currentUser = await this.getUserById(userId)
      if (!currentUser) {
        throw new Error('User not found')
      }

      // Merge with existing subscription
      const updatedSubscription = {
        ...currentUser.subscription,
        ...subscriptionUpdate,
      }

      await this.usersCollection.doc(userId).update({
        subscription: updatedSubscription,
        updatedAt: new Date(),
      })
      
      return this.getUserById(userId)
    } catch (error) {
      console.error('Error updating user subscription:', error)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete from Firestore
      await this.usersCollection.doc(userId).delete()
      
      // Note: Clerk handles user deletion on their end
      // We only need to clean up our Firestore data
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { userId } = await auth()
      if (!userId) return null
      
      return await this.getUserById(userId)
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }
} 