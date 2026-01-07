"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, AlertTriangle, TrendingUp, Zap } from "lucide-react"

interface ResumeAnalysisDisplayProps {
  analysis: {
    score: number
    atsCompatible: boolean
    strengths: string[]
    improvements: string[]
    keywords: string[]
    missingKeywords: string[]
    summary: string
    detailedFeedback: string
    skillsIdentified: string[]
    experienceLevel: string
    recommendations: string[]
    grammarIssues?: string[]
  }
}

export function AnalysisResults({ analysis }: ResumeAnalysisDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  return (
    <div className="w-full space-y-6">
      {/* Subscription Features Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-blue-600" />
            Premium Analysis Features
          </CardTitle>
          <CardDescription>
            This analysis includes AI Analysis, Grammar Check, Keyword Optimization, and ATS Compatibility Check
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>AI Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Advanced Grammar Checker</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Keyword Optimization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>ATS Compatibility Check</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Resume Analysis Score</CardTitle>
          <CardDescription>{analysis.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div
              className={`text-5xl font-bold ${getScoreColor(analysis.score)} ${getScoreBg(analysis.score)} rounded-lg p-4 min-w-24 text-center`}
            >
              {analysis.score}
            </div>
            <div className="flex-1">
              <Progress value={analysis.score} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">Overall resume quality score (0-100)</p>
            </div>
          </div>

          {/* ATS Compatibility */}
          <div className="flex items-center gap-3 pt-2">
            {analysis.atsCompatible ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">ATS Compatible</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">May have ATS formatting issues</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Details */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
          <TabsTrigger value="recommendations">Tips</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{analysis.detailedFeedback}</p>

              <div>
                <h4 className="font-semibold text-sm mb-2">Experience Level</h4>
                <Badge variant="secondary" className="capitalize">
                  {analysis.experienceLevel}
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Skills Identified</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.skillsIdentified.slice(0, 8).map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                  {analysis.skillsIdentified.length > 8 && (
                    <Badge variant="outline">+{analysis.skillsIdentified.length - 8} more</Badge>
                  )}
                </div>
              </div>

              {analysis.grammarIssues && analysis.grammarIssues.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                  <h4 className="font-semibold text-sm mb-2 text-orange-900">Grammar & Writing Issues</h4>
                  <ul className="text-sm space-y-1">
                    {analysis.grammarIssues.map((issue, idx) => (
                      <li key={idx} className="text-orange-800">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strengths Tab */}
        <TabsContent value="strengths" className="space-y-3">
          {analysis.strengths.map((strength, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6 flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{strength}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-3">
          {analysis.improvements.map((improvement, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{improvement}</p>
              </CardContent>
            </Card>
          ))}

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-base">Missing Keywords</CardTitle>
              <CardDescription>These keywords are common in your industry and could improve ATS scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="border-orange-300">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-3">
          {analysis.recommendations.map((rec, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6 flex gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{rec}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Keywords Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identified Keywords</CardTitle>
          <CardDescription>Keywords detected in your resume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
