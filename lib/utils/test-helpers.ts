import type { TechnicalTestAnswer, TechnicalTestQuestion } from "@/lib/types"

/**
 * Format test answers as structured JSON for backend submission
 */
export function formatTestAnswersAsJSON(
  answers: Map<string, string | string[]>
): TechnicalTestAnswer[] {
  const formattedAnswers: TechnicalTestAnswer[] = []
  
  answers.forEach((answer, questionId) => {
    formattedAnswers.push({
      questionId,
      answer,
    })
  })
  
  return formattedAnswers
}

/**
 * Validate test answer format
 */
export function validateTestAnswer(
  question: TechnicalTestQuestion,
  answer: string | string[]
): boolean {
  if (!answer) return false
  
  switch (question.type) {
    case "MULTIPLE_CHOICE":
      return typeof answer === "string" && answer.length > 0
    
    case "SHORT_ANSWER":
      return typeof answer === "string" && answer.trim().length > 0
    
    case "LONG_ANSWER":
      return typeof answer === "string" && answer.trim().length >= 10
    
    case "CODE":
      return typeof answer === "string" && answer.trim().length > 0
    
    default:
      return false
  }
}

/**
 * Calculate progress percentage
 */
export function calculateTestProgress(
  totalQuestions: number,
  answeredQuestions: number
): number {
  if (totalQuestions === 0) return 0
  return Math.round((answeredQuestions / totalQuestions) * 100)
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeTestInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}
