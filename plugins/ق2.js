// plugins/ق2.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - قسم التحميل 📥 ✧

import { ButtonV2 } from '../core/NIXCODE.js'

let handler = async (m, { conn }) => {

    try {

        const user = await conn.getName(m.sender)

        const imageUrl =
            'https://files.catbox.moe/qzwau7.jpg'

        const text =
`*◇❐ ═━╾⚡ ╼━═ ❐◇*

*◇❐ ═━╾ ⚡ ╼━═ ❐◇*
  👋 أهلاً: ${user}

*◇❐ ═━╾⚡ ╼━═ ❐◇*

*◇❐ ═━╾ ⚡ ╼━═ ❐◇*
  📸 ╎ انستا
  🎵 ╎ تيك
  👍 ╎ فيس
  ▶️ ╎ يوتيوب
  📌 ╎ بنترست

*◇❐ ═━╾⚡ ╼━═ ❐◇*

*◇❐ ═━╾ ⚡ ╼━═ ❐◇*
  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`

        await new ButtonV2(conn)
            .setBody(text)
            .setFooter('© 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓')
            .setThumbnail(imageUrl)

            // القائمة
            .addButton(
                '📂 الـقـائـمـة',
                '.اوامر'
            )

            // التنصيب
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
            '❌ حصل خطأ أثناء فتح قسم التحميل.'
        )
    }
}

handler.command = /^ق2$/i

handler.help = [
    'ق2'
]

handler.tags = [
    'main'
]

export default handler