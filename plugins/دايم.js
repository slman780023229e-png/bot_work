// plugins/رابط_دايم.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - رابط دايم بدون ما يثقل البوت ✧
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import FormData from 'form-data'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let handler = async (m, { conn }) => {
    try {
        const quoted = m.quoted
        if (!quoted) {
            return m.reply(`╭───────────────╮
│  🔗 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓  │
╰───────────────╯
│
│  رد على صورة واكتب:
│  .دايم
│
│  بيرفعها ويرجع لك
│  رابط دايم ما ينحذف
│
╰────────────────`)
        }

        const mime = quoted.mimetype || quoted.msg?.mimetype || ''
        if (!mime.startsWith('image/')) return m.reply('❌ رد على صورة بس.')

        await m.reply('⏳ جاري رفع الصورة لرابط دايم...')

        const buffer = await quoted.download()
        if (!buffer || !buffer.length) throw new Error('ما قدرت احمل الصورة.')

        // ── المحاولة 1: Catbox - دايم وما ينحذف ──
        let finalUrl = null
        let hostName = ''
        try {
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('fileToUpload', buffer, { filename: `arthur_${Date.now()}.jpg`, contentType: 'image/jpeg' })
            const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form })
            const txt = (await res.text()).trim()
            if (txt.startsWith('https://')) {
                finalUrl = txt
                hostName = 'Catbox - دايم ✅'
            }
        } catch (e) { console.log('Catbox فشل:', e.message) }

        // ── المحاولة 2: 0x0.st - احتياط دايم ──
        if (!finalUrl) {
            try {
                const form2 = new FormData()
                form2.append('file', buffer, { filename: `arthur_${Date.now()}.jpg`, contentType: 'image/jpeg' })
                const res2 = await fetch('https://0x0.st', { method: 'POST', body: form2 })
                const txt2 = (await res2.text()).trim()
                if (txt2.startsWith('https://')) {
                    finalUrl = txt2
                    hostName = '0x0.st - احتياط ✅'
                }
            } catch (e) { console.log('0x0 فشل:', e.message) }
        }

        if (!finalUrl) throw new Error('كل مواقع الرفع فشلت، حاول بعد شوي.')

        // ✅ نحفظ الرابط بس - سطر واحد، ما يثقل البوت ابداً
        // مو الصورة، بس الرابط
        try {
            fs.writeFileSync(path.join(__dirname, 'menu-url.txt'), finalUrl)
        } catch {}

        await conn.sendMessage(m.chat, {
            text: `╭━━━〔 ✅ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮
┃
┃  ✓ تم الرفع بنجاح
┃
┃  🏠 الموقع: ${hostName}
┃  📦 الحجم: ${(buffer.length / 1024).toFixed(1)} KB
┃  💾 التخزين: رابط بس، بدون صورة
┃     يعني البوت ما تثقل ابداً
┃
┃  🔗 الرابط الدايم:
┃  ${finalUrl}
┃
┃  ✅ تم حفظ الرابط تلقائياً
┃  في القائمة، اكتب .اوامر
┃  وبتطلع بالصورة الجديدة
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m })

    } catch (e) {
        console.error('[دايم] ERROR:', e)
        await m.reply(`❌ فشل\nالسبب: ${e.message}`)
    }
}

handler.help = ['دايم']
handler.tags = ['tools']
handler.command = /^(دايم|رابط_دايم|رابطدايم|permanent|perm)$/i
export default handler