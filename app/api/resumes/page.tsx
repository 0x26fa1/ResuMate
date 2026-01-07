"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AnalysisResults } from "@/components/analysis-results"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileUp, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Resume {
  id: string
  title: string
  file_name: string
  file_url: string
  file_size: number
  analysis_score: number | null
  ats_compatible: boolean | null
  analysis_data: any
  created_at: string
  updated_at: string
}

export default function ResumesPage() {
  const supabase = createClient()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Fetch resumes
  const fetchResumes = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from("resumes")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setResumes(data || [])
      setError(null)
    } catch (err) {
      console.error("Failed to fetch resumes:", err)
      setError("Failed to load resumes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("resumes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "resumes" }, () => fetchResumes())
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", file.name)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const result = await response.json()
      setResumes([result.data, ...resumes])
      setUploadDialogOpen(false)
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload resume")
    } finally {
      setUploading(false)
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-500"
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Resumes</h1>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            Upload Resume
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload a Resume</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm border border-gray-300 rounded p-2"
              />
              {uploading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading and analyzing...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No resumes yet. Upload your first resume to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {resumes.map((resume) => (
            <Card
              key={resume.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedResume(resume)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{resume.title}</CardTitle>
                    <CardDescription>{resume.file_name}</CardDescription>
                  </div>
                  {resume.analysis_score !== null && (
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(resume.analysis_score)}`}>
                        {resume.analysis_score}
                      </div>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {resume.analysis_score === null ? (
                    <>
                      <Badge variant="outline">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analyzing...
                      </Badge>
                    </>
                  ) : (
                    <>
                      {resume.ats_compatible && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ATS Compatible
                        </Badge>
                      )}
                      {resume.analysis_data?.experienceLevel && (
                        <Badge variant="outline" className="capitalize">
                          {resume.analysis_data.experienceLevel}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uploaded {new Date(resume.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analysis Details Dialog */}
      <Dialog open={!!selectedResume} onOpenChange={() => setSelectedResume(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedResume?.title}</DialogTitle>
          </DialogHeader>
          {selectedResume?.analysis_data ? (
            <AnalysisResults analysis={selectedResume.analysis_data} />
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Analysis in progress...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
