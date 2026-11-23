// plugins/طرد.js

const handler = async (m, { conn, isAdmin }) => {

    if (!m.isGroup)
        return m.reply('❌ الأمر ده للجروبات فقط.')

    if (!isAdmin)
        return m.reply('❌ الأمر ده للأدمن فقط.')

    let target = null

    // لو رد على رسالة الشخص
    if (m.quoted?.sender) {
        target = m.quoted.sender
    }

    // لو منشن
    if (!target && m.mentionedJid?.length) {
        target = m.mentionedJid[0]
    }

    if (!target) {
        return m.reply(
            '❌ اعمل منشن للشخص أو رد على رسالته.\n\n' +
            'مثال:\n' +
            '.طرد @الشخص'
        )
    }

    // منع طرد البوت
    if (target === conn.user?.id) {
        return m.reply('❌ مش هقدر أطرد نفسي 😂')
    }

    try {

        // تنفيذ الطرد
        await conn.groupParticipantsUpdate(
            m.chat,
            [target],
            'remove'
        )

        const executor = m.sender

        const text =
`*╭━━『★ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ★』━━°⃟🚬*
*تم طرد العضو من قبل @${executor.split('@')[0]}*
⁩  ╰━━━━━━━━━━°⃟🚬
المطرود @${target.split('@')[0]}
*╭━━━━━━━━━━°⃟🚬*`

        await conn.sendMessage(m.chat, {
            text,
            mentions: [executor, target]
        })

    } catch (error) {

        console.error('❌ خطأ الطرد:', error)

        await m.reply(
            '❌ فشل طرد العضو.\n\n' +
            'تأكد إن البوت مشرف، وإن الشخص مش مشرف أعلى من البوت.'
        )
    }
}

handler.help = ['طرد']
handler.tags = ['group']
handler.command = /^طرد$/i
handler.group = true
handler.botAdmin = true

export default handler