/**
 * Construye la URL completa para una imagen del backend
 * @param imagePath - Ruta relativa de la imagen (ej: /uploads/avatars/avatar_123.png)
 * @returns URL completa de la imagen
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return "/placeholder.svg"
  }

  // Si ya es una URL completa, retornarla tal cual
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath
  }

  // Construir URL del backend
  // La API URL ya incluye /api, así que la usamos directamente
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
  
  // Si imagePath ya empieza con /api, usar solo el baseUrl sin /api
  if (imagePath.startsWith("/api/")) {
    const baseUrl = apiUrl.replace("/api", "")
    return `${baseUrl}${imagePath}`
  }
  
  // Si imagePath empieza con /uploads, agregar /api antes
  if (imagePath.startsWith("/uploads")) {
    return `${apiUrl}${imagePath}`
  }
  
  // Para otros casos, usar la URL completa
  const baseUrl = apiUrl.replace("/api", "")
  return `${baseUrl}${imagePath}`
}
