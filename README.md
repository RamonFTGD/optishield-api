# OptiShield API

> Cliente oficial para la [API de OptiShield](https://optishield.uk/).
>
> **35 scrapers disponibles** — Descarga videos/audio de YouTube, TikTok, Instagram, Facebook, Spotify y Pinterest. Busca en YouTube, TikTok, Spotify, Facebook, Pinterest, Minecraft mods y letras de canciones. Herramientas: clima, IP, dominios, traductor, stalker. **5 motores de IA** (orquestador unificado + 4 proveedores individuales). Incluye workers con polling, subida de archivos con expiración, proxy de descargas anti-CORS y acortador de URLs.

---

## 📦 Instalación

```bash
# Desde GitHub (recomendado)
npm install github:RamonFTGD/optishield-api#BotWhatsapp-MD

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
// ↑ Muestra URL, la abres en tu navegador, autorizas (Discord, GitHub o Google), ¡y listo!
// Las credenciales se guardan en ~/.optishield/credentials.json

console.log('🎵 Resultados:', result.result?.data?.length)
```

### 🔑 O con API Key directa

```ts
import { OptiShieldClient } from 'optishield-api'

const api = new OptiShieldClient({
  apiKey: 'osk_tu-api-key' // Obténla en https://optishield.uk/api-keys
})

const video = await api.youtubeDownload('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'mp4')
console.log('Título:', video.result?.title)
```

### 🤖 Chat con IA (unificado + individuales)

```ts
// Orquestador: prueba nova-ai → heckai → gptanon → google-gemma en cascada
const chat = await api.ia('¿Cuál es la capital de Francia?')
console.log('🤖', chat.result.resultado, '· vía', chat.result.via)

// O elige el proveedor individual:
await api.novaAI('Hola')
await api.heckAI('Hola')
await api.gptAnon('Hola')
await api.googleGemma('Hola')

// Con sesión conversacional:
const s1 = await api.googleGemma('Me llamo Ramón')
const s2 = await api.googleGemma('¿Cómo me llamo?', s1.result.sessionId)
```

---

## 📋 APIs disponibles (35 scrapers)

### 🤖 IA

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `ia` | `api.ia(prompt, sessionId?)` | **Orquestador unificado**: prueba 4 proveedores en cascada empezando por el más rápido |
| `nova-ai` | `api.novaAI(prompt)` | Chat con Nova AI (Izuka API). Rápido y gratuito |
| `heckai` | `api.heckAI(prompt, sessionId?)` | Chat con HeckAI (GPT-5.4-mini), sesiones conversacionales |
| `gptanon` | `api.gptAnon(prompt, sessionId?, model?)` | Chat con GPTAnon (Google Gemma-3-27b), sesiones y modelos |
| `google-gemma` | `api.googleGemma(prompt, sessionId?)` | Chat con Google Gemma AI (IkyyXd), sesiones |
| `photoeditorai` | `api.photoEditorAI(image, prompt)` | Edita imágenes con IA siguiendo un prompt |

### ⬇️ Descargadores

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `youtubedl` | `api.youtubeDownload(url, video?)` | YouTube DL — `video=1` → MP4 480p, `video=0` → MP3 |
| `tiktokdl` | `api.tiktokDownload(url, opts?)` | Descarga videos o carruseles de TikTok sin marca de agua |
| `igdl` | `api.instagramDownload(url)` | Descarga reels, posts y carruseles de Instagram |
| `facebookdl` | `api.facebookDownload(url, format?)` | Descarga video o audio de Facebook (yt-dlp) |
| `spotifydl` | `api.spotifyDownload(url)` | Descarga audio de Spotify con portada y letras incrustadas |
| `pinterestdl` | `api.pinterestDownload(url)` | Descarga imágenes o videos de Pinterest |
| `mcmods-dl` | `api.mcmodsDownload(slug, opts?)` | Link directo de descarga de un mod de Minecraft (Modrinth) |

### 🔎 Buscadores

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `ytsearch` | `api.youtubeSearch(query, maxResults?)` | Busca videos en YouTube por palabra clave |
| `tiktoksearch` | `api.tiktokSearch(query, count?)` | Busca videos en TikTok con links de descarga HD |
| `spotify-search` | `api.spotifySearch(query, limit?)` | Busca canciones en Spotify |
| `facebook-search` | `api.facebookSearch(query, limit?)` | Busca posts y videos públicos de Facebook |
| `pinterestSearch` | `api.pinterestSearch(query, limit?)` | Búsqueda de imágenes en Pinterest |
| `lyrics-search` | `api.lyricsSearch(query)` | Busca letras de canciones en Lyrics.com |
| `mcmods-search` | `api.mcmodsSearch(q, opts?)` | Busca mods de Minecraft Java en Modrinth |

### 🔍 Scrapers & Herramientas

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `clima` | `api.clima(ciudad)` | Clima actual de una ciudad (wttr.in) |
| `iplocation` | `api.ipLocation(ip)` | Geolocalización de una dirección IP |
| `domaininfo` | `api.domainInfo(dominio)` | DNS, IP, MX, NS, SSL y geo de un dominio |
| `traductor` | `api.traductor(texto, idioma)` | Traduce texto a cualquier idioma |
| `stalkyt` | `api.stalkYt(username)` | Información de un canal de YouTube |
| `tiktokstalk` | `api.tiktokStalk(username)` | Información de un perfil de TikTok |
| `wachannel` | `api.waChannel(url)` | Nombre, descripción e imagen de un canal de WhatsApp |

### 🎨 Fun

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `brat` | `api.brat(text)` | Genera imagen BRAT (texto negro sobre blanco) |
| `brat-video` | `api.bratVideo(text)` | Video animado tipo BRAT |
| `bounty` | `api.bounty(imagen, texto)` | Cartel de recompensa estilo bucanero |
| `fakeiqc` | `api.fakeIqc(media)` | Imagen con marco redondeado decorativo |
| `fakenote` | `api.fakeNote(texto, avatar, nombre)` | Nota/fake de WhatsApp |
| `fakepost` | `api.fakePost(avatar, usuario, media)` | Post falso de Instagram/Facebook |

### 🖼️ Imagen

| Scraper | Método del módulo | Descripción |
|---------|-------------------|-------------|
| `upscale` | `api.upscale(url)` | Mejora imágenes a 4x con IA |
| `ai-image` | `api.aiImage(prompt, opts?)` | Genera imágenes desde texto con IA (SD-Turbo en PyTorch, PC Maestra). `opts`: `negative`, `width`, `height`, `steps`, `seed` |

### 🪄 Método universal

¿Un scraper sin helper o desconoces el método? Usa `scraper()` para **cualquier** nombre:

```ts
await api.scraper('tiktokdl', { url: 'https://tiktok.com/@user/video/123' })
await api.scraper('ia', { prompt: 'Hola', sessionId: 'abc' })
await api.scraper('youtubedl', { url: 'https://youtube.com/watch?v=xyz', video: 0 })
await api.scraper('clima', { ciudad: 'Madrid' })
```

---

## 📦 Catálogo programático

Exporta `SCRAPERS` (lista con nombre, parámetros, grupo y descripción) para generar menús, comandos de bot o documentación dinámica:

```ts
import { SCRAPERS } from 'optishield-api'

for (const s of SCRAPERS) {
  console.log(`${s.group} → ${s.name} (params: ${s.params.join(', ')})`)
}
```

O consulta el servidor en tiempo real:

```ts
const scrapers = await api.listScrapers()
console.log(`📦 ${scrapers.total} scrapers disponibles`)
```

---

## ⚡ Ejemplos con respuestas reales

### Chat IA (orquestador)

```ts
const result = await api.ia('Hola, responde solo "OK"')
```

<details>
<summary>📖 Respuesta real</summary>

```json
{
  "scraper": "ia",
  "result": {
    "status": true,
    "sessionId": null,
    "resultado": "OK",
    "modelo": "google/gemma-3-27b-it",
    "via": "nova-ai",
    "tiempoMs": 4321
  },
  "usage": { "used": 1807, "max": 100000, "remaining": 98193 },
  "timestamp": "2026-08-05T06:59:26.487Z"
}
```
</details>

### IP Location

```ts
const result = await api.ipLocation('8.8.8.8')
console.log(result.result?.ubicacion?.ciudad)  // "Mountain View"
```

### Traductor

```ts
const result = await api.traductor('Hello world', 'es')
console.log(result.result?.texto)  // "Hola mundo"
```

### Clima

```ts
const result = await api.clima('Madrid')
console.log(result.result?.temp)  // 24°C
```

### Ping & Health

```ts
const pong = await api.ping()
console.log(pong)  // { "ok": true, "latency": 130 }
```

### Estadísticas de uso

```ts
const usage = await api.getUsage(7)
console.log(`Total: ${usage.totalCalls} llamadas en ${usage.periodDays} días`)
usage.byScraper.forEach(s => console.log(`  • ${s.scraper}: ${s.calls}`))
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
```

---

## 🤖 Scrapers personalizados (worker + polling)

```ts
// Worker + polling (para procesos largos)
const result = await api.executeScraper('tiktokdl', {
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

### 🤖 IA
| Método | Descripción |
|--------|-------------|
| `ia(prompt, sessionId?)` | Chat IA orquestador (4 proveedores en cascada) |
| `novaAI(prompt)` | Chat con Nova AI |
| `heckAI(prompt, sessionId?)` | Chat con HeckAI |
| `gptAnon(prompt, sessionId?, model?)` | Chat con GPTAnon |
| `googleGemma(prompt, sessionId?)` | Chat con Google Gemma |
| `photoEditorAI(image, prompt)` | Edita imágenes con IA |

### ⬇️ Descargadores
| Método | Descripción |
|--------|-------------|
| `youtubeDownload(url, video?)` | YouTube (MP4/MP3) |
| `youtube(url, video?)` | Alias de youtubeDownload |
| `tiktokDownload(url, opts?)` | TikTok sin marca de agua |
| `tiktok(url)` | Alias de tiktokDownload |
| `instagramDownload(url)` | Instagram (reels, posts, carruseles) |
| `instagram(url)` | Alias de instagramDownload |
| `facebookDownload(url, format?)` | Facebook (video/audio) |
| `facebook(url, format?)` | Alias de facebookDownload |
| `spotifyDownload(url)` | Spotify (audio + portada + letras) |
| `pinterestDownload(url)` | Pinterest (imágenes/videos) |
| `mcmodsDownload(slug, opts?)` | Mod de Minecraft (Modrinth) |

### 🔎 Buscadores
| Método | Descripción |
|--------|-------------|
| `youtubeSearch(query, maxResults?)` | Busca videos en YouTube |
| `spotifySearch(query, limit?)` | Busca canciones en Spotify |
| `tiktokSearch(query, count?)` | Busca videos en TikTok |
| `facebookSearch(query, limit?)` | Busca posts en Facebook |
| `pinterestSearch(query, limit?)` | Busca imágenes en Pinterest |
| `lyricsSearch(query)` | Busca letras de canciones |
| `mcmodsSearch(q, opts?)` | Busca mods de Minecraft |

### 🔍 Scrapers & Herramientas
| Método | Descripción |
|--------|-------------|
| `clima(ciudad)` | Clima de una ciudad |
| `ipLocation(ip)` | Geolocalización de IP |
| `domainInfo(dominio)` | Información de un dominio |
| `traductor(texto, idioma)` | Traductor |
| `stalkYt(username)` | Stalker de canal de YouTube |
| `tiktokStalk(username)` | Stalker de perfil de TikTok |
| `waChannel(url)` | Información de canal de WhatsApp |

### 🎨 Fun & Imagen
| Método | Descripción |
|--------|-------------|
| `bounty(imagen, texto)` | Cartel de recompensa |
| `brat(text)` | Imagen tipo BRAT |
| `bratVideo(text)` | Video tipo BRAT |
| `fakeIqc(media)` | Imagen con marco decorativo |
| `fakeNote(texto, avatar, nombre)` | Nota/fake de WhatsApp |
| `fakePost(avatar, usuario, media)` | Post falso de Instagram |
| `upscale(url)` | Upscale de imagen a 4x |

### 🪄 Universal & Utilidades
| Método | Descripción |
|--------|-------------|
| `scraper(name, params, opts?)` | Ejecuta cualquier scraper por nombre |
| `callScraper(name, params, opts?)` | Alias de `scraper` |
| `executeScraper(name, params, pollOpts?)` | Ejecuta scraper con worker + polling |
| `executeScraperSync(name, params)` | Ejecuta scraper síncrono |
| `uploadFile(buffer, name, mime, opts?)` | Sube archivo con expiración |
| `downloadUpload(uploadUrl)` | Descarga archivo subido |
| `downloadFile(url, opts?)` | Descarga archivo externo (proxy anti-CORS) |
| `downloadToDisk(url, outputPath, opts?)` | Descarga y guarda en disco |
| `shortenUrl(url)` | Acorta URLs |
| `listScrapers()` | Lista scrapers disponibles |
| `getScraperInfo(name)` | Información de un scraper |
| `getUsage(days?)` | Estadísticas de uso |
| `ping()` | Verifica conexión |
| `version()` | Versión del servidor |
| `login(pollInterval?, timeout?)` | Login por dispositivo |
| `logout()` | Cierra sesión y limpia credenciales |
| `isLoggedIn()` | Verifica sesión activa |

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
| `Código expirado` | El código de autenticación expiró | Vuelve a ejecutar `api.login()` |

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
  AIChatResult,
  MediaResult,
  SCRAPERS,
  ScraperDef,
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
