"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CheckoutSessionDisplayProps {
  sessionId?: string
}

export function CheckoutSessionDisplay({ sessionId }: CheckoutSessionDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (sessionId) {
      await navigator.clipboard.writeText(sessionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!sessionId) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <p className="text-sm text-blue-700 font-medium mb-2">Transaction Reference</p>
      <div className="flex items-center justify-center gap-2">
        <code className="text-xs bg-white px-3 py-2 rounded border border-blue-200 text-blue-800 font-mono break-all">
          {sessionId}
        </code>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-blue-100 rounded transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-blue-600" />}
        </button>
      </div>
    </div>
  )
}
