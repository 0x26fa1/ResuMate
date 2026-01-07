"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import AnalysisModal from "@/components/analysis-modal"

interface Resume {
  id: string
  title: string
  file_name?: string
  storage_path?: string
  file_url?: string | null
  user_id: string
  analysis_score?: number
  ats_compatible?: boolean
  updated_at?: string
}

export default function ResumeCard({
  resume,
  canUpload,
  canModify = true,
  isPremium,
}: {
  resume: Resume
  canUpload: boolean
  canModify?: boolean
  isPremium: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
  })

  const fileName =
    resume.file_name ||
    resume.storage_path?.split("/").pop() ||
    resume.title

  // DOWNLOAD HANDLER
  function handleDownload() {
    if (!resume.id) {
      alert("Missing resume ID")
      return
    }

    //browser navigation, not fetch()
    window.location.href = `/api/download?id=${resume.id}`
  }

  async function handleRename() {
    const newName = prompt("Rename file to:", resume.title)
    if (!newName || newName === resume.title) return

    setBusy(true)
    try {
      const res = await fetch("/api/rename", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: resume.id, title: newName }),
        credentials: "include",
      })

      if (!res.ok) {
        alert("Rename failed")
      } else {
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${resume.title}"? This cannot be undone.`)) return

    setBusy(true)
    try {
      await fetch("/api/deletes", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: resume.id }),
        credentials: "include",
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg truncate">{resume.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            {/* Analysis */}
            <AnalysisModal
              resumeId={resume.id}
              fileName={fileName}
              existingScore={resume.analysis_score}
              isPremium={isPremium}
            >
              <Button className="flex-1" size="sm">
                View Analysis
              </Button>
            </AnalysisModal>

            {/* DOWNLOAD */}
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDownload}
            >
              Download
            </Button>
          </div>

          {canUpload && (
            <div className="flex space-x-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleRename}
                disabled={busy}
              >
                Rename
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={handleDelete}
                disabled={busy || !canModify}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
