"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type CandidateTabsProps = {
  counts: Record<string, number> // counts per application status
  interviewCounts?: Record<string, number> // counts per interview_status
  onStatusChange: (status: string) => void
  onInterviewFilter?: (status: string) => void
}

export default function CandidateTabs({
  counts,
  interviewCounts = {},
  onStatusChange,
  onInterviewFilter,
}: CandidateTabsProps) {
  const [active, setActive] = useState("all")

  const handleClick = (status: string) => {
    setActive(status)
    onStatusChange(status)
  }

  const handleInterviewClick = (status: string) => {
    setActive("interviewFilter:" + status)
    if (onInterviewFilter) onInterviewFilter(status)
  }

  const tabs = [
    {
      key: "all",
      label: "All Applications",
      count: Object.values(counts).reduce((a, b) => a + b, 0),
    },
    {
      key: "to_review",
      label: "To Review",
      count: (counts["applied"] || 0) + (counts["under_review"] || 0),
    },
    {
      key: "shortlisted",
      label: "Shortlisted",
      count: counts["shortlisted"] || 0,
    },
    {
      key: "interviews",
      label: "Interviews",
      count: (counts["interview_scheduled"] || 0) + (counts["interviewed"] || 0),
    },
    {
      key: "offers",
      label: "Offers",
      count: counts["offer_extended"] || 0,
    },
    {
      key: "hired",
      label: "Hired",
      count: counts["hired"] || 0,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: counts["rejected"] || 0,
    },
  ]

  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      {/* Workflow status tabs */}
      {tabs.map(({ key, label, count }) => (
        <Button
          key={key}
          variant={active === key ? "default" : "outline"}
          onClick={() => handleClick(key)}
        >
          {label}
          <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-0.5">
            {count}
          </span>
        </Button>
      ))}

      {/* Divider for interview filters */}
      <div className="w-px bg-gray-300 mx-2" />

      {interviewCounts["completed"] !== undefined && (
        <Button
          key="completed"
          variant={active === "interviewFilter:completed" ? "default" : "outline"}
          onClick={() => handleInterviewClick("completed")}
        >
          Completed Interviews
          <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-0.5">
            {interviewCounts["completed"] ?? 0}
          </span>
        </Button>
      )}
    </div>
  )
}
