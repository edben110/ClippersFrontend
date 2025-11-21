"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RemoteAvatar } from "@/components/ui/remote-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth-store"
import { useTheme } from "@/components/theme-provider"
import { Home, Video, Briefcase, User, LogOut, Sun, Moon } from "lucide-react"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  
  // Usar useTheme de forma segura
  let theme: "dark" | "light" = "dark"
  let setTheme: ((theme: "dark" | "light") => void) | undefined
  
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
    setTheme = themeContext.setTheme
  } catch (e) {
    // ThemeProvider not available yet
  }

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
    <>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/40 backdrop-blur-2xl shadow-sm">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <Image src="/LogoClipers.png" alt="Clipers" width={48} height={48} className="h-10 w-10 sm:h-12 sm:w-14 rounded-lg object-contain" priority />
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Clipers</span>
            </Link>

            {/* Navegación centrada - Solo Desktop */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center justify-center flex-1 space-x-8 md:-ml-10 lg:-ml-20">
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

            {/* Theme Toggle & Avatar */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
              {/* Theme Toggle Button */}
              {setTheme && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme?.(theme === "dark" ? "light" : "dark")}
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                  title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              )}

              {isAuthenticated ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer flex-shrink-0">
                      <RemoteAvatar
                        src={user?.profileImage}
                        alt={user?.firstName || "Usuario"}
                        fallback={`${user?.firstName?.[0] || "U"}${user?.lastName?.[0] || ""}`}
                        className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer"
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
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm px-2 sm:px-4">
                    <Link href="/auth/login">Iniciar sesión</Link>
                  </Button>
                  <Button size="sm" asChild className="text-xs sm:text-sm px-2 sm:px-4">
                    <Link href="/auth/register">Registrarse</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Solo Mobile */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl shadow-lg pb-safe">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg
                    transition-all duration-200 flex-1 max-w-[100px]
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <item.icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}
