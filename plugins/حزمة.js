import axios from 'axios'
import crypto from 'crypto'
import https from 'https'
import JSZip from 'jszip'
import sharp from 'sharp'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import { downloadContentFromMessage, prepareWAMessageMedia } from '@whiskeysockets/baileys'

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
      const image = pin?.images?.orig?.url || pin?.images?.['736x']?.url
      const videos = pin?.videos?.video_list || pin?.video?.video_list || {}
      const video = videos?.V_720P?.url ||
        videos?.V_480P?.url ||
        videos?.V_EXP7?.url ||
        Object.values(videos).find(v => v?.url)?.url ||
        pin?.videos?.url ||
        null
      const key = video || image
      if (!key || seen.has(key)) continue
      seen.add(key)
      pins.push({ image, video })
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
// VIDEO / FFMPEG HELPERS
// Requires ffmpeg and ffprobe installed on the host.
// ================================================

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args])
    let stderr = ''
    child.stderr.on('data', d => { stderr += d.toString() })
    child.on('error', error => reject(new Error(
      error.code === 'ENOENT'
        ? 'FFmpeg غير مثبت. ثبّت ffmpeg على السيرفر أولًا.'
        : error.message
    )))
    child.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`فشل FFmpeg: ${stderr.slice(-700)}`))
    })
  })
}

async function downloadBuffer(url, maxBytes = 30 * 1024 * 1024) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxContentLength: maxBytes,
    headers: { 'User-Agent': HEADERS['user-agent'], referer: BASE + '/' }
  })
  const buffer = Buffer.from(response.data)
  if (buffer.length < 1000) throw new Error('الملف المحمّل غير صالح.')
  return buffer
}

async function videoToAnimatedWebp(input, output, seconds = 6) {
  await runFFmpeg([
    '-i', input,
    '-t', String(seconds),
    '-an',
    '-vf', 'fps=12,scale=512:512:force_original_aspect_ratio=increase,crop=512:512',
    '-loop', '0',
    '-vcodec', 'libwebp',
    '-lossless', '0',
    '-q:v', '55',
    '-compression_level', '4',
    '-preset', 'picture',
    output
  ])
  const result = await fs.promises.readFile(output)
  if (!result.length || result.length > 500 * 1024) {
    throw new Error('حجم الملصق المتحرك تجاوز الحد أو الملف فارغ.')
  }
  return result
}

async function extractQuotedVideo(m) {
  if (m.quoted?.download) {
    const data = await m.quoted.download()
    if (data?.length) return Buffer.from(data)
  }

  const raw = m.quoted?.message || m.msg?.contextInfo?.quotedMessage
  if (!raw) throw new Error('رد على فيديو أولًا باستخدام الأمر .صوتي')

  const unwrap = value => {
    if (!value) return null
    if (value.videoMessage) return value.videoMessage
    if (value.ephemeralMessage?.message) return unwrap(value.ephemeralMessage.message)
    if (value.viewOnceMessage?.message) return unwrap(value.viewOnceMessage.message)
    if (value.viewOnceMessageV2?.message) return unwrap(value.viewOnceMessageV2.message)
    if (value.documentWithCaptionMessage?.message) return unwrap(value.documentWithCaptionMessage.message)
    return null
  }

  const videoMessage = unwrap(raw)
  if (!videoMessage) throw new Error('الرسالة التي رددت عليها ليست فيديو.')

  const stream = await downloadContentFromMessage(videoMessage, 'video')
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  const buffer = Buffer.concat(chunks)
  if (!buffer.length) throw new Error('تعذر تحميل الفيديو.')
  return buffer
}

