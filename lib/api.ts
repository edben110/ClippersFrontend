import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"

class ApiClient {
  private static instance: ApiClient
  private axiosInstance: AxiosInstance

  private constructor() {
    // Get API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    
    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL environment variable is not set")
    }

    // Normalize baseURL to always include /api
    const trimmedBase = apiUrl.replace(/\/+$/, "")
    const normalizedBase = trimmedBase.endsWith("/api") ? trimmedBase : `${trimmedBase}/api`

    console.log("API Client initialized with baseURL:", normalizedBase)

    this.axiosInstance = axios.create({
      baseURL: normalizedBase,
      timeout: 30000, // Increased from 10s to 30s
      headers: {
        "Content-Type": "application/json",
      },
    })

    this.setupInterceptors()
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken")
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor for token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response
      },
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem("refreshToken")
            if (refreshToken) {
              const response = await this.axiosInstance.post("/auth/refresh", {
                refreshToken,
              })

              const { accessToken } = response.data
              localStorage.setItem("accessToken", accessToken)

              return this.axiosInstance(originalRequest)
            }
          } catch (refreshError) {
            localStorage.removeItem("accessToken")
            localStorage.removeItem("refreshToken")
            window.location.href = "/auth/login"
          }
        }

        return Promise.reject(error)
      },
    )
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, config)
    return response.data
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config)
    return response.data
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config)
    return response.data
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config)
    return response.data
  }

  public async upload<T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return response.data
  }
}

export const apiClient = ApiClient.getInstance()
