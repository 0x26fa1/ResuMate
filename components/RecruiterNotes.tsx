"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type RecruiterNotesProps = {
  candidateId: string
  existingNotes?: string | null
}

export default function RecruiterNotes({ candidateId, existingNotes }: RecruiterNotesProps) {
  const [notes, setNotes] = useState(existingNotes || "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("applications")
      .update({ recruiter_notes: notes })
      .eq("id", candidateId)

    setSaving(false)
    if (error) {
      console.error("Error saving recruiter notes:", error)
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add recruiter feedback after interview..."
        rows={4}
      />
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Notes"}
      </Button>
    </div>
  )
}
