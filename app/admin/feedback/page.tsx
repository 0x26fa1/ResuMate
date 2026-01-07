// app/admin/feedback/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { FeedbackCard } from "@/components/FeedbackCard"

// Type definition for feedback (including the sender's name)
type FeedbackWithSender = {
    id: number
    user_id: string
    subject: string
    description: string
    detailed_explanation: string
    feedback_type: string
    priority: string
    status: string | null
    created_at: string
    sender_name?: string
}

export default async function AdminFeedbackPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Security Check (Admin Role required)
    if (!user) redirect("/auth/login")
    const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, user_type")
        .eq("id", user.id)
        .single()
    
    if (!profile || profile.user_type !== "admin") redirect("/auth/login")

    // 2. Fetch ALL Feedback
    const { data: rawFeedbacks, error } = await supabase
        .from("feedback_suggestions")
        .select(`
            id, 
            user_id, 
            subject, 
            description, 
            detailed_explanation, 
            feedback_type, 
            priority, 
            status, 
            created_at
        `)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Admin Feedback Fetch Error:", error.message)
        return (
            <div className="p-8 text-center text-red-600">
                Error loading feedback. Please check RLS policy.
            </div>
        )
    }

    // 3. Fetch Sender Names Separately
    let feedbacks: FeedbackWithSender[] = rawFeedbacks || []

    if (feedbacks.length > 0) {
        const userIds = [...new Set(feedbacks.map(fb => fb.user_id))]
        
        const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, first_name, user_type")
            .in("id", userIds)

        const profileMap = profilesData?.reduce((acc, p) => {
            acc[p.id] = `${p.first_name || 'Unknown'} (${p.user_type})`
            return acc
        }, {} as { [key: string]: string }) || {}

        feedbacks = feedbacks.map(fb => ({
            ...fb,
            sender_name: profileMap[fb.user_id] || `ID: ${fb.user_id}`
        }))
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav userType="admin" userName={profile.first_name} />
            <div className="max-w-6xl mx-auto py-10 px-6">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">
                    Admin Feedback Management
                </h1>

                {feedbacks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {feedbacks.map((fb) => (
                            <FeedbackCard key={fb.id} feedback={fb} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">No feedback submissions yet.</p>
                )}
            </div>
        </div>
    )
}