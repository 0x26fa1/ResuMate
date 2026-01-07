import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserManagementClient } from "@/components/user-management-client"

export default async function UserManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Check if user is admin
  if (!profile || profile.user_type !== "admin") {
    if (profile?.user_type === "jobseeker") {
      redirect("/dashboard")
    }
    if (profile?.user_type === "hr") {
      redirect("/hr")
    }
    redirect("/auth/error?message=unauthorized")
  }

  // Fetch all users
  const { data: allUsers, error: usersError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (usersError) {
    console.error("Error fetching users:", usersError)
  }

  // Calculate stats
  const jobSeekers = allUsers?.filter(u => u.user_type === "jobseeker").length || 0
  const hrUsers = allUsers?.filter(u => u.user_type === "hr").length || 0
  const admins = allUsers?.filter(u => u.user_type === "admin").length || 0
  
  // Calculate active users (last active within 24 hours)
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const activeToday = allUsers?.filter(u => {
    if (!u.last_sign_in_at) return false
    return new Date(u.last_sign_in_at) > oneDayAgo
  }).length || 0

  const totalUsers = allUsers?.length || 0
  const activePercentage = totalUsers > 0 ? Math.round((activeToday / totalUsers) * 100) : 0

  const stats = {
    jobSeekers: { count: jobSeekers },
    hrUsers: { count: hrUsers },
    admins: { count: admins },
    activeToday: { count: activeToday, percentage: `${activePercentage}% of total` }
  }

  // Format users for client component
  const formattedUsers = allUsers?.map(u => ({
    id: u.id,
    name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'No Name',
    email: u.email || 'No email',
    avatar: u.avatar_url,
    role: u.user_type || 'jobseeker',
    status: u.is_active ? 'active' : 'inactive',
    lastActive: u.last_sign_in_at ? formatLastActive(u.last_sign_in_at) : 'Never',
    joined: u.created_at ? formatDate(u.created_at) : 'Unknown'
  })) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType="admin" userName={profile.first_name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagementClient 
          initialUsers={formattedUsers}
          stats={stats}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}

function formatLastActive(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return formatDate(dateString)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}