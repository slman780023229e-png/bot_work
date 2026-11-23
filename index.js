// prototype.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Main Entry Point 🚀

import './settings.js'
import { createRequire } from 'module'
import path, { join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, {
  writeFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  existsSync,
  readFileSync,
  copyFileSync,
  watch,
  rmSync,
  mkdirSync,
  rename
} from 'fs'
import * as fsPromises from 'fs/promises'
import { readdir, stat, unlink } from 'fs/promises'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import { gataJadiBot } from './plugins/تنصيب.js'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import pino from 'pino'
import Pino from 'pino'
import { Boom } from '@hapi/boom'
import os from 'os'
import http from 'http'
import { makeWASocket, protoType, serialize } from './core/Prototype_core.js'
import { JSONFile, Low } from 'lowdb'
import PQueue from 'p-queue'
import Datastore from '@seald-io/nedb'
import store from './core/blacklight_store.js'
import readline from 'readline'
import NodeCache from 'node-cache'
import pkg from 'google-libphonenumber'

const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()

const {
  makeInMemoryStore,
  DisconnectReason,
  useMultiFileAuthState,
  MessageRetryMap,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  delay,
  Browsers
} = await import('@whiskeysockets/baileys')

const { CONNECTING } = ws
const { chain } = lodash

// ============================================================
// PATHS & MONGO AUTH CONFIG
// ============================================================

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? (/file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

global.timestamp = { start: new Date() }
const __filename = fileURLToPath(import.meta.url)
const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

const sessionDir = path.join(__dirname, 'ملف_الاتصال')
const dataDir = path.join(__dirname, 'data')

const MONGO_URI = process.env.MONGO_URI || ''
const MONGO_SESSION_ID = process.env.MONGO_SESSION_ID || 'arthur-session'
const useMongoSession = Boolean(MONGO_URI && MONGO_URI.trim() !== '')

global.creds = 'creds.json'
global.authFile = 'ArthurSession'
global.authFileJB = 'ArthurSubBot'
global.rutaBot = join(__dirname, global.authFile)
global.rutaJadiBot = join(__dirname, global.authFileJB)
const respaldoDir = join(__dirname, 'BackupSession')
const credsFile = join(global.rutaBot, global.creds)
const backupFile = join(respaldoDir, global.creds)

// ============================================================
// DEVELOPER NUMBER SYNC & LOG HELPERS
// ============================================================

try {
  const targetFile = '.plugins/المطور.js'
  const myNumber = '+20 10 02435496'
  const rawNumber = myNumber.replace(/[\s+]/g, '')
  if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8')
    if (!content.includes(rawNumber) && !content.includes(myNumber)) {
      content = content.replace(/\+?20\s?\d{2}\s?\d{7,8}/g, myNumber)
      content = content.replace(/waid=\d+/g, `waid=${rawNumber}`)
      fs.writeFileSync(targetFile, content)
    }
  }
} catch (e) {}

async function flushLogs() {
  await Promise.resolve()
  await new Promise((r) => setTimeout(r, 0))
}
async function logCritical(msg) {
  process.stdout.write(String(msg) + '\n')
  await flushLogs()
}
async function logInfo(msg) {
  console.log(msg)
  await flushLogs()
}
async function logWarn(msg) {
  console.warn(msg)
  await flushLogs()
}
async function logError(msg) {
  console.error(msg)
  await flushLogs()
}

if (typeof global.atob !== 'function') {
  global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary')
}

protoType()
serialize()

// ============================================================
// DATABASE (NEDB + GLOBAL.DB)
// ============================================================

const dbPath = path.join(__dirname, 'database')
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })

const collections = {
  users: new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  chats: new Datastore({ filename: path.join(dbPath, 'chats.db'), autoload: true }),
  settings: new Datastore({ filename: path.join(dbPath, 'settings.db'), autoload: true }),
  msgs: new Datastore({ filename: path.join(dbPath, 'msgs.db'), autoload: true }),
  sticker: new Datastore({ filename: path.join(dbPath, 'sticker.db'), autoload: true }),
  stats: new Datastore({ filename: path.join(dbPath, 'stats.db'), autoload: true })
}
Object.values(collections).forEach((db) => {
  db.setAutocompactionInterval(300000)
})

global.db = {
  data: {
    users: {},
    chats: {},
    settings: {},
    msgs: {},
    sticker: {},
    stats: {}
  }
}

