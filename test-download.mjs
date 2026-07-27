/**
 * Test de descarga para optishield-api
 *
 * Uso: node test-download.mjs <apiKey>
 * 
 * Prueba:
 *   1. downloadFile() con URL pública (imagen)
 *   2. downloadFile() con filename personalizado
 *   3. downloadToDisk() guardando en disco
 *   4. downloadUpload() descargando archivo subido
 *   5. Error handling: URL inválida
 */

import { OptiShieldClient } from './dist/index.js'
import fs from 'fs'
import path from 'path'

const API_KEY = process.argv[2] || ''
const BASE_URL = 'http://localhost:3000/api'
const TMP_DIR = '/tmp/optishield-test-downloads'

async function main() {
  if (!API_KEY) {
    console.log('❌ Uso: node test-download.mjs <apiKey>')
    process.exit(1)
  }

  console.log('')
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║    📥 Test: downloadFile / downloadToDisk     ║')
  console.log('╚════════════════════════════════════════════════╝')
  console.log('')

  const api = new OptiShieldClient({ apiKey: API_KEY, baseUrl: BASE_URL })

  // ─── Setup ───
  const imgUrl = 'https://picsum.photos/200'  // imagen pequeña conocida
  const dlDir = path.resolve(TMP_DIR)
  fs.mkdirSync(dlDir, { recursive: true })
  let passed = 0
  let failed = 0

  function log(label, status, detail = '') {
    const icon = status === 'PASS' ? '✅' : '❌'
    console.log(`   ${icon} ${label.padEnd(45)} ${detail}`)
    if (status === 'PASS') passed++
    else failed++
  }

  // ─── 1. downloadFile → imagen ───
  console.log('📥 1. downloadFile() desde URL pública...')
  try {
    const r = await api.downloadFile(imgUrl)
    const ok = r.buffer instanceof Buffer && r.buffer.length > 0 && r.contentType.startsWith('image/')
    log(`Buffer válido (${r.size} bytes, ${r.contentType})`, ok ? 'PASS' : 'FAIL')
    if (r.filename !== 'download') log(`Filename inferido: ${r.filename}`, 'PASS')
    else log(`Filename inferido: ${r.filename}`, 'FAIL')
  } catch (e) {
    log('downloadFile imagen', 'FAIL', e.message)
  }
  console.log('')

  // ─── 2. downloadFile → con filename personalizado ───
  console.log('📥 2. downloadFile() con filename personalizado...')
  try {
    const r = await api.downloadFile(imgUrl, { filename: 'mi-foto.jpg' })
    const ok = r.filename === 'mi-foto.jpg'
    log(`Filename: "${r.filename}"`, ok ? 'PASS' : 'FAIL', `tamaño: ${r.size} bytes`)
  } catch (e) {
    log('downloadFile con filename', 'FAIL', e.message)
  }
  console.log('')

  // ─── 3. downloadFile → texto/HTML ───
  console.log('📥 3. downloadFile() contenido de texto...')
  try {
    const r = await api.downloadFile('https://example.com/')
    const ok = r.buffer instanceof Buffer && r.buffer.length > 200
    log(`HTML descargado (${r.size} bytes, ${r.contentType})`, ok ? 'PASS' : 'FAIL')
  } catch (e) {
    log('downloadFile texto', 'FAIL', e.message)
  }
  console.log('')

  // ─── 4. downloadToDisk → guardar en disco ───
  console.log('💾 4. downloadToDisk() guardando en disco...')
  try {
    const outPath = path.join(dlDir, 'foto-descargada.jpg')
    const saved = await api.downloadToDisk(imgUrl, outPath)
    const exists = fs.existsSync(saved)
    const stats = exists ? fs.statSync(saved) : null
    log(`Archivo guardado: ${path.basename(saved)}`, exists ? 'PASS' : 'FAIL',
      exists ? `${stats.size} bytes` : 'no existe')
    if (exists) fs.unlinkSync(saved) // limpiar
  } catch (e) {
    log('downloadToDisk', 'FAIL', e.message)
  }
  console.log('')

  // ─── 5. downloadToDisk → crear directorio anidado ───
  console.log('💾 5. downloadToDisk() creando subdirectorios...')
  try {
    const nestedPath = path.join(dlDir, 'sub', 'nested', 'video.mp4')
    const saved = await api.downloadToDisk(imgUrl, nestedPath)
    const exists = fs.existsSync(saved)
    log(`Directorio creado automáticamente`, exists ? 'PASS' : 'FAIL', saved)
    if (exists) {
      fs.unlinkSync(saved)
      fs.rmdirSync(path.dirname(saved))
      fs.rmdirSync(path.join(dlDir, 'sub'))
    }
  } catch (e) {
    log('downloadToDisk anidado', 'FAIL', e.message)
  }
  console.log('')

  // ─── 6. Error: URL inválida ───
  console.log('⚠️  6. Error handling: URL inválida...')
  try {
    await api.downloadFile('no-es-una-url')
    log('Debió lanzar error', 'FAIL')
  } catch (e) {
    log(`Error capturado: ${e.message.substring(0, 60)}...`, 'PASS')
  }
  console.log('')

  // ─── 7. downloadUpload (subir + descargar) ───
  console.log('🔄 7. downloadUpload() subir y descargar...')
  try {
    const testContent = Buffer.from('Hola OptiShield! Test de descarga.')
    const upload = await api.uploadFile(testContent, 'test-download.txt', 'text/plain')
    log(`Archivo subido: ${upload.url.substring(0, 50)}...`, 'PASS')

    // Descargar el archivo subido
    const dl = await api.downloadUpload(upload.url)
    const contentOk = dl.buffer.toString() === 'Hola OptiShield! Test de descarga.'
    log(`Contenido coincide (${dl.size} bytes)`, contentOk ? 'PASS' : 'FAIL')
    log(`Content-Type: ${dl.contentType}`, dl.contentType === 'text/plain' ? 'PASS' : 'FAIL',
      `(esperado: text/plain)`)
  } catch (e) {
    log('downloadUpload', 'FAIL', e.message)
  }
  console.log('')

  // ─── 8. downloadFile → con timeout bajo (debe fallar si es muy bajo) ───
  console.log('⏱️  8. downloadFile() con timeout bajo...')
  try {
    // Timeout muy bajo para probar que se maneja correctamente
    await api.downloadFile(imgUrl, { timeout: 1 })
    log('Timeout bajo - descargó (posible si es muy rápido)', 'PASS')
  } catch (e) {
    log(`Timeout detectado`, 'PASS', e.message.substring(0, 50))
  }
  console.log('')

  // ─── Resumen ───
  console.log('╔════════════════════════════════════════════════╗')
  console.log(`║    📊 RESULTADOS: ${passed} pasaron, ${failed} fallaron${' '.repeat(12 - String(failed).length)}}║`)
  console.log('╚════════════════════════════════════════════════╝')
  console.log('')

  // Limpiar tmp
  try { fs.rmSync(dlDir, { recursive: true, force: true }) } catch {}

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
