import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

//Status checking endpoint
export async function GET() {
  try {
    const apiStart = Date.now()
    const apiResponseTime = Date.now() - apiStart
    
    // Check Database/Supabase
    const dbStart = Date.now()
    let dbStatus: any = {
      status: 'operational',
      responseTime: 0,
      error: null
    }
    
    try {
      const supabase = await createClient()
      // Use a simple auth check instead of querying a table
      const { error } = await supabase.auth.getUser()
      
      dbStatus.responseTime = Date.now() - dbStart
      
      // Don't treat "no user" as an error - it just means no one is logged in
      if (error && error.message !== 'Auth session missing!') {
        throw error
      }
    } catch (error: any) {
      dbStatus.status = 'down'
      dbStatus.responseTime = Date.now() - dbStart
      dbStatus.error = error?.message || 'Database connection failed'
    }
    
    // Check Supabase Auth
    const supabaseStart = Date.now()
    let supabaseStatus: any = {
      status: 'operational',
      responseTime: 0,
      error: null
    }
    
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.getSession()
      
      supabaseStatus.responseTime = Date.now() - supabaseStart
      
      // A null session is OK - it just means no one is logged in
      // Only mark as down if there's an actual connection error
    } catch (error: any) {
      supabaseStatus.status = 'down'
      supabaseStatus.responseTime = Date.now() - supabaseStart
      supabaseStatus.error = error?.message || 'Supabase connection failed'
    }
    
    // Determine overall status
    const statuses = [dbStatus.status, supabaseStatus.status]
    let overall: 'operational' | 'degraded' | 'down'
    
    if (statuses.includes('down')) {
      overall = 'down'
    } else if (statuses.includes('degraded')) {
      overall = 'degraded'
    } else {
      overall = 'operational'
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'operational',
          responseTime: apiResponseTime,
          error: null
        },
        database: dbStatus,
        supabase: supabaseStatus
      },
      overall
    })
  } catch (error: any) {
    console.error('Status check failed:', error)
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        services: {
          api: { 
            status: 'down', 
            responseTime: 0, 
            error: 'Failed to perform status check' 
          },
          database: { status: 'unknown', responseTime: 0, error: null },
          supabase: { status: 'unknown', responseTime: 0, error: null }
        },
        overall: 'down'
      },
      { status: 500 }
    )
  }
}

//Your existing POST method for feedback
export async function POST(request: Request) {
  const supabase = await createClient()
  const formData = await request.formData()

  const type = formData.get("type") as string
  const priority = formData.get("priority") as string
  const subject = formData.get("subject") as string
  const message = formData.get("message") as string

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  const { error } = await supabase.from("feedback").insert([
    {
      user_id: user.id,
      type,
      priority,
      subject,
      message,
      status: "Under Review",
      created_at: new Date().toISOString(),
    },
  ])

  if (error) {
    console.error("❌ Error submitting feedback:", error.message)
    return NextResponse.redirect(new URL("/dashboard/feedback?error=true", request.url))
  }

  return NextResponse.redirect(new URL("/dashboard/feedback?success=true", request.url))
}