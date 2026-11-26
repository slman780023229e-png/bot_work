import axios from 'axios'
import crypto from 'crypto'
import https from 'https'
import JSZip from 'jszip'
import sharp from 'sharp'

// ARTHUR BOT - Native WhatsApp Sticker Pack
// Baileys 7.0.0-rc14

const BASE = 'https://www.pinterest.com'
const SEARCH_PATH = '/resource/BaseSearchResource/get/'
const LIMIT = 30
const MAX_QUEUE = 5

const HEADERS = {
  accept: 'application/json, text/javascript, */*, q=0.01',
  referer: BASE + '/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'x-app-version': 'a9522f',
  'x-pinterest-appstate': 'active',
  'x-pinterest-pws-handler': 'www/[username]/[slug].js',
  'x-requested-with': 'XMLHttpRequest'
}

let cookieCache = null
let cookieTime = 0
const queue = []
let running = false

// ================================================
// QUEUE
// ================================================

function enqueue(task) {
  return new Promise((resolve, reject) => {
    if (queue.length >= MAX_QUEUE) {
      return reject(new Error('طابور إنشاء الحزم ممتلئ، حاول لاحقًا.'))
    }

    queue.push({ task, resolve, reject })
    processQueue()
  })
}

async function processQueue() {
  if (running || !queue.length) return

  running = true
  const item = queue.shift()

  try {
    item.resolve(await item.task())
  } catch (error) {
    item.reject(error)
  } finally {
    running = false
    setImmediate(processQueue)
  }
}

// ================================================
// PINTEREST
// ================================================

async function getCookies() {
  if (cookieCache && Date.now() - cookieTime < 300000) {
    return cookieCache
  }

  try {
    const response = await axios.get(BASE, {
      headers: HEADERS,
      timeout: 15000
    })

    const cookies = response.headers['set-cookie']
    if (!cookies?.length) return null

    cookieCache = cookies.map(c => c.split(';')[0]).join('; ')
    cookieTime = Date.now()

    return cookieCache
  } catch {
    return cookieCache
  }
}

async function searchPinterest(query) {
  const cookies = await getCookies()
  if (!cookies) throw new Error('تعذر الاتصال بـ Pinterest.')

  const pins = []
  const seen = new Set()
  let bookmark = ''

  for (let page = 0; page < 8 && pins.length < LIMIT; page++) {
    const params = {
      source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
      data: JSON.stringify({
        options: {
          isPrefetch: false,
          query,
          scope: 'pins',
          bookmarks: [bookmark],
          page_size: 50
        },
        context: {}
      }),
      _: Date.now()
    }

    const response = await axios.get(BASE + SEARCH_PATH, {
      params,
      headers: { ...HEADERS, cookie: cookies },
      timeout: 20000
    })

    const resource = response.data?.resource_response
    const results = resource?.data?.results || []

    for (const pin of results) {
      const url = pin?.images?.orig?.url ||
        pin?.images?.['736x']?.url

      if (!url || seen.has(url)) continue

      seen.add(url)
      pins.push(url)

      if (pins.length >= LIMIT) break
    }

    const next = resource?.bookmark
    if (!next || next === '-end-' || next === bookmark) break

    bookmark = next
  }

  return pins
}

// ================================================
// DOWNLOAD
// ================================================

async function downloadImage(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 20000,
    maxContentLength: 15 * 1024 * 1024,
    headers: {
      'User-Agent': HEADERS['user-agent'],
      referer: BASE + '/'
    }
  })

  const buffer = Buffer.from(response.data)

  if (buffer.length < 1000) {
    throw new Error('صورة غير صالحة')
  }

  const metadata = await sharp(buffer).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('صيغة الصورة غير مدعومة')
  }

  return buffer
}

// ================================================
// IMAGE CONVERSION
// ================================================

// كل ملصق مربع 512x512
// الصورة تملأ كامل المساحة بدون هوامش
// يتم قص الزوائد للحفاظ على الشكل المربع

async function makeSticker(buffer) {
  return sharp(buffer, {
    animated: false,
    limitInputPixels: 40000000
  })
    .rotate()
    .resize(512, 512, {
      fit: 'cover',
      position: 'attention',
      withoutEnlargement: false,
      kernel: 'lanczos3'
    })
    .webp({
      quality: 65,
      effort: 5,
      smartSubsample: true,
      alphaQuality: 100
    })
    .toBuffer()
}

// ================================================
// TRAY + THUMBNAIL
// ================================================

async function makeTray(buffer) {
  return sharp(buffer)
    .rotate()
    .resize(96, 96, {
      fit: 'cover',
      position: 'attention'
    })
    .webp({ quality: 75 })
    .toBuffer()
}

async function makeThumbnail(buffer) {
  return sharp(buffer)
    .resize(252, 252, {
      fit: 'cover',
      position: 'attention'
    })
    .jpeg({ quality: 80 })
    .toBuffer()
}

// ================================================
// CRYPTO
// ================================================

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest()
}

function base64url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function encryptMedia(buffer, mediaKey, hkdfInfo) {
  const expanded = Buffer.from(
    crypto.hkdfSync(
      'sha256',
      mediaKey,
      Buffer.alloc(32),
      Buffer.from(hkdfInfo),
      112
    )
  )

  const iv = expanded.subarray(0, 16)
  const cipherKey = expanded.subarray(16, 48)
  const macKey = expanded.subarray(48, 80)

  const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv)

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ])

  const mac = crypto.createHmac('sha256', macKey)
    .update(iv)
    .update(encrypted)
    .digest()
    .subarray(0, 10)

  const encryptedBuffer = Buffer.concat([encrypted, mac])

  return {
    encryptedBuffer,
    fileSha256: sha256(buffer),
    fileEncSha256: sha256(encryptedBuffer)
  }
}

// ================================================
// WHATSAPP UPLOAD
// ================================================

async function uploadMedia(conn, buffer, mediaPath, hkdfInfo) {
  if (typeof conn.query !== 'function') {
    throw new Error('Baileys query API غير متاحة.')
  }

  const mediaKey = crypto.randomBytes(32)
  const encrypted = encryptMedia(buffer, mediaKey, hkdfInfo)

  const iq = await conn.query({
    tag: 'iq',
    attrs: {
      id: conn.generateMessageTag?.() || Date.now().toString(),
      to: 's.whatsapp.net',
      type: 'set',
      xmlns: 'w:m'
    },
    content: [{ tag: 'media_conn', attrs: {} }]
  })

  const mediaConn = iq.content?.find(v => v.tag === 'media_conn')

  if (!mediaConn) throw new Error('Media Connection غير متاحة.')

  const auth = mediaConn.attrs?.auth
  if (!auth) throw new Error('رمز الرفع غير موجود.')

  const hosts = (mediaConn.content || [])
    .filter(v => v.tag === 'host')
    .map(v => v.attrs?.hostname)
    .filter(Boolean)

  if (!hosts.length) throw new Error('خوادم الرفع غير متاحة.')

  const token = base64url(encrypted.fileEncSha256)

  for (const host of hosts) {
    try {
      const url = new URL(
        `https://${host}${mediaPath}/${token}?auth=${encodeURIComponent(auth)}&token=${token}`
      )

      const result = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: url.hostname,
          port: 443,
          path: url.pathname + url.search,
          method: 'POST',
          timeout: 60000,
          headers: {
            Origin: 'https://web.whatsapp.com',
            Referer: 'https://web.whatsapp.com/',
            'Content-Type': 'application/octet-stream',
            'Content-Length': encrypted.encryptedBuffer.length
          }
        }, response => {
          const chunks = []

          response.on('data', chunk => chunks.push(chunk))

          response.on('end', () => {
            const body = Buffer.concat(chunks).toString()

            if (response.statusCode < 200 || response.statusCode >= 300) {
              return reject(new Error(`Upload HTTP ${response.statusCode}`))
            }

            try {
              resolve(JSON.parse(body))
            } catch {
              reject(new Error('استجابة الرفع غير صالحة.'))
            }
          })
        })

        req.on('timeout', () => req.destroy(new Error('Upload timeout')))
        req.on('error', reject)
        req.end(encrypted.encryptedBuffer)
      })

      const directPath =
        result.direct_path ||
        result.directPath ||
        result.path

      if (!directPath) continue

      return {
        mediaKey,
        fileLength: buffer.length,
        fileSha256: encrypted.fileSha256,
        fileEncSha256: encrypted.fileEncSha256,
        directPath
      }
    } catch (error) {
      console.error('[ARTHUR UPLOAD]', error.message)
    }
  }

  throw new Error('فشل رفع الوسائط إلى واتساب.')
}

// ================================================
// CREATE STICKER ARCHIVE + TRAY ICON
// ================================================

async function createStickerArchive(stickers, tray) {
  const zip = new JSZip()
  const metadata = []

  for (let i = 0; i < stickers.length; i++) {
    const fileName = `sticker_${String(i + 1).padStart(3, '0')}.webp`

    zip.file(fileName, stickers[i])

    metadata.push({
      fileName,
      isAnimated: false,
      emojis: ['✨'],
      accessibilityLabel: '',
      isLottie: false,
      mimetype: 'image/webp'
    })
  }

  zip.file('tray_icon.webp', tray)

  const archive = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'STORE'
  })

  return { archive, metadata }
}

