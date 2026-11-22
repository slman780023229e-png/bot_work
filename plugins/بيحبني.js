// plugins/بيحبني.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - بيحبني 💗

let handler = async (m, { conn }) => {
    try {
        // التأكد إن الأمر داخل جروب
        if (!m.isGroup) {
            return m.reply('❌ الأمر ده للجروبات بس 🎀')
        }

        // جلب بيانات الجروب
        const group = await conn.groupMetadata(m.chat)

        if (!group?.participants?.length) {
            return m.reply('❌ مش قادر أجيب أعضاء الجروب حالياً.')
        }

        // رقم البوت
        const botJid = conn.user?.id
            ? conn.decodeJid(conn.user.id)
            : ''

        // تجهيز الأعضاء
        let members = group.participants
            .map(p => conn.decodeJid(p.id))
            .filter(Boolean)

        // استبعاد البوت
        members = members.filter(jid => jid !== botJid)

        // استبعاد الشخص اللي كتب الأمر
        members = members.filter(jid => jid !== m.sender)

        if (!members.length) {
            return m.reply('❌ مفيش عضو مناسب أعمله منشن.')
        }

        // اختيار عضو عشوائي
        const target =
            members[Math.floor(Math.random() * members.length)]

        const number = target.split('@')[0]

        await conn.sendMessage(
            m.chat,
            {
                text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 💗 〕━━━╮*
*┃* 💗 @${number}
*┃*
*┃*  روحله/ا ده بيحبك!
*┃* 🌺 روحله ومتتأخرش عليه 😂
*┃*
*┃* ✨ أنت المختار اليوم
*╰━━━━━━━━━━━━━━╯*`,
                mentions: [target]
            },
            { quoted: m }
        )

        await m.react('💗')

    } catch (e) {

        console.error('❌ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 بيحبني:', e)

        await m.reply(
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* ❌ حصل خطأ أثناء اختيار الشخص.
*┃*
*┃* ✦ حاول مرة ثانية.
*╰━━━━━━━━━━━━━━╯*`
        )
    }
}

handler.help = ['بيحبني']
handler.tags = ['fun']
handler.command = /^(بيحبني)$/i
handler.group = true

export default handler