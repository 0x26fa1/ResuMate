import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { randomUUID } from "crypto"

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY!

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile for billing info
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", user.id)
      .single()

    const { planId, planName, price } = await request.json()

    if (!planId || !planName || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // PayMongo requires amount in centavos (PHP cents)
    const amountInCentavos = Math.round(price * 100)

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000"

    const referenceId = randomUUID()

    // Create PayMongo Checkout Session
    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              email: profile?.email || user.email,
              name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : user.email,
            },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: [
              {
                currency: "PHP",
                amount: amountInCentavos,
                name: planName,
                description: `Monthly subscription to ${planName}`,
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "gcash", "grab_pay", "paymaya"],
            success_url: `${baseUrl}/dashboard/subscription/success?session_id=${referenceId}`,
            cancel_url: `${baseUrl}/dashboard/subscription?canceled=true`,
            description: `Subscription upgrade to ${planName}`,
            reference_number: referenceId,
            metadata: {
              user_id: user.id,
              plan_id: planId.toString(),
              plan_name: planName,
              reference_id: referenceId,
            },
          },
        },
      }),
    })

    const paymongoData = await response.json()

    if (!response.ok) {
      console.error("PayMongo error:", paymongoData)
      return NextResponse.json(
        { error: paymongoData.errors?.[0]?.detail || "Failed to create checkout session" },
        { status: response.status },
      )
    }

    // Return the checkout URL to redirect the user
    return NextResponse.json({
      checkoutUrl: paymongoData.data.attributes.checkout_url,
      checkoutSessionId: paymongoData.data.id,
      referenceId: referenceId,
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
