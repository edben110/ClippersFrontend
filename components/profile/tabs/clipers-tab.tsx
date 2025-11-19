"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CliperCard } from "@/components/clipers/cliper-card"
import { UploadCliperModal } from "@/components/clipers/upload-cliper-modal"
import { useCliperStore } from "@/store/cliper-store"
import { useJobStore } from "@/store/job-store"
import type { User, Company } from "@/lib/types"
import { FiPlus, FiVideo, FiBriefcase } from "react-icons/fi"

interface ClipersTabProps {
  profile: User | Company | null
  isOwnProfile: boolean
}

export function ClipersTab({ profile, isOwnProfile }: ClipersTabProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  // Subscribe to clipers array to trigger re-render when it changes
  const clipers = useCliperStore((state) => state.clipers)
  const loadClipers = useCliperStore((state) => state.loadClipers)
  const loadMyClipers = useCliperStore((state) => state.loadMyClipers)
  const jobs = useJobStore((state) => state.jobs)
  const loadMyJobs = useJobStore((state) => state.loadMyJobs)

  const isCompany = profile && "name" in profile

  useEffect(() => {
    if (isCompany && isOwnProfile) {
      // Load only company's own jobs
      loadMyJobs()
    } else if (profile && profile.id) {
      // Load clipers for this specific user profile
      if (isOwnProfile) {
        loadMyClipers()
      } else {
        // Load all and filter client-side for other users
        loadClipers(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompany, isOwnProfile, profile?.id])

  if (isCompany) {
    // Show company jobs
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Empleos publicados</h2>
          {isOwnProfile && (
            <Button onClick={() => setShowUploadModal(true)}>
              <FiPlus className="h-4 w-4 mr-2" />
              Publicar empleo
            </Button>
          )}
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, index) => (
              <div key={index} className="bg-card rounded-lg border p-6">
                <h3 className="font-semibold mb-2">{job.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{job.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{job.location}</span>
                  <span className="text-primary font-medium">Ver detalles</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <FiBriefcase className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No hay empleos publicados</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "Publica tu primera oferta laboral para encontrar candidatos"
                      : "Esta empresa no ha publicado empleos aún"}
                  </p>
                </div>
                {isOwnProfile && (
                  <Button onClick={() => setShowUploadModal(true)}>
                    <FiPlus className="h-4 w-4 mr-2" />
                    Publicar primer empleo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Show user clipers
  // Filter clipers to show only those belonging to this profile
  const userClipers = profile ? clipers.filter(c => c.userId === profile.id) : clipers

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Mis Clipers</h2>
          {isOwnProfile && (
            <Button onClick={() => setShowUploadModal(true)}>
              <FiPlus className="h-4 w-4 mr-2" />
              Subir Cliper
            </Button>
          )}
        </div>

        {userClipers && userClipers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userClipers.map((cliper, index) => (
              <CliperCard key={index} cliper={cliper} showActions={false} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <FiVideo className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No hay clipers</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "Sube tu primer cliper para mostrar tu perfil profesional"
                      : "Este usuario no ha subido clipers aún"}
                  </p>
                </div>
                {isOwnProfile && (
                  <Button onClick={() => setShowUploadModal(true)}>
                    <FiPlus className="h-4 w-4 mr-2" />
                    Subir primer Cliper
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      <UploadCliperModal open={showUploadModal} onOpenChange={setShowUploadModal} />
    </>
  )
}
