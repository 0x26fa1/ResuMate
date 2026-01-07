"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react"

interface ServiceStatus {
  status: "operational" | "degraded" | "down" | "unknown"
  responseTime: number
  error?: string | null
}

interface StatusData {
  timestamp: string
  services: {
    api: ServiceStatus
    database: ServiceStatus
    supabase: ServiceStatus
  }
  overall: "operational" | "degraded" | "down"
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/status")
      
    
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }
      
      const text = await response.text()
      if (!text) {
        throw new Error('Empty response from API')
      }
      
      const data = JSON.parse(text)
      setStatus(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch status:", error)
      // Set fallback error state
      setStatus({
        timestamp: new Date().toISOString(),
        services: {
          api: { status: 'down', responseTime: 0, error: 'API not responding' },
          database: { status: 'unknown', responseTime: 0 },
          supabase: { status: 'unknown', responseTime: 0 }
        },
        overall: 'down'
      })
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-500">Operational</Badge>
      case "degraded":
        return <Badge className="bg-yellow-500">Degraded</Badge>
      case "down":
        return <Badge className="bg-red-500">Down</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-slate-900">System Status</h1>
          <p className="text-slate-600">Real-time monitoring of Resumate services</p>
        </div>

        {/* Overall Status */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Overall Status</CardTitle>
                <CardDescription>{lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                {status && getStatusBadge(status.overall)}
                <Button onClick={fetchStatus} disabled={loading} size="sm" variant="outline">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Service Status Cards */}
        <div className="space-y-4">
          {status && (
            <>
              {/* API Service */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status.services.api.status)}
                      <div>
                        <CardTitle>API Service</CardTitle>
                        <CardDescription>Core application API</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(status.services.api.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Response Time</span>
                      <span className="font-mono font-semibold">{status.services.api.responseTime}ms</span>
                    </div>
                    {status.services.api.error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                        <strong>Error:</strong> {status.services.api.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Database Service */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status.services.database.status)}
                      <div>
                        <CardTitle>Database</CardTitle>
                        <CardDescription>PostgreSQL database connection</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(status.services.database.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Response Time</span>
                      <span className="font-mono font-semibold">{status.services.database.responseTime}ms</span>
                    </div>
                    {status.services.database.error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                        <strong>Error:</strong> {status.services.database.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Supabase Service */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status.services.supabase.status)}
                      <div>
                        <CardTitle>Supabase</CardTitle>
                        <CardDescription>Authentication & backend services</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(status.services.supabase.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Response Time</span>
                      <span className="font-mono font-semibold">{status.services.supabase.responseTime}ms</span>
                    </div>
                    {status.services.supabase.error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                        <strong>Error:</strong> {status.services.supabase.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {loading && !status && (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-400" />
                <p className="text-slate-600">Loading status information...</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Section */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This page automatically refreshes every 30 seconds. You can also manually refresh
              using the button above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}