async function createSoundSticker(conn, jid, videoBuffer) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'arthur-sound-'))
  const input = path.join(dir, 'input.mp4')
  const webpPath = path.join(dir, 'sticker.webp')
  const audioPath = path.join(dir, 'audio.ogg')

  try {
    await fs.promises.writeFile(input, videoBuffer)
    await videoToAnimatedWebp(input, webpPath, 7)

    await runFFmpeg([
      '-i', input,
      '-t', '7',
      '-vn',
      '-ac', '1',
      '-ar', '48000',
      '-c:a', 'libopus',
      '-b:a', '64k',
      '-application', 'voip',
      '-f', 'ogg',
      audioPath
    ])

    const sticker = await fs.promises.readFile(webpPath)
    const audio = await fs.promises.readFile(audioPath)
    if (!audio.length) throw new Error('الفيديو لا يحتوي على صوت.')

    const upload = conn.waUploadToServer
    if (typeof upload !== 'function') {
      throw new Error('waUploadToServer غير متاحة في اتصال Baileys.')
    }

    const stickerPrepared = await prepareWAMessageMedia(
      { sticker, mimetype: 'image/webp' },
      { upload: upload.bind(conn) }
    )
    const audioPrepared = await prepareWAMessageMedia(
      { audio, mimetype: 'audio/ogg; codecs=opus', ptt: true },
      { upload: upload.bind(conn) }
    )

    const stickerMessage = stickerPrepared?.stickerMessage
    const audioMessage = audioPrepared?.audioMessage
    if (!stickerMessage || !audioMessage) {
      throw new Error('تعذر تجهيز وسائط ملصق الصوت.')
    }

    stickerMessage.isAnimated = true
    stickerMessage.audioMessage = audioMessage

    await conn.relayMessage(jid, {
      audioStickerMessage: stickerMessage
    }, {
      messageId: crypto.randomBytes(10).toString('hex')
    })

    return true
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
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

async function createStickerArchive(stickers, tray, animated = false) {
  const zip = new JSZip()
  const metadata = []

  for (let i = 0; i < stickers.length; i++) {
    const fileName = `sticker_${String(i + 1).padStart(3, '0')}.webp`

    zip.file(fileName, stickers[i])

    metadata.push({
      fileName,
      isAnimated: animated,
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

async function sendStickerPack(conn, jid, query, stickers, animated = false) {
  const tray = await makeTray(stickers[0])

  const { archive, metadata } = await createStickerArchive(
    stickers,
    tray,
    animated
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
  let query = text?.trim()
  const twoWordAnimated = command === 'حزمة' && /^متحركة(?:\\s+|$)/i.test(query || '')
  if (twoWordAnimated) query = query.replace(/^متحركة\\s*/i, '').trim()
  const react = async emoji => {
    try {
      await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
    } catch {}
  }

  if (/^صوتي$/i.test(command)) {
    await react('⏳')
    try {
      const video = await extractQuotedVideo(m)
      await createSoundSticker(conn, m.chat, video)
      await react('✅')
      return m.reply('╭━━〔 🔊 ARTHUR SOUND 〕━━╮\n│ تم إرسال ملصق متحرك بالصوت\n│ ARTHUR BOT\n╰━━━━━━━━━━━━━━━━━━╯')
    } catch (error) {
      console.error('[ARTHUR SOUND ERROR]', error)
      await react('❌')
      return m.reply(`❌ تعذر إنشاء ملصق الصوت.\nالسبب: ${error.message}`)
    }
  }

  const animated = twoWordAnimated || /^(حزمةمتحركة|متحركة|انميشن|animatedpack)$/i.test(command)
  if (!query) {
    return m.reply(
      `╭━━〔 📦 ARTHUR PACK 〕━━╮\n` +
      `│ ثابت: ${usedPrefix}حزمة ناروتو\n` +
      `│ متحرك: ${usedPrefix}حزمةمتحركة ناروتو\n` +
      `│ صوت: رد على فيديو بـ ${usedPrefix}صوتي\n` +
      `│ العدد: حتى 30 ملصقًا\n` +
      `│ المصدر: Pinterest\n` +
      `╰━━━━━━━━━━━━━━━━━━╯`
    )
  }
  if (query.length > 70) return m.reply('❌ اسم الحزمة طويل جدًا.')

  await react('⏳')
  try {
    await enqueue(async () => {
      await m.reply(
        `🔍 البحث عن: ${query}\n` +
        `${animated ? '🎞️ البحث عن فيديوهات قابلة للتحويل...' : '📦 تجهيز حزمة واتساب الأصلية...'}\n` +
        `⏳ يرجى الانتظار.`
      )

      const pins = await searchPinterest(query)
      if (!pins.length) throw new Error('لم يتم العثور على نتائج.')

      const stickers = []
      for (const pin of pins) {
        try {
          let sticker
          if (animated) {
            if (!pin.video) continue
            const videoBuffer = await downloadBuffer(pin.video)
            const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'arthur-pack-'))
            try {
              const input = path.join(dir, 'pin.mp4')
              const output = path.join(dir, 'pin.webp')
              await fs.promises.writeFile(input, videoBuffer)
              sticker = await videoToAnimatedWebp(input, output, 6)
            } finally {
              await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {})
            }
          } else {
            if (!pin.image) continue
            const image = await downloadImage(pin.image)
            sticker = await makeSticker(image)
          }
          if (sticker.length > 100 * 1024) continue
          stickers.push(sticker)
        } catch (error) {
          console.error('[PACK ITEM]', error.message)
        }
        if (stickers.length >= LIMIT) break
      }

      if (!stickers.length) {
        throw new Error(animated
          ? 'لم أجد فيديوهات Pinterest صالحة للتحويل. جرّب اسمًا آخر.'
          : 'فشل تحويل الصور إلى ملصقات.')
      }

      const count = await sendStickerPack(conn, m.chat, query, stickers, animated)
      await react('✅')
      await m.reply(
        `╭━━〔 👑 ARTHUR PACK 〕━━╮\n` +
        `│ ✅ تم إرسال الحزمة\n` +
        `│ 🎨 الاسم: ${query}\n` +
        `│ 🖼️ الملصقات: ${count}\n` +
        `│ 🎞️ النوع: ${animated ? 'متحركة' : 'ثابتة'}\n` +
        `│ 📦 حزمة واتساب أصلية\n` +
        `│ ✨ ARTHUR BOT\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`
      )
    })
  } catch (error) {
    console.error('[ARTHUR PACK ERROR]', error)
    await react('❌')
    await m.reply(`❌ تعذر إنشاء الحزمة.\nالسبب: ${error.message}`)
  }
}

handler.help = ['حزمة <اسم>', 'حزمةمتحركة <اسم>', 'صوتي (رد على فيديو)']
handler.tags = ['downloader']
handler.command = /^(حزمة|حزمةمتحركة|متحركة|انميشن|animatedpack|صوتي|pack|ستيكرات)$/i

export default handler