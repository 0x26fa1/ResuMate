"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { PostJobModal } from "@/components/post-job-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, FileText } from "lucide-react"

interface JobActionsClientProps {
  job: any
}

export function JobActionsClient({ job }: JobActionsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [loadingApplications, setLoadingApplications] = useState(false)

  const fetchApplications = async () => {
    setLoadingApplications(true)
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*, profiles(*)")
        .eq("job_id", job.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching applications:", error)
        setApplications([])
      } else {
        setApplications(data || [])
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
      setApplications([])
    } finally {
      setLoadingApplications(false)
    }
  }

  useEffect(() => {
    if (isApplicationsOpen) {
      fetchApplications()
    }
  }, [isApplicationsOpen])

  const handleCloseJob = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/jobs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: job.id,
          status: "closed",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to close job")
      }

      router.refresh()
      setIsCloseDialogOpen(false)
    } catch (error: any) {
      alert(error.message || "Failed to close job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex space-x-3">
        <Button size="sm" onClick={() => setIsApplicationsOpen(true)}>
          View Applications
        </Button>

        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
          onClick={() => setIsCloseDialogOpen(true)}
        >
          Close
        </Button>
      </div>

      {/* Applications Modal */}
      <Dialog open={isApplicationsOpen} onOpenChange={setIsApplicationsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{job.title}</DialogTitle>
            <DialogDescription>
              {job.company_name} • {job.location} •{" "}
              <span className="font-semibold">
                {applications.length} Applications
              </span>
            </DialogDescription>
          </DialogHeader>

          {loadingApplications ? (
            <div className="py-12 text-center text-gray-600">
              Loading applications...
            </div>
          ) : applications.length > 0 ? (
            <div className="space-y-4 mt-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {application.profiles?.first_name}{" "}
                          {application.profiles?.last_name}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          {application.profiles?.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {application.profiles.email}
                            </div>
                          )}
                          {application.profiles?.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {application.profiles.phone}
                            </div>
                          )}
                        </div>
                        {application.profiles?.location && (
                          <p className="text-sm text-gray-600 mt-1">
                            {application.profiles.location}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={
                          application.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : application.status === "reviewed"
                              ? "bg-blue-100 text-blue-800"
                              : application.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }
                      >
                        {application.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {application.cover_letter && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Cover Letter
                        </h4>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                          {application.cover_letter}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Applied on{" "}
                        {new Date(application.created_at).toLocaleDateString()}
                      </p>

                      <div className="flex gap-3">
                        {application.resume_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={application.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Resume
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No applications yet
              </h3>
              <p className="text-gray-500">
                Applications for this job will appear here
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <PostJobModal
        job={job}
        mode="edit"
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      {/* Close Confirmation Dialog */}
      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this job posting?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the job as closed and it will no longer accept new
              applications. You can reopen it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseJob}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Closing..." : "Close Job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}