function sanitizeId(id) {
  return id.replace(/\./g, '_')
}
function unsanitizeId(id) {
  return id.replace(/_/g, '.')
}
function sanitizeObject(obj) {
  if (Array.isArray(obj)) return obj.map((value) => sanitizeObject(value))
  if (!obj || typeof obj !== 'object' || Buffer.isBuffer(obj) || obj instanceof Date) return obj
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = key.replace(/\./g, '_')
    sanitized[sanitizedKey] = sanitizeObject(value)
  }
  return sanitized
}
function unsanitizeObject(obj) {
  if (Array.isArray(obj)) return obj.map((value) => unsanitizeObject(value))
  if (!obj || typeof obj !== 'object' || Buffer.isBuffer(obj) || obj instanceof Date) return obj
  const unsanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    const unsanitizedKey = key.replace(/_/g, '.')
    unsanitized[unsanitizedKey] = unsanitizeObject(value)
  }
  return unsanitized
}

global.db.readData = async function (category, id) {
  const memKey = id
  const diskKey = sanitizeId(id)
  if (!global.db.data[category][memKey]) {
    const data = await new Promise((resolve, reject) => {
      collections[category].findOne({ _id: diskKey }, (err, doc) => {
        if (err) return reject(err)
        resolve(doc ? unsanitizeObject(doc.data) : {})
      })
    })
    global.db.data[category][memKey] = data
  }
  return global.db.data[category][memKey]
}

global.db.writeData = async function (category, id, data) {
  const memKey = id
  const diskKey = sanitizeId(id)
  global.db.data[category][memKey] = {
    ...global.db.data[category][memKey],
    ...data
  }
  await new Promise((resolve, reject) => {
    collections[category].update(
      { _id: diskKey },
      { $set: { data: sanitizeObject(global.db.data[category][memKey]) } },
      { upsert: true },
      (err) => (err ? reject(err) : resolve())
    )
  })
}

global.db.loadDatabase = async function () {
  const loadPromises = Object.keys(collections).map(async (category) => {
    const docs = await new Promise((resolve, reject) => {
      collections[category].find({}, (err, docs) => {
        if (err) return reject(err)
        resolve(docs)
      })
    })
    const seenIds = new Set()
    for (const doc of docs) {
      const originalId = unsanitizeId(doc._id)
      // Never delete a database record during startup. If legacy IDs collide
      // after decoding, keep the first in-memory value and leave both on disk.
      if (seenIds.has(originalId)) {
        console.warn(`[Database] Legacy ID collision in ${category}; preserved document ${doc._id}.`)
        continue
      }
      seenIds.add(originalId)
      if (category === 'users' && (originalId.includes('@newsletter') || originalId.includes('lid'))) continue
      if (category === 'chats' && originalId.includes('@newsletter')) continue
      global.db.data[category][originalId] = unsanitizeObject(doc.data)
    }
  })
  await Promise.all(loadPromises)
}

global.db.save = async function () {
  const savePromises = []
  for (const category of Object.keys(global.db.data)) {
    for (const [id, data] of Object.entries(global.db.data[category])) {
      if (Object.keys(data).length > 0) {
        if (category === 'users' && (id.includes('@newsletter') || id.includes('lid'))) continue
        if (category === 'chats' && id.includes('@newsletter')) continue
        savePromises.push(
          new Promise((resolve, reject) => {
            collections[category].update(
              { _id: sanitizeId(id) },
              { $set: { data: sanitizeObject(data) } },
              { upsert: true },
              (err) => (err ? reject(err) : resolve())
            )
          })
        )
      }
    }
  }
  await Promise.all(savePromises)
}

const loadDatabase = () => global.db.loadDatabase()

global.db
  .loadDatabase()
  .then(() => {
    console.log('Database loaded')
  })
  .catch((err) => {
    console.error('Error loading database:', err)
  })

// ============================================================
// SESSION RESTORE CONDITION (مسار محلي موحد تتم مزامنته عبر start.js)
// ============================================================

try {
  fs.mkdirSync(sessionDir, { recursive: true })

  // ترحيل الجلسة القديمة إلى المسار الموحد مرة واحدة، دون حذف الأصل.
  const legacySessionDir = path.join(__dirname, global.authFile)
  const localCredsPath = path.join(sessionDir, 'creds.json')
  if (!fs.existsSync(localCredsPath) && fs.existsSync(path.join(legacySessionDir, 'creds.json'))) {
    for (const entry of fs.readdirSync(legacySessionDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue
      const from = path.join(legacySessionDir, entry.name)
      const to = path.join(sessionDir, entry.name)
      if (!fs.existsSync(to)) fs.copyFileSync(from, to)
    }
    console.log(chalk.green('✅ تم نقل نسخة من الجلسة القديمة إلى مجلد ملف_الاتصال مع الحفاظ على الأصل.'))
  }

  if (!fs.existsSync(localCredsPath) && process.env.SESSION_DATA?.trim()) {
    fs.writeFileSync(localCredsPath, process.env.SESSION_DATA, 'utf-8')
    console.log(chalk.green('✅ تم تحميل الجلسة من متغير البيئة لعدم وجود ملف اتصال محلي.'))
  } else {
    console.log(chalk.gray('ℹ️ سيتم استخدام مجلد ملف_الاتصال كمسار موحد لملفات الجلسة.'))
  }

  if (useMongoSession) console.log(chalk.green('🍃 MongoDB configured: session files will be synchronized by start.js.'))
  else console.log(chalk.yellow('⚠️ MONGO_URI غير مضبوط؛ سيعمل الاتصال محلياً ولن تتم مزامنته إلى قاعدة البيانات.'))
} catch (e) {
  console.log(chalk.red('⚠️ خطأ في معالجة مسار الجلسة: ' + e.message))
}

// ============================================================
// KEEP ALIVE & LIVE CLOCK
// ============================================================

let currentSock = null
let isStarting = false
let isShuttingDown = false
let reconnectTimer = null
let connectionOpen = false
let authRejected = false
let currentAuthStore = null
let printingNoConn = false

const RECONNECT_DELAY = 3000

const keepAliveServer = http.createServer((req, res) => {
  const healthy = connectionOpen && !authRejected && !isShuttingDown
  res.writeHead(healthy ? 200 : 503, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  })
  res.end(
    healthy
      ? 'ARTHUR BOT ONLINE — WHATSAPP CONNECTED 🟢\n'
      : `ARTHUR BOT PROCESS ACTIVE — WHATSAPP ${authRejected ? 'AUTH REJECTED' : 'DISCONNECTED'} 🔴\n`
  )
})

