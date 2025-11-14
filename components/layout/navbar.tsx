"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RemoteAvatar } from "@/components/ui/remote-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth-store"
import { Home, Video, Briefcase, User, LogOut, Menu, X } from "lucide-react"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/clipers", label: "Clipers", icon: Video },
    { href: "/jobs", label: "Empleos", icon: Briefcase },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-transparent backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/LogoClipers.png" alt="Clipers" width={48} height={40} className="h-10 w-12 rounded-lg object-contain" />
            <span className="text-xl font-bold text-foreground">Clipers</span>
          </Link>

          {/* Navegación centrada */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg
                      transition-all duration-200 font-medium
                      ${isActive 
                        ? 'text-foreground bg-muted/50 border-b-2 border-primary' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Avatar con dropdown a la derecha */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {/* Avatar con dropdown (Desktop y Mobile) */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <RemoteAvatar
                        src={user?.profileImage}
                        alt={user?.firstName || "Usuario"}
                        fallback={`${user?.firstName?.[0] || "U"}${user?.lastName?.[0] || ""}`}
                        className="h-10 w-10 cursor-pointer"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 z-[100]" align="end" sideOffset={5}>
                    <div className="flex items-center gap-3 p-3">
                      <RemoteAvatar
                        src={user?.profileImage}
                        alt={user?.firstName || "Usuario"}
                        fallback={`${user?.firstName?.[0] || "U"}${user?.lastName?.[0] || ""}`}
                        className="h-12 w-12"
                      />
                      <div className="flex flex-col space-y-1 flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <User className="mr-3 h-4 w-4" />
                        Ver perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Iniciar sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Registrarse</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'text-foreground bg-muted/50 font-medium' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
