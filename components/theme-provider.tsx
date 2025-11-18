"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const root = window.document.documentElement
    const stored = localStorage.getItem("clipers-theme") as Theme | null
    
    if (stored) {
      setTheme(stored)
      root.classList.remove("light", "dark")
      root.classList.add(stored)
    } else {
      root.classList.remove("light", "dark")
      root.classList.add(defaultTheme)
    }
  }, [defaultTheme])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(newTheme)
      localStorage.setItem("clipers-theme", newTheme)
      setTheme(newTheme)
    },
  }

  // Evitar flash de contenido sin estilo
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
