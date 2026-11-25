// plugins/رابط.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦ رفع على Catbox

import fetch from 'node-fetch'
import FormData from 'form-data'

let handler = async (m, { conn }) => {
    try {
        const quoted = m.quoted
        if (!quoted) return m.reply(`رد على صورة / فيديو / صوت واكتب .رابط`)

        const mime = quoted.mimetype || quoted.msg?.mimetype || ''
        if (!mime.startsWith('image/') && !mime.startsWith('video/') && !mime.startsWith('audio/')) {
            return m.reply('❌ نوع الملف ده غير مدعوم.')
        }

        await m.reply('⏳ جاري رفع الملف على Catbox...')

        const buffer = await quoted.download()
        if (!buffer?.length) throw new Error('تعذر تحميل الملف.')

        let ext = mime.split('/')[1]?.split(';')[0] || 'bin'
        if (mime === 'image/jpeg') ext = 'jpg'
        if (mime === 'audio/mpeg') ext = 'mp3'
        if (mime === 'audio/mp4') ext = 'm4a'
        if (mime === 'audio/ogg; codecs=opus') ext = 'opus'
        if (mime === 'video/mp4') ext = 'mp4'

        const filename = `arthur_${Date.now()}.${ext}`

        // ===== الرفع على Catbox =====
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('fileToUpload', buffer, { filename, contentType: mime })

        const res = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: form,
            headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' }
        })

        let fileUrl = (await res.text()).trim()

        if (!fileUrl.startsWith('https://')) {
            return m.reply(`❌ Catbox مشغول الحين، جرب بعد دقيقة.\n${fileUrl}`)
        }

        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n┃\n┃  ✓ تم الرفع بنجاح\n┃\n┃  🌐 السيرفر: Catbox - يبقى سنتين بدون استخدام\n┃  📦 الحجم: ${(buffer.length / 1024).toFixed(1)} KB\n┃\n┃  🔗 الرابط:\n┃\n┃  ${fileUrl}\n┃\n╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m })

    } catch (e) {
        console.log(e)
        await m.reply(`❌ فشل الرفع، جرب مرة ثانية.`)
    }
}

handler.command = /^(رابط|لرابط|وارابط|وا_رابط)$/i
handler.help = ['رابط', 'لرابط', 'وارابط']
handler.tags = ['tools']

export default handler