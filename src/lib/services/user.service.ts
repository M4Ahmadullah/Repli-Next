import { adminDb } from '@/lib/firebase/admin'
import { User, CreateUserData, UpdateUserData, UserSubscription, PLAN_LIMITS } from '@/lib/types/user'
import { auth } from '@clerk/nextjs/server'

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
        activeBotId: undefined,
      }

      await this.usersCollection.doc(userData.clerkId).set({
        ...user,
        createdAt: now,
        updatedAt: now,
      })

      return user
    } catch (error) {
      console.error('Error creating user:', error)
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
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
        subscription: data?.subscription ? {
          ...data.subscription,
          currentPeriodStart: data.subscription.currentPeriodStart?.toDate(),
          currentPeriodEnd: data.subscription.currentPeriodEnd?.toDate(),
        } : undefined,
      } as User
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