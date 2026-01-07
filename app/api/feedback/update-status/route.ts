// app/api/feedback/update-status/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request) {
    console.log("🔵 Feedback update API called")
    
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        console.log("👤 User:", user?.id)

        // Security check - admin only
        if (!user) {
            console.log("❌ No user found")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", user.id)
            .single()

        console.log("👔 Profile:", profile)

        if (!profile || profile.user_type !== "admin") {
            console.log("❌ Not an admin")
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // Get request body
        const body = await request.json()
        const { feedbackId, status } = body

        console.log("📝 Request body:", { feedbackId, status })

        if (!feedbackId || !status) {
            console.log("❌ Missing data")
            return NextResponse.json({ error: "Missing feedbackId or status" }, { status: 400 })
        }

        // Validate status value
        const validStatuses = ["Under Review", "In Progress", "Resolved", "Closed"]
        if (!validStatuses.includes(status)) {
            console.log("❌ Invalid status:", status)
            return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
        }

        // Update the feedback status
        const { data, error } = await supabase
            .from("feedback_suggestions")
            .update({ status })
            .eq("id", feedbackId)
            .select()
            .single()

        if (error) {
            console.error("❌ Supabase update error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log("✅ Update successful:", data)
        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error("❌ API error:", error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal server error" 
        }, { status: 500 })
    }
}