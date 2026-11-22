// plugins/admin.js
// ✧ 𝐄𝐕𝐄𝐑𝐍𝐈𝐆𝐇𝐓 𝐁𝐎𝐓 - ترقية أو إعفاء عضو 👑

const handler = async (m, { conn, command, isAdmin, isOwner }) => {

    if (!m.isGroup) {
        return m.reply('❌ الأمر ده للجروبات فقط.')
    }

    if (!isAdmin && !isOwner) {
        return m.reply(
`*╭━━𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 𝐄𝐕𝐄𝐑𝐍𝐈𝐆𝐇𝐓━━°⃟✨*
> ❌ الأمر ده للمشرفين فقط.
⁩  ╰━━━━━━━━━━°⃟🌺
*╭━━━━━━━━━━°⃟😽🪭*`
        )
    }

    let user = null

    // =====================================
    // دالة لاستخراج الـ JID
    // =====================================

    const getJid = (x) => {

        if (!x) return null

        if (typeof x === 'string') {
            if (x.includes('@')) return x
            if (/^\d{8,20}$/.test(x)) {
                return x + '@s.whatsapp.net'
            }
        }

        return (
            x.id ||
            x.jid ||
            x.sender ||
            x.participant ||
            x.key?.participant ||
            null
        )
    }

    // =====================================
    // 1 - المنشن
    // =====================================

    const contexts = [
        m.msg?.contextInfo,
        m.message?.extendedTextMessage?.contextInfo,
        m.message?.imageMessage?.contextInfo,
        m.message?.videoMessage?.contextInfo,
        m.message?.conversation?.contextInfo,
        m.contextInfo
    ].filter(Boolean)

    for (const ctx of contexts) {

        const list =
            ctx.mentionedJid ||
            ctx.mentionedJids ||
            ctx.mentions ||
            []

        if (Array.isArray(list) && list.length) {

            user = getJid(list[0])

            if (user) break
        }
    }

    // =====================================
    // 2 - الطريقة المباشرة
    // من m.mentionedJid
    // =====================================

    if (!user && Array.isArray(m.mentionedJid)) {

        if (m.mentionedJid.length) {
            user = getJid(m.mentionedJid[0])
        }
    }

    // =====================================
    // 3 - الرد على رسالة
    // =====================================

    if (!user && m.quoted) {

        user =
            getJid(m.quoted.sender) ||
            getJid(m.quoted.participant) ||
            getJid(m.quoted.key?.participant) ||
            getJid(
                m.quoted.msg?.contextInfo?.participant
            ) ||
            getJid(
                m.quoted.message
                    ?.extendedTextMessage
                    ?.contextInfo
                    ?.participant
            )
    }

    // =====================================
    // 4 - البحث داخل نص الرسالة
    // =====================================

    if (!user) {

        const text =
            String(
                m.text ||
                m.body ||
                m.message?.conversation ||
                ''
            )

        const match =
            text.match(/@(\d{8,20})/)

        if (match) {
            user =
                match[1] +
                '@s.whatsapp.net'
        }
    }

    // =====================================
    // تنظيف JID
    // =====================================

    if (user) {

        try {

            if (conn.convertLidToRealJid) {

                user =
                    await conn.convertLidToRealJid(
                        user,
                        m.chat
                    )
            }

        } catch {}

        user =
            String(user)
    }

    // =====================================
    // مفيش عضو
    // =====================================

    if (!user || !user.includes('@')) {

        return m.reply(
`*╭━━𝐄𝐕𝐄𝐑𝐍𝐈𝐆𝐇𝐓🎀𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓━━°⃟✨*
> ⚠️ منشن العضو أو اعمل رد على رسالته.

⁩  ╰━━━━━━━━━━°⃟🌺
*╭━━━━━━━━━━°⃟😽🪭*`
        )
    }

    try {

        // =====================================
        // ترقية
        // =====================================

        if (
            /^(ترقيه|رفع|ارفع|promote)$/i
                .test(command)
        ) {

            await conn.groupParticipantsUpdate(
                m.chat,
                [user],
                'promote'
            )

            await conn.sendMessage(
                m.chat,
                {
                    text:
`*╭━━𝐄𝐕𝐄𝐑𝐍𝐈𝐆𝐇𝐓🎀𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓━━°⃟✨*
> تمت ترقية العضو @${user.split('@')[0]}

⁩  ╰━━━━━━━━━━°⃟🌺
> من قبل @${m.sender.split('@')[0]}
*╭━━━━━━━━━━°⃟😽🪭*`,
                    mentions: [
                        user,
                        m.sender
                    ]
                },
                {
                    quoted: m
                }
            )

            return
        }

        // =====================================
        // إعفاء
        // =====================================

        if (
            /^(اعفاء|تنزيل|demote)$/i
                .test(command)
        ) {

            await conn.groupParticipantsUpdate(
                m.chat,
                [user],
                'demote'
            )

            await conn.sendMessage(
                m.chat,
                {
                    text:
`*╭━━𝐄𝐕𝐄𝐑𝐍𝐈𝐆𝐇𝐓🎀𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓━━°⃟✨*
> تم إعفاء العضو @${user.split('@')[0]}

⁩  ╰━━━━━━━━━━°⃟🌺
> من قبل @${m.sender.split('@')[0]}
*╭━━━━━━━━━━°⃟😽🪭*`,
                    mentions: [
                        user,
                        m.sender
                    ]
                },
                {
                    quoted: m
                }
            )

            return
        }

    } catch (e) {

        console.error(
            'SPARKIL ADMIN ERROR:',
            e
        )

        return m.reply(
`*╭━━𝐄𝐕𝐄𝐑𝐍𝐈𝐆𝐇𝐓🎀𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓━━°⃟✨*
> ❌ فشلت العملية.
> تأكد أن البوت مشرف وأن العضو موجود بالجروب.

⁩  ╰━━━━━━━━━━°⃟🌺
*╭━━━━━━━━━━°⃟😽🪭*`
        )
    }
}

handler.help = [
    'ترقيه',
    'اعفاء'
]

handler.tags = [
    'group'
]

handler.command =
    /^(ترقيه|رفع|ارفع|promote|اعفاء|تنزيل|demote)$/i

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler