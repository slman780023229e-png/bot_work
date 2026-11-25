// plugins/رابط.js
// ✦ 𝐒𝐏𝐀𝐑𝐊𝐈𝐋 ✦ Catbox Uploader

import fetch from 'node-fetch'
import FormData from 'form-data'

let handler = async (m, { conn }) => {
    try {

        const quoted = m.quoted

        if (!quoted) {
            return m.reply(`
╭───────────────╮
│  🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓  │
╰───────────────╯
│
│  رد على:
│  🖼️ صورة
│  🎬 فيديو
│  🎵 صوت
│  🎨 ملصق
│
│  واكتب:
│  .رابط
│
╰────────────────
`)
        }

        const mime =
            quoted.mimetype ||
            quoted.msg?.mimetype ||
            ''

        const supported =
            mime.startsWith('image/') ||
            mime.startsWith('video/') ||
            mime.startsWith('audio/')

        if (!supported) {
            return m.reply('❌ نوع الملف ده غير مدعوم.')
        }

        await m.reply('⏳ جاري رفع الملف...')

        const buffer = await quoted.download()

        if (!buffer || !buffer.length) {
            throw new Error('تعذر تحميل الملف من الرسالة.')
        }

        let ext = 'bin'

        if (mime === 'image/jpeg') ext = 'jpg'
        else if (mime === 'image/png') ext = 'png'
        else if (mime === 'image/webp') ext = 'webp'
        else if (mime === 'image/gif') ext = 'gif'
        else if (mime === 'video/mp4') ext = 'mp4'
        else if (mime === 'video/webm') ext = 'webm'
        else if (mime === 'video/3gpp') ext = '3gp'
        else if (mime === 'audio/mpeg') ext = 'mp3'
        else if (mime === 'audio/mp4') ext = 'm4a'
        else if (mime === 'audio/ogg') ext = 'ogg'
        else if (mime === 'audio/opus') ext = 'opus'
        else if (mime.includes('/')) {
            ext = mime.split('/')[1].split(';')[0]
        }

        const filename = `arthur_${Date.now()}.${ext}`

        // تجهيز FormData لـ Catbox
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('fileToUpload', buffer, {
            filename,
            contentType: mime,
            knownLength: buffer.length
        })

        // رفع إلى Catbox
        const response = await fetch(
            'https://catbox.moe/user/api.php',
            {
                method: 'POST',
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0'
                },
                body: form
            }
        )

        const fileUrl = (await response.text()).trim()

        console.log('CATBOX RESPONSE:', fileUrl)

        if (!response.ok || !fileUrl.startsWith('https://')) {
            throw new Error('فشل رفع الملف إلى Catbox.')
        }

        await conn.sendMessage(
            m.chat,
            {
                text: `
╭━━━〔 🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮
┃
┃  ✓ تم رفع الملف بنجاح
┃
┃  📁 النوع: ${mime}
┃  📦 الحجم: ${(buffer.length / 1024).toFixed(1)} KB
┃
┃  🔗 الرابط:
┃
┃  ${fileUrl}
┃
╰━━━━━━━━━━━━━━━━━━━━╯
`
            },
            { quoted: m }
        )

    } catch (error) {

        console.error('CATBOX UPLOAD ERROR:', error)

        await m.reply(`
╭━━━〔 ❌ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮
┃
┃ فشل رفع الملف
┃
┃ السبب:
┃ ${error.message}
┃
╰━━━━━━━━━━━━━━━━━━━━╯
`)
    }
}

handler.command = /^رابط$/i
handler.help = ['رابط']
handler.tags = ['tools']

export default handler