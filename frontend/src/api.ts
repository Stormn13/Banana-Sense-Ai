export interface UploadResponse {
  image_id: string
  filename: string | null
  size: number
}

export interface AnalysisResponse {
  image_id: string
  predicted_class: string
  confidence: number
  shelf_life_days: number
  advice: string
}

export type ApiErrorKind =
  | 'unsupported_type'
  | 'session_expired'
  | 'analysis_failed'
  | 'unreachable'

export class ApiError extends Error {
  kind: ApiErrorKind
  status?: number

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.kind = kind
    this.status = status
  }
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string }
    return body.detail ?? `HTTP ${response.status}`
  } catch {
    return `HTTP ${response.status}`
  }
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('image', file)

  let response: Response
  try {
    response = await fetch('/upload-image', { method: 'POST', body: form })
  } catch {
    throw new ApiError('unreachable', 'Backend unreachable — is uvicorn running?')
  }

  if (!response.ok) {
    if (response.status === 415) {
      throw new ApiError('unsupported_type', 'Unsupported file type', 415)
    }
    throw new ApiError(
      'unreachable',
      await readErrorDetail(response),
      response.status,
    )
  }

  return (await response.json()) as UploadResponse
}

export async function analyzeImage(imageId: string): Promise<AnalysisResponse> {
  let response: Response
  try {
    response = await fetch(`/analyze/${imageId}`, { method: 'POST' })
  } catch {
    throw new ApiError('unreachable', 'Backend unreachable — is uvicorn running?')
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 404) {
      throw new ApiError(
        'session_expired',
        'Image session expired — please re-upload',
        response.status,
      )
    }
    if (response.status === 422) {
      throw new ApiError(
        'analysis_failed',
        "Couldn't analyze this image",
        422,
      )
    }
    throw new ApiError(
      'unreachable',
      await readErrorDetail(response),
      response.status,
    )
  }

  return (await response.json()) as AnalysisResponse
}
