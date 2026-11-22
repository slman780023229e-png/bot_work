// plugins/بيكرهني.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - بيكرهني 💢

let handler = async (m, { conn }) => {
    try {
        if (!m.isGroup)
            return m.reply('❌ الأمر ده للجروبات بس 🎀')

        const group = await conn.groupMetadata(m.chat)

        let members = group.participants
            .map(p => conn.decodeJid(p.id))
            .filter(Boolean)

        const bot = conn.decodeJid(conn.user.id)

        // استبعاد البوت وصاحب الأمر
        members = members.filter(jid =>
            jid !== bot &&
            jid !== m.sender
        )

        if (!members.length)
            return m.reply('❌ مش لاقي عضو مناسب.')

        const target =
            members[Math.floor(Math.random() * members.length)]

        await conn.sendMessage(
            m.chat,
            {
                text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 💢 〕━━━╮*
*┃* 💢 @${target.split('@')[0]}
*┃*
*┃* 😾 الشخص ده بيكرهك!
*┃* 🎀 روح صالحه قبل ما الموضوع يكبر 😂
*╰━━━━━━━━━━━━━━╯*`,
                mentions: [target]
            },
            { quoted: m }
        )

        await m.react('💢')

    } catch (e) {
        console.error('[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - بيكرهني]', e)
        await m.reply('❌ حصل خطأ أثناء المنشن.')
    }
}

handler.help = ['بيكرهني']
handler.tags = ['fun']
handler.command = /^(بيكرهني)$/i
handler.group = true

export default handler