"use client"

import { useEffect, useState } from "react"
import { redirect, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Crown } from "lucide-react"

type UserType = "admin" | "jobseeker" | "hr"

interface ProfileData {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  user_type: UserType
  created_at: string
  job_title?: string
  location?: string
  avatar_url?: string
  preferred_role?: string
  work_type?: string[]
  salary_min?: number
  salary_max?: number
  availability?: string
  availability_days?: string[]
  availability_time?: string
  company_name?: string
  company_size?: string
  industry?: string
  website?: string
  company_description?: string
  is_premium?: boolean
}

const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

function getUserTypeLabel(userType: UserType): string {
  const labels: Record<UserType, string> = {
    admin: "System Administrator",
    hr: "HR Professional",
    jobseeker: "Job Seeker",
  }
  return labels[userType]
}

function getUserTypeColor(userType: UserType): string {
  const colors: Record<UserType, string> = {
    admin: "bg-purple-100 text-purple-600",
    hr: "bg-green-100 text-green-600",
    jobseeker: "bg-blue-100 text-blue-600",
  }
  return colors[userType]
}

function getPageTitle(userType: UserType): string {
  const titles: Record<UserType, string> = {
    admin: "Admin Profile",
    hr: "My Profile",
    jobseeker: "My Profile",
  }
  return titles[userType]
}

function getPageDescription(userType: UserType): string {
  const descriptions: Record<UserType, string> = {
    admin: "Manage your admin account settings",
    hr: "Manage your HR profile and company information",
    jobseeker: "Manage your personal information and preferences",
  }
  return descriptions[userType]
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [editing, setEditing] = useState(false)
  const [editingJobPref, setEditingJobPref] = useState(false)
  const [editingCompany, setEditingCompany] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Load profile data
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect("/auth/login")
        return
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching profile:", error)
        redirect("/auth/login")
        return
      }

      if (!profileData) {
        redirect("/auth/error?message=profile_not_found")
        return
      }

      // Ensure work_type is array
      if (profileData.work_type && !Array.isArray(profileData.work_type)) {
        profileData.work_type = String(profileData.work_type).split(",").map((s: string) => s.trim())
      }

      // Ensure availability_days is array
      if (profileData.availability_days && !Array.isArray(profileData.availability_days)) {
        profileData.availability_days = String(profileData.availability_days).split(",").map((s: string) => s.trim())
      }

      setProfile(profileData as ProfileData)
      setLoading(false)
    }

    loadData()
  }, [])

  // Save personal info
  const handleSaveProfile = async () => {
    if (!profile) return
    setBusy(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          location: profile.location,
          job_title: profile.job_title,
        })
        .eq("id", profile.id)

      if (error) {
        console.error("Error updating profile:", error)
        alert(`❌ Error updating profile: ${error.message}`)
      } else {
        alert("✅ Personal information updated!")
        setEditing(false)
        router.refresh()
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      alert("❌ An unexpected error occurred. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  // Save job preferences (jobseeker only)
  const handleSaveJobPreferences = async () => {
    if (!profile) return
    setBusy(true)

    try {
      const payload: any = {
        preferred_role: profile.preferred_role ?? null,
        work_type: Array.isArray(profile.work_type) 
          ? profile.work_type 
          : (profile.work_type ? String(profile.work_type).split(",").map((s: string) => s.trim()) : []),
        salary_min: profile.salary_min ? Number(profile.salary_min) : null,
        salary_max: profile.salary_max ? Number(profile.salary_max) : null,
        availability_days: Array.isArray(profile.availability_days) 
          ? profile.availability_days 
          : [],
        availability_time: profile.availability_time ?? null,
      }

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profile.id)

      if (error) {
        console.error("Error updating job preferences:", error)
        
        // Check for specific error types
        if (error.message.includes("availability_days") || error.message.includes("availability_time")) {
          alert("❌ Database columns missing. Please add 'availability_days' and 'availability_time' columns to your profiles table.")
        } else if (error.code === "42703") {
          alert("❌ Column does not exist in database. Please run the SQL migration to add missing columns.")
        } else {
          alert(`❌ Error updating job preferences: ${error.message}`)
        }
      } else {
        alert("✅ Job preferences updated!")
        setEditingJobPref(false)
        router.refresh()
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      alert("❌ An unexpected error occurred. Please check the console for details.")
    } finally {
      setBusy(false)
    }
  }

  // Save company info (HR only)
  const handleSaveCompanyInfo = async () => {
    if (!profile) return
    setBusy(true)

    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: profile.company_name,
        industry: profile.industry,
        company_size: profile.company_size,
        website: profile.website,
        company_description: profile.company_description,
      })
      .eq("id", profile.id)

    setBusy(false)
    if (error) {
      console.error(error)
      alert("❌ Error updating company information.")
    } else {
      alert("✅ Company information updated!")
      setEditingCompany(false)
      router.refresh()
    }
  }

  // Upload profile photo
  const handleChangePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setBusy(true)

    try {
      const fileExt = file.name.split(".").pop()
      const filePath = `avatars/${profile.id}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("❌ Error uploading image.")
        setBusy(false)
        return
      }

      const { data: publicData } = supabase.storage.from("profile-photos").getPublicUrl(filePath)
      const publicUrl = publicData?.publicUrl

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id)

      if (updateError) {
        console.error("DB update error:", updateError)
        alert("❌ Error saving photo.")
      } else {
        setProfile({ ...profile, avatar_url: publicUrl })
        alert("✅ Profile photo updated!")
      }
    } catch (err) {
      console.error(err)
      alert("❌ Unexpected error during upload.")
    } finally {
      setBusy(false)
    }
  }

  // Delete profile photo
  const handleDeletePhoto = async () => {
    if (!profile?.avatar_url) {
      alert("❌ No photo to delete.")
      return
    }

    if (!confirm("Are you sure you want to delete your profile photo?")) return
    setBusy(true)

    try {
      const parts = profile.avatar_url.split("/")
      const fileName = parts[parts.length - 1]
      const filePath = `avatars/${fileName}`

      const { error: deleteError } = await supabase.storage
        .from("profile-photos")
        .remove([filePath])

      if (deleteError) {
        console.error("Delete error:", deleteError)
        alert("❌ Error deleting photo from storage.")
        setBusy(false)
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", profile.id)

      if (updateError) {
        console.error("DB clear error:", updateError)
        alert("❌ Error clearing avatar_url in database.")
      } else {
        setProfile({ ...profile, avatar_url: undefined })
        alert("🗑️ Photo deleted.")
      }
    } catch (err) {
      console.error(err)
      alert("❌ Unexpected error deleting photo.")
    } finally {
      setBusy(false)
    }
  }

  // Toggle day selection
  const toggleDay = (day: string) => {
    if (!profile) return
    const currentDays = Array.isArray(profile.availability_days) ? profile.availability_days : []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day]
    setProfile({ ...profile, availability_days: newDays })
  }

  if (loading) return <div className="p-8 text-center text-gray-600">Loading profile...</div>
  if (!profile) return <div className="p-8 text-center text-gray-600">Profile not found.</div>

  const userType = profile.user_type as UserType
  const pageTitle = getPageTitle(userType)
  const pageDescription = getPageDescription(userType)
  const userTypeLabel = getUserTypeLabel(userType)
  const colorClass = getUserTypeColor(userType)
  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType={userType} userName={profile.first_name} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600">{pageDescription}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className={`h-24 w-24 rounded-full ${colorClass} mx-auto mb-4 overflow-hidden flex items-center justify-center`}>
                      {profile.avatar_url ? (
                        <img
                          src={`${profile.avatar_url}?t=${Date.now()}`}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold">{initials}</span>
                      )}
                    </div>
                    {profile.is_premium && userType === "jobseeker" && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                        <Crown className="h-5 w-5 text-yellow-900" fill="currentColor" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 flex items-center justify-center gap-2">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <p className="text-gray-600">{profile.job_title || userTypeLabel}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </p>

                  <div className="mt-4 space-y-2">
                    <label htmlFor="photo-upload" className="block">
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={busy}
                        onChange={handleChangePhoto}
                      />
                      <Button asChild className="w-full cursor-pointer" disabled={busy}>
                        <span>{busy ? "Working..." : "Change Photo"}</span>
                      </Button>
                    </label>

                    {profile.avatar_url && (
                      <Button variant="destructive" className="w-full" onClick={handleDeletePhoto} disabled={busy}>
                        Delete Photo
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} disabled={busy}>
                  {editing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">First Name</label>
                      <Input
                        value={profile.first_name || ""}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Name</label>
                      <Input
                        value={profile.last_name || ""}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <Input value={profile.email} disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <Input
                        value={profile.phone || ""}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Location</label>
                      <Input
                        value={profile.location || ""}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Job Title</label>
                      <Input
                        value={profile.job_title || ""}
                        onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                        disabled={busy}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={() => setEditing(false)} disabled={busy}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={busy}>Save Changes</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">First Name</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.first_name || "Not set"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Name</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.last_name || "Not set"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.phone || "Not set"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Location</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.location || "Not set"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Job Title</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.job_title || "Not set"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Preferences - Jobseeker Only */}
            {userType === "jobseeker" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Job Preferences</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setEditingJobPref(!editingJobPref)} disabled={busy}>
                    {editingJobPref ? "Cancel" : "Edit"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {editingJobPref ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Preferred Role</label>
                          <Input
                            value={profile.preferred_role || ""}
                            onChange={(e) => setProfile({ ...profile, preferred_role: e.target.value })}
                            disabled={busy}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Work Type</label>
                          <Input
                            placeholder="Comma separated (Remote, Full-time)"
                            value={Array.isArray(profile.work_type) ? profile.work_type.join(", ") : (profile.work_type || "")}
                            onChange={(e) => setProfile({ ...profile, work_type: e.target.value.split(",").map((s: string) => s.trim()) as string[] })}
                            disabled={busy}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Salary Min (₱)</label>
                          <Input
                            type="number"
                            value={profile.salary_min || ""}
                            onChange={(e) => setProfile({ ...profile, salary_min: Number(e.target.value) })}
                            disabled={busy}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Salary Max (₱)</label>
                          <Input
                            type="number"
                            value={profile.salary_max || ""}
                            onChange={(e) => setProfile({ ...profile, salary_max: Number(e.target.value) })}
                            disabled={busy}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">Available Days</label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <Button
                              key={day}
                              variant={profile.availability_days?.includes(day) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleDay(day)}
                              disabled={busy}
                              className="min-w-[60px]"
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Available Time</label>
                        <Input
                          placeholder="e.g., 9:00 AM - 5:00 PM"
                          value={profile.availability_time || ""}
                          onChange={(e) => setProfile({ ...profile, availability_time: e.target.value })}
                          disabled={busy}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setEditingJobPref(false)} disabled={busy}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveJobPreferences} disabled={busy}>Save Changes</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Preferred Role</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.preferred_role || "Not set"}</p>
                      </div>
                      <div>
  <label className="block text-sm font-medium text-gray-500">Work Type</label>
  <p className="mt-1 text-sm text-gray-900">
    {(() => {
      const value = profile.work_type;

      if (!value) return "Not set";

      // If it's already an array
      if (Array.isArray(value)) {
        return value.filter(Boolean).join(", ") || "Not set";
      }

      // If it's a JSON stringified array like '["Basketball"]'
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean).join(", ") || "Not set";
        }
      } catch {
        // Not JSON—ignore
      }

      // Otherwise just return the string
      return String(value);
    })()}
  </p>
</div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Salary Range</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {profile.salary_min && profile.salary_max
                            ? `₱${Number(profile.salary_min).toLocaleString()} - ₱${Number(profile.salary_max).toLocaleString()}`
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Available Days</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {profile.availability_days && profile.availability_days.length > 0
                            ? profile.availability_days.join(", ")
                            : "Not set"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Available Time</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.availability_time || "Not set"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Company Information - HR Only */}
            {userType === "hr" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Company Information</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setEditingCompany(!editingCompany)} disabled={busy}>
                    {editingCompany ? "Cancel" : "Edit"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {editingCompany ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Company Name</label>
                        <Input
                          value={profile.company_name || ""}
                          onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                          disabled={busy}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Industry</label>
                        <Input
                          value={profile.industry || ""}
                          onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                          disabled={busy}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Company Size</label>
                        <Input
                          value={profile.company_size || ""}
                          onChange={(e) => setProfile({ ...profile, company_size: e.target.value })}
                          disabled={busy}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Website</label>
                        <Input
                          value={profile.website || ""}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                          disabled={busy}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Company Description</label>
                        <Input
                          value={profile.company_description || ""}
                          onChange={(e) => setProfile({ ...profile, company_description: e.target.value })}
                          disabled={busy}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setEditingCompany(false)} disabled={busy}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveCompanyInfo} disabled={busy}>Save Changes</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Company Name</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.company_name || "Not set"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Industry</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.industry || "Not set"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Company Size</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.company_size || "Not set"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Website</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.website || "Not set"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Company Description</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.company_description || "Not set"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}