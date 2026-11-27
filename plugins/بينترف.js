// plugins/بينترف.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Pinterest Videos - مضمون + اسرع ✅

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

// ===== بحث واسع مثل القديم - يجيب كثير =====
async function searchPinterestVideos(query, needed = 15) {
   const videos = []
   const cookies = await getPinterestCookies()
   if (!cookies) return videos
   let bookmarks = ['']
   let attempts = 0
   const maxAttempts = 12
   while (videos.length < needed && bookmarks.length && attempts < maxAttempts) {
      attempts++
      try {
         const params = {
            source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
            data: JSON.stringify({ options: { isPrefetch: false, query, scope: 'pins', bookmarks, page_size: 50 }, context: {} }),
            _: Date.now()
         }
         const { data } = await axios.get(`${PINTEREST_BASE}${PINTEREST_SEARCH_PATH}`, {
            headers: { ...PINTEREST_HEADERS, cookie: cookies },
            params, timeout: 15000
         })
         const results = data?.resource_response?.data?.results || []
         if (!results.length) break
         for (const r of results) {
            let videoUrl = null
            if (r?.videos?.video_list) {
               let list = r.videos.video_list
               let best = list['V_720P'] || list['V_480P'] || list['V_360P'] || list['V_HLS_V4'] || Object.values(list)[0]
               if (best?.url) videoUrl = best.url
            }
            if (!videoUrl && r?.story_pin_data?.pages?.length) {
               for (let page of r.story_pin_data.pages) {
                  for (let b of (page?.blocks || [])) {
                     if (b?.video?.video_list) {
                        let vlist = b.video.video_list
                        let best = vlist['V_720P'] || vlist['V_480P'] || vlist['V_360P'] || Object.values(vlist)[0]
                        if (best?.url) { videoUrl = best.url; break }
                     }
                  }
                  if (videoUrl) break
               }
            }
            if (videoUrl) {
               videos.push({ videoUrl, link: `https://www.pinterest.com/pin/${r?.id}/`, id: r?.id })
               if (videos.length >= needed) break
            }
         }
         const nextBookmark = data?.resource_response?.bookmark
         if (!nextBookmark || nextBookmark === '-end-') break
         bookmarks = [nextBookmark]
      } catch { break }
   }
   return videos.slice(0, needed)
}

