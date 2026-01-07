"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface PostJobModalProps {
  job?: any; // the job being edited
  mode?: "create" | "edit";
  trigger?: React.ReactNode; // custom trigger button
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function PostJobModal({
  job,
  mode = "create",
  trigger,
  open,
  onOpenChange,
}: PostJobModalProps) {
  const router = useRouter();
  const isEditing = mode === "edit";

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    location: "",
    job_type: "full-time",
    experience_level: "entry",
    salary_range: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
  });

  useEffect(() => {
    if (isEditing && job) {
      setFormData({
        title: job.title || "",
        company_name: job.company_name || "",
        location: job.location || "",
        job_type: job.job_type || "full-time",
        experience_level: job.experience_level || "entry",
        salary_range: job.salary_range || "",
        description: job.description || "",

        requirements: Array.isArray(job.requirements)
          ? job.requirements.join("\n")
          : (job.requirements || "").toString(),

        responsibilities: Array.isArray(job.responsibilities)
          ? job.responsibilities.join("\n")
          : (job.responsibilities || "").toString(),

        benefits: Array.isArray(job.benefits)
          ? job.benefits.join("\n")
          : (job.benefits || "").toString(),
      });
    }
  }, [isEditing, job]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Convert textarea into array lines
  const convertToArray = (v: string) =>
    v
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      requirements: convertToArray(formData.requirements),
      responsibilities: convertToArray(formData.responsibilities),
      benefits: convertToArray(formData.benefits),
      id: job?.id,
    };

    try {
      const response = await fetch("/api/jobs", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save job");
      }

      router.refresh();
      onOpenChange?.(false); // close modal if parent controls it
    } catch (error: any) {
      alert(error.message || "Failed to save job");
    } finally {
      setLoading(false);
    }
  };

  // If controlled by parent (open/onOpenChange provided), don't render trigger
  const isControlled = open !== undefined && onOpenChange !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ? (
            trigger
          ) : (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Job Posting" : "Post a New Job"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the job details below."
              : "Fill in the details to create a new job posting."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC INFO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  required
                  value={formData.company_name}
                  onChange={(e) =>
                    handleChange("company_name", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location *</Label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Salary Range</Label>
                <Input
                  value={formData.salary_range}
                  onChange={(e) =>
                    handleChange("salary_range", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select
                  value={formData.job_type}
                  onValueChange={(v) => handleChange("job_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select
                  value={formData.experience_level}
                  onValueChange={(v) =>
                    handleChange("experience_level", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* JOB DETAILS */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Job Details</h3>

            <div className="space-y-2">
              <Label>Job Description *</Label>
              <Textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  handleChange("description", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Requirements *</Label>
              <Textarea
                required
                rows={4}
                value={formData.requirements}
                onChange={(e) =>
                  handleChange("requirements", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Responsibilities</Label>
              <Textarea
                rows={4}
                value={formData.responsibilities}
                onChange={(e) =>
                  handleChange("responsibilities", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Benefits</Label>
              <Textarea
                rows={3}
                value={formData.benefits}
                onChange={(e) =>
                  handleChange("benefits", e.target.value)
                }
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading
                ? isEditing
                  ? "Saving..."
                  : "Posting..."
                : isEditing
                  ? "Save Changes"
                  : "Post Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}