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
      setError(error.response?.data?.message || "Error al actualizar el empleo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const jobTypes = [
    { value: "FULL_TIME", label: "Tiempo completo" },
    { value: "PART_TIME", label: "Medio tiempo" },
    { value: "CONTRACT", label: "Contrato" },
    { value: "INTERNSHIP", label: "Prácticas" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar empleo</DialogTitle>
          <DialogDescription>
            Actualiza la información del empleo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Título del puesto *</Label>
              <Input
                id="title"
                placeholder="Ej: Desarrollador Frontend Senior"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación *</Label>
              <Input
                id="location"
                placeholder="Ciudad, País"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de empleo *</Label>
              <Select value={formData.type} onValueChange={(value: any) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMin">Salario mínimo</Label>
              <Input
                id="salaryMin"
                type="number"
                placeholder="50000"
                value={formData.salaryMin}
                onChange={(e) => handleInputChange("salaryMin", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMax">Salario máximo</Label>
              <Input
                id="salaryMax"
                type="number"
                placeholder="80000"
                value={formData.salaryMax}
                onChange={(e) => handleInputChange("salaryMax", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción del puesto *</Label>
            <Textarea
              id="description"
              placeholder="Describe las responsabilidades, el ambiente de trabajo y lo que buscas en un candidato..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Requisitos</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Agregar requisito..."
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
              />
              <Button type="button" onClick={addRequirement} size="sm">
                <FiPlus className="h-4 w-4" />
              </Button>
            </div>
            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-1 bg-muted px-3 py-1 rounded-full text-sm">
                    <span>{req}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRequirement(index)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <FiX className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Habilidades requeridas</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Agregar habilidad..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} size="sm">
                <FiPlus className="h-4 w-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-1 bg-primary/10 px-3 py-1 rounded-full text-sm">
                    <span>{skill}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(index)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <FiX className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Actualizando..." : "Actualizar empleo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
