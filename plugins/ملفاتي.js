// plugins/ملفاتي.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let handler = async (m, { conn }) => {
    try {
        const pluginsPath = __dirname

        const files = fs.readdirSync(pluginsPath)
            .filter(file => file.endsWith('.js'))
            .sort()

        if (!files.length) {
            return m.reply('❌ مفيش ملفات JS موجودة في مجلد plugins.')
        }

        let text = `
╭━━━〔 📂 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮
┃
`

        files.forEach((file, i) => {
            text += `┃ ${i + 1} ⟣ ${file}\n`
        })

        text += `┃
╰━━━━━━━━━━━━━━━━━━━━╯

📁 عدد الملفات: ${files.length}
`

        await conn.sendMessage(
            m.chat,
            {
                text: text
            },
            {
                quoted: m
            }
        )

    } catch (error) {
        console.error('ملفاتي Error:', error)
        m.reply(`❌ حصل خطأ:\n${error.message}`)
    }
}

handler.help = ['ملفاتي']
handler.tags = ['tools']
handler.command = /^ملفاتي$/i

export default handler