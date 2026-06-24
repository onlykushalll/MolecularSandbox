'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    callMCPilot: (tool: string, args?: Record<string, unknown>) => Promise<unknown>
  }
}

interface CallResult {
  loading: boolean
  result: unknown
  error: string | null
}

export default function BridgePage() {
  const [mounted, setMounted] = useState(false)
  const [lastResult, setLastResult] = useState<CallResult>({
    loading: false,
    result: null,
    error: null,
  })

  useEffect(() => {
    setMounted(true)
    // Install the global bridge function
    window.callMCPilot = async (
      tool: string,
      args: Record<string, unknown> = {}
    ) => {
      setLastResult({ loading: true, result: null, error: null })
      try {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool, args }),
        })
        const json = await res.json()
        setLastResult({
          loading: false,
          result: json,
          error: null,
        })
        return json
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setLastResult({ loading: false, result: null, error: msg })
        throw err
      }
    }

    // Signal to agent-browser that the bridge is ready
    window.dispatchEvent(new CustomEvent('mcpilot-bridge-ready'))
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-8 font-mono">
      <div className="max-w-2xl w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">
            MCPilot Bridge
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Local JavaScript bridge for Z.ai → MCPilot. Call{' '}
            <code className="text-amber-300">
              window.callMCPilot(tool, args)
            </code>{' '}
            via agent-browser.
          </p>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                mounted ? 'bg-emerald-400' : 'bg-zinc-600'
              } animate-pulse`}
            />
            <span>{mounted ? 'Bridge ready' : 'Initializing...'}</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            window.callMCPilot ={' '}
            {mounted ? 'function (tool, args) => Promise' : 'undefined'}
          </div>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              Last Result
            </span>
            {lastResult.loading && (
              <span className="text-xs text-amber-300 animate-pulse">
                loading...
              </span>
            )}
          </div>
          <pre className="text-xs text-zinc-300 max-h-96 overflow-auto whitespace-pre-wrap break-words">
            {lastResult.error
              ? `ERROR: ${lastResult.error}`
              : JSON.stringify(lastResult.result, null, 2) || '—'}
          </pre>
        </div>

        <div className="text-xs text-zinc-600">
          Proxy target: https://vigorous-tricking-thirty.ngrok-free.dev/api/call
        </div>
      </div>
    </main>
  )
}
