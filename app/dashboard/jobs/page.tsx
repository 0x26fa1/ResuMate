"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function JobsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)

  const [resumes, setResumes] = useState<any[]>([]) // load user resumes for selection
  const [selectedJobForApply, setSelectedJobForApply] = useState<any>(null) // job currently being applied to
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null) // chosen resume id for application

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) {
          window.location.href = "/auth/login"
          return
        }
        setUser(user)

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (!profileData || profileData.user_type !== "jobseeker") {
          window.location.href = "/auth/login"
          return
        }

        setProfile(profileData)

        // load user resumes so they can choose one when applying
        const { data: resumesData } = await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        setResumes(resumesData || []) // store resumes in state

        const { data: seeker } = await supabase
          .from("jobseeker_profiles")
          .select("technical_skills, soft_skills")
          .eq("id", user.id)
          .single()

        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })

        const technical: string[] = Array.isArray(seeker?.technical_skills)
          ? seeker.technical_skills
          : typeof seeker?.technical_skills === "string"
          ? seeker.technical_skills.split(",").map((s) => s.trim())
          : []

        const soft: string[] = Array.isArray(seeker?.soft_skills)
          ? seeker.soft_skills
          : typeof seeker?.soft_skills === "string"
          ? seeker.soft_skills.split(",").map((s) => s.trim())
          : []

        const allUserSkills = [...technical, ...soft]
          .filter(Boolean)
          .map((s: any) => String(s).toLowerCase())

        const updatedJobs = (jobsData || []).map((job: any) => {
          let score = 0
          let total = 0

          total++
          const jobSkills: string[] = Array.isArray(job.required_skills)
            ? job.required_skills.map((s: string) => s.toLowerCase())
            : typeof job.required_skills === "string"
            ? job.required_skills.split(",").map((s: string) => s.trim().toLowerCase())
            : []
          const matchedSkills = jobSkills.filter((s: string) =>
            allUserSkills.includes(s)
          )
          if (matchedSkills.length > 0) score++

          total++
          if (
            profileData.preferred_role &&
            job.title &&
            job.title.toLowerCase().includes(profileData.preferred_role.toLowerCase())
          )
            score++

          total++
          const workTypeArray: string[] = Array.isArray(profileData.work_type)
            ? profileData.work_type.map((s: string) => s.trim().toLowerCase())
            : typeof profileData.work_type === "string"
            ? profileData.work_type.split(",").map((s: string) => s.trim().toLowerCase())
            : []
          if (
            job.work_type &&
            workTypeArray.some((type: string) =>
              job.work_type.toLowerCase().includes(type)
            )
          )
            score++

          total++
          if (
            job.salary_min &&
            job.salary_max &&
            profileData.salary_min &&
            profileData.salary_max
          ) {
            const withinRange =
              job.salary_min >= profileData.salary_min * 0.9 &&
              job.salary_max <= profileData.salary_max * 1.1
            if (withinRange) score++
          }

          total++
          if (
            job.availability &&
            profileData.availability &&
            job.availability.toLowerCase() ===
              profileData.availability.toLowerCase()
          )
            score++

          const matchPercent = Math.round((score / total) * 100)
          return { ...job, matchPercent }
        })

        setJobs(updatedJobs)

        const { data: apps } = await supabase
          .from("applications")
          .select("job_id")
          .eq("user_id", user.id)

        setApplications(apps?.map((a) => a.job_id) || [])
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }

    fetchData()
  }, [])

  const handleOpenApply = (job: any) => {
    if (resumes.length === 0) {
      alert("You need to upload a resume on the Resumes page before applying.") // guard when no resumes exist
      return
    }
    setSelectedJobForApply(job) // open apply modal for selected job
    setSelectedResumeId(resumes[0]?.id ?? null) // preselect first resume by default
  }

  const handleConfirmApply = async () => {
    if (!user || !selectedJobForApply || !selectedResumeId) return // ensure all required data is present

    const selectedResume = resumes.find((r) => r.id === selectedResumeId) // find chosen resume in list
    const selectedResumeUrl = selectedResume?.file_url ?? null // use stored file_url if available

    const jobId = selectedJobForApply.id // shorthand for job id

    const { error: insertError } = await supabase
      .from("applications")
      .insert([
        {
          user_id: user.id,
          job_id: jobId,
          selected_resume_id: selectedResumeId, // store resume id in applications table
          selected_resume_url: selectedResumeUrl, // store resume url for hr to view
        },
      ])

    if (insertError) {
      console.error(insertError)
      alert("❌ Failed to apply.")
      return
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("applications_count")
      .eq("id", jobId)
      .single()

    await supabase
      .from("jobs")
      .update({ applications_count: (job?.applications_count || 0) + 1 })
      .eq("id", jobId)

    setApplications((prev) => [...prev, jobId]) // mark job as applied in local state
    setSelectedJobForApply(null) // close apply modal
    setSelectedResumeId(null) // reset selected resume
    alert("✅ Application submitted successfully.")
  }

  const handleCancel = async (jobId: string) => {
    if (!user) return

    const { error: deleteError } = await supabase
      .from("applications")
      .delete()
      .eq("user_id", user.id)
      .eq("job_id", jobId)

    if (deleteError) {
      alert("❌ Failed to cancel.")
      return
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("applications_count")
      .eq("id", jobId)
      .single()

    await supabase
      .from("jobs")
      .update({ applications_count: Math.max((job?.applications_count || 1) - 1, 0) })
      .eq("id", jobId)

    setApplications((prev) => prev.filter((id) => id !== jobId))
    alert("✅ Application canceled successfully.")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {profile && <DashboardNav userType="jobseeker" userName={profile.first_name} />}

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Job Matching</h1>
          <p className="text-gray-600">
            Find jobs that match your skills and preferences
          </p>
        </div>

        {jobs.length > 0 ? (
          <div className="space-y-6">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <p className="text-gray-600 mt-1">
                        {job.company_name} • {job.location} •{" "}
                        {job.salary_min && job.salary_max
                          ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                          : "Salary not specified"}
                      </p>
                    </div>
                    <Badge
                      className={`${
                        job.matchPercent >= 70
                          ? "bg-green-100 text-green-800"
                          : job.matchPercent >= 40
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {job.matchPercent}% Match
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    {String(job.description || "").substring(0, 200)}...
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.isArray(job.required_skills) &&
                      job.required_skills.slice(0, 4).map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                  </div>

                  <div className="flex space-x-3">
                    {applications.includes(job.id) ? (
                      <>
                        <Button disabled className="bg-gray-400 text-white">
                          Applied
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCancel(job.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleOpenApply(job)} // open resume selection modal instead of direct apply
                        disabled={resumes.length === 0} // disable apply when user has no resumes
                      >
                        Apply Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedJob(job)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No jobs available
              </h3>
              <p className="text-gray-500">
                Check back later for new job opportunities
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* job details modal (unchanged logic) */}
      {selectedJob && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedJob(null)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all scale-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {selectedJob.title}
            </h2>
            <p className="text-gray-500 mb-4">{selectedJob.company_name}</p>
            <p className="text-gray-700 leading-relaxed mb-6">
              {selectedJob.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {Array.isArray(selectedJob.required_skills) &&
                selectedJob.required_skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                className="px-6 py-2 rounded-lg hover:bg-gray-100"
                onClick={() => setSelectedJob(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* select resume modal for applying (new) */}
      {selectedJobForApply && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setSelectedJobForApply(null)
              setSelectedResumeId(null)
            }} // close on backdrop click and reset selection
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all scale-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Select a resume to apply
            </h2>
            <p className="text-gray-600 mb-4">
              Job: {selectedJobForApply.title}
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
              {resumes.map((resume) => (
                <label
                  key={resume.id}
                  className="flex items-center gap-3 p-2 rounded border cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="selectedResume"
                    value={resume.id}
                    checked={selectedResumeId === resume.id}
                    onChange={() => setSelectedResumeId(resume.id)} // update picked resume in state
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {resume.title || resume.file_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      Last updated:{" "}
                      {resume.updated_at
                        ? new Date(resume.updated_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedJobForApply(null)
                  setSelectedResumeId(null)
                }} // cancel apply flow
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmApply}
                disabled={!selectedResumeId} // prevent apply when no resume selected
              >
                Confirm Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
