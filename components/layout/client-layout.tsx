"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Navbar } from "./navbar"
import { useAuthStore } from "@/store/auth-store"
import { useInactivityLogout } from "@/hooks/use-inactivity-logout"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore()
  const hasCheckedAuth = useRef(false)
  const pathname = usePathname()

  // Hook for inactivity logout (30 minutes)
  useInactivityLogout()

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      checkAuth()
    }
  }, [checkAuth])

  // No mostrar navbar en páginas de autenticación
  const isAuthPage = pathname?.startsWith("/auth/")
  const showNavbar = !isAuthPage

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  )
}