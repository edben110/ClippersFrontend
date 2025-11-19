"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RemoteAvatar } from "@/components/ui/remote-avatar"
import { Badge } from "@/components/ui/badge"
import { CommentSection } from "./comment-section"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useFeedStore } from "@/store/feed-store"
import type { Post } from "@/lib/types"
import { Heart, MessageCircle, MoreHorizontal, Play, Trash2, Edit2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth-store"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [showComments, setShowComments] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes || 0)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { likePost, loadComments, deletePost, updatePost } = useFeedStore()
  
  // Use comments directly from post prop (which comes from store)
  const comments = post.comments || []

  // Load comments count on mount if not already loaded
  useEffect(() => {
    if (!post.comments || post.comments.length === 0) {
      loadComments(post.id)
    }
  }, [post.id])

  // Auto-refresh comments every 10 seconds when comments section is open
  useEffect(() => {
    if (!showComments) return

    const interval = setInterval(async () => {
      await loadComments(post.id)
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [showComments, post.id, loadComments])

  const handleLike = async () => {
    try {
      await likePost(post.id)
      setIsLiked(!isLiked)
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleProfileClick = () => {
    if (post.user?.id) {
      router.push(`/profile/${post.user.id}`)
    }
  }

  const handleToggleComments = async () => {
    if (!showComments) {
      // Load comments when opening (updates store)
      await loadComments(post.id)
    }
    setShowComments(!showComments)
  }

  const handleCommentAdded = async () => {
    // Comments are already updated in store by addComment
    // No need to reload
  }

  const handleDeletePost = async () => {
    try {
      await deletePost(post.id)
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleEditPost = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return

    try {
      await updatePost(post.id, editContent.trim())
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating post:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(post.content)
    setIsEditing(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false)
    if (showMenu) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [showMenu])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "VIDEO":
        return "bg-primary/10 text-primary"
      case "CLIPER":
        return "bg-secondary/10 text-secondary"
      case "IMAGE":
        return "bg-success/10 text-success"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
      case "CLIPER":
        return <Play className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <Card className="glass-card rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-3 sm:p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <button onClick={handleProfileClick} className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity min-w-0 flex-1 cursor-pointer">
              <RemoteAvatar
                className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                src={post.user?.profileImage}
                alt={`${post.user?.firstName} ${post.user?.lastName}`}
                fallback={`${post.user?.firstName?.[0] || ""}${post.user?.lastName?.[0] || ""}`}
              />
              <div className="space-y-0.5 sm:space-y-1 text-left min-w-0 flex-1">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <p className="font-bold text-xs sm:text-sm hover:underline text-foreground truncate">
                    {post.user?.firstName} {post.user?.lastName}
                  </p>
                  <Badge variant="secondary" className={`text-[10px] sm:text-xs font-semibold flex-shrink-0 ${getTypeColor(post.type)}`}>
                    {getTypeIcon(post.type)}
                    <span className="ml-0.5 sm:ml-1 hidden xs:inline">
                      {post.type === "CLIPER" ? "Cliper" : post.type === "VIDEO" ? "Video" : "Post"}
                    </span>
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {(() => {
                    try {
                      const date = new Date(post.createdAt)
                      if (isNaN(date.getTime())) {
                        return "Fecha inválida"
                      }
                      return formatDistanceToNow(date, {
                        addSuffix: true,
                        locale: es,
                      })
                    } catch (error) {
                      return "Fecha inválida"
                    }
                  })()}
                </p>
              </div>
            </button>
          </div>
          {user && (user.id === post.userId || user.id === post.user?.id) && (
            <div className="relative flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-xl shadow-xl z-50">
                  <button
                    onClick={() => {
                      handleEditPost()
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted/30 flex items-center text-foreground transition-all rounded-t-lg"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar publicación
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteDialog(true)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-500/10 flex items-center text-red-500 transition-all rounded-b-lg"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar publicación
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="space-y-3 sm:space-y-4">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] sm:min-h-[100px] text-sm"
                maxLength={500}
              />
              <div className="flex justify-end space-x-2">
                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 text-xs">
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEdit} className="h-8 text-xs">
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-foreground leading-relaxed font-normal text-sm sm:text-base">{post.content}</p>
          )}

          {/* Media Content */}
          {post.imageUrl && (
            <div className="rounded-xl overflow-hidden bg-black/20 backdrop-blur-sm flex items-center justify-center min-h-[200px] border border-white/5">
              <img
                src={post.imageUrl || "/placeholder.svg"}
                alt="Post image"
                className="w-full h-auto object-contain max-h-[600px]"
              />
            </div>
          )}

          {post.videoUrl && (
            <div className="rounded-xl overflow-hidden bg-black border border-white/10">
              <video controls className="w-full h-auto max-h-96">
                <source src={post.videoUrl} type="video/mp4" />
                Tu navegador no soporta el elemento de video.
              </video>
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border/30 mt-3 sm:mt-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`space-x-1 sm:space-x-2 transition-all duration-200 h-8 px-2 sm:px-3 ${
                isLiked 
                  ? "text-red-500 hover:text-red-600" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? "fill-current" : ""}`} />
              <span className="font-semibold text-xs sm:text-sm">{likeCount}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="space-x-1 sm:space-x-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200 h-8 px-2 sm:px-3"
              onClick={handleToggleComments}
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold text-xs sm:text-sm">{comments.length}</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
            <CommentSection 
              postId={post.id} 
              comments={comments} 
              postOwnerId={post.userId}
              onCommentAdded={handleCommentAdded} 
            />
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeletePost}
        title="¿Eliminar publicación?"
        description="Esta acción no se puede deshacer. La publicación será eliminada permanentemente."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </Card>
  )
}
