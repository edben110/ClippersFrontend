import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useToast } from './use-toast'

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutos en milisegundos
const WARNING_TIMEOUT = 28 * 60 * 1000 // 28 minutos - advertencia 2 minutos antes

export function useInactivityLogout() {
  const { logout, user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningShownRef = useRef(false)

  const resetTimer = () => {
    // Limpiar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }
    warningShownRef.current = false

    // Solo configurar timer si hay un usuario logueado
    if (!user) return

    // Timer de advertencia (2 minutos antes)
    warningTimeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true
        toast({
          title: "⚠️ Sesión por expirar",
          description: "Tu sesión se cerrará en 2 minutos por inactividad. Mueve el mouse para mantenerla activa.",
          duration: 10000,
        })
      }
    }, WARNING_TIMEOUT)

    // Timer de cierre de sesión
    timeoutRef.current = setTimeout(() => {
      toast({
        title: "🔒 Sesión cerrada",
        description: "Tu sesión se ha cerrado por inactividad (30 minutos).",
        variant: "destructive",
      })
      logout()
      router.push('/auth/login')
    }, INACTIVITY_TIMEOUT)
  }

  useEffect(() => {
    // Solo activar si hay usuario logueado
    if (!user) return

    // Eventos que resetean el timer de inactividad
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // Resetear timer en cada evento
    events.forEach(event => {
      document.addEventListener(event, resetTimer)
    })

    // Iniciar el timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
    }
  }, [user]) // Re-ejecutar si el usuario cambia

  return null
}
