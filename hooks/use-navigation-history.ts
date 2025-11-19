import { useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Stack } from "@/lib/data-structures"

/**
 * Hook for managing navigation history using Stack data structure
 * Allows going back through visited pages
 */
export function useNavigationHistory(maxHistory: number = 20) {
  const router = useRouter()
  const history = useRef(new Stack<string>(maxHistory))
  
  const navigateTo = useCallback((path: string) => {
    // Save current path before navigating
    if (typeof window !== 'undefined') {
      history.current.push(window.location.pathname)
    }
    router.push(path)
  }, [router])
  
  const goBack = useCallback(() => {
    const previousPath = history.current.pop()
    if (previousPath) {
      router.push(previousPath)
    } else {
      router.back()
    }
  }, [router])
  
  const canGoBack = useCallback(() => {
    return !history.current.isEmpty()
  }, [])
  
  const clearHistory = useCallback(() => {
    history.current.clear()
  }, [])
  
  return { 
    navigateTo, 
    goBack, 
    canGoBack: canGoBack(), 
    clearHistory 
  }
}
