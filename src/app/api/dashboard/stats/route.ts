import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserService } from '@/lib/services/user.service'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 1. Get user and their bots
    const userService = UserService.getInstance()
    const user = await userService.getUserById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userBots = user.bots || []
    
    // 2. Aggregate statistics from bot system
    const BOT_SYSTEM_URL = process.env.BOT_SYSTEM_URL || 'http://localhost:4000'
    
    // Initialize aggregated stats
    const totalStats = {
      totalMessages: 0,
      todayMessages: 0,
      weeklyMessages: 0,
      monthlyMessages: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      responsiveBotsCount: 0,
      connectedBots: 0,
      activeBots: 0,
      trainingBots: 0,
      errorBots: 0,
      totalQnaPairs: 0,
      totalDocuments: 0
    }

    const botDetails = []

    // 3. Get analytics for each bot
    for (const bot of userBots) {
      try {
        // Get bot analytics from bot system
        let botAnalytics = bot.analytics || {
          totalMessages: 0,
          todayMessages: 0,
          weeklyMessages: 0,
          monthlyMessages: 0,
          responseRate: 0,
          averageResponseTime: 0,
          topQuestions: [],
          satisfactionScore: 0,
          lastUpdated: new Date()
        }

        try {
        const analyticsResponse = await fetch(`${BOT_SYSTEM_URL}/api/analytics/${bot.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`,
          }
        })

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          botAnalytics = {
            totalMessages: analyticsData.totalMessages || 0,
            todayMessages: analyticsData.todayMessages || 0,
            weeklyMessages: analyticsData.weeklyMessages || 0,
            monthlyMessages: analyticsData.monthlyMessages || 0,
            responseRate: analyticsData.responseRate || 0,
            averageResponseTime: analyticsData.averageResponseTime || 0,
            topQuestions: analyticsData.topQuestions || [],
            satisfactionScore: analyticsData.satisfactionScore || 0,
            lastUpdated: new Date(analyticsData.lastUpdated || Date.now())
          }
          }
        } catch (error) {
          // Use default analytics if bot system is not available
        }

        // Get bot status
        let botStatus = bot.status
        let botHealth = 'unknown'
        
        try {
        const statusResponse = await fetch(`${BOT_SYSTEM_URL}/api/bots/${bot.id}/status`, {
          headers: {
            'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`,
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          botStatus = statusData.status || bot.status
          botHealth = statusData.health || 'unknown'
          }
        } catch (error) {
          // Use default status if bot system is not available
        }

        // Aggregate stats
        totalStats.totalMessages += botAnalytics.totalMessages
        totalStats.todayMessages += botAnalytics.todayMessages
        totalStats.weeklyMessages += botAnalytics.weeklyMessages
        totalStats.monthlyMessages += botAnalytics.monthlyMessages
        
        if (botAnalytics.averageResponseTime > 0) {
          totalStats.totalResponseTime += botAnalytics.averageResponseTime
          totalStats.responsiveBotsCount += 1
        }

        // Count bot statuses
        if (bot.whatsappConnected) totalStats.connectedBots += 1
        if (botStatus === 'active') totalStats.activeBots += 1
        if (botStatus === 'training') totalStats.trainingBots += 1
        if (botStatus === 'error') totalStats.errorBots += 1

        // Count training data
        totalStats.totalQnaPairs += bot.trainingData.qnaPairs.length
        totalStats.totalDocuments += bot.trainingData.documents.length

        // Add to bot details
        botDetails.push({
          id: bot.id,
          name: bot.name,
          status: botStatus,
          health: botHealth,
          whatsappConnected: bot.whatsappConnected,
          phoneNumber: bot.whatsappPhoneNumber,
          analytics: botAnalytics,
          trainingData: {
            qnaPairCount: bot.trainingData.qnaPairs.length,
            documentCount: bot.trainingData.documents.length,
            businessInfo: bot.trainingData.businessInfo
          },
          createdAt: bot.createdAt,
          updatedAt: bot.updatedAt
        })

      } catch (error) {
        console.error(`Error getting stats for bot ${bot.id}:`, error)
        
        // Use cached data if bot system is unavailable
        totalStats.totalMessages += bot.analytics.totalMessages
        totalStats.todayMessages += bot.analytics.todayMessages
        totalStats.weeklyMessages += bot.analytics.weeklyMessages
        totalStats.monthlyMessages += bot.analytics.monthlyMessages
        
        if (bot.analytics.averageResponseTime > 0) {
          totalStats.totalResponseTime += bot.analytics.averageResponseTime
          totalStats.responsiveBotsCount += 1
        }

        if (bot.whatsappConnected) totalStats.connectedBots += 1
        if (bot.status === 'active') totalStats.activeBots += 1
        if (bot.status === 'training') totalStats.trainingBots += 1
        if (bot.status === 'error') totalStats.errorBots += 1

        totalStats.totalQnaPairs += bot.trainingData.qnaPairs.length
        totalStats.totalDocuments += bot.trainingData.documents.length

        botDetails.push({
          id: bot.id,
          name: bot.name,
          status: bot.status,
          health: 'unknown',
          whatsappConnected: bot.whatsappConnected,
          phoneNumber: bot.whatsappPhoneNumber,
          analytics: bot.analytics,
          trainingData: {
            qnaPairCount: bot.trainingData.qnaPairs.length,
            documentCount: bot.trainingData.documents.length,
            businessInfo: bot.trainingData.businessInfo
          },
          createdAt: bot.createdAt,
          updatedAt: bot.updatedAt
        })
      }
    }

    // Calculate average response time
    totalStats.averageResponseTime = totalStats.responsiveBotsCount > 0 
      ? totalStats.totalResponseTime / totalStats.responsiveBotsCount 
      : 0

    // 4. Get plan limits and usage
    const planLimits = {
      free: { bots: 1, dailyMessages: 10, monthlyMessages: 300, qnaPairs: 5 },
      starter: { bots: 3, dailyMessages: 100, monthlyMessages: 3000, qnaPairs: 25 },
      growth: { bots: 10, dailyMessages: 500, monthlyMessages: 15000, qnaPairs: 100 },
      enterprise: { bots: 50, dailyMessages: 2000, monthlyMessages: 60000, qnaPairs: 500 }
    }

    const currentLimits = planLimits[user.subscription.plan] || planLimits.free

    // 5. Calculate usage percentages
    const usage = {
      bots: {
        current: userBots.length,
        limit: currentLimits.bots,
        percentage: Math.round((userBots.length / currentLimits.bots) * 100)
      },
      dailyMessages: {
        current: totalStats.todayMessages,
        limit: currentLimits.dailyMessages,
        percentage: Math.round((totalStats.todayMessages / currentLimits.dailyMessages) * 100)
      },
      monthlyMessages: {
        current: totalStats.monthlyMessages,
        limit: currentLimits.monthlyMessages,
        percentage: Math.round((totalStats.monthlyMessages / currentLimits.monthlyMessages) * 100)
      },
      qnaPairs: {
        current: totalStats.totalQnaPairs,
        limit: totalStats.totalQnaPairs, // This is total across all bots
        percentage: 0 // Will calculate per bot
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.subscription.plan,
        planStatus: user.subscription.status
      },
      overview: {
        totalBots: userBots.length,
        connectedBots: totalStats.connectedBots,
        activeBots: totalStats.activeBots,
        trainingBots: totalStats.trainingBots,
        errorBots: totalStats.errorBots
      },
      analytics: {
        totalMessages: totalStats.totalMessages,
        todayMessages: totalStats.todayMessages,
        weeklyMessages: totalStats.weeklyMessages,
        monthlyMessages: totalStats.monthlyMessages,
        averageResponseTime: Math.round(totalStats.averageResponseTime),
        totalQnaPairs: totalStats.totalQnaPairs,
        totalDocuments: totalStats.totalDocuments
      },
      usage,
      limits: currentLimits,
      bots: botDetails,
      lastUpdated: new Date()
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 