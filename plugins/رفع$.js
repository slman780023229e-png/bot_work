// plugins/رفع.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦ Catbox فقط - يجبر Catbox بأي طريقة

import fetch from 'node-fetch'
import FormData from 'form-data'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function uploadToCatbox(buffer, filename, mime, attempt) {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/119.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        'curl/8.0',
        'Mozilla/5.0 (Android 13; Mobile) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'
    ]
    const endpoints = [
        'https://catbox.moe/user/api.php',
        'https://catbox.moe/user/api.php',
        'http://catbox.moe/user/api.php'
    ]

    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', buffer, { filename, contentType: mime })

    const res = await fetch(endpoints[attempt % endpoints.length], {
        method: 'POST',
        body: form,
        headers: {
            ...form.getHeaders(),
            'User-Agent': userAgents[attempt % userAgents.length],
            'Referer': 'https://catbox.moe/',
            'Origin': 'https://catbox.moe',
            'Accept': '*/*'
        },
        timeout: 60000
    })
    const text = (await res.text()).trim()
    return text
}

let handler = async (m, { conn }) => {
    try {
        const quoted = m.quoted
        if (!quoted) return m.reply(`رد على صورة / فيديو / صوت واكتب .رفع`)

        const mime = quoted.mimetype || quoted.msg?.mimetype || ''
        if (!mime.startsWith('image/') && !mime.startsWith('video/') && !mime.startsWith('audio/')) {
            return m.reply('❌ نوع الملف ده غير مدعوم.')
        }

        await m.reply('⏳ جاري الرفع على Catbox... يرجى الانتظار، أحاول بأكثر من طريقة...')

        const buffer = await quoted.download()
        if (!buffer?.length) throw new Error('تعذر تحميل الملف.')

        let ext = mime.split('/')[1]?.split(';')[0] || 'bin'
        if (mime === 'image/jpeg') ext = 'jpg'
        if (mime === 'audio/mpeg') ext = 'mp3'
        if (mime === 'audio/mp4') ext = 'm4a'
        if (mime === 'video/mp4') ext = 'mp4'

        const filename = `arthur_${Date.now()}.${ext}`
        let fileUrl = ''

        // يجبر Catbox - 5 محاولات
        for (let i = 0; i < 5 && !fileUrl; i++) {
            try {
                if (i > 0) {
                    await m.reply(`⏳ المحاولة ${i + 1}/5 على Catbox...`)
                    await sleep(2000)
                }
                const text = await uploadToCatbox(buffer, filename, mime, i)
                if (text.startsWith('https://files.catbox.moe/')) {
                    fileUrl = text
                    break
                }
            } catch {}
        }

        if (!fileUrl) {
            return m.reply(`❌ Catbox مشغول الحين، جرب بعد دقيقة.\nهذا الكود يجبر Catbox بس، ما يروح لموقع ثاني.`)
        }

        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n┃\n┃  ✓ تم الرفع على Catbox\n┃\n┃  🌐 السيرفر: Catbox - دائم للأبد\n┃  📦 الحجم: ${(buffer.length / 1024).toFixed(1)} KB\n┃\n┃  🔗 الرابط:\n┃\n┃  ${fileUrl}\n┃\n╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m })

    } catch (e) {
        await m.reply(`❌ فشل الرفع على Catbox، جرب مرة ثانية.`)
    }
}

handler.command = /^رفع$/i
handler.help = ['رفع']
handler.tags = ['tools']

export default handler