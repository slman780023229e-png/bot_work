// plugins/رابط.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦ عدة أوامر في ملف واحد - Pomf

import fetch from 'node-fetch'
import FormData from 'form-data'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

let handler = async (m, { conn }) => {
    try {
        const quoted = m.quoted
        if (!quoted) return m.reply(`رد على صورة / فيديو / صوت واكتب .رابط`)

        const mime = quoted.mimetype || quoted.msg?.mimetype || ''
        if (!mime.startsWith('image/') && !mime.startsWith('video/') && !mime.startsWith('audio/')) {
            return m.reply('❌ نوع الملف ده غير مدعوم.')
        }

        await m.reply('⏳ جاري رفع الملف على Pomf...')

        const buffer = await quoted.download()
        if (!buffer?.length) throw new Error('تعذر تحميل الملف.')

        let ext = mime.split('/')[1]?.split(';')[0] || 'bin'
        if (mime === 'image/jpeg') ext = 'jpg'
        if (mime === 'audio/mpeg') ext = 'mp3'
        if (mime === 'audio/mp4') ext = 'm4a'
        if (mime === 'video/mp4') ext = 'mp4'

        const filename = `arthur_${Date.now()}.${ext}`
        let fileUrl = ''

        const endpoints = [
            'https://pomf.lain.la/upload.php',
            'https://pomf2.lain.la/upload.php'
        ]

        for (let i = 0; i < endpoints.length && !fileUrl; i++) {
            try {
                if (i > 0) await sleep(1000)
                const form = new FormData()
                form.append('files[]', buffer, { filename, contentType: mime })
                const res = await fetch(endpoints[i], {
                    method: 'POST',
                    body: form,
                    headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' }
                })
                const data = await res.json()
                if (data?.success && data?.files?.[0]?.url) {
                    let u = data.files[0].url
                    fileUrl = u.startsWith('http') ? u : 'https://pomf.lain.la/' + u
                }
            } catch {}
        }

        if (!fileUrl) return m.reply(`❌ Pomf مشغول الحين، جرب بعد دقيقة.`)

        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n┃\n┃  ✓ تم الرفع بنجاح\n┃\n┃  🌐 السيرفر: Pomf - دائم\n┃  📦 الحجم: ${(buffer.length / 1024).toFixed(1)} KB\n┃\n┃  🔗 الرابط:\n┃\n┃  ${fileUrl}\n┃\n╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m })

    } catch (e) {
        await m.reply(`❌ فشل الرفع، جرب مرة ثانية.`)
    }
}

// بس أوامر الرابط - حذفت رفع ولينك
handler.command = /^(رابط|لرابط|وارابط|وا_رابط)$/i
handler.help = ['رابط', 'لرابط', 'وارابط']
handler.tags = ['tools']

export default handler