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
import { Plus, Share2, Play, RefreshCw, MoreHorizontal } from "lucide-react"
import type { Cliper, Comment } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CliperPlayer } from "@/components/clipers/cliper-player"

export default function ClipersPage() {
  const { clipers, isLoading, hasMore, loadClipers, deleteCliper } = useCliperStore()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [engagement, setEngagement] = useState<Record<string, { postId?: string; likes: number; isLiked: boolean; comments: number }>>({})
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsList, setCommentsList] = useState<Comment[]>([])
  const [activeCliper, setActiveCliper] = useState<Cliper | null>(null)
  const [newComment, setNewComment] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [cliperToDelete, setCliperToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuthStore()
  // Vista simplificada estilo YouTube: sin observer ni autoplay (limpieza de estados heredados)

  useEffect(() => {
    loadClipers(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


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

  const ensurePost = async (cliper: Cliper): Promise<string> => {
    // NO crear posts automáticamente desde clipers
    // Los clipers ya tienen su propio sistema de engagement
    // Este método no debería usarse
    throw new Error("No se debe crear posts automáticamente desde clipers")
  }

  const handleLike = async (cliper: Cliper) => {
    // Implementar likes directamente en clipers sin crear posts
    try {
      // TODO: Implementar endpoint de likes para clipers
      const curr = engagement[cliper.id] || { likes: 0, isLiked: false, comments: 0 }
      const newIsLiked = !curr.isLiked

      setEngagement((prev) => {
        const likes = Math.max(0, curr.likes + (newIsLiked ? 1 : -1))
        return { ...prev, [cliper.id]: { ...curr, isLiked: newIsLiked, likes } }
      })

      toast({
        title: "Me gusta",
        description: newIsLiked ? "Te gusta este cliper" : "Ya no te gusta este cliper"
      })
    } catch {
      toast({ title: "Error", description: "No se pudo dar me gusta al cliper.", variant: "destructive" })
    }
  }

  const openComments = async (cliper: Cliper) => {
    // Abrir modal de comentarios sin cargar desde posts
    try {
      // TODO: Implementar endpoint de comentarios para clipers
      setCommentsList([])
      setActiveCliper(cliper)
      setCommentsOpen(true)
      toast({
        title: "Comentarios deshabilitados temporalmente",
        description: "Los comentarios en clipers estarán disponibles pronto.",
        variant: "default"
      })
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" })
    }
  }

  const submitComment = async () => {
    if (!activeCliper || !newComment.trim()) return
    try {
      // TODO: Implementar endpoint de comentarios para clipers
      toast({
        title: "Comentarios deshabilitados temporalmente",
        description: "Los comentarios en clipers estarán disponibles pronto.",
        variant: "default"
      })
    } catch {
      toast({ title: "Error", description: "No se pudo enviar el comentario.", variant: "destructive" })
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Clipers</h1>
              <p className="text-muted-foreground">
                {user?.role === "COMPANY"
                  ? "Descubre el talento a través de videos profesionales"
                  : "Presenta tu perfil profesional con videos cortos"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              {user?.role === "CANDIDATE" && (
                <Button onClick={() => setShowUploadModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Subir Cliper
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
              <div className="max-w-2xl mx-auto space-y-8">
                {Array.from(new Map(clipers.map(c => [c.id, c])).values()).map((cliper) => (
                  <div key={cliper.id} className="glass-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 card-hover-lift">
                    {/* Header del post */}
                    <div className="p-5 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RemoteAvatar
                            src={cliper.user?.profileImage}
                            alt={cliper.user?.firstName || "Usuario"}
                            fallback={`${cliper.user?.firstName?.[0] || "U"}${cliper.user?.lastName?.[0] || ""}`}
                            className="h-11 w-11 ring-2 ring-primary/20"
                          />
                          <div>
                            <p className="font-bold text-sm cursor-pointer hover:underline text-foreground" onClick={() => handleViewProfile(cliper)}>
                              {cliper.user ? `${cliper.user.firstName} ${cliper.user.lastName}` : "Usuario"}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                              {formatDistanceToNow(new Date(cliper.createdAt), { addSuffix: true, locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-xs font-semibold ${cliper.status === "DONE" ? "bg-green-100 text-green-800" :
                            cliper.status === "PROCESSING" ? "bg-yellow-100 text-yellow-800" :
                              cliper.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                            }`}>
                            {cliper.status === "DONE" ? "✓ Listo" : cliper.status === "PROCESSING" ? "⏳ Procesando" : cliper.status === "FAILED" ? "✗ Error" : cliper.status}
                          </Badge>
                          {/* Botón de eliminar simple y visible */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCliperToDelete(cliper.id)
                              setShowDeleteDialog(true)
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold transition-all"
                          >
                            🗑️ Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Título y descripción */}
                    {(cliper.title || cliper.description) && (
                      <div className="px-4 pb-3">
                        {cliper.title && (
                          <h3 className="font-semibold text-base mb-1">{cliper.title}</h3>
                        )}
                        {cliper.description && (
                          <p className="text-sm text-muted-foreground">{cliper.description}</p>
                        )}
                      </div>
                    )}

                    {/* Video Player - Más grande */}
                    <div className="relative">
                      <div className="aspect-[16/10] bg-black rounded-xl overflow-hidden">
                        <CliperPlayer cliper={cliper} />
                      </div>
                      {cliper.duration > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                          {Math.floor(cliper.duration / 60)}:{(cliper.duration % 60).toString().padStart(2, "0")}
                        </div>
                      )}
                    </div>

                    {/* Acciones del post */}
                    <div className="p-4 pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(cliper)}
                            className={`flex items-center gap-2 font-semibold transition-all ${
                              engagement[cliper.id]?.isLiked 
                                ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                                : 'text-foreground/70 hover:text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <span className="text-xl">❤️</span>
                            <span>{engagement[cliper.id]?.likes || 0}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openComments(cliper)}
                            className="flex items-center gap-2 font-semibold text-foreground/70 hover:text-blue-500 hover:bg-blue-50 transition-all"
                          >
                            <span className="text-xl">💬</span>
                            <span>{engagement[cliper.id]?.comments || 0}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(cliper)}
                            className="flex items-center gap-2 font-semibold text-foreground/70 hover:text-green-500 hover:bg-green-50 transition-all"
                          >
                            <Share2 className="h-5 w-5" />
                            <span>Compartir</span>
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

          {/* Comments Dialog */}
          <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Comentarios</DialogTitle>
                <DialogDescription>
                  Comparte tu opinión sobre este cliper
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                {commentsList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>
                ) : commentsList.map((c) => (
                  <div key={c.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{c.user?.firstName?.[0] ?? "U"}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{c.user ? `${c.user.firstName} ${c.user.lastName}` : "Usuario"}</p>
                      <p className="text-muted-foreground">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  className="flex-1 bg-muted rounded px-3 py-2 text-sm"
                  placeholder="Escribe un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={submitComment} disabled={!newComment.trim()}>Enviar</Button>
              </div>
            </DialogContent>
          </Dialog>

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
