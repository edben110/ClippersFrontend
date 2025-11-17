"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReviewTechnicalTestModal } from "./review-technical-test-modal"
import { apiClient } from "@/lib/api"
import type { TechnicalTest } from "@/lib/types"
import { FiFileText, FiCheckCircle, FiClock } from "react-icons/fi"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ViewTechnicalTestsButtonProps {
    jobId: string
    candidateId: string
}

export function ViewTechnicalTestsButton({ jobId, candidateId }: ViewTechnicalTestsButtonProps) {
    const [tests, setTests] = useState<TechnicalTest[]>([])
    const [selectedTest, setSelectedTest] = useState<TechnicalTest | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const fetchTests = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get<TechnicalTest[]>(`/jobs/${jobId}/technical-tests/candidate/${candidateId}`)
            setTests(response)
        } catch (error) {
            console.error("Error fetching tests:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (jobId && candidateId) {
            fetchTests()
        }
    }, [jobId, candidateId])

    const handleViewTest = (test: TechnicalTest) => {
        setSelectedTest(test)
        setIsModalOpen(true)
    }

    const handleTestReviewed = () => {
        fetchTests()
    }

    const getTestStatusIcon = (status: string) => {
        switch (status) {
            case "REVIEWED":
                return <FiCheckCircle className="text-green-500" />
            case "SUBMITTED":
                return <FiCheckCircle className="text-blue-500" />
            default:
                return <FiClock className="text-yellow-500" />
        }
    }

    const getTestStatusText = (status: string) => {
        switch (status) {
            case "SENT":
                return "Enviada"
            case "IN_PROGRESS":
                return "En progreso"
            case "SUBMITTED":
                return "Completada"
            case "REVIEWED":
                return "Evaluada"
            default:
                return status
        }
    }

    // Don't render if loading or no tests
    if (loading || !tests || tests.length === 0) {
        return null
    }

    if (tests.length === 1) {
        const test = tests[0]
        return (
            <>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewTest(test)}
                    disabled={loading}
                    className="gap-2"
                >
                    <FiFileText className="h-4 w-4" />
                    Ver Prueba
                    {test.status === "SUBMITTED" && (
                        <Badge className="ml-1 bg-blue-500">Nueva</Badge>
                    )}
                    {test.status === "REVIEWED" && test.score !== null && (
                        <Badge className="ml-1 bg-green-500">{test.score}/100</Badge>
                    )}
                </Button>

                <ReviewTechnicalTestModal
                    test={selectedTest}
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onTestReviewed={handleTestReviewed}
                />
            </>
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={loading} className="gap-2">
                        <FiFileText className="h-4 w-4" />
                        Ver Pruebas ({tests.length})
                        {tests.some(t => t.status === "SUBMITTED") && (
                            <Badge className="ml-1 bg-blue-500">
                                {tests.filter(t => t.status === "SUBMITTED").length}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    {tests.map((test, index) => (
                        <DropdownMenuItem
                            key={test.id}
                            onClick={() => handleViewTest(test)}
                            className="flex items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                {getTestStatusIcon(test.status)}
                                <span className="text-sm">
                                    Prueba {index + 1}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    {getTestStatusText(test.status)}
                                </span>
                                {test.status === "REVIEWED" && test.score !== null && (
                                    <Badge variant="secondary" className="text-xs">
                                        {test.score}/100
                                    </Badge>
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <ReviewTechnicalTestModal
                test={selectedTest}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onTestReviewed={handleTestReviewed}
            />
        </>
    )
}
