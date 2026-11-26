// plugins/مياو.js

const cursedUsers = new Map()

// 👑 النخبة + المالك - هذول بس اللي ما يتلعنون
const ELITE = [
  '967700000000', // رقمك انت - المالك
  // ضيف هنا أي رقم تبيه يكون محمي زي المالك
]

const getJid = (jid = '') => {
    if (typeof jid === 'object' && jid !== null) {
        jid = jid.id || jid._id || jid.jid || ''
    }
    jid = String(jid || '')
    return jid.split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

const getNum = (jid = '') => {
    if (typeof jid === 'object' && jid !== null) jid = jid.id || ''
    return String(jid || '').split(':')[0].replace(/[^0-9]/g, '')
}

let handler = async (m, { conn }) => {
    try {
        if (!m.isGroup) return
        const sender = getJid(m.sender)
        const commandText = typeof m.text === 'string' ? m.text.trim() : ''
        if (!/^\.?مياو(?:\s|$)/i.test(commandText)) return

        let target = null
        if (m.mentionedJid?.length) {
            target = m.mentionedJid[0]
        } else if (m.quoted?.sender) {
            target = m.quoted.sender
        }

        if (!target) {
            return m.reply(`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ 🐱 استخدم الأمر كده:
*┃* ⚡ ╎
*┃* ⚡ ╎ ✦ .مياو @الشخص
*┃* ⚡ ╎
*┃* ⚡ ╎ أو اعمل Reply على رسالته:
*┃* ⚡ ╎ ✦ .مياو
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`)
        }

        target = getJid(target)

        if (target === getJid(conn.user?.id || conn.user?.jid || '')) {
            return m.reply('*◇❐ ═━━╾⚡ ╼━━═ ❐◇*\n*┃* ⚡ ╎ 😹 مش هقدر ألعن نفسي يا عم.\n*◇❐ ═━━╾⚡╼╼━━═ ❐◇*')
        }
        if (target === sender) {
            return m.reply('*◇❐ ═━━╾⚡ ╼━━═ ❐◇*\n*┃* ⚡ ╎ 🐱 إنت عايز تلعن نفسك ولا إيه؟ 😂\n*◇❐ ═━━╾⚡╼╼━━═ ❐◇*')
        }

        // 👑 حماية المالك / النخبة فقط - المشرف يتلعن عادي
        if (ELITE.includes(getNum(target))) {
            return m.reply(`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ 👑 هذا الشخص من النخبة!
*┃* ⚡ ╎
*┃* ⚡ ╎ ✦ @${getNum(target)}
*┃* ⚡ ╎ ✦ لا يمكن لعنه 😼
*┃* ⚡ ╎
*┃* ⚡ ╎ النخبة فوق اللعنات 👑
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`)
        }

        cursedUsers.set(m.chat, target)

        await m.reply(`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ 😼 تم تفعيل لعنة مياو!
*┃* ⚡ ╎
*┃* ⚡ ╎ 👤 الضحية:
*┃* ⚡ ╎ @${getNum(target)}
*┃* ⚡ ╎
*┃* ⚡ ╎ 🐾 البوت هيحذف كل رسائلك
*┃* ⚡ ╎ ✦ لحد ما تقول: مياو
*┃* ⚡ ╎
*┃* ⚡ ╎ 🔓 قول «مياو» لفك اللعنة
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`)

    } catch (e) {
        console.error('[مياو ERROR]', e)
    }
}

handler.before = async (m, { conn }) => {
    try {
        if (!m.isGroup) return
        if (!m.text) return
        if (!cursedUsers.has(m.chat)) return

        const cursed = cursedUsers.get(m.chat)
        const sender = getJid(m.sender)
        if (sender !== getJid(cursed)) return

        if (m.text.trim().toLowerCase() === 'مياو') {
            cursedUsers.delete(m.chat)
            await m.reply(`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ 🐱 تم فك اللعنة!
*┃* ⚡ ╎
*┃* ⚡ ╎ ✦ @${getNum(m.sender)}
*┃* ⚡ ╎ ✦ قلت مياو بنجاح 😽
*┃* ⚡ ╎
*┃* ⚡ ╎ 🎉 خلاص تقدر تتكلم براحتك
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`)
            return
        }

        try {
            await conn.sendMessage(m.chat, { delete: m.key })
        } catch (e) {
            console.log('[مياو] فشل حذف الرسالة:', e.message)
        }

    } catch (e) {
        console.error('[مياو BEFORE ERROR]', e)
    }
}

handler.help = ['مياو @منشن']
handler.tags = ['owner']
handler.command = /^(مياو)$/i
handler.owner = true

export default handler