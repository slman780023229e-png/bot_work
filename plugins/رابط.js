// plugins/رابط.js - نسخة جديدة تصلح خطأ Invalid uploader
import fetch from 'node-fetch'

const USERHASH = '4478575393ad6a406dcd08cc8' // حط الجديد هنا

let handler = async (m, { conn }) => {
    try {
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || q.mimetype || ''
        if (!/image|video|audio/.test(mime)) return m.reply('❌ رد على صورة واكتب .رابط')
        await m.reply('⏳ جاري الرفع...')

        const buffer = await q.download()
        console.log('حجم الملف:', buffer?.length, 'نوعه:', mime)
        if (!buffer || buffer.length === 0) return m.reply('❌ الملف فاضي، أرسل الصورة بدون View Once')

        let ext = 'jpg'
        if (mime.includes('png')) ext = 'png'
        if (mime.includes('webp')) ext = 'webp'
        if (mime.includes('mp4')) ext = 'mp4'
        const filename = `file_${Date.now()}.${ext}`

        // استخدم FormData الأصلي حق Node، مو مكتبة form-data
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('userhash', USERHASH.trim())
        form.append('fileToUpload', new Blob([buffer], { type: mime || 'image/jpeg' }), filename)

        const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form })
        const txt = (await res.text()).trim()
        console.log('رد Catbox:', res.status, txt)

        if (txt.startsWith('https://files.catbox.moe/')) {
            return m.reply(`✅ نجح بحسابك:\n${txt}`)
        }

        // لو قال Invalid، جرب بدون يوزرهاش عشان نعرف هل المشكلة من الحساب ولا من السيرفر
        const form2 = new FormData()
        form2.append('reqtype', 'fileupload')
        form2.append('fileToUpload', new Blob([buffer], { type: mime || 'image/jpeg' }), filename)
        const res2 = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form2 })
        const txt2 = (await res2.text()).trim()
        console.log('رد بدون حساب:', txt2)

        if (txt2.startsWith('https://files.catbox.moe/')) {
            return m.reply(`⚠️ رفع بدون حساب لأن حسابك مرفوض:\n${txt2}\n\nالسبب: اليوزرهاش القديم مات، أو الايميل مو مفعل\nارسل لي اليوزرهاش الجديد اللي طلع لك في Manage`)
        }

        return m.reply(`❌ رد Catbox: ${txt}\nرد بدون حساب: ${txt2}`)

    } catch (e) { await m.reply(`❌ خطأ: ${e.message}`) }
}
handler.command = /^(رابط)$/i
export default handler