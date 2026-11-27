// plugins/بينترف.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - كروسيل فيديو + تحويل سكته وسريع ✅

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
const YTDLP_PATH = '/home/container/yt-dlp'
const COOKIES_PATH = '/home/container/cookies/pinterest.txt'

const PINTEREST_BASE = 'https://www.pinterest.com'
const PINTEREST_SEARCH_PATH = '/resource/BaseSearchResource/get/'
const PINTEREST_HEADERS = {
   accept: 'application/json, text/javascript, */*, q=0.01',
   referer: 'https://www.pinterest.com/',
   'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
   'x-app-version': 'a9522f',
   'x-pinterest-appstate': 'active',
   'x-pinterest-pws-handler': 'www/[username]/[slug].js',
   'x-requested-with': 'XMLHttpRequest'
}

async function getPinterestCookies() {
   try {
      const res = await axios.get(PINTEREST_BASE, { timeout: 15000 })
      const setCookies = res.headers['set-cookie']
      if (!setCookies) return null
      return setCookies.map(c => c.split(';')[0].trim()).join('; ')
   } catch { return null }
}

async function searchOne(query, needed = 20) {
   const videos = []
   const seen = new Set()
   const cookies = await getPinterestCookies()
   if (!cookies) return videos
   let bookmarks = ['']
   let attempts = 0
   while (videos.length < needed && bookmarks.length && attempts < 30) {
      attempts++
      try {
         const params = {
            source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
            data: JSON.stringify({ options: { isPrefetch: false, query, scope: 'pins', bookmarks, page_size: 100 }, context: {} }),
            _: Date.now()
         }
         const { data } = await axios.get(`${PINTEREST_BASE}${PINTEREST_SEARCH_PATH}`, {
            headers: { ...PINTEREST_HEADERS, cookie: cookies },
            params, timeout: 20000
         })
         const results = data?.resource_response?.data?.results || []
         if (!results.length) break
         for (const r of results) {
            if (!r?.id || seen.has(r.id)) continue
            seen.add(r.id)
            let videoUrl = null
            if (r?.videos?.video_list) {
               let list = r.videos.video_list
               let best = list['V_720P'] || list['V_480P'] || list['V_360P'] || list['V_240P'] || list['V_HLS_V4'] || Object.values(list)[0]
               if (best?.url) videoUrl = best.url
            }
            if (!videoUrl && r?.story_pin_data?.pages?.length) {
               for (let page of r.story_pin_data.pages) {
                  for (let b of (page?.blocks || [])) {
                     if (b?.video?.video_list) {
                        let vl = b.video.video_list
                        let best = vl['V_720P'] || vl['V_480P'] || vl['V_360P'] || Object.values(vl)[0]
                        if (best?.url) { videoUrl = best.url; break }
                     }
                  }
                  if (videoUrl) break
               }
            }
            if (!videoUrl && r?.embed?.src?.includes('.mp4')) videoUrl = r.embed.src
            if (videoUrl && videoUrl.includes('.m3u8')) continue
            if (!videoUrl) continue
            videos.push({ videoUrl, link: `https://www.pinterest.com/pin/${r?.id}/`, id: r.id })
            if (videos.length >= needed) break
         }
         const nextBookmark = data?.resource_response?.bookmark
         if (!nextBookmark || nextBookmark === '-end-') break
         bookmarks = [nextBookmark]
      } catch { break }
   }
   return videos
}

async function searchSmart(query, needed = 20) {
   let videos = await searchOne(query, needed)
   if (videos.length >= 5) return { videos, similar: false, usedQuery: query }
   let words = query.split(' ').filter(w => w.length > 2)
   let tries = []
   if (words.length > 1) { tries.push(words[0], words.slice(0, 2).join(' ')) }
   tries.push('anime', 'aesthetic', 'trending', 'viral video')
   for (let q of tries) {
      if (videos.length >= needed) break
      if (q.toLowerCase() === query.toLowerCase()) continue
      let more = await searchOne(q, needed - videos.length)
      for (let v of more) if (!videos.find(x => x.id === v.id)) videos.push(v)
      if (videos.length >= 5) return { videos: videos.slice(0, needed), similar: true, usedQuery: q }
   }
   if (!videos.length) {
      let trend = await searchOne('viral trending', needed)
      if (trend.length) return { videos: trend, similar: true, usedQuery: 'trending' }
   }
   return { videos: videos.slice(0, needed), similar: videos.length < 5, usedQuery: query }
}

