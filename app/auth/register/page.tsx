"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuthStore } from "@/store/auth-store"
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiBriefcase } from "react-icons/fi"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "", // Added company name field
    email: "",
    password: "",
    confirmPassword: "",
    role: "CANDIDATE" as "CANDIDATE" | "COMPANY",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const { register, isLoading } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.role === "COMPANY") {
      if (!formData.companyName || !formData.email || !formData.password) {
        setError("Por favor completa todos los campos")
        return
      }
    } else {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        setError("Por favor completa todos los campos")
        return
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    try {
      const registrationData =
        formData.role === "COMPANY"
          ? {
              companyName: formData.companyName,
              email: formData.email,
              password: formData.password,
              role: formData.role,
            }
          : {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              password: formData.password,
              role: formData.role,
            }

      await register(registrationData)
      router.push("/feed")
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Error al crear la cuenta"
      
      if (errorMessage.includes("Email ya está registrado")) {
        setError("Este email ya está registrado. ¿Ya tienes cuenta? Intenta iniciar sesión.")
      } else if (errorMessage.includes("Password debe tener al menos 8 caracteres")) {
        setError("La contraseña debe tener al menos 8 caracteres")
      } else {
        setError(errorMessage)
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 py-8 bg-background relative">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <Image src="/LogoClipers.png" alt="Clipers" width={40} height={40} className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
            <span className="text-xl sm:text-2xl font-bold text-foreground">Clipers</span>
          </Link>
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Crea tu cuenta</h1>
            <p className="text-sm sm:text-base text-muted-foreground px-4">Únete a la red profesional del futuro</p>
          </div>
        </div>

        {/* Register Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Registro</CardTitle>
            <CardDescription className="text-sm">Completa tus datos para comenzar</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Role Selection */}
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm">Tipo de cuenta</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="CANDIDATE" id="candidate" />
                    <Label htmlFor="candidate" className="flex items-center gap-2 cursor-pointer text-sm">
                      <FiUser className="h-4 w-4" />
                      <span>Candidato</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="COMPANY" id="company" />
                    <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer text-sm">
                      <FiBriefcase className="h-4 w-4" />
                      <span>Empresa</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.role === "COMPANY" ? (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="companyName" className="text-sm">Nombre de la empresa</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="TechCorp S.A."
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="firstName" className="text-sm">Nombre</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Juan"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="lastName" className="text-sm">Apellido</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Pérez"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-sm">Correo electrónico</Label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-sm">Contraseña</Label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-12 h-10 sm:h-11 text-sm sm:text-base"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FiEye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm">Confirmar contraseña</Label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10 pr-12 h-10 sm:h-11 text-sm sm:text-base"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FiEye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <div className="text-center px-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Al registrarte, aceptas nuestros{" "}
            <Link href="/terms" className="text-primary hover:text-primary/80 underline">
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="text-primary hover:text-primary/80 underline">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
