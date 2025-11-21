"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RemoteAvatar } from "@/components/ui/remote-avatar"
import { Input } from "@/components/ui/input"
import { useCliperStore } from "@/store/cliper-store"
import { useAuthStore } from "@/store/auth-store"
import type { Cliper } from "@/lib/types"
import { FiPlay, FiClock, FiTag, FiHeart, FiMessageCircle, FiSend, FiTrash2 } from "react-icons/fi"

interface CliperModalProps {
  cliper: Cliper
  open: boolean
  onOpenChange: (open: boolean) => void
  showActions?: boolean // Show likes and comments
}

export function CliperModal({ cliper, open, onOpenChange, showActions = true }: CliperModalProps) {
  const [currentCliper, setCurrentCliper] = useState(cliper)
  const [commentText, setCommentText] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [userCache, setUserCache] = useState<Record<string, any>>({})
  const { getCliperStatus, toggleLike, addComment, deleteComment } = useCliperStore()
  const { user } = useAuthStore()

  useEffect(() => {
    setCurrentCliper(cliper)
    setLikesCount(cliper.likesCount || 0)
  }, [cliper])

  useEffect(() => {
    if (open && cliper.status === "PROCESSING") {
      const interval = setInterval(async () => {
        try {
          const updatedCliper = await getCliperStatus(cliper.id)
          setCurrentCliper(updatedCliper)
          if (updatedCliper.status !== "PROCESSING") {
            clearInterval(interval)
          }
        } catch (error) {
          console.error("Error checking cliper status:", error)
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [open, cliper.id, cliper.status, getCliperStatus])

  // Load user information from comments
  useEffect(() => {
    const loadCommentUsers = async () => {
      const userIds = new Set<string>()
      
      currentCliper.comments?.forEach(comment => {
        if (comment.userId) {
          userIds.add(comment.userId)
        }
      })

      const usersToLoad = Array.from(userIds).filter(id => !userCache[id])
      
      if (usersToLoad.length === 0) return

      const newUsers: Record<string, any> = {}
      
      await Promise.all(
        usersToLoad.map(async (userId) => {
          try {
            const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              }
            })
            if (response.ok) {
              const userData = await response.json()
              newUsers[userId] = userData
            }
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error)
          }
        })
      )

      if (Object.keys(newUsers).length > 0) {
        setUserCache(prev => ({ ...prev, ...newUsers }))
      }
    }

    if (open && currentCliper.comments && currentCliper.comments.length > 0) {
      loadCommentUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentCliper.comments])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-success/10 text-success"
      case "PROCESSING":
        return "bg-warning/10 text-warning"
      case "FAILED":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "DONE":
        return "Procesado"
      case "PROCESSING":
        return "Procesando"
      case "FAILED":
        return "Error en procesamiento"
      case "UPLOADED":
        return "Subido"
      default:
        return status
    }
  }

  const handleToggleLike = async () => {
    if (!user) return
    try {
      const result = await toggleLike(currentCliper.id)
      setIsLiked(result.liked)
      setLikesCount(result.likesCount)
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return
    try {
      const updatedCliper = await addComment(currentCliper.id, commentText.trim())
      setCurrentCliper(updatedCliper)
      setCommentText("")
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return
    try {
      const updatedCliper = await deleteComment(currentCliper.id, commentId)
      setCurrentCliper(updatedCliper)
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Cliper: {currentCliper.title}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Video Player - Facebook/TikTok Style */}
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              {currentCliper.status === "DONE" && currentCliper.videoUrl ? (
                <video controls className="w-full h-full">
                  <source src={currentCliper.videoUrl} type="video/mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  {currentCliper.status === "PROCESSING" ? (
                    <div className="text-center space-y-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Procesando video...</p>
                    </div>
                  ) : currentCliper.status === "FAILED" ? (
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                        <FiPlay className="h-6 w-6 text-destructive" />
                      </div>
                      <p className="text-sm text-destructive">Error al procesar el video</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <FiPlay className="h-12 w-12 text-primary/60" />
                      <p className="text-sm text-muted-foreground">Video no disponible</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Video Actions */}
            <div className="flex items-center justify-between">
              <Badge className={`${getStatusColor(currentCliper.status)}`}>{getStatusText(currentCliper.status)}</Badge>
            </div>
          </div>

          {/* Cliper Details - Facebook Style */}
          <div className="space-y-6">
            {/* Header - Creator Info */}
            <div className="flex items-center space-x-3">
              <RemoteAvatar
                src={currentCliper.user?.profileImage}
                alt={currentCliper.user ? `${currentCliper.user.firstName} ${currentCliper.user.lastName}` : "Usuario"}
                fallback={currentCliper.user ? `${currentCliper.user.firstName?.[0] || ""}${currentCliper.user.lastName?.[0] || ""}` : "U"}
                className="h-12 w-12"
              />
              <div className="flex-1">
                <p className="font-semibold">
                  {currentCliper.user ? `${currentCliper.user.firstName} ${currentCliper.user.lastName}` : "Usuario"}
                </p>
                <p className="text-sm text-muted-foreground">Candidato • {formatDistanceToNow(new Date(currentCliper.createdAt), { addSuffix: true, locale: es })}</p>
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-balance">{currentCliper.title}</h2>
              <p className="text-muted-foreground text-pretty">{currentCliper.description}</p>
            </div>

            {/* Social Actions - Moved to top */}
            {showActions && (
              <div className="space-y-4 pt-4 border-t border-b pb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleLike}
                    className="flex-1"
                  >
                    <FiHeart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                    {likesCount} Me gusta
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <FiMessageCircle className="h-4 w-4 mr-2" />
                    {currentCliper.commentsCount || 0} Comentarios
                  </Button>
                </div>

                {/* Add Comment */}
                {user && (
                  <div className="flex gap-2">
                    <RemoteAvatar
                      src={user.profileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      fallback={`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}
                      className="h-8 w-8"
                    />
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Comentar..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                        <FiSend className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Skills */}
            {currentCliper.skills.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold">Habilidades destacadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentCliper.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Video Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Información del video</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FiClock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {currentCliper.duration > 0
                      ? `${Math.floor(currentCliper.duration / 60)}:${(currentCliper.duration % 60)
                          .toString()
                          .padStart(2, "0")}`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiTag className="h-4 w-4 text-muted-foreground" />
                  <span>{currentCliper.skills.length} habilidades identificadas</span>
                </div>
              </div>
            </div>

            {/* Transcription */}
            {currentCliper.transcription && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold">Transcripción</h3>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <p className="text-sm leading-relaxed">{currentCliper.transcription}</p>
                  </div>
                </div>
              </>
            )}

            {/* Comments List */}
            {showActions && (
              <div className="space-y-3">
                <h3 className="font-semibold">Comentarios</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {currentCliper.comments && currentCliper.comments.length > 0 ? (
                    currentCliper.comments.map((comment: any) => {
                      // Get user info from cache or use userName
                      const commentUser = userCache[comment.userId]
                      const commentUserName = commentUser 
                        ? `${commentUser.firstName} ${commentUser.lastName}`
                        : comment.userName || "Usuario"
                      
                      // Generar iniciales
                      const initials = commentUser
                        ? `${commentUser.firstName?.[0] || ""}${commentUser.lastName?.[0] || ""}`
                        : commentUserName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      
                      return (
                        <div key={comment.id} className="flex gap-2">
                          <RemoteAvatar
                            src={commentUser?.profileImage}
                            alt={commentUserName}
                            fallback={initials}
                            className="h-8 w-8"
                          />
                          <div className="flex-1 bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm">{commentUserName}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                                </p>
                                {user && user.id === comment.userId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <FiTrash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sé el primero en comentar.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
