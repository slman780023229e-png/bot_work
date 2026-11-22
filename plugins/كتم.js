// plugins/كتم.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - كتم وفك كتم 🔇

const normalizeJid = jid => {
    if (!jid) return null
    return jid.includes(':')
        ? jid.replace(/:\d+@/, '@')
        : jid
}

const getTarget = m => {
    // منشن
    if (m.mentionedJid?.length)
        return normalizeJid(m.mentionedJid[0])

    // رد على رسالة
    if (m.quoted?.sender)
        return normalizeJid(m.quoted.sender)

    if (m.quoted?.participant)
        return normalizeJid(m.quoted.participant)

    return null
}

const handler = async (m, { conn, isAdmin, isBotAdmin }) => {

    try {

        if (!m.isGroup)
            return m.reply('❌ الأمر ده للجروبات فقط.')

        if (!isAdmin)
            return m.reply('❌ الأمر ده للمشرفين فقط 👑')

        if (!isBotAdmin)
            return m.reply('❌ لازم أكون مشرف عشان أقدر أحذف رسائله.')

        const target = getTarget(m)

        if (!target)
            return m.reply(
                '❌ اعمل منشن للعضو أو رد على رسالته.\n\n' +
                'مثال:\n' +
                'كتم @العضو'
            )

        const botJid = normalizeJid(conn.user?.id)

        if (target === botJid)
            return m.reply('😂 مش هكتم نفسي.')

        const metadata = await conn.groupMetadata(m.chat)

        const member = metadata.participants.find(
            p => normalizeJid(p.id) === target
        )

        if (!member)
            return m.reply('❌ العضو مش موجود في الجروب.')

        const admin =
            member.admin === 'admin' ||
            member.admin === 'superadmin'

        if (admin)
            return m.reply('❌ مينفعش تكتم مشرف 👑')

        global.db.data.mutedUsers ??= {}
        global.db.data.mutedUsers[m.chat] ??= {}

        const text = (m.text || '').trim()

        // =========================
        // فك الكتم
        // =========================

        if (/^فك[\s_]+كتم$/i.test(text)) {

            if (!global.db.data.mutedUsers[m.chat][target])
                return m.reply('❌ العضو ده مش مكتوم.')

            delete global.db.data.mutedUsers[m.chat][target]

            await conn.sendMessage(
                m.chat,
                {
                    text: `🔊 تم فك الكتم عن @${target.split('@')[0]}`,
                    mentions: [target]
                },
                { quoted: m }
            )

            return
        }

        // =========================
        // كتم
        // =========================

        if (global.db.data.mutedUsers[m.chat][target])
            return m.reply('🔇 العضو ده مكتوم بالفعل.')

        global.db.data.mutedUsers[m.chat][target] = true

        await conn.sendMessage(
            m.chat,
            {
                text:
                    `🔇 تم كتم @${target.split('@')[0]}\n\n` +
                    `🗑️ أي رسالة منه هتتمسح تلقائيًا.\n` +
                    `🚫 ومش هيقدر يستخدم أوامر البوت.`,
                mentions: [target]
            },
            { quoted: m }
        )

    } catch (e) {

        console.error('❌ ARTHUR BOT MUTE ERROR:', e)

        await m.reply('❌ حصل خطأ أثناء تنفيذ الكتم.')
    }
}

handler.command = /^(كتم|فك_كتم|فك كتم)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler