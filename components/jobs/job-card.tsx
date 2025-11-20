"use client"

import type React from "react"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { JobModal } from "./job-modal"
import { EditJobModal } from "@/components/jobs/edit-job-modal"
import { useAuthStore } from "@/store/auth-store"
import { useJobStore } from "@/store/job-store"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import type { Job } from "@/lib/types"
import { FiMapPin, FiClock, FiDollarSign, FiBriefcase, FiUsers, FiEdit2, FiTrash2 } from "react-icons/fi"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuthStore()
  const { applyToJob, hasAppliedToJob, getApplicationForJob, loadMyJobs } = useJobStore()
  const { toast } = useToast()

  const hasApplied = hasAppliedToJob(job.id)
  const application = getApplicationForJob(job.id)

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Double check if already applied
    if (hasApplied) {
      toast({ 
        title: "Ya aplicaste", 
        description: "Ya has aplicado a este empleo anteriormente.", 
        variant: "default" 
      })
      return
    }
    
    setIsApplying(true)
    try {
      const application = await applyToJob(job.id)
      toast({ title: "Aplicación enviada", description: "Tu aplicación ha sido enviada correctamente." })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error al aplicar al trabajo"
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsApplying(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "FULL_TIME":
        return "bg-success/10 text-success"
      case "PART_TIME":
        return "bg-warning/10 text-warning"
      case "CONTRACT":
        return "bg-secondary/10 text-secondary"
      case "INTERNSHIP":
        return "bg-primary/10 text-primary"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "FULL_TIME":
        return "Tiempo completo"
      case "PART_TIME":
        return "Medio tiempo"
      case "CONTRACT":
        return "Contrato"
      case "INTERNSHIP":
        return "Prácticas"
      default:
        return type
    }
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `Desde $${min.toLocaleString()}`
    if (max) return `Hasta $${max.toLocaleString()}`
    return null
  }

  const isCompany = user?.role === "COMPANY"
  const isOwnJob = job.company?.userId === user?.id

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/jobs/${job.id}`)
      toast({
        title: "✅ Empleo eliminado",
        description: "El empleo ha sido eliminado correctamente"
      })
      loadMyJobs() // Recargar la lista de empleos
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el empleo",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card
        className="group hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-visible"
        onClick={() => setShowModal(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage src={job.company?.logo || "/placeholder.svg"} alt={job.company?.name} />
                <AvatarFallback>
                  <FiBriefcase className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{job.company?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(job.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${getTypeColor(job.type)}`}>{getTypeText(job.type)}</Badge>
              {isCompany && isOwnJob && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-blue-500/10 hover:text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowEditModal(true)
                    }}
                    title="Editar empleo"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteDialog(true)
                    }}
                    title="Eliminar empleo"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Job Title */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">{job.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
          </div>

          {/* Job Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FiMapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            {formatSalary(job.salaryMin, job.salaryMax) && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FiDollarSign className="h-4 w-4" />
                <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{job.skills.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            {isCompany && isOwnJob ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <FiUsers className="h-4 w-4" />
                  <span>Ver candidatos</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = `/jobs/${job.id}/applicants`
                  }}
                >
                  Gestionar
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <FiClock className="h-4 w-4" />
                  <span>Ver detalles</span>
                </div>
                {!isCompany && (
                  <>
                    {hasApplied && application ? (
                      <Badge 
                        variant={
                          application.status === "ACCEPTED" ? "default" :
                          application.status === "REJECTED" ? "destructive" :
                          "secondary"
                        }
                        className="text-xs"
                      >
                        {application.status === "ACCEPTED" ? "✓ Aceptado" :
                         application.status === "REJECTED" ? "✗ Rechazado" :
                         "⏳ Pendiente"}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleApply}
                        disabled={isApplying}
                      >
                        {isApplying ? "Aplicando..." : "Aplicar"}
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Modal */}
      <JobModal job={job} open={showModal} onOpenChange={setShowModal} />

      {/* Edit Job Modal */}
      {isCompany && isOwnJob && (
        <EditJobModal 
          job={job} 
          open={showEditModal} 
          onOpenChange={setShowEditModal}
          onJobUpdated={() => {
            loadMyJobs()
            setShowEditModal(false)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el empleo "{job.title}" y todas sus aplicaciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
