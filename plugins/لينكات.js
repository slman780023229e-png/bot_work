// plugins/لينكات.js
// ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦ تغير رابط برابط - حسب اسم الملف

import fs from 'fs'
import path from 'path'

const PLUGINS_DIR = './plugins'

function extractUrls(content) {
    return content.match(/https?:\/\/[^\s'"`\)\]]+?\.(jpg|jpeg|png|webp|gif|mp4|mp3)/gi) || []
}

function findLinkInText(txt) {
    if (!txt) return null
    const m = txt.match(/https?:\/\/[^\s'"`]+/g)
    return m ? m[0].trim() : null
}

let handler = async (m, { text, command }) => {
    const cmd = command.toLowerCase()

    if (cmd === 'لينكات') {
        const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'))
        let msg = `╭━━━〔 🔗 لينكات 〕━━━╮\n┃\n`
        for (let file of files) {
            const content = fs.readFileSync(path.join(PLUGINS_DIR, file), 'utf-8')
            const urls = extractUrls(content)
            if (urls.length) {
                msg += `┃ 📁 ${file}\n`
                urls.forEach((u, i) => msg += `┃  ${i + 1} - ${u}\n`)
                msg += `┃\n`
            }
        }
        msg += `╰━━━━━━━━━━━━━━╯\n\nعشان تغير رابط:\n.تغير اسم_الملف الرابط_الجديد`
        return m.reply(msg)
    }

    if (cmd === 'تغير') {
        // .تغير اسم_الملف الرابط_الجديد
        const parts = text.trim().split(/\s+/)
        let fileName = parts[0]
        let newUrl = parts[1] || null // الرابط لو كتبته بنفس الرسالة

        if (!fileName) return m.reply(`اكتب هيك:\n.تغير اسم_الملف الرابط_الجديد\n\nمثال:\n.تغير ترحيب https://pomf.lain.la/xxxx.jpg`)

        // لو ما كتب الرابط بنفس الرسالة، ندور عليه في الرد
        if (!newUrl && m.quoted) {
            const q = m.quoted
            // نجرب كل الأماكن اللي ممكن يكون فيها الرابط
            const qText = q.text || q.caption || q.msg?.text || q.msg?.caption || q.body || ''
            newUrl = findLinkInText(qText)
            // لو الرد فيه رابط في رسالة مقتبسة داخلها كمان
            if (!newUrl && q.quoted) {
                const qq = q.quoted.text || q.quoted.caption || ''
                newUrl = findLinkInText(qq)
            }
        }

        // لو لسه ما لقينا رابط، ندور في نفس رسالة الأمر كلها
        if (!newUrl) newUrl = findLinkInText(text)

        if (!newUrl) return m.reply(`❌ ما لقيت رابط جديد\n\nاكتب هيك:\n.تغير ${fileName} https://الرابط-الجديد.jpg\n\nأو رد على رسالة فيها الرابط واكتب:\n.تغير ${fileName}`)

        if (!fileName.endsWith('.js')) fileName = fileName + '.js'
        const fullPath = path.join(PLUGINS_DIR, fileName)
        if (!fs.existsSync(fullPath)) return m.reply(`❌ ما لقيت ملف اسمه ${fileName}`)

        const oldContent = fs.readFileSync(fullPath, 'utf-8')
        const oldUrls = extractUrls(oldContent)
        if (!oldUrls.length) return m.reply(`❌ ملف ${fileName} ما فيه رابط صورة`)

        const oldUrl = oldUrls[0]
        // نبدل الرابط بس، ما نلمس شي ثاني
        const newContent = oldContent.split(oldUrl).join(newUrl)
        fs.writeFileSync(fullPath, newContent, 'utf-8')

        const check = fs.readFileSync(fullPath, 'utf-8')
        if (!check.includes(newUrl)) return m.reply(`❌ فشل التغير`)

        return m.reply(`✓ تم تغير الرابط\n\n📁 ${fileName}\n\nقبل:\n${oldUrl}\n\nالحين:\n${newUrl}\n\nسوي ريستارت للبوت`)
    }
}

handler.command = /^(لينكات|تغير)$/i
handler.help = ['لينكات', 'تغير']
handler.tags = ['tools']
export default handler