// plugins/بينترف.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Pinterest Videos + Carousel ✅

import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import { unlinkSync, existsSync, statSync, readFileSync } from 'fs'
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

async function searchPinterestVideos(query, needed = 10) {
   const videos = []
   const seen = new Set()
   const cookies = await getPinterestCookies()
   if (!cookies) return videos

   let bookmarks = ['']
   let attempts = 0

   while (videos.length < needed && bookmarks.length && attempts < 25) {
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
            let isVideo = r?.is_video || r?.videos || r?.story_pin_data?.pages?.some(p => p?.blocks?.some(b => b?.video))
            if (!isVideo) continue
            seen.add(r.id)
            videos.push({
              link: `https://www.pinterest.com/pin/${r.id}/`,
              id: r.id,
              thumb: r?.images?.orig?.url || r?.images?.['736x']?.url || null
            })
            if (videos.length >= needed) break
         }
         const nextBookmark = data?.resource_response?.bookmark
         if (!nextBookmark || nextBookmark === '-end-') break
         bookmarks = [nextBookmark]
      } catch { break }
   }
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

  // تحميل من رابط
  if (text.includes('pin.it') || text.includes('pinterest.com/pin/')) {
    await react('⏳')
    await m.reply('⏳ جاري تحميل الفيديو...')
    try {
      const outputPath = join(tmpdir(), `pin_${Date.now()}.mp4`)
      const cmd = `${YTDLP_PATH} --no-playlist --force-overwrites --cookies ${COOKIES_PATH} --user-agent "Mozilla/5.0" -f "mp4/best[height<=720]/best" --remux-video mp4 --recode-video mp4 -o "${outputPath}" "${text}"`
      await execAsync(cmd, { timeout: 120000 })
      if (!existsSync(outputPath)) throw new Error('فشل')
      await conn.sendMessage(m.chat, { video: { url: outputPath }, mimetype: 'video/mp4', caption: `✅ تم التحميل\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓` }, { quoted: m })
      await react('✅')
      try { unlinkSync(outputPath) } catch {}
    } catch (e) { console.log(e.message); await react('❌'); m.reply('❌ فشل التحميل') }
    return
  }

  await react('🔍')
  await m.reply('🎬 جاري البحث عن 10 فيديوهات...')

  try {
    const videos = await searchPinterestVideos(text, 10)
    if (!videos.length) { await react('❌'); return m.reply('❌ لا توجد فيديوهات\nجرب كلمة ثانية') }

    await m.reply(`✅ لقيت ${videos.length} فيديو، جاري تحميل الكروسيل...`)

    let cards = []

    for (let i = 0; i < videos.length; i++) {
      let v = videos[i]
      let tmpFile = join(tmpdir(), `pinvid_${Date.now()}_${i}.mp4`)
      try {
        // 1. نحمل بـ yt-dlp ونحوله mp4 حقيقي
        let cmd = `${YTDLP_PATH} --no-playlist --force-overwrites --cookies ${COOKIES_PATH} --user-agent "Mozilla/5.0" -f "mp4/best[height<=720]/best" --remux-video mp4 --recode-video mp4 -o "${tmpFile}" "${v.link}"`
        await execAsync(cmd, { timeout: 90000 })
        if (!existsSync(tmpFile)) continue
        if (statSync(tmpFile).size < 10000) { try { unlinkSync(tmpFile) } catch {}; continue }

        let buffer = readFileSync(tmpFile)

        // 2. نسوي videoMessage للكروسيل
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
                url: v.link
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🎬 تحميل الفيديو",
                id: `.بينترف ${v.link}`
              })
            }]
          })
        })

      } catch (e) {
        console.log(`فشل فيديو ${i+1}:`, e.message)
        // اذا فشل الفيديو، نحط صورته كبديل عشان الكروسيل ما ينقص
        if (v.thumb) {
          try {
            const imgRes = await axios.get(v.thumb, { responseType: 'arraybuffer', timeout: 10000 })
            const { imageMessage } = await generateWAMessageContent({ image: Buffer.from(imgRes.data) }, { upload: conn.waUploadToServer })
            if (imageMessage) {
              cards.push({
                body: proto.Message.InteractiveMessage.Body.fromObject({ text: `🎬 فيديو ${i + 1} | 🔎 ${text}\n(اضغط فتح لمشاهدته)` }),
                header: proto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: true, imageMessage }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                  buttons: [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📌 فتح الفيديو", url: v.link }) }]
                })
              })
            }
          } catch {}
        }
        continue
      } finally {
        try { if (existsSync(tmpFile)) unlinkSync(tmpFile) } catch {}
      }
    }

    if (!cards.length) { await react('❌'); return m.reply('❌ فشل تحميل الكروسيل\nالكوكيز حق بنترست ممكن تكون منتهية') }

    // 3. ارسال الكروسيل
    const finalMessage = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
        body: proto.Message.InteractiveMessage.Body.create({
          text: `🎬 نتائج: ${text}\n📹 ${cards.length} فيديو\n⚡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
        }),
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