// plugins/ق5.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - قسم النقابات 👑

import { ButtonV2 } from '../core/NIXCODE.js'

let handler = async (m, { conn }) => {

    try {

        // 🪝 تفاعل أمر ق5
        await m.react('🪝')

        const user = await conn.getName(m.sender)

        const imageUrl =
            'https://files.catbox.moe/w2w2ur.jpg'

        const text =
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 👑 أهلاً: ${user}
*╰━━━━━━━━━━━━━━╯*

*╭━━━〔 𝐆𝐈𝐋𝐃𝐒 〕━━━╮*
*┃* 🏷️ ╎ تلقيب
*┃* 🎟️ ╎ حجز_لقب
*┃* 👤 ╎ لقبي
*┃* 🔎 ╎ لقبه
*┃* 📝 ╎ تسجيل
*┃* 🗑️ ╎ حذف_تسجيل
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
            '❌ ARTHUR BOT Q5 ERROR:',
            e
        )

        await m.reply(
            '❌ حصل خطأ أثناء فتح قسم النقابات.'
        )
    }
}

handler.command = /^ق5$/i

handler.help = ['ق5']
handler.tags = ['main']

export default handler