keepAliveServer.listen(PORT, '0.0.0.0', () => {
  console.log(chalk.green(`🌐 Keep-Alive Server Running On Port ${PORT}`))
})

const liveClock = setInterval(() => {
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour12: false })
  console.log(chalk.gray(`🕒 ARTHUR BOT | ${time}`))
}, 60000)

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

// ============================================================
// CONSOLE NOISE FILTER & READLINE HELPERS
// ============================================================

const filterStrings = [
  'Q2xvc2luZyBzdGFsZSBvcGVu',
  'Q2xvc2luZyBvcGVuIHNlc3Npb24=',
  'RmFpbGVkIHRvIGRlY3J5cHQ=',
  'U2Vzc2lvbiBlcnJvcg==',
  'RXJyb3I6IEJhZCBNQUM=',
  'RGVjcnlwdGVkIG1lc3NhZ2U='
]

function redefineConsoleMethod(methodName, filterStrings) {
  const originalConsoleMethod = console[methodName]
  console[methodName] = function () {
    const message = arguments[0]
    if (typeof message === 'string' && filterStrings.some((filterString) => message.includes(atob(filterString)))) {
      return
    }
    return originalConsoleMethod.apply(console, arguments)
  }
}
;['log', 'warn', 'error'].forEach((methodName) => redefineConsoleMethod(methodName, filterStrings))

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
})

const question = (texto) => {
  try {
    rl.clearLine(rl.input, 0)
  } catch {}
  return new Promise((resolver) => {
    rl.question(texto, (respuesta) => {
      try {
        rl.clearLine(rl.input, 0)
      } catch {}
      resolver(respuesta.trim())
    })
  })
}

async function isValidPhoneNumber(number) {
  try {
    number = number.replace(/\s+/g, '')
    if (number.startsWith('+521')) {
      number = number.replace('+521', '+52')
    } else if (number.startsWith('+52') && number[4] === '1') {
      number = number.replace('+52 1', '+52')
    }
    const parsedNumber = phoneUtil.parseAndKeepRawInput(number)
    return phoneUtil.isValidNumber(parsedNumber)
  } catch (error) {
    return false
  }
}

// ============================================================
// BACKUPS, SUBBOTS & CLEANUP HELPERS
// ============================================================

