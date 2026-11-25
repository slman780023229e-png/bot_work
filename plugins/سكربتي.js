// plugins/سكربتي.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - استخراج ملفات البوت 📦

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ═════════════════════════════════════
// 👑 المطورين المسموح لهم
// ═════════════════════════════════════

const allowedNumbers = [
    '185899757400132@s.whatsapp.net',
    '35984058130514@s.whatsapp.net',
    '116853997338673@s.whatsapp.net',
    '135974805860531@s.whatsapp.net',
    '233144431206490@s.whatsapp.net'
]

const handler = async (m, { conn }) => {

    // ═════════════════════════════════════
    // 🔐 التحقق من المطور
    // ═════════════════════════════════════

    if (!allowedNumbers.includes(m.sender)) {

        await conn.sendMessage(
            m.chat,
            {
                text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔐 〕━━━╮*
*┃* ❌ هذا الأمر للمطورين فقط.
*┃*
*┃* 👑 حقوق 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓
*╰━━━━━━━━━━━━━━╯*`
            },
            { quoted: m }
        )

        return
    }

    try {

        const botFolderPath =
            path.join(__dirname, '../')

        const zipFilePath =
            path.join(__dirname, '../bot_files.zip')

        // ═════════════════════════════════════
        // 📂 قراءة الملفات
        // ═════════════════════════════════════

        const initialMessage =
            await conn.sendMessage(
                m.chat,
                {
                    text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 📂 〕━━━╮*
*┃* 📖 جاري قراءة ملفات البوت...
*╰━━━━━━━━━━━━━━╯*`
                },
                { quoted: m }
            )

        console.log(
            `𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: Reading files from ${botFolderPath}`
        )

        const files =
            fs.readdirSync(botFolderPath)

        if (files.length === 0) {

            await conn.sendMessage(
                m.chat,
                {
                    text:
                        '⚠️ لا توجد ملفات لضغطها.',
                    edit: initialMessage.key
                },
                { quoted: m }
            )

            return
        }

        // ═════════════════════════════════════
        // 📦 تجهيز الضغط
        // ═════════════════════════════════════

        const zippingMessage =
            await conn.sendMessage(
                m.chat,
                {
                    text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 📦 〕━━━╮*
*┃* 🔎 تم العثور على ${files.length} ملفات/مجلدات.
*┃*
*┃* 🔄 جاري إنشاء ملف ZIP...
*╰━━━━━━━━━━━━━━╯*`,
                    edit: initialMessage.key
                },
                { quoted: m }
            )

        const zipCommand =
            `zip -r "${zipFilePath}" . -x ".npm/*" "node_modules/*" "bot_files.zip"`

        const processingMessage =
            await conn.sendMessage(
                m.chat,
                {
                    text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⏳ 〕━━━╮*
*┃* 📦 يتم الآن ضغط ملفات البوت...
*╰━━━━━━━━━━━━━━╯*`,
                    edit: zippingMessage.key
                },
                { quoted: m }
            )

        // ═════════════════════════════════════
        // 🚀 إنشاء ZIP
        // ═════════════════════════════════════

        exec(
            zipCommand,
            {
                cwd: botFolderPath
            },
            async (error) => {

                if (error) {

                    await conn.sendMessage(
                        m.chat,
                        {
                            text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ❌ 〕━━━╮*
*┃* حدث خطأ أثناء إنشاء ملف ZIP:
*┃*
*┃* ${error.message}
*╰━━━━━━━━━━━━━━╯*`,
                            edit: processingMessage.key
                        },
                        { quoted: m }
                    )

                    return
                }

                if (!fs.existsSync(zipFilePath)) {

                    await conn.sendMessage(
                        m.chat,
                        {
                            text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ❌ 〕━━━╮*
*┃* لم يتم إنشاء ملف ZIP.
*╰━━━━━━━━━━━━━━╯*`,
                            edit: processingMessage.key
                        },
                        { quoted: m }
                    )

                    return
                }

                // ═════════════════════════════════════
                // 📤 إرسال الملف
                // ═════════════════════════════════════

                const sendingMessage =
                    await conn.sendMessage(
                        m.chat,
                        {
                            text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✅ 〕━━━╮*
*┃* تم إنشاء ملف ZIP بنجاح.
*┃*
*┃* 📤 جاري إرسال ملفات البوت...
*╰━━━━━━━━━━━━━━╯*`,
                            edit: processingMessage.key
                        },
                        { quoted: m }
                    )

                await conn.sendMessage(
                    m.chat,
                    {
                        document:
                            fs.readFileSync(zipFilePath),

                        mimetype:
                            'application/zip',

                        fileName:
                            'ARTHUR_BOT_FILES.zip'
                    },
                    { quoted: m }
                )

                // ═════════════════════════════════════
                // 🗑️ حذف الملف المؤقت
                // ═════════════════════════════════════

                fs.unlink(
                    zipFilePath,
                    async (err) => {

                        if (!err) {

                            await conn.sendMessage(
                                m.chat,
                                {
                                    text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🗑️ 〕━━━╮*
*┃* تم إرسال ملفات البوت بنجاح.
*┃*
*┃* 🗑️ تم حذف ملف ZIP المؤقت.
*╰━━━━━━━━━━━━━━╯*`,
                                    edit: sendingMessage.key
                                },
                                { quoted: m }
                            )
                        }
                    }
                )
            }
        )

    } catch (err) {

        console.error(
            '❌ ARTHUR BOT SCRIPT ERROR:',
            err
        )

        await conn.sendMessage(
            m.chat,
            {
                text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ❌ 〕━━━╮*
*┃* فشل في معالجة ملفات البوت.
*┃*
*┃* ${err.message}
*╰━━━━━━━━━━━━━━╯*`
            },
            { quoted: m }
        )
    }
}

handler.help = ['سكربتي']
handler.tags = ['owner']
handler.command = /^(سكربتي)$/i

export default handler