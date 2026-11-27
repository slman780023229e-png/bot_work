// plugins/انمي.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - انمي - بس حلقات 20 دقيقة وفوق + بالترتيب ✅

import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import { unlinkSync, existsSync, statSync, writeFileSync, copyFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import ffmpegStatic from 'ffmpeg-static'
import {
  proto,
  generateWAMessageFromContent,
  generateWAMessageContent,
} from "@whiskeysockets/baileys"
import { theme } from '../core/theme.js'

const execAsync = promisify(exec)
const API_KEY = "ak_live_SRXV4CfsgQtwnkjI0OhicCphe6MVOoan9sySwz-PyrM"
const SEARCH_API = "https://apidirect.io/v1/facebook/videos"
const DOWNLOAD_API = "https://fdown.isuru.eu.org/download"

const cache = new Map()
const searchCache = new Map()
const CACHE_TIME = 20 * 60 * 1000
const MIN_DURATION = 20 * 60 // 20 دقيقة = 1200 ثانية - اقل من كذا ما نجيبه

function cleanName(name) {
    return String(name || "Facebook").replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim().slice(0, 80)
}
function makeID(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6)
}
function cleanCache() {
    const now = Date.now()
    for (const [k, v] of cache) if (!v || now - v.time > CACHE_TIME) cache.delete(k)
    for (const [k, v] of searchCache) if (!v || now - v.time > CACHE_TIME) searchCache.delete(k)
}

function getFacebookURL(video) {
    return video.url || video.video_url || video.videoUrl || video.link || video.permalink || video.permalink_url || null
}
function getTitle(video) { return video.title || video.name || video.description || video.caption || "حلقة" }
function getAuthor(video) { return video.author?.name || video.author?.username || video.author || video.page_name || video.publisher || "Facebook" }
function getAuthorId(video) {
    return video.author?.id || video.author?.username || video.page_id || video.publisher_id || getAuthor(video)
}
function getCover(video) {
    return video.thumbnail || video.cover || video.image || video.picture || video.thumbnail_url || video.cover_url ||
           video.author?.picture || video.author?.avatar || video.page_picture || null
}
function getPageCover(video) {
    return video.author?.picture || video.author?.avatar || video.page_picture || video.author?.cover || getCover(video)
}
function getDate(video) {
    let d = video.created_time || video.created_at || video.published_at || video.publish_time || video.timestamp || video.date || null
    if (!d) return "غير معروف"
    try {
        let date = new Date(d)
        if (isNaN(date.getTime())) return String(d).slice(0, 10)
        return date.toISOString().slice(0, 10)
    } catch { return String(d).slice(0, 10) }
}

// ===== مدة الفيديو - بكل الصيغ اللي يرسلها الفيس =====
function getDuration(video) {
    let d = video.duration ?? video.duration_seconds ?? video.durationSeconds ?? video.length ?? video.video_duration ?? video.videoDuration ?? video.play_time ?? video.playtime ?? null
    // اذا المدة نص مثل "21:30" او "20:05"
    if (typeof d === 'string') {
        if (d.includes(':')) {
            let parts = d.split(':').map(x => parseInt(x) || 0)
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
            if (parts.length === 2) return parts[0] * 60 + parts[1]
            return parseInt(d) || 0
        }
        return parseInt(d) || 0
    }
    if (typeof d === 'number') return d
    // اذا المدة داخل object
    if (d && typeof d === 'object') return d.seconds || d.duration || 0
    return 0 // 0 = ما نعرف المدة
}

