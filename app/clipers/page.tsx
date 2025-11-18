"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { UploadCliperModal } from "@/components/clipers/upload-cliper-modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useCliperStore } from "@/store/cliper-store"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RemoteAvatar } from "@/components/ui/remote-avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Share2, Play, RefreshCw, MoreHorizontal, Trash2 } from "lucide-react"
import type { Cliper } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { CliperPlayer } from "@/components/clipers/cliper-player"

export default function ClipersPage() {
  const { clipers, isLoading, hasMore, loadClipers, deleteCliper, toggleLike, addComment, deleteComment } = useCliperStore()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newCommentByCliper, setNewCommentByCliper] = useState<Record<string, string>>({})
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [cliperToDelete, setCliperToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    loadClipers(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [openMenuId])


  const handleShare = async (cliper: Cliper) => {
    const shareUrl = cliper.videoUrl ?? `${window.location.origin}/clipers?cliper=${cliper.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: cliper.title, text: cliper.description, url: shareUrl })
        toast({ title: "Compartido", description: "Cliper compartido correctamente." })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({ title: "Copiado", description: "Enlace del cliper copiado al portapapeles." })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo compartir el cliper.", variant: "destructive" })
    }
  }

  const handleLoadMore = () => {
    loadClipers()
  }

  const handleDelete = async () => {
    if (!cliperToDelete) return
    
    try {
      await deleteCliper(cliperToDelete)
      toast({ title: "Eliminado", description: "Cliper eliminado correctamente." })
      setCliperToDelete(null)
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el cliper.", variant: "destructive" })
    }
  }

  const handleViewProfile = (cliper: Cliper) => {
    const targetId = cliper.userId || cliper.user?.id
    if (targetId) {
      router.push(`/profile/${targetId}`)
    } else {
      toast({ title: "Perfil no disponible", description: "No se encontró el usuario del reel.", variant: "destructive" })
    }
  }

  const handleLike = async (cliper: Cliper) => {
    try {
      const result = await toggleLike(cliper.id)
      toast({
        title: result.liked ? "❤️ Te gusta" : "Me gusta eliminado",
        description: result.liked ? "Te gusta este cliper" : "Ya no te gusta este cliper"
      })
    } catch {
      toast({ title: "Error", description: "No se pudo dar me gusta al cliper.", variant: "destructive" })
    }
  }

  const submitComment = async (cliperId: string) => {
    const comment = newCommentByCliper[cliperId]
    if (!comment?.trim()) return
    
    try {
      await addComment(cliperId, comment.trim())
      
      // Limpiar el input
      setNewCommentByCliper(prev => ({ ...prev, [cliperId]: "" }))
      
      toast({
        title: "💬 Comentario agregado",
        description: "Tu comentario se ha agregado correctamente."
      })
    } catch {
      toast({ title: "Error", description: "No se pudo enviar el comentario.", variant: "destructive" })
    }
  }

  const handleDeleteComment = async (cliperId: string, commentId: string) => {
    try {
      await deleteComment(cliperId, commentId)
      toast({
        title: "Comentario eliminado",
        description: "El comentario se ha eliminado correctamente."
      })
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el comentario.", variant: "destructive" })
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Clipers</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {user?.role === "COMPANY"
                  ? "Descubre el talento a través de videos profesionales"
                  : "Presenta tu perfil profesional con videos cortos"}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline ml-2">Refrescar</span>
              </Button>
              {user?.role === "CANDIDATE" && (
                <Button onClick={() => setShowUploadModal(true)} size="sm" className="sm:size-default">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Subir Cliper</span>
                  <span className="sm:hidden ml-1">Subir</span>
                </Button>
              )}
            </div>
          </div>

          {/* Feed de Videos - Estilo Facebook/YouTube */}
          {clipers.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    No hay clipers aún
                  </h3>
                  <p className="text-muted-foreground">
                    {user?.role === "COMPANY"
                      ? "Aún no hay clipers disponibles para ver"
                      : "Crea tu primer cliper para mostrar tu perfil profesional"}
                  </p>
                </div>
                {user?.role === "CANDIDATE" && (
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Subir tu primer Cliper
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Feed vertical centrado estilo Facebook */}
              <div className="max-w-2xl mx-auto space-y-4 sm:space-y-8">
                {Array.from(new Map(clipers.map(c => [c.id, c])).values()).map((cliper) => (
                  <div key={cliper.id} className="glass-card rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 card-hover-lift">
                    {/* Header del post */}
                    <div className="p-3 sm:p-5 pb-2 sm:pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <RemoteAvatar
                            src={cliper.user?.profileImage || (cliper.userId === user?.id ? user?.profileImage : undefined)}
                            alt={cliper.user?.firstName || (cliper.userId === user?.id ? user?.firstName : "Usuario") || "Usuario"}
                            fallback={`${cliper.user?.firstName?.[0] || (cliper.userId === user?.id ? user?.firstName?.[0] : "U") || "U"}${cliper.user?.lastName?.[0] || (cliper.userId === user?.id ? user?.lastName?.[0] : "") || ""}`}
                            className="h-9 w-9 sm:h-11 sm:w-11 ring-2 ring-primary/20 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-sm cursor-pointer hover:underline text-foreground truncate" onClick={() => handleViewProfile(cliper)}>
                              {cliper.user 
                                ? `${cliper.user.firstName} ${cliper.user.lastName}` 
                                : cliper.userId === user?.id 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : "Usuario"}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                              {formatDistanceToNow(new Date(cliper.createdAt), { addSuffix: true, locale: es })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] sm:text-xs font-semibold flex-shrink-0 ${cliper.status === "DONE" ? "bg-green-500/20 text-green-400" :
                          cliper.status === "PROCESSING" ? "bg-yellow-500/20 text-yellow-400" :
                            cliper.status === "FAILED" ? "bg-red-500/20 text-red-400" : "bg-muted text-muted-foreground"
                          }`}>
                          {cliper.status === "DONE" ? "✓ Listo" : cliper.status === "PROCESSING" ? "⏳" : cliper.status === "FAILED" ? "✗ Error" : cliper.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Título y descripción */}
                    {(cliper.title || cliper.description) && (
                      <div className="px-3 sm:px-4 pb-2 sm:pb-3">
                        {cliper.title && (
                          <h3 className="font-semibold text-sm sm:text-base mb-1">{cliper.title}</h3>
                        )}
                        {cliper.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{cliper.description}</p>
                        )}
                      </div>
                    )}

                    {/* Video Player */}
                    <div className="relative px-2 sm:px-4 pb-2 sm:pb-4">
                      <div className="aspect-[16/10] bg-black rounded-lg sm:rounded-xl overflow-hidden border-2 sm:border-4 border-border">
                        <CliperPlayer cliper={cliper} />
                      </div>
                      {cliper.duration > 0 && (
                        <div className="absolute bottom-4 sm:bottom-7 right-4 sm:right-7 bg-black/80 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg">
                          {Math.floor(cliper.duration / 60)}:{(cliper.duration % 60).toString().padStart(2, "0")}
                        </div>
                      )}
                    </div>

                    {/* Acciones del cliper */}
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(cliper)}
                            className="flex items-center gap-1 sm:gap-2 font-semibold transition-all h-8 px-2 sm:px-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          >
                            <span className="text-base sm:text-xl">❤️</span>
                            <span className="text-xs sm:text-sm">{cliper.likesCount || 0}</span>
                          </Button>
                          <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground">
                            <span className="text-base sm:text-xl">💬</span>
                            <span className="font-semibold text-xs sm:text-sm">{cliper.commentsCount || 0}</span>
                          </div>
                        </div>
                        
                        {/* Menú de 3 puntos movido aquí */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === cliper.id ? null : cliper.id)
                            }}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                          {openMenuId === cliper.id && (
                            <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-xl z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleShare(cliper)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-muted/30 flex items-center text-foreground transition-all rounded-t-xl"
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartir
                              </button>
                              <div className="border-t border-border"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCliperToDelete(cliper.id)
                                  setShowDeleteDialog(true)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-destructive/10 flex items-center text-destructive transition-all rounded-b-xl"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sección de comentarios siempre visible */}
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-border pt-3 sm:pt-4">
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">Comentarios</h4>
                      
                      {/* Lista de comentarios */}
                      {cliper.comments && cliper.comments.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-48 sm:max-h-60 overflow-y-auto">
                          {cliper.comments.map((comment: any) => (
                            <div key={comment.id} className="flex items-start gap-2 sm:gap-3">
                              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                                <AvatarImage src={comment.user?.profileImage || "/placeholder.svg"} />
                                <AvatarFallback className="text-[10px] sm:text-xs">
                                  {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="bg-muted/30 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 relative group">
                                  <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                    {comment.user?.firstName} {comment.user?.lastName}
                                  </p>
                                  <p className="text-xs sm:text-sm text-muted-foreground break-words">{comment.text}</p>
                                  {user && user.id === comment.userId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteComment(cliper.id, comment.id)}
                                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Sé el primero en comentar.</p>
                      )}

                      {/* Input para nuevo comentario */}
                      <div className="flex gap-1.5 sm:gap-2">
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                          <AvatarImage src={user?.profileImage || "/placeholder.svg"} />
                          <AvatarFallback className="text-[10px] sm:text-xs">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-1.5 sm:gap-2 min-w-0">
                          <input
                            className="flex-1 bg-muted/30 border border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all min-w-0"
                            placeholder="Comentar..."
                            value={newCommentByCliper[cliper.id] || ""}
                            onChange={(e) => setNewCommentByCliper(prev => ({ ...prev, [cliper.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                submitComment(cliper.id)
                              }
                            }}
                          />
                          <Button 
                            onClick={() => submitComment(cliper.id)} 
                            disabled={!newCommentByCliper[cliper.id]?.trim()}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 h-8 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0"
                          >
                            <span className="hidden sm:inline">Enviar</span>
                            <span className="sm:hidden">→</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Paginación */}
              {hasMore && (
                <div className="text-center py-8">
                  <Button variant="outline" onClick={handleLoadMore} disabled={isLoading} className="transition-transform hover:scale-105 active:scale-95">
                    {isLoading ? "Cargando..." : "Cargar más"}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Loading Skeleton */}
          {isLoading && clipers.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-muted rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                        <div className="h-2 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal - Solo para candidatos */}
        {user?.role === "CANDIDATE" && (
          <UploadCliperModal open={showUploadModal} onOpenChange={setShowUploadModal} />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false)
            setCliperToDelete(null)
          }}
          onConfirm={handleDelete}
          title="¿Eliminar cliper?"
          description="Esta acción no se puede deshacer. El cliper será eliminado permanentemente de tu perfil."
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      </div>
    </ProtectedRoute>
  )
}
