import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HRAnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "hr") {
    redirect("/auth/login")
  }

  // Fetch analytics data
  const { data: applications } = await supabase
    .from("applications")
    .select("created_at, status, job_id")
    .order("created_at", { ascending: false })

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, created_at")
    .eq("posted_by", user.id)

  // Calculate application trends (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentApps = applications?.filter(app => 
    new Date(app.created_at) >= thirtyDaysAgo
  ) || []

  // Calculate top performing jobs
  const jobAppCounts = applications?.reduce((acc, app) => {
    acc[app.job_id] = (acc[app.job_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const topJobs = jobs
    ?.map(job => ({
      title: job.title,
      count: jobAppCounts[job.id] || 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) || []

  const maxCount = topJobs.length > 0 ? Math.max(...topJobs.map(j => j.count)) : 1

  // Calculate average time to hire
  const hiredApps = applications?.filter(app => app.status === "hired") || []
  const avgTimeToHire = hiredApps.length > 0
    ? hiredApps.reduce((sum, app) => {
        const appDate = new Date(app.created_at)
        const today = new Date()
        const days = Math.floor((today.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0) / hiredApps.length
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType="hr" userName={profile.first_name} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Recruitment Analytics</h1>
          <p className="text-gray-600">Track your hiring performance and metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{recentApps.length}</div>
                  <p className="text-sm text-gray-600">Applications (Last 30 Days)</p>
                </div>
                <div className="text-center pt-4 border-t">
                  <div className="text-2xl font-semibold text-gray-900">{applications?.length || 0}</div>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topJobs.length > 0 ? (
                  topJobs.map((job, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                        {job.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((job.count / maxCount) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{job.count}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No applications yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidate Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">High Match (80%+)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                    <span className="text-sm text-gray-600">65%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Medium Match (60-79%)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                    </div>
                    <span className="text-sm text-gray-600">25%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Low Match (&lt;60%)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: "10%" }}></div>
                    </div>
                    <span className="text-sm text-gray-600">10%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time to Hire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {avgTimeToHire > 0 ? Math.round(avgTimeToHire) : "N/A"}
                  </div>
                  <p className="text-sm text-gray-600">Average Days to Hire</p>
                </div>
                <div className="text-center pt-4 border-t">
                  <div className="text-2xl font-semibold text-gray-900">{hiredApps.length}</div>
                  <p className="text-sm text-gray-600">Total Hires</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}