import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import ViewSubmittedResumeButton from "@/components/hr/ViewSubmittedResumeButton";
import { updateApplicationStatus } from "../candidates/actions";

// Calculate match score function
function calculateMatchScore(profile: any, job: any): number {
  let totalScore = 0;
  let maxScore = 0;

  // 1. Location Match (20 points)
  maxScore += 20;
  if (profile?.location && job?.location) {
    const profileLocation = profile.location.toLowerCase().trim();
    const jobLocation = job.location.toLowerCase().trim();
    
    if (profileLocation === jobLocation) {
      totalScore += 20;
    } else if (
      profileLocation.includes(jobLocation) || 
      jobLocation.includes(profileLocation)
    ) {
      totalScore += 15;
    } else if (
      profileLocation.split(',')[0].trim() === jobLocation.split(',')[0].trim()
    ) {
      totalScore += 10;
    }
  }

  // 2. Experience Level Match (25 points)
  maxScore += 25;
  if (profile?.experience_level && job?.experience_level) {
    const experienceLevels = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];
    const profileLevel = experienceLevels.indexOf(profile.experience_level.toLowerCase());
    const jobLevel = experienceLevels.indexOf(job.experience_level.toLowerCase());
    
    if (profileLevel >= 0 && jobLevel >= 0) {
      if (profileLevel === jobLevel) {
        totalScore += 25;
      } else if (Math.abs(profileLevel - jobLevel) === 1) {
        totalScore += 20;
      } else if (Math.abs(profileLevel - jobLevel) === 2) {
        totalScore += 10;
      }
    }
  }

  // 3. Skills Match (35 points)
  maxScore += 35;
  if (profile?.skills && job?.required_skills && Array.isArray(job.required_skills) && job.required_skills.length > 0) {
    const profileSkills = Array.isArray(profile.skills) 
      ? profile.skills.map((s: string) => s.toLowerCase().trim())
      : [];
    const jobSkills = job.required_skills.map((s: string) => s.toLowerCase().trim());
    
    const matchingSkills = jobSkills.filter((skill: string) => 
      profileSkills.some((pSkill: string) => 
        pSkill.includes(skill) || skill.includes(pSkill)
      )
    );
    
    if (jobSkills.length > 0) {
      const skillMatchPercentage = matchingSkills.length / jobSkills.length;
      totalScore += Math.round(skillMatchPercentage * 35);
    }
  }

  // 4. Keyword Match in Bio/Description (20 points)
  maxScore += 20;
  if (profile?.bio && job?.description) {
    const bioText = profile.bio.toLowerCase();
    const jobKeywords = extractKeywords(job.description + ' ' + (job.title || ''));
    
    let keywordMatches = 0;
    jobKeywords.forEach((keyword: string) => {
      if (bioText.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    });
    
    if (jobKeywords.length > 0) {
      const keywordMatchPercentage = keywordMatches / jobKeywords.length;
      totalScore += Math.round(keywordMatchPercentage * 20);
    }
  }

  // Calculate final percentage
  const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  return Math.max(0, Math.min(100, finalScore));
}

// Extract keywords helper function
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  return Array.from(wordCount.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, _]) => word);
}

export default async function HRCandidatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "hr") {
    redirect("/auth/login");
  }

  const { data: applications, error } = await supabase
    .from("applications")
    .select("*, jobs!inner(*), profiles!applications_user_id_fkey(*)")
    .eq("jobs.posted_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
  }

  // Calculate match scores for each application
  const applicationsWithScores = (applications || []).map(application => {
    const matchScore = calculateMatchScore(
      application.profiles,
      application.jobs
    );
    
    return {
      ...application,
      calculated_match_score: matchScore
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userType="hr" userName={profile.first_name} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidates</h1>
        <p className="text-gray-600 mb-6">Review and manage job applications</p>

        {applicationsWithScores && applicationsWithScores.length > 0 ? (
          <div className="space-y-6">
            {applicationsWithScores.map((application) => {
              const resumeUrl =
                application.selected_resume_url ||
                application.profiles?.resume_url ||
                null;

              return (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-lg font-bold text-green-600">
                            {application.profiles?.first_name?.[0]}
                            {application.profiles?.last_name?.[0]}
                          </span>
                        </div>

                        <div>
                          <CardTitle className="text-lg">
                            {application.profiles?.first_name}{" "}
                            {application.profiles?.last_name}
                          </CardTitle>

                          <p className="text-sm text-gray-600">
                            Applied for: {application.jobs?.title} •{" "}
                            {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-800">
                          {application.calculated_match_score}% Match
                        </Badge>

                        <Badge
                          className={
                            application.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : application.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {application.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3 text-gray-600 text-sm">
                      <p>Email: {application.profiles.email}</p>
                      {application.profiles.phone && (
                        <p>Phone: {application.profiles.phone}</p>
                      )}
                      {application.profiles.location && (
                        <p>Location: {application.profiles.location}</p>
                      )}
                    </div>

                    <div className="flex gap-3 mt-4">
                      {resumeUrl && (
                        <ViewSubmittedResumeButton url={resumeUrl} />
                      )}

                      {/* ACCEPT BUTTON */}
                      <form action={updateApplicationStatus.bind(null, application.id, "accepted")}>
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="bg-green-50 text-green-700"
                        >
                          Accept
                        </Button>
                      </form>

                      {/* REJECT BUTTON */}
                      <form action={updateApplicationStatus.bind(null, application.id, "rejected")}>
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="bg-red-50 text-red-700"
                        >
                          Reject
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <svg
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No candidates yet
              </h3>
              <p className="text-gray-500">
                Applications will appear here once candidates apply to your jobs.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}