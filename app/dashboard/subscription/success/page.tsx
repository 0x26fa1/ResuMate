import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { CheckoutSessionDisplay } from "./checkout-session-display"

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // 🔥 UPDATE THE PROFILE TO PREMIUM STATUS
  await supabase
    .from("profiles")
    .update({
      is_premium: true,
      subscription_status: "active",
      subscription_date: new Date().toISOString()
    })
    .eq("id", user.id)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType={profile?.user_type || "jobseeker"} userName={profile?.first_name} />

      <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Thank you for upgrading your subscription. Your payment has been processed successfully.
            </p>

            <CheckoutSessionDisplay sessionId={session_id} />

            {currentSubscription && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-500">Your current plan</p>
                <p className="text-xl font-semibold text-gray-900">
                  {currentSubscription.subscription_plans?.plan_name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Valid until: {new Date(currentSubscription.end_date).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <Link
                href="/dashboard"
                className="inline-block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
