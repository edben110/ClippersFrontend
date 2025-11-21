"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useJobStore } from "@/store/job-store"
import { useAuthStore } from "@/store/auth-store"
import { ApplicantsList } from "@/components/jobs/applicants-list"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FiArrowLeft, FiBriefcase, FiAward } from "react-icons/fi"
import type { Job } from "@/lib/types"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function JobApplicantsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const { user } = useAuthStore()
  const { applicants, getJobApplications, getAIRanking, isLoading } = useJobStore()
  const { toast } = useToast()
  const [job, setJob] = useState<Job | null>(null)
  const [loadingJob, setLoadingJob] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiRankingEnabled, setAiRankingEnabled] = useState(false)
  const [hasSavedResults, setHasSavedResults] = useState(false)

  useEffect(() => {
    const loadJobAndApplicants = async () => {
      try {
        setLoadingJob(true)
        const jobData = await apiClient.get<Job>(`/jobs/${jobId}`)
        setJob(jobData)
        
        if (user?.role === "COMPANY") {
          await getJobApplications(jobId)
          
          // Check if AI ranking was already applied (saved results loaded)
          const hasAIData = applicants.some(app => app.aiMatchData)
          if (hasAIData) {
            setAiRankingEnabled(true)
            setHasSavedResults(true)
          }
        }
      } catch (error) {
        // Error silenciado
      } finally {
        setLoadingJob(false)
      }
    }

    if (jobId && user) {
      loadJobAndApplicants()
    }
  }, [jobId, user, getJobApplications])
  
  // Check for AI data when applicants change
  useEffect(() => {
    const hasAIData = applicants.some(app => app.aiMatchData)
    if (hasAIData && !aiRankingEnabled) {
      setAiRankingEnabled(true)
      setHasSavedResults(true)
    }
  }, [applicants])

  const handleAIRanking = async (forceRefresh: boolean = false) => {
    if (!jobId) return
    
    setLoadingAI(true)
    try {
      await getAIRanking(jobId, forceRefresh)
      setAiRankingEnabled(true)
      setHasSavedResults(false) // New calculation
      toast({
        title: "✅ Ranking IA activado",
        description: forceRefresh 
          ? "Los candidatos han sido re-evaluados y ordenados por compatibilidad"
          : "Los candidatos han sido evaluados y ordenados por compatibilidad",
        variant: "default",
      })
    } catch (error: any) {
      // Error manejado por el toast
      const errorMessage = error?.response?.data?.message || error?.message || "Error al conectar con el servicio de IA"
      toast({
        title: "❌ Error al activar ranking IA",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingAI(false)
    }
  }

  if (user?.role !== "COMPANY") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Acceso denegado</h2>
            <p className="text-muted-foreground">
              Solo las empresas pueden ver los candidatos de sus empleos.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const pendingApplicants = applicants.filter((app) => app.status === "PENDING")
  const acceptedApplicants = applicants.filter((app) => app.status === "ACCEPTED")
  const rejectedApplicants = applicants.filter((app) => app.status === "REJECTED")

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/jobs")}
              className="mb-3 sm:mb-4 text-xs sm:text-sm"
            >
              <FiArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Volver a empleos
            </Button>

            {loadingJob ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 sm:h-8 bg-muted rounded w-3/4 sm:w-1/2"></div>
                <div className="h-3 sm:h-4 bg-muted rounded w-1/2 sm:w-1/3"></div>
              </div>
            ) : job ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground break-words">{job.title}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Gestiona los candidatos que han aplicado a esta oferta
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => handleAIRanking(false)}
                    disabled={loadingAI || applicants.length === 0}
                    variant={aiRankingEnabled ? "default" : "outline"}
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {loadingAI ? (
                      <>
                        <div className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span className="truncate">Analizando con IA...</span>
                      </>
                    ) : aiRankingEnabled ? (
                      <>
                        <FiAward className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{hasSavedResults ? "Ranking IA (Guardado)" : "Ranking IA Activo"}</span>
                      </>
                    ) : (
                      <>
                        <FiBriefcase className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">Activar Ranking IA</span>
                      </>
                    )}
                  </Button>
                  {aiRankingEnabled && (
                    <Button
                      onClick={() => handleAIRanking(true)}
                      disabled={loadingAI}
                      variant="outline"
                      size="sm"
                      title="Recalcular ranking con IA"
                      className="w-full sm:w-auto"
                    >
                      🔄 Recalcular
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Candidatos</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Empleo no encontrado</p>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Card className="border-2">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <p className="text-2xl sm:text-3xl font-bold">{applicants.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Postulaciones</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-warning/20 bg-warning/5">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <p className="text-xs sm:text-sm text-muted-foreground">Pendientes</p>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <p className="text-2xl sm:text-3xl font-bold text-warning">{pendingApplicants.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Por revisar</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-success/20 bg-success/5">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <p className="text-xs sm:text-sm text-muted-foreground">Aceptados</p>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <p className="text-2xl sm:text-3xl font-bold text-success">{acceptedApplicants.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Seleccionados</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <p className="text-xs sm:text-sm text-muted-foreground">Rechazados</p>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <p className="text-2xl sm:text-3xl font-bold text-destructive">{rejectedApplicants.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">No seleccionados</p>
              </CardContent>
            </Card>
          </div>

          {/* Applicants Tabs */}
          <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
              <TabsTrigger value="all" className="text-xs sm:text-sm py-2">
                <span className="hidden sm:inline">Todos</span>
                <span className="sm:hidden">Todo</span> ({applicants.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm py-2">
                <span className="hidden sm:inline">Pendientes</span>
                <span className="sm:hidden">Pend.</span> ({pendingApplicants.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs sm:text-sm py-2">
                <span className="hidden sm:inline">Aceptados</span>
                <span className="sm:hidden">Acep.</span> ({acceptedApplicants.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs sm:text-sm py-2">
                <span className="hidden sm:inline">Rechazados</span>
                <span className="sm:hidden">Rech.</span> ({rejectedApplicants.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="h-6 bg-muted rounded w-1/3"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <ApplicantsList jobId={jobId} applicants={applicants} />
              )}
            </TabsContent>

            <TabsContent value="pending">
              <ApplicantsList jobId={jobId} applicants={pendingApplicants} />
            </TabsContent>

            <TabsContent value="accepted">
              <ApplicantsList jobId={jobId} applicants={acceptedApplicants} />
            </TabsContent>

            <TabsContent value="rejected">
              <ApplicantsList jobId={jobId} applicants={rejectedApplicants} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
