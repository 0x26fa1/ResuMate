"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostJobModal } from "@/components/post-job-modal";

export default function HRJobsClient({jobs, profile }) {
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);

  // View Applications
  const handleViewApplications = (jobId: string) => {
    router.push(`/hr/candidates?jobId=${jobId}`);
  };

  // Edit Job
  const handleEdit = (job: any) => {
    setEditingJob(job);
    setEditOpen(true);
  };

  // Close Job
  const handleClose = async (jobId: string) => {
    if (!confirm("Are you sure you want to close this job posting?")) return;

    const res = await fetch("/api/jobs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: jobId, status: "closed" }),
    });

    if (!res.ok) {
      alert("Failed to close job.");
      return;
    }

    router.refresh();
  };

  // Delete Job
  const handleDelete = async (jobId: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to DELETE this job? This cannot be undone."
    );
    if (!confirmDelete) return;

    const response = await fetch("/api/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: jobId }),
    });

    if (!response.ok) {
      alert("Failed to delete job.");
      return;
    }

    alert("Job deleted successfully.");
    router.refresh();
  };

  return (
    <div>
      {/* Page Heading */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-gray-600">Manage your job listings</p>
        </div>

        {/* Create Job */}
        <PostJobModal />
      </div>

      {/* Job List */}
      {jobs.length > 0 ? (
        <div className="space-y-6">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <p className="text-gray-600 mt-1">
                      {job.company_name} • {job.location} • Posted{" "}
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Badge
                    className={
                      job.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-gray-700 mb-4">
                  {job.description.substring(0, 200)}...
                </p>

                <div className="flex items-center justify-between">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{job.applicationCount} Applications</span>
                    <span>•</span>
                    <span>{job.job_type}</span>
                    <span>•</span>
                    <span>{job.experience_level}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button size="sm" onClick={() => handleViewApplications(job.id)}>
                      View Applications
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => handleEdit(job)}>
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleClose(job.id)}
                    >
                      Close
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first job posting to start receiving applications.
            </p>
            <PostJobModal />
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingJob && (
        <PostJobModal
          job={editingJob}
          mode="edit"
          open={editOpen}
          onOpenChange={setEditOpen}
          trigger={<span />}
        />
      )}
    </div>
  );
}
