import { useRef, useCallback, useState, useEffect } from "react"
import { Stack } from "@/lib/data-structures"

/**
 * Hook for managing recent searches using Stack data structure
 * Stores recent search queries for quick access
 */
export function useRecentSearches(maxSearches: number = 10, storageKey: string = "recent-searches") {
  const searches = useRef(new Stack<string>(maxSearches))
  const [, forceUpdate] = useState({})
  
  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as string[]
          parsed.reverse().forEach(search => searches.current.push(search))
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [storageKey])
  
  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim()
    if (trimmed) {
      searches.current.push(trimmed)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        const allSearches = searches.current.toArray()
        localStorage.setItem(storageKey, JSON.stringify(allSearches))
      }
      
      forceUpdate({})
    }
  }, [storageKey])
  
  const getRecentSearches = useCallback(() => {
    return searches.current.toArray().reverse() // Most recent first
  }, [])
  
  const clearSearches = useCallback(() => {
    searches.current.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
    forceUpdate({})
  }, [storageKey])
  
  return { 
    addSearch, 
    getRecentSearches, 
    clearSearches,
    recentSearches: getRecentSearches()
  }
}
