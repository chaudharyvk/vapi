import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey: providedKey } = await request.json()

    const serverKey = process.env.VAPI_SERVER_API_KEY
    const apiKey = serverKey || providedKey

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Make a simple API call to VAPI to check health
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: `API call failed: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'VAPI API is accessible',
      assistantCount: Array.isArray(data) ? data.length : 'unknown',
      usedKey: serverKey ? 'server' : 'client'
    })

  } catch (error) {
    console.error('VAPI health check error:', error)
    return NextResponse.json(
      { 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
