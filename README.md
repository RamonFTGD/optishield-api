# OptiShield API

> Cliente oficial para la [API de OptiShield](https://optishield.uk/).
> 
> **32 scrapers disponibles** — Descarga videos/audio de YouTube, TikTok, Instagram, Facebook, Spotify, SoundCloud, Bandcamp, Apple Music, Reddit, Pinterest, Twitter/X y más. Incluye sistema de workers con polling, subida de archivos con expiración y proxy de descargas anti-CORS.

---

## 📦 Instalación

```bash
# Desde GitHub (recomendado)
npm install github:RamonFTGD/optishield-api#BotWhatsapp-MD

# O descarga el tarball directo
# https://optishield.uk/module/optishield-api-1.0.0.tgz

# O agrégalo a tu package.json:
# "dependencies": {
#   "optishield-api": "github:RamonFTGD/optishield-api#BotWhatsapp-MD"
# }
```

---

## 🚀 Inicio rápido

### 🔐 Auto-login (recomendado — sin API key manual)

```ts
import { OptiShieldClient } from 'optishield-api'

const api = new OptiShieldClient()
// ⚡ Sin credenciales → la primera llamada genera una URL automáticamente

const result = await api.youtubeSearch('música relajante')
// ↑ Muestra URL, la abres en tu navegador, autorizas, ¡y listo!
// Las credenciales se guardan en ~/.optishield/credentials.json

console.log('🎵 Resultados:', result.result?.data?.length)
```

**Respuesta real:**
```json
{
  "scraper": "youtube-search",
  "result": {
    "success": true,
    "data": [
      {
        "id": "ocCZPaskASo",
        "title": "Musica para trabajar activo y alegre - Deep House Mix 2026 #95",
        "url": "https://youtube.com/watch?v=ocCZPaskASo",
        "duration": 13317,
        "durationFormatted": "3:41:57",
        "channel": "Deep Inovation",
        "thumbnail": "https://i.ytimg.com/vi/ocCZPaskASo/hqdefault.jpg",
        "views": 3531,
        "viewsFormatted": "3.5K"
      }
    ],
    "query": "música relajante",
    "total": 9
  },
  "usage": { "used": 910, "max": 100000, "remaining": 99090 },
  "timestamp": "2026-07-27T20:20:56.575Z"
}
```

### 🔑 O con API Key directa

```ts
import { OptiShieldClient } from 'optishield-api'

const api = new OptiShieldClient({
  apiKey: 'osk_tu-api-key' // Obténla en https://optishield.uk/api-keys
})

const video = await api.youtube('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'mp4')
console.log('Título:', video.result?.title)
```

---

## 📋 APIs disponibles (32 scrapers)

### 🎵 Descargadores

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `youtubedl` | `api.youtube(url, format?)` | YouTube DL — Videos + Shorts. `video=1` → MP4 480p, `video=0` → MP3 |
| `tiktokdl` | `api.tiktok(url)` | Descarga videos o carruseles de TikTok sin marca de agua |
| `spotifydl` | `api.spotifyDownload(url)` | Descarga audio de Spotify con portada y letras incrustadas |
| `soundcloud-dl` | `api.executeScraper('soundcloud-dl', { url })` | Descarga canciones de SoundCloud con metadatos ID3 |
| `bandcamp-dl` | `api.executeScraper('bandcamp-dl', { url })` | Descarga canciones gratuitas de Bandcamp |
| `apple-music-dl` | `api.executeScraper('apple-music-dl', { url })` | Preview 30s de Apple Music |
| `instagram-search` → `instashadow` | `api.instagram(url)` | Descarga reels, posts, stories y perfiles de Instagram |
| `facebookdl` | `api.facebook(url)` | Descarga videos/audio de Facebook hasta 720p |
| `twitterdl` | `api.executeScraper('twitterdl', { url })` | Descarga videos, GIFs e imágenes de tweets |
| `redditdl` | `api.executeScraper('redditdl', { url })` | Descarga videos, GIFs e imágenes de Reddit |
| `pinterestdl` | `api.executeScraper('pinterestdl', { url })` | Descarga imágenes o videos de Pinterest |
| `mediafiredl` | `api.executeScraper('mediafiredl', { url })` | Obtiene enlace de descarga de MediaFire |

### 🔍 Buscadores

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `youtube-search` | `api.youtubeSearch(query)` | Busca videos en YouTube (rápido, HTML, sin yt-dlp) |
| `ytsearch` | `api.executeScraper('ytsearch', { query })` | Busca videos en YouTube por palabra clave |
| `tiktoksearch` | `api.executeScraper('tiktoksearch', { query })` | Busca videos en TikTok con links HD |
| `spotifySearch` | `api.spotifySearch(query)` | Busca tracks en Spotify |
| `soundcloud-search` | `api.executeScraper('soundcloud-search', { query })` | Busca canciones en SoundCloud v2 API |
| `bandcamp-search` | `api.executeScraper('bandcamp-search', { q })` | Busca música en Bandcamp |
| `apple-music-search` | `api.executeScraper('apple-music-search', { query })` | Busca en Apple Music vía iTunes API |
| `reddit-search` | `api.executeScraper('reddit-search', { q })` | Busca posts en Reddit por subreddit o query |
| `facebook-search` | `api.executeScraper('facebook-search', { query })` | Busca posts públicos de Facebook vía Google |
| `pinterestSearch` | `api.executeScraper('pinterestSearch', { query })` | Búsqueda de imágenes en Pinterest |

### 🛠️ Herramientas & Scrapers

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `iplocation` | `api.executeScraperSync('iplocation', { ip })` | Geolocalización de IP (país, región, ISP, ASN) |
| `domaininfo` | `api.executeScraper('domaininfo', { dominio })` | DNS, IP, MX, NS, SSL y geo de un dominio |
| `heckai` | `api.executeScraper('heckai', { prompt })` | Chat con IA (GPT-5.4-mini), sesiones conversacionales |

### 🎨 Fun & Imágenes

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `brat` | `api.executeScraper('brat', { text })` | Genera imagen BRAT (texto negro sobre blanco) |
| `brat-video` | `api.executeScraper('brat-video', { text })` | Video animado tipo BRAT |
| `bounty` | `api.executeScraper('bounty', { imagen, texto })` | Cartel de recompensa estilo bucanero |
| `fakeiqc` | `api.executeScraper('fakeiqc', { media })` | Imagen con marco redondeado decorativo |
| `fakenote` | `api.executeScraper('fakenote', { texto, avatar, nombre })` | Nota/fake de WhatsApp |
| `fakepost` | `api.executeScraper('fakepost', { avatar, usuario, media })` | Post falso de Instagram/Facebook |

---

## ⚡ Ejemplos con respuestas reales

### YouTube Search

```ts
const result = await api.youtubeSearch('música')
console.log(JSON.stringify(result, null, 2))
```

<details>
<summary>📖 Respuesta real</summary>

```json
{
  "scraper": "youtube-search",
  "result": {
    "success": true,
    "data": [
      {
        "id": "ocCZPaskASo",
        "title": "Musica para trabajar activo y alegre - Deep House Mix 2026 #95",
        "url": "https://youtube.com/watch?v=ocCZPaskASo",
        "duration": 13317,
        "durationFormatted": "3:41:57",
        "channel": "Deep Inovation",
        "thumbnail": "https://i.ytimg.com/vi/ocCZPaskASo/hqdefault.jpg",
        "views": 3531,
        "viewsFormatted": "3.5K"
      }
    ],
    "query": "música",
    "total": 10
  },
  "usage": { "used": 911, "max": 100000, "remaining": 99089 },
  "timestamp": "2026-07-27T20:23:47.187Z"
}
```
</details>

### IP Location

```ts
const result = await api.executeScraperSync('iplocation', { ip: '8.8.8.8' })
console.log(JSON.stringify(result, null, 2))
```

<details>
<summary>📖 Respuesta real</summary>

```json
{
  "scraper": "iplocation",
  "result": {
    "success": true,
    "ip": "8.8.8.8",
    "hostname": null,
    "ubicacion": {
      "pais": "United States",
      "codigo_pais": "US",
      "region": "California",
      "ciudad": "Mountain View",
      "coordenadas": { "latitud": "37.4220", "longitud": "-122.0850" }
    },
    "red": {
      "isp": "Google LLC",
      "asn": "AS15169",
      "red": "AS15169 Google LLC (VPN, CDN, VPSH, ICRIT, ANYCAST, CONTENT)",
      "tipo_uso": "Corporate / Hosting"
    },
    "hora": {
      "zona_horaria": "America/Los_Angeles (PDT)",
      "hora_local": "Mon, 27 Jul 2026 13:23:51 -0700"
    }
  },
  "usage": { "used": 912, "max": 100000, "remaining": 99088 },
  "timestamp": "2026-07-27T20:23:51.460Z"
}
```
</details>

### Ping & Health

```ts
const pong = await api.ping()
console.log(pong)
// { "ok": true, "latency": 130 }
```

### Versión del servidor

```ts
const v = await api.version()
console.log(v)
// { "version": "1.0.0", "buildTime": "2026-07-27T19:51:00.596Z", "uptime": 1968.9 }
```

### Estadísticas de uso

```ts
const usage = await api.getUsage(7)
console.log(`Total: ${usage.totalCalls} llamadas en ${usage.periodDays} días`)
usage.byScraper.forEach(s => console.log(`  • ${s.scraper}: ${s.calls}`))
```

<details>
<summary>📖 Respuesta real</summary>

```json
{
  "periodDays": 7,
  "totalCalls": 613,
  "byScraper": [
    { "scraper": "youtubedl", "calls": 274 },
    { "scraper": "ytsearch", "calls": 218 },
    { "scraper": "tiktokdl", "calls": 33 },
    { "scraper": "youtube-search", "calls": 31 },
    { "scraper": "tiktoksearch", "calls": 13 },
    { "scraper": "iplocation", "calls": 9 }
  ]
}
```
</details>

### Listar todos los scrapers

```ts
const scrapers = await api.listScrapers()
console.log(`📦 ${scrapers.total} scrapers disponibles`)
scrapers.scrapers.forEach(s => console.log(`  • ${s.name}: ${s.description || 'Sin descripción'}`))
```

---

## 📤 Subida de archivos

Sube archivos al cluster con expiración automática:

```ts
import fs from 'fs'

const buffer = fs.readFileSync('./documento.pdf')

// Subir (expira en 3 días por defecto)
const upload = await api.uploadFile(buffer, 'documento.pdf', 'application/pdf')
console.log('URL:', upload.url)
console.log('Expira:', upload.expiresAt)

// Subir con expiración personalizada (7 días)
const upload7d = await api.uploadFile(buffer, 'video.mp4', 'video/mp4', {
  expiresInDays: 7
})

// Descargar archivo subido
const downloaded = await api.downloadUpload(upload.url)
```

---

## 💾 Descarga directa (proxy anti-CORS)

```ts
import fs from 'fs'

// Descargar como Buffer
const file = await api.downloadFile('https://ejemplo.com/video.mp4')
fs.writeFileSync('video.mp4', file.buffer)
console.log(`Guardado: ${file.filename} (${file.size} bytes)`)

// Guardar directamente en disco
await api.downloadToDisk('https://ejemplo.com/imagen.jpg', './descargas/foto.jpg')
```

---

## 🔗 Acortar URLs

```ts
const short = await api.shortenUrl('https://ejemplo.com/articulo-muy-largo')
console.log('URL corta:', short.shortUrl)  // https://optishield.uk/r/aB3xK9
console.log('Código:', short.code)
```

---

## 🤖 Scrapers personalizados

```ts
// Worker + polling (para procesos largos)
const result = await api.executeScraper('tiktok', {
  url: 'https://vt.tiktok.com/ZSX...'
}, {
  maxRetries: 30,  // 30 intentos
  interval: 3000    // cada 3 segundos
})

// Scraper síncrono (rápido)
const ipInfo = await api.executeScraperSync('iplocation', { ip: '8.8.8.8' })
```

---

## 📚 Referencia completa de métodos

| Método | Descripción |
|--------|-------------|
| `youtube(url, format?)` | Descarga video/audio de YouTube (mp4/mp3) |
| `youtubeSearch(query)` | Busca videos en YouTube |
| `tiktok(url)` | Descarga video de TikTok sin marca de agua |
| `spotifySearch(query)` | Busca canciones en Spotify |
| `spotifyDownload(url)` | Descarga canción de Spotify |
| `instagram(url)` | Descarga contenido de Instagram |
| `facebook(url)` | Descarga video de Facebook |
| `executeScraper(name, params, pollOpts?)` | Ejecuta scraper con worker + polling |
| `executeScraperSync(name, params)` | Ejecuta scraper síncrono |
| `uploadFile(buffer, name, mime, opts?)` | Sube archivo con expiración configurable |
| `downloadUpload(uploadUrl)` | Descarga archivo subido previamente |
| `downloadFile(url, opts?)` | Descarga archivo desde URL externa (proxy anti-CORS) |
| `downloadToDisk(url, outputPath, opts?)` | Descarga y guarda directamente en disco |
| `shortenUrl(url)` | Acorta URLs |
| `listScrapers()` | Lista scrapers disponibles |
| `getScraperInfo(name)` | Información detallada de un scraper |
| `getUsage(days?)` | Estadísticas de uso de la API |
| `ping()` | Verifica conexión con el servidor |
| `version()` | Información de versión del servidor |
| `login(pollInterval?, timeout?)` | Inicia sesión por dispositivo (recomendado) |
| `logout()` | Cierra sesión y elimina credenciales guardadas |
| `isLoggedIn()` | Verifica si hay sesión activa |

---

## ⚠️ Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Se requiere apiKey` | No proporcionaste apiKey ni hiciste login | Usa `api.login()` o pasa apiKey en el constructor |
| `NO_ACTIVE_PLAN` | API key sin permisos o plan inactivo | Verifica tu plan en https://optishield.uk/store |
| `Archivo muy grande` | Archivo excede 100MB | Comprime o divide el archivo |
| `Límite de solicitudes` | Alcanzaste tu cuota mensual | Mejora tu plan o espera al próximo mes |
| `Timeout: worker no completó` | El scraper tomó demasiado tiempo | Aumenta `maxRetries` o `interval` en executeScraper |
| `El archivo ha expirado` | El upload alcanzó su fecha de expiración | Vuelve a subir el archivo |
| `Código expirado` | El código de autenticación por dispositivo expiró | Vuelve a ejecutar `api.login()` |

---

## 📦 TypeScript

El módulo incluye tipos completos:

```ts
import {
  OptiShieldClient,
  OptiShieldOptions,
  UploadResult,
  DownloadResult,
  WorkerResponse,
  ScraperResult,
  ScraperList,
  UsageStats
} from 'optishield-api'

const opts: OptiShieldOptions = { apiKey: '...' }
const api = new OptiShieldClient(opts)
```

---

## 📋 Requisitos

- Node.js >= 18
- API key de OptiShield o cuenta en https://optishield.uk/
- Plan activo (Pro o superior para descargas)

---

## 📄 Licencia

MIT © OptiShield — [https://optishield.uk/](https://optishield.uk/)
