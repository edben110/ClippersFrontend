"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import type { TechnicalTest } from "@/lib/types"
import { FiCheckCircle, FiClock, FiStar } from "react-icons/fi"

interface ReviewTechnicalTestModalProps {
  test: TechnicalTest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTestReviewed?: () => void
}

export function ReviewTechnicalTestModal({
  test,
  open,
  onOpenChange,
  onTestReviewed
}: ReviewTechnicalTestModalProps) {
  const [score, setScore] = useState<string>(test?.score?.toString() || "")
  const [feedback, setFeedback] = useState<string>(test?.feedback || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  if (!test) return null

  const handleSubmit = async () => {
    const scoreNum = parseInt(score)
    
    if (!score || scoreNum < 0 || scoreNum > 100) {
      toast({
        title: "Error",
        description: "Por favor ingresa una puntuación válida entre 0 y 100",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      await apiClient.post(`/jobs/technical-tests/${test.id}/review`, {
        score: scoreNum,
        feedback: feedback.trim() || null
      })

      toast({
        title: "✅ Prueba evaluada",
        description: "La evaluación ha sido guardada correctamente"
      })

      onTestReviewed?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la evaluación",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = () => {
    switch (test.status) {
      case "SENT":
        return <Badge variant="secondary"><FiClock className="mr-1" /> Pendiente</Badge>
      case "IN_PROGRESS":
        return <Badge variant="secondary"><FiClock className="mr-1" /> En progreso</Badge>
      case "SUBMITTED":
        return <Badge className="bg-blue-500"><FiCheckCircle className="mr-1" /> Enviada</Badge>
      case "REVIEWED":
        return <Badge className="bg-green-500"><FiCheckCircle className="mr-1" /> Revisada</Badge>
      default:
        return null
    }
  }

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={i} className="text-3xl font-bold mb-4 mt-2 text-primary border-b-2 border-primary/20 pb-3">
            {line.substring(2)}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-2xl font-bold mb-3 mt-6 text-foreground bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-xl font-semibold mb-2 mt-4 text-foreground">
            {line.substring(4)}
          </h3>
        )
      } else if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-6 mb-2 list-disc text-base">
            {line.substring(2)}
          </li>
        )
      } else if (line.match(/^\d+\./)) {
        return (
          <li key={i} className="ml-6 mb-2 list-decimal text-base font-medium">
            {line.replace(/^\d+\.\s*/, '')}
          </li>
        )
      } else if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/)
        return (
          <p key={i} className="mb-3 text-base">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>
              }
              return <span key={j}>{part}</span>
            })}
          </p>
        )
      } else if (line.trim() === '') {
        return <div key={i} className="h-2" />
      } else if (line.trim()) {
        return <p key={i} className="mb-2 text-sm text-muted-foreground">{line}</p>
      }
      return null
    })
  }

  const canReview = test.status === "SUBMITTED" || test.status === "REVIEWED"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] w-[85vw] max-h-[92vh] overflow-hidden flex flex-col p-0 sm:!max-w-[85vw]">
        <DialogHeader className="flex-shrink-0 border-b px-8 py-5 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">📋 Revisar Prueba Técnica</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Candidato: {test.candidateName || "Sin nombre"}
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Test Content */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📝</span> Contenido de la Prueba
            </h3>
            <div className="bg-muted/30 p-6 rounded-xl border">
              {renderMarkdown(test.testMarkdown)}
            </div>
          </div>

          {/* Candidate Response */}
          {test.candidateResponse && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>💬</span> Respuesta del Candidato
              </h3>
              <div className="bg-blue-500/10 p-6 rounded-xl border-2 border-blue-500/20">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {test.candidateResponse}
                </pre>
              </div>
            </div>
          )}

          {/* Review Section */}
          {canReview && (
            <div className="border-t-2 border-primary/30 pt-8">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FiStar className="text-primary" />
                  Evaluación
                </h3>

                <div className="space-y-6">
                  {/* Score Input */}
                  <div className="space-y-2">
                    <Label htmlFor="score" className="text-base font-semibold">
                      Puntuación (0-100)
                    </Label>
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="Ej: 85"
                      className="text-lg font-bold"
                      disabled={test.status === "REVIEWED"}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ingresa una puntuación del 0 al 100 basada en la calidad de la respuesta
                    </p>
                  </div>

                  {/* Feedback Textarea */}
                  <div className="space-y-2">
                    <Label htmlFor="feedback" className="text-base font-semibold">
                      Retroalimentación (Opcional)
                    </Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Escribe comentarios sobre la respuesta del candidato...

Ejemplo:
- Buena comprensión de los conceptos fundamentales
- Falta profundidad en la explicación de...
- Excelente implementación del código
"
                      rows={8}
                      className="font-mono text-sm"
                      disabled={test.status === "REVIEWED"}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cerrar
                    </Button>
                    {test.status !== "REVIEWED" && (
                      <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="min-w-[150px]"
                      >
                        <FiCheckCircle className="mr-2" />
                        {isSubmitting ? "Guardando..." : "Guardar Evaluación"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Already Reviewed */}
          {test.status === "REVIEWED" && test.score !== null && (
            <div className="mt-6 p-6 bg-green-500/10 border-2 border-green-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-green-600">Evaluación Completada</h3>
                <div className="text-4xl font-bold text-green-600">
                  {test.score}/100
                </div>
              </div>
              {test.feedback && (
                <div className="mt-4 p-4 bg-card rounded-lg border">
                  <p className="text-sm font-semibold mb-2">Retroalimentación:</p>
                  <pre className="whitespace-pre-wrap text-sm">{test.feedback}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
