"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Loader2, TrendingUp, FileText, Shield, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AnalysisModalProps {
  resumeId: string
  fileName: string
  existingScore?: number
  isPremium: boolean // added prop
  children: React.ReactNode
}

interface AnalysisData {
  score: number
  atsCompatible: boolean
  keywords: string[]
  missingKeywords: string[]
  strengths: string[]
  improvements: string[]
  grammarIssues?: string[]
  formattingIssues?: string[]
  skills?: {
    technical: Array<{ name: string; level: string }>
    soft: Array<{ name: string; level: string }>
  }
  experienceQuality?: {
    score: number
    feedback: string
  }
}

export default function AnalysisModal({
  resumeId,
  fileName,
  existingScore,
  isPremium, // added
  children
}: AnalysisModalProps) {
  
  const isFreePlan = !isPremium // free plan check

  const [open, setOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // blur wrapper for locked tabs
  const LockedSection = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      <div className="pointer-events-none blur-sm opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg p-4">
        <p className="text-white text-center text-sm font-medium">
          Upgrade to Premium to unlock Keyword Optimization & ATS Compatibility Check
        </p>
      </div>
    </div>
  )

  const startAnalysis = async () => {
    setAnalyzing(true)
    setError(null)
    
    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, fileName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const result = await response.json()
      setAnalysis(result.data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !analysis && !analyzing) {
      startAnalysis()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Resume Analysis
          </DialogTitle>
        </DialogHeader>

        {/* Loading */}
        {analyzing && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Your Resume...</h3>
            <p className="text-gray-600 mb-4">
              Our AI is reviewing your resume for ATS compatibility, keywords, and improvements
            </p>
            <Progress value={undefined} className="w-64 mx-auto" />
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {analysis && !analyzing && (
          <div className="space-y-6">

            {/* Score */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">Overall Score</h3>
                    <p className="text-gray-600">Resume effectiveness rating</p>
                  </div>
                  <div className="text-5xl font-bold">
                    <span className={
                      analysis.score >= 80 ? "text-green-600" :
                      analysis.score >= 60 ? "text-yellow-600" :
                      "text-red-600"
                    }>
                      {analysis.score}
                    </span>
                    <span className="text-2xl text-gray-400">/100</span>
                  </div>
                </div>
                <Progress 
                  value={analysis.score}
                  className={
                    analysis.score >= 80
                      ? "bg-green-100 [&>div]:bg-green-600"
                      : analysis.score >= 60
                      ? "bg-yellow-100 [&>div]:bg-yellow-600"
                      : "bg-red-100 [&>div]:bg-red-600"
                  }
                />
              </CardContent>
            </Card>

            {/* TABS */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="grammar">Grammar</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="ats">ATS Check</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-4">
                {isFreePlan ? ( // locked overview
                  <LockedSection>
                    <>
                      {/* original overview code unchanged */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.strengths.map((strength, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            Recommended Improvements
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.improvements.map((improvement, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {analysis.skills && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Skills Analysis</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Technical Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {analysis.skills.technical.map((skill, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    {skill.name} - {skill.level}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Soft Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {analysis.skills.soft.map((skill, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                    {skill.name} - {skill.level}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  </LockedSection>
                ) : (
                  <>
                    {/* PREMIUM UNLOCKED — original code remains unchanged */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          Recommended Improvements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.improvements.map((improvement, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {analysis.skills && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Skills Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Technical Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.skills.technical.map((skill, idx) => (
                                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                  {skill.name} - {skill.level}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Soft Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.skills.soft.map((skill, idx) => (
                                <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                  {skill.name} - {skill.level}
                                </span>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* GRAMMAR — ALWAYS UNLOCKED */}
              <TabsContent value="grammar" className="space-y-4">
                {analysis.grammarIssues && analysis.grammarIssues.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-600" />
                        Grammar & Clarity Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.grammarIssues.map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-2 p-3 bg-orange-50 rounded">
                            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="text-gray-600">No grammar issues detected!</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* KEYWORDS */}
              <TabsContent value="keywords" className="space-y-4">
                {isFreePlan ? ( // locked keywords
                  <LockedSection>
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Keywords Found ({analysis.keywords.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords.map((keyword, idx) => (
                              <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            Missing Keywords ({analysis.missingKeywords.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-3">
                            Consider adding these industry-relevant keywords to improve ATS compatibility:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.missingKeywords.map((keyword, idx) => (
                              <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  </LockedSection>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Keywords Found ({analysis.keywords.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analysis.keywords.map((keyword, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          Missing Keywords ({analysis.missingKeywords.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                          Consider adding these industry-relevant keywords to improve ATS compatibility:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.missingKeywords.map((keyword, idx) => (
                            <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* ATS */}
              <TabsContent value="ats" className="space-y-4">
                {isFreePlan ? ( // locked ats
                  <LockedSection>
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            ATS Compatibility Check
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div
                            className="flex items-center gap-4 p-4 rounded-lg"
                            style={{
                              backgroundColor: analysis.atsCompatible ? "#f0fdf4" : "#fef2f2"
                            }}
                          >
                            {analysis.atsCompatible ? (
                              <CheckCircle className="h-12 w-12 text-green-600" />
                            ) : (
                              <XCircle className="h-12 w-12 text-red-600" />
                            )}
                            <div>
                              <h3 className="font-semibold text-lg mb-1">
                                {analysis.atsCompatible ? "ATS Compatible ✓" : "Not ATS Compatible ✗"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {analysis.atsCompatible
                                  ? "Your resume should pass most automated screening systems"
                                  : "Your resume may be rejected by automated screening systems"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  </LockedSection>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          ATS Compatibility Check
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="flex items-center gap-4 p-4 rounded-lg"
                          style={{
                            backgroundColor: analysis.atsCompatible ? "#f0fdf4" : "#fef2f2"
                          }}
                        >
                          {analysis.atsCompatible ? (
                            <CheckCircle className="h-12 w-12 text-green-600" />
                          ) : (
                            <XCircle className="h-12 w-12 text-red-600" />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg mb-1">
                              {analysis.atsCompatible ? "ATS Compatible ✓" : "Not ATS Compatible ✗"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {analysis.atsCompatible
                                ? "Your resume should pass most automated screening systems"
                                : "Your resume may be rejected by automated screening systems"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