// ================================================
// NATIVE WHATSAPP PACK
// ================================================

async function sendStickerPack(conn, jid, query, stickers) {
  const tray = await makeTray(stickers[0])

  const { archive, metadata } = await createStickerArchive(
    stickers,
    tray
  )

  const thumbnail = await makeThumbnail(tray)

  const packUpload = await uploadMedia(
    conn,
    archive,
    '/mms/sticker-pack',
    'WhatsApp Sticker Pack Keys'
  )

  const thumbUpload = await uploadMedia(
    conn,
    thumbnail,
    '/mms/thumbnail-sticker-pack',
    'WhatsApp Sticker Pack Thumbnail Keys'
  )

  const packId = 'ARTHUR_' + crypto.randomUUID()

  const message = {
    messageContextInfo: {
      messageSecret: crypto.randomBytes(32)
    },
    stickerPackMessage: {
      stickerPackId: packId,
      name: `ARTHUR | ${query}`,
      publisher: 'ARTHUR BOT - Evernight',
      packDescription: `حزمة ${query} - ${stickers.length} ملصق`,
      stickers: metadata,

      fileLength: packUpload.fileLength,
      fileSha256: packUpload.fileSha256,
      fileEncSha256: packUpload.fileEncSha256,
      mediaKey: packUpload.mediaKey,
      directPath: packUpload.directPath,

      mediaKeyTimestamp: Math.floor(Date.now() / 1000),
      stickerPackSize: packUpload.fileLength,
      stickerPackOrigin: 2,

      trayIconFileName: 'tray_icon.webp',

      thumbnailDirectPath: thumbUpload.directPath,
      thumbnailSha256: thumbUpload.fileSha256,
      thumbnailEncSha256: thumbUpload.fileEncSha256,
      thumbnailHeight: 252,
      thumbnailWidth: 252,
      imageDataHash: thumbUpload.fileSha256.toString('base64')
    }
  }

  if (typeof conn.relayMessage !== 'function') {
    throw new Error('relayMessage غير متاحة.')
  }

  await conn.relayMessage(jid, message, {
    messageId: crypto.randomBytes(10).toString('hex')
  })

  return stickers.length
}

// ================================================
// HANDLER
// ================================================

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const query = text?.trim()

  const react = async emoji => {
    try {
      await conn.sendMessage(m.chat, {
        react: {
          text: emoji,
          key: m.key
        }
      })
    } catch {}
  }

  if (!query) {
    return m.reply(
      `╭━━〔 📦 ARTHUR PACK 〕━━╮\n` +
      `│ الاستخدام: ${usedPrefix + command} ناروتو\n` +
      `│ العدد: 30 ملصقًا\n` +
      `│ المصدر: Pinterest\n` +
      `│ النوع: WhatsApp Sticker Pack\n` +
      `╰━━━━━━━━━━━━━━━━━━╯`
    )
  }

  if (query.length > 70) {
    return m.reply('❌ اسم الحزمة طويل جدًا.')
  }

  await react('⏳')

  try {
    await enqueue(async () => {
      await m.reply(
        `🔍 البحث عن: ${query}\n` +
        `📦 تجهيز حزمة واتساب الأصلية...\n` +
        `⏳ يرجى الانتظار.`
      )

      const images = await searchPinterest(query)

      if (!images.length) {
        throw new Error('لم يتم العثور على صور.')
      }

      const stickers = []

      for (const url of images) {
        try {
          const image = await downloadImage(url)
          const sticker = await makeSticker(image)

          if (sticker.length > 100 * 1024) continue

          stickers.push(sticker)
        } catch (error) {
          console.error('[PACK IMAGE]', error.message)
        }

        if (stickers.length >= LIMIT) break
      }

      if (!stickers.length) {
        throw new Error('فشل تحويل الصور إلى ملصقات.')
      }

      const count = await sendStickerPack(
        conn,
        m.chat,
        query,
        stickers
      )

      await react('✅')

      await m.reply(
        `╭━━〔 👑 ARTHUR PACK 〕━━╮\n` +
        `│ ✅ تم إرسال الحزمة\n` +
        `│ 🎨 الاسم: ${query}\n` +
        `│ 🖼️ الملصقات: ${count}\n` +
        `│ 📦 حزمة واتساب أصلية\n` +
        `│ ✨ ARTHUR BOT\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`
      )
    })
  } catch (error) {
    console.error('[ARTHUR PACK ERROR]', error)

    await react('❌')

    await m.reply(
      `❌ تعذر إنشاء الحزمة.\nالسبب: ${error.message}`
    )
  }
}

handler.help = ['حزمة']
handler.tags = ['downloader']
handler.command = /^(حزمة|pack|ستيكرات)$/i

export default handler