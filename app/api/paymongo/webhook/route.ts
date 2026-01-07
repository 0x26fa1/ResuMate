import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role for webhook handling (server-side only)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const eventType = body.data?.attributes?.type
    const eventData = body.data?.attributes?.data

    // Handle checkout session payment success
    if (eventType === "checkout_session.payment.paid") {
      const metadata = eventData?.attributes?.metadata
      const userId = metadata?.user_id
      const planId = metadata?.plan_id
      const referenceId = metadata?.reference_id

      if (!userId || !planId) {
        console.error("Missing metadata in webhook:", metadata)
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
      }

      // Get the plan details
      const { data: plan } = await supabaseAdmin
        .from("subscription_plans")
        .select("*")
        .eq("id", Number.parseInt(planId))
        .single()

      if (!plan) {
        console.error("Plan not found:", planId)
        return NextResponse.json({ error: "Plan not found" }, { status: 404 })
      }

      // Deactivate existing subscriptions for this user
      await supabaseAdmin
        .from("user_subscriptions")
        .update({ status: "inactive" })
        .eq("user_id", userId)
        .eq("status", "active")

      // Calculate subscription dates
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

      const paymentMethodUsed = eventData?.attributes?.payment_method_used || "card"

      const { error: subscriptionError } = await supabaseAdmin.from("user_subscriptions").insert({
        user_id: userId,
        plan_id: Number.parseInt(planId),
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_method: paymentMethodUsed,
        paymongo_checkout_id: referenceId,
      })

      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError)
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
      }

      console.log("Subscription created successfully for user:", userId)
    }

    // Handle payment failed
    if (eventType === "payment.failed") {
      console.log("Payment failed:", eventData)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
