/**
 * optishield-api — Cliente oficial para la API de OptiShield
 *
 * @see https://optishield.uk/
 * @author OptiShield
 * @license MIT
 */

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
} from './types.js'
