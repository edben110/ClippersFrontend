import { create } from "zustand"
import type { Job, JobMatch, JobApplication } from "@/lib/types"
import { apiClient } from "@/lib/api"

interface JobState {
  jobs: Job[]
  matches: JobMatch[]
  applicants: JobApplication[]
  myApplications: JobApplication[]
  isLoading: boolean
  hasMore: boolean
  page: number
  filters: JobFilters
  searchJobs: (query?: string, filters?: JobFilters, refresh?: boolean) => Promise<void>
  loadMyJobs: () => Promise<void>
  getJobMatches: (jobId: string) => Promise<void>
  getApplicants: (jobId: string) => Promise<void>
  rankApplicants: (jobId: string) => Promise<void>
  getAIRanking: (jobId: string) => Promise<void>
  applyToJob: (jobId: string, message?: string) => Promise<JobApplication>
  getMyApplications: () => Promise<void>
  updateApplicationStatus: (applicationId: string, status: string) => Promise<void>
  getJobApplications: (jobId: string) => Promise<void>
  createJob: (jobData: CreateJobData) => Promise<void>
  updateJob: (jobId: string, jobData: Partial<CreateJobData>) => Promise<void>
  deleteJob: (jobId: string) => Promise<void>
  setFilters: (filters: Partial<JobFilters>) => void
  hasAppliedToJob: (jobId: string) => boolean
  getApplicationForJob: (jobId: string) => JobApplication | undefined
}

interface JobFilters {
  location?: string
  type?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP"
  salaryMin?: number
  salaryMax?: number
  skills?: string[]
  industry?: string
}

interface CreateJobData {
  title: string
  description: string
  requirements: string[]
  skills: string[]
  location: string
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP"
  salaryMin?: number
  salaryMax?: number
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  matches: [],
  applicants: [],
  myApplications: [],
  isLoading: false,
  hasMore: true,
  page: 0,
  filters: {},

  searchJobs: async (query = "", filters = {}, refresh = false) => {
    const { isLoading, hasMore, page } = get()

    if (isLoading || (!hasMore && !refresh)) return

    set({ isLoading: true })

    try {
      const params = new URLSearchParams({
        page: (refresh ? 0 : page).toString(),
        size: "10",
        ...(query && { search: query }),
        ...(filters.location && { location: filters.location }),
        ...(filters.type && { type: filters.type }),
        ...(filters.salaryMin && { salaryMin: filters.salaryMin.toString() }),
        ...(filters.salaryMax && { salaryMax: filters.salaryMax.toString() }),
        ...(filters.industry && { industry: filters.industry }),
      })

      if (filters.skills && filters.skills.length > 0) {
        filters.skills.forEach((skill) => params.append("skills", skill))
      }

      const response = await apiClient.get<{
        jobs: Job[]
        hasMore: boolean
        totalPages: number
      }>(`/jobs/public?${params}`)

      // Always load user applications on first load or refresh to ensure we have latest data
      if (refresh || get().myApplications.length === 0) {
        try {
          const applicationsResponse = await apiClient.get<JobApplication[]>('/jobs/my-applications')
          set({ myApplications: applicationsResponse })
        } catch (error) {
          console.error('Error loading user applications:', error)
          // Don't fail the whole operation if applications can't be loaded
        }
      }

      set((state) => ({
        jobs: refresh ? response.jobs : [...state.jobs, ...response.jobs],
        page: refresh ? 1 : page + 1,
        hasMore: response.hasMore,
        isLoading: false,
        filters: refresh ? filters : state.filters,
      }))
    } catch (error) {
      console.error("Error searching jobs:", error)
      set({ isLoading: false })
    }
  },

  loadMyJobs: async () => {
    set({ isLoading: true })

    try {
      const jobs = await apiClient.get<Job[]>('/jobs/my-jobs')
      set({
        jobs,
        isLoading: false,
        hasMore: false,
        page: 0
      })
    } catch (error) {
      console.error("Error loading my jobs:", error)
      set({ isLoading: false, jobs: [] })
    }
  },

  getJobMatches: async (jobId: string) => {
    try {
      console.debug(`[JOB STORE] getJobMatches jobId=${jobId}`)
      const matches = await apiClient.get<JobMatch[]>(`/jobs/${jobId}/matches`)
      console.debug(`[JOB STORE] getJobMatches received ${matches.length} matches`)
      set({ matches })
    } catch (error) {
      console.error("Error getting job matches:", error)
      set({ matches: [] })
    }
  },

  getApplicants: async (jobId: string) => {
    try {
      console.debug(`[JOB STORE] getApplicants jobId=${jobId}`)
      const applicants = await apiClient.get<JobApplication[]>(`/jobs/${jobId}/applications`)
      console.debug(`[JOB STORE] getApplicants received ${applicants.length} applicants`)
      set({ applicants })
    } catch (error) {
      console.error("Error getting applicants:", error)
      set({ applicants: [] })
    }
  },

  rankApplicants: async (jobId: string) => {
    try {
      console.debug(`[JOB STORE] rankApplicants jobId=${jobId}`)
      const ranked = await apiClient.get<JobMatch[]>(`/jobs/${jobId}/applicants/ranked`)
      console.debug(`[JOB STORE] rankApplicants received ${ranked.length} ranked matches`)
      set({ matches: ranked })
    } catch (error) {
      console.error("Error ranking applicants:", error)
      set({ matches: [] })
    }
  },

