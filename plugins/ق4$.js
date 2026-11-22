// plugins/ق4.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - قسم الألعاب والترفيه 🎮

import { ButtonV2 } from '../core/NIXCODE.js'

let handler = async (m, { conn }) => {

    try {

        const user = await conn.getName(m.sender)

        const imageUrl =
            'https://files.catbox.moe/fnge8r.jpg'

        const text =
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🎮 أهلاً: ${user}
*╰━━━━━━━━━━━━━━╯*

*╭━━━〔 𝐆𝐀𝐌𝐄𝐒 〕━━━╮*
*┃* 🧩 ╎ احزر
*┃* 🧠 ╎ فكك
*┃* 👁️ ╎ عين
*┃* 🎮 ╎ لعبه
*┃* 🌍 ╎ علم
*┃* 🎲 ╎ لعبة
*╰━━━━━━━━━━━━━━╯*

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
            '❌ حصل خطأ أثناء فتح قسم الألعاب.'
        )
    }
}

handler.command = /^ق4$/i

handler.help = [
    'ق4'
]

handler.tags = [
    'main'
]

export default handler