// ===== تحويل سكته وسريع - بدون ما يقول شي =====
async function convertSilent(inputPath, outputPath) {
   const ffmpegPath = ffmpegStatic
   if (!ffmpegPath || !existsSync(ffmpegPath)) return false
   // 1. remux سريع - 1 ثانية
   try {
      await execAsync(`"${ffmpegPath}" -y -v error -i "${inputPath}" -c copy -movflags +faststart "${outputPath}"`, { timeout: 30000 })
      if (existsSync(outputPath) && statSync(outputPath).size > 10000) return true
   } catch { try { if (existsSync(outputPath)) unlinkSync(outputPath) } catch {} }
   // 2. اعادة ترميز خفيفة - بس اذا الاولى فشلت
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
      { type: 'title', text: '🎬 Pinterest Videos - ARTHUR BOT' },
      { type: 'divider' },
      { type: 'info', label: '🎬 بحث فيديوهات', value: `${usedPrefix + command} <كلمة>` },
      { type: 'info', label: 'مثال', value: `${usedPrefix + command} ناروتو` }
    ]))
  }

  // تحميل من رابط - سكته
  if (text.includes('pin.it') || text.includes('pinterest.com/pin/')) {
    await react('⏳')
    try {
      const rawPath = join(tmpdir(), `pin_raw_${Date.now()}.mp4`)
      const finalPath = join(tmpdir(), `pin_${Date.now()}.mp4`)
      await execAsync(`${YTDLP_PATH} --no-playlist --force-overwrites --cookies ${COOKIES_PATH} --user-agent "Mozilla/5.0" -f "mp4/best[height<=720]/best" -o "${rawPath}" "${text}"`, { timeout: 120000 })
      if (!existsSync(rawPath)) throw new Error('فشل')
      let ok = await convertSilent(rawPath, finalPath)
      if (!ok) copyFileSync(rawPath, finalPath)
      try { unlinkSync(rawPath) } catch {}
      await conn.sendMessage(m.chat, { video: { url: finalPath }, mimetype: 'video/mp4', caption: `✅ تم التحميل\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓` }, { quoted: m })
      await react('✅')
      try { unlinkSync(finalPath) } catch {}
    } catch { await react('❌') }
    return
  }

  await react('🔍')
  // ما فيه اي رسالة "جاري التحويل" هنا، سكته

  try {
    const { videos, similar, usedQuery } = await searchSmart(text, 20)
    if (!videos.length) { await react('❌'); return m.reply('❌ ما لقيت فيديوهات') }

    let cards = []
    for (let i = 0; i < videos.length && cards.length < 10; i++) {
      let v = videos[i]
      let rawPath = join(tmpdir(), `raw_${Date.now()}_${i}.mp4`)
      let finalPath = join(tmpdir(), `final_${Date.now()}_${i}.mp4`)
      try {
        // نحمل ونحول سكته، بدون رسائل
        const vidRes = await axios.get(v.videoUrl, {
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pinterest.com/' },
          timeout: 25000, maxContentLength: 50 * 1024 * 1024
        })
        writeFileSync(rawPath, Buffer.from(vidRes.data))
        if (statSync(rawPath).size < 5000) continue

        let ok = await convertSilent(rawPath, finalPath)
        if (!ok) copyFileSync(rawPath, finalPath) // اذا فشل التحويل، ارسل الاصلي سكته

        if (!existsSync(finalPath) || statSync(finalPath).size < 5000) continue
        if (statSync(finalPath).size > 16 * 1024 * 1024) continue

        let buffer = readFileSync(finalPath)
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) continue
        if (buffer.slice(1,4).toString() === 'PNG') continue

        const { videoMessage } = await generateWAMessageContent({ video: buffer }, { upload: conn.waUploadToServer })
        if (!videoMessage) continue

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({ text: `🎬 فيديو ${cards.length + 1} | 🔎 ${text}` }),
          header: proto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: true, videoMessage }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [
              { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📌 فتح في Pinterest", url: v.link }) },
              { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎬 تحميل الفيديو", id: `.بينترف ${v.link}` }) }
            ]
          })
        })
      } catch { continue } // سكته، اذا فشل فيديو، نتخطاه بدون ما نقول شي
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

handler.help = ['بينترف']
handler.tags = ['downloader']
handler.command = /^(بينترف|بنترف|pinterestvid|pinvid|بينترستفيديو)$/i

export default handler