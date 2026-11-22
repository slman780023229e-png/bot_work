// plugins/اسمر.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - اسمر 🎀

let handler = async (m, { conn }) => {
    try {
        if (!m.isGroup)
            return m.reply('❌ الأمر ده للجروبات بس 🎀')

        const group = await conn.groupMetadata(m.chat)

        let members = group.participants
            .map(p => conn.decodeJid(p.id))
            .filter(jid => jid && jid !== conn.decodeJid(conn.user.id))

        if (!members.length)
            return m.reply('❌ مش لاقي أعضاء للمنشن.')

        const target =
            members[Math.floor(Math.random() * members.length)]

        await conn.sendMessage(
            m.chat,
            {
                text: `*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🎀 〕━━━╮*
*┃* 🎀 @${target.split('@')[0]}
*┃*
*┃* ✨ ده اكبر زنجي 😂
*╰━━━━━━━━━━━━━━╯*`,
                mentions: [target]
            },
            { quoted: m }
        )

        await m.react('🎀')

    } catch (e) {
        console.error('[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - زنجي]', e)
        await m.reply('❌ حصل خطأ أثناء المنشن.')
    }
}

handler.help = ['زنجي']
handler.tags = ['fun']
handler.command = /^(زنجي)$/i
handler.group = true

export default handler