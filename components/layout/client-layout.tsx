"use client"

import { useEffect, useRef } from "react"
import { Navbar } from "./navbar"
import { useAuthStore } from "@/store/auth-store"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore()
  const hasCheckedAuth = useRef(false)

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