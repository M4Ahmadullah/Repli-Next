import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'

// Query parameters schema
const alertQuerySchema = z.object({
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
})

// GET: Get admin alerts
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Admin authentication required'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 401 })
    }

    // Check if user is admin (you can implement your own admin check logic)
    const adminApiKey = request.headers.get('x-admin-key')
    const expectedAdminKey = process.env.ADMIN_API_KEY || 'your-secure-admin-key'
    
    if (adminApiKey !== expectedAdminKey) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = alertQuerySchema.parse({
      severity: searchParams.get('severity'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    })

    // Mock alerts data - in a real implementation, this would come from your monitoring system
    const mockAlerts = [
      {
        id: 'alert_1234567890',
        title: 'High Memory Usage',
        description: 'System memory usage exceeded 80%',
        severity: 'critical' as const,
        actionRequired: true,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        metadata: {
          memoryUsage: 85,
          threshold: 80,
          systemId: 'web-server-1'
        }
      },
      {
        id: 'alert_1234567891',
        title: 'WhatsApp Connection Timeout',
        description: 'Multiple WhatsApp sessions experiencing connection timeouts',
        severity: 'error' as const,
        actionRequired: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        metadata: {
          affectedSessions: 3,
          errorRate: 15,
          service: 'whatsapp-service'
        }
      },
      {
        id: 'alert_1234567892',
        title: 'Rate Limit Threshold Reached',
        description: 'API rate limit reached 90% of threshold',
        severity: 'warning' as const,
        actionRequired: false,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        metadata: {
          currentRate: 54,
          threshold: 60,
          endpoint: '/api/v1/whatsapp/send-message'
        }
      },
      {
        id: 'alert_1234567893',
        title: 'Database Backup Completed',
        description: 'Daily database backup completed successfully',
        severity: 'info' as const,
        actionRequired: false,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        metadata: {
          backupSize: '2.3GB',
          duration: '45 minutes',
          location: 's3://backups/daily'
        }
      },
      {
        id: 'alert_1234567894',
        title: 'Disk Space Low',
        description: 'Available disk space is below 20%',
        severity: 'warning' as const,
        actionRequired: true,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        metadata: {
          availableSpace: '15%',
          threshold: '20%',
          partition: '/var/log'
        }
      }
    ]

    // Filter by severity if specified
    let filteredAlerts = mockAlerts
    if (queryParams.severity) {
      filteredAlerts = mockAlerts.filter(alert => alert.severity === queryParams.severity)
    }

    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedAlerts = filteredAlerts.slice(queryParams.offset, queryParams.offset + queryParams.limit)

    // Calculate statistics
    const stats = {
      total: mockAlerts.length,
      bySeverity: {
        info: mockAlerts.filter(a => a.severity === 'info').length,
        warning: mockAlerts.filter(a => a.severity === 'warning').length,
        error: mockAlerts.filter(a => a.severity === 'error').length,
        critical: mockAlerts.filter(a => a.severity === 'critical').length,
      },
      actionRequired: mockAlerts.filter(a => a.actionRequired).length,
      last24Hours: mockAlerts.filter(a => 
        new Date(a.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length
    }

    return NextResponse.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        stats,
        pagination: {
          total: filteredAlerts.length,
          limit: queryParams.limit,
          offset: queryParams.offset,
          hasMore: queryParams.offset + queryParams.limit < filteredAlerts.length
        }
      },
      message: 'Admin alerts retrieved successfully',
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (error) {
    console.error('Get admin alerts error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.errors
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve admin alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { status: 500 })
  }
} 