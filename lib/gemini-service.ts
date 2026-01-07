// /lib/gemini-service.ts
import { GoogleGenerativeAI } from "@google/generative-ai"
import mammoth from "mammoth"

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[Gemini] GEMINI_API_KEY is not set. Analysis will fail until it is configured.",
  )
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export interface AnalysisResult {
  score: number
  atsCompatible: boolean
  keywords: string[]
  missingKeywords: string[]
  strengths: string[]
  improvements: string[]
  grammarIssues?: string[]
  formattingIssues?: string[]
  skills?: {
    technical: Array<{ name: string; level: string }>
    soft: Array<{ name: string; level: string }>
  }
  experienceQuality?: {
    score: number
    feedback: string
  }
}

const SYSTEM_PROMPT = `
You are "ResuMate", an AI resume assistant, ATS expert, and career coach.

You are given a candidate's resume (either as a file or as extracted plain text).
First, internally read and understand the resume (text, layout, sections).
Then return ONLY JSON in this exact schema:

{
  "score": number,                    // 0-100, overall resume quality
  "atsCompatible": boolean,           // true if resume is likely ATS-friendly
  "keywords": string[],               // important keywords actually present
  "missingKeywords": string[],        // high-value keywords that should be added
  "strengths": string[],              // 2-6 bullets describing what the resume does well
  "improvements": string[],           // 3-8 bullets with specific, actionable suggestions
  "grammarIssues": string[],          // list of grammar/clarity issues with explanation
  "formattingIssues": string[],       // list of ATS / formatting problems
  "skills": {
    "technical": Array<{ "name": string, "level": "Beginner" | "Intermediate" | "Advanced" }>,
    "soft": Array<{ "name": string, "level": "Beginner" | "Intermediate" | "Advanced" }>
  },
  "experienceQuality": {
    "score": number,                  // 0-100: how strong the experience section is
    "feedback": string                // short paragraph of feedback
  }
}

Rules:
- Always fill all top-level fields.
- If you have nothing for a list field, return [].
- "score", "experienceQuality.score" must be numbers between 0 and 100.
- "atsCompatible" must be a boolean.
- Make "strengths" and "improvements" specific to this resume.
- Return ONLY JSON. No Markdown, no extra text.
`

function fileToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  } as const
}
// for testing and if api is limit reached
// const PRIMARY_MODEL = "gemini-1.5-flash"
// const FALLBACK_MODEL = "gemini-1.5-flash"

// 2.0
// const PRIMARY_MODEL = "gemini-2.0-flash"
// const FALLBACK_MODEL = "gemini-2.0-flash"

// supported
const PRIMARY_MODEL = "gemini-2.5-flash"
const FALLBACK_MODEL = "gemini-2.5-flash-lite"

// lighter backup
// const PRIMARY_MODEL = "gemini-2.0-flash"
// const FALLBACK_MODEL = "gemini-2.0-flash-lite"

// light version as fallback
// const FALLBACK_MODEL = "gemini-2.5-flash-lite"
// const FALLBACK_MODEL = "gemini-flash-lite-latest"

function isOverloadedError(error: unknown): boolean {
  const err = error as any
  if (!err) return false

  const status = err.status ?? err.code ?? err.error_code
  const msg = (err.message || "").toString().toLowerCase()

  return status === 503 || msg.includes("overloaded") || msg.includes("service unavailable")
}

// ---- CALL HELPERS ----

// For PDF / image (supported mime types) – use file part
async function callModelWithFile(
  modelName: string,
  prompt: string,
  fileBuffer: Buffer,
  mimeType: string,
) {
  const model = genAI.getGenerativeModel({ model: modelName })
  const filePart = fileToGenerativePart(fileBuffer, mimeType)

  const result = await model.generateContent([prompt, filePart])
  const rawText = result.response.text().trim()

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error(`[Gemini] Raw response without JSON (model=${modelName}):`, rawText)
    throw new Error("Failed to extract JSON from Gemini response")
  }

  return JSON.parse(jsonMatch[0]) as AnalysisResult
}

// For DOCX / plain text – send text only
async function callModelWithText(
  modelName: string,
  prompt: string,
  resumeText: string,
) {
  const model = genAI.getGenerativeModel({ model: modelName })

  const fullPrompt = `
${prompt}

Here is the plain text of the resume:

---------------- RESUME TEXT START ----------------
${resumeText}
---------------- RESUME TEXT END ----------------
  `.trim()

  const result = await model.generateContent(fullPrompt)
  const rawText = result.response.text().trim()

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error(`[Gemini] Raw response without JSON (model=${modelName}):`, rawText)
    throw new Error("Failed to extract JSON from Gemini response")
  }

  return JSON.parse(jsonMatch[0]) as AnalysisResult
}

// helper: is this MIME suitable for inlineData file inpt?
function isInlineFileMime(mimeType: string): boolean {
  const lower = mimeType.toLowerCase()
  return (
    lower === "application/pdf" ||
    lower.startsWith("image/") // jpg, jpeg, png, etc.
  )
}

