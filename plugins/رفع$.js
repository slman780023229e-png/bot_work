// plugins/رفع.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦ رفع مضمون بدون كونسول - أمر .رفع

import fetch from 'node-fetch'
import FormData from 'form-data'

let handler = async (m, { conn }) => {
    try {
        const quoted = m.quoted
        if (!quoted) {
            return m.reply(`رد على صورة / فيديو / صوت واكتب .رفع`)
        }

        const mime = quoted.mimetype || quoted.msg?.mimetype || ''
        if (!mime.startsWith('image/') && !mime.startsWith('video/') && !mime.startsWith('audio/')) {
            return m.reply('❌ نوع الملف ده غير مدعوم.')
        }

        await m.reply('⏳ جاري رفع الملف...')

        const buffer = await quoted.download()
        if (!buffer?.length) throw new Error('تعذر تحميل الملف.')

        let ext = mime.split('/')[1]?.split(';')[0] || 'bin'
        if (mime === 'image/jpeg') ext = 'jpg'
        if (mime === 'audio/mpeg') ext = 'mp3'
        if (mime === 'audio/mp4') ext = 'm4a'

        const filename = `arthur_${Date.now()}.${ext}`
        let fileUrl = ''
        let hostName = ''

        // 1 - tmpfiles - الأكثر ضماناً
        if (!fileUrl) {
            try {
                const form = new FormData()
                form.append('file', buffer, { filename, contentType: mime })
                const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form, headers: form.getHeaders() })
                const data = await res.json()
                if (data?.data?.url) {
                    fileUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
                    hostName = 'TmpFiles'
                }
            } catch {}
        }

        // 2 - 0x0.st
        if (!fileUrl) {
            try {
                const form = new FormData()
                form.append('file', buffer, { filename, contentType: mime })
                const res = await fetch('https://0x0.st', { method: 'POST', body: form, headers: { ...form.getHeaders(), 'User-Agent': 'curl/8.0' } })
                const text = (await res.text()).trim()
                if (text.startsWith('https://')) {
                    fileUrl = text
                    hostName = '0x0.st'
                }
            } catch {}
        }

        // 3 - Catbox
        if (!fileUrl) {
            try {
                const form = new FormData()
                form.append('reqtype', 'fileupload')
                form.append('fileToUpload', buffer, { filename, contentType: mime })
                const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' } })
                const text = (await res.text()).trim()
                if (text.startsWith('https://')) {
                    fileUrl = text
                    hostName = 'Catbox'
                }
            } catch {}
        }

        // 4 - Uguu - آخر حل
        if (!fileUrl) {
            try {
                const form = new FormData()
                form.append('files[]', buffer, { filename, contentType: mime })
                const res = await fetch('https://uguu.se/upload', { method: 'POST', body: form, headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' } })
                const data = await res.json()
                if (data?.files?.[0]?.url) {
                    fileUrl = data.files[0].url
                    hostName = 'Uguu'
                }
            } catch {}
        }

        if (!fileUrl) {
            return m.reply(`❌ فشل الرفع، جرب مرة ثانية بعد شوي، السيرفر ضعيف الحين.`)
        }

        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n┃\n┃  ✓ تم رفع الملف بنجاح\n┃\n┃  🌐 السيرفر: ${hostName}\n┃  📦 الحجم: ${(buffer.length / 1024).toFixed(1)} KB\n┃\n┃  🔗 الرابط:\n┃\n┃  ${fileUrl}\n┃\n╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m })

    } catch (e) {
        await m.reply(`❌ فشل الرفع، جرب مرة ثانية.`)
    }
}

handler.command = /^رفع$/i
handler.help = ['رفع']
handler.tags = ['tools']

export default handler