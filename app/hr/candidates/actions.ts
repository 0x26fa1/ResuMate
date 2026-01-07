"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateApplicationStatus(
  applicationId: string,
  status: "accepted" | "rejected"
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId)

  if (error) {
    console.error("Error updating application status:", error)
    throw new Error("Failed to update application status")
  }

  revalidatePath("/hr/candidates")
  redirect("/hr/candidates")
}