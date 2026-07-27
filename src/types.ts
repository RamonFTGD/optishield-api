/** Tipos para el cliente OptiShield API */

export interface OptiShieldOptions {
  /** Tu API key de OptiShield (obtenla en https://optishield.uk/api-keys) */
  apiKey?: string
  /** URL base de la API (por defecto https://optishield.uk/api) */
  baseUrl?: string
}

export interface UploadOptions {
  /** Días hasta que expire el archivo (default: 3) */
  expiresInDays?: number
}

export interface UploadResult {
  /** URL pública del archivo subido */
  url: string
  /** Fecha de expiración ISO */
  expiresAt: string
  /** ID del archivo */
  id: string
}

export interface WorkerResponse {
  success: boolean
  data?: any
  error?: string
  resultId?: string
}

export interface ScraperResult {
  scraper: string
  result: any
  usage?: {
    used: number
    max: number
    remaining: number
  }
  timestamp?: string
}

export interface ScraperList {
  scrapers: Array<{
    name: string
    description?: string
    group?: string
    params?: string[]
    public?: boolean
  }>
  total: number
}

export interface UsageStats {
  periodDays: number
  totalCalls: number
  totalRows: number
  byScraper: Array<{
    scraper: string
    calls: number
    rows: number
  }>
}

export interface YouTubeParams {
  url: string
  format?: 'mp4' | 'mp3'
}

export interface SearchParams {
  query: string
  limit?: number
  action?: 'search' | 'download'
}

// ═══════════════════════════════════════════
//  DOWNLOAD TYPES
// ═══════════════════════════════════════════

export interface DownloadOptions {
  /** Nombre con el que se descargará el archivo */
  filename?: string
  /** Headers adicionales para la petición */
  headers?: Record<string, string>
  /** Timeout en ms (default: 60000) */
  timeout?: number
}

export interface DownloadResult {
  /** Buffer con el contenido del archivo */
  buffer: Buffer
  /** Tipo MIME del archivo */
  contentType: string
  /** Nombre del archivo (inferido de la URL o del header) */
  filename: string
  /** Tamaño en bytes */
  size: number
}

export interface ShortUrlResult {
  /** Código corto (ej: 'aB3xK9') */
  code: string
  /** URL completa acortada */
  shortUrl: string
  /** URL original */
  originalUrl: string
  /** Visitas totales */
  visits: number
}

// ═══════════════════════════════════════════
//  DEVICE AUTH TYPES
// ═══════════════════════════════════════════

export interface DeviceAuthResponse {
  /** Código de verificación para el dispositivo */
  code: string
  /** URL que el usuario debe visitar para autenticarse */
  url: string
  /** Tiempo de expiración en segundos */
  expiresIn: number
}

export interface DeviceAuthPollResponse {
  /** Estado de la autenticación: 'pending', 'done', 'expired' */
  status: 'pending' | 'done' | 'expired'
  /** Token JWT (solo si status === 'done') */
  token?: string
  /** API Key generada (solo si status === 'done') */
  apiKey?: string
}

export interface DeviceCredentials {
  /** Token JWT de autenticación */
  token: string
  /** API Key generada para el dispositivo */
  apiKey: string
  /** URL base del servidor */
  baseUrl?: string
}
