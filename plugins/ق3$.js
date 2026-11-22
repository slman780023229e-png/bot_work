// plugins/ق4.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - قسم الترفيه 🎮

import { ButtonV2 } from '../core/NIXCODE.js'

let handler = async (m, { conn }) => {

    try {

        const user = await conn.getName(m.sender)

        const imageUrl = 'https://files.catbox.moe/fnge8r.jpg'

        const text =
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🎮 أهلاً: ${user}
*╰━━━━━━━━━━━━━━╯*

*╭━━━〔 𝐄𝐍𝐓𝐄𝐑𝐓𝐀𝐈𝐍𝐌𝐄𝐍𝐓 〕━━━╮*
*┃* 💗 ╎ بيحبني
*┃* 💔 ╎ بيكرهني
*┃* 🎭 ╎ مين؟
*┃* 💍 ╎ زواجني
*┃* 💒 ╎ زواج
*┃* 💔 ╎ طلاق
*┃* 🌈 ╎ شاذ
*╰━━━━━━━━━━━━━━━━━━━━╯*

*╰─ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ─╯*`

        await new ButtonV2(conn)
            .setBody(text)
            .setFooter('© 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓')
            .setThumbnail(imageUrl)

            .addButton(
                '📂 الـقـائـمـة',
                '.اوامر'
            )

            .addButton(
                '👑 تـنـصـيـب',
                '.تنصيب'
            )

            .send(m.chat)

    } catch (e) {

        console.error(
            '❌ ARTHUR BOT Q4 ERROR:',
            e
        )

        await m.reply(
            '❌ حصل خطأ أثناء فتح قسم الترفيه.'
        )
    }
}


// الأمر
handler.command = /^ق3$/i

handler.help = [
    'ق3'
]

handler.tags = [
    'main'
]

export default handler
