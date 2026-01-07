"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

interface DashboardNavProps {
  userType: "jobseeker" | "hr" | "admin"
  userName?: string
}

export function DashboardNav({ userType, userName }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const getNavItems = () => {
    if (userType === "jobseeker") {
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/resumes", label: "My Resumes" },
        { href: "/dashboard/analytics", label: "Analytics" },
        { href: "/dashboard/jobs", label: "Job Matching" },
        { href: "/dashboard/profile", label: "Profile" },
        { href: "/dashboard/feedback", label: "Feedback" },
        { href: "/dashboard/subscription", label: "Subscription" },
      ]
    } else if (userType === "hr") {
      return [
        { href: "/hr", label: "Dashboard" },
        { href: "/hr/jobs", label: "Job Postings" },
        { href: "/hr/candidates", label: "Candidates" },
        { href: "/hr/analytics", label: "Analytics" },
        { href: "/hr/profile", label: "Profile" },
        { href: "/hr/feedback", label: "Feedback" },
      ]
    } else {
      return [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/system", label: "System" },
        { href: "/admin/analytics", label: "Analytics" },
        { href: "/admin/support", label: "Support" },
        { href: "/admin/profile", label: "Profile" },
        { href: "/admin/feedback", label: "Feedback" },
        { href: "/admin/subscription", label: "Subscription" },
      ]
    }
  }

  const navItems = getNavItems()
  const brandColor = userType === "jobseeker" ? "blue" : userType === "hr" ? "green" : "purple"

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className={`h-10 w-10 rounded-lg bg-${brandColor}-600 flex items-center justify-center`}>
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="ml-2 text-2xl font-bold text-gray-900">
                Resumate {userType === "hr" ? "HR" : userType === "admin" ? "Admin" : ""}
              </span>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? `text-${brandColor}-600 bg-${brandColor}-50`
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {userName && <span className="text-sm text-gray-700 hidden sm:block">Welcome, {userName}!</span>}
            <Button variant="ghost" onClick={handleLogout} disabled={isLoading}>
              {isLoading ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
