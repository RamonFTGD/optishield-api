/**
 * Catálogo de scrapers disponibles en la API de OptiShield.
 *
 * Se actualiza automáticamente con `listScrapers()` (la fuente de verdad es el servidor),
 * pero este catálogo estático sirve para:
 *   - Generar helpers tipados y auto-completado en el editor.
 *   - Conocer qué parámetros acepta cada scraper sin hacer una llamada a la red.
 *   - El método universal `api.scraper(name, params)`.
 */

export interface ScraperDef {
  /** Nombre exacto del scraper en el servidor */
  name: string
  /** Nombre amigable en camelCase para helpers */
  alias: string
  /** Parámetros requeridos (los `apikey` ya se inyectan desde el header X-API-Key) */
  params: string[]
  /** Parámetros opcionales */
  optional?: string[]
  group: string
  description: string
}

export const SCRAPERS: ScraperDef[] = [
  // ══════════ 🎮 FUN ══════════
  { name: 'bounty', alias: 'bounty', params: ['imagen', 'texto'], group: 'Fun', description: 'Genera un cartel de recompensa (bounty) estilo bucanero con imagen y texto' },
  { name: 'brat', alias: 'brat', params: ['text'], group: 'Fun', description: 'Genera una imagen tipo BRAT (fondo blanco con texto negro legible)' },
  { name: 'brat-video', alias: 'bratVideo', params: ['text'], group: 'Fun', description: 'Genera un video tipo BRAT con animación por palabras' },
  { name: 'fakeiqc', alias: 'fakeIqc', params: ['media'], group: 'Fun', description: 'Genera una imagen con marco redondeado sobre una plantilla decorativa' },
  { name: 'fakenote', alias: 'fakeNote', params: ['texto', 'avatar', 'nombre'], group: 'Fun', description: 'Genera una imagen tipo nota/fake de WhatsApp' },
  { name: 'fakepost', alias: 'fakePost', params: ['avatar', 'usuario', 'media'], group: 'Fun', description: 'Genera una imagen tipo publicación de Instagram/Facebook' },

  // ══════════ 🔍 SCRAPERS ══════════
  { name: 'clima', alias: 'clima', params: ['ciudad'], group: 'Scrapers', description: 'Obtiene el clima actual de una ciudad (wttr.in)' },
  { name: 'domaininfo', alias: 'domainInfo', params: ['dominio'], group: 'Scrapers', description: 'Información detallada de un dominio: DNS, IP, MX, NS, SSL y geo' },
  { name: 'iplocation', alias: 'ipLocation', params: ['ip'], group: 'Scrapers', description: 'Geolocalización de una dirección IP' },
  { name: 'stalkyt', alias: 'stalkYt', params: ['username'], optional: ['apikey'], group: 'Scrapers', description: 'Información de un canal de YouTube (stalker)' },
  { name: 'tiktokstalk', alias: 'tiktokStalk', params: ['username'], optional: ['apikey'], group: 'Scrapers', description: 'Información de un perfil de TikTok' },
  { name: 'traductor', alias: 'traductor', params: ['texto', 'idioma'], group: 'Scrapers', description: 'Traduce texto a cualquier idioma (Google Translate)' },
  { name: 'wachannel', alias: 'waChannel', params: ['url'], optional: ['apikey'], group: 'Scrapers', description: 'Nombre, descripción e imagen de un canal de WhatsApp' },

  // ══════════ 🔎 BUSCADORES ══════════
  { name: 'facebook-search', alias: 'facebookSearch', params: ['query'], optional: ['apikey', 'limit'], group: 'Buscadores', description: 'Busca posts y videos públicos de Facebook' },
  { name: 'lyrics-search', alias: 'lyricsSearch', params: ['query'], optional: ['apikey'], group: 'Buscadores', description: 'Busca letras de canciones en Lyrics.com' },
  { name: 'pinterestSearch', alias: 'pinterestSearch', params: ['query'], optional: ['apikey', 'limit'], group: 'Buscadores', description: 'Búsqueda de imágenes en Pinterest' },
  { name: 'spotify-search', alias: 'spotifySearch', params: ['query'], optional: ['apikey', 'limit'], group: 'Buscadores', description: 'Busca canciones en Spotify por nombre o artista' },
  { name: 'tiktoksearch', alias: 'tiktokSearch', params: ['query'], optional: ['apikey', 'count'], group: 'Buscadores', description: 'Busca videos en TikTok y obtiene links de descarga en HD' },
  { name: 'ytsearch', alias: 'ytSearch', params: ['query'], optional: ['maxResults'], group: 'Buscadores', description: 'Busca videos en YouTube por palabra clave' },

  // ══════════ ⬇️ DESGARGADORES ══════════
  { name: 'facebookdl', alias: 'facebookDownload', params: ['url'], optional: ['format'], group: 'Descargadores', description: 'Descarga video o audio de Facebook (yt-dlp)' },
  { name: 'igdl', alias: 'instagramDownload', params: ['url'], optional: ['apikey'], group: 'Descargadores', description: 'Descarga reels, posts y carruseles de Instagram' },
  { name: 'pinterestdl', alias: 'pinterestDownload', params: ['url'], optional: ['apikey'], group: 'Descargadores', description: 'Descarga imágenes o videos de Pinterest' },
  { name: 'spotifydl', alias: 'spotifyDownload', params: ['url'], optional: ['apikey'], group: 'Descargadores', description: 'Descarga audio de Spotify con portada y letras incrustadas' },
  { name: 'tiktokdl', alias: 'tiktokDownload', params: ['url'], optional: ['query', 'format'], group: 'Descargadores', description: 'Descarga videos o carruseles de TikTok sin marca de agua' },
  { name: 'youtubedl', alias: 'youtubeDownload', params: ['url'], optional: ['video', 'apikey'], group: 'Descargadores', description: 'YouTube DL — video=0 → MP3, video=1 → MP4 480p' },

  // ══════════ 🤖 IA ══════════
  { name: 'ia', alias: 'ia', params: ['prompt'], optional: ['sessionId'], group: 'IA', description: 'Chat con IA unificado (orquestador: nova-ai → heckai → gptanon → google-gemma)' },
  { name: 'nova-ai', alias: 'novaAI', params: ['prompt'], group: 'IA', description: 'Chat con Nova AI (Izuka API). Rápido y gratuito' },
  { name: 'heckai', alias: 'heckAI', params: ['prompt'], optional: ['sessionId'], group: 'IA', description: 'Chat con HeckAI (GPT-5.4-mini) con sesiones conversacionales' },
  { name: 'gptanon', alias: 'gptAnon', params: ['prompt'], optional: ['sessionId', 'model'], group: 'IA', description: 'Chat con GPTAnon (Google Gemma-3-27b) con sesiones y modelos' },
  { name: 'google-gemma', alias: 'googleGemma', params: ['prompt'], optional: ['sessionId'], group: 'IA', description: 'Chat con Google Gemma AI (IkyyXd) con sesiones' },
  { name: 'photoeditorai', alias: 'photoEditorAI', params: ['image', 'prompt'], optional: ['apikey'], group: 'IA', description: 'Edita fotos con IA siguiendo un prompt' },

  // ══════════ 🖼️ IMAGEN ══════════
  { name: 'upscale', alias: 'upscale', params: ['url'], optional: ['apikey'], group: 'Imagen', description: 'Mejora (upscale) imágenes a 4x con IA' },
  { name: 'ai-image', alias: 'aiImage', params: ['prompt'], optional: ['negative', 'width', 'height', 'steps', 'seed'], group: 'Imagen', description: 'Genera imágenes desde un texto con IA (SD-Turbo en PyTorch, PC Maestra)' },
]

/** Busca un scraper por nombre o alias */
export function findScraper(key: string): ScraperDef | undefined {
  return SCRAPERS.find(s => s.name === key || s.alias === key)
}

/** Convierte un nombre de scraper a alias camelCase */
export function toAlias(name: string): string {
  const found = findScraper(name)
  if (found) return found.alias
  return name
    .split(/[-_]/)
    .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join('')
}