// ---- MAIN ENTRY ----

/**
 * Give it the resume file buffer (PDF / image / DOCX) + mimeType.
 * - PDF / images then Gemini reads file directly
 * - .docx we extract text with `mammoth` and send as plain text
 */
export async function analyzeResumeFileWithGemini(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<AnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const prompt = `
${SYSTEM_PROMPT}

Analyze the provided resume and respond with JSON only.
`.trim()

  const lowerMime = (mimeType || "").toLowerCase()
  const isDocx =
    lowerMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerMime.endsWith("officedocument.wordprocessingml.document")

  // aDOCX extract text with mammoth then use text-only model call ambot
  if (isDocx) {
    console.log("[Gemini] Detected DOCX file, extracting text with mammoth...")
    let resumeText = ""

    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      resumeText = result.value || ""
    } catch (err) {
      console.error("[Gemini] Failed to extract DOCX text:", err)
      throw new Error("Failed to extract text from DOCX resume")
    }

    if (!resumeText || resumeText.trim().length < 20) {
      throw new Error("DOCX resume does not contain enough readable text")
    }

    // retry with loop
    let lastError: unknown = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `[Gemini] Calling primary model ${PRIMARY_MODEL} (text mode), attempt ${attempt}`,
        )
        const parsed = await callModelWithText(PRIMARY_MODEL, prompt, resumeText)
        return normalizeAnalysis(parsed)
      } catch (error) {
        lastError = error
        if (isOverloadedError(error)) {
          console.warn(
            `[Gemini] Primary model overloaded on attempt ${attempt} (text). Retrying...`,
          )
          await new Promise((r) => setTimeout(r, attempt * 500))
          continue
        }
        console.error("[Gemini] Non-retryable error on primary model (text):", error)
        throw error
      }
    }

    // fallback model with text if still overloaded
    try {
      console.warn(
        `[Gemini] Falling back to model ${FALLBACK_MODEL} after overloads (text mode)`,
      )
      const parsed = await callModelWithText(FALLBACK_MODEL, prompt, resumeText)
      return normalizeAnalysis(parsed)
    } catch (fallbackError) {
      console.error("[Gemini] Fallback model also failed (text):", fallbackError)
      throw new Error(
        "All Gemini models are currently unavailable or overloaded. Please try again in a bit.",
      )
    }
  }

  // PDF / images file input via inlineData
  if (isInlineFileMime(lowerMime)) {
    let lastError: unknown = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `[Gemini] Calling primary model ${PRIMARY_MODEL} (file mode), attempt ${attempt}`,
        )
        const parsed = await callModelWithFile(
          PRIMARY_MODEL,
          prompt,
          fileBuffer,
          mimeType,
        )
        return normalizeAnalysis(parsed)
      } catch (error) {
        lastError = error
        if (isOverloadedError(error)) {
          console.warn(
            `[Gemini] Primary model overloaded on attempt ${attempt} (file). Retrying...`,
          )
          await new Promise((r) => setTimeout(r, attempt * 500))
          continue
        }
        console.error("[Gemini] Non-retryable error on primary model (file):", error)
        throw error
      }
    }

    try {
      console.warn(
        `[Gemini] Falling back to model ${FALLBACK_MODEL} after overloads (file mode)`,
      )
      const parsed = await callModelWithFile(
        FALLBACK_MODEL,
        prompt,
        fileBuffer,
        mimeType,
      )
      return normalizeAnalysis(parsed)
    } catch (fallbackError) {
      console.error("[Gemini] Fallback model also failed (file):", fallbackError)
      throw new Error(
        "All Gemini models are currently unavailable or overloaded. Please try again in a bit.",
      )
    }
  }

  // any other mime type try treating buffer as UTF-8 text
  console.warn(
    `[Gemini] Unsupported file mime for inline mode (${mimeType}). Treating as UTF-8 text.`,
  )
  const text = fileBuffer.toString("utf8")

  if (!text || text.trim().length < 20) {
    throw new Error("File does not contain enough text to analyze")
  }

  const parsed = await callModelWithText(PRIMARY_MODEL, prompt, text)
  return normalizeAnalysis(parsed)
}

function normalizeAnalysis(parsed: AnalysisResult): AnalysisResult {
  return {
    score: typeof parsed.score === "number" ? parsed.score : 0,
    atsCompatible:
      typeof parsed.atsCompatible === "boolean" ? parsed.atsCompatible : false,
    keywords: parsed.keywords ?? [],
    missingKeywords: parsed.missingKeywords ?? [],
    strengths: parsed.strengths ?? [],
    improvements: parsed.improvements ?? [],
    grammarIssues: parsed.grammarIssues ?? [],
    formattingIssues: parsed.formattingIssues ?? [],
    skills:
      parsed.skills ??
      ({
        technical: [],
        soft: [],
      } as any),
    experienceQuality:
      parsed.experienceQuality ??
      ({
        score: 0,
        feedback: "",
      } as any),
  }
}
