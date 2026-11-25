// plugins/رابط.js - رفع مضمون من Catbox بحسابك
import fetch from 'node-fetch'
import FormData from 'form-data'

// ⚠️ حط هنا اليوزرهاش الجديد حقك بعد ما تسوي رمز جديد
// لا تحط القديم اللي انتشر بالصورة
const USERHASH = '4478575393ad6a406dcd08cc8'

let handler = async (m, { conn }) => {
    try {
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || q.mimetype || ''
        if (!/image|video|audio|sticker/.test(mime)) {
            return m.reply('❌ رد على صورة أو فيديو أو مقطع صوتي واكتب .رابط')
        }

        await m.reply('⏳ جاري الرفع بحسابك...')

        const buffer = await q.download()
        if (!buffer) return m.reply('❌ ما قدرت احمل الملف، جرب مرة ثانية')

        // Catbox يقبل لحد 200MB بس
        if (buffer.length > 200 * 1024 * 1024) {
            return m.reply('❌ الملف أكبر من 200MB، Catbox ما يقبله')
        }

        let ext = 'jpg'
        if (mime.includes('png')) ext = 'png'
        if (mime.includes('webp')) ext = 'webp'
        if (mime.includes('mp4')) ext = 'mp4'
        if (mime.includes('mp3')) ext = 'mp3'
        if (mime.includes('ogg') || mime.includes('opus')) ext = 'opus'
        if (mime.includes('gif')) ext = 'gif'

        const filename = `file_${Date.now()}.${ext}`

        // 3 محاولات اجبارية بحسابك
        for (let i = 1; i <= 3; i++) {
            try {
                const form = new FormData()
                form.append('reqtype', 'fileupload')
                form.append('userhash', USERHASH)
                form.append('fileToUpload', buffer, { filename, contentType: mime || 'image/jpeg' })

                const res = await fetch('https://catbox.moe/user/api.php', {
                    method: 'POST',
                    body: form,
                    headers: form.getHeaders()
                })

                const txt = (await res.text()).trim()
                console.log(`محاولة ${i}:`, txt)

                if (txt.startsWith('https://files.catbox.moe/')) {
                    return m.reply(`✅ تم الرفع بحسابك - للأبد\n\n${txt}\n\n📁 بتلقاه في Manage بحسابك`)
                }

                if (txt.toLowerCase().includes('invalid')) {
                    return m.reply('❌ اليوزرهاش غلط أو قديم\nسوي رمز جديد من Manage وحطه في الكود')
                }

                await new Promise(r => setTimeout(r, 2000))

            } catch (e) {
                console.log('خطأ محاولة', i, e.message)
                await new Promise(r => setTimeout(r, 2000))
            }
        }

        return m.reply('❌ Catbox مشغول الحين، جرب بعد دقيقة، ما رفعت لك مجهول')

    } catch (e) {
        console.log(e)
        await m.reply(`❌ خطأ: ${e.message}`)
    }
}
handler.command = /^(رابط)$/i
export default handler