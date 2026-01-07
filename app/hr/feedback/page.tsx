'use client'

import { useState, useEffect, FormEvent } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardNav } from "@/components/dashboard-nav"

type Feedback = {
  id?: number
  user_id: string
  subject: string
  description: string 
  detailed_explanation: string 
  feedback_type: string
  priority: string
  status: string | null
  created_at: string
}

type Profile = {
  id: string
  first_name: string
  user_type: string
}

export default function FeedbackPage() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [message, setMessage] = useState("")

  // ✅ Fetch user, profile, and feedbacks
  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData?.user
      if (!currentUser) return

      setUser(currentUser)

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single()

      if (profileData) setProfile(profileData)

      // Fetch feedbacks
      const { data: fbData } = await supabase
        .from("feedback_suggestions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })

      if (fbData) setFeedbacks(fbData as Feedback[])
    }

    fetchData()
  }, [supabase])

  // 🚀 Handle feedback submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")
    
    if (!user) {
      setMessage("❌ User not logged in.")
      return
    }
    
    const formData = new FormData(e.currentTarget)
    
    const subject = formData.get("subject") as string
    const description = formData.get("description") as string
    const feedback_type = formData.get("feedback_type") as string
    const priority = formData.get("priority") as string
    
    const newFeedback = {
      user_id: user.id,
      subject: subject,
      detailed_explanation: description || "No detailed explanation provided.",
      feedback_type: feedback_type,
      priority: priority,
      created_at: new Date().toISOString(),
      status: "Under Review",
      description: description,
    }

    const { data, error } = await supabase
      .from("feedback_suggestions")
      .insert([newFeedback])
      .select()

    if (error) {
      console.error("Supabase insert error:", JSON.stringify(error, null, 2))
      setMessage("❌ Error submitting feedback.")
    } else if (data && data.length > 0) {
      setMessage("✅ Feedback submitted successfully!")
      setFeedbacks((prev) => [data[0] as Feedback, ...prev])
      
      if (e.currentTarget) {
        e.currentTarget.reset()
      }
    }
  }

  const userType = (profile?.user_type || "jobseeker") as "admin" | "jobseeker" | "hr"
  const feedbackTypes = userType === "hr" 
    ? ["General Feedback", "Bug Report"]
    : ["Feature Request", "Bug Report", "General Feedback"]

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType={userType} userName={profile?.first_name || ""} />

      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Feedback & Suggestions
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ✅ Submit Feedback Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Feedback Type
                  </label>
                  <select
                    name="feedback_type"
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
                    required
                  >
                    {feedbackTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    name="priority"
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    placeholder="Brief description"
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Please provide detailed information..."
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-2 h-32"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
                >
                  Submit Feedback
                </button>

                {message && (
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* ✅ Feedback History */}
          <Card>
            <CardHeader>
              <CardTitle>Your Feedback History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedbacks.length > 0 ? (
                feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className={`p-4 rounded-lg border ${
                      fb.status === "Resolved"
                        ? "border-green-200 bg-green-50"
                        : fb.status === "In Progress"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {fb.subject}
                      </h3>
                      <Badge
                        className={`${
                          fb.status === "Resolved"
                            ? "bg-green-500"
                            : fb.status === "In Progress"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        } text-white`}
                      >
                        {fb.status || "Under Review"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {fb.feedback_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {fb.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-sm mb-1">
                      {fb.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(fb.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  No feedback submitted yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}