const backupCreds = async () => {
  if (!fs.existsSync(credsFile)) {
    console.log('[⚠] creds.json not found for backup.')
    return
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const newBackup = join(respaldoDir, `creds-${timestamp}.json`)
  fs.copyFileSync(credsFile, newBackup)
  console.log(`[✅] Backup created: ${newBackup}`)
  const backups = fs
    .readdirSync(respaldoDir)
    .filter((file) => file.startsWith('creds-') && file.endsWith('.json'))
    .sort((a, b) => fs.statSync(join(respaldoDir, a)).mtimeMs - fs.statSync(join(respaldoDir, b)).mtimeMs)
  while (backups.length > 3) {
    const oldest = backups.shift()
    fs.unlinkSync(join(respaldoDir, oldest))
    console.log(`[🗑️] Old backup removed: ${oldest}`)
  }
}

const restoreCreds = async () => {
  const backups = fs
    .readdirSync(respaldoDir)
    .filter((file) => file.startsWith('creds-') && file.endsWith('.json'))
    .sort((a, b) => fs.statSync(join(respaldoDir, b)).mtimeMs - fs.statSync(join(respaldoDir, a)).mtimeMs)
  if (backups.length === 0) {
    console.log('[⚠] No backups available to restore.')
    return
  }
  const latestBackup = join(respaldoDir, backups[0])
  fs.copyFileSync(latestBackup, credsFile)
  console.log(`[✅] Restored from backup: ${backups[0]}`)
}

async function reconnectSubBots() {
  const subBotDir = path.resolve('./ArthurSubBot')
  if (!fs.existsSync(subBotDir)) return
  const subBotFolders = fs.readdirSync(subBotDir).filter((f) => fs.statSync(path.join(subBotDir, f)).isDirectory())
  for (const folder of subBotFolders) {
    const credsPath = path.join(subBotDir, folder, 'creds.json')
    if (!fs.existsSync(credsPath)) continue
    const isConnected = global.conns?.some((c) => c.user?.jid?.includes(folder) && c.isInit)
    if (!isConnected) {
      console.log(chalk.bold.cyanBright(`[🔄] Reconnecting sub-bot: ${folder}`))
      try {
        await gataJadiBot({
          pathGataJadiBot: path.join(subBotDir, folder),
          m: null,
          conn: global.conn,
          args: [],
          usedPrefix: '#',
          command: 'jadibot',
          fromCommand: false
        })
        console.log(chalk.bold.greenBright(`[✅] Sub-bot ${folder} reconnected`))
      } catch {
        console.log(chalk.bold.redBright(`[❌] Failed to reconnect ${folder}`))
      }
    }
  }
}

function clearTmp() {
  const tmpDir = join(__dirname, 'tmp')
  if (!existsSync(tmpDir)) return
  const filenames = readdirSync(tmpDir)
  filenames.forEach((file) => {
    const filePath = join(tmpDir, file)
    try {
      unlinkSync(filePath)
    } catch {}
  })
}

async function purgeSession() {
  const sessionFolder = './ArthurSession'
  try {
    if (!existsSync(sessionFolder)) return
    const files = await readdir(sessionFolder)
    const preKeys = files.filter((file) => file.startsWith('pre-key-'))
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    for (const file of preKeys) {
      const filePath = join(sessionFolder, file)
      const fileStats = await stat(filePath)
      if (fileStats.mtimeMs < oneDayAgo) {
        try {
          await unlink(filePath)
          console.log(chalk.green(`[🗑️] Old pre-key deleted: ${file}`))
        } catch {}
      } else {
        console.log(chalk.yellow(`[ℹ️] Keeping active pre-key: ${file}`))
      }
    }
    console.log(chalk.cyanBright(`[🔵] Non-essential sessions cleaned from ${global.authFile}`))
  } catch {}
}

async function purgeSessionSB() {
  const jadibtsDir = './ArthurSubBot/'
  try {
    if (!existsSync(jadibtsDir)) return
    const directories = await readdir(jadibtsDir)
    let SBprekey = []
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    for (const dir of directories) {
      const dirPath = join(jadibtsDir, dir)
      const statsDir = await stat(dirPath)
      if (statsDir.isDirectory()) {
        const files = await readdir(dirPath)
        const preKeys = files.filter((file) => file.startsWith('pre-key-') && file !== 'creds.json')
        SBprekey = [...SBprekey, ...preKeys]
        for (const file of preKeys) {
          const filePath = join(dirPath, file)
          const fileStats = await stat(filePath)
          if (fileStats.mtimeMs < oneDayAgo) {
            try {
              await unlink(filePath)
              console.log(chalk.bold.green(`[🗑️] Old sub-bot pre-key deleted: ${file}`))
            } catch {}
          }
        }
      }
    }
    if (SBprekey.length === 0) console.log(chalk.bold.green('[✅] No old pre-keys found in sub-bots'))
    else console.log(chalk.cyanBright(`[🔵] Old pre-keys deleted from sub-bots: ${SBprekey.length}`))
  } catch (err) {
    console.log(chalk.bold.red('[❌] Error cleaning sub-bot sessions: ' + err))
  }
}

async function _quickTest() {
  const procs = [
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version'])
  ]

  const test = await Promise.all(
    procs.map((p) =>
      Promise.race([
        new Promise((resolve) => {
          p.on('close', (code) => resolve(code !== 127))
        }),
        new Promise((resolve) => {
          p.on('error', () => resolve(false))
        })
      ])
    )
  )

  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
  const s = (global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find })
  Object.freeze(global.support)
}

// ============================================================
// PLUGINS & HANDLER BINDING
// ============================================================

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      // لا تستخدم conn هنا: قد لا يكون الاتصال قد أُنشئ بعد أثناء تحميل الإضافات.
      const pluginError = e?.stack || e?.message || e
      console.error(`[PLUGIN LOAD ERROR] ${filename}:`, pluginError)
      global.conn?.logger?.error?.(`[PLUGIN LOAD ERROR] ${filename}: ${pluginError}`)
      delete global.plugins[filename]
    }
  }
}

