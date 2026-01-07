"use client"
import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface Props {
  triggerLabel?: string
}

export default function UploadResumeClient({ triggerLabel = "Upload" }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large (max 10MB)")
      return
    }

    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!allowed.includes(file.type)) {
      alert("Only PDF/DOC/DOCX allowed")
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("title", file.name)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }))
        alert(err.error || "Upload failed")
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      alert("Upload failed")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? "Uploading..." : triggerLabel}
      </Button>
    </>
  )
}