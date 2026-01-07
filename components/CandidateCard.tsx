"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ResumeModal from "./ResumeModal";
import { Button } from "@/components/ui/button";
import InterviewScheduler from "./InterviewScheduler";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

type CandidateCardProps = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  matchScore?: number;
  status: string;
  interviewDate?: string | null;
  interviewStatus?: string | null;
  technicalSkills?: string[];       // ✅ added
  yearsExperience?: number;         // ✅ added
  avatarUrl?: string;
  resumeUrl?: string;
  email?: string;
  phone?: string;
  recruiterNotes?: string | null;
  recruiterName?: string;
  recruiterRole?: string;
  recruiterEmail?: string;
  recruiterPhone?: string;
  contactStatus?: string | null;   // applicant response
  resume_analysis_summary?: string | null;
  suggestions?: { text: string; severity?: string }[];
  onStatusUpdate?: (
    id: string,
    newStatus: string,
    interviewDate?: string | null,
    interviewStatus?: string | null,
    recruiterNotes?: string | null,
    contactStatus?: string | null
  ) => void;
};

export default function CandidateCard(props: CandidateCardProps) {
  const {
    id,
    firstName,
    lastName,
    jobTitle,
    matchScore,
    status,
    interviewDate,
    interviewStatus,
    technicalSkills = [],
    yearsExperience,
    avatarUrl,
    resumeUrl,
    email,
    phone,
    recruiterNotes,
    recruiterName,
    recruiterRole,
    recruiterEmail,
    recruiterPhone,
    contactStatus,
    resume_analysis_summary,
    onStatusUpdate,
    suggestions,
  } = props;

  const supabase = createClient();
  const router = useRouter();

  const stars = matchScore ? Math.round((matchScore / 100) * 5) : 0;
  const topSkills = technicalSkills.slice(0, 2);

  const statusColor =
    status === "applied" || status === "under_review"
      ? "bg-gray-200 text-gray-800"
      : status === "shortlisted"
      ? "bg-blue-200 text-blue-800"
      : status === "interview_scheduled" || status === "interviewed"
      ? "bg-orange-200 text-orange-800"
      : status === "offer_extended"
      ? "bg-purple-200 text-purple-800"
      : status === "hired"
      ? "bg-green-200 text-green-800"
      : status === "rejected"
      ? "bg-red-200 text-red-800"
      : "bg-gray-100 text-gray-600";

  const updateStatus = async (
    newStatus: string,
    interviewDateValue?: string | null,
    interviewStatusValue?: string | null,
    contactStatusValue?: string | null
  ) => {
    // ✅ Reset contactStatus for non-offer stages
    const resetContactStatus =
      newStatus === "applied"
        ? "pending"
        : ["under_review", "shortlisted"].includes(newStatus)
        ? null
        : contactStatusValue ?? contactStatus;

    onStatusUpdate?.(
      id,
      newStatus,
      interviewDateValue ?? interviewDate,
      interviewStatusValue ?? interviewStatus,
      recruiterNotes,
      resetContactStatus
    );

    const updatePayload: any = { status: newStatus };

    if (["applied", "under_review", "shortlisted"].includes(newStatus)) {
      updatePayload.interview_date = null;
      updatePayload.interview_status = null;
      updatePayload.contact_status = newStatus === "applied" ? "pending" : null;
    }

    if (newStatus === "interview_scheduled" && interviewDateValue) {
      updatePayload.interview_date = interviewDateValue;
      updatePayload.interview_status = "scheduled";
    }

    if (newStatus === "offer_extended") {
      updatePayload.contact_status = contactStatusValue ?? "invite_sent";
    }
    if (newStatus === "hired") {
      updatePayload.contact_status = "accepted";
    }
    if (newStatus === "rejected") {
      updatePayload.contact_status = "declined";
    }

    const { error } = await supabase.from("applications").update(updatePayload).eq("id", id);
    if (error) {
      console.error("Error updating status:", error);
      return;
    }
    router.refresh();
  };

  const saveNotes = async (notes: string) => {
    onStatusUpdate?.(id, status, interviewDate, interviewStatus, notes, contactStatus);
    const { error } = await supabase
      .from("applications")
      .update({ recruiter_notes: notes })
      .eq("id", id);
    if (error) {
      console.error("Error saving notes:", error);
      return;
    }
    router.refresh();
  };

  const allStatuses = [
    "applied",
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "interviewed",
    "offer_extended",
    "hired",
    "rejected",
  ];

  const isToReview = status === "applied" || status === "under_review";

  return (
    <Card key={id}>
      <CardHeader className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${firstName} ${lastName}`}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
            {firstName.charAt(0)}
            {lastName.charAt(0)}
          </div>
        )}

        <div>
          <CardTitle className="text-xl font-semibold">
            {firstName} {lastName}
          </CardTitle>
          <p className="text-sm text-gray-600">Applied for: {jobTitle}</p>

          {status === "shortlisted" && recruiterName && (
            <p className="text-xs text-gray-500">
              Recruiter: {recruiterName} ({recruiterRole}) • {recruiterEmail} • {recruiterPhone}
            </p>
          )}
        </div>

        {/* Dropdown badge for status updates */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge className={`${statusColor} ml-auto capitalize cursor-pointer`}>
              {status}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {allStatuses.map((s) => (
              <DropdownMenuItem key={s} onClick={() => updateStatus(s)}>
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-gray-700">
        {matchScore !== undefined && (
          <span className="flex items-center gap-1 text-green-600 font-medium">
            ✅ {matchScore}% Match
          </span>
        )}

        <div className="flex flex-wrap gap-2">
          {topSkills.map((skill, i) => (
            <span key={i} className="bg-gray-100 px-2 py-1 rounded">
              {skill}
            </span>
          ))}
          {yearsExperience && (
            <span className="bg-gray-100 px-2 py-1 rounded">{yearsExperience}+ years exp</span>
          )}
        </div>

        {matchScore !== undefined && (
          <div className="text-yellow-500 text-lg">
            {"★".repeat(stars)}{"☆".repeat(5 - stars)}
          </div>
        )}

        {resume_analysis_summary && (
          <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
            <strong>Analysis:</strong> {resume_analysis_summary}
          </div>
        )}

        {interviewDate && (
          <div>
            <strong>Interview:</strong> {new Date(interviewDate).toLocaleString()}
            {interviewStatus && (
              <span className="ml-2 text-xs text-gray-500">({interviewStatus})</span>
            )}
          </div>
        )}


                {/* Recruiter notes */}
        {(status === "shortlisted" ||
          status === "interview_scheduled" ||
          status === "interviewed" ||
          status === "offer_extended") && (
          <div className="space-y-2">
            <Textarea
              defaultValue={recruiterNotes || ""}
              placeholder="Add recruiter notes..."
              onBlur={(e) => saveNotes(e.target.value)}
            />
          </div>
        )}

        {/* Contact status badge for Offers tab */}
        {status === "offer_extended" && contactStatus && (
          <div className="text-xs">
            <Badge
              className={
                contactStatus === "accepted"
                  ? "bg-green-200 text-green-800"
                  : contactStatus === "declined"
                  ? "bg-red-200 text-red-800"
                  : "bg-gray-200 text-gray-800"
              }
            >
              {contactStatus}
            </Badge>
          </div>
        )}

        {/* AI suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-1">
            {suggestions.map((s, i) => (
              <div key={i} className="text-xs">
                ⚡ {s.text}
                {s.severity && <span className="ml-1 text-gray-500">({s.severity})</span>}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          {resumeUrl && (
            <ResumeModal
              candidateName={`${firstName} ${lastName}`}
              resumeUrl={resumeUrl}
              candidateId={id}
              onStatusUpdate={updateStatus}
              shouldUpdateOnOpen={status === "applied"}
            />
          )}

          {/* To Review actions */}
          {isToReview && (
            <>
              <Button variant="outline" onClick={() => updateStatus("shortlisted")}>
                Shortlist
              </Button>
              <Button variant="destructive" onClick={() => updateStatus("rejected")}>
                Reject
              </Button>
            </>
          )}

          {/* Shortlisted actions */}
          {!interviewDate && status === "shortlisted" && (
            <InterviewScheduler
              candidateName={`${firstName} ${lastName}`}
              candidateId={id}
              onSchedule={(date) => updateStatus("interview_scheduled", date)}
            />
          )}

          {/* Interview stage actions */}
          {status === "interview_scheduled" && (
            <>
              <Button variant="default" onClick={() => updateStatus("interviewed")}>
                Mark Completed
              </Button>
              <Button variant="destructive" onClick={() => updateStatus("rejected")}>
                Reject
              </Button>
            </>
          )}

          {status === "interviewed" && (
            <>
              <Button variant="success" onClick={() => updateStatus("hired")}>
                Hire
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  updateStatus("offer_extended", interviewDate, interviewStatus, "invite_sent")
                }
              >
                Extend Offer
              </Button>
              <Button variant="destructive" onClick={() => updateStatus("rejected")}>
                Reject
              </Button>
            </>
          )}

          {/* Offers stage actions */}
          {status === "offer_extended" && (
            <>
              <Button
                variant="success"
                onClick={() => updateStatus("hired", interviewDate, interviewStatus, "accepted")}
              >
                Mark Accepted
              </Button>
              <Button
                variant="destructive"
                onClick={() => updateStatus("rejected", interviewDate, interviewStatus, "declined")}
              >
                Mark Declined
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  updateStatus("offer_extended", interviewDate, interviewStatus, "invite_sent")
                }
              >
                Resend Offer
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
