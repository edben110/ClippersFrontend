"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import type { TechnicalTest } from "@/lib/types"
import { FiSend, FiClock, FiCheckCircle } from "react-icons/fi"

// Tipos para las respuestas estructuradas
interface Answer {
  questionId: string
  type: 'multiple_choice' | 'short_answer' | 'long_answer'
  answer: string
}

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
  const [answers, setAnswers] = useState<Record<string, string>>({}) // questionId -> answer
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  if (!test) return null

  // Función para manejar selección de opción múltiple
  const handleMultipleChoiceSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }))
  }

  // Función para manejar respuestas de texto
  const handleTextAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async () => {
    // Verificar que haya al menos una respuesta
    const hasAnswers = Object.keys(answers).length > 0
    
    if (!hasAnswers && !response.trim()) {
      toast({
        title: "Error",
        description: "Por favor responde al menos una pregunta",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Construir respuesta combinada
      let finalResponse = "=== RESPUESTAS ===\n\n"
      
      // Si hay respuestas estructuradas, formatearlas
      if (Object.keys(answers).length > 0) {
        Object.entries(answers).forEach(([questionId, answer]) => {
          finalResponse += `Pregunta ${questionId}:\n${answer}\n\n`
        })
      }
      
      // Agregar respuesta de texto libre si existe
      if (response.trim()) {
        finalResponse += "=== RESPUESTA ADICIONAL ===\n\n" + response.trim()
      }
      
      await apiClient.post(`/jobs/technical-tests/${test.id}/submit`, {
        response: finalResponse
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
  const isSubmitted = test.status === "SUBMITTED" || test.status === "REVIEWED"
  
  // Parsear respuestas si ya fueron enviadas
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
  
  const submittedAnswers = isSubmitted ? parseSubmittedAnswers() : {}

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let globalQuestionNumber = 0 // Contador global único
    let displayQuestionNumber = 0 // Número que se muestra al usuario
    let currentQuestionId = ''
    let currentQuestionText = ''
    let pendingOptions: Array<{letter: string, text: string}> = []
    let needsTextInput = false
    
    const flushQuestion = (index: number) => {
      if (!currentQuestionId) return
      
      const qId = currentQuestionId
      const qText = currentQuestionText
      const opts = [...pendingOptions]
      const needsInput = needsTextInput
      
      // Renderizar opciones múltiples si existen (tanto para candidato como para empresa)
      if (opts.length > 0) {
        opts.forEach((opt, optIdx) => {
          const optionValue = `${opt.letter}) ${opt.text}`
          const isSelected = canSubmit ? answers[qId] === optionValue : submittedAnswers[qId]?.includes(opt.letter)
          const isDisabled = !canSubmit
          
          const optionStyles: Record<string, {bg: string, border: string, hover: string, gradient: string}> = {
            'A': {
              bg: isSelected ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30' : 'bg-white dark:bg-slate-900',
              border: isSelected ? 'border-blue-500 dark:border-blue-400' : 'border-slate-200 dark:border-slate-700',
              hover: 'hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20',
              gradient: 'from-blue-500 to-indigo-600'
            },
            'B': {
              bg: isSelected ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30' : 'bg-white dark:bg-slate-900',
              border: isSelected ? 'border-emerald-500 dark:border-emerald-400' : 'border-slate-200 dark:border-slate-700',
              hover: 'hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20',
              gradient: 'from-emerald-500 to-green-600'
            },
            'C': {
              bg: isSelected ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30' : 'bg-white dark:bg-slate-900',
              border: isSelected ? 'border-orange-500 dark:border-orange-400' : 'border-slate-200 dark:border-slate-700',
              hover: 'hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20',
              gradient: 'from-orange-500 to-amber-600'
            },
            'D': {
              bg: isSelected ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30' : 'bg-white dark:bg-slate-900',
              border: isSelected ? 'border-purple-500 dark:border-purple-400' : 'border-slate-200 dark:border-slate-700',
              hover: 'hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20',
              gradient: 'from-purple-500 to-pink-600'
            }
          }
          
          const style = optionStyles[opt.letter]
          
          elements.push(
            <div 
              key={`${qId}-opt-${optIdx}`}
              onClick={() => canSubmit && handleMultipleChoiceSelect(qId, optionValue)}
              className={`mb-3 p-4 rounded-xl transition-all duration-300 border-2 ${isDisabled ? 'cursor-default' : 'cursor-pointer group'} ${style.bg} ${style.border} ${!isDisabled && !isSelected ? style.hover : ''} ${isSelected ? 'shadow-xl' : 'shadow-sm'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl w-10 h-10 flex items-center justify-center font-bold text-lg flex-shrink-0 transition-all duration-300 shadow-md ${
                  isSelected 
                    ? `bg-gradient-to-br ${style.gradient} text-white shadow-lg` 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}>
                  {isSelected ? '✓' : opt.letter}
                </div>
                <span className={`text-base leading-relaxed flex-1 transition-all ${isSelected ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100'}`}>
                  {opt.text}
                </span>
              </div>
            </div>
          )
        })
      }
      // Renderizar campo de texto si no hay opciones Y es una pregunta
      else if (needsInput) {
        // Determinar si es respuesta larga basado en palabras clave
        const isLongAnswer = qText.toLowerCase().includes('explica') || 
                            qText.toLowerCase().includes('describe') || 
                            qText.toLowerCase().includes('desarrolla') ||
                            qText.toLowerCase().includes('desarrolle') ||
                            qText.toLowerCase().includes('detalla') ||
                            qText.toLowerCase().includes('diseñe') ||
                            qText.toLowerCase().includes('diseña') ||
                            qText.toLowerCase().includes('implemente') ||
                            qText.toLowerCase().includes('implementa') ||
                            qText.toLowerCase().includes('ejercicio') ||
                            qText.toLowerCase().includes('caso') ||
                            qText.toLowerCase().includes('problema') ||
                            qText.toLowerCase().includes('solución') ||
                            qText.toLowerCase().includes('código') ||
                            qText.toLowerCase().includes('algoritmo')
        
        const answerValue = canSubmit ? (answers[qId] || '') : (submittedAnswers[qId] || '')
        
        elements.push(
          <div key={`${qId}-input`} className="mb-4 ml-0">
            <div className={`p-3 rounded-lg border-2 ${isSubmitted ? 'bg-green-500/5 border-green-500/30' : 'bg-muted/30 border-primary/20'}`}>
              <label className="text-xs font-medium mb-2 block flex items-center gap-2">
                {isSubmitted ? (
                  <>
                    <span className="text-green-600">✓</span>
                    <span className="text-green-600 dark:text-green-400">Respuesta del candidato:</span>
                  </>
                ) : (
                  <>
                    <span>💭</span>
                    <span className="text-muted-foreground">Tu respuesta:</span>
                  </>
                )}
              </label>
              {isLongAnswer ? (
                <Textarea
                  placeholder={canSubmit ? "Escribe tu respuesta aquí... Puedes incluir código, explicaciones, diagramas en texto, etc." : ""}
                  value={answerValue}
                  onChange={(e) => canSubmit && handleTextAnswer(qId, e.target.value)}
                  rows={10}
                  disabled={!canSubmit}
                  className={`w-full border-2 font-mono text-sm ${isSubmitted ? 'bg-card' : 'focus:border-primary'}`}
                />
              ) : (
                <Input
                  placeholder={canSubmit ? "Tu respuesta..." : ""}
                  value={answerValue}
                  onChange={(e) => canSubmit && handleTextAnswer(qId, e.target.value)}
                  disabled={!canSubmit}
                  className={`w-full border-2 ${isSubmitted ? 'bg-card' : 'focus:border-primary'}`}
                />
              )}
            </div>
          </div>
        )
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
                {test.companyName && (
                  <p className="text-base text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="text-lg">�</span>
                    <span className="font-semibold">{test.companyName}</span>
                  </p>
                )}
                {test.jobTitle && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>💼</span>
                    <span>{test.jobTitle}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      }
      // Section headers
      else if (line.startsWith('## ')) {
        flushQuestion(i)
        
        const sectionTitle = line.substring(3)
        
        // Resetear contador VISUAL si es una nueva parte (pero no el global)
        if (sectionTitle.includes('Parte')) {
          displayQuestionNumber = 0
        }
        
        const emoji = sectionTitle.includes('Empresa') ? '🏢' : 
                     sectionTitle.includes('Información') ? 'ℹ️' :
                     sectionTitle.includes('Habilidades') ? '🎯' :
                     sectionTitle.includes('Requisitos') ? '📋' :
                     sectionTitle.includes('Instrucciones') ? '📝' :
                     sectionTitle.includes('Parte') || sectionTitle.includes('Pregunta') ? '❓' :
                     sectionTitle.includes('Ejercicio') ? '💻' :
                     sectionTitle.includes('Caso') ? '📊' :
                     sectionTitle.includes('Criterios') ? '✅' :
                     sectionTitle.includes('Entrega') ? '📤' : '📌'
        
        elements.push(
          <div key={i} className="mt-10 mb-6 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 rounded-2xl border-l-4 border-gradient-to-b from-indigo-500 to-purple-600 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <span className="text-3xl">{emoji}</span>
              {sectionTitle}
            </h2>
          </div>
        )
      }
      // Subsection headers (Ejercicios, preguntas específicas, casos de estudio)
      else if (line.startsWith('### ')) {
        flushQuestion(i)
        
        const subsectionTitle = line.substring(4)
        
        // Si es un ejercicio, pregunta o caso de estudio, tratarlo como pregunta
        const isExercise = subsectionTitle.toLowerCase().includes('ejercicio') ||
                          subsectionTitle.toLowerCase().includes('pregunta') ||
                          subsectionTitle.toLowerCase().includes('problema') ||
                          subsectionTitle.toLowerCase().includes('tarea') ||
                          subsectionTitle.toLowerCase().includes('actividad') ||
                          subsectionTitle.toLowerCase().includes('caso de estudio') ||
                          subsectionTitle.toLowerCase().includes('caso:')
        
        if (isExercise) {
          globalQuestionNumber++
          displayQuestionNumber++
          currentQuestionId = `q${globalQuestionNumber}` // ID único global
          currentQuestionText = subsectionTitle
          needsTextInput = true // Los ejercicios siempre necesitan respuesta escrita
          
          elements.push(
            <div key={i} className="mb-5 mt-8 p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl border-l-4 border-gradient-to-b from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  {displayQuestionNumber}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex-1 leading-tight">
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
      // Bullet points (not options)
      else if (line.startsWith('- ') && !line.match(/^- [A-D]\)/)) {
        elements.push(
          <li key={i} className="ml-6 mb-2 list-disc text-sm leading-relaxed">
            {line.substring(2)}
          </li>
        )
      }
      // Multiple choice options A), B), C), D) (con o sin guión)
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
          
          // Es una pregunta si tiene ? o tiene opciones (pero no si es solo "Preguntas:")
          const isRealQuestion = (questionText.includes('?') || hasMultipleChoice) && 
                                 questionText.toLowerCase() !== 'preguntas:' &&
                                 questionText.trim().length > 15 // Evitar títulos cortos
          
          if (isRealQuestion) {
            globalQuestionNumber++
            displayQuestionNumber++
            currentQuestionId = `q${globalQuestionNumber}` // ID único global
            currentQuestionText = questionText
            needsTextInput = !hasMultipleChoice
            
            elements.push(
              <div key={i} className="mb-5 mt-8 p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl border-l-4 border-gradient-to-b from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                    {displayQuestionNumber}
                  </div>
                  <div className="text-lg leading-relaxed flex-1 font-semibold text-slate-900 dark:text-slate-100">
                    {questionText}
                  </div>
                </div>
              </div>
            )
          } else {
            // No es pregunta, solo un item de lista o título
            elements.push(
              <div key={i} className="mb-3 text-base leading-relaxed font-medium text-muted-foreground pl-4 border-l-2 border-muted">
                {match[1]}. {questionText}
              </div>
            )
          }
        }
      }
      // Code blocks (```python, ```java, ```sql, etc.)
      else if (line.startsWith('```')) {
        flushQuestion(i)
        
        const language = line.substring(3).trim()
        let codeContent = ''
        let j = i + 1
        
        // Recoger todo el contenido del bloque de código
        while (j < lines.length && !lines[j].startsWith('```')) {
          codeContent += lines[j] + '\n'
          j++
        }
        
        // Mostrar el bloque de código como ejemplo/plantilla
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
        
        // Saltar las líneas del bloque de código
        i = j
      }
      // Bold text **text** (Questions)
      else if (line.includes('**')) {
        flushQuestion(i)
        
        const parts = line.split(/(\*\*.*?\*\*)/)
        const boldText = parts.find(p => p.startsWith('**') && p.endsWith('**'))?.slice(2, -2) || ''
        
        // Solo es pregunta si:
        // 1. Termina con ? O
        // 2. Tiene opciones A), B), C), D) después O
        // 3. Contiene palabras clave de pregunta
        const isQuestion = line.includes('?') || 
                          boldText.toLowerCase().includes('pregunta') ||
                          boldText.toLowerCase().includes('ejercicio') ||
                          boldText.toLowerCase().includes('desarrolle') ||
                          boldText.toLowerCase().includes('diseñe') ||
                          boldText.toLowerCase().includes('implemente') ||
                          boldText.toLowerCase().includes('respuesta breve') ||
                          boldText.toLowerCase().includes('respuesta corta')
        
        // Detectar si tiene opciones en las siguientes líneas
        const nextLines = lines.slice(i + 1, i + 6)
        const hasMultipleChoice = nextLines.some(l => l.match(/^\s*-?\s*[A-D]\)/))
        
        if (isQuestion || hasMultipleChoice) {
          globalQuestionNumber++
          displayQuestionNumber++
          currentQuestionId = `q${globalQuestionNumber}` // ID único global
          currentQuestionText = line
          needsTextInput = !hasMultipleChoice && isQuestion
          
          elements.push(
            <div key={i} className="mb-5 mt-8 p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl border-l-4 border-gradient-to-b from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  {displayQuestionNumber}
                </div>
                <div className="text-lg leading-relaxed flex-1">
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} className="font-bold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>
                    }
                    return <span key={j} className="text-slate-700 dark:text-slate-300">{part}</span>
                  })}
                </div>
              </div>
            </div>
          )
        } else {
          // No es pregunta, renderizar como texto normal con negrita
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
        // Solo flush si realmente hay una pregunta pendiente
        if (currentQuestionId && (pendingOptions.length > 0 || needsTextInput)) {
          flushQuestion(i)
        }
        elements.push(<div key={i} className="h-2" />)
      }
      // Regular paragraphs (instructions, notes)
      else if (line.trim()) {
        // Detectar si es una instrucción que requiere respuesta
        const isInstruction = line.toLowerCase().includes('evalúe') ||
                             line.toLowerCase().includes('analice') ||
                             line.toLowerCase().includes('explique') ||
                             line.toLowerCase().includes('describa') ||
                             line.toLowerCase().includes('proporcione') ||
                             line.toLowerCase().includes('desarrolle') ||
                             line.toLowerCase().includes('responda') ||
                             line.toLowerCase().includes('calcule') ||
                             line.toLowerCase().includes('determine') ||
                             (line.includes('(') && line.toLowerCase().includes('respuesta'))
        
        // Si es una instrucción y hay una pregunta activa, agregar campo de texto
        if (isInstruction && currentQuestionId) {
          elements.push(
            <p key={i} className="mb-4 text-base leading-relaxed text-foreground font-medium pl-4 border-l-2 border-primary">
              {line}
            </p>
          )
          // Marcar que necesita input
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
    
    // Flush any remaining question
    flushQuestion(lines.length)
    
    return elements
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[65vw] w-[65vw] max-h-[90vh] overflow-hidden flex flex-col p-0 sm:!max-w-[65vw] bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <DialogHeader className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 px-8 py-6 bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <span className="text-3xl">📝</span>
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {isSubmitted ? 'Revisar Prueba Técnica' : 'Prueba Técnica'}
                </DialogTitle>
                {isSubmitted && test.candidateName && (
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mt-2 flex items-center gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">👤</span>
                    Candidato: {test.candidateName}
                  </p>
                )}
                {!isSubmitted && test.companyName && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">
                    🏢 {test.companyName} • 💼 {test.jobTitle}
                  </p>
                )}
                {isSubmitted && test.companyName && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    🏢 {test.companyName} • 💼 {test.jobTitle}
                  </p>
                )}
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-950/50">
          {/* Mensaje de prueba enviada */}
          {isSubmitted && (
            <div className="mb-8 p-5 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg">
                  <FiCheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">
                    ✓ Prueba Enviada Exitosamente
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Las respuestas del candidato se muestran integradas en cada pregunta a continuación.
                  </p>
                </div>
                {test.submittedAt && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Enviada el</p>
                    <p className="text-sm font-medium">{new Date(test.submittedAt).toLocaleDateString('es-ES')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Test Content */}
          <div className="w-full space-y-4">
            {renderMarkdown(test.testMarkdown)}
          </div>

          {/* Response Section - Solo para candidatos que pueden enviar */}
          {canSubmit && !isSubmitted && (
            <div className="mt-8 pt-6 border-t-2 border-primary/30">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 rounded-lg border-2 border-primary/20 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <FiSend className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">Resumen de Respuestas</h3>
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(answers).length} pregunta(s) respondida(s)
                    </p>
                  </div>
                  {Object.keys(answers).length > 0 && (
                    <Badge className="bg-green-500">
                      ✓ {Object.keys(answers).length} respuestas
                    </Badge>
                  )}
                </div>
                
                {Object.keys(answers).length > 0 && (
                  <div className="bg-card/50 p-4 rounded-lg mb-4 border border-green-500/20">
                    <p className="text-sm font-medium mb-3 text-green-600 dark:text-green-400">
                      ✓ Has respondido las siguientes preguntas:
                    </p>
                    <div className="space-y-2">
                      {Object.entries(answers).map(([qId, answer]) => (
                        <div key={qId} className="text-xs bg-card p-3 rounded border">
                          <span className="font-semibold text-primary">{qId}:</span>{' '}
                          <span className="text-muted-foreground">
                            {answer.length > 100 ? answer.substring(0, 100) + '...' : answer}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-card/50 p-4 rounded-lg mb-4 border border-primary/10">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">💡 Antes de enviar:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Verifica que hayas respondido todas las preguntas</li>
                    <li>• Revisa tus respuestas de opción múltiple</li>
                    <li>• Asegúrate de que tus respuestas sean claras</li>
                    <li>• Puedes agregar comentarios adicionales abajo</li>
                  </ul>
                </div>
                
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    📝 Comentarios adicionales (opcional)
                  </label>
                  <Textarea
                    placeholder="Agrega cualquier comentario, aclaración o información adicional que consideres relevante..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={6}
                    className="font-mono text-sm resize-y border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                
                <div className="flex justify-between items-center gap-4 pt-6 border-t">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">{Object.keys(answers).length}</span> respuestas
                    </p>
                    {Object.keys(answers).length > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Listo para enviar
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-[120px]">
                      💾 Guardar Borrador
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting || Object.keys(answers).length === 0} 
                      className="min-w-[150px] bg-primary hover:bg-primary/90"
                    >
                      <FiSend className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Enviando..." : "Enviar Respuesta"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Reviewed Response */}
          {test.status === "REVIEWED" && (
            <div className="mt-10 pt-8 border-t-2 border-green-500/30">
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-8 rounded-xl border-2 border-green-500/20 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-3 rounded-lg">
                      <FiCheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl text-green-600 dark:text-green-400">Resultado de la Evaluación</h3>
                      <p className="text-sm text-muted-foreground">Revisado por {test.companyName || 'la empresa'}</p>
                    </div>
                  </div>
                  {test.score !== undefined && (
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white px-8 py-4 rounded-xl shadow-lg">
                      <div className="text-center">
                        <div className="text-4xl font-bold">{test.score}</div>
                        <div className="text-sm opacity-90">/ 100 puntos</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {test.feedback && (
                  <div className="bg-yellow-500/10 border-2 border-yellow-500/20 p-6 rounded-lg mb-6">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <span>💬</span> Retroalimentación de la Empresa
                    </h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{test.feedback}</p>
                  </div>
                )}
                
                {test.candidateResponse && (
                  <div className="bg-card p-6 rounded-lg border-2">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <span>📝</span> Tu Respuesta
                    </h4>
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
