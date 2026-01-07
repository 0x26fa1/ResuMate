import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Upload endpoint called")
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF, DOC, and DOCX allowed" }, { status: 400 })
    }

    // Generate unique file name
    const timestamp = Date.now()
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${timestamp}-${file.name}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("resumes").upload(fileName, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message || "Failed to upload file" }, { status: 500 })
    }

    // Get public URL (if bucket is public) or signed URL (if private)
    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(fileName)

    // Save resume metadata to database
    const { data: resumeData, error: dbError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        title: title || file.name,
        file_name: file.name,
        file_path: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
      // Try to clean up uploaded file
      await supabase.storage.from("resumes").remove([fileName])
      return NextResponse.json({ error: dbError.message || "Failed to save resume data" }, { status: 500 })
    }

    try {
      console.log("Triggering analysis for resume:", resumeData.id)
      const analysisUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/analyze-resume`
      const analysisResponse = await fetch(analysisUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: resumeData.id,
          fileUrl: resumeData.file_url,
          fileType: resumeData.file_type,
          fileName: resumeData.file_path,
        }),
      })

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text()
        console.error("Analysis request failed:", analysisResponse.status, errorText)
      } else {
        console.log("Analysis triggered successfully")
      }
    } catch (analysisError) {
      console.error("Failed to trigger analysis:", analysisError)
    }

    return NextResponse.json({
      success: true,
      data: resumeData,
      message: "Resume uploaded successfully. Analysis in progress...",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