function formatDuration(sec) {
    if (!sec) return "غير معروف"
    let m = Math.floor(sec / 60)
    let s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

function getEpisodeNumber(title) {
    let t = String(title)
    let m1 = t.match(/(?:الحلقة|الحلقه|حلقة|حلقه|EP|Ep|Episode)\s*[:\-_#]?\s*(\d+)/i)
    if (m1) return parseInt(m1[1])
    let m2 = t.match(/(\d+)\s*$/)
    if (m2) return parseInt(m2[1])
    let m3 = t.match(/^\s*(\d+)\s*[-|:.]/)
    if (m3) return parseInt(m3[1])
    let m4 = t.match(/(\d+)/)
    if (m4) return parseInt(m4[1])
    return 9999
}

async function searchOneFast(query, page = 1) {
    try {
        const res = await axios.get(SEARCH_API, {
            params: { query, page },
            timeout: 10000,
            headers: { "X-API-Key": API_KEY, Accept: "application/json", "User-Agent": "YUNO-BOT/1.0" }
        })
        const data = res.data
        return data?.videos || data?.results || data?.data || []
    } catch { return [] }
}

// ===== بحث سريع + فلتر 20 دقيقة =====
async function searchWideFast(query) {
    let key = query.toLowerCase().trim()
    if (searchCache.has(key)) {
        let c = searchCache.get(key)
        if (Date.now() - c.time < CACHE_TIME) return c.videos
    }

    // نبحث بـ 4 صيغ مع بعض، وكل صيغة صفحتين، عشان بعد الفلتر يبقى عندنا حلقات كفاية
    let tries = [
        `${query} حلقة`,
        `${query} انمي`,
        query,
        `${query} مدبلج`,
    ]
    // نجيب صفحتين لكل صيغة - عشان نعوض اللي بنشيله بالفلتر
    let allPromises = []
    for (let q of tries) {
        allPromises.push(searchOneFast(q, 1))
        allPromises.push(searchOneFast(q, 2))
    }
    let results = await Promise.all(allPromises)

    let all = []
    let seen = new Set()
    for (let res of results) {
        for (let v of res) {
            let url = getFacebookURL(v)
            if (!url || seen.has(url)) continue

            // ===== فلتر المدة - اهم شي =====
            let dur = getDuration(v)
            // اذا المدة معروفة واقل من 20 دقيقة، نتخطاه - هذا ريلز او مقطع قصير
            if (dur > 0 && dur < MIN_DURATION) continue
            // اذا المدة 0 يعني API ما اعطانا مدة، نفحص العنوان: اذا فيه reel او ريلز او مقطع قصير، نتخطاه
            let titleLow = String(getTitle(v)).toLowerCase()
            if (dur === 0 && (titleLow.includes('reel') || titleLow.includes('ريلز') || titleLow.includes('short') || titleLow.includes('مقطع قصير') || titleLow.includes('#reels'))) continue
            // اذا المدة 0 وما فيه دليل انه قصير، نخليه - عشان ما نخسر حلقات
            // بس نعطيه مدة افتراضية 20 دقيقة عشان يبين في القائمة
            if (dur === 0) v._durationGuess = 20 * 60

            seen.add(url)
            all.push(v)
        }
    }

    // نرتب بالمدة؟ لا، نرتب برقم الحلقة بعدين، بس هنا نرتب مبدئياً
    searchCache.set(key, { time: Date.now(), videos: all.slice(0, 60) })
    return all.slice(0, 60)
}

async function get480Quality(url) {
    try {
        const res = await axios.post(DOWNLOAD_API, { url }, {
            timeout: 20000,
            headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "YUNO-BOT/1.0" }
        })
        const data = res.data
        if (data?.status === "error") return null
        let qualities = []
        const links = data?.links
        if (links && typeof links === "object") {
            for (const [key, val] of Object.entries(links)) {
                if (val && typeof val === "string") {
                    let k = String(key).toLowerCase()
                    let priority = 10
                    if (k.includes("480") || k.includes("sd")) priority = 1
                    else if (k.includes("360") || k.includes("low") || k.includes("normal")) priority = 2
                    else if (k.includes("720") || k.includes("hd")) priority = 3
                    else if (k.includes("240") || k.includes("144")) priority = 4
                    else if (k.includes("1080")) priority = 5
                    else priority = 6
                    qualities.push({ name: key, url: val, priority })
                }
            }
        }
        const mainUrl = data?.download_url || data?.downloadUrl || data?.url || data?.video_url
        if (mainUrl && !qualities.some(q => q.url === mainUrl)) qualities.push({ name: "480p", url: mainUrl, priority: 2 })
        qualities.sort((a, b) => a.priority - b.priority)
        return qualities.length ? { ...qualities[0], name: qualities[0].priority === 1 ? "480p" : qualities[0].name } : null
    } catch { return null }
}

async function remuxOnly(inputPath, outputPath) {
   const ffmpegPath = ffmpegStatic
   if (!ffmpegPath || !existsSync(ffmpegPath)) return false
   try {
      await execAsync(`"${ffmpegPath}" -y -v error -i "${inputPath}" -c copy -movflags +faststart "${outputPath}"`, { timeout: 30000 })
      if (existsSync(outputPath) && statSync(outputPath).size > 10000) return true
   } catch { try { if (existsSync(outputPath)) unlinkSync(outputPath) } catch {} }
   return false
}

async function getImageBuffer(url) {
    if (!url) return null
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } })
        let buf = Buffer.from(res.data)
        if (buf.length < 5000) return null
        return buf
    } catch { return null }
}

