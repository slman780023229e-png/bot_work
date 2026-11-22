// plugins/القاب.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - حجز الألقاب 👑

const handler = async function (m, { conn, text, usedPrefix, command }) {

    if (!m.isGroup) {
        return m.reply('❌ الأمر يعمل داخل المجموعات فقط.')
    }

    const groupId = m.chat

    if (!global.db?.data?.users) {
        global.db.data.users = {}
    }

    const users = global.db.data.users

    // ═══════════════════════════════
    // 👑 حجز لقب
    // ═══════════════════════════════

    if (command === 'حجز_لقب') {

        if (!text?.trim()) {
            return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 👑 〕━━━╮
┃
┃ ✦ اكتب اللقب الذي تريد حجزه.
┃
┃ مثال:
┃ ${usedPrefix}${command} ميكو
┃
╰━━━━━━━━━━━━━━╯`
            )
        }

        const nickname = text.trim()

        if (nickname.length > 30) {
            return m.reply('❌ اللقب طويل جدًا، الحد الأقصى 30 حرف.')
        }

        let user = users[m.sender] || {}

        if (!user.groups) {
            user.groups = {}
        }

        // هل لديه لقب بالفعل؟
        if (user.groups[groupId]?.name) {

            return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚠️ 〕━━━╮
┃
┃ لديك لقب محجوز بالفعل:
┃
┃ 👑 *${user.groups[groupId].name}*
┃
┃ لإلغائه استخدم:
┃ ${usedPrefix}الغاء_حجز
┃
╰━━━━━━━━━━━━━━╯`
            )
        }

        // هل اللقب محجوز من شخص آخر؟
        for (const key in users) {

            const reserved =
                users[key]?.groups?.[groupId]?.name

            if (
                reserved &&
                reserved.trim().toLowerCase() ===
                nickname.toLowerCase()
            ) {

                return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ❌ 〕━━━╮
┃
┃ هذا اللقب محجوز بالفعل.
┃
┃ 👑 *${reserved}*
┃
╰━━━━━━━━━━━━━━╯`
                )
            }
        }

        // حفظ اللقب
        user.groups[groupId] = {
            name: nickname,
            regTime: Date.now(),
            registered: true
        }

        users[m.sender] = user

        return conn.reply(
            m.chat,
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 👑 〕━━━╮
┃
┃ ✅ تم حجز اللقب بنجاح.
┃
┃ 👑 *اللقب:* ${nickname}
┃ 👤 *العضو:* @${m.sender.split('@')[0]}
┃
╰━━━━━━━━━━━━━━╯`,
            m,
            {
                mentions: [m.sender]
            }
        )
    }


    // ═══════════════════════════════
    // 📋 عرض الألقاب
    // ═══════════════════════════════

    if (command === 'الالقاب_المحجوزه') {

        const reservedNames = []

        for (const key in users) {

            const data =
                users[key]?.groups?.[groupId]

            if (data?.name) {

                reservedNames.push(
`┃ 👑 *${data.name}*
┃ 👤 @${key.split('@')[0]}
┃ 🕒 ${formatDate(data.regTime)}`
                )
            }
        }

        if (!reservedNames.length) {

            return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 📋 〕━━━╮
┃
┃ لا توجد ألقاب محجوزة حاليًا.
┃
╰━━━━━━━━━━━━━━╯`
            )
        }

        const mentions = []

        for (const key in users) {
            if (users[key]?.groups?.[groupId]?.name) {
                mentions.push(key)
            }
        }

        return conn.sendMessage(
            m.chat,
            {
                text:
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 👑 〕━━━╮
┃
┃ 📋 *الألقاب المحجوزة*
┃
${reservedNames.join('\n')}
┃
╰━━━━━━━━━━━━━━╯`,
                mentions
            },
            {
                quoted: m
            }
        )
    }


    // ═══════════════════════════════
    // 🗑️ إلغاء الحجز
    // ═══════════════════════════════

    if (command === 'الغاء_حجز') {

        const user = users[m.sender] || {}

        if (!user.groups?.[groupId]?.name) {

            return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚠️ 〕━━━╮
┃
┃ ليس لديك لقب محجوز.
┃
╰━━━━━━━━━━━━━━╯`
            )
        }

        const oldName =
            user.groups[groupId].name

        delete user.groups[groupId]

        users[m.sender] = user

        return conn.reply(
            m.chat,
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🗑️ 〕━━━╮
┃
┃ ✅ تم إلغاء حجز اللقب.
┃
┃ 👑 *اللقب:* ${oldName}
┃
╰━━━━━━━━━━━━━━╯`,
            m
        )
    }
}


// ═══════════════════════════════
// ⚙️ إعدادات البلوجن
// ═══════════════════════════════

handler.group = true

handler.command =
    /^(حجز_لقب|الالقاب_المحجوزه|الغاء_حجز)$/i

export default handler


// ═══════════════════════════════
// 🕒 تنسيق التاريخ
// ═══════════════════════════════

function formatDate(timestamp) {

    if (!timestamp) return 'غير معروف'

    const date = new Date(timestamp)

    return (
        date.toLocaleDateString('ar-EG') +
        ' - ' +
        date.toLocaleTimeString('ar-EG')
    )
}