// ===== تحويل سريع مضمون - remux 1 ثانية =====
async function convertForWhatsApp(inputPath, outputPath) {
   const ffmpegPath = ffmpegStatic
   if (!ffmpegPath || !existsSync(ffmpegPath)) {
      console.log('⚠️ ffmpeg-static مو موجود')
      return false
   }

   // 1. remux سريع - 1 ثانية، يكفي 90% من الفيديوهات
   try {
      await execAsync(`"${ffmpegPath}" -y -i "${inputPath}" -c copy -movflags +faststart "${outputPath}"`, { timeout: 30000 })
      if (existsSync(outputPath) && statSync(outputPath).size > 10000) return true
   } catch { try { if (existsSync(outputPath)) unlinkSync(outputPath) } catch {} }

   // 2. اعادة ترميز خفيفة - بس اذا remux فشل
   try {
      await execAsync(`"${ffmpegPath}" -y -i "${inputPath}" -c:v libx264 -preset ultrafast -crf 30 -c:a aac -b:a 96k -movflags +faststart -vf "scale='min(720,iw)':-2" "${outputPath}"`, { timeout: 60000 })
      if (existsSync(outputPath) && statSync(outputPath).size > 10000) return true
   } catch (e) { console.log('❌ تحويل فشل:', e.message.slice(0, 120)); try { if (existsSync(outputPath)) unlinkSync(outputPath) } catch {} }

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

  // تحميل من رابط
  if (text.includes('pin.it') || text.includes('pinterest.com/pin/')) {
    await react('⏳')
    await m.reply('⏳ جاري تحميل الفيديو...')
    try {
      const rawPath = join(tmpdir(), `pin_raw_${Date.now()}.mp4`)
      const finalPath = join(tmpdir(), `pin_${Date.now()}.mp4`)
      await execAsync(`${YTDLP_PATH} --no-playlist --force-overwrites --cookies ${COOKIES_PATH} --user-agent "Mozilla/5.0" -f "mp4/best[height<=720]/best" -o "${rawPath}" "${text}"`, { timeout: 120000 })
      if (!existsSync(rawPath)) throw new Error('فشل')
      let ok = await convertForWhatsApp(rawPath, finalPath)
      if (!ok) copyFileSync(rawPath, finalPath)
      try { unlinkSync(rawPath) } catch {}
      await conn.sendMessage(m.chat, { video: { url: finalPath }, mimetype: 'video/mp4', caption: `✅ تم التحميل\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓` }, { quoted: m })
      await react('✅')
      try { unlinkSync(finalPath) } catch {}
    } catch (e) { console.log(e.message); await react('❌'); m.reply('❌ فشل التحميل') }
    return
  }

  await react('🔍')
  await m.reply('🎬 جاري البحث...')

  try {
    const videos = await searchPinterestVideos(text, 15)
    if (!videos.length) { await react('❌'); return m.reply('❌ ما لقيت فيديوهات\nجرب كلمة ثانية') }

    await m.reply(`✅ لقيت ${videos.length} فيديو، جاري التحويل السريع...`)

    let cards = []
    // نوقف عند 10، حتى لو جبنا 15
    for (let i = 0; i < videos.length && cards.length < 10; i++) {
      let v = videos[i]
      let rawPath = join(tmpdir(), `raw_${Date.now()}_${i}.mp4`)
      let finalPath = join(tmpdir(), `final_${Date.now()}_${i}.mp4`)
      try {
        // لو m3u8 نحوله مباشرة بـ ffmpeg
        if (v.videoUrl.includes('.m3u8')) {
          let ok = await convertForWhatsApp(v.videoUrl, finalPath)
          if (!ok) { console.log(`❌ فيديو ${i+1} m3u8 فشل`); continue }
        } else {
          const vidRes = await axios.get(v.videoUrl, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pinterest.com/' },
            timeout: 25000, maxContentLength: 50 * 1024 * 1024
          })
          writeFileSync(rawPath, Buffer.from(vidRes.data))
          if (statSync(rawPath).size < 5000) { try { unlinkSync(rawPath) } catch {}; continue }

          let ok = await convertForWhatsApp(rawPath, finalPath)
          if (!ok) {
            // اذا فشل التحويل، ارسل الاصلي، لا تتخطاه
            console.log(`⚠️ فيديو ${i+1} فشل تحويله، بنرسل الاصلي`)
            try { copyFileSync(rawPath, finalPath) } catch { continue }
          }
        }

        // اذا اكبر من 16MB نتخطاه، واتساب ما يقبله في الكروسيل
        if (!existsSync(finalPath) || statSync(finalPath).size < 5000) continue
        if (statSync(finalPath).size > 16 * 1024 * 1024) {
          console.log(`⚠️ فيديو ${i+1} كبير ${(statSync(finalPath).size/1024/1024).toFixed(1)} MB`)
          continue
        }

        let buffer = readFileSync(finalPath)
        // تأكد انه مو صورة
        if ((buffer[0] === 0xFF && buffer[1] === 0xD8) || buffer.slice(1,4).toString() === 'PNG') continue

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
        console.log(`✅ فيديو ${cards.length} جاهز`)

      } catch (e) {
        console.log(`❌ فيديو ${i+1} فشل:`, e.message.slice(0, 120))
        continue
      } finally {
        try { if (existsSync(rawPath)) unlinkSync(rawPath) } catch {}
        try { if (existsSync(finalPath)) unlinkSync(finalPath) } catch {}
      }
    }

    if (!cards.length) { await react('❌'); return m.reply('❌ فشل تحويل كل الفيديوهات\nجرب كلمة ثانية') }

    const finalMessage = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
        body: proto.Message.InteractiveMessage.Body.create({ text: `🎬 نتائج: ${text}\n📹 ${cards.length} فيديو\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓` }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: global.watermark || '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡' }),
        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
      })}}
    }, { quoted: m })

    await conn.relayMessage(m.chat, finalMessage.message, { messageId: finalMessage.key.id })
    await react('✅')

  } catch (e) {
    console.error(e)
    await react('❌')
    m.reply('❌ خطأ في البحث')
  }
}

handler.help = ['بينترف']
handler.tags = ['downloader']
handler.command = /^(بينترف|بنترف|pinterestvid|pinvid|بينترستفيديو)$/i

export default handler