await filesInit()
  .then((_) => Object.keys(global.plugins))
  .catch(console.error)

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) {
        global.conn?.logger?.info?.(`[UPDATED] ${filename}`) || console.log(`[UPDATED] ${filename}`)
      } else {
        global.conn?.logger?.warn?.(`[DELETED] ${filename}`) || console.warn(`[DELETED] ${filename}`)
        return delete global.plugins[filename]
      }
    } else {
      global.conn?.logger?.info?.(`[NEW PLUGIN] ${filename}`) || console.log(`[NEW PLUGIN] ${filename}`)
    }
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true
    })
    if (err) {
      global.conn?.logger?.error?.(`SYNTAX ERROR IN ${filename}\n${format(err)}`) || console.error(err)
    } else {
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
        global.plugins[filename] = module.default || module
      } catch (e) {
        global.conn?.logger?.error?.(`ERROR LOADING PLUGIN ${filename}\n${format(e)}`) || console.error(e)
      } finally {
        global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
      }
    }
  }
}
Object.freeze(global.reload)
watch(pluginFolder, global.reload)

let isInit = true
let handler = await import('./handler.js')

const safeOff = (ev, fn) => {
  if (fn && typeof fn === 'function' && global.conn?.ev) global.conn.ev.off(ev, fn)
}
const safeOn = (ev, fn) => {
  if (fn && typeof fn === 'function' && global.conn?.ev) global.conn.ev.on(ev, fn)
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin, qr } = update
  global.stopped = connection
  if (isNewLogin && global.conn) global.conn.isInit = true

  if (connection === 'connecting') {
    connectionOpen = false
    console.log(chalk.yellow('🔄 Connecting to WhatsApp...'))
  }

  if (connection === 'close' && !existsSync(path.join(sessionDir, 'creds.json'))) {
    if (!printingNoConn) {
      printingNoConn = true
      await logCritical(chalk.bold.redBright('⚠️ NO CONNECTION, DELETE PrototypeSession FOLDER AND SCAN QR CODE ⚠️'))
      setTimeout(() => {
        printingNoConn = false
      }, 1500)
    }
  }

  if ((qr != 0 && qr != undefined) || process.argv.includes('qr')) {
    console.log(chalk.bold.yellow('Scan QR Code with WhatsApp'))
  }

  if (connection === 'open') {
    connectionOpen = true
    authRejected = false
    console.log(chalk.green.bold('\n╭──────────────────────────────╮'))
    console.log(chalk.green.bold('│   🟢 ARTHUR BOT IS ONLINE     │'))
    console.log(chalk.green.bold('╰──────────────────────────────╯\n'))

    try {
      if (global.conn?.user?.id) {
        global.conn.mainBotNumber = global.conn.user.id
        global.conn.__mainBotNumber = global.conn.user.id
      }
    } catch {}

    setTimeout(reconnectSubBots, 5000)

    try {
      const restartFile = path.join(dataDir, 'restart.json')
      if (fs.existsSync(restartFile)) {
        let restartData = null
        try {
          restartData = JSON.parse(fs.readFileSync(restartFile, 'utf-8'))
        } catch {}

        if (restartData?.jid) {
          const restartText =
            restartData.message ||
            '*◇❐ ═━━╾ 🩸 ╼━━═ ❐◇*\n' +
              '*║ 🩸 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🩸*\n' +
              '*║ 🚀 تمت إعادة تشغيل النواة بنجاح*\n' +
              '*║ تم التشغيل والاتصال بالخادم ✅*\n' +
              '*◇❐ ═━━╾ 🩸 ╼━━═ ❐◇*'
          try {
            await global.conn.sendMessage(restartData.jid, { text: restartText })
          } catch (error) {
            console.error(chalk.yellow('⚠️ Restart notification failed:'), error?.message || error)
          }
        }

        try {
          fs.unlinkSync(restartFile)
        } catch {}
      }
    } catch (error) {
      console.error(chalk.yellow('⚠️ Restart-file processing failed:'), error?.message || error)
    }
  }

  if (connection === 'close') {
    connectionOpen = false
    const rawStatusCode =
      lastDisconnect?.error?.output?.statusCode ??
      lastDisconnect?.error?.data?.statusCode
    const statusCode = rawStatusCode == null ? null : Number(rawStatusCode)
    const errorMessage = lastDisconnect?.error?.message || ''
    const errorName = lastDisconnect?.error?.name || 'UnknownError'
    const closeReason = statusCode ?? errorMessage ?? 'UNKNOWN'
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

    console.log(chalk.red(`❌ Connection closed: code=${closeReason}, error=${errorName}, message=${errorMessage || 'n/a'}`))

    if (
      statusCode === DisconnectReason.loggedOut ||
      statusCode === 401 ||
      reason === DisconnectReason.loggedOut ||
      reason === DisconnectReason.badSession ||
      reason === DisconnectReason.connectionReplaced
    ) {
      connectionOpen = false
      authRejected = true
      console.log(chalk.red.bold('🚫 WhatsApp rejected or replaced this session (401 / loggedOut / badSession / connectionReplaced).'))
      console.log(chalk.yellow('🛡️ Saved authentication data was NOT deleted. Automatic reconnect is paused to avoid repeated pairing attempts.'))
      // A logged-out/401 session cannot be repaired by reconnecting in a loop.
      // Preserve the credentials for inspection/backup and wait for an explicit restart.
      try {
        if (currentAuthStore?.flush) await currentAuthStore.flush()
      } catch (saveError) {
        console.error(chalk.red('❌ Could not flush preserved auth state:'), saveError?.message || saveError)
      }
      return
    }

    if (reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost) {
      console.log(chalk.bold.magentaBright('Connection lost/closed, restoring backup...'))
      await restoreCreds()
    } else if (reason === DisconnectReason.badSession) {
      console.log(chalk.bold.cyanBright('Bad session, restarting...'))
    } else if (reason === DisconnectReason.connectionReplaced) {
      console.log(chalk.bold.yellowBright('Connection replaced'))
    } else if (reason === DisconnectReason.restartRequired) {
      console.log(chalk.bold.cyanBright('Restart required'))
    } else if (reason === DisconnectReason.timedOut) {
      console.log(chalk.bold.yellowBright('Connection timed out'))
    }

    if (isShuttingDown) {
      if (currentSock === global.conn) currentSock = null
      return
    }

    if (reconnectTimer) return

    if (currentSock === global.conn) {
      currentSock = null
      currentAuthStore = null
    }
    if (global.sock === global.conn) {
      global.sock = null
    }

    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null
      if (isShuttingDown) return
      if (currentSock && currentSock.ws && currentSock.ws.readyState === 1) return
      console.log(chalk.cyan('🔄 Restarting WhatsApp connection...'))
      await startBot().catch(console.error)
    }, RECONNECT_DELAY)
  }
}

