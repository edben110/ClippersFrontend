# Technical Tests - Frontend Implementation

## Overview
This document describes the frontend implementation for technical tests, including markdown rendering and JSON-structured answer submission.

## Components

### 1. MarkdownRenderer
Renders markdown content with custom styling.

```tsx
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

<MarkdownRenderer 
  content="# Question\nWhat is React?" 
  className="my-4"
/>
```

### 2. Test Answer Formatting
Answers are formatted as structured JSON before submission to backend.

```tsx
import { formatTestAnswersAsJSON } from "@/lib/utils/test-helpers"

// Example: Collecting answers
const answers = new Map<string, string | string[]>()
answers.set("question-1", "React is a JavaScript library")
answers.set("question-2", ["Option A", "Option C"]) // Multiple choice

// Format for backend submission
const formattedAnswers = formatTestAnswersAsJSON(answers)
// Result: [
//   { questionId: "question-1", answer: "React is a JavaScript library" },
//   { questionId: "question-2", answer: ["Option A", "Option C"] }
// ]
```

## Types

### TechnicalTest
```typescript
interface TechnicalTest {
  id: string
  jobId: string
  title: string
  description: string
  questions: TechnicalTestQuestion[]
  timeLimit?: number // in minutes
  passingScore?: number
  isActive: boolean
}
```

### TechnicalTestQuestion
```typescript
interface TechnicalTestQuestion {
  id: string
  question: string
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "LONG_ANSWER" | "CODE"
  options?: string[] // For multiple choice
  points: number
  order: number
}
```

### TechnicalTestSubmission
```typescript
interface TechnicalTestSubmission {
  id: string
  testId: string
  userId: string
  answers: TechnicalTestAnswer[]
  score?: number
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED"
  startedAt: string
  submittedAt?: string
}
```

### TechnicalTestAnswer
```typescript
interface TechnicalTestAnswer {
  questionId: string
  answer: string | string[] // Structured JSON format
  isCorrect?: boolean // Set by backend
  points?: number // Set by backend
}
```

## Helper Functions

### formatTestAnswersAsJSON
Converts a Map of answers to structured JSON array.

```typescript
formatTestAnswersAsJSON(answers: Map<string, string | string[]>): TechnicalTestAnswer[]
```

### validateTestAnswer
Validates answer format based on question type.

```typescript
validateTestAnswer(question: TechnicalTestQuestion, answer: string | string[]): boolean
```

### calculateTestProgress
Calculates completion percentage.

```typescript
calculateTestProgress(totalQuestions: number, answeredQuestions: number): number
```

### formatTimeRemaining
Formats seconds into HH:MM:SS or MM:SS.

```typescript
formatTimeRemaining(seconds: number): string
```

### sanitizeTestInput
Sanitizes user input to prevent XSS attacks.

```typescript
sanitizeTestInput(input: string): string
```

## Example Usage

```tsx
"use client"

import { useState } from "react"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { formatTestAnswersAsJSON, validateTestAnswer } from "@/lib/utils/test-helpers"
import type { TechnicalTest, TechnicalTestAnswer } from "@/lib/types"

export function TechnicalTestComponent({ test }: { test: TechnicalTest }) {
  const [answers, setAnswers] = useState<Map<string, string>>(new Map())
  
  const handleSubmit = async () => {
    // Format answers as JSON
    const formattedAnswers = formatTestAnswersAsJSON(answers)
    
    // Submit to backend
    await fetch(`/api/tests/${test.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: formattedAnswers // Structured JSON format
      })
    })
  }
  
  return (
    <div>
      <h1>{test.title}</h1>
      <MarkdownRenderer content={test.description} />
      
      {test.questions.map((question) => (
        <div key={question.id}>
          <MarkdownRenderer content={question.question} />
          <input
            type="text"
            onChange={(e) => {
              const newAnswers = new Map(answers)
              newAnswers.set(question.id, e.target.value)
              setAnswers(newAnswers)
            }}
          />
        </div>
      ))}
      
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

## Backend Integration

The frontend sends answers in this JSON structure:

```json
{
  "answers": [
    {
      "questionId": "q1",
      "answer": "React is a JavaScript library"
    },
    {
      "questionId": "q2",
      "answer": ["Option A", "Option C"]
    }
  ]
}
```

The backend should:
1. Receive this JSON structure
2. Store it as JSON (not markdown)
3. Grade the answers
4. Return results with `isCorrect` and `points` fields populated
