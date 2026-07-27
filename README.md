# OptiShield API

Cliente oficial para la [API de OptiShield](https://optishield.uk/). Descarga videos/audio de YouTube, TikTok, Instagram, Facebook, Spotify y más. Incluye sistema de workers con polling, subida de archivos con expiración y proxy de descargas anti-CORS.

## Instalación

```bash
npm install optishield-api
```

## Uso básico

```ts
import { OptiShieldClient } from 'optishield-api'

const api = new OptiShieldClient({
  apiKey: 'tu-api-key' // Obténla en https://optishield.uk/api-keys
})

// Descargar video de YouTube (MP4)
const video = await api.youtube('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'mp4')
console.log('Título:', video.result?.title)
console.log('URL:', video.result?.downloadUrl)
```

## Métodos

### 📹 YouTube

```ts
// Descargar video MP4
const video = await api.youtube('https://youtube.com/watch?v=...', 'mp4')

// Descargar solo audio MP3
const audio = await api.youtube('https://youtube.com/watch?v=...', 'mp3')

// Buscar videos en YouTube
const results = await api.youtubeSearch('música relajante')
console.log(results.result?.videos)
```

### 🎵 TikTok

```ts
// Descargar video TikTok (sin marca de agua)
const tiktok = await api.tiktok('https://vt.tiktok.com/ZSX...')
console.log('Video:', tiktok.result?.videoUrl)
console.log('Música:', tiktok.result?.musicUrl)
```

### 📸 Instagram

```ts
// Descargar video/imagen de Instagram
const insta = await api.instagram('https://instagram.com/p/...')
console.log('Descargas:', insta.result?.downloadUrls)
```

### 📘 Facebook

```ts
// Descargar video de Facebook
const fb = await api.facebook('https://facebook.com/watch?v=...')
console.log('Video HD:', fb.result?.hdUrl)
console.log('Video SD:', fb.result?.sdUrl)
```

### 🎧 Spotify

```ts
// Buscar canciones
const search = await api.spotifySearch('bad bunny último hit')
console.log('Resultados:', search.result?.tracks)

// Descargar canción por URL
const song = await api.spotifyDownload('https://open.spotify.com/track/...')
console.log('Canción:', song.result?.title)
console.log('Descarga:', song.result?.downloadUrl)
```

### 💾 Descarga directa de archivos

Descarga cualquier archivo desde una URL externa usando el proxy de OptiShield (evita problemas de CORS):

```ts
import fs from 'fs'

// Descargar archivo como Buffer
const file = await api.downloadFile('https://ejemplo.com/video.mp4')
fs.writeFileSync('video.mp4', file.buffer)
console.log('Archivo:', file.filename, `(${file.size} bytes)`)

// Con nombre personalizado y timeout extendido
const file2 = await api.downloadFile('https://ejemplo.com/archivo-grande.mp4', {
  filename: 'mi-video.mp4',
  timeout: 120_000
})

// Guardar directamente en disco
const savedPath = await api.downloadToDisk(
  'https://ejemplo.com/imagen.jpg',
  './descargas/foto.jpg'
)
console.log('Guardado en:', savedPath)
```

### 📤 Subida de archivos

Sube archivos al cluster de OptiShield (almacenados en Windows D://tmp) con expiración automática:

```ts
import fs from 'fs'

const buffer = fs.readFileSync('./documento.pdf')

// Subir con expiración default de 3 días
const upload = await api.uploadFile(buffer, 'documento.pdf', 'application/pdf')
console.log('URL pública:', upload.url)       // https://optishield.uk/upload/abc123...
console.log('Expira:', upload.expiresAt)      // ISO date

// Subir con expiración personalizada (7 días)
const upload7d = await api.uploadFile(buffer, 'video.mp4', 'video/mp4', {
  expiresInDays: 7
})

// Descargar archivo subido previamente
const downloaded = await api.downloadUpload(upload.url)
fs.writeFileSync('copia.pdf', downloaded.buffer)
```

### 🔗 Acortar URLs

```ts
const short = await api.shortenUrl('https://ejemplo.com/articulo-muy-largo')
console.log('URL corta:', short.shortUrl) // https://optishield.uk/r/aB3xK9
console.log('Código:', short.code)
```

### 🤖 Scrapers personalizados

```ts
// Ejecutar scraper con worker + polling (recomendado para procesos largos)
const result = await api.executeScraper('tiktok', {
  url: 'https://vt.tiktok.com/ZSX...'
})
console.log('Resultado:', result.result)

// Ejecutar scraper síncrono (para procesos rápidos)
const result2 = await api.executeScraperSync('ip-locate', {
  ip: '8.8.8.8'
})

// Configurar polling personalizado
const result3 = await api.executeScraper('youtube', 
  { url: 'https://youtube.com/watch?v=...', format: 'mp4' },
  { maxRetries: 30, interval: 3000 } // 30 intentos cada 3 segundos
)

// Listar todos los scrapers disponibles
const scrapers = await api.listScrapers()
console.log(`📦 ${scrapers.total} scrapers disponibles`)
scrapers.scrapers.forEach(s => console.log(`  • ${s.name}: ${s.description}`))
```

### 📊 Estadísticas de uso

```ts
// Uso de los últimos 7 días
const usage = await api.getUsage(7)
console.log(`Llamadas totales: ${usage.totalCalls}`)
console.log(`Requests usados: ${usage.totalRows}`)
usage.byScraper.forEach(s => {
  console.log(`  • ${s.scraper}: ${s.calls} llamadas`)
})

// Ping al servidor
const pong = await api.ping()
console.log(`Latencia: ${pong.latency}ms`)

// Versión del servidor
const version = await api.version()
console.log(`Versión: ${version.version}`)
console.log(`Build: ${version.buildTime}`)
console.log(`Uptime: ${Math.round(version.uptime / 3600)}h`)
```

## Ejemplos completos

### Ejemplo 1: Descargar y guardar video de YouTube

```ts
import { OptiShieldClient } from 'optishield-api'
import fs from 'fs'

const api = new OptiShieldClient({ apiKey: process.env.OPTISHIELD_API_KEY })

async function descargarVideo(url: string) {
  console.log('⏳ Procesando...')
  
  // 1. Obtener info del video
  const info = await api.youtube(url, 'mp4')
  const downloadUrl = info.result?.downloadUrl || info.result?.url
  console.log('✅ Video:', info.result?.title)
  
  if (!downloadUrl) throw new Error('No hay URL de descarga')
  
  // 2. Descargar el archivo
  console.log('⏳ Descargando archivo...')
  const file = await api.downloadFile(downloadUrl, {
    filename: `${info.result?.title || 'video'}.mp4`,
    timeout: 180_000
  })
  
  // 3. Guardar en disco
  const outputPath = `./descargas/${file.filename}`
  fs.writeFileSync(outputPath, file.buffer)
  console.log(`✅ Guardado: ${outputPath} (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
}

descargarVideo('https://www.youtube.com/watch?v=UtxBDhuVdW0').catch(console.error)
```

### Ejemplo 2: Subir archivo, acortar URL y compartir

```ts
import { OptiShieldClient } from 'optishield-api'
import fs from 'fs'

const api = new OptiShieldClient({ apiKey: process.env.OPTISHIELD_API_KEY })

async function compartirArchivo(filePath: string) {
  // 1. Leer archivo
  const buffer = fs.readFileSync(filePath)
  const name = filePath.split('/').pop() || 'archivo'
  
  // 2. Subir con expiración de 7 días
  const upload = await api.uploadFile(buffer, name, 'application/octet-stream', {
    expiresInDays: 7
  })
  console.log('📤 Subido:', upload.url)
  console.log('⏰ Expira:', upload.expiresAt)
  
  // 3. Acortar la URL
  const short = await api.shortenUrl(upload.url)
  console.log('🔗 Link corto:', short.shortUrl)
  
  return { upload, short }
}

compartirArchivo('./presentacion.pdf').catch(console.error)
```

### Ejemplo 3: Buscar y descargar canción de Spotify

```ts
import { OptiShieldClient } from 'optishield-api'

const api = new OptiShieldClient({ apiKey: process.env.OPTISHIELD_API_KEY })

async function descargarCancion(query: string) {
  // 1. Buscar
  const search = await api.spotifySearch(query)
  const track = search.result?.tracks?.[0]
  if (!track) throw new Error('No se encontró la canción')
  console.log('🎵 Canción:', track.title, '-', track.artist)
  
  // 2. Descargar
  const song = await api.spotifyDownload(track.url)
  console.log('✅ Audio:', song.result?.downloadUrl)
  return song
}

descargarCancion('Dua Lipa Dance The Night').catch(console.error)
```

### Ejemplo 4: Verificar estado y uso de la API

```ts
import { OptiShieldClient } from 'optishield-api'

const api = new OptiShieldClient({ apiKey: process.env.OPTISHIELD_API_KEY })

async function dashboard() {
  const [version, usage, scrapers, ping] = await Promise.all([
    api.version(),
    api.getUsage(30),
    api.listScrapers(),
    api.ping()
  ])
  
  console.log(`
╔══════════════════════════╗
║   OptiShield Dashboard   ║
╠══════════════════════════╣
║ Versión: ${version.version.padEnd(17)}║
║ Build:   ${new Date(version.buildTime).toLocaleDateString().padEnd(17)}║
║ Latencia: ${String(ping.latency).padEnd(3)}ms${' '.repeat(12)}║
║ Uptime:  ${Math.round(version.uptime / 3600)}h${' '.repeat(14)}║
║ Scrapers: ${String(scrapers.total).padEnd(3)} disponibles${' '.repeat(5)}║
║ Requests: ${String(usage.totalCalls).padEnd(4)} en 30 días${' '.repeat(5)}║
╚══════════════════════════╝
  `)
}

dashboard().catch(console.error)
```

## API Reference

### `OptiShieldClient`

| Método | Descripción |
|--------|-------------|
| `youtube(url, format?)` | Descarga video/audio de YouTube |
| `youtubeSearch(query)` | Busca videos en YouTube |
| `tiktok(url)` | Descarga video de TikTok |
| `instagram(url)` | Descarga contenido de Instagram |
| `facebook(url)` | Descarga video de Facebook |
| `spotifySearch(query)` | Busca canciones en Spotify |
| `spotifyDownload(url)` | Descarga canción de Spotify |
| `executeScraper(name, params, pollOpts?)` | Ejecuta scraper con worker + polling |
| `executeScraperSync(name, params)` | Ejecuta scraper síncrono |
| `uploadFile(buffer, name, mime, opts?)` | Sube archivo con expiración |
| `downloadUpload(uploadUrl)` | Descarga archivo subido previamente |
| `downloadFile(url, opts?)` | Descarga archivo desde URL externa (proxy) |
| `downloadToDisk(url, outputPath, opts?)` | Descarga y guarda en disco |
| `shortenUrl(url)` | Acorta una URL |
| `listScrapers()` | Lista scrapers disponibles |
| `getScraperInfo(name)` | Información de un scraper |
| `getUsage(days?)` | Estadísticas de uso |
| `ping()` | Verifica conexión con el servidor |
| `version()` | Información de versión del servidor |

## TypeScript

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

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Se requiere apiKey` | No pasaste apiKey | Obtén una en [api-keys](https://optishield.uk/api-keys) |
| `API key sin permisos` | Key revocada o plan inactivo | Verifica tu plan en el dashboard |
| `Archivo muy grande` | Archivo > 100MB | Comprime o divide el archivo |
| `Límite de solicitudes` | Alcanzaste tu cuota mensual | Mejora tu plan o espera al próximo mes |
| `Timeout: worker no completó` | El scraper tomó demasiado | Aumenta `maxRetries` o `interval` |
| `El archivo ha expirado` | El upload expiró | Vuelve a subir el archivo |

## Requisitos

- Node.js >= 18
- API key de OptiShield ([https://optishield.uk/api-keys](https://optishield.uk/api-keys))
- Plan activo

## Licencia

MIT