global.reloadHandler = async function (restatConn, connectionOptions = null, authStore = null) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Handler && Object.keys(Handler).length) handler = Handler
  } catch (e) {
    console.error(e)
  }

  if (restatConn && global.conn && connectionOptions) {
    const oldChats = global.conn.chats
    try {
      global.conn.ws?.close?.()
    } catch {}
    global.conn.ev?.removeAllListeners?.()
    global.conn = makeWASocket(connectionOptions, { chats: oldChats })
    currentSock = global.conn
    global.sock = global.conn
    isInit = true
  }

  if (!isInit && global.conn) {
    safeOff('messages.upsert', global.conn.handler)
    safeOff('group-participants.update', global.conn.participantsUpdate)
    safeOff('groups.update', global.conn.groupsUpdate)
    safeOff('message.delete', global.conn.onDelete)
    safeOff('call', global.conn.onCall)
    safeOff('connection.update', global.conn.connectionUpdate)
    safeOff('creds.update', global.conn.credsUpdate)
  }

  if (!global.conn) return true

  global.conn.welcome = 'Welcome to the group!'
  global.conn.bye = 'Goodbye!'
  global.conn.spromote = 'في حد بقا ادمن'
  global.conn.sdemote = 'has been demoted from admin'
  global.conn.sDesc = 'Group description has been updated'
  global.conn.sSubject = 'Group name has been updated'
  global.conn.sIcon = 'Group icon has been updated'
  global.conn.sRevoke = 'Group link has been revoked'

  const saveCredsFn = authStore?.saveCreds || currentAuthStore?.saveCreds || (() => {})
  global.conn.handler = handler.handler.bind(global.conn)
  global.conn.participantsUpdate = handler.participantsUpdate.bind(global.conn)
  global.conn.groupsUpdate = handler.groupsUpdate.bind(global.conn)
  global.conn.onDelete = handler.deleteUpdate.bind(global.conn)
  global.conn.onCall = handler.callUpdate.bind(global.conn)
  global.conn.connectionUpdate = connectionUpdate.bind(global.conn)
  global.conn.credsUpdate = saveCredsFn.bind(global.conn, true)

  safeOn('messages.upsert', global.conn.handler)
  safeOn('group-participants.update', global.conn.participantsUpdate)
  safeOn('groups.update', global.conn.groupsUpdate)
  safeOn('message.delete', global.conn.onDelete)
  safeOn('call', global.conn.onCall)
  safeOn('connection.update', global.conn.connectionUpdate)
  safeOn('creds.update', global.conn.credsUpdate)

  isInit = false
  return true
}

// ============================================================
// START BOT
// ============================================================

async function startBot() {
  if (isStarting) {
    console.log(chalk.yellow('⚠️ Bot is already starting. Skipping duplicate start.'))
    return
  }
  if (isShuttingDown) {
    console.log(chalk.yellow('⚠️ Shutdown is in progress. Start cancelled.'))
    return
  }
  if (currentSock && currentSock.ws && currentSock.ws.readyState === 1) {
    console.log(chalk.yellow('⚠️ Existing socket is already connected. Skipping duplicate socket.'))
    return
  }

  isStarting = true
  connectionOpen = false
  clearReconnectTimer()

  try {
    if (!fs.existsSync(global.rutaJadiBot)) fs.mkdirSync(global.rutaJadiBot, { recursive: true })
    if (!fs.existsSync(respaldoDir)) fs.mkdirSync(respaldoDir, { recursive: true })
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

    const gold = chalk.hex('#D4AF37')
    const blood = chalk.hex('#B32632')
    console.log(gold('╔══════════════════════════════════════════════╗'))
    console.log(gold('║') + '       ' + blood.bold('♛  🩸  A R T H U R   B O T  🩸  ♛') + '       ' + gold('║'))
    console.log(gold('╟──────────────────────────────────────────────╢'))
    console.log(gold('║') + chalk.gray('              CORE SESSION INITIALIZING       ') + gold('║'))
    console.log(gold('╚══════════════════════════════════════════════╝\n'))

    // المسار الموحد: Baileys يكتب ملفات الاتصال محلياً هنا، وstart.js
    // يستعيدها من MongoDB ويزامن كل تغيّر إلى arthur_session_files.
    const authStore = await useMultiFileAuthState(sessionDir)

    currentAuthStore = authStore
    const { state, saveCreds } = authStore

    const msgRetryCounterMap = new Map()
    const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
    const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })

    let version
    try {
      const latestVersion = await fetchLatestBaileysVersion()
      version = latestVersion.version
      console.log(chalk.gray(`📦 Baileys Version: ${version.join('.')}`))
    } catch {
      console.log(chalk.yellow('⚠️ Could not fetch latest Baileys version. Using default.'))
      version = undefined
    }

    let phoneNumber = global.botNumberCode
    const methodCodeQR = process.argv.includes('qr')
    const methodCode = !!phoneNumber || process.argv.includes('code')
    const MethodMobile = process.argv.includes('mobile')

    let opcion
    if (methodCodeQR) opcion = '1'
    if (!methodCodeQR && !methodCode && !state.creds.registered && !existsSync(`./${global.authFile}/creds.json`)) {
      do {
        const lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》'
        opcion = await question(
          `╭${lineM}  \n┊ ${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}\n┊ ${chalk.blueBright('┊')} ${chalk.blue.bgBlue.bold.cyan('[ ARTHUR BOT SYSTEM ]')}\n┊ ${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}   \n┊ ${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}     \n┊ ${chalk.blueBright('┊')} ${chalk.green.bgMagenta.bold.yellow('SELECT CONNECTION METHOD')}\n┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright('=> Option 1:')} ${chalk.greenBright('QR Code')}\n┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright('=> Option 2:')} ${chalk.greenBright('Pair Code')}\n┊ ${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} \n╰${lineM}\n${chalk.bold.magentaBright('---> ')}`
        )
        if (!/^[1-2]$/.test(opcion)) console.log(chalk.bold.redBright('Invalid option, choose 1 or 2'))
      } while (opcion !== '1' && opcion !== '2')
    }

    const connectionOptions = {
      ...(version ? { version } : {}),
      logger: pino({ level: 'silent' }),
      printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
      mobile: MethodMobile,
      browser: opcion == '1' ? ['ARTHUR-BOT', 'Edge', '20.0.04'] : Browsers.windows('Chrome'),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'fatal' }).child({ level: 'fatal' }))
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      getMessage: async (key) => {
        try {
          const jid = jidNormalizedUser(key.remoteJid)
          const msg = await store.loadMessage(jid, key.id)
          return msg?.message || ''
        } catch {
          return ''
        }
      },
      msgRetryCounterCache: msgRetryCounterCache || new Map(),
      userDevicesCache: userDevicesCache || new Map(),
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      retryRequestDelayMs: 250,
      maxRetries: 5,
      cachedGroupMetadata: (jid) => global.conn?.chats?.[jid] ?? {}
    }

    global.conn = makeWASocket(connectionOptions)
    currentSock = global.conn
    global.sock = global.conn
    global.conn.isInit = false
    global.conn.well = false

    if (!state.creds.registered && (opcion === '2' || methodCode || process.env.PAIRING_NUMBER)) {
      opcion = '2'
      let addNumber = ''
      if (process.env.PAIRING_NUMBER) {
        addNumber = String(process.env.PAIRING_NUMBER).replace(/[^0-9]/g, '')
      } else if (phoneNumber) {
        addNumber = String(phoneNumber).replace(/[^0-9]/g, '')
      } else {
        do {
          phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright('📱 Enter your phone number (with country code): ')))
          phoneNumber = phoneNumber.replace(/\D/g, '')
          if (!phoneNumber.startsWith('+')) phoneNumber = `+${phoneNumber}`
        } while (!(await isValidPhoneNumber(phoneNumber)))
        addNumber = phoneNumber.replace(/\D/g, '')
      }

      if (addNumber) {
        setTimeout(async () => {
          try {
            if (isShuttingDown || authRejected || currentSock !== global.conn || state.creds.registered) return
            console.log(chalk.yellow('⏳ Waiting 5 seconds before requesting code...'))
            await delay(5000)
            console.log(chalk.yellow(`📤 Requesting pairing code for: ${addNumber}`))
            let codeBot = await global.conn.requestPairingCode(addNumber, 'ABCD1234')
            codeBot = codeBot?.match(/.{1,4}/g)?.join('-') || codeBot
            console.log('\n' + chalk.bold.white(chalk.bgMagenta('  PAIRING CODE  ')))
            console.log(chalk.bold.white(chalk.bgWhite(chalk.black(`  ${codeBot}  `))) + '\n')
            console.log(chalk.green('✅ Enter this code in WhatsApp: Settings > Linked Devices > Link a Device'))
          } catch (err) {
            console.log(chalk.bold.red('❌ Error getting pairing code:'), err?.message || err)
          }
        }, 5000)
      }
    }

    await global.reloadHandler(false, connectionOptions, authStore)

    if (global.gataJadibts) {
      const readRutaJadiBot = fs.readdirSync(global.rutaJadiBot)
      if (readRutaJadiBot.length > 0) {
        const creds = 'creds.json'
        for (const gjbts of readRutaJadiBot) {
          const botPath = path.join(global.rutaJadiBot, gjbts)
          if (fs.lstatSync(botPath).isDirectory()) {
            const readBotPath = fs.readdirSync(botPath)
            if (readBotPath.includes(creds)) {
              prototypeBot({
                pathGataJadiBot: botPath,
                m: null,
                conn: global.conn,
                args: '',
                usedPrefix: '/',
                command: 'serbot'
              })
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(chalk.red.bold('❌ Failed to start ARTHUR BOT:'), error?.stack || error?.message || error)
    if (!isShuttingDown && !reconnectTimer) {
      reconnectTimer = setTimeout(async () => {
        reconnectTimer = null
        if (isShuttingDown) return
        await startBot().catch(console.error)
      }, RECONNECT_DELAY)
    }
  } finally {
    isStarting = false
  }
}

// ============================================================
// INTERVALS, ERROR HANDLERS & GRACEFUL SHUTDOWN
// ============================================================

if (!opts['test']) {
  setInterval(async () => {
    if (global.db?.data) await global.db.save()
  }, 30 * 1000)
}

if (opts['server']) {
  ;(await import('./server.js')).default(global.conn, PORT)
}

setInterval(async () => {
  await backupCreds()
  console.log('[♻️] Periodic backup completed.')
}, 5 * 60 * 1000)

setTimeout(reconnectSubBots, 10000)
setInterval(reconnectSubBots, 1800000)

setInterval(async () => {
  if (global.stopped === 'close' || !global.conn || !global.conn.user) return
  await clearTmp()
  console.log(chalk.bold.cyanBright('[🧹] Temporary files cleaned'))
}, 1000 * 60 * 3)

// Authentication/pre-key files are intentionally not auto-pruned.
// Removing old keys without Baileys lifecycle knowledge can invalidate a session.

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('❌ Unhandled rejection:'), error?.stack || error?.message || error)
})

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught exception:'), error?.stack || error?.message || error)
})

