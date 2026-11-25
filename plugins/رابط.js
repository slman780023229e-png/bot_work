// plugins/رابط.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦ رفع Catbox + بديل 0x0.st

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

        await m.reply('⏳ جاري رفع الملف...')

        const buffer = await quoted.download()
        if (!buffer?.length) throw new Error('تعذر تحميل الملف.')

        let ext = mime.split('/')[1]?.split(';')[0] || 'bin'
        if (mime === 'image/jpeg') ext = 'jpg'
        if (mime === 'image/webp') ext = 'jpg'
        if (mime === 'audio/mpeg') ext = 'mp3'
        if (mime === 'audio/mp4') ext = 'm4a'
        if (mime.includes('audio/ogg')) ext = 'opus'
        if (mime === 'video/mp4') ext = 'mp4'

        const filename = `arthur_${Date.now()}.${ext}`
        let fileUrl = ''
        let serverName = ''

        // ===== 1 - جرب Catbox =====
        try {
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('userhash', '')
            form.append('fileToUpload', buffer, { filename, contentType: mime })

            const res = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: form,
                headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' }
            })
            const txt = (await res.text()).trim()
            if (txt.startsWith('https://')) {
                fileUrl = txt
                serverName = 'Catbox'
            }
        } catch {}

        // ===== 2 - اذا فشل Catbox جرب 0x0.st =====
        if (!fileUrl) {
            try {
                const form2 = new FormData()
                form2.append('file', buffer, { filename, contentType: mime })
                form2.append('expires', '8760') // سنة تقريبا

                const res2 = await fetch('https://0x0.st', {
                    method: 'POST',
                    body: form2,
                    headers: { ...form2.getHeaders(), 'User-Agent': 'ArthurBot/1.0' }
                })
                const txt2 = (await res2.text()).trim()
                if (txt2.startsWith('https://')) {
                    fileUrl = txt2
                    serverName = '0x0.st - يبقى من 30 يوم لسنة'
                }
            } catch {}
        }

        if (!fileUrl) return m.reply(`❌ كل السيرفرات مشغولة الحين، جرب بعد شوي.`)

        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n┃\n┃  ✓ تم الرفع بنجاح\n┃\n┃  🌐 السيرفر: ${serverName}\n┃  📦 الحجم: ${(buffer.length / 1024).toFixed(1)} KB\n┃\n┃  🔗 الرابط:\n┃\n┃  ${fileUrl}\n┃\n╰━━━━━━━━━━━━━━━━━━━━╯`
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