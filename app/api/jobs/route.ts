import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Normalize input into an array
function normalizeToArray(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  // Treat textarea as array lines
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

/* --------------------------------------------------
   POST — CREATE JOB
-------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify HR
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "hr") {
      return NextResponse.json(
        { error: "Only HR users can post jobs" },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json();
    const {
      title,
      company_name,
      location,
      job_type,
      experience_level,
      salary_range,
      description,
      requirements,
      responsibilities,
      benefits,
    } = body;

    if (!title || !company_name || !location || !description || !requirements) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, company_name, location, description, requirements",
        },
        { status: 400 }
      );
    }

    // Convert text to arrays
    const reqArray = normalizeToArray(requirements);
    const respArray = normalizeToArray(responsibilities);
    const benArray = normalizeToArray(benefits);

    // Insert job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        posted_by: user.id,
        title,
        company_name,
        location,
        job_type: job_type || "full-time",
        experience_level: experience_level || "entry",
        salary_range,
        description,
        requirements: reqArray,
        responsibilities: respArray,
        benefits: benArray,
        status: "active",
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json(
        { error: jobError.message || "Failed to create job posting." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job posted successfully",
      data: job,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* --------------------------------------------------
   PUT — UPDATE JOB
-------------------------------------------------- */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse input
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Ensure arrays are formatted
    updates.requirements = normalizeToArray(updates.requirements);
    updates.responsibilities = normalizeToArray(updates.responsibilities);
    updates.benefits = normalizeToArray(updates.benefits);

    // Update the job
    const { data, error } = await supabase
      .from("jobs")
      .update({
        ...updates,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update job" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job updated successfully",
      data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/* --------------------------------------------------
   DELETE — REMOVE JOB
-------------------------------------------------- */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Delete job
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("posted_by", user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to delete job" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
