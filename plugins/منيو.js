// plugins/لينكات.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦ نسخة مصلحة - تدور على الاسم الصح

import fetch from 'node-fetch'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

const PLUGINS_DIR = './plugins'

async function uploadFile(buffer, filename, mime) {
    const servers = [
        { name: 'Pomf', url: 'https://pomf.lain.la/upload.php', base: 'https://pomf.lain.la/' },
        { name: 'Pomf2', url: 'https://pomf2.lain.la/upload.php', base: 'https://pomf2.lain.la/' },
        { name: 'Satoru', url: 'https://upload.satoru.click/upload.php', base: 'https://upload.satoru.click/' }
    ]
    for (let s of servers) {
        try {
            const form = new FormData()
            form.append('files[]', buffer, { filename, contentType: mime })
            const res = await fetch(s.url, { method: 'POST', body: form, headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' } })
            const data = await res.json()
            if (data?.success && data?.files?.[0]?.url) {
                let u = data.files[0].url
                if (!u.startsWith('http')) u = s.base + u
                return { url: u, server: s.name }
            }
        } catch {}
    }
    return null
}

function extractUrls(content) {
    return content.match(/https?:\/\/[^\s'"`\)\]]+?\.(jpg|jpeg|png|webp|gif|mp4|mp3)/gi) || []
}

// === هنا التصليح الأساسي ===
function findCommandFile(cmdName) {
    cmdName = cmdName.trim().toLowerCase()
    const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
    let candidates = []

    for (let file of files) {
        const fullPath = path.join(PLUGINS_DIR, file)
        const content = fs.readFileSync(fullPath, 'utf-8')
        let score = 0
        let reason = ''

        // 1 - اسم الملف نفسه = اسم الأمر - أقوى دليل
        if (file.toLowerCase().replace('.js', '') === cmdName) {
            score += 100
            reason = 'اسم الملف مطابق'
        }
        // 2 - موجود في handler.command = /^(منيو|...)/
        // ندور على سطر handler.command
        const cmdRegex = /handler\.command\s*=\s*\/\^?\(?([^\/\)]+)/i
        const match = content.match(cmdRegex)
        if (match) {
            let cmds = match[1].split('|').map(c => c.trim().toLowerCase().replace(/[\^\$\(\)]/g, ''))
            if (cmds.includes(cmdName)) {
                score += 90
                reason = 'موجود في handler.command'
            }
        }
        // 3 - موجود في command = [...] أو ['منيو']
        if (content.includes(`'${cmdName}'`) || content.includes(`"${cmdName}"`)) {
            score += 20
            reason += ' | موجود ك نص'
        }

        if (score > 0) candidates.push({ file, content, fullPath, score, reason })
    }

    if (!candidates.length) return null
    // نرتب وناخذ أعلى واحد
    candidates.sort((a, b) => b.score - a.score)
    return candidates[0]
}

let handler = async (m, { conn, text, command }) => {
    const cmd = command.toLowerCase()

    if (cmd === 'لينكات') {
        const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
        let msg = `╭━━━〔 🔗 لينكات 〕━━━╮\n┃\n`
        for (let file of files) {
            const content = fs.readFileSync(path.join(PLUGINS_DIR, file), 'utf-8')
            const urls = extractUrls(content)
            // نطلع اسم الأمر الحقيقي من handler.command
            const cmdMatch = content.match(/handler\.command\s*=\s*\/\^?\(?([^\/\)]+)/i)
            const cmdName = cmdMatch ? cmdMatch[1] : file
            if (urls.length) {
                msg += `┃ 📁 ${file}\n┃ أمر: ${cmdName}\n`
                urls.forEach((u, i) => msg += `┃  ${i + 1} - ${u}\n`)
                msg += `┃\n`
            }
        }
        msg += `╰━━━━━━━━━━━━━━╯\n\nعشان تغير:\nرد على صورة واكتب:\n.تغير اسم_الأمر`
        return m.reply(msg)
    }

    if (cmd === 'تغير') {
        const targetCmd = text.trim().split(/\s+/)[0]?.toLowerCase()
        if (!targetCmd) return m.reply(`اكتب اسم الأمر:\n.تغير منيو\nوأنت راد على الصورة الجديدة`)
        if (!m.quoted) return m.reply(`رد على الصورة الجديدة واكتب:\n.تغير ${targetCmd}`)

        const found = findCommandFile(targetCmd)
        if (!found) return m.reply(`❌ ما لقيت أي ملف فيه أمر اسمه ${targetCmd}\n\nاكتب .لينكات وشوف الأسماء الصحيحة\nلازم تكتب الاسم مثل ما هو في handler.command`)

        let newUrl = ''
        let serverName = ''
        const q = m.quoted
        const qText = q.text || q.caption || ''
        const urlMatch = qText.match(/https?:\/\/[^\s]+/g)
        if (urlMatch) {
            newUrl = urlMatch[0]
            serverName = 'رابط جاهز'
        } else {
            const mime = q.mimetype || q.msg?.mimetype || ''
            if (!mime.startsWith('image/') && !mime.startsWith('video/')) return m.reply('❌ رد على صورة أو رسالة فيها رابط')
            await m.reply(`⏳ لقيت الملف: ${found.file}\nجاري الرفع...`)
            let buffer
            try { buffer = await q.download() } catch { buffer = await conn.downloadMediaMessage(q) }
            let ext = mime.split('/')[1]?.split(';')[0] || 'jpg'
            const result = await uploadFile(buffer, `arthur_${Date.now()}.${ext}`, mime)
            if (!result) return m.reply('❌ فشل الرفع')
            newUrl = result.url
            serverName = result.server
        }

        const oldUrls = extractUrls(found.content)
        if (!oldUrls.length) return m.reply(`❌ ملف ${found.file} ما فيه رابط صورة\nأمر: ${targetCmd}`)

        // لو فيه أكثر من رابط، نغير كل الروابط اللي تشبه القديم أو نغير الأول ونقولك
        const oldUrl = oldUrls[0]
        // نستبدل كل تكرار لنفس الرابط القديم
        const newContent = found.content.split(oldUrl).join(newUrl)
        fs.writeFileSync(found.fullPath, newContent)

        // === التأكد الحقيقي - مو كذب ===
        const check = fs.readFileSync(found.fullPath, 'utf-8')
        if (!check.includes(newUrl)) {
            return m.reply(`❌ فشل التغير!\nالملف: ${found.file}\nالرابط الجديد ما انحفظ`)
        }
        if (check.includes(oldUrl) && oldUrls.length === 1) {
            return m.reply(`❌ فشل، الرابط القديم لسه موجود`)
        }

        return m.reply(`✓ تم التغير فعلاً\n\n📁 ${found.file}\nأمر: ${targetCmd}\n🌐 السيرفر: ${serverName}\n🔍 لقيته بـ: ${found.reason}\nعدد الروابط في الملف: ${oldUrls.length}\n\nقبل:\n${oldUrl}\n\nالحين:\n${newUrl}\n\nسوي ريستارت للبوت`)
    }
}

handler.command = /^(لينكات|تغير)$/i
handler.help = ['لينكات', 'تغير']
handler.tags = ['tools']
export default handler