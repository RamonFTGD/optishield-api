/**
 * Test rápido para el módulo optishield-api
 * 
 * Uso: node test.mjs <apiKey>
 * 
 * Si no se pasa apiKey, usa las credenciales guardadas en ~/.optishield/credentials.json
 */

import { OptiShieldClient } from './dist/index.js'
import fs from 'fs'
import path from 'path'

const API_KEY = process.argv[2] || ''
const BASE_URL = 'https://optishield.uk/api'

async function main() {
  console.log('')
  console.log('╔══════════════════════════════════════════╗')
  console.log('║    🧪 Test: optishield-api v1.0.0       ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log('')

  // ─── 1. Crear cliente ───
  console.log('📦 Creando cliente...')
  const api = API_KEY
    ? new OptiShieldClient({ apiKey: API_KEY })
    : new OptiShieldClient() // auto-load desde ~/.optishield/credentials.json

  console.log(`   ✅ Cliente creado (baseUrl: ${BASE_URL})`)
  if (api.isLoggedIn()) {
    console.log(`   ✅ Sesión activa (credenciales: ${api.getCredentialsPath()})`)
  }
  console.log('')

  // ─── 2. Ping ───
  console.log('🏓 Ping al servidor...')
  try {
    const pong = await api.ping()
    console.log(`   ✅ Pong! Latencia: ${pong.latency}ms`)
  } catch (err) {
    console.log(`   ❌ Ping falló: ${err.message}`)
    process.exit(1)
  }
  console.log('')

  // ─── 3. Version ───
  console.log('🔢 Versión del servidor...')
  try {
    const ver = await api.version()
    console.log(`   ✅ v${ver.version} (uptime: ${Math.floor(ver.uptime / 60)}min)`)
  } catch (err) {
    console.log(`   ❌ Version falló: ${err.message}`)
  }
  console.log('')

  // ─── 4. Listar scrapers ───
  console.log('📋 Scrapers disponibles...')
  try {
    const list = await api.listScrapers()
    console.log(`   ✅ ${list.total} scrapers disponibles:`)
    if (list.scrapers && list.scrapers.length > 0) {
      list.scrapers.slice(0, 8).forEach(s => console.log(`      • ${s.name}`))
      if (list.scrapers.length > 8) console.log(`      ... y ${list.scrapers.length - 8} más`)
    }
  } catch (err) {
    console.log(`   ❌ List falló: ${err.message}`)
  }
  console.log('')

  // ─── 5. executeScraper (youtube search) ───
  console.log('🎵 YouTube Search (executeScraper)...')
  try {
    const result = await api.youtubeSearch('Never Gonna Give You Up')
    console.log(`   ✅ Resultados:`)
    if (result.result?.videos) {
      result.result.videos.slice(0, 3).forEach(v => {
        console.log(`      • ${v.title?.substring(0, 60) || 'sin título'}`)
      })
    } else {
      console.log(`      Respuesta: ${JSON.stringify(result.result).substring(0, 200)}`)
    }
  } catch (err) {
    console.log(`   ❌ YouTube search falló: ${err.message}`)
  }
  console.log('')

  // ─── 6. uploadFile (test con buffer pequeño) ───
  console.log('📤 Upload file...')
  try {
    const testContent = Buffer.from('Hola OptiShield! Este es un test del módulo npm.')
    const upload = await api.uploadFile(testContent, 'test.txt', 'text/plain')
    console.log(`   ✅ Archivo subido:`)
    console.log(`      URL: ${upload.url}`)
    console.log(`      Expira: ${upload.expiresAt}`)

    // Verificar que getUploadUrl funciona
    const url = await api.getUploadUrl(upload.id)
    console.log(`      getUploadUrl: ${url ? '✅ OK' : '❌ null'}`)
  } catch (err) {
    console.log(`   ❌ Upload falló: ${err.message}`)
  }
  console.log('')

  // ─── 7. shortUrl ───
  console.log('🔗 Short URL...')
  try {
    const short = await api.shortenUrl('https://optishield.uk/')
    console.log(`   ✅ URL acortada: ${short.shortUrl}`)
  } catch (err) {
    console.log(`   ❌ Short URL falló: ${err.message}`)
  }
  console.log('')

  // ─── 8. getUsage ───
  console.log('📊 Estadísticas de uso...')
  try {
    const usage = await api.getUsage(7)
    console.log(`   ✅ Últimos ${usage.periodDays} días:`)
    console.log(`      Total llamadas: ${usage.totalCalls}`)
    if (usage.byScraper && usage.byScraper.length > 0) {
      usage.byScraper.slice(0, 5).forEach(s => {
        console.log(`      • ${s.scraper}: ${s.calls} llamadas`)
      })
    }
  } catch (err) {
    console.log(`   ❌ Usage falló: ${err.message}`)
  }
  console.log('')

  // ─── 9. Login flow (solo si es interactivo) ───
  if (process.argv.includes('--login')) {
    console.log('🔐 Login por dispositivo...')
    try {
      // Probar obtener código (sin completar el flujo)
      console.log('   ⏳ Se generará un código... (presiona Ctrl+C para saltar)')
      // Solo mostraríamos la URL, no esperamos
      const axios = (await import('axios')).default
      const res = await axios.get(`${BASE_URL}/auth/device`, { timeout: 10000 })
      console.log(`   ✅ Código generado:`)
      console.log(`      URL: ${res.data.url}`)
      console.log(`      Expira: ${res.data.expiresIn}s`)
    } catch (err) {
      console.log(`   ❌ Device auth falló: ${err.message}`)
    }
    console.log('')
  }

  console.log('╔══════════════════════════════════════════╗')
  console.log('║    ✅ TESTS COMPLETADOS                  ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log('')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
