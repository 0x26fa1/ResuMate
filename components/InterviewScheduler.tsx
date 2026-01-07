"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

type InterviewSchedulerProps = {
  candidateName: string
  candidateId: string // application id
  onSchedule?: (date: string) => void // callback to update parent state
}

export default function InterviewScheduler({ candidateName, candidateId, onSchedule }: InterviewSchedulerProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSchedule = async () => {
    if (!date || !time) return
    setLoading(true)

    const supabase = createClient()
    const scheduledAt = new Date(`${date}T${time}`)

    const { error } = await supabase
      .from("applications")
      .update({
        status: "interview_scheduled",          // 🔄 move to Interviews tab
        interview_date: scheduledAt.toISOString(),
        interview_status: "scheduled",
      })
      .eq("id", candidateId)

    setLoading(false)
    if (error) {
      console.error("Error scheduling interview:", error)
    } else {
      setOpen(false)
      // 🔄 notify parent (CandidateCard) for optimistic update
      onSchedule?.(scheduledAt.toISOString())
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Schedule Interview
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Candidate: {candidateName}</p>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <Button onClick={handleSchedule} disabled={!date || !time || loading}>
              {loading ? "Scheduling..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
