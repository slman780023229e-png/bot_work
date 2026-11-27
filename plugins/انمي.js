// plugins/انمي.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - انمي من صفحات فيس - صفحة > حلقات ✅

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
const CACHE_TIME = 20 * 60 * 1000

function cleanName(name) {
    return String(name || "Facebook").replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim().slice(0, 80)
}
function makeID(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6)
}
function cleanCache() {
    const now = Date.now()
    for (const [k, v] of cache) if (!v || now - v.time > CACHE_TIME) cache.delete(k)
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
    // غلاف الصفحة - صورة الصفحة نفسها، مو صورة الفيديو
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

async function searchOne(query, needed = 30) {
    let all = []
    for (let page = 1; page <= 3; page++) {
        try {
            const res = await axios.get(SEARCH_API, {
                params: { query, page },
                timeout: 30000,
                headers: { "X-API-Key": API_KEY, Accept: "application/json", "User-Agent": "YUNO-BOT/1.0" }
            })
            const data = res.data
            const videos = data?.videos || data?.results || data?.data || []
            if (Array.isArray(videos) && videos.length) all.push(...videos)
            else break
            if (all.length >= needed) break
        } catch { break }
    }
    return all
}

async function searchWide(query, needed = 40) {
    let tries = [
        `${query} حلقة`,
        `${query} الحلقة`,
        `${query} episode`,
        `${query} انمي`,
        query,
        `${query} مدبلج`,
        `${query} مترجم`,
        `${query} جميع الحلقات`,
    ]
    let all = []
    let seen = new Set()
    for (let q of tries) {
        if (all.length >= needed) break
        let res = await searchOne(q, needed - all.length)
        for (let v of res) {
            let url = getFacebookURL(v)
            if (!url || seen.has(url)) continue
            seen.add(url)
            all.push(v)
        }
    }
    return all.slice(0, needed)
}

async function getLightQuality(url) {
    try {
        const res = await axios.post(DOWNLOAD_API, { url }, {
            timeout: 60000,
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
                    if (k.includes("144") || k.includes("240")) priority = 1
                    else if (k.includes("360") || k.includes("low") || k.includes("sd") || k.includes("normal")) priority = 2
                    else if (k.includes("480")) priority = 3
                    else if (k.includes("720") || k.includes("hd")) priority = 5
                    else if (k.includes("1080")) priority = 6
                    qualities.push({ name: key, url: val, priority })
                }
            }
        }
        const mainUrl = data?.download_url || data?.downloadUrl || data?.url || data?.video_url
        if (mainUrl && !qualities.some(q => q.url === mainUrl)) qualities.push({ name: "جودة خفيفة", url: mainUrl, priority: 2 })
        qualities.sort((a, b) => a.priority - b.priority)
        return qualities.length ? qualities[0] : null
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
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } })
        let buf = Buffer.from(res.data)
        if (buf.length < 5000) return null
        return buf
    } catch { return null }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const react = async (emoji) => {
    try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
  }

  if (!text) {
    return m.reply(theme.build([
      { type: 'title', text: '🍥 انمي من صفحات Facebook - ARTHUR BOT' },
      { type: 'divider' },
      { type: 'info', label: '🍥 بحث', value: `${usedPrefix + command} <اسم الانمي>` },
      { type: 'info', label: 'مثال', value: `${usedPrefix + command} ناروتو` },
      { type: 'info', label: 'الطريقة', value: 'ابحث > اختر الصفحة > اختر الحلقة' },
    ]))
  }

  cleanCache()

  // ===== 3. ضغط على زر حلقة - تحميل =====
  if (text.startsWith('ep_')) {
    const old = cache.get(m.chat)
    const selected = old?.episodes?.find(x => x.id === text)
    if (!selected) return m.reply('❌ الحلقة انتهت، ابحث من جديد\n.انمي ناروتو')
    await react('⏳')
    await m.reply('🔍 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 يبحث عن الفيديوهات...')
    try {
      let q = await getLightQuality(selected.url)
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
        caption: `*╭━〔⚡𝐀𝐑𝐓𝐇𝐔𝐑 𝐒𝐘𝐒𝐓𝐄𝐌〕━╮*\n*┃*\n*┃ 🍥 الحلقة :* ${selected.title}\n*┃ 📺 الانمي :* ${selected.animeName}\n*┃ 🔢 رقم الحلقة :* ${selected.epNum === 9999 ? 'غير معروف' : selected.epNum}\n*┃ 📅 تاريخ النزول :* ${selected.date}\n*┃ 👤 الصفحة :* ${selected.author}\n*┃ 📦 الجودة :* ${q.name} - بحجمها الكامل\n*┃*\n*◇❐ ═━╾ 🩸 ╼━═ ❐◇*`
      }, { quoted: m })
      await react('✅')
      try { unlinkSync(finalPath) } catch {}
    } catch { await react('❌'); m.reply('❌ فشل تحميل الحلقة') }
    return
  }

  // ===== 2. ضغط على زر صفحة - يجيب كل حلقاتها =====
  if (text.startsWith('page_')) {
    const old = cache.get(m.chat)
    const page = old?.pages?.find(x => x.id === text)
    if (!page) return m.reply('❌ الصفحة انتهت، ابحث من جديد\n.انمي ناروتو')

    await react('🔍')
    await m.reply('🔍 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 يبحث عن الفيديوهات...')

    // كل حلقات هذي الصفحة بس، مرتبة
    let episodes = old.allVideos.filter(v => v.authorId === page.authorId)
    episodes.sort((a, b) => a.epNum - b.epNum)
    episodes = episodes.slice(0, 30)

    // نحفظ الحلقات عشان زر التحميل
    cache.set(m.chat, { ...old, time: Date.now(), episodes })

    // غلاف الصفحة
    let coverBuffer = await getImageBuffer(page.cover)

    for (let chunkStart = 0; chunkStart < episodes.length; chunkStart += 10) {
      let chunk = episodes.slice(chunkStart, chunkStart + 10)
      let isFirst = chunkStart === 0

      let menuText = isFirst
        ? `*╭━〔⚡𝐀𝐑𝐓𝐇𝐔𝐑 𝐒𝐘𝐒𝐓𝐄𝐌〕━╮*\n*┃*\n*┃ 🍥 الانمي :* ${page.animeName}\n*┃ 👤 الصفحة :* ${page.author}\n*┃ 📊 الحلقات :* ${episodes.length} حلقة\n*┃ 📅 اخر حلقة :* ${episodes[episodes.length - 1]?.date}\n*┃ 🔗 رابط الصفحة :* ${page.pageUrl || 'فيس بوك'}\n*┃*\n*◇❐ ═━╾ 🩸 ╼━═ ❐◇*\n\n`
        : `*╭━〔⚡𝐀𝐑𝐓𝐇𝐔𝐑 𝐒𝐘𝐒𝐓𝐄𝐌〕━╮*\n*┃*\n*┃ 🍥 تكملة حلقات ${page.animeName} - ${page.author}*\n*┃*\n*◇❐ ═━╾ 🩸 ╼━═ ❐◇*\n\n`

      menuText += chunk.map(item => {
        let epLabel = item.epNum === 9999 ? item.title : `الحلقة ${item.epNum}`
        return `*🍥 ${epLabel}*\n📝 ${item.title}\n📅 ${item.date} | 👤 ${item.author}\n🔗 ${item.url}`
      }).join("\n\n") + `\n\n👇 *اضغط على الحلقة اللي تبيها:*`

      let buttons = chunk.map(item => {
        let epLabel = item.epNum === 9999 ? item.title.slice(0, 20) : `الحلقة ${item.epNum}`
        return { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: `🍥 ${epLabel}`, id: `.انمي ${item.id}` }) }
      })

      let headerObj = {}
      if (isFirst && coverBuffer) {
        const { imageMessage } = await generateWAMessageContent({ image: coverBuffer }, { upload: conn.waUploadToServer })
        if (imageMessage) headerObj = { hasMediaAttachment: true, imageMessage }
      }

      const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
          body: proto.Message.InteractiveMessage.Body.create({ text: menuText }),
          footer: proto.Message.InteractiveMessage.Footer.create({ text: global.watermark || '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡' }),
          header: proto.Message.InteractiveMessage.Header.fromObject(headerObj),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons })
        })}}
      }, { quoted: m })
      await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
      if (chunkStart + 10 < episodes.length) await new Promise(r => setTimeout(r, 600))
    }
    await react('✅')
    return
  }

  // ===== 1. بحث جديد - يجيب الصفحات =====
  await react('🔍')
  await m.reply('🔍 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 يبحث عن الفيديوهات...')

  try {
    const videos = await searchWide(text, 40)
    if (!videos.length) { await react('❌'); return m.reply('❌ ما لقيت صفحات') }

    let allVideos = videos.map(v => {
        let title = cleanName(getTitle(v))
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
            pageUrl: v.author?.url || v.author?.link || null
        }
    }).filter(x => x.url)

    if (!allVideos.length) { await react('❌'); return m.reply('❌ ما لقيت روابط') }

    // ===== نجمع الصفحات - كل صفحة = كل حلقاتها =====
    let pagesMap = new Map()
    for (let v of allVideos) {
        if (!pagesMap.has(v.authorId)) {
            pagesMap.set(v.authorId, {
                id: makeID('page'),
                author: v.author,
                authorId: v.authorId,
                animeName: text,
                cover: v.pageCover,
                pageUrl: v.pageUrl,
                count: 0,
                lastDate: v.date,
                sampleTitle: v.title
            })
        }
        let p = pagesMap.get(v.authorId)
        p.count++
        if (v.date > p.lastDate) p.lastDate = v.date
    }
    let pages = Array.from(pagesMap.values())
    // نرتب الصفحات: اللي عندها حلقات اكثر اول
    pages.sort((a, b) => b.count - a.count)
    pages = pages.slice(0, 10)

    cache.set(m.chat, { time: Date.now(), pages, allVideos, episodes: allVideos })

    // ===== نرسل الصفحات - كل صفحة زر + غلاف =====
    // نرسل كل صفحة رسالة لوحدها عشان غلافها يبين، مثل الفيس
    for (let i = 0; i < pages.length; i++) {
        let page = pages[i]
        let pageEpisodes = allVideos.filter(v => v.authorId === page.authorId).sort((a, b) => a.epNum - b.epNum)

        let menuText = `*╭━〔⚡𝐀𝐑𝐓𝐇𝐔𝐑 𝐒𝐘𝐒𝐓𝐄𝐌〕━╮*\n*┃*\n*┃ 🍥 الانمي :* ${text}\n*┃ 👤 الصفحة / القناة :* ${page.author}\n*┃ 📊 الحلقات :* ${page.count} حلقة\n*┃ 📅 اخر حلقة :* ${page.lastDate}\n*┃ 🎬 من الحلقة ${pageEpisodes[0]?.epNum === 9999 ? '؟' : pageEpisodes[0]?.epNum} الى الحلقة ${pageEpisodes[pageEpisodes.length - 1]?.epNum === 9999 ? '؟' : pageEpisodes[pageEpisodes.length - 1]?.epNum}\n*┃ 🔗 رابط الصفحة :* ${page.pageUrl || 'فيس بوك'}\n*┃*\n*◇❐ ═━╾ 🩸 ╼━═ ❐◇*\n\n👇 *اضغط على الصفحة عشان تشوف كل حلقاتها:*`

        let coverBuffer = await getImageBuffer(page.cover)
        let headerObj = {}
        if (coverBuffer) {
            const { imageMessage } = await generateWAMessageContent({ image: coverBuffer }, { upload: conn.waUploadToServer })
            if (imageMessage) headerObj = { hasMediaAttachment: true, imageMessage }
        }

        const msg = generateWAMessageFromContent(m.chat, {
          viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.create({ text: menuText }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: global.watermark || '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡' }),
            header: proto.Message.InteractiveMessage.Header.fromObject(headerObj),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
              buttons: [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: `📂 فتح حلقات ${page.author.slice(0, 20)}`, id: `.انمي ${page.id}` }) },
                { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📘 فتح الصفحة في فيس", url: page.pageUrl || `https://www.facebook.com/search/top/?q=${encodeURIComponent(text)}` }) }
              ]
            })
          })}}
        }, { quoted: m })
        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        await new Promise(r => setTimeout(r, 500))
    }

    await react('✅')

  } catch {
    await react('❌')
  }
}

handler.help = ['انمي']
handler.tags = ['downloader']
handler.command = /^(انمي|anime)$/i

export default handler