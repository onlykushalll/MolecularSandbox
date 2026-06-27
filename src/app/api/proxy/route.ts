import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, stat, readdir } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MCPILOT_URL = 'https://acquire-ellipse-disown.ngrok-free.dev'
const TOKEN = 'mcpilot-secret-2024'

const MODELS_DIR = join(process.cwd(), 'public', 'models')

// ---------------------------------------------------------------------------
// Local tools — handled entirely inside the sandbox (never forwarded to PC).
//   save_model        : { filename, b64 }  -> writes decoded .glb to public/models
//   list_local_models : {}                 -> lists .glb files already in sandbox
// ---------------------------------------------------------------------------
async function handleLocalTool(
  tool: string,
  args: Record<string, unknown> = {}
): Promise<unknown | null> {
  if (tool === 'save_model') {
    const filename = String(args.filename ?? '')
    const b64 = String(args.b64 ?? '')
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    if (!safe) return { ok: true, data: { ok: false, error: 'bad filename' } }

    await mkdir(MODELS_DIR, { recursive: true })
    const filepath = join(MODELS_DIR, safe)

    // Skip if already present and > 50 KB.
    try {
      const st = await stat(filepath)
      if (st.size > 50 * 1024) {
        return {
          ok: true,
          data: { ok: true, filename: safe, size: st.size, skipped: true },
        }
      }
    } catch {
      /* not present — proceed */
    }

    const cleaned = b64.replace(/\s+/g, '')
    const data = Buffer.from(cleaned, 'base64')
    if (data.length === 0) {
      return { ok: true, data: { ok: false, error: 'empty decode' } }
    }
    await writeFile(filepath, data)
    return {
      ok: true,
      data: { ok: true, filename: safe, size: data.length, skipped: false },
    }
  }

  if (tool === 'list_local_models') {
    try {
      const entries = await readdir(MODELS_DIR)
      const glbs = entries.filter((e) => e.toLowerCase().endsWith('.glb'))
      const sizes: Record<string, number> = {}
      for (const g of glbs) {
        try {
          sizes[g] = (await stat(join(MODELS_DIR, g))).size
        } catch {
          sizes[g] = -1
        }
      }
      return { ok: true, data: { count: glbs.length, files: sizes } }
    } catch {
      return { ok: true, data: { count: 0, files: {} } }
    }
  }

  return null // not a local tool — fall through to proxy
}

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

    // Intercept local sandbox tools.
    const local = await handleLocalTool(tool, args ?? {})
    if (local !== null) {
      return NextResponse.json(local, { status: 200 })
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
