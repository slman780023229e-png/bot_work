// plugins/ق6.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - قسم الأدوات 🪖

import { ButtonV2 } from '../core/NIXCODE.js'

let handler = async (m, { conn }) => {

    try {

        // 🪖 تفاعل أمر ق6
        await m.react('🪖')

        const user = await conn.getName(m.sender)

        const imageUrl =
            'https://files.catbox.moe/fnge8r.jpg'

        const text =
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🪖 أهلاً: ${user}
*╰━━━━━━━━━━━━━━╯*

*╭━━━〔 𝐓𝐎𝐎𝐋𝐒 〕━━━╮*
*┃* 🏷️ ╎ ملصق
*┃* 🔗 ╎ لرابط
*┃* 🎨 ╎ تصميم
*┃* 🎤 ╎ لصوت
*┃* 🖼️ ╎ لصوره
*┃* 🌐 ╎ لينك
*┃* 💬 ╎ دعم
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
            '❌ ARTHUR BOT Q6 ERROR:',
            e
        )

        await m.reply(
            '❌ حصل خطأ أثناء فتح قسم الأدوات.'
        )
    }
}

handler.command = /^ق6$/i

handler.help = ['ق6']

handler.tags = ['main']

export default handler