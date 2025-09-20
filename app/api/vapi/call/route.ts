import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, assistantId, action } = await request.json()

    if (!apiKey || !assistantId) {
      return NextResponse.json(
        { error: 'API key and assistant ID are required' },
        { status: 400 }
      )
    }

    let response: Response

    switch (action) {
      case 'start':
        // For starting calls, we'll rely on the VAPI Web SDK
        // This endpoint can be used for server-side call management if needed
        response = await fetch('https://api.vapi.ai/call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assistantId,
            customer: {
              number: '+1234567890' // Placeholder for web calls
            }
          }),
        })
        break

      case 'validate-assistant':
        // Validate that the assistant exists and is accessible
        response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

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
      data
    })

  } catch (error) {
    console.error('VAPI call error:', error)
    return NextResponse.json(
      { 
        error: 'API call failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
