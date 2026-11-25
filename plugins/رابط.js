// plugins/رابط.js - روابط دائمة ما تنحذف
import fetch from 'node-fetch'
import FormData from 'form-data'

let handler = async (m, { conn }) => {
    try {
        const quoted = m.quoted
        if (!quoted) return m.reply('❌ رد على صورة واكتب .رابط')
        await m.reply('⏳ جاري الرفع رابط دائم...')
        const mime = quoted.mimetype || 'image/jpeg'
        const buffer = await quoted.download()
        let ext = 'jpg'
        if (mime.includes('png')) ext = 'png'
        if (mime.includes('mp4')) ext = 'mp4'
        const filename = `arthur_${Date.now()}.${ext}`

        // 1 - Catbox بدون حساب - دائم ✅
        try {
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('userhash', '')
            form.append('fileToUpload', buffer, { filename, contentType: mime })
            const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, headers: form.getHeaders() })
            const txt = (await res.text()).trim()
            if (txt.startsWith('https://')) return m.reply(`✅ دائم - ما ينحذف:\n${txt}`)
        } catch (e) { console.log(e.message) }

        // 2 - Pomf Lain - دائم ✅
        try {
            const form = new FormData()
            form.append('files[]', buffer, { filename, contentType: mime })
            const res = await fetch('https://pomf.lain.la/upload.php', { method: 'POST', body: form, headers: form.getHeaders() })
            const data = await res.json()
            if (data?.files?.[0]?.url) {
                let u = data.files[0].url
                if (!u.startsWith('http')) u = 'https://pomf.lain.la' + u
                return m.reply(`✅ دائم - ما ينحذف:\n${u}`)
            }
        } catch (e) { console.log(e.message) }

        // 3 - Uguu - مؤقت 3 ساعات فقط
        try {
            const form = new FormData()
            form.append('files[]', buffer, { filename, contentType: mime })
            const res = await fetch('https://uguu.se/upload.php', { method: 'POST', body: form, headers: form.getHeaders() })
            const data = await res.json()
            if (data?.files?.[0]?.url) return m.reply(`⚠️ مؤقت - ينحذف بعد 3 ساعات:\n${data.files[0].url}`)
        } catch (e) { console.log(e.message) }

        return m.reply('❌ كل المواقع مشغولة')

    } catch (e) { await m.reply(`❌ خطأ: ${e.message}`) }
}
handler.command = /^(رابط)$/i
export default handler