// plugins/bot.js
// ♡ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Plane of Euthymia - Bot Info 🔘

import { ButtonV2 } from '../core/NIXCODE.js'

let handler = async (m, { conn }) => {

    const imageUrl = 'https://files.catbox.moe/bdusr8.jpg'

    await new ButtonV2(conn)
        .setBody(global.botName)
        .setFooter(global.watermark)
        .setThumbnail(imageUrl)
        .addButton('📂 الـقـائـمـة', '.اوامر')
        .addButton('👑 الـمـطـور', '.المطور')
        .send(m.chat)

}

handler.customPrefix = /^(\.)?(بوت|bot)$/i
handler.command = new RegExp()

export default handler