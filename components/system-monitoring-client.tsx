"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  Briefcase, 
  CreditCard,
  Download,
  RefreshCw
} from 'lucide-react'

interface ActivityLog {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  icon: string
}

interface Stats {
  database: {
    connections: number
    queryTime: string
    storage: string
  }
  aiServices: {
    queueLength: number
    processingTime: string
    successRate: number
  }
  server: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
  }
}

interface Props {
  activityLogs: ActivityLog[]
  stats: Stats
}

export function SystemMonitoringClient({ activityLogs, stats }: Props) {
  const [timeFilter, setTimeFilter] = useState('24')
  const [refreshing, setRefreshing] = useState(false)

  const getStatusColor = (value: number) => {
    if (value < 60) return 'text-green-600'
    if (value < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusDot = (value: number) => {
    if (value < 60) return 'bg-green-500'
    if (value < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getActivityIcon = (icon: string, type: string) => {
    switch (icon) {
      case 'check':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'user':
        return <User className="w-5 h-5 text-blue-600" />
      case 'briefcase':
        return <Briefcase className="w-5 h-5 text-purple-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'credit':
        return <CreditCard className="w-5 h-5 text-indigo-600" />
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500'
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500'
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500'
      case 'info':
        return 'bg-blue-50 border-l-4 border-blue-500'
      default:
        return 'bg-gray-50'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
    return `${Math.floor(diffMins / 1440)} days ago`
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      window.location.reload()
    }, 1000)
  }

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'Title', 'Description'],
      ...activityLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.type,
        log.title,
        log.description
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring & Logs</h1>
          <p className="text-gray-600 mt-1">Real-time system health and activity monitoring</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
          >
            <option value="1">Last 1 hour</option>
            <option value="24">Last 24 hours</option>
            <option value="168">Last 7 days</option>
            <option value="720">Last 30 days</option>
          </select>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Server Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Server Status</CardTitle>
            <div className={`h-3 w-3 rounded-full ${getStatusDot(Math.max(stats.server.cpuUsage, stats.server.memoryUsage, stats.server.diskUsage))}`}></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">CPU Usage</span>
                <span className={`font-semibold ${getStatusColor(stats.server.cpuUsage)}`}>
                  {stats.server.cpuUsage}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Memory Usage</span>
                <span className={`font-semibold ${getStatusColor(stats.server.memoryUsage)}`}>
                  {stats.server.memoryUsage}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Disk Usage</span>
                <span className={`font-semibold ${getStatusColor(stats.server.diskUsage)}`}>
                  {stats.server.diskUsage}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Database</CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Connections</span>
                <span className="font-semibold text-gray-900">
                  {stats.database.connections}/1000
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Query Time</span>
                <span className="font-semibold text-gray-900">
                  {stats.database.queryTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Storage</span>
                <span className="font-semibold text-gray-900">
                  {stats.database.storage}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">AI Services</CardTitle>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Queue Length</span>
                <span className="font-semibold text-gray-900">
                  {stats.aiServices.queueLength} jobs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Processing Time</span>
                <span className="font-semibold text-gray-900">
                  {stats.aiServices.processingTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Success Rate</span>
                <span className="font-semibold text-green-600">
                  {stats.aiServices.successRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent System Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No recent activity found</p>
              <p className="text-sm mt-1">System activities will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.slice(0, 10).map((log, index) => (
                <div 
                  key={index}
                  className={`flex items-start p-4 rounded-lg transition-all hover:shadow-md ${getActivityBgColor(log.type)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(log.icon, log.type)}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{log.title}</p>
                    <p className="text-xs text-gray-600 mt-1 break-words">{log.description}</p>
                  </div>
                  <div className="flex-shrink-0 ml-4 text-right">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Summary Footer */}
      <Card className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="py-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total Activities Logged</p>
              <p className="text-2xl font-bold text-gray-900">{activityLogs.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Monitoring Period</p>
              <p className="text-lg font-semibold text-gray-900">
                {timeFilter === '1' ? 'Last Hour' : 
                 timeFilter === '24' ? 'Last 24 Hours' : 
                 timeFilter === '168' ? 'Last 7 Days' : 
                 'Last 30 Days'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}