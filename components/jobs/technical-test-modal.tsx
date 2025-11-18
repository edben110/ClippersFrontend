"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import type { TechnicalTest } from "@/lib/types"
import { FiSend, FiClock, FiCheckCircle } from "react-icons/fi"

interface TechnicalTestModalProps {
  test: TechnicalTest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTestSubmitted?: () => void
}

export function TechnicalTestModal({ 
  test, 
  open, 
  onOpenChange,
  onTestSubmitted 
}: TechnicalTestModalProps) {
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  if (!test) return null

  const handleSubmit = async () => {
    if (!response.trim()) {
      toast({
        title: "Error",
        description: "Por favor escribe tu respuesta",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      await apiClient.post(`/jobs/technical-tests/${test.id}/submit`, {
        response: response.trim()
      })

      toast({
        title: "✅ Respuesta enviada",
        description: "Tu respuesta ha sido enviada correctamente"
      })

      onTestSubmitted?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta",
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
        return <Badge className="bg-green-500"><FiCheckCircle className="mr-1" /> Revisada {test.score && `- ${test.score}/100`}</Badge>
      default:
        return null
    }
  }

  const canSubmit = test.status === "SENT" || test.status === "IN_PROGRESS"

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let questionNumber = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Main title
      if (line.startsWith('# ')) {
        elements.push(
          <div key={i} className="mb-8 pb-6 border-b-4 border-primary/30">
            <h1 className="text-5xl font-extrabold text-primary">
              {line.substring(2)}
            </h1>
          </div>
        )
      }
      // Section headers
      else if (line.startsWith('## ')) {
        elements.push(
          <div key={i} className="mt-12 mb-6 bg-primary/10 p-6 rounded-xl border-l-4 border-primary">
            <h2 className="text-3xl font-bold text-foreground">
              {line.substring(3)}
            </h2>
          </div>
        )
      }
      // Subsection headers
      else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-2xl font-semibold mb-4 mt-8 text-foreground">
            {line.substring(4)}
          </h3>
        )
      }
      // Bullet points (not options)
      else if (line.startsWith('- ') && !line.match(/^- [A-D]\)/)) {
        elements.push(
          <li key={i} className="ml-8 mb-3 list-disc text-lg leading-relaxed">
            {line.substring(2)}
          </li>
        )
      }
      // Multiple choice options A), B), C), D)
      else if (line.match(/^[A-D]\)/)) {
        const match = line.match(/^([A-D]\))(.*)/)
        if (match) {
          elements.push(
            <div key={i} className="mb-4 p-5 bg-card rounded-xl hover:bg-accent transition-all border-2 border-border hover:border-primary/50 cursor-pointer group">
              <div className="flex items-start gap-4">
                <span className="font-bold text-primary text-2xl min-w-[40px] group-hover:scale-110 transition-transform">
                  {match[1]}
                </span>
                <span className="text-lg leading-relaxed flex-1">
                  {match[2].trim()}
                </span>
              </div>
            </div>
          )
        }
      }
      // Numbered lists (questions)
      else if (line.match(/^\d+\./)) {
        questionNumber++
        elements.push(
          <div key={i} className="mb-4 p-5 bg-muted/30 rounded-lg border-l-4 border-primary/50">
            <div className="text-lg leading-relaxed font-medium">
              {line}
            </div>
          </div>
        )
      }
      // Code blocks
      else if (line.startsWith('   ') || line.startsWith('\t')) {
        elements.push(
          <pre key={i} className="bg-slate-900 text-slate-100 p-5 rounded-lg overflow-x-auto text-base font-mono border-2 border-slate-700 my-4">
            <code>{line}</code>
          </pre>
        )
      }
      // Bold text **text** (Questions)
      else if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/)
        questionNumber++
        elements.push(
          <div key={i} className="mb-6 mt-8 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border-l-4 border-primary">
            <div className="flex items-start gap-4">
              <span className="text-primary font-bold text-2xl min-w-[40px]">{questionNumber}.</span>
              <div className="text-xl leading-relaxed flex-1">
                {parts.map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
                  }
                  return <span key={j} className="text-muted-foreground">{part}</span>
                })}
              </div>
            </div>
          </div>
        )
      }
      // Empty lines
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />)
      }
      // Regular paragraphs (instructions, notes)
      else if (line.trim()) {
        elements.push(
          <p key={i} className="mb-4 text-base leading-relaxed text-muted-foreground italic pl-4 border-l-2 border-muted">
            {line}
          </p>
        )
      }
    }
    
    return elements
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] w-[85vw] max-h-[92vh] overflow-hidden flex flex-col p-0 sm:!max-w-[85vw]">
        <DialogHeader className="flex-shrink-0 border-b px-10 py-5 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">📝 Prueba Técnica</DialogTitle>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-10 py-6">
          {/* Test Content */}
          <div className="w-full space-y-6">
            {renderMarkdown(test.testMarkdown)}
          </div>

          {/* Response Section */}
          {canSubmit && (
            <div className="mt-10 pt-8 border-t-2 border-primary/30">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <FiSend className="h-6 w-6 text-primary" />
                  <h3 className="font-bold text-2xl text-foreground">Tu Respuesta</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Escribe tu respuesta completa a todas las secciones de la prueba.
                </p>
                <Textarea
                  placeholder="Escribe tu respuesta aquí...

Ejemplo:
## Parte 1: Preguntas Teóricas
1. Mi respuesta a la pregunta 1...
2. Mi respuesta a la pregunta 2...

## Parte 2: Ejercicio Práctico
[Tu código o solución aquí]
"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={12}
                  className="font-mono text-sm min-h-[300px] resize-y border-2 focus:border-primary"
                />
                <div className="flex justify-between items-center gap-4 pt-4">
                  <p className="text-xs text-muted-foreground">
                    {response.length} caracteres
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Guardar y Cerrar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-[150px]">
                      <FiSend className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Enviando..." : "Enviar Respuesta"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submitted Response */}
          {test.status === "SUBMITTED" && test.candidateResponse && (
            <div className="mt-10 pt-8 border-t-2 border-blue-500/30">
              <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/20">
                <h3 className="font-bold text-xl mb-4 text-blue-600">Tu Respuesta Enviada</h3>
                <div className="bg-card p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{test.candidateResponse}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Reviewed Response */}
          {test.status === "REVIEWED" && (
            <div className="mt-10 pt-8 border-t-2 border-green-500/30">
              <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl text-green-600">Resultado</h3>
                  {test.score && (
                    <div className="text-3xl font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-6 py-3 rounded-lg">
                      {test.score}/100
                    </div>
                  )}
                </div>
                {test.candidateResponse && (
                  <div className="bg-card p-4 rounded-lg border">
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{test.candidateResponse}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
