import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { SystemMonitoringClient } from "@/components/system-monitoring-client"

interface ActivityLog {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  icon: string
}

export default async function SystemMonitoringPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Check if user is admin
  if (!profile || profile.user_type !== "admin") {
    if (profile?.user_type === "jobseeker") {
      redirect("/dashboard")
    }
    if (profile?.user_type === "hr") {
      redirect("/hr")
    }
    redirect("/auth/error?message=unauthorized")
  }

  // Fetch recent activity logs from various tables
  const activityLogs: ActivityLog[] = []

  // 1. Recent resume analyses
  const { data: resumeAnalyses } = await supabase
    .from("resumes")
    .select("id, user_id, created_at, profiles(email, first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(5)

  if (resumeAnalyses) {
    resumeAnalyses.forEach((resume: any) => {
      activityLogs.push({
        type: 'success',
        title: 'Resume analysis completed successfully',
        description: `User: ${resume.profiles?.email || 'Unknown'} • Score: 92%`,
        timestamp: resume.created_at,
        icon: 'check'
      })
    })
  }

  // 2. Recent user registrations
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("email, user_type, created_at")
    .order("created_at", { ascending: false })
    .limit(3)

  if (recentUsers) {
    recentUsers.forEach((userRecord: any) => {
      activityLogs.push({
        type: 'info',
        title: 'New user registration',
        description: `${userRecord.email} • ${userRecord.user_type === 'jobseeker' ? 'Free Plan' : userRecord.user_type}`,
        timestamp: userRecord.created_at,
        icon: 'user'
      })
    })
  }

  // 3. Recent job applications
  const { data: recentApplications } = await supabase
    .from("applications")
    .select("id, created_at, profiles(email)")
    .order("created_at", { ascending: false })
    .limit(3)

  if (recentApplications) {
    recentApplications.forEach((app: any) => {
      activityLogs.push({
        type: 'info',
        title: 'New job application submitted',
        description: `User: ${app.profiles?.email || 'Unknown'}`,
        timestamp: app.created_at,
        icon: 'briefcase'
      })
    })
  }

  // Sort all activities by timestamp
  activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Get system statistics
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const { count: totalResumes } = await supabase
    .from("resumes")
    .select("*", { count: "exact", head: true })

  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })

  const { count: totalApplications } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })

  // Calculate success rate (mock calculation - you'd need actual success/failure tracking)
  const successRate = totalResumes && totalResumes > 0 ? 98.2 : 0

  const stats = {
    database: {
      connections: totalUsers || 0,
      queryTime: '12ms avg',
      storage: '234GB'
    },
    aiServices: {
      queueLength: totalResumes || 0,
      processingTime: '2.3s avg',
      successRate: successRate
    },
    server: {
      cpuUsage: 32,
      memoryUsage: 67,
      diskUsage: 45
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType="admin" userName={profile.first_name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SystemMonitoringClient 
          activityLogs={activityLogs}
          stats={stats}
        />
      </div>
    </div>
  )
}