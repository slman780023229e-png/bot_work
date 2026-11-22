// plugins/منع_الروابط.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - مانع روابط الجروبات 🎀

const warnings = global.groupWarnings || (global.groupWarnings = {})
const enabled = global.linkBlocker || (global.linkBlocker = {})

const handler = async (m, { conn, isAdmin }) => {
    try {

        if (!m.isGroup) return

        // =========================
        // 🔘 تشغيل / إيقاف
        // =========================

        if (m.text?.trim() === '.منع-روابط') {

            if (!isAdmin) {
                return m.reply('❌ الأمر ده للمشرفين فقط 🎀')
            }

            if (enabled[m.chat]) {
                delete enabled[m.chat]

                return m.reply(
                    `❌ تم إيقاف مانع الروابط\n\n` +
                    `╰━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╯`
                )
            }

            enabled[m.chat] = true

            return m.reply(
                `✅ تم تشغيل مانع الروابط\n\n` +
                `🔗 أي رابط جروب واتساب سيتم حذفه.\n` +
                `⚠️ 3 إنذارات = طرد.\n` +
                `👮 المشرفين مستثنين.\n\n` +
                `╰━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╯`
            )
        }

        // =========================
        // 🔒 لو المانع مقفول
        // =========================

        if (!enabled[m.chat]) return

        // =========================
        // 👮 معرفة المشرف
        // =========================

        const metadata = await conn.groupMetadata(m.chat)

        const user = metadata.participants.find(
            p => p.id === m.sender
        )

        if (
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'
        ) {
            return
        }

        // =========================
        // 📝 الحصول على النص
        // =========================

        let text = ''

        if (typeof m.text === 'string') {
            text = m.text
        }

        if (
            m.message?.conversation
        ) {
            text += ' ' + m.message.conversation
        }

        if (
            m.message?.extendedTextMessage?.text
        ) {
            text += ' ' + m.message.extendedTextMessage.text
        }

        // =========================
        // 🔗 فحص روابط الجروبات
        // =========================

        const linkRegex =
            /(?:https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]+(?:\?[^\s]*)?/i

        if (!linkRegex.test(text)) return

        // =========================
        // 🗑️ حذف الرسالة
        // =========================

        try {
            await conn.sendMessage(
                m.chat,
                {
                    delete: m.key
                }
            )
        } catch (e) {
            console.log(
                '❌ فشل حذف الرابط:',
                e.message
            )
        }

        // =========================
        // ⚠️ الإنذار
        // =========================

        if (!warnings[m.chat]) {
            warnings[m.chat] = {}
        }

        if (!warnings[m.chat][m.sender]) {
            warnings[m.chat][m.sender] = 0
        }

        warnings[m.chat][m.sender]++

        const count =
            warnings[m.chat][m.sender]

        // =========================
        // 🚫 الإنذار الثالث
        // =========================

        if (count >= 3) {

            try {

                await conn.groupParticipantsUpdate(
                    m.chat,
                    [m.sender],
                    'remove'
                )

                delete warnings[m.chat][m.sender]

                return await conn.sendMessage(
                    m.chat,
                    {
                        text:
                            `🚫 تم طرد @${m.sender.split('@')[0]}\n\n` +
                            `📛 السبب: إرسال رابط جروب واتساب.\n` +
                            `🔔 الإنذارات: 3/3\n\n` +
                            `╰━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╯`,
                        mentions: [m.sender]
                    }
                )

            } catch (e) {

                console.log(
                    '❌ فشل الطرد:',
                    e.message
                )

                return await conn.sendMessage(
                    m.chat,
                    {
                        text:
                            `⚠️ @${m.sender.split('@')[0]}\n\n` +
                            `وصلت إلى الإنذار 3/3.\n` +
                            `❌ لم أستطع طردك.\n` +
                            `تأكد أن البوت مشرف في الجروب.\n\n` +
                            `╰━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╯`,
                        mentions: [m.sender]
                    }
                )
            }
        }

        // =========================
        // ⚠️ إرسال التحذير
        // =========================

        await conn.sendMessage(
            m.chat,
            {
                text:
                    `⚠️ @${m.sender.split('@')[0]}\n\n` +
                    `🚫 ممنوع إرسال روابط الجروبات هنا.\n\n` +
                    `🔔 الإنذار: ${count}/3\n` +
                    `⚠️ الإنذار الثالث = طرد.\n\n` +
                    `╰━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╯`,
                mentions: [m.sender]
            }
        )

    } catch (error) {

        console.error(
            '❌ خطأ في مانع الروابط:',
            error
        )
    }
}

// =========================
// 🔥 مهم جدًا
// =========================

handler.command = ['منع-روابط']

// فحص كل الرسائل
handler.all = async function (m, { conn, isAdmin }) {

    // تجاهل الأمر نفسه
    if (m.text?.trim() === '.منع-روابط') return

    // تشغيل نفس المنطق للفحص
    if (!m.isGroup) return

    const groupEnabled =
        global.linkBlocker?.[m.chat]

    if (!groupEnabled) return

    try {

        const metadata =
            await conn.groupMetadata(m.chat)

        const user =
            metadata.participants.find(
                p => p.id === m.sender
            )

        // المشرفين مستثنين
        if (
            user?.admin === 'admin' ||
            user?.admin === 'superadmin'
        ) return

        const text =
            typeof m.text === 'string'
                ? m.text
                : ''

        const linkRegex =
            /(?:https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]+(?:\?[^\s]*)?/i

        if (!linkRegex.test(text)) return

        // حذف الرسالة
        try {
            await conn.sendMessage(
                m.chat,
                {
                    delete: m.key
                }
            )
        } catch {}

        // الإنذارات
        if (!global.groupWarnings[m.chat]) {
            global.groupWarnings[m.chat] = {}
        }

        const sender = m.sender

        global.groupWarnings[m.chat][sender] =
            (global.groupWarnings[m.chat][sender] || 0) + 1

        const count =
            global.groupWarnings[m.chat][sender]

        // الطرد
        if (count >= 3) {

            try {

                await conn.groupParticipantsUpdate(
                    m.chat,
                    [sender],
                    'remove'
                )

                delete global.groupWarnings[m.chat][sender]

                await conn.sendMessage(
                    m.chat,
                    {
                        text:
                            `🚫 تم طرد @${sender.split('@')[0]}\n\n` +
                            `🔔 وصلت إلى 3/3 إنذارات.\n` +
                            `📛 السبب: إرسال رابط جروب واتساب.\n\n` +
                            `╰━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╯`,
                        mentions: [sender]
                    }
                )

            } catch (e) {
                console.log(
                    '❌ فشل الطرد:',
                    e.message
                )
            }

            return
        }

        await conn.sendMessage(
            m.chat,
            {
                text:
                    `⚠️ @${sender.split('@')[0]}\n\n` +
                    `🚫 ممنوع إرسال روابط الجروبات.\n` +
                    `🔔 الإنذار: ${count}/3\n\n` +
                    `╰━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╯`,
                mentions: [sender]
            }
        )

    } catch (e) {
        console.log(
            '❌ Link Block Error:',
            e.message
        )
    }
}

export default handler