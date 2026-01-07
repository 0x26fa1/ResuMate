"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const errorType = searchParams.get("type") || "unknown"
  const errorMessage = searchParams.get("message") || "Sorry, something went wrong during authentication. Please try again."

  // Define user-friendly error messages and actions based on error type
  const getErrorDetails = () => {
    switch (errorType) {
      case "otp_expired":
        return {
          title: "Email Link Expired",
          message: "Your email verification link has expired. Magic links are valid for 60 seconds for security reasons.",
          action: "Request New Link",
          showRequestLink: true,
        }
      case "access_denied":
        return {
          title: "Access Denied",
          message: errorMessage,
          action: "Try Again",
          showRequestLink: false,
        }
      case "invalid_callback":
        return {
          title: "Invalid Authentication",
          message: "The authentication callback was invalid. This may happen if you followed an incomplete link.",
          action: "Return to Sign In",
          showRequestLink: false,
        }
      case "exchange_failed":
        return {
          title: "Authentication Failed",
          message: `Failed to complete authentication: ${errorMessage}`,
          action: "Try Again",
          showRequestLink: false,
        }
      case "profile_error":
        return {
          title: "Profile Not Found",
          message: "Your account was authenticated but your profile could not be loaded. Please contact support.",
          action: "Back to Sign In",
          showRequestLink: false,
        }
      case "unauthorized":
        return {
          title: "Unauthorized",
          message: "You don't have permission to access this page. Please check your account type.",
          action: "Back to Sign In",
          showRequestLink: false,
        }
      case "invalid_user_type":
        return {
          title: "Invalid Account Type",
          message: "Your account type is not recognized. Please contact support.",
          action: "Back to Sign In",
          showRequestLink: false,
        }
      default:
        return {
          title: "Authentication Error",
          message: errorMessage,
          action: "Back to Sign In",
          showRequestLink: false,
        }
    }
  }

  const errorDetails = getErrorDetails()

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-red-50 to-orange-100">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">{errorDetails.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{errorDetails.message}</p>

              <div className="space-y-2">
                <Link href="/auth/login">
                  <Button variant="default" className="w-full bg-red-600 hover:bg-red-700">
                    {errorDetails.action}
                  </Button>
                </Link>

                {errorDetails.showRequestLink && (
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full">
                      Request New Link
                    </Button>
                  </Link>
                )}
              </div>

              {errorType === "otp_expired" && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Tip:</strong> After requesting a new link, check your email and click the link immediately to
                    avoid expiration.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-4">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  )
}