async function sendPageWithNext(conn, m, chatData, offset) {
    let episodes = chatData.episodes
    let page = chatData.bestPage
    let chunk = episodes.slice(offset, offset + 12)
    let hasNext = offset + 12 < episodes.length
    let pageNum = Math.floor(offset / 12) + 1
    let totalPages = Math.ceil(episodes.length / 12)

    let menuText = `*╭━〔⚡𝐀𝐑𝐓𝐇𝐔𝐑 𝐒𝐘𝐒𝐓𝐄𝐌〕━╮*\n*┃*\n*┃ 🍥 الانمي :* ${page.animeName}\n*┃ 👤 الصفحة :* ${page.author}\n*┃ ✅ افضل صفحة :* ${page.count} حلقة\n*┃ ⏱️ المدة :* 20 دقيقة وفوق\n*┃ 📊 الحلقات :* ${episodes.length} حلقة\n*┃ 📄 الصفحة :* ${pageNum}/${totalPages}\n*┃ 📅 اخر حلقة :* ${episodes[episodes.length - 1]?.date}\n*┃*\n*◇❐ ═━╾ 🩸 ╼━═ ❐◇*\n\n`
    menuText += chunk.map(item => {
        let epLabel = item.epNum === 9999 ? item.title : `الحلقة ${item.epNum}`
        return `*🍥 ${epLabel}*\n📝 ${item.title}\n⏱️ ${item.durationText} | 📅 ${item.date} | 👤 ${item.author}`
    }).join("\n\n") + `\n\n👇 *اضغط على الحلقة اللي تبيها، او التالي:*`

    let coverBuffer = null
    if (offset === 0) coverBuffer = await getImageBuffer(page.cover)

    let firstChunk = chunk.slice(0, 9)
    let buttons1 = firstChunk.map(item => {
        let epLabel = item.epNum === 9999 ? item.title.slice(0, 20) : `الحلقة ${item.epNum}`
        return { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: `🍥 ${epLabel}`, id: `.انمي ${item.id}` }) }
    })
    let headerObj = {}
    if (coverBuffer) {
        const { imageMessage } = await generateWAMessageContent({ image: coverBuffer }, { upload: conn.waUploadToServer })
        if (imageMessage) headerObj = { hasMediaAttachment: true, imageMessage }
    }
    const msg1 = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.create({ text: menuText }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: global.watermark || '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡' }),
            header: proto.Message.InteractiveMessage.Header.fromObject(headerObj),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: buttons1 })
        })}}
    }, { quoted: m })
    await conn.relayMessage(m.chat, msg1.message, { messageId: msg1.key.id })

    let restChunk = chunk.slice(9, 12)
    let buttons2 = restChunk.map(item => {
        let epLabel = item.epNum === 9999 ? item.title.slice(0, 20) : `الحلقة ${item.epNum}`
        return { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: `🍥 ${epLabel}`, id: `.انمي ${item.id}` }) }
    })
    if (offset > 0) buttons2.push({ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⬅️ السابق", id: `.انمي prev_${offset}` }) })
    if (hasNext) buttons2.push({ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⏭️ التالي", id: `.انمي next_${offset + 12}` }) })

    if (buttons2.length) {
        let menu2 = `*╭━〔⚡𝐀𝐑𝐓𝐇𝐔𝐑 𝐒𝐘𝐒𝐓𝐄𝐌〕━╮*\n*┃*\n*┃ 🍥 تكملة - ${page.animeName} - صفحة ${pageNum}/${totalPages}*\n*┃*\n*◇❐ ═━╾ 🩸 ╼━═ ❐◇*\n\n👇 *باقي الحلقات + التالي:*`
        const msg2 = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                body: proto.Message.InteractiveMessage.Body.create({ text: menu2 }),
                footer: proto.Message.InteractiveMessage.Footer.create({ text: global.watermark || '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡' }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: buttons2 })
            })}}
        }, { quoted: m })
        await conn.relayMessage(m.chat, msg2.message, { messageId: msg2.key.id })
    }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const react = async (emoji) => {
    try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
  }

  if (!text) {
    return m.reply(theme.build([
      { type: 'title', text: '🍥 انمي من Facebook - ARTHUR BOT' },
      { type: 'divider' },
      { type: 'info', label: '🍥 بحث', value: `${usedPrefix + command} <اسم الانمي>` },
      { type: 'info', label: 'مثال', value: `${usedPrefix + command} ناروتو شيبودن` },
      { type: 'info', label: 'الطريقة', value: 'ابحث > 12 حلقة 20 دقيقة وفوق + التالي > اضغط الحلقة' },
    ]))
  }

  cleanCache()

  if (text.startsWith('ep_')) {
    const old = cache.get(m.chat)
    const selected = old?.episodes?.find(x => x.id === text)
    if (!selected) return m.reply('❌ الحلقة انتهت، ابحث من جديد\n.انمي ناروتو')
    await react('⏳')
    await m.reply('🔍 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 يبحث عن الفيديوهات...')
    try {
      let q = await get480Quality(selected.url)
      if (!q) throw new Error('ما لقيت جودة')
      const rawPath = join(tmpdir(), `anime_raw_${Date.now()}.mp4`)
      const finalPath = join(tmpdir(), `anime_${Date.now()}.mp4`)
      const res = await axios.get(q.url, { responseType: 'arraybuffer', timeout: 90000, headers: { 'User-Agent': 'Mozilla/5.0' } })
      writeFileSync(rawPath, Buffer.from(res.data))
      let ok = await remuxOnly(rawPath, finalPath)
      if (!ok) copyFileSync(rawPath, finalPath)
      try { unlinkSync(rawPath) } catch {}
      await conn.sendMessage(m.chat, {
        video: { url: finalPath },
        mimetype: 'video/mp4',
        fileName: `${cleanName(selected.title)}.mp4`,
        caption: `*╭━〔⚡𝐀𝐑𝐓𝐇𝐔𝐑 𝐒𝐘𝐒𝐓𝐄𝐌〕━╮*\n*┃*\n*┃ 🍥 الحلقة :* ${selected.title}\n*┃ 📺 الانمي :* ${selected.animeName}\n*┃ 🔢 رقم الحلقة :* ${selected.epNum === 9999 ? 'غير معروف' : selected.epNum}\n*┃ ⏱️ المدة :* ${selected.durationText}\n*┃ 📅 تاريخ النزول :* ${selected.date}\n*┃ 👤 الصفحة :* ${selected.author}\n*┃ 📦 الجودة :* 480p دايماً - بحجمها الكامل\n*┃*\n*◇❐ ═━╾ 🩸 ╼━═ ❐◇*`
      }, { quoted: m })
      await react('✅')
      try { unlinkSync(finalPath) } catch {}
    } catch { await react('❌'); m.reply('❌ فشل تحميل الحلقة') }
    return
  }

  if (text.startsWith('next_') || text.startsWith('prev_')) {
    const old = cache.get(m.chat)
    if (!old?.episodes?.length) return m.reply('❌ انتهت، ابحث من جديد\n.انمي ناروتو')
    let offset = parseInt(text.replace('next_', '').replace('prev_', ''))
    if (isNaN(offset)) offset = 0
    await react('🔍')
    await sendPageWithNext(conn, m, old, offset)
    await react('✅')
    return
  }

  await react('🔍')
  await m.reply('🔍 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 يبحث عن الفيديوهات...')

  try {
    const videos = await searchWideFast(text)
    if (!videos.length) { await react('❌'); return m.reply('❌ ما لقيت حلقات 20 دقيقة وفوق') }

    let allVideos = videos.map(v => {
        let title = cleanName(getTitle(v))
        let dur = getDuration(v) || v._durationGuess || 0
        return {
            id: makeID('ep'),
            title,
            animeName: text,
            epNum: getEpisodeNumber(title),
            date: getDate(v),
            author: cleanName(getAuthor(v)),
            authorId: getAuthorId(v),
            url: getFacebookURL(v),
            cover: getCover(v),
            pageCover: getPageCover(v),
            duration: dur,
            durationText: formatDuration(dur),
        }
    }).filter(x => x.url)

    if (!allVideos.length) { await react('❌'); return m.reply('❌ ما لقيت روابط') }

    let pagesMap = new Map()
    for (let v of allVideos) {
        if (!pagesMap.has(v.authorId)) {
            pagesMap.set(v.authorId, {
                author: v.author,
                authorId: v.authorId,
                animeName: text,
                cover: v.pageCover,
                count: 0,
                withNumber: 0,
                withHalqa: 0,
                lastDate: v.date,
                score: 0
            })
        }
        let p = pagesMap.get(v.authorId)
        p.count++
        if (v.epNum !== 9999) p.withNumber++
        if (v.title.includes('الحلقة') || v.title.includes('حلقة') || v.title.includes('الحلقه')) p.withHalqa++
        if (v.date > p.lastDate) p.lastDate = v.date
    }
    for (let p of pagesMap.values()) {
        p.score = (p.count * 10) + (p.withNumber * 5) + (p.withHalqa * 3)
        if (p.author === 'Facebook' || p.author.length < 3) p.score -= 100
    }
    let pages = Array.from(pagesMap.values()).sort((a, b) => b.score - a.score)
    let bestPage = pages[0]
    if (!bestPage) { await react('❌'); return m.reply('❌ ما لقيت صفحة') }

    // ===== الترتيب - اهم شي =====
    let episodes = allVideos.filter(v => v.authorId === bestPage.authorId)
    episodes.sort((a, b) => {
        // اللي عنده رقم حلقة يجي اول، مرتب من 1
        if (a.epNum === 9999 && b.epNum !== 9999) return 1
        if (b.epNum === 9999 && a.epNum !== 9999) return -1
        return a.epNum - b.epNum
    })
    let seenEp = new Set()
    episodes = episodes.filter(v => {
        if (v.epNum === 9999) return true
        if (seenEp.has(v.epNum)) return false
        seenEp.add(v.epNum)
        return true
    })

    cache.set(m.chat, { time: Date.now(), bestPage, episodes })

    await sendPageWithNext(conn, m, { bestPage, episodes }, 0)
    await react('✅')

  } catch {
    await react('❌')
  }
}

handler.help = ['انمي']
handler.tags = ['downloader']
handler.command = /^(انمي|anime)$/i

export default handler