"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ResumeModalProps = {
  resumeUrl?: string
  candidateName: string
  candidateId: string
  onStatusUpdate?: (id: string, newStatus: string) => void
  shouldUpdateOnOpen?: boolean
}

export default function ResumeModal({
  resumeUrl,
  candidateName,
  candidateId,
  onStatusUpdate,
  shouldUpdateOnOpen = false,
}: ResumeModalProps) {
  const [open, setOpen] = useState(false)

  if (!resumeUrl) {
    return (
      <Button size="sm" disabled>
        Resume Unavailable
      </Button>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen && shouldUpdateOnOpen) {
          // 🔄 Always pass the literal string "under_review"
          onStatusUpdate?.(candidateId, "under_review")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Resume
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{candidateName}'s Resume</DialogTitle>
        </DialogHeader>

        <iframe
          src={resumeUrl}
          className="w-full h-[600px] border rounded"
        />
      </DialogContent>
    </Dialog>
  )
}
