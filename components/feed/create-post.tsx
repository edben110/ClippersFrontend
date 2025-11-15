"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { RemoteAvatar } from "@/components/ui/remote-avatar"
import { useAuthStore } from "@/store/auth-store"
import { useFeedStore } from "@/store/feed-store"
import { apiClient } from "@/lib/api"
import { ImageIcon, VideoIcon, Send, X } from "lucide-react"

export function CreatePost() {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()
  const { createPost } = useFeedStore()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await apiClient.upload<{ imageUrl: string }>("/posts/upload/image", formData)
    return response.imageUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !selectedImage) return

    setIsSubmitting(true)
    try {
      let imageUrl: string | undefined

      if (selectedImage) {
        setIsUploadingImage(true)
        imageUrl = await uploadImage(selectedImage)
        setIsUploadingImage(false)
      }

      const postType = selectedImage ? "IMAGE" : "TEXT"
      await createPost(content.trim(), postType, imageUrl)
      setContent("")
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error creating post:", error)
      setIsUploadingImage(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="glass-card rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-3 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <RemoteAvatar
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
              src={user?.profileImage}
              alt={`${user?.firstName} ${user?.lastName}`}
              fallback={`${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`}
            />
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              <Textarea
                placeholder="¿Qué está pasando en tu carrera profesional?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] sm:min-h-[100px] resize-none border border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary hover:bg-accent/50 transition-all text-sm sm:text-base"
                maxLength={500}
              />

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all h-8 px-2 sm:px-3 text-xs sm:text-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{isUploadingImage ? "Subiendo..." : "Imagen"}</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all opacity-50 cursor-not-allowed h-8 px-2 sm:px-3 text-xs sm:text-sm hidden sm:flex" 
                    disabled
                  >
                    <VideoIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Video</span>
                  </Button>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:inline">{content.length}/500</span>
                  <Button
                    type="submit"
                    disabled={(!content.trim() && !selectedImage) || isSubmitting || isUploadingImage}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg transition-all duration-200 h-8 px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden xs:inline">{isSubmitting ? "Publicando..." : "Publicar"}</span>
                    <span className="xs:hidden">→</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
