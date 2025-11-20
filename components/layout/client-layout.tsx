"use client"

import { useEffect, useRef } from "react"
import { Navbar } from "./navbar"
import { useAuthStore } from "@/store/auth-store"
import { useInactivityLogout } from "@/hooks/use-inactivity-logout"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore()
  const hasCheckedAuth = useRef(false)

  // Hook para cerrar sesión por inactividad (30 minutos)
  useInactivityLogout()

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      checkAuth()
    }
  }, [checkAuth])

  return (
    <>
      <Navbar />
      {children}
    </>
  )
}