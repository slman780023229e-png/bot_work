// plugins/لينكات.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦ بس لينكات و تغير

import fetch from 'node-fetch'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

const PLUGINS_DIR = './plugins'

async function uploadPomf(buffer, filename, mime) {
    const endpoints = ['https://pomf.lain.la/upload.php', 'https://pomf2.lain.la/upload.php']
    for (let url of endpoints) {
        try {
            const form = new FormData()
            form.append('files[]', buffer, { filename, contentType: mime })
            const res = await fetch(url, { method: 'POST', body: form, headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' } })
            const data = await res.json()
            if (data?.success && data?.files?.[0]?.url) {
                let u = data.files[0].url
                return u.startsWith('http') ? u : 'https://pomf.lain.la/' + u
            }
        } catch {}
    }
    return null
}

function findCommandFile(cmdName) {
    const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
    for (let file of files) {
        const content = fs.readFileSync(path.join(PLUGINS_DIR, file), 'utf-8')
        if (content.includes(cmdName)) {
            return { file, content, fullPath: path.join(PLUGINS_DIR, file) }
        }
    }
    return null
}

let handler = async (m, { text, command }) => {
    const cmd = command.toLowerCase()

    // ===== .لينكات - يعرض روابط الصور داخل كل أمر =====
    if (cmd === 'لينكات') {
        const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
        let msg = `╭━━━〔 🔗 لينكات 〕━━━╮\n┃\n`
        for (let file of files) {
            const content = fs.readFileSync(path.join(PLUGINS_DIR, file), 'utf-8')
            const urls = content.match(/https?:\/\/[^\s'"`]+?\.(jpg|jpeg|png|webp|gif|mp4)/gi) || []
            if (urls.length) {
                msg += `┃ 📁 ${file}\n`
                urls.forEach((u, i) => msg += `┃  ${i + 1} - ${u}\n`)
                msg += `┃\n`
            }
        }
        msg += `╰━━━━━━━━━━━━━━╯\n\nعشان تغير:\nرد على صورة واكتب:\n.تغير اسم_الأمر`
        return m.reply(msg)
    }

    // ===== .تغير اسم_الأمر - يغير رابط الصورة داخل الأمر =====
    if (cmd === 'تغير') {
        const targetCmd = text.trim().split(/\s+/)[0]
        if (!targetCmd) return m.reply(`اكتب اسم الأمر:\n.تغير منيو\nوأنت راد على الصورة الجديدة`)
        if (!m.quoted) return m.reply(`رد على الصورة الجديدة واكتب:\n.تغير ${targetCmd}`)

        const found = findCommandFile(targetCmd)
        if (!found) return m.reply(`❌ ما لقيت أمر اسمه ${targetCmd}`)

        let newUrl = ''
        const q = m.quoted
        const qText = q.text || q.caption || ''
        const urlMatch = qText.match(/https?:\/\/[^\s]+/g)
        if (urlMatch) {
            newUrl = urlMatch[0]
        } else {
            const mime = q.mimetype || q.msg?.mimetype || ''
            if (!mime.startsWith('image/') && !mime.startsWith('video/')) return m.reply('❌ رد على صورة أو رسالة فيها رابط')
            await m.reply('⏳ جاري رفع الصورة الجديدة...')
            const buffer = await q.download()
            let ext = mime.split('/')[1]?.split(';')[0] || 'jpg'
            newUrl = await uploadPomf(buffer, `arthur_${Date.now()}.${ext}`, mime)
        }
        if (!newUrl) return m.reply('❌ فشل الرفع')

        const oldUrls = found.content.match(/https?:\/\/[^\s'"`]+?\.(jpg|jpeg|png|webp|gif|mp4)/gi)
        if (!oldUrls || !oldUrls.length) return m.reply(`❌ ملف ${found.file} ما فيه رابط صورة`)

        const oldUrl = oldUrls[0]
        const newContent = found.content.replace(oldUrl, newUrl)
        fs.writeFileSync(found.fullPath, newContent)

        return m.reply(`✓ تم التغير\n\n📁 ${found.file}\nأمر: ${targetCmd}\n\nقبل:\n${oldUrl}\n\nالحين:\n${newUrl}\n\nسوي ريستارت للبوت`)
    }
}

// بس هذول الاثنين - ما في روابط ولا غيره
handler.command = /^(لينكات|تغير)$/i
handler.help = ['لينكات', 'تغير']
handler.tags = ['tools']

export default handler