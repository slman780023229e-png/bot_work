// plugins/جلب.js
// ✧ ARTHUR BOT - جلب واستبدال الملفات الرئيسية ✧

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.join(__dirname, '..')

const ownerNumber = '967780023229'

// الملفات الممنوعة - لا تنجلب ولا تستبدل أبداً
const BLOCKED = [
    '.env', 'creds.json', '.git', 'node_modules',
    'ArthurSession', 'ArthurSubBot', 'BackupSession',
    'session', 'sessions', 'auth_info_baileys', 'database'
]

// جلب قائمة الملفات الرئيسية
const getMainFiles = () => {
    let files = []
    try {
        const rootFiles = fs.readdirSync(ROOT, { withFileTypes: true })
        for (const f of rootFiles) {
            if (f.isFile() && /\.(js|json|txt|md)$/i.test(f.name)) {
                if (BLOCKED.some(b => f.name.includes(b))) continue
                if (f.name === 'جلب.js') continue
                files.push({ name: f.name, path: path.join(ROOT, f.name), folder: '📁 رئيسي' })
            }
        }
        // ملفات plugins
        const pluginFiles = fs.readdirSync(__dirname, { withFileTypes: true })
        for (const f of pluginFiles) {
            if (f.isFile() && f.name.endsWith('.js')) {
                files.push({ name: f.name, path: path.join(__dirname, f.name), folder: '📂 plugins' })
            }
        }
    } catch {}
    return files
}

// تنظيف الكود من علامات ``` 
const cleanCode = (text = '') => {
    let t = String(text).trim()
    // إذا كان داخل ```js ... ```
    const match = t.match(/```(?:js|javascript|json|txt)?\s*([\s\S]*?)```/i)
    if (match) t = match[1]
    return t.trim()
}

const handler = async (m, { conn, text, usedPrefix }) => {
    // للمطور فقط
    const sender = (m.sender || '').replace(/[^0-9]/g, '')
    if (!sender.includes(ownerNumber) && sender !== ownerNumber) {
        return m.reply('❌ هذا الأمر للمطور فقط 👑')
    }

    const args = String(text || '').trim()
    const cmd = String(m.text || '').trim().split(/\s+/)[0].replace(/^[.!/#]/, '')
    const isReplace = /^(استبدال|استبدل)$/i.test(cmd)

    const files = getMainFiles()
    if (!files.length) return m.reply('❌ ما لقيت ملفات.')

    // ══ 1. عرض القائمة بدون رقم ══
    if (!args) {
        let list = `*📂 ملفات ARTHUR BOT الرئيسية*\n\n`
        files.forEach((f, i) => {
            list += `*${i + 1}.* ${f.name} ${f.folder}\n`
        })
        list += `\n*━━━━━━━━━━━━━━*\n`
        list += `💡 للجلب اكتب:\n`
        list += `› ${usedPrefix}جلب 1\n`
        list += `› ${usedPrefix}جلب اسم الملف\n\n`
        list += `♻️ للاستبدال رد على الكود واكتب:\n`
        list += `› ${usedPrefix}استبدال 1\n`
        list += `› ${usedPrefix}استبدال اسم الملف`
        return m.reply(list)
    }

    // ══ 2. تحديد الملف بالرقم أو بالاسم ══
    let target = null
    if (/^\d+$/.test(args)) {
        const num = parseInt(args)
        target = files[num - 1]
    } else {
        // بحث بالاسم - حتى لو كتب جزء من الاسم
        const search = args.replace(/\.js$/i, '').toLowerCase()
        target = files.find(f => f.name.toLowerCase() === search + '.js')
            || files.find(f => f.name.toLowerCase() === search)
            || files.find(f => f.name.toLowerCase().includes(search))
    }

    if (!target) return m.reply(`❌ ما لقيت ملف باسم أو رقم "${args}"\nاكتب ${usedPrefix}جلب لعرض القائمة.`)

    // ══ 3. استبدال ══
    if (isReplace) {
        // لازم ترد على رسالة فيها الكود
        const quoted = m.quoted || m.msg?.contextInfo?.quotedMessage
        let codeText = ''
        if (m.quoted?.text) codeText = m.quoted.text
        else if (m.quoted?.body) codeText = m.quoted.body
        else if (quoted?.conversation) codeText = quoted.conversation
        else if (quoted?.extendedTextMessage?.text) codeText = quoted.extendedTextMessage.text

        if (!codeText || codeText.trim().length < 5) {
            return m.reply(`❌ عشان تستبدل لازم ترد على رسالة فيها الكود الجديد.\n\nمثال:\nرد على الكود واكتب:\n${usedPrefix}استبدال ${args}`)
        }

        const newCode = cleanCode(codeText)
        try {
            // نسخة احتياطية قبل الاستبدال
            const backup = target.path + '.bak'
            fs.copyFileSync(target.path, backup)

            fs.writeFileSync(target.path, newCode, 'utf-8')
            return m.reply(`✅ تم استبدال الملف بنجاح ♻️\n\n📄 الملف: *${target.name}*\n📏 الحجم الجديد: *${newCode.length}* حرف\n💾 نسخة احتياطية: *${target.name}.bak*\n\n⚠️ أعد تشغيل البوت لتطبيق التغييرات.`)
        } catch (e) {
            return m.reply(`❌ فشل الاستبدال: ${e.message}`)
        }
    }

    // ══ 4. جلب ══
    try {
        const content = fs.readFileSync(target.path, 'utf-8')
        // إذا الملف صغير، ارسله كنص
        if (content.length < 3000) {
            return m.reply(`*📄 ${target.name}*\n*━━━━━━━━━━━━━━*\n\n\`\`\`js\n${content}\n\`\`\``)
        }
        // إذا كبير، ارسله كملف
        return await conn.sendMessage(m.chat, {
            document: Buffer.from(content, 'utf-8'),
            fileName: target.name,
            mimetype: 'text/javascript',
            caption: `📄 الملف: *${target.name}*\n📏 الحجم: *${content.length}* حرف\n\nللاستبدال رد على الكود واكتب:\n${usedPrefix}استبدال ${args}`
        }, { quoted: m })
    } catch (e) {
        return m.reply(`❌ فشل جلب الملف: ${e.message}`)
    }
}

handler.help = ['جلب', 'استبدال']
handler.tags = ['owner']
handler.command = /^(جلب|استبدال|استبدل)$/i

export default handler