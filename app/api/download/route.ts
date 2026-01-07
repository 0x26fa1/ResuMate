import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // ✅ cookies() IS ASYNC IN YOUR NEXT VERSION
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get resume ID
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return new NextResponse("Resume ID is required", { status: 400 })
    }

    // Fetch resume
    const { data: resume, error } = await supabase
      .from("resumes")
      .select("file_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error || !resume?.file_url) {
      return new NextResponse("Resume not found", { status: 404 })
    }

    // Public file → redirect directly
    if (resume.file_url.startsWith("http")) {
      return NextResponse.redirect(resume.file_url)
    }

    // Extract storage path
    const storagePath = resume.file_url.split("/resumes/")[1]
    if (!storagePath) {
      return new NextResponse("Invalid storage path", { status: 500 })
    }

    // Signed URL
    const { data, error: signedError } = await supabase.storage
      .from("resumes")
      .createSignedUrl(storagePath, 60 * 60)

    if (signedError || !data?.signedUrl) {
      return new NextResponse("Failed to generate download URL", { status: 500 })
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (err) {
    console.error("❌ Download route error:", err)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
