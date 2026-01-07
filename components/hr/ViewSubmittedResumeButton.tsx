"use client"

import { Button } from "@/components/ui/button"

export default function ViewSubmittedResumeButton({ url }: { url: string }) {
  return (
    <Button size="sm" onClick={() => window.open(url, "_blank")}>
      View Submitted Resume
    </Button>
  )
}
