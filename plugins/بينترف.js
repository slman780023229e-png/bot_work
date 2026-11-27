// plugins/بينترف.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight - Pinterest Videos 📌

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

// ═══════════════════════════════════════
// سكرابر Pinterest الرسمي - فيديوهات فقط
// ═══════════════════════════════════════
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
   } catch {
      return null
   }
}

// يجلب فيديوهات فقط
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
            data: JSON.stringify({
               options: { isPrefetch: false, query, scope: 'pins', bookmarks, page_size: 50 },
               context: {}
            }),
            _: Date.now()
         }

         const { data } = await axios.get(`${PINTEREST_BASE}${PINTEREST_SEARCH_PATH}`, {
            headers: { ...PINTEREST_HEADERS, cookie: cookies },
            params,
            timeout: 15000
         })

         const results = data?.resource_response?.data?.results || []
         if (!results.length) break

         for (const r of results) {
            // فيديو من Pinterest
            let videoUrl = null
            let thumb = r?.images?.orig?.url || null

            // الطريقة 1: videos.video_list
            if (r?.videos?.video_list) {
               let list = r.videos.video_list
               // خذ اعلى جودة
               let best = list['V_720P'] || list['V_480P'] || list['V_360P'] || list['V_HLS_V4'] || Object.values(list)[0]
               if (best?.url) videoUrl = best.url
            }

            // الطريقة 2: story_pin_data
            if (!videoUrl && r?.story_pin_data?.pages?.length) {
               for (let page of r.story_pin_data.pages) {
                  if (page?.blocks?.length) {
                     for (let b of page.blocks) {
                        if (b?.video?.video_list) {
                           let vlist = b.video.video_list
                           let best = vlist['V_720P'] || vlist['V_480P'] || Object.values(vlist)[0]
                           if (best?.url) { videoUrl = best.url; break }
                        }
                     }
                  }
                  if (videoUrl) break
               }
            }

            // الطريقة 3: embed
            if (!videoUrl && r?.embed?.src) videoUrl = null // نتجاهل embed

            if (videoUrl) {
               videos.push({
                  video: videoUrl,
                  thumb: thumb,
                  title: r?.title || r?.description || query,
                  link: `https://www.pinterest.com/pin/${r?.id}/`,
                  id: r?.id
               })
               if (videos.length >= needed) break
            }
         }

         const nextBookmark = data?.resource_response?.bookmark
         if (!nextBookmark || nextBookmark === '-end-') break
         bookmarks = [nextBookmark]
      } catch (e) {
         break
      }
   }

   return videos.slice(0, needed)
}

// ═══════════════════════════════════════
// Handler
// ═══════════════════════════════════════
let handler = async (m, { conn, text, usedPrefix, command }) => {

  const react = async (emoji) => {
    try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
  }

  if (!text) {
    return m.reply(theme.build([
      { type: 'title', text: '🎬 Pinterest Videos - ARTHUR BOT' },
      { type: 'divider' },
      { type: 'info', label: '🎬 بحث فيديوهات', value: `${usedPrefix + command} <كلمة>` },
      { type: 'info', label: '📌 تحميل فيديو', value: `${usedPrefix + command} <رابط>` },
      { type: 'info', label: 'مثال', value: `${usedPrefix + command} انمي` }
    ]))
  }

  // تحميل فيديو من الرابط - نفس القديم
  if (text.includes('pin.it') || text.includes('pinterest.com/pin/')) {
    await react('⏳')
    await m.reply('⏳ جاري تحميل الفيديو...')

    try {
      const outputPath = join(tmpdir(), `pin_${Date.now()}.mp4`)
      const cmd = `export PATH=$HOME/.deno/bin:$PATH && ${YTDLP_PATH} -o ${outputPath} ${text} --cookies ${COOKIES_PATH} --no-playlist --force-overwrites --no-cookies --sleep-interval 5 --user-agent "Mozilla/5.0"`
      await execAsync(cmd, { timeout: 180000 })

      if (!existsSync(outputPath)) throw new Error('فشل')
      const sizeMB = (statSync(outputPath).size / 1048576).toFixed(2)

      await conn.sendMessage(m.chat, {
        video: { url: outputPath },
        caption: `✅ تم التحميل بواسطة ARTHUR BOT | ${sizeMB} MB`
      }, { quoted: m })
      await react('✅')
      try { unlinkSync(outputPath) } catch {}
    } catch (e) {
      await react('❌')
      m.reply('❌ فشل التحميل')
    }
    return
  }

  // بحث فيديوهات
  await react('🔍')
  await m.reply('🎬 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 يبحث عن الفيديوهات...')

  try {
    const videos = await searchPinterestVideos(text, 15)

    if (!videos || videos.length === 0) {
      await react('❌')
      return m.reply('❌ لا توجد فيديوهات لهذا البحث\nجرب كلمة ثانية')
    }

    let cards = []
    
    for (let i = 0; i < videos.length; i++) {
      try {
        let v = videos[i]
        // نجرب نحمل الفيديو مباشر
        const vidRes = await axios.get(v.video, { 
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pinterest.com/' },
          timeout: 30000,
          maxContentLength: 60 * 1024 * 1024
        })
        
        const buffer = Buffer.from(vidRes.data)
        if (buffer.length < 5000) continue
        
        const { videoMessage } = await generateWAMessageContent(
          { video: buffer },
          { upload: conn.waUploadToServer }
        )
        
        if (!videoMessage) continue

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({ 
            text: `🎬 فيديو ${i + 1} | 🔎 ${text}` 
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({ 
            hasMediaAttachment: true,
            videoMessage: videoMessage 
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [{
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "📌 فتح في Pinterest",
                url: v.link || 'https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(text)
              })
            }]
          })
        })
      } catch (e) { 
        continue 
      }
    }

    if (cards.length === 0) {
      await react('❌')
      return m.reply('❌ فشل تحميل الفيديوهات\nجرب مرة ثانية')
    }

    const finalMessage = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
        body: proto.Message.InteractiveMessage.Body.create({
          text: `🎬 نتائج: ${text}\n📹 ${cards.length} فيديو\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight`
        }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: global.watermark }),
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