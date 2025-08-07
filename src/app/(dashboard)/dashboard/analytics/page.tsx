'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, MessageSquare, Users, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalyticsData {
  totalMessages: number
  uniqueUsers: number
  successRate: number
  growth: number
  weeklyData: Array<{ date: string; messages: number }>
  topQuestions: Array<{ question: string; count: number }>
  responseTimeData: Array<{ date: string; avgTime: number }>
}

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalMessages: 0,
    uniqueUsers: 0,
    successRate: 0,
    growth: 0,
    weeklyData: [],
    topQuestions: [],
    responseTimeData: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      if (!user?.id) {
        setError('User ID not available')
        setLoading(false)
        return
      }

      // Fetch analytics data for the user
      const response = await fetch(`/api/dashboard/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      if (data.success) {
        setAnalytics({
          totalMessages: data.totalMessages || 0,
          uniqueUsers: data.uniqueUsers || 0,
          successRate: data.successRate || 0,
          growth: data.growth || 0,
          weeklyData: data.weeklyData || [],
          topQuestions: data.topQuestions || [],
          responseTimeData: data.responseTimeData || []
        })
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user) {
      fetchAnalytics()
    }
  }, [isLoaded, user, fetchAnalytics])

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
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
              <CardTitle className="text-2xl">Error Loading Analytics</CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => fetchAnalytics()} className="btn-primary">
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
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            Analytics & Insights
          </h1>
          <p className="text-emerald-600 dark:text-emerald-400">
            Track your bot performance and customer engagement metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Messages</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{analytics.totalMessages.toLocaleString()}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Unique Users</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{analytics.uniqueUsers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{analytics.successRate}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Growth</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{analytics.growth > 0 ? '+' : ''}{analytics.growth}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Performance */}
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardHeader>
              <CardTitle className="text-emerald-900 dark:text-emerald-100">Weekly Performance</CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                Message volume over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.weeklyData.length > 0 ? (
                <div className="space-y-4">
                  {analytics.weeklyData.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-emerald-100 dark:bg-emerald-800 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full" 
                            style={{ width: `${Math.min((day.messages / Math.max(...analytics.weeklyData.map(d => d.messages))) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{day.messages}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-500">No data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Questions */}
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
            <CardHeader>
              <CardTitle className="text-emerald-900 dark:text-emerald-100">Top Questions</CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                Most frequently asked questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topQuestions.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topQuestions.slice(0, 5).map((question, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-emerald-900 dark:text-emerald-100 font-medium">{question.question}</p>
                      </div>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">{question.count} times</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-500">No questions data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Response Time Chart */}
        <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">Response Time Trends</CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-400">
              Average response time over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.responseTimeData.length > 0 ? (
              <div className="space-y-4">
                {analytics.responseTimeData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">{data.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-emerald-100 dark:bg-emerald-800 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((data.avgTime / Math.max(...analytics.responseTimeData.map(d => d.avgTime))) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{data.avgTime}s</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-500">No response time data available</p>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 