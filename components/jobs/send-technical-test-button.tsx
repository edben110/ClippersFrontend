"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { FiFileText, FiLoader, FiCheckCircle } from "react-icons/fi"

interface SendTechnicalTestButtonProps {
  jobId: string
  candidateId: string
  candidateName: string
  onTestSent?: () => void
}

export function SendTechnicalTestButton({ 
  jobId, 
  candidateId, 
  candidateName,
  onTestSent 
}: SendTechnicalTestButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const { toast } = useToast()

  const handleSendTest = async () => {
    try {
      setIsLoading(true)
      
      await apiClient.post(`/jobs/${jobId}/technical-test/send`, {
        candidateId
      })

      setIsSent(true)
      toast({
        title: "✅ Prueba técnica enviada",
        description: `La prueba técnica ha sido generada y enviada a ${candidateName}`
      })

      onTestSent?.()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message
      
      // If already sent, mark as sent
      if (errorMessage.includes("already sent")) {
        setIsSent(true)
      }
      
      toast({
        title: errorMessage.includes("already sent") ? "Información" : "Error",
        description: errorMessage.includes("already sent") 
          ? "Ya se envió una prueba técnica a este candidato"
          : "No se pudo enviar la prueba técnica",
        variant: errorMessage.includes("already sent") ? "default" : "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <Button
        disabled
        size="sm"
        variant="outline"
        className="gap-2 opacity-70"
      >
        <FiCheckCircle className="h-4 w-4 text-green-500" />
        Prueba Enviada
      </Button>
    )
  }

  return (
    <Button
      onClick={handleSendTest}
      disabled={isLoading}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <FiLoader className="h-4 w-4 animate-spin" />
      ) : (
        <FiFileText className="h-4 w-4" />
      )}
      {isLoading ? "Generando prueba..." : "Enviar Prueba Técnica"}
    </Button>
  )
}
