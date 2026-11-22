// plugins/Changes.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Group Changes

const changes = global.changes || (global.changes = {})

const handler = async (m, { isAdmin }) => {

    if (!m.isGroup) return

    if (!isAdmin) {
        return m.reply('❌ الأمر ده للمشرفين فقط 🎀')
    }

    if (changes[m.chat]) {

        delete changes[m.chat]

        return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮
┃ ❌ تم إيقاف كشف التغيورات
╰━━━━━━━━━━━━━━╯`
        )
    }

    changes[m.chat] = true

    return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮
┃ ✅ تم تشغيل كشف التغيورات
┃
┃ 🔒 قفل الشات
┃ 🔓 فتح الشات
┃ 👑 ترقية مشرف
┃ 👤 إزالة الإشراف
┃ 🚫 طرد عضو
┃
┃ 🚫 دخول وخروج الأعضاء غير مراقب
╰━━━━━━━━━━━━━━╯`
    )
}

handler.help = ['Changes']

handler.tags = ['group']

handler.command = /^Changes$/i

handler.group = true
handler.admin = true

export default handler