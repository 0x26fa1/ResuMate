import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PostJobModal } from "@/components/post-job-modal"
import { JobActionsClient } from "@/components/job-actions-client"

export default async function HRJobsPage() {
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

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("posted_by", user.id)
    .order("created_at", { ascending: false })

  // Get application counts for each job
  const jobsWithStats = await Promise.all(
    (jobs || []).map(async (job) => {
      const { count: applicationCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", job.id)

      return {
        ...job,
        applicationCount: applicationCount || 0,
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType="hr" userName={profile.first_name} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
            <p className="text-gray-600">Manage your job listings</p>
          </div>
          <PostJobModal />
        </div>

        {jobsWithStats && jobsWithStats.length > 0 ? (
          <div className="space-y-6">
            {jobsWithStats.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <p className="text-gray-600 mt-1">
                        {job.company_name} • {job.location} • Posted {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={job.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{job.description.substring(0, 200)}...</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{job.applicationCount} Applications</span>
                      <span>•</span>
                      <span>{job.job_type}</span>
                      <span>•</span>
                      <span>{job.experience_level}</span>
                    </div>
                    {/* JobActionsClient should only show View Applications, Edit, and Close buttons */}
                    <JobActionsClient job={job} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <svg
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
              <p className="text-gray-500 mb-4">Create your first job posting to start receiving applications</p>
              <PostJobModal />
            </CardContent>  
          </Card>
        )}
      </div>
    </div>
  )
}