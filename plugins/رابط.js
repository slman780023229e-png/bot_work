// plugins/link.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - رفع ملف ورابط ✦
import fetch from 'node-fetch'
import FormData from 'form-data'

let handler = async (m, { conn, usedPrefix }) => {
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
│  ${usedPrefix}رابط
│
╰────────────────
`)
        }

        const mime = quoted.mimetype || quoted.msg?.mimetype || ''
        console.log('[رابط] mime:', mime)

        const supported = mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/') || mime === 'image/webp' || mime.includes('sticker')
        if (!supported) {
            return m.reply(`❌ نوع الملف غير مدعوم.\nالنوع اللي وصلني: ${mime || 'فارغ'}`)
        }

        await m.reply('⏳ جاري رفع الملف...')

        const buffer = await quoted.download()
        if (!buffer || !buffer.length) throw new Error('تعذر تحميل الملف من الرسالة.')

        let ext = 'bin'
        if (mime === 'image/jpeg') ext = 'jpg'
        else if (mime === 'image/png') ext = 'png'
        else if (mime === 'image/webp') ext = 'webp'
        else if (mime === 'image/gif') ext = 'gif'
        else if (mime === 'video/mp4') ext = 'mp4'
        else if (mime === 'audio/mpeg') ext = 'mp3'
        else if (mime === 'audio/ogg') ext = 'ogg'
        else if (mime.includes('/')) ext = mime.split('/')[1].split(';')[0]

        const filename = `arthur_${Date.now()}.${ext}`

        // ── المحاولة 1: Catbox - شغال الحين ──
        try {
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('fileToUpload', buffer, { filename, contentType: mime })
            const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form })
            const url = (await res.text()).trim()
            console.log('[رابط] Catbox:', url)
            if (url.startsWith('https://')) {
                return conn.sendMessage(m.chat, {
                    text: `╭━━━〔 🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n┃\n┃  ✓ تم رفع الملف بنجاح\n┃\n┃  📁 النوع: ${mime}\n┃  📦 الحجم: ${(buffer.length / 1024).toFixed(1)} KB\n┃\n┃  🔗 الرابط:\n┃\n┃  ${url}\n┃\n╰━━━━━━━━━━━━━━━━━━━━╯`
                }, { quoted: m })
            }
        } catch (e) { console.log('[رابط] Catbox فشل:', e.message) }

        // ── المحاولة 2: Uguu - احتياط ──
        const form2 = new FormData()
        form2.append('files[]', buffer, { filename, contentType: mime, knownLength: buffer.length })
        const response = await fetch('https://uguu.se/upload', {
            method: 'POST',
            headers: { ...form2.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
            body: form2
        })
        const raw = await response.text()
        console.log('UGUU RESPONSE:', raw)
        let data = JSON.parse(raw)
        const fileUrl = data?.files?.[0]?.url || data?.url
        if (!fileUrl) throw new Error('فشل رفع الملف في كل المواقع.')

        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n┃\n┃  ✓ تم رفع الملف بنجاح\n┃  📁 النوع: ${mime}\n┃  🔗 الرابط:\n┃  ${fileUrl}\n┃\n╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m })

    } catch (error) {
        console.error('UPLOAD ERROR:', error)
        await m.reply(`╭━━━〔 ❌ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n┃\n┃ فشل رفع الملف\n┃ السبب:\n┃ ${error.message}\n┃\n╰━━━━━━━━━━━━━━━━━━━━╯`)
    }
}

// ✅ هنا كان الخطأ - صلحته
handler.command = /^(رابط|لرابط|link|upload)$/i
handler.help = ['رابط']
handler.tags = ['tools']

export default handler