import { BotApiClient } from '@/lib/api/bot-client'

interface SyncItem {
  userId: string
  settings: any
  timestamp: Date
}

interface SyncConflict {
  field: string
  localValue: any
  remoteValue: any
  resolution: 'local' | 'remote' | 'manual'
}

class SyncService {
  private syncQueue: SyncItem[] = []
  private isProcessing = false
  private retryAttempts = new Map<string, number>()
  private maxRetries = 3

  async addToSyncQueue(userId: string, settings: any): Promise<void> {
    const syncItem: SyncItem = {
      userId,
      settings,
      timestamp: new Date()
    }

    this.syncQueue.push(syncItem)
    console.log('🔍 [DEBUG] SyncService: Added to sync queue:', { userId, queueLength: this.syncQueue.length })

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processSyncQueue()
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return
    }

    this.isProcessing = true
    console.log('🔍 [DEBUG] SyncService: Starting queue processing, items:', this.syncQueue.length)

    while (this.syncQueue.length > 0) {
      const syncItem = this.syncQueue.shift()
      if (!syncItem) continue

      try {
        await this.syncUserSettings(syncItem)
        this.retryAttempts.delete(syncItem.userId)
        console.log('✅ [DEBUG] SyncService: Successfully synced user:', syncItem.userId)
      } catch (error) {
        console.error('❌ [DEBUG] SyncService: Failed to sync user:', syncItem.userId, error)
        
        const currentRetries = this.retryAttempts.get(syncItem.userId) || 0
        if (currentRetries < this.maxRetries) {
          this.retryAttempts.set(syncItem.userId, currentRetries + 1)
          this.syncQueue.push(syncItem) // Re-add to queue for retry
          console.log('🔄 [DEBUG] SyncService: Retrying sync for user:', syncItem.userId, 'attempt:', currentRetries + 1)
        } else {
          console.error('❌ [DEBUG] SyncService: Max retries reached for user:', syncItem.userId)
        }
      }
    }

    this.isProcessing = false
    console.log('✅ [DEBUG] SyncService: Queue processing completed')
  }

  private async syncUserSettings(syncItem: SyncItem): Promise<void> {
    console.log('🔍 [DEBUG] SyncService: Syncing settings for user:', syncItem.userId)

    // ✅ Create BotApiClient instance with clerkUserId
    const botApiClient = new BotApiClient(syncItem.userId);
    const response = await botApiClient.syncUserSettings(syncItem.userId, syncItem.settings)
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Sync failed')
    }

    console.log('✅ [DEBUG] SyncService: Settings synced successfully for user:', syncItem.userId)
  }

  async resolveConflicts(userId: string, conflicts: SyncConflict[]): Promise<void> {
    console.log('🔍 [DEBUG] SyncService: Resolving conflicts for user:', userId, 'conflicts:', conflicts.length)

    try {
      // ✅ Create BotApiClient instance with clerkUserId
      const botApiClient = new BotApiClient(userId);
      const response = await botApiClient.resolveSettingsConflicts(userId, conflicts)
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Conflict resolution failed')
      }

      console.log('✅ [DEBUG] SyncService: Conflicts resolved successfully for user:', userId)
    } catch (error) {
      console.error('❌ [DEBUG] SyncService: Failed to resolve conflicts for user:', userId, error)
      throw error
    }
  }

  async getSyncStatus(userId: string): Promise<any> {
    console.log('🔍 [DEBUG] SyncService: Getting sync status for user:', userId)

    try {
      // ✅ Create BotApiClient instance with clerkUserId
      const botApiClient = new BotApiClient(userId);
      const response = await botApiClient.getSyncStatus(userId)
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to get sync status')
      }

      console.log('✅ [DEBUG] SyncService: Sync status retrieved for user:', userId)
      return response.data
    } catch (error) {
      console.error('❌ [DEBUG] SyncService: Failed to get sync status for user:', userId, error)
      throw error
    }
  }

  async forceSync(userId: string): Promise<void> {
    console.log('🔍 [DEBUG] SyncService: Force syncing user:', userId)

    try {
      // ✅ Create BotApiClient instance with clerkUserId
      const botApiClient = new BotApiClient(userId);
      const response = await botApiClient.forceSync(userId)
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Force sync failed')
      }

      console.log('✅ [DEBUG] SyncService: Force sync completed for user:', userId)
    } catch (error) {
      console.error('❌ [DEBUG] SyncService: Failed to force sync user:', userId, error)
      throw error
    }
  }

  getQueueStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing
    }
  }

  clearQueue(): void {
    this.syncQueue = []
    this.retryAttempts.clear()
    console.log('🧹 [DEBUG] SyncService: Queue cleared')
  }
}

export const syncService = new SyncService() 