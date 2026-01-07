// app/dashboard/resumes/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UploadResumeClient from "./UploadResumeClient"
import ResumeCard from "./ResumeCard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Crown } from "lucide-react"
import Link from "next/link"

const FREE_PLAN_UPLOAD_LIMIT = 5

export default async function ResumesPage() {
  const supabase = await createClient()

  let user = null
  let profile = null
  let resumes = null
  let error = null

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`)
    user = userData.user
    if (!user) redirect("/auth/login")

    // load profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) throw new Error(`Profile error: ${profileError.message}`)
    profile = profileData

    // restrict access
    if (!profile || (profile.user_type !== "jobseeker" && profile.user_type !== "admin")) {
      redirect("/auth/login")
    }

    // load resumes
    const { data: resumesData, error: resumesError } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (resumesError) throw new Error(`Failed to load resumes: ${resumesError.message}`)

    resumes = resumesData

  } catch (err) {
    error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("ResumesPage error:", err)
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Error Loading Page</h2>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canUpload = profile && (profile.user_type === "jobseeker" || profile.user_type === "admin")

  const isPremium = profile?.is_premium === true || profile?.user_type === "admin" 
  // changed - using profile.is_premium boolean

  const resumeCount = resumes?.length || 0
  const hasReachedLimit = !isPremium && resumeCount >= FREE_PLAN_UPLOAD_LIMIT
  const remainingUploads = isPremium ? null : Math.max(0, FREE_PLAN_UPLOAD_LIMIT - resumeCount)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType={profile.user_type} userName={profile.first_name} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* page header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
            <p className="text-gray-600">
              Manage and analyze your resumes
              {!isPremium && (
                <span className="ml-2 text-sm text-gray-500">
                  ({resumeCount}/{FREE_PLAN_UPLOAD_LIMIT} uploads used)
                </span>
              )}
            </p>
          </div>

          {canUpload && !hasReachedLimit && (
            <UploadResumeClient triggerLabel="Upload Resume" />
          )}
        </div>

        {/* upgrade notice if needed */}
        {!isPremium && hasReachedLimit && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Crown className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Upload Limit Reached</p>
                <p className="text-sm text-blue-700">
                  You've used all {FREE_PLAN_UPLOAD_LIMIT} resume uploads on the free plan.
                  Upgrade to Premium for unlimited uploads and advanced features.
                </p>
              </div>
              <Button asChild className="ml-4 bg-blue-600 hover:bg-blue-700">
                <Link href="/dashboard/subscription">Upgrade Now</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* warning when close to upload limit */}
        {!isPremium && !hasReachedLimit && remainingUploads !== null && remainingUploads <= 2 && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <p className="text-sm text-yellow-800">
                You have {remainingUploads} upload{remainingUploads !== 1 ? "s" : ""} remaining on the free plan.{" "}
                <Link href="/dashboard/subscription" className="underline font-medium text-yellow-900 hover:text-yellow-950">
                  Upgrade to Premium
                </Link>{" "}
                for unlimited uploads.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {resumes && resumes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {resumes.map((resume) => (
              <ResumeCard 
                key={resume.id}
                resume={resume}
                canUpload={canUpload}
                canModify={isPremium} 
                isPremium={isPremium} // added - pass to card
              />
            ))}

            {/* upload card */}
            {canUpload && !hasReachedLimit && (
              <Card className="border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-500 transition-colors cursor-pointer">
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">Upload a new resume</p>
                  <UploadResumeClient triggerLabel="Choose File" />
                </CardContent>
              </Card>
            )}

          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
              {canUpload && <UploadResumeClient triggerLabel="Upload Resume" />}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
