// plugins/api.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - API Manager 🔑

import fs from 'fs'
import path from 'path'

const DEVELOPERS = new Set(["185899757400132", "233144431206490", "135974805860531", "116853997338673"])
const PLUGINS_DIR = path.join(process.cwd(), 'plugins')

function isDeveloper(m) {
    const number = (m.sender || '').split('@')[0].replace(/\D/g, '')
    return DEVELOPERS.has(number)
}

let handler = async (m, { conn, text }) => {

    if (!isDeveloper(m)) {
        return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔒 〕━━━╮
┃
┃ ❌ الأمر ده للمطور فقط.
┃
╰━━━━━━━━━━━━━━╯`
        )
    }

    if (!text) {
        return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔑 〕━━━╮
┃
┃ 🛠️ طريقة الاستخدام:
┃
┃ $YouTube API_الجديد
┃
┃ مثال:
┃ $YouTube https://example.com/api
┃
┃ ⚠️ يتم تعديل ملفات plugins فقط.
┃
╰━━━━━━━━━━━━━━╯`
        )
    }

    const parts = text.trim().split(/\s+/)

    if (parts.length < 2) {
        return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚠️ 〕━━━╮
┃
┃ ❌ ناقص الـ API الجديد.
┃
┃ استخدم:
┃ $YouTube API_الجديد
┃
╰━━━━━━━━━━━━━━╯`
        )
    }

    const name = parts.shift()
    const newApi = parts.join(' ').trim()

    if (!name || !newApi) {
        return m.reply('❌ اكتب اسم الخدمة والـ API الجديد.')
    }

    // حماية بسيطة
    if (
        newApi.includes('\n') ||
        newApi.includes('\r') ||
        newApi.length > 2000
    ) {
        return m.reply('❌ قيمة الـ API غير صالحة.')
    }

    if (!fs.existsSync(PLUGINS_DIR)) {
        return m.reply('❌ مجلد plugins غير موجود.')
    }

    await m.react('🔎')

    let files = []

    try {
        files = fs.readdirSync(PLUGINS_DIR)
            .filter(file => file.endsWith('.js'))
    } catch (e) {
        return m.reply('❌ لم أستطع قراءة مجلد plugins.')
    }

    let changedFiles = []
    let replacements = 0

    /*
     * أنماط شائعة:
     *
     * const YouTube_API = 'قديم'
     * const YOUTUBE_API = "قديم"
     * const YouTube_API_URL = 'قديم'
     * let YouTubeApi = 'قديم'
     * YouTube: 'قديم'
     *
     * يتم تغيير القيمة فقط.
     */

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const patterns = [
        new RegExp(
            `(const|let|var)\\s+${escapedName}(?:_API|_API_URL|API|Api)?\\s*=\\s*(['"\`])([^'"\`]*?)\\2`,
            'gi'
        ),

        new RegExp(
            `(${escapedName})(\\s*:\\s*)(['"\`])([^'"\`]*?)\\3`,
            'gi'
        ),

        new RegExp(
            `(['"\`])${escapedName}(['"\`])\\s*:\\s*(['"\`])([^'"\`]*?)\\3`,
            'gi'
        )
    ]

    for (const file of files) {

        const filePath = path.join(PLUGINS_DIR, file)

        let content

        try {
            content = fs.readFileSync(filePath, 'utf8')
        } catch {
            continue
        }

        let updated = content
        let fileChanged = false

        for (const regex of patterns) {

            updated = updated.replace(
                regex,
                (...args) => {

                    const match = args[0]

                    /*
                     * نحاول معرفة مكان القيمة القديمة
                     * بدون تغيير باقي السطر.
                     */

                    if (regex === patterns[0]) {
                        const quote = args[2]
                        return match.replace(
                            new RegExp(
                                `${quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^${quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]*${quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
                            ),
                            `${quote}${newApi}${quote}`
                        )
                    }

                    return match
                }
            )

            if (updated !== content) {
                fileChanged = true
                break
            }
        }

        /*
         * طريقة إضافية ومباشرة:
         * تبحث عن اسم الخدمة ثم قيمة API في نفس السطر.
         */

        if (!fileChanged) {

            const lines = updated.split('\n')
            let found = false

            for (let i = 0; i < lines.length; i++) {

                const line = lines[i]

                if (
                    line.toLowerCase().includes(name.toLowerCase()) &&
                    (
                        line.includes('API') ||
                        line.includes('api') ||
                        line.includes('URL') ||
                        line.includes('url')
                    )
                ) {

                    const replaced = line.replace(
                        /(['"`])([^'"`]*?)\1/g,
                        (full, quote, value) => {

                            if (
                                value.startsWith('http://') ||
                                value.startsWith('https://') ||
                                value.length > 10
                            ) {
                                found = true
                                replacements++
                                return `${quote}${newApi}${quote}`
                            }

                            return full
                        }
                    )

                    if (replaced !== line) {
                        lines[i] = replaced
                    }
                }
            }

            if (found) {
                updated = lines.join('\n')
                fileChanged = true
            }
        }

        if (fileChanged && updated !== content) {

            try {
                fs.writeFileSync(filePath, updated, 'utf8')

                changedFiles.push(file)
                replacements++

            } catch (e) {
                console.error(
                    `[ARTHUR BOT API] Failed: ${file}`,
                    e.message
                )
            }
        }
    }

    if (!changedFiles.length) {

        await m.react('❌')

        return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔎 〕━━━╮
┃
┃ ❌ لم أجد API باسم:
┃
┃ ✦ ${name}
┃
┃ 📁 تم البحث داخل:
┃ plugins/
┃
┃ 💡 تأكد أن اسم الـ API
┃ موجود داخل البلوجن.
┃
╰━━━━━━━━━━━━━━╯`
        )
    }

    await m.react('✅')

    return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔑 〕━━━╮
┃
┃ ✅ تم تغيير الـ API بنجاح!
┃
┃ 🔧 الخدمة:
┃ ${name}
┃
┃ 📁 الملفات المعدلة:
┃ ${changedFiles.length}
┃
${changedFiles.map(x => `┃ ├─ ${x}`).join('\n')}
┃
┃ 🔄 تم استبدال القيمة.
┃
╰━━━━━━━━━━━━━━╯`
    )
}

handler.command = /^\$(.+)$/i

export default handler