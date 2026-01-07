"use client"

import { useMemo, useState } from "react"
import CandidateTabs from "./CandidateTabs"
import CandidateList from "./CandidateList"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Candidate = {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  location?: string
  jobTitle: string
  appliedDate: string
  matchScore?: number
  status: string
  resumeUrl?: string
  interviewDate?: string | null
  interviewStatus?: string | null
  recruiterNotes?: string | null
  recruiterName?: string
  recruiterRole?: string
  recruiterEmail?: string
  recruiterPhone?: string
  contactStatus?: string | null   // ✅ applicant response
  resume_analysis_summary?: string | null
  suggestions?: { text: string; severity?: string }[]
  technicalSkills?: string[]      // ✅ added
  yearsExperience?: number        // ✅ added
}

export default function CandidatePageClient({
  candidates,
}: {
  candidates: Candidate[]
}) {
  const [candidateList, setCandidateList] = useState<Candidate[]>(candidates)
  const [activeStatus, setActiveStatus] = useState<string>("all")

  const supabase = createClient()
  const router = useRouter()

  // Counts per application status
  const counts = useMemo(() => {
    return candidateList.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [candidateList])

  // Counts per interview status
  const interviewCounts = useMemo(() => {
    return candidateList.reduce((acc, c) => {
      if (c.interviewStatus) {
        acc[c.interviewStatus] = (acc[c.interviewStatus] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  }, [candidateList])

  // Optimistic update handler + backend sync
  const handleStatusUpdate = async (
    id: string,
    newStatus: string,
    interviewDate?: string | null,
    interviewStatus?: string | null,
    recruiterNotes?: string | null,
    contactStatus?: string | null
  ) => {
    const validStatuses = [
      "applied",
      "under_review",
      "shortlisted",
      "interview_scheduled",
      "interviewed",
      "offer_extended",
      "hired",
      "rejected",
    ]
    const safeStatus = validStatuses.includes(newStatus) ? newStatus : "under_review"

    // ✅ Optimistic frontend update
    setCandidateList(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              status: safeStatus,
              interviewDate:
                ["applied", "under_review", "shortlisted"].includes(newStatus)
                  ? null
                  : interviewDate ?? c.interviewDate,
              interviewStatus:
                ["applied", "under_review", "shortlisted"].includes(newStatus)
                  ? null
                  : interviewStatus ?? c.interviewStatus,
              recruiterNotes: recruiterNotes ?? c.recruiterNotes,
              // ✅ reset contactStatus when leaving Offers
              contactStatus:
                newStatus === "applied"
                  ? "pending"
                  : ["under_review", "shortlisted"].includes(newStatus)
                  ? null
                  : contactStatus ?? c.contactStatus,
              resume_analysis_summary: c.resume_analysis_summary,
              suggestions: c.suggestions,
              technicalSkills: c.technicalSkills,   // ✅ keep skills
              yearsExperience: c.yearsExperience,   // ✅ keep years exp
            }
          : c
      )
    )

    // ✅ Backend update
    const updatePayload: any = { status: safeStatus }
    if (recruiterNotes) updatePayload.recruiter_notes = recruiterNotes
    if (interviewDate) updatePayload.interview_date = interviewDate
    if (interviewStatus) updatePayload.interview_status = interviewStatus

    // ✅ persist contact_status correctly
    if (safeStatus === "applied") {
      updatePayload.contact_status = "pending"
    } else if (safeStatus === "offer_extended") {
      updatePayload.contact_status = contactStatus ?? "invite_sent"
    } else if (safeStatus === "hired") {
      updatePayload.contact_status = "accepted"
    } else if (safeStatus === "rejected") {
      updatePayload.contact_status = "declined"
    } else {
      updatePayload.contact_status = null
    }

    const { error } = await supabase
      .from("applications")
      .update(updatePayload)
      .eq("id", id)

    if (error) {
      console.error("Error updating application:", error)
      return
    }

    router.refresh()
  }

  // Filter candidates by active tab
  const filtered = useMemo(() => {
    if (activeStatus.startsWith("interviewFilter:")) {
      const status = activeStatus.replace("interviewFilter:", "")
      return candidateList.filter((c) => c.interviewStatus === status)
    }

    switch (activeStatus) {
      case "all":
        return candidateList
      case "to_review":
        return candidateList.filter((c) =>
          ["applied", "under_review"].includes(c.status)
        )
      case "shortlisted":
        return candidateList.filter((c) => c.status === "shortlisted")
      case "interviews":
        return candidateList.filter((c) =>
          ["interview_scheduled", "interviewed"].includes(c.status)
        )
      case "offers":
        return candidateList.filter((c) => c.status === "offer_extended")
      case "hired":
        return candidateList.filter((c) => c.status === "hired")
      case "rejected":
        return candidateList.filter((c) => c.status === "rejected")
      default:
        return candidateList
    }
  }, [activeStatus, candidateList])

  return (
    <>
      <CandidateTabs
        counts={counts}
        interviewCounts={interviewCounts}
        onStatusChange={setActiveStatus}
        onInterviewFilter={(status) => setActiveStatus("interviewFilter:" + status)}
      />
      {filtered.length > 0 ? (
        <CandidateList
          candidates={filtered}
          onStatusUpdate={handleStatusUpdate}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates</h3>
            <p className="text-gray-500">
              No applications found for this filter
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
