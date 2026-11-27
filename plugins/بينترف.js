// plugins/بينترف.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Pinterest Videos - بدون yt-dlp ✅

import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import { unlinkSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
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

// ===== نجيب رابط الفيديو المباشر من API =====
async function searchPinterestVideos(query, needed = 10) {
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
            data: JSON.stringify({
               options: { isPrefetch: false, query, scope: 'pins', bookmarks, page_size: 100 },
               context: {}
            }),
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

            // نجيب رابط الفيديو من كل الاماكن الممكنة
            let videoUrl = null

            // 1. videos.video_list - الاهم
            if (r?.videos?.video_list) {
               let list = r.videos.video_list
               // لا تاخذ HLS لانه m3u8 ما يشتغل في واتساب
               videoUrl = list['V_720P']?.url || list['V_480P']?.url || list['V_360P']?.url || list['V_240P']?.url || null
               // اذا ما فيه الا HLS، نتخطاه
               if (!videoUrl) continue
            }

            // 2. story_pin_data
            if (!videoUrl && r?.story_pin_data?.pages?.length) {
               for (let page of r.story_pin_data.pages) {
                  for (let b of (page?.blocks || [])) {
                     if (b?.video?.video_list) {
                        let vl = b.video.video_list
                        videoUrl = vl['V_720P']?.url || vl['V_480P']?.url || vl['V_360P']?.url || null
                        if (videoUrl) break
                     }
                  }
                  if (videoUrl) break
               }
            }

            if (!videoUrl) continue

            // نتأكد انه mp4 مو m3u8
            if (videoUrl.includes('.m3u8')) continue

            videos.push({
              videoUrl,
              link: `https://www.pinterest.com/pin/${r.id}/`,
              id: r.id
            })
            if (videos.length >= needed) break
         }
         const nextBookmark = data?.resource_response?.bookmark
         if (!nextBookmark || nextBookmark === '-end-') break
         bookmarks = [nextBookmark]
      } catch (e) { console.log('SEARCH ERROR:', e.message); break }
   }
   console.log(`🔍 لقيت ${videos.length} فيديو mp4 حقيقي لـ: ${query}`)
   return videos.slice(0, needed)
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
      { type: 'info', label: 'مثال', value: `${usedPrefix + command} انمي` }
    ]))
  }

  // تحميل من رابط - نخليه بـ yt-dlp لان الرابط واحد بس
  if (text.includes('pin.it') || text.includes('pinterest.com/pin/')) {
    await react('⏳')
    await m.reply('⏳ جاري تحميل الفيديو...')
    try {
      const outputPath = join(tmpdir(), `pin_${Date.now()}.mp4`)
      const cmd = `${YTDLP_PATH} --no-playlist --force-overwrites --cookies ${COOKIES_PATH} --user-agent "Mozilla/5.0" -f "mp4/best[height<=720]/best" --remux-video mp4 -o "${outputPath}" "${text}"`
      await execAsync(cmd, { timeout: 120000 })
      if (!existsSync(outputPath) || statSync(outputPath).size < 10000) throw new Error('فشل')
      await conn.sendMessage(m.chat, { video: { url: outputPath }, mimetype: 'video/mp4', caption: `✅ تم التحميل\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓` }, { quoted: m })
      await react('✅')
      try { unlinkSync(outputPath) } catch {}
    } catch (e) { console.log('PIN ERROR:', e.message); await react('❌'); m.reply('❌ فشل التحميل') }
    return
  }

  await react('🔍')
  await m.reply('🎬 جاري البحث عن 10 فيديوهات...')

  try {
    const videos = await searchPinterestVideos(text, 10)
    if (!videos.length) { await react('❌'); return m.reply('❌ ما لقيت فيديوهات mp4\nجرب كلمة ثانية مثل: anime, cats, football') }

    await m.reply(`✅ لقيت ${videos.length} فيديو، جاري تحميل الكروسيل...`)

    let cards = []
    let failed = 0

    for (let i = 0; i < videos.length; i++) {
      let v = videos[i]
      try {
        // ===== تحميل مباشر من رابط بنترست، بدون yt-dlp =====
        const vidRes = await axios.get(v.videoUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.pinterest.com/',
            'Accept': 'video/mp4,video/*,*/*'
          },
          timeout: 30000,
          maxContentLength: 60 * 1024 * 1024
        })

        let buffer = Buffer.from(vidRes.data)
        console.log(`فيديو ${i+1}: ${(buffer.length/1024/1024).toFixed(2)} MB - ${v.videoUrl.slice(0,80)}`)

        if (buffer.length < 20000) { failed++; continue }

        // تأكد انه مو صورة
        let isImage = (buffer[0] === 0xFF && buffer[1] === 0xD8) || buffer.slice(1,4).toString() === 'PNG'
        if (isImage) { failed++; console.log(`فيديو ${i+1} طلع صورة!`); continue }

        const { videoMessage } = await generateWAMessageContent({ video: buffer }, { upload: conn.waUploadToServer })
        if (!videoMessage) { failed++; continue }

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

      } catch (e) {
        failed++
        console.log(`❌ فشل تحميل فيديو ${i+1}:`, e.message)
        continue
      }
    }

    if (!cards.length) {
      await react('❌')
      return m.reply(`❌ فشل تحميل كل الفيديوهات (${failed} فشل)\n\nجرب كلمة ثانية، او ارسل لي اللي طلع في الكونسول عشان اشوف الخطأ`)
    }

    const finalMessage = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
        body: proto.Message.InteractiveMessage.Body.create({ text: `🎬 نتائج: ${text}\n📹 ${cards.length} فيديو\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓` }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: global.watermark || '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡' }),
        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
      })}}
    }, { quoted: m })

    await conn.relayMessage(m.chat, finalMessage.message, { messageId: finalMessage.key.id })
    await react('✅')
    if (failed > 0) await m.reply(`✅ تم ارسال ${cards.length} فيديو | فشل ${failed}`)

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