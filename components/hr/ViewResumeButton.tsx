"use client"

import { Button } from "@/components/ui/button"

export default function ViewResumeButton({ resumeUrl }: { resumeUrl: string }) {
  return (
    <Button
      size="sm"
      onClick={() => window.open(resumeUrl, "_blank")}
    >
      View Resume
    </Button>
  )
}
