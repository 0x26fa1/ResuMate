// components/FeedbackCard.tsx
"use client"

import { useState } from "react"

type FeedbackWithSender = {
    id: number
    user_id: string
    subject: string
    description: string
    detailed_explanation: string
    feedback_type: string
    priority: string
    status: string | null
    created_at: string
    sender_name?: string
}

interface FeedbackCardProps {
    feedback: FeedbackWithSender
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
    const [status, setStatus] = useState(feedback.status || "Under Review")
    const [isUpdating, setIsUpdating] = useState(false)

    const handleStatusUpdate = async (newStatus: string) => {
        console.log("🔵 Button clicked! Starting update...")
        setIsUpdating(true)
        console.log("🔄 Updating status to:", newStatus, "for feedback ID:", feedback.id)
        console.log("📤 Request URL:", "/api/feedback/update-status")
        console.log("📤 Request body:", { feedbackId: feedback.id, status: newStatus })

        try {
            const response = await fetch("/api/feedback/update-status", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    feedbackId: feedback.id,
                    status: newStatus,
                }),
            })

            console.log("📥 Response status:", response.status, response.statusText)
            
            const data = await response.json()
            console.log("📡 API Response data:", data)

            if (!response.ok) {
                console.error("❌ Response not OK:", {
                    status: response.status,
                    statusText: response.statusText,
                    error: data.error,
                    fullData: data
                })
                throw new Error(data.error || `Failed with status ${response.status}`)
            }

            console.log("✅ Status updated successfully!")
            setStatus(newStatus)
            alert("Status updated successfully! Page will refresh.")
            window.location.reload()
        } catch (error) {
            console.error("❌ Error updating status:", error)
            console.error("❌ Error details:", {
                message: error instanceof Error ? error.message : 'Unknown error',
                error: error
            })
            alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck the browser console for more details.`)
        } finally {
            setIsUpdating(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Under Review":
                return "bg-blue-500"
            case "In Progress":
                return "bg-yellow-500"
            case "Resolved":
                return "bg-green-500"
            case "Closed":
                return "bg-gray-500"
            default:
                return "bg-blue-500"
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "high":
                return "text-red-600"
            case "medium":
                return "text-yellow-600"
            case "low":
                return "text-green-600"
            default:
                return "text-gray-600"
        }
    }

    console.log("🎨 FeedbackCard rendered for ID:", feedback.id)

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                    {feedback.subject}
                </h3>
                <span
                    className={`${getStatusColor(
                        status
                    )} text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap`}
                >
                    {status}
                </span>
            </div>

            {/* Metadata */}
            <div className="space-y-2 mb-4 text-sm text-gray-600">
                <p>
                    <span className="font-medium">Sender:</span>{" "}
                    {feedback.sender_name || "Unknown"}
                </p>
                <p>
                    <span className="font-medium">Type:</span>{" "}
                    {feedback.feedback_type} |{" "}
                    <span className="font-medium">Priority:</span>{" "}
                    <span className={getPriorityColor(feedback.priority)}>
                        {feedback.priority}
                    </span>
                </p>
            </div>

            {/* Summary */}
            <div className="mb-3">
                <p className="font-medium text-gray-700 mb-1">Summary:</p>
                <p className="text-gray-600 text-sm">{feedback.description}</p>
            </div>

            {/* Detailed Explanation */}
            <div className="mb-4">
                <p className="font-medium text-gray-700 mb-1">
                    Detailed Explanation:
                </p>
                <p className="text-gray-600 text-sm">
                    {feedback.detailed_explanation}
                </p>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-gray-500 mb-4">
                Submitted: {new Date(feedback.created_at).toLocaleString()}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => {
                        console.log("🖱️ Tag & Assign button clicked")
                        handleStatusUpdate("In Progress")
                    }}
                    disabled={isUpdating || status === "Resolved" || status === "Closed"}
                    className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isUpdating ? "Updating..." : "Tag & Assign"}
                </button>
                <button
                    onClick={() => {
                        console.log("🖱️ Mark Resolved button clicked")
                        handleStatusUpdate("Resolved")
                    }}
                    disabled={isUpdating || status === "Resolved" || status === "Closed"}
                    className="flex-1 bg-green-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isUpdating ? "Updating..." : "Mark Resolved"}
                </button>
            </div>
        </div>
    )
}