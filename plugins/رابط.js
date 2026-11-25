// plugins/رابط.js - باليوزرهاش الصح
import fetch from 'node-fetch'
import FormData from 'form-data'

const USERHASH = '4478575393ad6a406dcd08cc8'

let handler = async (m, { conn }) => {
    try {
        const quoted = m.quoted
        if (!quoted) return m.reply('❌ رد على صورة واكتب .رابط')

        await m.reply('⏳ جاري الرفع على حسابك...')
        const mime = quoted.mimetype || 'image/jpeg'
        const buffer = await quoted.download()
        let ext = 'jpg'
        if (mime.includes('png')) ext = 'png'
        if (mime.includes('mp4')) ext = 'mp4'
        const filename = `arthur_${Date.now()}.${ext}`

        // 1 - Catbox - حسابك
        try {
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('userhash', USERHASH)
            form.append('fileToUpload', buffer, { filename, contentType: mime })
            const res = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST', body: form, headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' }
            })
            const txt = (await res.text()).trim()
            console.log('Catbox رد:', res.status, txt)
            if (txt.startsWith('https://')) return m.reply(`✅ تم الرفع على حسابك:\n${txt}`)
            await m.reply(`❌ Catbox رفض: ${txt}\n\nبجرب سيرفر بديل...`)
        } catch (e) {
            await m.reply(`❌ Catbox ما وصل: ${e.message}\nبجرب سيرفر بديل...`)
        }

        // 2 - Tmpfiles - بديل شغال
        try {
            const form = new FormData()
            form.append('file', buffer, { filename, contentType: mime })
            const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form, headers: form.getHeaders() })
            const data = await res.json()
            if (data?.url) return m.reply(`✅ Tmpfiles:\n${data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')}`)
        } catch (e) { console.log(e.message) }

        // 3 - Litterbox
        try {
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('time', '72h')
            form.append('fileToUpload', buffer, { filename, contentType: mime })
            const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: form, headers: form.getHeaders() })
            const txt = (await res.text()).trim()
            if (txt.startsWith('https://')) return m.reply(`✅ Litterbox:\n${txt}`)
        } catch (e) { console.log(e.message) }

        return m.reply('❌ كل السيرفرات رفضت')

    } catch (e) {
        await m.reply(`❌ خطأ: ${e.message}`)
    }
}
handler.command = /^(رابط)$/i
export default handler