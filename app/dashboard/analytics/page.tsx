//app/dashboard/analytics/page.tsx  
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Award, Target, AlertCircle } from "lucide-react"

export default async function AnalyticsPage() {
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

  if (!profile || profile.user_type !== "jobseeker") {
    redirect("/auth/login")
  }

  // ✅ Determine if user is PREMIUM or FREE
  const isPremium =
    profile?.is_premium === true ||
    profile?.subscription_status === "active" ||
    profile?.subscription_plan === "premium"

  // Fetch resumes
  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  const analyzedResumes = resumes?.filter(r => r.analysis_score !== null) || []
  const latestResume = analyzedResumes[analyzedResumes.length - 1]

  // Average Score
  const avgScore =
    analyzedResumes.length > 0
      ? Math.round(
          analyzedResumes.reduce(
            (sum, r) => sum + (r.analysis_score || 0),
            0
          ) / analyzedResumes.length
        )
      : 0

  // Skills
  const skills = latestResume?.analysis_data?.skills || { technical: [], soft: [] }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType="jobseeker" userName={profile.first_name} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Resume Analytics</h1>
          <p className="text-gray-600">
            Track your resume performance and improvement over time
          </p>
        </div>

        {analyzedResumes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Analysis Data Yet
              </h3>
              <p className="text-gray-500">
                Upload a resume and run the AI analysis to see your analytics
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* AVG SCORE */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgScore}%</div>
                  <p className="text-xs text-muted-foreground">
                    Across {analyzedResumes.length} resume
                    {analyzedResumes.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              {/* LATEST SCORE */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latestResume?.analysis_score || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {latestResume?.title || "N/A"}
                  </p>
                </CardContent>
              </Card>

              {/* ATS COMPATIBLE — BLURRED FOR FREE USERS */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ATS Compatible</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      !isPremium ? "blur-text" : ""
                    }`}
                  >
                    {latestResume?.ats_compatible ? "Yes" : "No"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Latest resume status
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SCORE TRENDS */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyzedResumes.length > 1 ? (
                    <div className="space-y-4">
                      {analyzedResumes.map((resume, idx) => (
                        <div key={resume.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium truncate max-w-[200px]">
                              {idx + 1}. {resume.title}
                            </span>
                            <span
                              className={`font-semibold ${
                                (resume.analysis_score || 0) >= 80
                                  ? "text-green-600"
                                  : (resume.analysis_score || 0) >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {resume.analysis_score}%
                            </span>
                          </div>
                          <Progress
                            value={resume.analysis_score || 0}
                            className={
                              (resume.analysis_score || 0) >= 80
                                ? "bg-green-100 [&>div]:bg-green-600"
                                : (resume.analysis_score || 0) >= 60
                                ? "bg-yellow-100 [&>div]:bg-yellow-600"
                                : "bg-red-100 [&>div]:bg-red-600"
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <p>Upload and analyze more resumes to see trends</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SKILL ANALYSIS */}
              <Card>
                <CardHeader>
                  <CardTitle>Skill Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.technical.length > 0 || skills.soft.length > 0 ? (
                    <div className="space-y-6">
                      {/* TECHNICAL SKILLS */}
                      {skills.technical.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 text-sm text-gray-700">
                            Technical Skills
                          </h4>
                          <div className="space-y-3">
                            {skills.technical.slice(0, 5).map((skill: any, idx: number) => {
                              const level =
                                skill.level === "Advanced"
                                  ? 90
                                  : skill.level === "Intermediate"
                                  ? 70
                                  : 50
                              return (
                                <div key={idx}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700">
                                      {skill.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {skill.level}
                                    </span>
                                  </div>
                                  <Progress value={level} className="h-2" />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* SOFT SKILLS */}
                      {skills.soft.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 text-sm text-gray-700">
                            Soft Skills
                          </h4>
                          <div className="space-y-3">
                            {skills.soft.slice(0, 5).map((skill: any, idx: number) => {
                              const level =
                                skill.level === "Advanced"
                                  ? 90
                                  : skill.level === "Intermediate"
                                  ? 70
                                  : 50
                              return (
                                <div key={idx}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700">
                                      {skill.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {skill.level}
                                    </span>
                                  </div>
                                  <Progress value={level} className="h-2" />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <p>No skill data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* KEYWORDS — BLUR FOR FREE USERS */}
              {latestResume?.keywords && latestResume.keywords.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Keywords Found in Latest Resume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {latestResume.keywords.map((keyword: string, idx: number) => (
                        <span
                          key={idx}
                          className={`px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm ${
                            !isPremium ? "blur-text" : ""
                          }`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    {latestResume.missing_keywords &&
                      latestResume.missing_keywords.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2 text-sm text-gray-700">
                            Recommended Keywords to Add
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {latestResume.missing_keywords.map((keyword: string, idx: number) => (
                              <span
                                key={idx}
                                className={`px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm ${
                                  !isPremium ? "blur-text" : ""
                                }`}
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
