"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getImageUrl } from "@/lib/utils/image"

interface RemoteAvatarProps {
  src?: string | null
  alt: string
  fallback: string
  className?: string
}

export function RemoteAvatar({ src, alt, fallback, className }: RemoteAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = getImageUrl(src)
  const showImage = imageUrl && imageUrl !== "/placeholder.svg" && !imageError
  
  return (
    <Avatar className={className}>
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={imageUrl} 
          alt={alt}
          className="aspect-square h-full w-full object-cover rounded-full"
          onError={() => {
            // Si la imagen falla al cargar, marcar como error y mostrar fallback
            setImageError(true)
          }}
        />
      )}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
