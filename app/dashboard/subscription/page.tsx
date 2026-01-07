// app/subscription/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { UpgradeButton } from "./upgrade-button"

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

  // Fetch user's current subscription
  const { data: currentSubscription } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      subscription_plans (*)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  // Fetch all available plans (excluding HR plans)
  const { data: allPlans, error: plansError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("monthly_price", { ascending: true })

  // Filter out Premium HR plans
  const plans = allPlans?.filter(plan => !plan.plan_name.toLowerCase().includes("hr"))

  // Log errors for debugging
  if (plansError) {
    console.error("Error fetching plans:", plansError)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav 
        userType={profile?.user_type || "jobseeker"} 
        userName={profile?.first_name} 
      />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Plan</h1>
          <p className="text-lg text-gray-600">
            Select the perfect plan to accelerate your job search
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans?.map((plan, index) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id
            const isFree = plan.monthly_price === 0
            const isPremiumJobSeeker = plan.plan_name.toLowerCase().includes("job seeker")
            
            // Determine if this is the "Most Popular" plan
            const isPopular = isPremiumJobSeeker

            return (
              <Card 
                key={plan.id}
                className={`relative ${isCurrentPlan ? 'ring-2 ring-purple-500' : ''} ${isPopular ? 'shadow-xl scale-105' : 'shadow-md'}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-blue-500 text-white px-4 py-1 text-sm font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4 pt-8">
                  <CardTitle className="text-lg font-semibold mb-4">
                    {plan.plan_name}
                  </CardTitle>
                  <div className="mb-4">
                    <span className="text-5xl font-bold">₱{plan.monthly_price}</span>
                    <span className="text-gray-500 text-lg">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Feature List */}
                  <ul className="space-y-3 mb-8">
                    {/* Resume Analysis */}
                    <li className="flex items-start gap-3">
                      {plan.max_resumes_per_month ? (
                        <>
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">
                            {plan.max_resumes_per_month === -1 
                              ? "Unlimited AI Analysis" 
                              : `${plan.max_resumes_per_month} AI Resume Analysis`}
                          </span>
                        </>
                      ) : (
                        <>
                          <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-400">Unlimited AI Analysis</span>
                        </>
                      )}
                    </li>

                    {/* Grammar Checker */}
                    <li className="flex items-start gap-3">
                      {plan.advanced_feedback ? (
                        <>
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">Advanced Grammar Checker</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">Advanced Grammar Checker</span>
                        </>
                      )}
                    </li>

                    {/* Keyword Optimization */}
                    <li className="flex items-start gap-3">
                      {!isFree ? (
                        <>
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">Keyword Optimization</span>
                        </>
                      ) : (
                        <>
                          <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-400">Keyword Optimization</span>
                        </>
                      )}
                    </li>

                    {/* ATS Compatibility Check */}
                    <li className="flex items-start gap-3">
                      {!isFree ? (
                        <>
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">ATS Compatibility Check</span>
                        </>
                      ) : (
                        <>
                          <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-400">ATS Compatibility Check</span>
                        </>
                      )}
                    </li>
                  </ul>

                  {/* Action Button */}
                  {isCurrentPlan ? (
                    <button 
                      disabled
                      className="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-gray-300 text-gray-500 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <UpgradeButton 
                      planId={plan.id}
                      planName={plan.plan_name}
                      price={plan.monthly_price}
                      isPremiumHR={false}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-2">Current Plan Active</p>
                <h3 className="text-xl font-bold mb-1">
                  {currentSubscription.subscription_plans?.plan_name}
                </h3>
                <p className="text-gray-500 text-sm">
                  Started: {new Date(currentSubscription.start_date).toLocaleDateString()}
                  {currentSubscription.end_date && 
                    ` • Expires: ${new Date(currentSubscription.end_date).toLocaleDateString()}`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}