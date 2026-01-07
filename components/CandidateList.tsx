"use client"

import CandidateCard from "./CandidateCard"

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
  resume_analysis_summary?: string | null
  suggestions?: { text: string; severity?: string }[]
  interviewDate?: string | null
  interviewStatus?: string | null
  recruiterNotes?: string | null
  recruiterName?: string
  recruiterRole?: string
  recruiterEmail?: string
  recruiterPhone?: string
  contactStatus?: string | null   // ✅ matches CandidateCard
  technicalSkills?: string[]      // ✅ added
  yearsExperience?: number        // ✅ added
}

export default function CandidateList({
  candidates,
  onStatusUpdate,
}: {
  candidates: Candidate[]
  onStatusUpdate: (
    id: string,
    newStatus: string,
    interviewDate?: string | null,
    interviewStatus?: string | null,
    recruiterNotes?: string | null,
    contactStatus?: string | null
  ) => void
}) {
  return (
    <div className="space-y-6">
      {candidates.map((c) => (
        <CandidateCard
          key={c.id}
          id={c.id}
          firstName={c.firstName}
          lastName={c.lastName}
          jobTitle={c.jobTitle}
          matchScore={c.matchScore}
          status={c.status}
          resumeUrl={c.resumeUrl}
          interviewDate={c.interviewDate}
          interviewStatus={c.interviewStatus}
          email={c.email}
          phone={c.phone}
          recruiterNotes={c.recruiterNotes}
          recruiterName={c.recruiterName}
          recruiterRole={c.recruiterRole}
          recruiterEmail={c.recruiterEmail}
          recruiterPhone={c.recruiterPhone}
          contactStatus={c.contactStatus}
          resume_analysis_summary={c.resume_analysis_summary}
          suggestions={c.suggestions}
          technicalSkills={c.technicalSkills}     // ✅ forward skills
          yearsExperience={c.yearsExperience}     // ✅ forward years exp
          onStatusUpdate={(
            id,
            newStatus,
            interviewDate,
            interviewStatus,
            recruiterNotes,
            contactStatus
          ) => {
            onStatusUpdate(
              id,
              newStatus,
              interviewDate,
              interviewStatus,
              recruiterNotes,
              contactStatus
            )
          }}
        />
      ))}
    </div>
  )
}
