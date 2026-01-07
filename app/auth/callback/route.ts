import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  // Check for error parameters from Supabase auth
  const error = requestUrl.searchParams.get("error")
  const errorCode = requestUrl.searchParams.get("error_code")
  const errorDescription = requestUrl.searchParams.get("error_description")

  // Handle authentication errors
  if (error || errorCode) {
    console.error("Auth callback error:", { error, errorCode, errorDescription })

    // Handle specific error types with user-friendly messages
    if (errorCode === "otp_expired") {
      return NextResponse.redirect(
        `${origin}/auth/error?type=otp_expired&message=${encodeURIComponent(
          "Your email link has expired. Please request a new one."
        )}`
      )
    }

    if (error === "access_denied") {
      return NextResponse.redirect(
        `${origin}/auth/error?type=access_denied&message=${encodeURIComponent(
          errorDescription || "Access was denied. Please try again."
        )}`
      )
    }

    // Generic error with description
    return NextResponse.redirect(
      `${origin}/auth/error?type=${error || "unknown"}&message=${encodeURIComponent(
        errorDescription || "An authentication error occurred."
      )}`
    )
  }

  // No code and no error - invalid callback
  if (!code) {
    console.error("Auth callback missing code parameter")
    return NextResponse.redirect(`${origin}/auth/error?type=invalid_callback&message=Invalid+authentication+callback`)
  }

  // Exchange code for session
  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("Code exchange error:", exchangeError)
    return NextResponse.redirect(
      `${origin}/auth/error?type=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // Get user profile to determine redirect
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("User not found after successful code exchange")
    return NextResponse.redirect(`${origin}/auth/error?type=user_not_found&message=Authentication+succeeded+but+user+not+found`)
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

  if (profileError || !profile) {
    console.error("Failed to fetch user profile:", profileError)
    return NextResponse.redirect(`${origin}/auth/error?type=profile_error&message=Profile+not+found`)
  }

  // Redirect based on user type
  if (profile.user_type === "admin") {
    return NextResponse.redirect(`${origin}/admin`)
  } else if (profile.user_type === "hr") {
    return NextResponse.redirect(`${origin}/hr`)
  } else if (profile.user_type === "jobseeker") {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Unknown user type
  console.warn("Unknown user type:", profile.user_type)
  return NextResponse.redirect(`${origin}/auth/error?type=invalid_user_type&message=Unknown+user+type`)
}
