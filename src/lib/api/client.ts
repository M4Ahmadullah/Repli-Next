import { User, CreateUserData, UpdateUserData, UserSubscription } from '@/lib/types/user'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  setAuthToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  getAuthToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  removeAuthToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`
    const token = this.getAuthToken()

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async register(userData: CreateUserData & { password: string }) {
    const response = await this.request<{
      success: boolean
      user: User
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    return response
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      success: boolean
      token: string
      user: User
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (response.success && response.token) {
      this.setAuthToken(response.token)
    }
    
    return response
  }

  async logout() {
    this.removeAuthToken()
  }

  // User endpoints
  async getUser(userId: string) {
    const response = await this.request<{
      success: boolean
      user: User
    }>(`/users/${userId}`)
    return response
  }

  async updateUser(userId: string, updateData: UpdateUserData) {
    const response = await this.request<{
      success: boolean
      user: User
    }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    return response
  }

  async deleteUser(userId: string) {
    const response = await this.request<{
      success: boolean
      message: string
    }>(`/users/${userId}`, {
      method: 'DELETE',
    })
    return response
  }

  // Subscription endpoints
  async getSubscription(userId: string) {
    const response = await this.request<{
      success: boolean
      subscription: UserSubscription
    }>(`/subscriptions/${userId}`)
    return response
  }

  async updateSubscription(userId: string, subscriptionData: Partial<UserSubscription>) {
    const response = await this.request<{
      success: boolean
      subscription: UserSubscription
    }>(`/subscriptions/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    })
    return response
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export for use in components
export default apiClient 