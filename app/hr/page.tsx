import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, CheckCircle, Users, Clock, Plus, UserSearch, BarChart3 } from "lucide-react"
import Link from "next/link"

export const revalidate = 60 // Revalidate every 60 seconds

export default async function HRDashboardPage() {
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

  if (!profile || profile.user_type !== "hr") {
    redirect("/auth/login")
  }

  // Fetch all data in parallel to reduce total request time
  const [
    { data: allJobs },
    { data: activeJobsData },
    { data: applications }
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("posted_by", user.id),
    
    supabase
      .from("jobs")
      .select("*")
      .eq("posted_by", user.id)
      .eq("status", "active"),
    
    supabase
      .from("applications")
      .select(`
        *,
        jobs!inner(posted_by),
        profiles(first_name, last_name)
      `)
      .eq("jobs.posted_by", user.id)
      .order("created_at", { ascending: false })
  ])

  const totalJobs = allJobs?.length || 0
  const activeJobs = activeJobsData?.length || 0

  const totalApplications = applications?.length || 0
  const pendingReview = applications?.filter(app => app.status === "applied").length || 0

  // Get recent applications (last 3)
  const recentApplications = applications?.slice(0, 3) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType="hr" userName={profile.first_name} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600">Manage job postings and review candidates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Link href="/hr/jobs">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{totalJobs}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/hr/jobs?filter=active">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{activeJobs}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/hr/candidates">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Applications</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{totalApplications}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/hr/candidates?filter=pending">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{pendingReview}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/hr/jobs">
                <Button variant="outline" className="w-full h-auto py-4 justify-start">
                  <Plus className="h-5 w-5 mr-3 text-green-600" />
                  <span>Post New Job</span>
                </Button>
              </Link>

              <Link href="/hr/candidates">
                <Button variant="outline" className="w-full h-auto py-4 justify-start">
                  <UserSearch className="h-5 w-5 mr-3 text-blue-600" />
                  <span>Review Candidates</span>
                </Button>
              </Link>

              <Link href="/hr/analytics">
                <Button variant="outline" className="w-full h-auto py-4 justify-start">
                  <BarChart3 className="h-5 w-5 mr-3 text-purple-600" />
                  <span>View Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((app) => {
                  const profile = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles
                  const applicantName = profile 
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                    : 'Unknown Applicant'
                  
                  return (
                    <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">New application received</p>
                          <p className="text-sm text-gray-500">
                            Match Score: {app.match_score || 'N/A'} • {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Link href="/hr/candidates">
                        <Button size="sm">Review</Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No applications yet. Applications will appear here when candidates apply to your jobs.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}