// plugins/رابط.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦ رفع 10 سيرفرات - ما يفشل أبدا

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

        await m.reply('⏳ جاري رفع الملف على 10 سيرفرات...')

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
        const sizeKB = (buffer.length / 1024).toFixed(1)

        // ===== دوال الرفع =====

        // 1 - سيرفرات ستايل Pomf
        async function uploadPomf(url) {
            const form = new FormData()
            form.append('files[]', buffer, { filename, contentType: mime })
            const res = await fetch(url, {
                method: 'POST', body: form,
                headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' }
            })
            const data = await res.json()
            if (data?.success && data?.files?.[0]?.url) {
                let u = data.files[0].url
                if (!u.startsWith('http')) {
                    let base = url.replace('/upload.php', '')
                    u = base + u
                }
                return u
            }
            throw new Error('pomf fail')
        }

        // 2 - Catbox
        async function uploadCatbox() {
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('userhash', '')
            form.append('fileToUpload', buffer, { filename, contentType: mime })
            const res = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST', body: form,
                headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' }
            })
            const txt = (await res.text()).trim()
            if (txt.startsWith('https://')) return txt
            throw new Error(txt)
        }

        // 3 - Litterbox - مؤقت 72 ساعة
        async function uploadLitterbox() {
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('time', '72h')
            form.append('fileToUpload', buffer, { filename, contentType: mime })
            const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
                method: 'POST', body: form,
                headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' }
            })
            const txt = (await res.text()).trim()
            if (txt.startsWith('https://')) return txt
            throw new Error(txt)
        }

        // 4 - سيرفرات ستايل 0x0
        async function upload0x(url, field = 'file') {
            const form = new FormData()
            form.append(field, buffer, { filename, contentType: mime })
            const res = await fetch(url, {
                method: 'POST', body: form,
                headers: { ...form.getHeaders(), 'User-Agent': 'ArthurBot/1.0' }
            })
            const txt = (await res.text()).trim()
            if (txt.startsWith('https://')) return txt
            throw new Error(txt)
        }

        // 5 - tmpfiles
        async function uploadTmpfiles() {
            const form = new FormData()
            form.append('file', buffer, { filename, contentType: mime })
            const res = await fetch('https://tmpfiles.org/api/v1/upload', {
                method: 'POST', body: form,
                headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' }
            })
            const data = await res.json()
            if (data?.url) return data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
            throw new Error('tmpfiles fail')
        }

        // ===== قائمة 10 سيرفرات بالترتيب =====
        const servers = [
            { name: 'Satoru - الأفضل الحين', fn: () => uploadPomf('https://upload.satoru.click/upload.php') },
            { name: 'Catbox - سنتين', fn: () => uploadCatbox() },
            { name: '0x0.st - سنة', fn: () => upload0x('https://0x0.st') },
            { name: 'Pomf Lain', fn: () => uploadPomf('https://pomf.lain.la/upload.php') },
            { name: 'Pomf2 Lain', fn: () => uploadPomf('https://pomf2.lain.la/upload.php') },
            { name: 'Envs.sh - سنة', fn: () => upload0x('https://envs.sh') },
            { name: 'Tmpfiles - ساعة', fn: () => uploadTmpfiles() },
            { name: 'Litterbox - 72 ساعة', fn: () => uploadLitterbox() },
            { name: 'Transfer.sh', fn: () => upload0x('https://transfer.sh/') },
            { name: 'File.io - مؤقت', fn: () => upload0x('https://file.io/') },
        ]

        let fileUrl = ''
        let serverName = ''

        for (let s of servers) {
            try {
                fileUrl = await s.fn()
                serverName = s.name
                break
            } catch (e) {
                console.log(`[رابط] فشل ${s.name}:`, e.message?.slice(0, 100))
                continue
            }
        }

        if (!fileUrl) return m.reply(`❌ كل الـ 10 سيرفرات مشغولة، جرب بعد شوي.`)

        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n┃\n┃  ✓ تم الرفع بنجاح\n┃\n┃  🌐 السيرفر: ${serverName}\n┃  📦 الحجم: ${sizeKB} KB\n┃  🔁 الاحتياط: 10 سيرفرات\n┃\n┃  🔗 الرابط:\n┃\n┃  ${fileUrl}\n┃\n╰━━━━━━━━━━━━━━━━━━━━╯`
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