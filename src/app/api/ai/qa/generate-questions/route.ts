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

    const body = await request.json()
    const { botId, docExists } = body

    if (!botId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'MISSING_BOT_ID',
          message: 'Bot ID is required'
        }
      }, { status: 400 })
    }

    // TODO: Call AI service to generate questions
    // For now, return sample questions based on whether document exists
    const questions = docExists ? [
      "What are the main services your business offers?",
      "What makes your business unique in your industry?",
      "What are your business hours and contact information?",
      "What are the most common questions your customers ask?",
      "What are your pricing and payment options?",
      "What is your company's mission and values?",
      "What are your key products or service categories?",
      "How do you handle customer support and inquiries?"
    ] : [
      "What does your business do?",
      "What products or services do you offer?",
      "What are your business hours?",
      "How can customers contact you?",
      "What makes your business special?",
      "What are your most popular offerings?",
      "What questions do customers ask most?",
      "What is your company's story?"
    ]

    // Generate AI summary based on document existence
    const aiSummary = docExists ? {
      businessUnderstanding: "Based on your uploaded document, I have a comprehensive understanding of your business operations. I can see you have well-defined processes and a strong customer focus. Your business appears to be well-established with clear service offerings and professional standards.",
      keyInsights: [
        "Document-based insights available",
        "Structured business processes",
        "Customer-centric approach",
        "Professional service delivery"
      ],
      confidence: 92
    } : {
      businessUnderstanding: "I'm ready to learn about your business through our Q&A process. While I don't have a document to analyze yet, I can still help you create a comprehensive AI bot that understands your business through our guided questions.",
      keyInsights: [
        "Manual Q&A training approach",
        "Custom business knowledge",
        "Personalized bot training",
        "Step-by-step guidance"
      ],
      confidence: 75
    }

    return NextResponse.json({
      success: true,
      data: {
        questions,
        botId,
        userId,
        docExists
      },
      aiSummary,
      message: 'Questions generated successfully',
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Question generation error:', error)
    return NextResponse.json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
} 