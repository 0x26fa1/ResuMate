// /app/api/analyze-resume/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeResumeFileWithGemini } from "@/lib/gemini-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { resumeId, fileName } = body as { resumeId?: string; fileName?: string }

    if (!resumeId || !fileName) {
      return NextResponse.json(
        { error: "Missing resumeId or fileName" },
        { status: 400 },
      )
    }

    // fetch resume row (we need file_url / storage_path)
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id, user_id, file_name, file_url, storage_path")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single()

    if (resumeError || !resume) {
      console.error("❌ Resume fetch error:", resumeError)
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    // dl file
    let buffer: Buffer
    let mimeType: string | null = null

    // pref file_url if avail
    if (resume.file_url) {
      console.log("📥 Fetching file via public URL:", resume.file_url)

      const fileResp = await fetch(resume.file_url)

      if (!fileResp.ok) {
        console.error("❌ Failed to fetch file via public URL:", fileResp.status, fileResp.statusText)
        return NextResponse.json(
          { error: "Failed to fetch resume file (public URL)" },
          { status: 500 },
        )
      }

      const arrayBuffer = await fileResp.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)

      mimeType = fileResp.headers.get("content-type")
    } else {
      // fallback: use storage_path in supabase
      const storagePath: string =
        (resume as any).storage_path ||
        `${resume.user_id}/${fileName}`

      console.log("📥 Fetching file from storage bucket:", storagePath)

      const { data: fileData, error: fetchError } = await supabase.storage
        .from("resumes")
        .download(storagePath)

      if (fetchError || !fileData) {
        console.error("❌ Failed to fetch file from storage:", fetchError)
        return NextResponse.json(
          { error: "Failed to fetch resume file from storage" },
          { status: 500 },
        )
      }

      const arrayBuffer = await fileData.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }

    // determine MIME type (fallbacks)
    const fileNameForMime =
      resume.file_name ||
      fileName ||
      (resume.storage_path ? resume.storage_path.split("/").pop() : "") ||
      "resume.pdf"

    const lower = fileNameForMime.toLowerCase()

    if (!mimeType) {
      mimeType =
        lower.endsWith(".pdf")
          ? "application/pdf"
          : lower.endsWith(".jpg") || lower.endsWith(".jpeg")
          ? "image/jpeg"
          : lower.endsWith(".png")
          ? "image/png"
          : "application/pdf"
    }

    console.log("🔍 Using MIME type:", mimeType)

    // gemini parse + analyze the file directly
    console.log("🤖 Starting Gemini analysis…")
    const analysis = await analyzeResumeFileWithGemini(buffer, mimeType)

    // save analysis back to DB
    const { data: updatedResume, error: updateError } = await supabase
      .from("resumes")
      .update({
        analysis_score: analysis.score,
        ats_compatible: analysis.atsCompatible,
        keywords: analysis.keywords,
        missing_keywords: analysis.missingKeywords,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        analysis_data: analysis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Database update error:", updateError)
      return NextResponse.json(
        { error: "Failed to save analysis results" },
        { status: 500 },
      )
    }

    console.log("💾 Analysis saved successfully")

    // respo for AnalysisModal
    return NextResponse.json({
      success: true,
      data: {
        resume: updatedResume,
        analysis,
      },
      message: "Resume analyzed successfully",
    })
  } catch (error) {
    console.error("❌ Analyze error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze resume" },
      { status: 500 },
    )
  }
}
