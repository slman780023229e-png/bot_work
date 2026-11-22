
// plugins/ق1.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - قسم الأدمن 👑

import { ButtonV2 } from '../core/NIXCODE.js'

let handler = async (m, { conn }) => {

    try {

        const user = await conn.getName(m.sender)

        const imageUrl =
            'https://files.catbox.moe/fnge8r.jpg'

        const text =
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 👑 أهلاً: ${user}
*╰━━━━━━━━━━━━━━╯*

*╭━━━〔 𝐀𝐃𝐌𝐈𝐍 〕━━━╮*
*┃* 🎀 ╎ منشن
*┃* 🪄 ╎ بوست
*┃* 🔗 ╎ لينك
*┃* 🚫 ╎ طرد
*┃* 👤 ╎ اعفاء
*┃* 👑 ╎ ترقيه
*┃* 🔓 ╎ شات فتح
*┃* 🔒 ╎ شات قفل
*┃* 📵 ╎ مانع-جهات
*┃* 🔗 ╎ منع_روابط
*┃* 👻 ╎ مخفي
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
            '❌ ARTHUR BOT Q1 ERROR:',
            e
        )

        await m.reply(
            '❌ حصل خطأ أثناء فتح قسم الأدمن.'
        )
    }
}


// الأمر
handler.command = /^ق1$/i

handler.help = [
    'ق1'
]

handler.tags = [
    'main'
]

export default handler