// plugins/بينترف.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - بحث واسع 20 + كروسيل + بدون ffmpeg ✅

import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import { unlinkSync, existsSync } from 'fs'
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

// ===== بحث واسع جدا - 20 فيديو =====
async function searchPinterestVideos(query, needed = 20) {
   const videos = []
   const seen = new Set()
   const cookies = await getPinterestCookies()
   if (!cookies) return videos

   let bookmarks = ['']
   let attempts = 0

   // نبحث كثير لين نجيب 20
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

            let videoUrl = null
            let thumb = null

            // 1. videos.video_list - واسع، ناخذ اي شي
            if (r?.videos?.video_list) {
               let list = r.videos.video_list
               // نحاول نجيب احسن جودة، واذا ما فيه ناخذ اول واحد
               let best = list['V_720P'] || list['V_480P'] || list['V_360P'] || list['V_240P'] || list['V_HLS_V4'] || list['V_HLS_V3'] || Object.values(list)[0]
               if (best?.url) videoUrl = best.url
               if (best?.thumbnail) thumb = best.thumbnail
            }

            // 2. story_pin_data - واسع
            if (!videoUrl && r?.story_pin_data?.pages?.length) {
               for (let page of r.story_pin_data.pages) {
                  for (let b of (page?.blocks || [])) {
                     if (b?.video?.video_list) {
                        let vl = b.video.video_list
                        let best = vl['V_720P'] || vl['V_480P'] || vl['V_360P'] || vl['V_240P'] || Object.values(vl)[0]
                        if (best?.url) { videoUrl = best.url; break }
                     }
                     // بعض الفيديوهات تكون في image
                     if (!videoUrl && b?.image?.images?.['736x']) {
                        // نتخطاها، نبي فيديو بس
                     }
                  }
                  if (videoUrl) break
               }
            }

            // 3. embed - طريقة ثالثة واسعة
            if (!videoUrl && r?.embed?.src) {
               if (r.embed.src.includes('.mp4')) videoUrl = r.embed.src
            }

            // 4. images - اذا كان الفيديو مخزن كـ gif
            if (!videoUrl && r?.images?.['736x']?.url && r.images['736x'].url.includes('.mp4')) {
               videoUrl = r.images['736x'].url
            }

            // نتخطى m3u8 لان الكروسيل ما يقبله بدون تحويل
            if (videoUrl && videoUrl.includes('.m3u8')) continue
            if (!videoUrl) continue

            // صورة مصغرة واسعة
            if (!thumb) {
               thumb = r?.images?.['736x']?.url || r?.images?.['474x']?.url || r?.images?.['236x']?.url || null
            }

            videos.push({
               videoUrl,
               thumb,
               link: `https://www.pinterest.com/pin/${r.id}/`,
               id: r.id,
               title: r?.title || r?.description || query
            })
            if (videos.length >= needed) break
         }

         const nextBookmark = data?.resource_response?.bookmark
         if (!nextBookmark || nextBookmark === '-end-') break
         bookmarks = [nextBookmark]
      } catch (e) {
         console.log('بحث فشل محاولة:', e.message)
         break
      }
   }
   console.log(`🔍 بحث واسع: لقيت ${videos.length} فيديو لـ: ${query}`)
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
      { type: 'info', label: 'مثال', value: `${usedPrefix + command} ناروتو` }
    ]))
  }

  // تحميل من رابط - بدون ffmpeg، بـ yt-dlp بس
  if (text.includes('pin.it') || text.includes('pinterest.com/pin/')) {
    await react('⏳')
    await m.reply('⏳ جاري تحميل الفيديو...')
    try {
      const rawPath = join(tmpdir(), `pin_${Date.now()}.mp4`)
      await execAsync(`${YTDLP_PATH} --no-playlist --force-overwrites --cookies ${COOKIES_PATH} --user-agent "Mozilla/5.0" -f "mp4/best[height<=720]/best" -o "${rawPath}" "${text}"`, { timeout: 120000 })
      if (!existsSync(rawPath)) throw new Error('فشل')
      await conn.sendMessage(m.chat, { video: { url: rawPath }, mimetype: 'video/mp4', caption: `✅ تم التحميل\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓` }, { quoted: m })
      await react('✅')
      try { unlinkSync(rawPath) } catch {}
    } catch (e) { console.log(e.message); await react('❌'); m.reply('❌ فشل التحميل') }
    return
  }

  await react('🔍')
  await m.reply('🎬 جاري البحث الواسع عن 20 فيديو...')

  try {
    // نبحث 20، عشان نضمن 10 في الكروسيل
    const videos = await searchPinterestVideos(text, 20)
    if (!videos.length) { await react('❌'); return m.reply('❌ ما لقيت فيديوهات\nجرب كلمة ثانية') }

    await m.reply(`✅ لقيت ${videos.length} فيديو، جاري تجهيز الكروسيل...`)

    let cards = []
    // نلف على 20 كلها، ونوقف عند 10 بطاقات
    for (let i = 0; i < videos.length && cards.length < 10; i++) {
      let v = videos[i]
      try {
        console.log(`🎬 تجهيز فيديو ${i+1}/${videos.length} - ${v.link}`)

        // نحمل الفيديو buffer مباشرة، بدون تحويل، بدون ffmpeg
        const vidRes = await axios.get(v.videoUrl, {
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pinterest.com/' },
          timeout: 30000, maxContentLength: 50 * 1024 * 1024
        })
        let buffer = Buffer.from(vidRes.data)

        // نتخطى اذا صغير جدا او صورة
        if (buffer.length < 10000) { console.log(`⚠️ فيديو ${i+1} صغير، نتخطاه`); continue }
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) { console.log(`⚠️ فيديو ${i+1} طلع صورة، نتخطاه`); continue }
        if (buffer.slice(1,4).toString() === 'PNG') { console.log(`⚠️ فيديو ${i+1} طلع PNG، نتخطاه`); continue }

        // اذا اكبر من 16MB نتخطاه، واتساب ما يقبله في الكروسيل
        if (buffer.length > 16 * 1024 * 1024) {
          console.log(`⚠️ فيديو ${i+1} كبير ${(buffer.length/1024/1024).toFixed(1)} MB، نتخطاه`)
          continue
        }

        const { videoMessage } = await generateWAMessageContent({ video: buffer }, { upload: conn.waUploadToServer })
        if (!videoMessage) { console.log(`⚠️ فيديو ${i+1} ما انرفع`); continue }

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
        console.log(`✅ فيديو ${cards.length} جاهز في الكروسيل`)

      } catch (e) {
        console.log(`❌ فيديو ${i+1} فشل:`, e.message.slice(0, 150))
        continue
      }
    }

    if (!cards.length) { await react('❌'); return m.reply('❌ فشل تجهيز الفيديوهات\nجرب كلمة ثانية') }

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