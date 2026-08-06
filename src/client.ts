import axios, { AxiosInstance } from 'axios'
import FormData from 'form-data'
import type {
  OptiShieldOptions,
  UploadOptions,
  UploadResult,
  WorkerResponse,
  ScraperResult,
  ScraperList,
  UsageStats,
  DownloadOptions,
  DownloadResult,
  DeviceAuthResponse,
  DeviceAuthPollResponse,
  DeviceCredentials,
  MessageDashboard,
  AllMessageDashboards,
  RecoveryMetricsData,
} from './types.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

const DEFAULT_BASE_URL = 'https://optishield.uk/api'
const DEFAULT_POLL_INTERVAL = 2000 // ms entre cada intento de polling
const DEFAULT_POLL_MAX_RETRIES = 60 // máximo 60 intentos (~2 minutos)
const DEFAULT_EXPIRES_DAYS = 3 // expiración por defecto para uploads

// ═══════════════════════════════════════════
//  CREDENTIALS STORAGE (local)
// ═══════════════════════════════════════════

const CREDENTIALS_DIR = path.join(os.homedir(), '.optishield')
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json')

function ensureCredentialsDir(): void {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true })
}

function loadCredentials(): DeviceCredentials | null {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf-8')
      return JSON.parse(data) as DeviceCredentials
    }
  } catch (err) {
    // Ignorar errores de lectura
  }
  return null
}

function saveCredentials(creds: DeviceCredentials): void {
  ensureCredentialsDir()
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8')
  // Permisos restringidos: solo el usuario puede leer/escribir
  try {
    fs.chmodSync(CREDENTIALS_FILE, 0o600)
  } catch {}
}

function clearCredentials(): void {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE)
    }
  } catch {}
}

/**
 * Extrae un mensaje de error limpio desde un error de Axios/Fetch.
 * En lugar de mostrar el objeto completo con request/response, devuelve
 * solo el mensaje relevante.
 */
function cleanError(err: any): string {
  if (!err) return 'Error desconocido'

  // Error de Axios con respuesta del servidor
  if (err.response?.data?.error) {
    return err.response.data.error
  }
  if (err.response?.data?.message) {
    return err.response.data.message
  }

  // Código de estado sin mensaje
  if (err.response?.status) {
    const status = err.response.status
    const reasons: Record<number, string> = {
      400: 'Solicitud inválida (400)',
      401: 'API key requerida o inválida (401)',
      403: 'Sin permisos o plan inactivo (403)',
      404: 'Recurso no encontrado (404)',
      429: 'Límite de solicitudes alcanzado (429)',
      500: 'Error interno del servidor (500)',
    }
    return reasons[status] || `Error HTTP ${status}`
  }

  // Error de red
  if (err.code === 'ECONNREFUSED') return 'Conexión rechazada. El servidor no está disponible.'
  if (err.code === 'ECONNRESET') return 'Conexión interrumpida por el servidor.'
  if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) return 'Tiempo de espera agotado (timeout).'
  if (err.code === 'ENOTFOUND') return 'Servidor no encontrado. Verifica la URL.'

  // Error genérico
  if (typeof err === 'string') return err
  if (err.message) return err.message

  return 'Error desconocido'
}

/**
 * Cache local de expiraciones de upload.
 * Map<uploadId, expiresAt>
 * Se limpia automáticamente al detectar expirados.
 */
const expirationCache = new Map<string, number>()

// Limpiar expirados cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [id, expiresAt] of expirationCache) {
      if (now > expiresAt) {
        expirationCache.delete(id)
      }
    }
  }, 5 * 60 * 1000).unref?.()
}

/**
 * Cliente oficial para la API de OptiShield.
 *
 * @example
 * ```ts
 * import { OptiShieldClient } from 'optishield-api'
 *
 * // Opción 1: Usar apiKey directamente
 * const api = new OptiShieldClient({ apiKey: 'tu-api-key' })
 *
 * // Opción 2: Iniciar sesión por dispositivo (recomendado)
 * await api.login()
 *
 * // Descargar video de YouTube
 * const result = await api.executeScraper('youtube', {
 *   url: 'https://youtube.com/watch?v=...',
 *   format: 'mp4'
 * })
 *
 * // Subir archivo (expira en 3 días)
 * const upload = await api.uploadFile(buffer, 'video.mp4', 'video/mp4')
 * ```
 */
export class OptiShieldClient {
  private client: AxiosInstance
  private baseUrl: string
  private apiKey: string
  private loggedIn: boolean = false
  /** Flag: si es true, la próxima llamada API auto-dispara login() */
  private needsAuth: boolean = false
  /** Evita múltiples login simultáneos */
  private loginPromise: Promise<void> | null = null

  constructor(opts: OptiShieldOptions = {}) {
    this.apiKey = opts.apiKey || ''
    this.baseUrl = opts.baseUrl || DEFAULT_BASE_URL

    // Auto-cargar credenciales guardadas si no se proporcionó apiKey
    if (!this.apiKey) {
      const saved = loadCredentials()
      if (saved?.apiKey) {
        this.apiKey = saved.apiKey
        this.loggedIn = true
      } else {
        // No hay apiKey ni credenciales guardadas → auto-login en 1ª llamada
        this.needsAuth = true
      }
    } else {
      this.loggedIn = true
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    })

