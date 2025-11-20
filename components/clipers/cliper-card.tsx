"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RemoteAvatar } from "@/components/ui/remote-avatar"
import { CliperModal } from "./cliper-modal"
import type { Cliper } from "@/lib/types"
import { Play, Clock } from "lucide-react"

interface CliperCardProps {
  cliper: Cliper
  showActions?: boolean // Show likes, comments, share buttons
}

export function CliperCard({ cliper, showActions = true }: CliperCardProps) {
  const [showModal, setShowModal] = useState(false)

  const handleOpenModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShowModal(true)
  }

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
        return "Error"
      case "UPLOADED":
        return "Subido"
      default:
        return status
    }
  }

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={(e) => {
        // Only open modal if not clicking on action buttons
        if (!(e.target as HTMLElement).closest('button')) {
          handleOpenModal(e)
        }
      }}>
        {/* Video Container - Facebook/TikTok Style */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {cliper.thumbnailUrl ? (
            <img
              src={cliper.thumbnailUrl || "/placeholder.svg"}
              alt={cliper.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <Play className="h-12 w-12 text-primary/60" />
            </div>
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play className="h-6 w-6 text-primary ml-1" />
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge className={`text-xs ${getStatusColor(cliper.status)}`}>{getStatusText(cliper.status)}</Badge>
          </div>

          {/* Duration */}
          {cliper.duration > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>
                {Math.floor(cliper.duration / 60)}:{(cliper.duration % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header - User Info */}
            <div className="flex items-center space-x-3">
              <RemoteAvatar
                src={cliper.user?.profileImage}
                alt={cliper.user ? `${cliper.user.firstName} ${cliper.user.lastName}` : "Usuario"}
                fallback={cliper.user ? `${cliper.user.firstName?.[0] || ""}${cliper.user.lastName?.[0] || ""}` : "U"}
                className="h-10 w-10"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {cliper.user ? `${cliper.user.firstName} ${cliper.user.lastName}` : "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(cliper.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-base line-clamp-2">{cliper.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{cliper.description}</p>
            </div>

            {/* Skills */}
            {cliper.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {cliper.skills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {cliper.skills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{cliper.skills.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions - Read only counters */}
            {showActions && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <span>❤️</span>
                    <span>{cliper.likesCount || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>💬</span>
                    <span>{cliper.commentsCount || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cliper Modal */}
      <CliperModal cliper={cliper} open={showModal} onOpenChange={setShowModal} showActions={showActions} />
    </>
  )
}