async function gracefulShutdown(signal) {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(chalk.yellow(`\n🛑 ${signal} received. Shutting down ARTHUR BOT...`))

  clearReconnectTimer()
  try {
    clearInterval(liveClock)
  } catch {}

  try {
    await new Promise((resolve) => keepAliveServer.close(() => resolve()))
  } catch {}

  try {
    if (global.db?.data) await global.db.save()
  } catch {}

  try {
    if (currentAuthStore?.flush) await currentAuthStore.flush()
  } catch (error) {
    console.error(chalk.red('❌ Final MongoDB auth flush failed:'), error?.message || error)
  }

  try {
    if (currentSock?.ws && typeof currentSock.ws.close === 'function') {
      currentSock.ws.close()
    }
    currentSock = null
    if (global.sock) global.sock = null
  } catch {}

  console.log(chalk.green('✅ ARTHUR BOT shutdown complete.'))
  process.exit(0)
}

process.once('SIGINT', () => gracefulShutdown('SIGINT'))
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'))

_quickTest()
  .then(() => {
    console.log(chalk.bold('[🚀] Bot starting...'))
    return startBot()
  })
  .catch(console.error)

// Do not re-import the entire entry point on file changes: that would create
// duplicate sockets, timers and process listeners. Plugin/handler hot reload
// remains enabled through the existing plugin watcher and reloadHandler().