import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublic =
    pathname.startsWith("/auth") ||
    pathname === "/" ||
    pathname === "/status" ||
    pathname.startsWith("/api/status")

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (
    user &&
    (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register"))
  ) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single()

    // If profile query fails or profile doesn't exist, don't redirect to avoid loops
    if (profileError || !profile) {
      console.error("Failed to fetch user profile:", profileError)
      // Stay on current page - user may need to complete profile setup
      return response
    }

    // Explicit type checking to ensure user goes to correct dashboard
    const url = request.nextUrl.clone()
    if (profile.user_type === "admin") {
      url.pathname = "/admin"
    } else if (profile.user_type === "hr") {
      url.pathname = "/hr"
    } else if (profile.user_type === "jobseeker") {
      url.pathname = "/dashboard"
    } else {
      // Unknown user type - redirect to profile completion or error page
      console.warn("Unknown user type:", profile.user_type)
      url.pathname = "/auth/error?message=invalid_user_type"
      return NextResponse.redirect(url)
    }

    return NextResponse.redirect(url)
  }

  return response
}

export default updateSession