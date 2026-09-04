/** Tipos para el cliente OptiShield API */

export interface OptiShieldOptions {
  /** Tu API key de OptiShield (obtenla en https://optishield.uk/api-keys) */
  apiKey?: string
  /** URL base de la API (por defecto https://optishield.uk/api) */
  baseUrl?: string
  /** Suprime los banners de estado al importar (útil para el singleton `cli`) */
  silent?: boolean
}

/** Resultado crudo de un worker: lo que devuelve `cli.api()` */
export interface UniversalApiResult {
  success: boolean
  data: any
  resultId?: string
  error?: string
}

export interface UploadOptions {
  /** Días hasta que expire el archivo (default: 3, máx 30) */
  expiresInDays?: number
}

export interface UploadResult {
  /** URL pública del archivo subido (página /upload/:id) */
  url: string
  /** URL directa de descarga (expira si el archivo es temporal) */
  directUrl: string
  /** Fecha de expiración ISO (solo si no es permanente) */
  expiresAt?: string
  /** true si el archivo se almacenó de forma permanente */
  permanent: boolean
  /** ID del archivo */
  id: string
  /** Nombre original del archivo */
  filename?: string
  /** Tamaño en bytes */
  size?: number
  /** Tipo MIME */
  contentType?: string
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

/** Resultado de un chat con IA (orquestador `ia` o proveedores individuales) */
export interface AIChatResult {
  status: boolean
  sessionId?: string | null
  resultado: string
  modelo?: string
  /** Proveedor que respondió (solo en el orquestador `ia`) */
  via?: string
  /** Tiempo de respuesta en ms (solo en el orquestador `ia`) */
  tiempoMs?: number
}

/** Resultado de un scraper que devuelve archivos (descargadores) */
export interface MediaResult {
  success?: boolean
  status?: boolean
  title?: string
  type?: string
  /** TikTok dl: URL del video descargado */
  file?: string
  /** TikTok dl: URL del audio */
  audio?: string
  /** Descargadores con lista de media (igdl, pinterestdl, etc.) */
  media?: Array<{ url?: string; type?: string; quality?: string }>
  /** igdl: lista de media descargada */
  medias?: Array<{ url?: string; type?: string; quality?: string }>
  /** spotify-search: tracks encontrados */
  tracks?: Array<{
    url?: string
    title?: string
    artist?: string
    album?: string
    thumbnail?: string
    duration?: number
  }>
  /** Buscadores con lista genérica de resultados */
  data?: Array<Record<string, any>>
  /** Tiktoksearch/ytsearch: resultados de búsqueda */
  results?: Array<Record<string, any>>
  count?: number
  total?: number
  url?: string
  links?: Record<string, string>
  source?: string
  info?: {
    title?: string
    author?: string
    username?: string
    thumbnail?: string
    video_id?: string
  }
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

// ═══════════════════════════════════════════
//  MESSAGE DASHBOARD TYPES
// ═══════════════════════════════════════════

export interface MessageDashboard {
  bot: {
    id: string
    name: string
    status: string
    isConnected: boolean
  }
  recovery: {
    isRecovering: boolean
    pendingMessages: number
    disconnectTime: number
    lastDisconnectAgo: number | null
  }
  queue: {
    total: number
    high: number
    low: number
    active: number
  }
  messageTracking: {
    processedCount: number
    maxCapacity: number
    usagePercent: number
  }
  recoveryMetrics: RecoveryMetricsData
  recentMessages: Array<{
    id: string
    jid: string
    keyId: string
    content: string
    type: string
    timestamp: number
    pushName: string
    isGroup: boolean
    processed: boolean
    timeAgo: string
  }>
  timestamp: string
}

export interface RecoveryMetricsData {
  totalRecoveries: number
  successfulRecoveries: number
  failedRecoveries: number
  successRate: number
  avgProcessingTimeMs: number
  totalMessagesProcessed: number
  lastRecovery: {
    timestamp: number
    durationMs: number
    messagesProcessed: number
    success: boolean
    timeAgo: number
  } | null
  history: Array<{
    timestamp: number
    durationMs: number
    messagesProcessed: number
    success: boolean
    disconnectDurationMs: number
  }>
}

export interface AllMessageDashboards {
  bots: Array<{
    bot: {
      id: string
      name: string
      status: string
      isConnected: boolean
    }
    recovery: {
      isRecovering: boolean
      pendingMessages: number
    }
    queue: {
      total: number
      high: number
      low: number
      active: number
    }
    messageTracking: {
      processedCount: number
      maxCapacity: number
      usagePercent: number
    }
    recoveryMetrics: {
      totalRecoveries: number
      successfulRecoveries: number
      failedRecoveries: number
      successRate: number
      avgProcessingTimeMs: number
    }
  }>
  timestamp: string
}
