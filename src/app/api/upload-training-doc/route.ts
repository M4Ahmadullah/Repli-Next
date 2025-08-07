import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized'
        }
      }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const botId = formData.get('botId') as string

    if (!file) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: 'No file provided'
        }
      }, { status: 400 })
    }

    if (!botId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'MISSING_BOT_ID',
          message: 'Bot ID is required'
        }
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Invalid file type. Please upload PDF, DOC, or DOCX files only.'
        }
      }, { status: 400 })
    }

    // Validate file size (300KB max)
    if (file.size > 300 * 1024) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 300KB limit.'
        }
      }, { status: 400 })
    }

    // TODO: Upload to Firebase Storage or local storage
    // For now, we'll just validate and return success
    // The actual upload will be handled by the bot team

    // Simulate AI analysis summary (this would come from the bot backend)
    const aiSummary = {
      businessUnderstanding: `I've analyzed your document "${file.name}" and gained valuable insights about your business. I can see you're focused on providing quality services to your customers, with a strong emphasis on customer satisfaction and professional delivery. Your business appears to be well-structured with clear operational processes.`,
      keyInsights: [
        "Customer-focused approach",
        "Professional service delivery",
        "Quality assurance processes",
        "Clear business structure"
      ],
      confidence: 85
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        botId,
        userId
      },
      aiSummary,
      message: 'Document uploaded successfully',
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
} 