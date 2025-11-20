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

  // Parsear respuestas del candidato
  const parseSubmittedAnswers = () => {
    if (!test.candidateResponse) return {}
    
    const parsed: Record<string, string> = {}
    const lines = test.candidateResponse.split('\n')
    
    let currentQuestionId = ''
    let currentAnswer = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Detectar inicio de pregunta: "Pregunta qX:"
      const questionMatch = line.match(/^Pregunta (q\d+):/)
      
      if (questionMatch) {
        // Guardar la pregunta anterior si existe
        if (currentQuestionId && currentAnswer) {
          parsed[currentQuestionId] = currentAnswer.trim()
        }
        
        // Iniciar nueva pregunta
        currentQuestionId = questionMatch[1]
        currentAnswer = ''
      } else if (currentQuestionId && line.trim() && !line.startsWith('===')) {
        // Acumular respuesta
        currentAnswer += (currentAnswer ? '\n' : '') + line
      }
    }
    
    // Guardar la última pregunta
    if (currentQuestionId && currentAnswer) {
      parsed[currentQuestionId] = currentAnswer.trim()
    }
    
    return parsed
  }
  
  const submittedAnswers = parseSubmittedAnswers()

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let globalQuestionNumber = 0
    let displayQuestionNumber = 0
    let currentQuestionId = ''
    let currentQuestionText = ''
    let pendingOptions: Array<{letter: string, text: string}> = []
    let needsTextInput = false
    
    const flushQuestion = (index: number) => {
      if (!currentQuestionId) return
      
      const qId = currentQuestionId
      const opts = [...pendingOptions]
      const needsInput = needsTextInput
      
      // Renderizar opciones múltiples si existen
      if (opts.length > 0) {
        opts.forEach((opt, optIdx) => {
          const optionValue = `${opt.letter}) ${opt.text}`
          const isSelected = submittedAnswers[qId]?.includes(opt.letter)
          
          elements.push(
            <div 
              key={`${qId}-opt-${optIdx}`}
              className={`mb-3 p-5 rounded-xl border-2 cursor-default transition-all duration-300 ${
                isSelected 
                  ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 border-emerald-500 dark:border-emerald-400 shadow-xl' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0 transition-all shadow-md ${
                  isSelected 
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {isSelected ? '✓' : opt.letter}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-bold text-base ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      Opción {opt.letter}
                    </span>
                    {isSelected && (
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs shadow-md">
                        ✓ Seleccionada por el candidato
                      </Badge>
                    )}
                  </div>
                  <span className={`text-base leading-relaxed block ${isSelected ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                    {opt.text}
                  </span>
                </div>
              </div>
            </div>
          )
        })
      }
      // Renderizar campo de texto con respuesta si existe
      else if (needsInput) {
        const answerValue = submittedAnswers[qId] || ''
        
        if (answerValue) {
          elements.push(
            <div key={`${qId}-input`} className="mb-4 ml-0">
              <div className="p-3 rounded-lg border-2 bg-green-500/5 border-green-500/30">
                <label className="text-xs font-medium mb-2 block flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-green-600 dark:text-green-400">Respuesta del candidato:</span>
                </label>
                <div className="w-full p-3 bg-card rounded border-2 font-mono text-xs whitespace-pre-wrap">
                  {answerValue}
                </div>
              </div>
            </div>
          )
        }
      }
      
      // Reset
      currentQuestionId = ''
      currentQuestionText = ''
      pendingOptions = []
      needsTextInput = false
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Main title
      if (line.startsWith('# ')) {
        flushQuestion(i)
        elements.push(
          <div key={i} className="mb-5 pb-3 border-b-2 border-primary/20">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {line.substring(2)}
                </h1>
              </div>
            </div>
          </div>
        )
      }
      // Section headers
      else if (line.startsWith('## ')) {
        flushQuestion(i)
        
        const sectionTitle = line.substring(3)
        
        if (sectionTitle.includes('Parte')) {
          displayQuestionNumber = 0
        }
        
        const emoji = sectionTitle.includes('Información') ? 'ℹ️' :
                     sectionTitle.includes('Parte') || sectionTitle.includes('Pregunta') ? '❓' :
                     sectionTitle.includes('Ejercicio') ? '💻' :
                     sectionTitle.includes('Caso') ? '📊' :
                     sectionTitle.includes('Criterios') ? '✅' : '📌'
        
        elements.push(
          <div key={i} className="mt-8 mb-4 bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border-l-4 border-primary shadow-sm">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-2xl">{emoji}</span>
              {sectionTitle}
            </h2>
          </div>
        )
      }
      // Subsection headers
      else if (line.startsWith('### ')) {
        flushQuestion(i)
        
        const subsectionTitle = line.substring(4)
        const isExercise = subsectionTitle.toLowerCase().includes('ejercicio') ||
                          subsectionTitle.toLowerCase().includes('caso de estudio') ||
                          subsectionTitle.toLowerCase().includes('caso:')
        
        if (isExercise) {
          globalQuestionNumber++
          displayQuestionNumber++
          currentQuestionId = `q${globalQuestionNumber}`
          currentQuestionText = subsectionTitle
          needsTextInput = true
          
          elements.push(
            <div key={i} className="mb-4 mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-l-4 border-primary hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-base flex-shrink-0">
                  {displayQuestionNumber}
                </div>
                <h3 className="text-lg font-semibold text-foreground flex-1">
                  {subsectionTitle}
                </h3>
              </div>
            </div>
          )
        } else {
          elements.push(
            <h3 key={i} className="text-lg font-semibold mb-3 mt-6 text-foreground flex items-center gap-2">
              <span className="text-primary">▸</span>
              {subsectionTitle}
            </h3>
          )
        }
      }
      // Bullet points
      else if (line.startsWith('- ') && !line.match(/^- [A-D]\)/)) {
        elements.push(
          <li key={i} className="ml-6 mb-2 list-disc text-sm leading-relaxed">
            {line.substring(2)}
          </li>
        )
      }
      // Multiple choice options
      else if (line.match(/^\s*-?\s*[A-D]\)/)) {
        const match = line.match(/^\s*-?\s*([A-D]\))(.*)/)
        if (match) {
          pendingOptions.push({
            letter: match[1].charAt(0),
            text: match[2].trim()
          })
        }
      }
      // Numbered lists (questions)
      else if (line.match(/^\d+\./)) {
        flushQuestion(i)
        
        const match = line.match(/^(\d+)\.\s*(.*)/)
        if (match) {
          const questionText = match[2]
          const nextLines = lines.slice(i + 1, i + 6)
          const hasMultipleChoice = nextLines.some(l => l.match(/^\s*-?\s*[A-D]\)/))
          
          const isRealQuestion = (questionText.includes('?') || hasMultipleChoice) && 
                                 questionText.toLowerCase() !== 'preguntas:' &&
                                 questionText.trim().length > 15
          
          if (isRealQuestion) {
            globalQuestionNumber++
            displayQuestionNumber++
            currentQuestionId = `q${globalQuestionNumber}`
            currentQuestionText = questionText
            needsTextInput = !hasMultipleChoice
            
            elements.push(
              <div key={i} className="mb-4 mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-l-4 border-primary hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-base flex-shrink-0">
                    {displayQuestionNumber}
                  </div>
                  <div className="text-base leading-relaxed flex-1 font-medium">
                    {questionText}
                  </div>
                </div>
              </div>
            )
          } else {
            elements.push(
              <div key={i} className="mb-3 text-base leading-relaxed font-medium text-muted-foreground pl-4 border-l-2 border-muted">
                {match[1]}. {questionText}
              </div>
            )
          }
        }
      }
      // Code blocks
      else if (line.startsWith('```')) {
        flushQuestion(i)
        
        const language = line.substring(3).trim()
        let codeContent = ''
        let j = i + 1
        
        while (j < lines.length && !lines[j].startsWith('```')) {
          codeContent += lines[j] + '\n'
          j++
        }
        
        if (codeContent.trim()) {
          elements.push(
            <div key={i} className="my-4 rounded-lg overflow-hidden border border-slate-600/30 bg-slate-900/50">
              {language && (
                <div className="bg-slate-800/80 px-4 py-2 text-xs text-slate-400 font-semibold flex items-center gap-2">
                  <span>📄</span>
                  <span>{language.toUpperCase()}</span>
                  <span className="text-slate-500 font-normal ml-auto">Ejemplo de estructura</span>
                </div>
              )}
              <pre className="bg-slate-950/50 text-slate-300 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                <code>{codeContent.trim()}</code>
              </pre>
            </div>
          )
        }
        
        i = j
      }
      // Bold text (Questions)
      else if (line.includes('**')) {
        flushQuestion(i)
        
        const parts = line.split(/(\*\*.*?\*\*)/)
        const boldText = parts.find(p => p.startsWith('**') && p.endsWith('**'))?.slice(2, -2) || ''
        
        const isQuestion = line.includes('?') || 
                          boldText.toLowerCase().includes('pregunta') ||
                          boldText.toLowerCase().includes('ejercicio')
        
        const nextLines = lines.slice(i + 1, i + 6)
        const hasMultipleChoice = nextLines.some(l => l.match(/^\s*-?\s*[A-D]\)/))
        
        if (isQuestion || hasMultipleChoice) {
          globalQuestionNumber++
          displayQuestionNumber++
          currentQuestionId = `q${globalQuestionNumber}`
          currentQuestionText = line
          needsTextInput = !hasMultipleChoice && isQuestion
          
          elements.push(
            <div key={i} className="mb-4 mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-l-4 border-primary hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-base flex-shrink-0">
                  {displayQuestionNumber}
                </div>
                <div className="text-base leading-relaxed flex-1">
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
        } else {
          elements.push(
            <p key={i} className="mb-4 text-base leading-relaxed font-medium">
              {parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
                }
                return <span key={j}>{part}</span>
              })}
            </p>
          )
        }
      }
      // Empty lines
      else if (line.trim() === '') {
        if (currentQuestionId && (pendingOptions.length > 0 || needsTextInput)) {
          flushQuestion(i)
        }
        elements.push(<div key={i} className="h-2" />)
      }
      // Regular paragraphs
      else if (line.trim()) {
        const isInstruction = line.toLowerCase().includes('evalúe') ||
                             line.toLowerCase().includes('analice') ||
                             line.toLowerCase().includes('explique') ||
                             line.toLowerCase().includes('describa')
        
        if (isInstruction && currentQuestionId) {
          elements.push(
            <p key={i} className="mb-4 text-base leading-relaxed text-foreground font-medium pl-4 border-l-2 border-primary">
              {line}
            </p>
          )
          needsTextInput = true
        } else {
          elements.push(
            <p key={i} className="mb-4 text-base leading-relaxed text-muted-foreground italic pl-4 border-l-2 border-muted">
              {line}
            </p>
          )
        }
      }
    }
    
    flushQuestion(lines.length)
    
    return elements
  }

  const canReview = test.status === "SUBMITTED" || test.status === "REVIEWED"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[65vw] w-[65vw] max-h-[90vh] overflow-hidden flex flex-col p-0 sm:!max-w-[65vw] bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <DialogHeader className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 px-8 py-6 bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Revisar Prueba Técnica</DialogTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  👤 Candidato: <span className="font-bold text-slate-900 dark:text-slate-100">{test.candidateName || "Sin nombre"}</span>
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-950/50">
          {/* Message for submitted test */}
          {test.candidateResponse && (
            <div className="mb-8 p-5 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg">
                  <FiCheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">
                    ✓ Prueba Completada por el Candidato
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Las respuestas del candidato se muestran integradas en cada pregunta a continuación.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Test Content with Integrated Answers */}
          <div className="mb-6">
            <div className="space-y-4">
              {renderMarkdown(test.testMarkdown)}
            </div>
          </div>

          {/* Review Section */}
          {canReview && (
            <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-8 mt-8">
              <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-orange-950/20 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl shadow-lg">
                    <FiStar className="text-white h-6 w-6" />
                  </div>
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Evaluación</span>
                </h3>

                <div className="space-y-4">
                  {/* Score Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="score" className="text-sm font-semibold">
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
                      className="text-base font-bold"
                      disabled={test.status === "REVIEWED"}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ingresa una puntuación del 0 al 100 basada en la calidad de la respuesta
                    </p>
                  </div>

                  {/* Feedback Textarea */}
                  <div className="space-y-1.5">
                    <Label htmlFor="feedback" className="text-sm font-semibold">
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
                      rows={6}
                      className="font-mono text-xs"
                      disabled={test.status === "REVIEWED"}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
                      Cerrar
                    </Button>
                    {test.status !== "REVIEWED" && (
                      <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="min-w-[140px]"
                        size="sm"
                      >
                        <FiCheckCircle className="mr-2 h-4 w-4" />
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
            <div className="mt-6 p-6 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Evaluación Completada</h3>
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg">
                  <div className="text-4xl font-bold">{test.score}</div>
                  <div className="text-sm opacity-90">/100</div>
                </div>
              </div>
              {test.feedback && (
                <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                  <p className="text-sm font-bold mb-3 text-slate-900 dark:text-slate-100">💬 Retroalimentación:</p>
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{test.feedback}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
