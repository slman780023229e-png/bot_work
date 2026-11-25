// plugins/جلب.js
// ✧ ARTHUR BOT - جلب واستبدال الملفات الرئيسية ✧

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.join(__dirname, '..')

// حط هنا كل أرقام المطورين
const ownerNumbers = ['967780023229', '780023229']

const BLOCKED = [
    '.env', 'creds.json', '.git', 'node_modules',
    'ArthurSession', 'ArthurSubBot', 'BackupSession',
    'session', 'sessions', 'auth_info_baileys', 'database'
]

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
        const pluginFiles = fs.readdirSync(__dirname, { withFileTypes: true })
        for (const f of pluginFiles) {
            if (f.isFile() && f.name.endsWith('.js')) {
                files.push({ name: f.name, path: path.join(__dirname, f.name), folder: '📂 plugins' })
            }
        }
    } catch {}
    return files
}

const cleanCode = (text = '') => {
    let t = String(text).trim()
    const match = t.match(/```(?:js|javascript|json|txt)?\s*([\s\S]*?)```/i)
    if (match) t = match[1]
    return t.trim()
}

// ✧ فحص المطور الجديد - يشتغل حتى مع LID ✧
const isDeveloper = (m, isOwner) => {
    // 1- إذا البوت نفسه قال هذا مالك، خلاص هو مطور
    if (isOwner === true) return true

    // 2- فحص الرقم من كل الأماكن الممكنة
    const ids = [
        m.sender,
        m.key?.participant,
        m.key?.remoteJid,
        m.from,
        m.author
    ].filter(Boolean).map(v => String(v))

    for (const id of ids) {
        const digits = id.replace(/[^0-9]/g, '')
        for (const owner of ownerNumbers) {
            // يقبل 967780023229 أو 780023229 أو نهايته نفس الرقم
            if (digits.endsWith(owner) || digits === owner || id.includes(owner)) return true
        }
    }

    // 3- فحص global owner لو موجود في ملف config
    try {
        const owners = global.owner || global.config?.owner || []
        const list = Array.isArray(owners) ? owners : [owners]
        for (const o of list) {
            const num = String(Array.isArray(o) ? o[0] : o).replace(/[^0-9]/g, '')
            if (ids.some(id => id.replace(/[^0-9]/g, '').endsWith(num))) return true
        }
    } catch {}

    return false
}

const handler = async (m, { conn, text, usedPrefix, isOwner }) => {
    // ✧ هنا التثبيتة
    if (!isDeveloper(m, isOwner)) {
        return m.reply(`❌ هذا الأمر للمطور فقط 👑\n\nمعرفك: ${m.sender}\nإذا هذا رقمك ارسل لي هذا المعرف وأنا أضيفه.`)
    }

    const args = String(text || '').trim()
    const cmd = String(m.text || '').trim().split(/\s+/)[0].replace(/^[.!/#]/, '')
    const isReplace = /^(استبدال|استبدل)$/i.test(cmd)

    const files = getMainFiles()
    if (!files.length) return m.reply('❌ ما لقيت ملفات.')

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

    let target = null
    if (/^\d+$/.test(args)) {
        const num = parseInt(args)
        target = files[num - 1]
    } else {
        const search = args.replace(/\.js$/i, '').toLowerCase()
        target = files.find(f => f.name.toLowerCase() === search + '.js')
            || files.find(f => f.name.toLowerCase() === search)
            || files.find(f => f.name.toLowerCase().includes(search))
    }

    if (!target) return m.reply(`❌ ما لقيت ملف باسم أو رقم "${args}"\nاكتب ${usedPrefix}جلب لعرض القائمة.`)

    if (isReplace) {
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
            const backup = target.path + '.bak'
            fs.copyFileSync(target.path, backup)
            fs.writeFileSync(target.path, newCode, 'utf-8')
            return m.reply(`✅ تم استبدال الملف بنجاح ♻️\n\n📄 الملف: *${target.name}*\n📏 الحجم الجديد: *${newCode.length}* حرف\n💾 نسخة احتياطية: *${target.name}.bak*\n\n⚠️ أعد تشغيل البوت لتطبيق التغييرات.`)
        } catch (e) {
            return m.reply(`❌ فشل الاستبدال: ${e.message}`)
        }
    }

    try {
        const content = fs.readFileSync(target.path, 'utf-8')
        if (content.length < 3000) {
            return m.reply(`*📄 ${target.name}*\n*━━━━━━━━━━━━━━*\n\n\`\`\`js\n${content}\n\`\`\``)
        }
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