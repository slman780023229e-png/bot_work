// plugins/ق7.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - قسم الإيديت والأغاني 🎞️

import { ButtonV2 } from '../core/NIXCODE.js'

let handler = async (m, { conn }) => {

    try {

        // 🎞️ تفاعل أمر ق7
        await m.react('🎞️')

        const user = await conn.getName(m.sender)

        const imageUrl =
            'https://files.catbox.moe/ip1bc6.jpg'

        const text =
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🎞️ أهلاً: ${user}
*╰━━━━━━━━━━━━━━╯*

*╭━━━〔 𝐄𝐃𝐈𝐓 & 𝐌𝐔𝐒𝐈𝐂 〕━━━╮*
*┃* 🎵 ╎ أغنية <اسم الأغنية>
*┃* 🎬 ╎ ايديت
*┃* 🎧 ╎ ساوند <اسم الأغنية>
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
            '❌ ARTHUR BOT Q7 ERROR:',
            e
        )

        await m.reply(
            '❌ حصل خطأ أثناء فتح قسم الإيديت والأغاني.'
        )
    }
}

handler.command = /^ق7$/i

handler.help = ['ق7']

handler.tags = ['main']

export default handler