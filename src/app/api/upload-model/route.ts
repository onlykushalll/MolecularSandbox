import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/upload-model — PC pushes .glb files directly to sandbox
// No base64, no MCPilot — just direct HTTP multipart upload
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file || !filename) {
      return NextResponse.json({ error: 'Missing file or filename' }, { status: 400 })
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._() -]/g, '_')
    if (!safeName.endsWith('.glb')) {
      return NextResponse.json({ error: 'File must be .glb' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== 'glTF') {
      return NextResponse.json({ error: 'Not a valid GLB file' }, { status: 400 })
    }

    const modelDir = join(process.cwd(), 'public', 'models')
    await mkdir(modelDir, { recursive: true })
    await writeFile(join(modelDir, safeName), buffer)

    return NextResponse.json({
      ok: true,
      filename: safeName,
      size: buffer.length,
      sizeKB: Math.round(buffer.length / 1024),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

// GET — return count of models
export async function GET() {
  try {
    const modelDir = join(process.cwd(), 'public', 'models')
    const files = await readdir(modelDir)
    const glbFiles = files.filter(f => f.endsWith('.glb'))
    return NextResponse.json({ ok: true, count: glbFiles.length, files: glbFiles })
  } catch {
    return NextResponse.json({ ok: true, count: 0, files: [] })
  }
}
