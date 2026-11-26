// plugins/مياو.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - لعنة مياو 🐾

const cursedUsers = new Map()

// 👑 هنا حط أرقام النخبة - بدون + وبدون مسافات
const ELITE = [
  '967700000000', // رقمك انت
  '967711111111', // رقم صاحبك
  // ضيف هنا أي رقم تبيه يكون من النخبة
]

const getJid = (jid = '') => {
    if (!jid) return ''
    return jid.split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

const getNum = (jid = '') => {
    return jid.split(':')[0].replace(/[^0-9]/g, '')
}

let handler = async (m, { conn, text }) => {
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

        if (target === getJid(conn.user?.id)) {
            return m.reply('*◇❐ ═━━╾⚡ ╼━━═ ❐◇*\n*┃* ⚡ ╎ 😹 مش هقدر ألعن نفسي يا عم.\n*◇❐ ═━━╾⚡╼╼━━═ ❐◇*')
        }
        if (target === sender) {
            return m.reply('*◇❐ ═━━╾⚡ ╼━━═ ❐◇*\n*┃* ⚡ ╎ 🐱 إنت عايز تلعن نفسك ولا إيه؟ 😂\n*◇❐ ═━━╾⚡╼╼━━═ ❐◇*')
        }

        // 👑 حماية النخبة
        if (ELITE.includes(getNum(target))) {
            return m.reply(`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ 👑 هذا الشخص من النخبة!
*┃* ⚡ ╎
*┃* ⚡ ╎ ✦ @${target.split('@')[0]}
*┃* ⚡ ╎ ✦ لا يمكن لعنه 😼
*┃* ⚡ ╎
*┃* ⚡ ╎ النخبة فوق اللعنات 👑
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`, { mentions: [target] })
        }

        // 👑 حماية مشرفين القروب
        try {
            const metadata = await conn.groupMetadata(m.chat)
            const participant = metadata.participants.find(p => getJid(p.id) === target)
            if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
                return m.reply(`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ 👑 هذا الشخص مشرف!
*┃* ⚡ ╎
*┃* ⚡ ╎ ✦ @${target.split('@')[0]}
*┃* ⚡ ╎ ✦ المشرفين ما تنطبق عليهم اللعنة
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`, { mentions: [target] })
            }
        } catch {}

        cursedUsers.set(m.chat, target)

        await conn.sendMessage(m.chat, {
            text: `*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ 😼 تم تفعيل لعنة مياو!
*┃* ⚡ ╎
*┃* ⚡ ╎ 👤 الضحية:
*┃* ⚡ ╎ @${target.split('@')[0]}
*┃* ⚡ ╎
*┃* ⚡ ╎ 🐾 البوت هيحذف كل رسائلك
*┃* ⚡ ╎ ✦ لحد ما تقول: مياو
*┃* ⚡ ╎
*┃* ⚡ ╎ 🔓 قول «مياو» لفك اللعنة
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`,
            mentions: [target]
        }, { quoted: m })

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
*┃* ⚡ ╎ ✦ @${m.sender.split('@')[0]}
*┃* ⚡ ╎ ✦ قلت مياو بنجاح 😽
*┃* ⚡ ╎
*┃* ⚡ ╎ 🎉 خلاص تقدر تتكلم براحتك
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`, { mentions: [m.sender] })
            return
        }

        try {
            await conn.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.key.participant || m.sender
                }
            })
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