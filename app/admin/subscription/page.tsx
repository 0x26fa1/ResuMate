import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { SubscriptionManagementClient } from "@/components/subscription-management-client"

export default async function SubscriptionPage() {
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

  if (!profile || profile.user_type !== "admin") {
    redirect("/auth/login")
  }

  // Fetch all users with their subscription information
  const { data: allUsers, error: usersError } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      email,
      user_type,
      created_at,
      subscription_status,
      subscription_plan,
      subscription_date,
      subscription_start_date,
      subscription_end_date
    `)
    .order("created_at", { ascending: false })

  if (usersError) {
    console.error("Error fetching users:", usersError)
  }

  // Calculate subscription stats
  const totalUsers = allUsers?.length || 0
  const activeSubscriptions = allUsers?.filter(u => u.subscription_status === 'active').length || 0
  const freeUsers = allUsers?.filter(u => u.subscription_status === 'free').length || 0
  const trialUsers = allUsers?.filter(u => u.subscription_status === 'trial').length || 0
  const expiredUsers = allUsers?.filter(u => u.subscription_status === 'expired').length || 0

  // Calculate revenue based on plans
  const planPrices: { [key: string]: number } = {
    'basic': 0,
    'pro': 0,
    'premium': 0,
    'enterprise': 1999
  }

  const monthlyRevenue = allUsers?.reduce((total, u) => {
    if (u.subscription_status === 'active' && u.subscription_plan) {
      return total + (planPrices[u.subscription_plan] || 0)
    }
    return total
  }, 0) || 0

  const stats = {
    totalUsers,
    activeSubscriptions,
    freeUsers,
    trialUsers,
    expiredUsers,
    monthlyRevenue: monthlyRevenue.toFixed(2)
  }

  // Format users for client component
  const formattedUsers = allUsers?.map(u => ({
    id: u.id,
    name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'No Name',
    email: u.email || 'No email',
    userType: u.user_type || 'jobseeker',
    subscriptionStatus: u.subscription_status || 'free',
    subscriptionPlan: u.subscription_plan || 'none',
    subscriptionDate: u.subscription_date ? formatDateTime(u.subscription_date) : 'N/A',
    subscriptionStartDate: u.subscription_start_date ? formatDate(u.subscription_start_date) : 'N/A',
    subscriptionEndDate: u.subscription_end_date ? formatDate(u.subscription_end_date) : 'N/A',
    daysRemaining: u.subscription_end_date ? calculateDaysRemaining(u.subscription_end_date) : 0,
    joined: u.created_at ? formatDate(u.created_at) : 'Unknown'
  })) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType="admin" userName={profile.first_name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionManagementClient 
          initialUsers={formattedUsers}
          stats={stats}
        />
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function calculateDaysRemaining(endDateString: string): number {
  const endDate = new Date(endDateString)
  const now = new Date()
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}