    // Interceptor de peticiones: inyecta X-API-Key desde this.apiKey siempre
    // (más confiable que modificar defaults.headers porque evita problemas
    //  de referencias en distintas versiones de axios)
    this.client.interceptors.request.use(
      (config) => {
        if (this.apiKey) {
          config.headers['X-API-Key'] = this.apiKey
        }
        return config
      },
      (err) => Promise.reject(err)
    )

    // Interceptor de respuestas: convierte errores HTTP en mensajes limpios
    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        // Extraer solo el mensaje de error limpio, no el objeto completo
        const cleanMsg = cleanError(err)
        // Reemplazar el error con un Error simple que tenga el mensaje limpio
        const cleanErr = new Error(cleanMsg)
        // Preservar el status code para manejo condicional
        ;(cleanErr as any).status = err.response?.status || 0
        ;(cleanErr as any).data = err.response?.data || null
        return Promise.reject(cleanErr)
      }
    )

    // Si necesita autenticación, mostrar mensaje inmediatamente
    if (this.needsAuth) {
      // No bloqueamos el constructor — el login se hará en la 1ª llamada
      console.log('')
      console.log('╔══════════════════════════════════════════════════╗')
      console.log('║     🔐 OptiShield API — Sin autenticar           ║')
      console.log('╠══════════════════════════════════════════════════╣')
      console.log('║                                                  ║')
      console.log('║   No se encontraron credenciales guardadas.      ║')
      console.log('║   La primera llamada a la API iniciará           ║')
      console.log('║   automáticamente la autenticación por           ║')
      console.log('║   dispositivo.                                   ║')
      console.log('║                                                  ║')
      console.log('║   También puedes configurar manualmente:         ║')
      console.log('║                                                  ║')
      console.log('║   const api = new OptiShieldClient({             ║')
      console.log('║     apiKey: \'tu-api-key\'                        ║')
      console.log('║   })                                             ║')
      console.log('╚══════════════════════════════════════════════════╝')
      console.log('')
    }
  }

  /**
   * Si el cliente no está autenticado, dispara login() automáticamente.
   * Se llama al inicio de cada método público que requiera API Key.
   */
  private async ensureAuth(): Promise<void> {
    if (this.loggedIn && !!this.apiKey) return
    if (!this.needsAuth) {
      throw new Error(
        'Se requiere apiKey. Pásala en el constructor o usa api.login().'
      )
    }

    // Si ya hay un login en progreso, esperar a que termine
    if (this.loginPromise) {
      await this.loginPromise
      return
    }

    // Iniciar login automático
    this.loginPromise = this.login()
    try {
      await this.loginPromise
      this.needsAuth = false
    } finally {
      this.loginPromise = null
    }
  }

  /**
   * Inicia sesión en OptiShield usando autenticación por dispositivo.
   *
   * Genera un código único y te da una URL para que visites desde tu navegador.
   * Allí podrás iniciar sesión con Discord, GitHub o Google para autorizar este dispositivo.
   * Las credenciales se guardan en `~/.optishield/credentials.json`.
   *
   * @param pollInterval - Intervalo de polling en ms (default: 2000)
   * @param timeout - Timeout máximo en ms (default: 300000 = 5 min)
   *
   * @example
   * ```ts
   * import { OptiShieldClient } from 'optishield-api'
   *
   * const api = new OptiShieldClient()
   * await api.login()
   * // Ahora puedes usar todas las funciones sin configurar apiKey
   * const result = await api.youtube('https://youtube.com/watch?v=dQw4w9WgXcQ')
   * ```
   */
  async login(pollInterval: number = 2000, timeout: number = 300_000): Promise<void> {
    // 1. Obtener código de dispositivo
    const res = await axios.get<DeviceAuthResponse>(`${this.baseUrl}/auth/device`, {
      timeout: 15_000,
    })

    const { code, url, expiresIn } = res.data

    if (!code || !url) {
      throw new Error(
        'No se pudo obtener un código de autenticación. Verifica que el servidor esté funcionando.'
      )
    }

    // 2. Mostrar instrucciones al usuario
    console.log('')
    console.log('╔══════════════════════════════════════════════════╗')
    console.log('║       🔐 Autenticación por Dispositivo          ║')
    console.log('╠══════════════════════════════════════════════════╣')
    console.log('║                                                  ║')
    console.log('║   Para autorizar este dispositivo:               ║')
    console.log('║                                                  ║')
    console.log('║   1. Abre este enlace en tu navegador:           ║')
    console.log(`║   👉 ${url.padEnd(45)}║`)
    console.log('║                                                  ║')
    console.log('║   2. Inicia sesión con Discord, GitHub o Google ║')
    console.log('║                                                  ║')
    console.log(`║   ⏱️  El código expira en ${expiresIn / 60} minutos            ║`)
    console.log('║                                                  ║')
    console.log('╚══════════════════════════════════════════════════╝')
    console.log('')

    // 3. Hacer polling hasta que el usuario autorice
    const maxRetries = Math.floor(timeout / pollInterval)
    const startTime = Date.now()

    for (let i = 0; i < maxRetries; i++) {
      await sleep(pollInterval)

      // Mostrar progreso cada 10 segundos
      if (i > 0 && i % 5 === 0) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        console.log(`   ⏳ Esperando autenticación... (${elapsed}s)`)

        // Verificar expiración
        if (elapsed > expiresIn) {
          console.log('')
          console.log('   ❌ El código ha expirado. Vuelve a ejecutar login().')
          console.log('')
          throw new Error('Tiempo de autenticación agotado. El código expiró.')
        }
      }

      try {
        const pollRes = await axios.get<DeviceAuthPollResponse>(
          `${this.baseUrl}/auth/device/poll/${code}`,
          { timeout: 10_000 }
        )

        const pollData = pollRes.data

        if (pollData.status === 'done' && pollData.apiKey) {
          // ✅ Usuario autenticado exitosamente
          this.apiKey = pollData.apiKey
          this.loggedIn = true

          // Actualizar headers del cliente
          this.client.defaults.headers.common['X-API-Key'] = this.apiKey

          // Guardar credenciales en disco
          const creds: DeviceCredentials = {
            token: pollData.token || '',
            apiKey: pollData.apiKey,
            baseUrl: this.baseUrl,
          }
          saveCredentials(creds)

          console.log('')
          console.log('╔══════════════════════════════════════════════════╗')
          console.log('║       ✅ ¡Autenticación Exitosa!                 ║')
          console.log('╠══════════════════════════════════════════════════╣')
          console.log('║                                                  ║')
          console.log('║   Las credenciales se guardaron en:              ║')
          console.log(`║   📁 ~/.optishield/credentials.json              ║`)
          console.log('║                                                  ║')
          console.log('║   Ya puedes usar todas las funciones de la API.  ║')
          console.log('╚══════════════════════════════════════════════════╝')
          console.log('')
          return
        }

        if (pollData.status === 'expired') {
          console.log('')
          console.log('   ❌ El código ha expirado. Vuelve a ejecutar login().')
          console.log('')
          throw new Error('El código de autenticación expiró.')
        }
      } catch (err: any) {
        // Si es un error de red, continuar polling
        if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
          continue
        }
        // Si es un error HTTP (4xx/5xx), lanzar
        if (err.response?.status) {
          // 404 significa que el código no está listo aún
          if (err.response.status === 404) continue
          throw new Error(`Error de autenticación: ${err.response?.data?.error || err.message}`)
        }
        // Otros errores, continuar
      }
    }

    throw new Error(
      `Tiempo de espera agotado (${timeout / 1000}s). El usuario no completó la autenticación a tiempo.`
    )
  }

  /**
   * Cierra la sesión actual y elimina las credenciales guardadas.
   *
   * @example
   * ```ts
   * const api = new OptiShieldClient()
   * await api.login()
   * // ... usar la API ...
   * api.logout() // Limpia ~/.optishield/credentials.json
   * ```
   */
  logout(): void {
    this.apiKey = ''
    this.loggedIn = false
    this.needsAuth = true  // Re-activar auto-login para la próxima llamada
    this.client.defaults.headers.common['X-API-Key'] = ''
    clearCredentials()
    console.log('🔓 Sesión cerrada. Credenciales eliminadas.')
    console.log('   La próxima llamada a la API iniciará auto-login nuevamente.')
  }

  /**
   * Verifica si el cliente tiene una sesión activa.
   */
  isLoggedIn(): boolean {
    return this.loggedIn && !!this.apiKey
  }

  /**
   * Obtiene la ruta del archivo de credenciales.
   */
  getCredentialsPath(): string {
    return CREDENTIALS_FILE
  }

  // ═══════════════════════════════════════════
  //  SCRAPER EXECUTION (Worker + Polling)
  // ═══════════════════════════════════════════

  /**
   * Ejecuta un scraper de forma asíncrona usando el sistema de workers.
   *
   * 1. Envía el scraper al servidor (modo async)
   * 2. Obtiene un workerId
   * 3. Hace polling cada `interval` ms hasta que el worker completa
   * 4. Devuelve el resultado
   *
   * @param name - Nombre del scraper (youtube, tiktok, instagram, etc.)
   * @param params - Parámetros del scraper
   * @param pollOpts - Opciones de polling
   * @returns Resultado del scraper
   */
  async executeScraper(
    name: string,
    params: Record<string, any> = {},
    pollOpts?: {
      maxRetries?: number
      interval?: number
    }
  ): Promise<ScraperResult> {
    await this.ensureAuth()
    const maxRetries = pollOpts?.maxRetries ?? DEFAULT_POLL_MAX_RETRIES
    const interval = pollOpts?.interval ?? DEFAULT_POLL_INTERVAL

    // 1. Enviar scraper en modo async
    const submitRes = await this.client.post(
      `/scrapers/${name}/execute`,
      params,
      {
        params: { async: '1' },
        timeout: 30_000,
      }
    )

    const submitData = submitRes.data as {
      worker?: string
      jobId?: string
      usage?: { used: number; max: number; remaining: number }
    }

    if (!submitData.worker) {
      throw new Error(
        `El scraper '${name}' no devolvió un worker. Respuesta: ${JSON.stringify(submitData)}`
      )
    }

    const workerId = submitData.worker.split('/').pop()
    if (!workerId) {
      throw new Error(`No se pudo extraer workerId de: ${submitData.worker}`)
    }

    // 2. Polling loop
    let consecutiveErrors = 0

    for (let i = 0; i < maxRetries; i++) {
      await sleep(interval)

      const pollRes = await this.client
        .get<WorkerResponse>(`/scrapers/worker/${workerId}`, {
          timeout: 10_000,
        })
        .catch((err: any) => {
          consecutiveErrors++
          if (consecutiveErrors >= 5) {
            console.warn(
              `[optishield-api] Polling ${name} (${i + 1}/${maxRetries}): ${err?.message || 'error de red'}`
            )
          }
          return null
        })

      if (!pollRes) continue
      consecutiveErrors = 0

      const pollData = pollRes.data

      if (pollData.success && pollData.data) {
        return {
          scraper: name,
          result: pollData.data,
          usage: submitData.usage,
          timestamp: new Date().toISOString(),
        }
      }

      if (pollData.error) {
        // Si el worker aún no está listo, continuar polling
        if (pollData.error.includes('not found') || pollData.error.includes('expir')) {
          continue
        }
        throw new Error(`Worker error: ${pollData.error}`)
      }
    }

    throw new Error(
      `Timeout: El worker ${workerId} no completó después de ${maxRetries} intentos (${(maxRetries * interval) / 1000}s)`
    )
  }

  /**
   * Ejecuta un scraper de forma síncrona (espera el resultado directamente).
   * Para scrapers rápidos que no necesitan worker/polling.
   *
   * @param name - Nombre del scraper
   * @param params - Parámetros del scraper
   * @returns Resultado directo del scraper
   */
  async executeScraperSync(
    name: string,
    params: Record<string, any> = {}
  ): Promise<ScraperResult> {
    await this.ensureAuth()
    const res = await this.client.post(
      `/scrapers/${name}/execute`,
      params,
      {
        params: { async: '0' },
        timeout: 5400_000, // 3 minutos (coincide con timeout del servidor)
      }
    )
    return res.data as ScraperResult
  }

  // ═══════════════════════════════════════════
  //  FILE UPLOAD (con expiración)
  // ═══════════════════════════════════════════

  /**
   * Sube un archivo al servidor de OptiShield.
   * Se almacena en el cluster Windows (D://tmp) con expiración configurable.
   *
   * @param buffer - Buffer del archivo a subir
   * @param filename - Nombre del archivo (ej: 'video.mp4')
   * @param mimetype - Tipo MIME (ej: 'video/mp4')
   * @param opts - Opciones de expiración
   * @returns Información del archivo subido (URL pública + fecha de expiración)
   *
   * @example
   * ```ts
   * const upload = await api.uploadFile(
   *   buffer,
   *   'mi-video.mp4',
   *   'video/mp4',
   *   { expiresInDays: 7 }
   * )
   * console.log('URL:', upload.url)
   * console.log('Expira:', upload.expiresAt)
   * ```
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    opts?: UploadOptions
  ): Promise<UploadResult> {
    await this.ensureAuth()
    const expiresInDays = opts?.expiresInDays ?? DEFAULT_EXPIRES_DAYS

    const form = new FormData()
    form.append('file', buffer, {
      filename,
      contentType: mimetype,
      knownLength: buffer.length,
    })

    let res
    try {
      res = await this.client.post('/upload-file', form, {
        headers: {
          ...form.getHeaders(),
          'X-API-Key': this.apiKey,
        },
        timeout: 120_000,
        maxContentLength: 200 * 1024 * 1024,
        maxBodyLength: 200 * 1024 * 1024,
      })
    } catch (err: any) {
      const status = err.status || err.response?.status
      if (status === 413) {
        throw new Error('El archivo excede el límite de 100MB')
      }
      if (status === 403) {
        throw new Error('API key sin permisos o plan inactivo. Verifica en https://optishield.uk/api-keys')
      }
      if (status === 429) {
        throw new Error('Límite de solicitudes alcanzado. Renueva o mejora tu plan.')
      }
      throw new Error(`Error al subir archivo: ${err.message || err}`)
    }

    const data = res.data as { url: string; id?: string }

    if (!data.url) {
      throw new Error(
        `Upload falló: no se recibió URL. Respuesta: ${JSON.stringify(data)}`
      )
    }

    // Extraer ID de la URL /upload/:id
    const uploadId = data.url.split('/upload/').pop() || data.id || ''
    const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000

    // Guardar expiración en cache local
    if (uploadId) {
      expirationCache.set(uploadId, expiresAt)
    }

    return {
      url: data.url,
      expiresAt: new Date(expiresAt).toISOString(),
      id: uploadId,
    }
  }

  /**
   * Obtiene la URL de descarga de un archivo previamente subido.
   * Verifica si el archivo ha expirado según el cache local.
   *
   * @param uploadId - ID del upload (o URL completa)
   * @returns URL del archivo o null si expiró
   */
  async getUploadUrl(uploadId: string): Promise<string | null> {
    // Si es URL completa, extraer el ID
    const id = uploadId.includes('/upload/')
      ? uploadId.split('/upload/').pop() || ''
      : uploadId

    if (!id) return null

    // Verificar expiración local
    const expiresAt = expirationCache.get(id)
    if (expiresAt && Date.now() > expiresAt) {
      expirationCache.delete(id)
      return null
    }

    const baseUploadUrl =
      this.baseUrl.replace('/api', '') || 'https://optishield.uk'
    return `${baseUploadUrl}/upload/${id}`
  }

  // ═══════════════════════════════════════════
  //  MÉTODO UNIVERSAL PARA CUALQUIER SCRAPER
  // ═══════════════════════════════════════════

  /**
   * Ejecuta CUALQUIER scraper de la API por su nombre, sin importar si
   * tiene helper dedicado o no. Este es el método universal.
   *
   * @param name - Nombre exacto del scraper (ver `listScrapers()`)
   * @param params - Parámetros del scraper
   * @param opts - Opciones (sync=false usa workers/polling, sync=true espera directo)
   * @returns Resultado del scraper
   *
   * @example
   * ```ts
   * // IA unificada
   * await api.scraper('ia', { prompt: 'Hola' })
   * // IA individual
   * await api.scraper('nova-ai', { prompt: 'Hola' })
   * // Descargar video de TikTok
   * await api.scraper('tiktokdl', { url: 'https://tiktok.com/@user/video/123' })
   * ```
   */
  async scraper(
    name: string,
    params: Record<string, any> = {},
    opts?: { sync?: boolean }
  ): Promise<ScraperResult> {
    const sync = opts?.sync ?? true
    return sync
      ? this.executeScraperSync(name, params)
      : this.executeScraper(name, params)
  }

  /** Alias de `scraper(name, params)` para máximo descubrimiento. */
  async callScraper(
    name: string,
    params: Record<string, any> = {},
    opts?: { sync?: boolean }
  ): Promise<ScraperResult> {
    return this.scraper(name, params, opts)
  }

  // ═══════════════════════════════════════════
  //  HELPERS TIPADOS — TODOS LOS SCRAPERS
  // ═══════════════════════════════════════════

  // ─────────── IA (individuales + orquestador) ───────────

  /** 🤖 Chat con IA unificado (orquestador: prueba nova-ai → heckai → gptanon → google-gemma) */
  async ia(prompt: string, sessionId?: string) {
    return this.scraper('ia', { prompt, sessionId: sessionId || undefined })
  }

  /** 🤖 Chat con Nova AI (rápido y gratuito) */
  async novaAI(prompt: string) {
    return this.scraper('nova-ai', { prompt })
  }

  /** 🤖 Chat con HeckAI (GPT-5.4-mini, con sesiones conversacionales) */
  async heckAI(prompt: string, sessionId?: string) {
    return this.scraper('heckai', { prompt, sessionId: sessionId || undefined })
  }

  /** 🤖 Chat con GPTAnon (Google Gemma-3-27b, con sesiones y modelos) */
  async gptAnon(prompt: string, sessionId?: string, model?: string) {
    return this.scraper('gptanon', {
      prompt,
      sessionId: sessionId || undefined,
      model: model || undefined,
    })
  }

  /** 🤖 Chat con Google Gemma AI (con sesiones conversacionales) */
  async googleGemma(prompt: string, sessionId?: string) {
    return this.scraper('google-gemma', {
      prompt,
      sessionId: sessionId || undefined,
    })
  }

  /** 🤖 Edita una imagen con IA a partir de un prompt */
  async photoEditorAI(image: string, prompt: string) {
    return this.scraper('photoeditorai', { image, prompt })
  }

  // ─────────── Descargadores ───────────

  /** ⬇️ Descarga video/audio de YouTube — video=0 → MP3, video=1 → MP4 480p */
  async youtubeDownload(url: string, video: number | 'mp3' | 'mp4' = 1) {
    const videoFlag =
      video === 'mp3' ? 0 : video === 'mp4' ? 1 : Number(video)
    return this.scraper('youtubedl', { url, video: videoFlag })
  }

  /** ⬇️ Alias de `youtubeDownload(url, video)` */
  async youtube(url: string, video: number | 'mp3' | 'mp4' = 1) {
    return this.youtubeDownload(url, video)
  }

  /** ⬇️ Descarga videos o carruseles de TikTok sin marca de agua */
  async tiktokDownload(url: string, opts?: { format?: string; query?: string }) {
    return this.scraper('tiktokdl', { url, ...opts })
  }

  /** ⬇️ Alias de `tiktokDownload(url, opts)` */
  async tiktok(url: string) {
    return this.tiktokDownload(url)
  }

  /** ⬇️ Descarga reels, posts y carruseles de Instagram */
  async instagramDownload(url: string) {
    return this.scraper('igdl', { url })
  }

  /** ⬇️ Alias de `instagramDownload(url)` */
  async instagram(url: string) {
    return this.instagramDownload(url)
  }

  /** ⬇️ Descarga video o audio de Facebook */
  async facebookDownload(url: string, format?: string) {
    return this.scraper('facebookdl', { url, format: format || undefined })
  }

  /** ⬇️ Alias de `facebookDownload(url, format)` */
  async facebook(url: string, format?: string) {
    return this.facebookDownload(url, format)
  }

  /** ⬇️ Descarga audio de Spotify con portada y letras incrustadas */
  async spotifyDownload(url: string) {
    return this.scraper('spotifydl', { url })
  }

  /** ⬇️ Descarga imágenes o videos de Pinterest */
  async pinterestDownload(url: string) {
    return this.scraper('pinterestdl', { url })
  }

  /** ⬇️ Link directo de descarga de un mod de Minecraft (Modrinth) */
  async mcmodsDownload(
    slug: string,
    opts?: { version?: string; loader?: string; versionId?: string; limit?: number }
  ) {
    return this.scraper('mcmods-dl', { slug, ...opts })
  }

  // ─────────── Buscadores ───────────

  /** 🔎 Busca videos en YouTube */
  async youtubeSearch(query: string, maxResults?: number) {
    return this.scraper('ytsearch', { query, maxResults: maxResults || undefined })
  }

  /** 🔎 Busca canciones en Spotify */
  async spotifySearch(query: string, limit?: number) {
    return this.scraper('spotify-search', { query, limit: limit || undefined })
  }

  /** 🔎 Busca videos en TikTok con links de descarga HD */
  async tiktokSearch(query: string, count?: number) {
    return this.scraper('tiktoksearch', { query, count: count || undefined })
  }

  /** 🔎 Busca posts y videos públicos de Facebook */
  async facebookSearch(query: string, limit?: number) {
    return this.scraper('facebook-search', { query, limit: limit || undefined })
  }

  /** 🔎 Busca imágenes en Pinterest */
  async pinterestSearch(query: string, limit?: number) {
    return this.scraper('pinterestSearch', { query, limit: limit || undefined })
  }

  /** 🔎 Busca letras de canciones en Lyrics.com */
  async lyricsSearch(query: string) {
    return this.scraper('lyrics-search', { query })
  }

  /** 🔎 Busca mods de Minecraft Java en Modrinth */
  async mcmodsSearch(
    q: string,
    opts?: { version?: string; loader?: string; limit?: number; index?: number; sort?: string }
  ) {
    return this.scraper('mcmods-search', { q, ...opts })
  }

  // ─────────── Scrapers ───────────

  /** 🔍 Información de un canal de YouTube (stalker) */
  async stalkYt(username: string) {
    return this.scraper('stalkyt', { username })
  }

  /** 🔍 Información de un perfil de TikTok */
  async tiktokStalk(username: string) {
    return this.scraper('tiktokstalk', { username })
  }

  /** 🔍 Nombre, descripción e imagen de un canal de WhatsApp */
  async waChannel(url: string) {
    return this.scraper('wachannel', { url })
  }

  /** 🔍 Traduce texto a cualquier idioma */
  async traductor(texto: string, idioma: string) {
    return this.scraper('traductor', { texto, idioma })
  }

  /** 🔍 Clima actual de una ciudad */
  async clima(ciudad: string) {
    return this.scraper('clima', { ciudad })
  }

  /** 🔍 Geolocalización de una dirección IP */
  async ipLocation(ip: string) {
    return this.scraper('iplocation', { ip })
  }

  /** 🔍 Información detallada de un dominio: DNS, IP, MX, NS, SSL y geo */
  async domainInfo(dominio: string) {
    return this.scraper('domaininfo', { dominio })
  }

  // ─────────── Fun ───────────

  /** 🎮 Genera un cartel de recompensa estilo bucanero */
  async bounty(imagen: string, texto: string) {
    return this.scraper('bounty', { imagen, texto })
  }

  /** 🎮 Genera una imagen tipo BRAT (fondo blanco, texto negro) */
  async brat(text: string) {
    return this.scraper('brat', { text })
  }

  /** 🎮 Genera un video tipo BRAT con animación por palabras */
  async bratVideo(text: string) {
    return this.scraper('brat-video', { text })
  }

  /** 🎮 Genera una imagen con marco redondeado sobre plantilla decorativa */
  async fakeIqc(media: string) {
    return this.scraper('fakeiqc', { media })
  }

  /** 🎮 Genera una imagen tipo nota/fake de WhatsApp */
  async fakeNote(texto: string, avatar: string, nombre: string) {
    return this.scraper('fakenote', { texto, avatar, nombre })
  }

  /** 🎮 Genera una imagen tipo publicación de Instagram/Facebook */
  async fakePost(avatar: string, usuario: string, media: string) {
    return this.scraper('fakepost', { avatar, usuario, media })
  }

  // ─────────── Imagen ───────────

  /** 🖼️ Mejora (upscale) imágenes a 4x con IA */
  async upscale(url: string) {
    return this.scraper('upscale', { url })
  }

  // ═══════════════════════════════════════════
  //  UTILIDADES
  // ═══════════════════════════════════════════

  /** Lista todos los scrapers disponibles */
  async listScrapers(): Promise<ScraperList> {
    await this.ensureAuth()
    const res = await this.client.get('/scrapers')
    return res.data as ScraperList
  }

  /** Obtiene info de un scraper específico */
  async getScraperInfo(name: string) {
    await this.ensureAuth()
    const res = await this.client.get(`/scrapers/${name}`)
    return res.data
  }

  /** Obtiene estadísticas de uso de la API */
  async getUsage(days: number = 30): Promise<UsageStats> {
    await this.ensureAuth()
    const res = await this.client.get('/scrapers/usage', {
      params: { days },
    })
    return res.data as UsageStats
  }

  /** Verifica que el servidor esté vivo y la API key sea válida */
  async ping(): Promise<{ ok: boolean; latency: number }> {
    await this.ensureAuth()
    const start = Date.now()
    await this.client.get('/health')
    return { ok: true, latency: Date.now() - start }
  }

  /** Obtiene información de versión del servidor */
  async version(): Promise<{
    version: string
    buildTime: string
    uptime: number
  }> {
    await this.ensureAuth()
    const res = await this.client.get('/version')
    return res.data
  }

  // ═══════════════════════════════════════════
  //  DIRECT FILE DOWNLOAD (proxy anti-CORS)
  // ═══════════════════════════════════════════

  /**
   * Descarga un archivo desde una URL externa usando el proxy de OptiShield.
   * El servidor se encarga de hacer el fetch para evitar problemas de CORS
   * y devuelve el archivo como Buffer.
   *
   * @param url - URL pública del archivo a descargar
   * @param opts - Opciones de descarga (filename opcional, timeout, headers)
   * @returns Buffer + metadata del archivo
   *
   * @example
   * ```ts
   * // Descargar archivo desde URL externa
   * const file = await api.downloadFile('https://ejemplo.com/video.mp4')
   * fs.writeFileSync('video.mp4', file.buffer)
   * console.log('Descargado:', file.filename, `(${file.size} bytes)`)
   *
   * // Con nombre personalizado
   * const file = await api.downloadFile('https://ejemplo.com/v.mp4', {
   *   filename: 'mi-video.mp4',
   *   timeout: 120_000
   * })
   * ```
   */
  async downloadFile(
    url: string,
    opts?: DownloadOptions
  ): Promise<DownloadResult> {
    await this.ensureAuth()
    const timeout = opts?.timeout ?? 60_000

    const res = await this.client.get('/download', {
      params: { url, filename: opts?.filename || undefined },
      responseType: 'arraybuffer',
      timeout,
      validateStatus: (status) => status < 400,
    })

    const buffer = Buffer.from(res.data)
    const contentType =
      String(res.headers['content-type'] || 'application/octet-stream')

    // Intentar extraer filename del header Content-Disposition
    let filename = opts?.filename || 'download'
    const disposition = String(res.headers['content-disposition'] || '')
    if (disposition) {
      const match = disposition.match(/filename="?([^\";]+)\"?/)
      if (match) filename = match[1]
    }

    // Inferir extensión de la URL si no hay filename
    if (!opts?.filename) {
      try {
        const urlExt = new URL(url).pathname.split('.').pop()
        if (urlExt && urlExt.length < 10) filename += `.${urlExt}`
      } catch {}
    }

    return {
      buffer,
      contentType,
      filename,
      size: buffer.length,
    }
  }

  /**
   * Descarga un archivo y lo guarda directamente en el disco local.
   * Crea el directorio si no existe.
   *
   * @param url - URL pública del archivo a descargar
   * @param outputPath - Ruta donde guardar el archivo (ej: './downloads/video.mp4')
   * @param opts - Opciones de descarga
   * @returns Ruta completa del archivo guardado
   *
   * @example
   * ```ts
   * const savedPath = await api.downloadToDisk(
   *   'https://ejemplo.com/video.mp4',
   *   './downloads/mi-video.mp4'
   * )
   * console.log('Guardado en:', savedPath)
   * ```
   */
  async downloadToDisk(
    url: string,
    outputPath: string,
    opts?: DownloadOptions
  ): Promise<string> {
    const result = await this.downloadFile(url, opts)

    // Crear directorio si no existe
    const dir = path.dirname(outputPath)
    fs.mkdirSync(dir, { recursive: true })

    fs.writeFileSync(outputPath, result.buffer)
    return path.resolve(outputPath)
  }

  /**
   * Descarga un archivo subido previamente a OptiShield (usando su URL /upload/:id).
   * Si el archivo expiró según el cache local, lanza un error.
   *
   * @param uploadUrl - URL completa del upload (ej: 'https://optishield.uk/upload/abc123...')
   * @returns Buffer + metadata del archivo
   *
   * @example
   * ```ts
   * const file = await api.downloadUpload('https://optishield.uk/upload/abc123...')
   * fs.writeFileSync('archivo.pdf', file.buffer)
   * ```
   */
  async downloadUpload(uploadUrl: string): Promise<DownloadResult> {
    await this.ensureAuth()
    // Verificar expiración local
    const fileUrl = await this.getUploadUrl(uploadUrl)
    if (!fileUrl) {
      throw new Error(
        `El archivo ha expirado o no se encuentra: ${uploadUrl}`
      )
    }

    let res
    try {
      res = await this.client.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 120_000,
        validateStatus: (status) => status < 400,
      })
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new Error(
          `El archivo no está disponible o ha expirado: ${uploadUrl}`
        )
      }
      throw new Error(`Error al descargar archivo: ${err.message}`)
    }

    const buffer = Buffer.from(res.data)
    const contentType = String(
      res.headers['content-type'] || 'application/octet-stream'
    )

    // Extraer filename del header Content-Disposition
    let filename = 'download'
    const disposition = String(res.headers['content-disposition'] || '')
    if (disposition) {
      const match = disposition.match(/filename="?([^\";]+)\"?/)
      if (match) filename = match[1]
    }

    return {
      buffer,
      contentType,
      filename,
      size: buffer.length,
    }
  }

  // ═══════════════════════════════════════════
  //  SHORT URL
  // ═══════════════════════════════════════════

  /**
   * Acorta una URL usando el servicio de OptiShield (https://optishield.uk/r/:code).
   *
   * @param url - URL larga a acortar
   * @returns Información de la URL acortada
   *
   * @example
   * ```ts
   * const short = await api.shortenUrl('https://ejemplo.com/articulo-muy-largo')
   * console.log('URL corta:', short.shortUrl) // https://optishield.uk/r/aB3xK9
   * ```
   */
  async shortenUrl(url: string): Promise<{
    code: string
    shortUrl: string
    originalUrl: string
    visits: number
  }> {
    await this.ensureAuth()
    const res = await this.client.post('/shorturl', { url })
    const data = res.data as any
    const baseHost = this.baseUrl.replace('/api', '') || 'https://optishield.uk'
    return {
      code: data.code || '',
      shortUrl: data.shortUrl || data.url || `${baseHost}/r/${data.code}`,
      originalUrl: data.originalUrl || data.original || '',
      visits: data.visits || 0,
    }
  }

  /**
   * Elimina las credenciales guardadas en disco (alias de logout).
   */
  clearCredentials(): void {
    this.logout()
  }

  // ═══════════════════════════════════════════
  //  MESSAGE DASHBOARD & RECOVERY METRICS
  // ═══════════════════════════════════════════

  /**
   * Obtiene el dashboard de mensajes para un bot específico.
   * Incluye estado de recuperación, métricas, y mensajes recientes.
   *
   * @param botId - ID del bot
   * @returns Dashboard completo con métricas de recuperación
   *
   * @example
   * ```ts
   * const dashboard = await api.getMessageDashboard('bot-id-123')
   * console.log('Recovery success rate:', dashboard.recoveryMetrics.successRate + '%')
   * console.log('Avg processing time:', dashboard.recoveryMetrics.avgProcessingTimeMs + 'ms')
   * ```
   */
  async getMessageDashboard(botId: string): Promise<MessageDashboard> {
    await this.ensureAuth()
    const res = await this.client.get(`/bots/${botId}/message-dashboard`)
    return res.data as MessageDashboard
  }

  /**
   * Obtiene el dashboard de mensajes para TODOS los bots del usuario.
   *
   * @returns Lista de dashboards con métricas de cada bot
   *
   * @example
   * ```ts
   * const allDashboards = await api.getAllMessageDashboards()
   * for (const dashboard of allDashboards.bots) {
   *   console.log(`${dashboard.bot.name}: ${dashboard.recoveryMetrics.successRate}% success`)
   * }
   * ```
   */
  async getAllMessageDashboards(): Promise<AllMessageDashboards> {
    await this.ensureAuth()
    const res = await this.client.get('/bots/message-dashboard/all')
    return res.data as AllMessageDashboards
  }

  /**
   * Resetea el tracking de mensajes para un bot.
   * Útil para debugging o después de una actualización.
   *
   * @param botId - ID del bot
   * @returns Confirmación del reset
   */
  async resetMessageTracking(botId: string): Promise<{ success: boolean; message: string }> {
    await this.ensureAuth()
    const res = await this.client.post(`/bots/${botId}/reset-message-tracking`)
    return res.data as { success: boolean; message: string }
  }

  /**
   * Obtiene métricas de recuperación para un bot específico.
   *
   * @param botId - ID del bot
   * @returns Métricas de recuperación detalladas
   */
  async getRecoveryMetrics(botId: string): Promise<RecoveryMetricsData> {
    const dashboard = await this.getMessageDashboard(botId)
    return dashboard.recoveryMetrics
  }
}

// ═══════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
