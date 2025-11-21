"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RemoteAvatar } from "@/components/ui/remote-avatar"
import { useProfileStore } from "@/store/profile-store"
import { useAuthStore } from "@/store/auth-store"
import { useToast } from "@/hooks/use-toast"
import type { User, Company } from "@/lib/types"

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { profile, updateProfile, uploadUserAvatar, deleteUserAvatar, loadProfile } = useProfileStore()
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isCompany = user?.role === "COMPANY"
  
  // Inicializar formData con los valores del perfil
  const getInitialFormData = () => {
    if (!profile) {
      return {
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        name: "",
        description: "",
        industry: "",
        size: "",
        website: "",
        location: "",
      }
    }
    
    if (isCompany) {
      const company = profile as Company
      return {
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        name: company.name || "",
        description: company.description || "",
        industry: company.industry || "",
        size: company.size || "",
        website: company.website || "",
        location: company.location || "",
      }
    } else {
      const userProfile = profile as User
      return {
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        name: "",
        description: "",
        industry: "",
        size: "",
        website: "",
        location: "",
      }
    }
  }
  
  const [formData, setFormData] = useState(getInitialFormData())

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setAvatarFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
    } else {
      setAvatarPreview(null)
    }
  }

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleDeleteAvatar = async () => {
    setIsLoading(true)
    try {
      await deleteUserAvatar()
      setAvatarFile(null)
      setAvatarPreview(null)
      toast({
        title: "Foto eliminada",
        description: "Se eliminó tu foto de perfil.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar formData cuando el modal se abre o el perfil cambia
  useEffect(() => {
    if (open && profile) {
      setFormData(getInitialFormData())
    }
  }, [open, profile, isCompany])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isCompany) {
        await updateProfile({
          name: formData.name,
          description: formData.description,
          industry: formData.industry,
          size: formData.size,
          website: formData.website,
          location: formData.location,
        })
      } else {
        // Subir imagen primero si hay una seleccionada
        if (avatarFile) {
          await uploadUserAvatar(avatarFile)
        }

        // Then update other profile data
        await updateProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
        })

        // Reload profile to ensure data is updated
        await loadProfile()
        
        // Actualizar el auth store para que se reflejen los cambios en toda la app
        const updatedProfile = profile as User
        updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          profileImage: updatedProfile?.profileImage,
        })
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado exitosamente.",
      })

      // Limpiar estado
      setAvatarFile(null)
      setAvatarPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Editar perfil</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Actualiza tu información personal y profesional
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {isCompany ? (
            <>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-sm">Nombre de la empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej. Tech Company S.A."
                  className="h-9 sm:h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="description" className="text-sm">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe tu empresa..."
                  rows={3}
                  className="text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="industry" className="text-sm">Industria *</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="ej. Tecnología"
                    className="h-9 sm:h-10 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="size" className="text-sm">Tamaño *</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="ej. 50-100 empleados"
                    className="h-9 sm:h-10 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="location" className="text-sm">Ubicación *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="ej. Ciudad de México, México"
                  className="h-9 sm:h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="website" className="text-sm">Sitio web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.empresa.com"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm">Foto de perfil</Label>
                <div className="flex items-center gap-3 sm:gap-4">
                  {avatarPreview ? (
                    <div className="h-16 w-16 rounded-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <RemoteAvatar
                      className="h-16 w-16"
                      src={(profile as User)?.profileImage}
                      alt="Avatar"
                      fallback="U"
                    />
                  )}

                  {/* Input de archivo oculto */}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    aria-label="Seleccionar foto de perfil"
                  />

                  {/* Botón claro para cambiar foto */}
                  <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="text-xs sm:text-sm">
                    Cambiar foto
                  </Button>

                  {(profile as User)?.profileImage && (
                    <Button type="button" variant="destructive" size="sm" onClick={handleDeleteAvatar} disabled={isLoading} className="text-xs sm:text-sm">
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="firstName" className="text-sm">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Tu nombre"
                    className="h-9 sm:h-10 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="lastName" className="text-sm">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Tu apellido"
                    className="h-9 sm:h-10 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="phone" className="text-sm">Número de celular</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="ej. +57 300 123 4567"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="address" className="text-sm">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="ej. Calle 123 #45-67, Bogotá"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading} className="w-full sm:w-auto text-xs sm:text-sm">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isLoading} className="w-full sm:w-auto text-xs sm:text-sm">
              {isLoading ? "Guardando..." : "Actualizar perfil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
