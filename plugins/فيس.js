// plugins/فيس.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Facebook Videos - كروسيل + سكته + سريع ✅

import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import { unlinkSync, existsSync, statSync, writeFileSync, readFileSync, copyFileSync } from 'fs'
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

/* ═══════════════════════════════════════
   📘 FACEBOOK SEARCH & DOWNLOAD API
═══════════════════════════════════════ */
const API_KEY = "ak_live_SRXV4CfsgQtwnkjI0OhicCphe6MVOoan9sySwz-PyrM"
const SEARCH_API = "https://apidirect.io/v1/facebook/videos"
const DOWNLOAD_API = "https://fdown.isuru.eu.org/download"

function cleanName(name) {
    return String(name || "Facebook").replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim().slice(0, 80)
}

// ===== بحث واسع 20 =====
async function searchFacebook(query, needed = 20) {
    let allVideos = []
    for (let page = 1; page <= 3; page++) {
        try {
            const response = await axios.get(SEARCH_API, {
                params: { query, page },
                timeout: 30000,
                headers: { "X-API-Key": API_KEY, Accept: "application/json", "User-Agent": "YUNO-BOT/1.0" }
            })
            const data = response.data
            const videos = data?.videos || data?.results || data?.data || []
            if (Array.isArray(videos) && videos.length > 0) allVideos.push(...videos)
            else break
            if (allVideos.length >= needed) break
        } catch { break }
    }
    return allVideos.slice(0, needed)
}

function getFacebookURL(video) {
    return video.url || video.video_url || video.videoUrl || video.link || video.permalink || video.permalink_url || null
}
function getTitle(video) {
    return video.title || video.name || video.description || video.caption || "فيديو Facebook"
}
function getAuthor(video) {
    return video.author?.name || video.author?.username || video.author || video.page_name || video.publisher || "Facebook"
}

// ===== بحث ذكي - ما يرجع فاضي ابدا =====
async function searchSmart(query, needed = 20) {
    let videos = await searchFacebook(query, needed)
    // نظف اللي ما عنده رابط
    videos = videos.filter(v => getFacebookURL(v))
    if (videos.length >= 5) return { videos, similar: false, usedQuery: query }

    let words = query.split(' ').filter(w => w.length > 2)
    let tries = []
    if (words.length > 1) { tries.push(words[0], words.slice(0, 2).join(' ')) }
    tries.push('naruto', 'anime', 'trending', 'viral video', 'funny')

    for (let q of tries) {
        if (videos.length >= needed) break
        if (q.toLowerCase() === query.toLowerCase()) continue
        let more = await searchFacebook(q, needed - videos.length)
        more = more.filter(v => getFacebookURL(v))
        for (let v of more) {
            let url = getFacebookURL(v)
            if (!videos.find(x => getFacebookURL(x) === url)) videos.push(v)
        }
        if (videos.length >= 5) return { videos: videos.slice(0, needed), similar: true, usedQuery: q }
    }
    return { videos: videos.slice(0, needed), similar: videos.length < 5, usedQuery: query }
}

