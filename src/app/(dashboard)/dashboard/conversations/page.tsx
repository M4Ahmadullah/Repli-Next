'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Clock, User, Bot, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Conversation {
  id: string
  phoneNumber: string
  lastMessage: string
  lastMessageTime: string
  status: 'active' | 'inactive'
  messageCount: number
}

interface ConversationStats {
  activeChats: number
  todayMessages: number
  responseRate: number
  avgResponseTime: number
}

export default function ConversationsPage() {
  const { user, isLoaded } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [stats, setStats] = useState<ConversationStats>({
    activeChats: 0,
    todayMessages: 0,
    responseRate: 0,
    avgResponseTime: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      if (!user?.id) {
        setError('User ID not available')
        setLoading(false)
        return
      }

      // Fetch conversations for the user
      const response = await fetch(`/api/conversations/${user.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      if (data.success) {
        setConversations(data.conversations || [])
        
        // Calculate stats from conversations
        const activeChats = data.conversations?.filter((conv: Conversation) => conv.status === 'active').length || 0
        const todayMessages = data.conversations?.reduce((total: number, conv: Conversation) => total + conv.messageCount, 0) || 0
        const responseRate = data.stats?.responseRate || 0
        const avgResponseTime = data.stats?.avgResponseTime || 0

        setStats({
          activeChats,
          todayMessages,
          responseRate,
          avgResponseTime
        })
        
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch conversations')
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch conversations')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user) {
      fetchConversations()
    }
  }, [isLoaded, user, fetchConversations])

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading conversations...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription>
                You need to be signed in to view this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.location.href = '/sign-in'} className="btn-primary">
                <Sparkles className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Error Loading Conversations</CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => fetchConversations()} className="btn-primary">
                <Sparkles className="w-5 h-5 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            Conversations
          </h1>
          <p className="text-emerald-600 dark:text-emerald-400">
            Monitor and manage WhatsApp conversations with your customers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Active Chats</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.activeChats}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Today's Messages</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.todayMessages}</p>
                </div>
                <Clock className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Response Rate</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.responseRate}%</p>
                </div>
                <Bot className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Avg Response Time</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {stats.avgResponseTime ? `${stats.avgResponseTime}s` : 'N/A'}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Recent Conversations</CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-400">
              Latest WhatsApp interactions with your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversations.length > 0 ? (
            <div className="space-y-4">
                {conversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-medium text-emerald-900 dark:text-emerald-100">{conversation.phoneNumber}</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          Last message: "{conversation.lastMessage}"
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={conversation.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}>
                        {conversation.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        {new Date(conversation.lastMessageTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                  </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No Conversations Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Once your bot starts receiving messages, they will appear here
                </p>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 