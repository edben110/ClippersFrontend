"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Job } from "@/lib/types"
import { FiPlus, FiX } from "react-icons/fi"

interface EditJobModalProps {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobUpdated?: () => void
}

export function EditJobModal({ job, open, onOpenChange, onJobUpdated }: EditJobModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    type: "FULL_TIME" as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP",
    salaryMin: "",
    salaryMax: "",
  })
  const [requirements, setRequirements] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [newRequirement, setNewRequirement] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  // Cargar datos del empleo cuando se abre el modal
  useEffect(() => {
    if (open && job) {
      setFormData({
        title: job.title,
        description: job.description,
        location: job.location,
        type: job.type,
        salaryMin: job.salaryMin?.toString() || "",
        salaryMax: job.salaryMax?.toString() || "",
      })
      setRequirements(job.requirements || [])
      setSkills(job.skills || [])
      setError("")
    }
  }, [open, job])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addRequirement = () => {
    const trimmed = newRequirement.trim()
    const validPattern = /^[a-zA-Z0-9\s.,\-áéíóúÁÉÍÓÚñÑüÜ]+$/
    
    if (trimmed && !requirements.includes(trimmed)) {
      if (!validPattern.test(trimmed)) {
        setError("Los requisitos solo pueden contener letras, números, espacios y puntuación básica (.,-)") 
        return
      }
      setRequirements([...requirements, trimmed])
      setNewRequirement("")
      setError("")
    }
  }

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index))
  }

  const addSkill = () => {
    const trimmed = newSkill.trim()
    const validPattern = /^[a-zA-Z0-9\s.,\-áéíóúÁÉÍÓÚñÑüÜ]+$/
    
    if (trimmed && !skills.includes(trimmed)) {
      if (!validPattern.test(trimmed)) {
        setError("Las habilidades solo pueden contener letras, números, espacios y puntuación básica (.,-)") 
        return
      }
      setSkills([...skills, trimmed])
      setNewSkill("")
      setError("")
    }
  }

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      setError("Por favor completa todos los campos requeridos")
      return
    }

    setIsSubmitting(true)

    try {
      await apiClient.put(`/jobs/${job.id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        type: formData.type,
        requirements,
        skills,
        salaryMin: formData.salaryMin ? Number.parseInt(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? Number.parseInt(formData.salaryMax) : null,
      })

      toast({
        title: "✅ Empleo actualizado",
        description: "El empleo ha sido actualizado correctamente"
      })

      onJobUpdated?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating job:", error)
      setError(error.response?.data?.message || "Error al actualizar el empleo")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empleo</DialogTitle>
          <DialogDescription>Actualiza la información del empleo</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título del empleo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Ej: Desarrollador Full Stack Senior"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe el puesto, responsabilidades y lo que ofreces..."
              rows={5}
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Ej: Ciudad de México, Remoto, Híbrido"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de empleo *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Tiempo completo</SelectItem>
                <SelectItem value="PART_TIME">Medio tiempo</SelectItem>
                <SelectItem value="CONTRACT">Contrato</SelectItem>
                <SelectItem value="INTERNSHIP">Prácticas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin">Salario mínimo</Label>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={(e) => handleInputChange("salaryMin", e.target.value)}
                placeholder="Ej: 30000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMax">Salario máximo</Label>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={(e) => handleInputChange("salaryMax", e.target.value)}
                placeholder="Ej: 50000"
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label>Requisitos</Label>
            <div className="flex gap-2">
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                placeholder="Agrega un requisito"
              />
              <Button type="button" onClick={addRequirement} size="icon">
                <FiPlus className="h-4 w-4" />
              </Button>
            </div>
            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {requirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    <span>{req}</span>
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="hover:text-destructive"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Habilidades requeridas</Label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Agrega una habilidad"
              />
              <Button type="button" onClick={addSkill} size="icon">
                <FiPlus className="h-4 w-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="hover:text-destructive"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Actualizando..." : "Actualizar empleo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