// ===== جيب اخف جودة - عشان الكروسيل يكون سريع =====
async function getLightQuality(url) {
    try {
        const response = await axios.post(DOWNLOAD_API, { url }, {
            timeout: 60000,
            headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "YUNO-BOT/1.0" }
        })
        const data = response.data
        if (data?.status === "error") return null
        let qualities = []
        const links = data?.links
        if (links && typeof links === "object") {
            for (const [key, val] of Object.entries(links)) {
                if (val && typeof val === "string") {
                    let k = String(key).toLowerCase()
                    let priority = 10
                    if (k.includes("low") || k.includes("360") || k.includes("sd") || k.includes("normal") || k.includes("240") || k.includes("144")) priority = 1
                    else if (k.includes("hd") || k.includes("720") || k.includes("1080")) priority = 5
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

// ===== تحويل سكته وسريع =====
async function convertSilent(inputPath, outputPath) {
   const ffmpegPath = ffmpegStatic
   if (!ffmpegPath || !existsSync(ffmpegPath)) return false
   try {
      await execAsync(`"${ffmpegPath}" -y -v error -i "${inputPath}" -c copy -movflags +faststart "${outputPath}"`, { timeout: 30000 })
      if (existsSync(outputPath) && statSync(outputPath).size > 10000) return true
   } catch { try { if (existsSync(outputPath)) unlinkSync(outputPath) } catch {} }
   try {
      await execAsync(`"${ffmpegPath}" -y -v error -i "${inputPath}" -c:v libx264 -preset ultrafast -crf 30 -c:a aac -b:a 96k -movflags +faststart -vf "scale='min(720,iw)':-2" "${outputPath}"`, { timeout: 60000 })
      if (existsSync(outputPath) && statSync(outputPath).size > 10000) return true
   } catch { try { if (existsSync(outputPath)) unlinkSync(outputPath) } catch {} }
   return false
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const react = async (emoji) => {
    try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
  }

  if (!text) {
    return m.reply(theme.build([
      { type: 'title', text: '🎬 Facebook Videos - ARTHUR BOT' },
      { type: 'divider' },
      { type: 'info', label: '🎬 بحث فيديوهات', value: `${usedPrefix + command} <كلمة>` },
      { type: 'info', label: 'مثال', value: `${usedPrefix + command} ناروتو` }
    ]))
  }

  // تحميل من رابط مباشر - سكته
  if (text.includes('facebook.com') || text.includes('fb.watch') || text.includes('fb.gg')) {
    await react('⏳')
    await m.reply('🔍 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 يبحث عن الصور...')
    try {
      let q = await getLightQuality(text)
      if (!q) throw new Error('ما لقيت جودة')
      const rawPath = join(tmpdir(), `fb_raw_${Date.now()}.mp4`)
      const finalPath = join(tmpdir(), `fb_${Date.now()}.mp4`)
      const res = await axios.get(q.url, { responseType: 'arraybuffer', timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } })
      writeFileSync(rawPath, Buffer.from(res.data))
      let ok = await convertSilent(rawPath, finalPath)
      if (!ok) copyFileSync(rawPath, finalPath)
      try { unlinkSync(rawPath) } catch {}
      await conn.sendMessage(m.chat, { video: { url: finalPath }, mimetype: 'video/mp4', caption: `✅ تم التحميل\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓` }, { quoted: m })
      await react('✅')
      try { unlinkSync(finalPath) } catch {}
    } catch { await react('❌') }
    return
  }

  // ===== البداية - مثل البينترف =====
  await react('🔍')
  await m.reply('🔍 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 يبحث عن الصور...')

  // من هنا كل شي سكته
  try {
    const { videos, similar, usedQuery } = await searchSmart(text, 20)
    if (!videos.length) { await react('❌'); return m.reply('❌ ما لقيت فيديوهات') }

    let cards = []
    for (let i = 0; i < videos.length && cards.length < 10; i++) {
      let v = videos[i]
      let fbUrl = getFacebookURL(v)
      let title = cleanName(getTitle(v))
      let author = cleanName(getAuthor(v))
      let rawPath = join(tmpdir(), `fb_raw_${Date.now()}_${i}.mp4`)
      let finalPath = join(tmpdir(), `fb_final_${Date.now()}_${i}.mp4`)
      try {
        // نجيب اخف جودة عشان الكروسيل يكون سريع
        let q = await getLightQuality(fbUrl)
        if (!q) continue

        const vidRes = await axios.get(q.url, {
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 40000, maxContentLength: 50 * 1024 * 1024
        })
        writeFileSync(rawPath, Buffer.from(vidRes.data))
        if (statSync(rawPath).size < 5000) continue

        let ok = await convertSilent(rawPath, finalPath)
        if (!ok) copyFileSync(rawPath, finalPath)

        if (!existsSync(finalPath) || statSync(finalPath).size < 5000) continue
        if (statSync(finalPath).size > 16 * 1024 * 1024) continue

        let buffer = readFileSync(finalPath)
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) continue
        if (buffer.slice(1,4).toString() === 'PNG') continue

        const { videoMessage } = await generateWAMessageContent({ video: buffer }, { upload: conn.waUploadToServer })
        if (!videoMessage) continue

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({ text: `🎬 فيديو ${cards.length + 1} | ${title.slice(0, 50)}\n👤 ${author}` }),
          header: proto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: true, videoMessage }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [
              { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📘 فتح في Facebook", url: fbUrl }) },
              { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📥 تحميل الفيديو", id: `.فيس ${fbUrl}` }) }
            ]
          })
        })
      } catch { continue }
      finally {
        try { if (existsSync(rawPath)) unlinkSync(rawPath) } catch {}
        try { if (existsSync(finalPath)) unlinkSync(finalPath) } catch {}
      }
    }

    if (!cards.length) { await react('❌'); return }

    const finalMessage = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
        body: proto.Message.InteractiveMessage.Body.create({ text: `🎬 نتائج: ${text}${similar ? `\n🔎 مشابه لـ: ${usedQuery}` : ''}\n📹 ${cards.length} فيديو\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓` }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: global.watermark || '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡' }),
        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
      })}}
    }, { quoted: m })

    await conn.relayMessage(m.chat, finalMessage.message, { messageId: finalMessage.key.id })
    await react('✅')

  } catch {
    await react('❌')
  }
}

handler.help = ['فيس']
handler.tags = ['downloader']
handler.command = /^(فيس|facebook|fb)$/i

export default handler