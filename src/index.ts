/**
 * optishield-api — Cliente oficial para la API de OptiShield
 *
 * @see https://optishield.uk/
 * @author OptiShield
 * @license MIT
 */

import { OptiShieldClient } from './client.js'
import type { OptiShieldOptions } from './types.js'

export { OptiShieldClient } from './client.js'
export { SCRAPERS, findScraper, toAlias } from './scrapers.js'
export type { ScraperDef } from './scrapers.js'
export type {
  OptiShieldOptions,
  UploadOptions,
  UploadResult,
  WorkerResponse,
  ScraperResult,
  ScraperList,
  UsageStats,
  YouTubeParams,
  SearchParams,
  DownloadOptions,
  DownloadResult,
  ShortUrlResult,
  DeviceAuthResponse,
  DeviceAuthPollResponse,
  DeviceCredentials,
  AIChatResult,
  MediaResult,
  UniversalApiResult,
} from './types.js'

/**
 * Crea un cliente de OptiShield con configuración propia.
 *
 * @example
 * ```ts
 * import { createClient } from 'optishield-api'
 *
 * const api = createClient({ apiKey: 'osk_...' })
 * const res = await api.api('brat', { text: 'Hola' })
 * ```
 */
export function createClient(opts: OptiShieldOptions = {}): OptiShieldClient {
  return new OptiShieldClient(opts)
}

/**
 * Cliente singleton listo para usar ("cli").
 *
 * No pide credenciales al importar: la primera llamada inicia el auto-login
 * por dispositivo si no hay una API key guardada en `~/.optishield/credentials.json`.
 *
 * @example
 * ```ts
 * import cli from 'optishield-api'
 *
 * const res = await cli.api('brat', { text: 'Hola' })
 * console.log(res.success, res.data)
 * ```
 */
export const cli: OptiShieldClient = createClient({ silent: true })

export default cli