  getAIRanking: async (jobId: string) => {
    try {
      const data = await apiClient.get<{
        jobId: string
        jobTitle: string
        totalCandidates: number
        matches: Array<{
          candidateId: string
          candidateName: string
          compatibilityScore: number
          matchPercentage: number
          rank: number
          breakdown: {
            skillsMatch: number
            experienceMatch: number
            educationMatch: number
            semanticMatch: number
            locationMatch?: number
          }
          matchedSkills: string[]
          missingSkills: string[]
          explanation: string
          recommendations: string[]
          matchQuality: string
        }>
        averageScore: number
        topSkillsMatched: string[]
      }>(`/ai/match/job/${jobId}/candidates?limit=100`)

      // Type guard: check if data is valid
      if (!data) {
        throw new Error('No data received from AI service - Backend may not be running')
      }

      // Check if response has the expected structure
      if (typeof data !== 'object' || !('matches' in data) || !Array.isArray(data.matches)) {
        console.error('[JOB STORE] Invalid data structure:', data)
        throw new Error(`Invalid response format: matches is missing or not an array. Received: ${JSON.stringify(data).substring(0, 200)}`)
      }

      console.debug(`[JOB STORE] getAIRanking received ${data.matches.length} AI-ranked matches`)

      // Merge AI data with existing applicants
      set((state) => ({
        applicants: state.applicants.map(app => {
          const aiMatch = data.matches.find(m => m.candidateId === app.userId)
          if (aiMatch) {
            return {
              ...app,
              score: aiMatch.compatibilityScore,
              explanation: aiMatch.explanation,
              matchedSkills: aiMatch.matchedSkills,
              aiMatchData: {
                compatibilityScore: aiMatch.compatibilityScore,
                matchPercentage: aiMatch.matchPercentage,
                rank: aiMatch.rank,
                breakdown: aiMatch.breakdown,
                missingSkills: aiMatch.missingSkills,
                recommendations: aiMatch.recommendations,
                matchQuality: aiMatch.matchQuality,
              }
            }
          }
          return app
        }).sort((a, b) => (a.aiMatchData?.rank || 999) - (b.aiMatchData?.rank || 999))
      }))
    } catch (error) {
      console.error("Error getting AI ranking:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      throw error
    }
  },

  applyToJob: async (jobId: string, message?: string) => {
    try {
      console.debug(`[JOB STORE] applyToJob jobId=${jobId}`)
      const application = await apiClient.post<JobApplication>(`/jobs/${jobId}/apply`, { message })
      console.debug(`[JOB STORE] applyToJob completed jobId=${jobId}`)

      // Add the new application to myApplications
      set((state) => ({
        myApplications: [...state.myApplications, application]
      }))

      return application
    } catch (error) {
      console.error("Error applying to job:", error)
      throw error
    }
  },

  getMyApplications: async () => {
    try {
      console.debug(`[JOB STORE] getMyApplications`)
      const applications = await apiClient.get<JobApplication[]>('/jobs/my-applications')
      console.debug(`[JOB STORE] getMyApplications received ${applications.length} applications`)
      set({ myApplications: applications })
    } catch (error: any) {
      // Silenciar error 403 (usuario no tiene permisos o no es candidato)
      if (error?.response?.status !== 403) {
        console.error("Error loading user applications:", error)
      }
      set({ myApplications: [] })
    }
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    try {
      console.debug(`[JOB STORE] updateApplicationStatus applicationId=${applicationId} status=${status}`)
      await apiClient.put(`/jobs/applications/${applicationId}/status`, { status })
      console.debug(`[JOB STORE] updateApplicationStatus completed`)
    } catch (error) {
      console.error("Error updating application status:", error)
      throw error
    }
  },

  getJobApplications: async (jobId: string) => {
    try {
      console.debug(`[JOB STORE] getJobApplications jobId=${jobId}`)
      const applications = await apiClient.get<JobApplication[]>(`/jobs/${jobId}/applications`)
      console.debug(`[JOB STORE] getJobApplications received ${applications.length} applications`)
      set({ applicants: applications })
    } catch (error) {
      console.error("Error getting job applications:", error)
      set({ applicants: [] })
    }
  },

  createJob: async (jobData: CreateJobData) => {
    try {
      const newJob = await apiClient.post<Job>("/jobs", jobData)

      set((state) => ({
        jobs: [newJob, ...state.jobs],
      }))
    } catch (error) {
      console.error("Error creating job:", error)
      throw error
    }
  },

  updateJob: async (jobId: string, jobData: Partial<CreateJobData>) => {
    try {
      const updatedJob = await apiClient.put<Job>(`/jobs/${jobId}`, jobData)

      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === jobId ? updatedJob : job)),
      }))
    } catch (error) {
      console.error("Error updating job:", error)
      throw error
    }
  },

  deleteJob: async (jobId: string) => {
    try {
      await apiClient.delete(`/jobs/${jobId}`)

      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== jobId),
      }))
    } catch (error) {
      console.error("Error deleting job:", error)
      throw error
    }
  },

  setFilters: (filters: Partial<JobFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }))
  },

  hasAppliedToJob: (jobId: string) => {
    const { myApplications } = get()
    return myApplications.some(app => app.jobId === jobId || (app.job && app.job.id === jobId))
  },

  getApplicationForJob: (jobId: string) => {
    const { myApplications } = get()
    return myApplications.find(app => app.jobId === jobId || (app.job && app.job.id === jobId))
  },
}))
