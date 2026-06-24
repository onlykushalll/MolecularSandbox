import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MCPILOT_URL = 'https://vigorous-tricking-thirty.ngrok-free.dev'
const TOKEN = 'mcpilot-secret-2024'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tool, args } = body

    if (!tool) {
      return NextResponse.json(
        { error: 'Missing "tool" in request body' },
        { status: 400 }
      )
    }

    const upstream = await fetch(`${MCPILOT_URL}/api/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ tool, args: args ?? {} }),
    })

    const text = await upstream.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    return NextResponse.json(
      { ok: upstream.ok, status: upstream.status, data },
      { status: upstream.status }
    )
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    )
  }
}

export async function GET() {
  // Simple health check - ping MCPilot /health
  try {
    const upstream = await fetch(`${MCPILOT_URL}/health`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        Authorization: `Bearer ${TOKEN}`,
      },
    })
    const text = await upstream.text()
    return NextResponse.json(
      { ok: upstream.ok, status: upstream.status, body: text },
      { status: upstream.status }
    )
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    )
  }
}
