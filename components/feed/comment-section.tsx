"use client"

import type React from "react"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RemoteAvatar } from "@/components/ui/remote-avatar"
import { useAuthStore } from "@/store/auth-store"
import { useFeedStore } from "@/store/feed-store"
import type { Comment } from "@/lib/types"
import { Send, X, Check } from "lucide-react"

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  postOwnerId?: string
  onCommentAdded?: () => void
}

export function CommentSection({ postId, comments, postOwnerId, onCommentAdded }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const { user } = useAuthStore()
  const { addComment, updateComment, deleteComment } = useFeedStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await addComment(postId, newComment.trim())
      setNewComment("")
      // Notify parent to reload comments
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditContent("")
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      await updateComment(postId, commentId, editContent.trim())
      setEditingCommentId(null)
      setEditContent("")
      // Reload comments after editing
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error("Error updating comment:", error)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) return

    try {
      await deleteComment(postId, commentId)
      // Reload comments after deleting
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing Comments */}
      {comments.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3">
              <RemoteAvatar
                src={comment.user?.profileImage}
                alt={comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : "Usuario"}
                fallback={`${comment.user?.firstName?.[0] || ""}${comment.user?.lastName?.[0] || ""}`}
                className="h-8 w-8"
              />
              <div className="flex-1 space-y-1">
                {editingCommentId === comment.id ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 border-border bg-card text-foreground focus-visible:ring-primary hover:bg-accent/50 transition-all"
                      maxLength={200}
                      autoFocus
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleSaveEdit(comment.id)}
                      className="text-green-500 hover:text-green-600 hover:bg-green-500/10 transition-all"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleCancelEdit}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="bg-muted/30 border border-border rounded-lg px-3 py-2 hover:bg-muted/50 transition-all">
                      <p className="font-semibold text-sm text-foreground">
                        {comment.user?.firstName} {comment.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-3 px-3">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                      {user?.id === comment.userId && (
                        <button
                          onClick={() => handleEdit(comment)}
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-all"
                        >
                          Editar
                        </button>
                      )}
                      {(user?.id === comment.userId || user?.id === postOwnerId) && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-muted-foreground hover:text-destructive hover:underline transition-all"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <RemoteAvatar
          src={user?.profileImage}
          alt={user ? `${user.firstName} ${user.lastName}` : "Usuario"}
          fallback={`${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`}
          className="h-8 w-8"
        />
        <div className="flex-1 flex items-center space-x-2">
          <Input
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-primary hover:bg-accent/50 transition-all"
            maxLength={200}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newComment.trim() || isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
