"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TechnicalTestModal } from "@/components/jobs/technical-test-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import type { TechnicalTest } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { FiFileText, FiClock, FiCheckCircle, FiArrowLeft } from "react-icons/fi"
import { useRouter } from "next/navigation"

export default function MyTestsPage() {
  const [tests, setTests] = useState<TechnicalTest[]>([])
  const [selectedTest, setSelectedTest] = useState<TechnicalTest | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.get<TechnicalTest[]>("/jobs/technical-tests/my-tests")
      setTests(data)
    } catch (error) {
      console.error("Error loading tests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenTest = (test: TechnicalTest) => {
    setSelectedTest(test)
    setShowModal(true)
  }

  const getStatusBadge = (status: TechnicalTest["status"], score?: number) => {
    switch (status) {
      case "SENT":
        return <Badge variant="secondary"><FiClock className="mr-1 h-3 w-3" /> Pendiente</Badge>
      case "IN_PROGRESS":
        return <Badge variant="secondary"><FiClock className="mr-1 h-3 w-3" /> En progreso</Badge>
      case "SUBMITTED":
        return <Badge className="bg-blue-500"><FiCheckCircle className="mr-1 h-3 w-3" /> Enviada</Badge>
      case "REVIEWED":
        return <Badge className="bg-green-500"><FiCheckCircle className="mr-1 h-3 w-3" /> Revisada {score && `- ${score}/100`}</Badge>
      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <FiArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Mis Pruebas Técnicas</h1>
              <p className="text-muted-foreground">
                Revisa y completa las pruebas técnicas que te han enviado
              </p>
            </div>
          </div>

          {/* Tests List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tienes pruebas técnicas</h3>
                <p className="text-muted-foreground">
                  Las empresas te enviarán pruebas técnicas cuando apliques a sus empleos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
                <Card key={test.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOpenTest(test)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <FiFileText className="h-6 w-6 text-primary" />
                      {getStatusBadge(test.status, test.score)}
                    </div>
                    <h3 className="font-semibold mb-2">Prueba Técnica</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enviada {formatDistanceToNow(new Date(test.createdAt), { addSuffix: true, locale: es })}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {test.status === "SENT" || test.status === "IN_PROGRESS" ? "Completar" : "Ver Detalles"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Test Modal */}
        <TechnicalTestModal
          test={selectedTest}
          open={showModal}
          onOpenChange={setShowModal}
          onTestSubmitted={loadTests}
        />
      </div>
    </ProtectedRoute>
  )
}
