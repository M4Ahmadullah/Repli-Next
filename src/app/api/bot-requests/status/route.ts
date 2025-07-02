import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserService } from '@/lib/services/user.service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')

    // 1. Verify user owns the bot (if specific bot requested)
    const userService = UserService.getInstance()
    const user = await userService.getUserById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let userBots = user.bots || []
    
    if (botId) {
      const userBot = userBots.find(bot => bot.id === botId)
      if (!userBot) {
        return NextResponse.json(
          { error: 'Bot not found or access denied' },
          { status: 404 }
        )
      }
      userBots = [userBot]
    }

    // 2. Get status from bot system for each bot
    const BOT_SYSTEM_URL = process.env.BOT_SYSTEM_URL || 'http://localhost:4000'
    const botStatuses = []

    for (const bot of userBots) {
      try {
        // Get bot status from bot system
        const statusResponse = await fetch(`${BOT_SYSTEM_URL}/api/bots/${bot.id}/status`, {
          headers: {
            'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`,
          }
        })

        let botSystemStatus = null
        if (statusResponse.ok) {
          botSystemStatus = await statusResponse.json()
        }

        // Get WhatsApp connection status
        const whatsappResponse = await fetch(`${BOT_SYSTEM_URL}/api/whatsapp/status/${bot.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`,
          }
        })

        let whatsappStatus = null
        if (whatsappResponse.ok) {
          whatsappStatus = await whatsappResponse.json()
        }

        // Get analytics
        const analyticsResponse = await fetch(`${BOT_SYSTEM_URL}/api/analytics/${bot.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`,
          }
        })

        let analytics = bot.analytics
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          analytics = {
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

        const status = {
          botId: bot.id,
          name: bot.name,
          status: botSystemStatus?.status || bot.status,
          health: botSystemStatus?.health || 'unknown',
          errorMessage: botSystemStatus?.errorMessage,
          whatsapp: {
            connected: whatsappStatus?.connected || bot.whatsappConnected,
            phoneNumber: whatsappStatus?.phoneNumber || bot.whatsappPhoneNumber,
            qrCode: whatsappStatus?.qrCode || bot.qrCode,
            lastActivity: whatsappStatus?.lastActivity
          },
          analytics,
          training: {
            qnaPairCount: bot.trainingData.qnaPairs.length,
            documentCount: bot.trainingData.documents.length,
            lastUpdate: bot.trainingData.lastTrainingUpdate
          },
          limits: {
            dailyMessages: user.subscription.dailyLimit,
            monthlyMessages: user.subscription.monthlyLimit,
            qnaPairs: {
              free: 5,
              starter: 25,
              growth: 100,
              enterprise: 500
            }[user.subscription.plan] || 5
          },
          lastUpdated: new Date()
        }

        botStatuses.push(status)

      } catch (error) {
        console.error(`Error getting status for bot ${bot.id}:`, error)
        
        // Return cached/default status if bot system is unavailable
        botStatuses.push({
          botId: bot.id,
          name: bot.name,
          status: bot.status,
          health: 'unknown',
          errorMessage: 'Unable to connect to bot system',
          whatsapp: {
            connected: bot.whatsappConnected,
            phoneNumber: bot.whatsappPhoneNumber,
            qrCode: bot.qrCode
          },
          analytics: bot.analytics,
          training: {
            qnaPairCount: bot.trainingData.qnaPairs.length,
            documentCount: bot.trainingData.documents.length,
            lastUpdate: bot.trainingData.lastTrainingUpdate
          },
          limits: {
            dailyMessages: user.subscription.dailyLimit,
            monthlyMessages: user.subscription.monthlyLimit,
            qnaPairs: {
              free: 5,
              starter: 25,
              growth: 100,
              enterprise: 500
            }[user.subscription.plan] || 5
          },
          lastUpdated: new Date()
        })
      }
    }

    return NextResponse.json({
      success: true,
      bots: botId ? botStatuses[0] : botStatuses,
      userPlan: user.subscription.plan,
      totalBots: user.bots?.length || 0,
      lastUpdated: new Date()
    })

  } catch (error) {
    console.error('Bot status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 