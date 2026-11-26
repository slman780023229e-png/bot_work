// plugins/مياو.js

const cursedUsers = new Map()

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

const isOwnerJid = (jid) => {
    const num = getNum(jid)
    let owners = global.owner || global.ownerNumber || []
    if (!Array.isArray(owners)) owners = [owners]
    return owners.some(o => {
        if (!o) return false
        if (Array.isArray(o)) return getNum(o[0]) === num
        if (typeof o === 'object') return getNum(o.number || o.id || o.jid || '') === num
        return getNum(o) === num
    })
}

let handler = async (m, { conn }) => {
    try {
        if (!m.isGroup) return
        const sender = getJid(m.sender)
        const commandText = typeof m.text === 'string' ? m.text.trim() : ''
        if (!/^\.?مياو(?:\s|$)/i.test(commandText)) return

        let target = null
        if (m.mentionedJid?.length) target = m.mentionedJid[0]
        else if (m.quoted?.sender) target = m.quoted.sender

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

        if (isOwnerJid(target)) {
            return m.reply(`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ 👑 هذا الشخص هو المالك!
*┃* ⚡ ╎
*┃* ⚡ ╎ ✦ @${getNum(target)}
*┃* ⚡ ╎ ✦ لا يمكن لعنه 😼
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
*┃* ⚡ ╎ ✦ رسايل - صور - فيديو - ملصقات
*┃* ⚡ ╎ ✦ لحد ما تقول: مياو
*┃* ⚡ ╎
*┃* ⚡ ╎ 🔓 قول «مياو» لوحدها لفك اللعنة
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`)

    } catch (e) {
        console.error('[مياو ERROR]', e)
    }
}

handler.before = async (m, { conn }) => {
    try {
        if (!m.isGroup) return
        if (!cursedUsers.has(m.chat)) return
        // لا تطلع لو ما فيه نص - عشان الملصقات تنحذف
        if (!m.key?.id) return

        const cursed = cursedUsers.get(m.chat)
        const sender = getJid(m.sender)
        if (sender !== getJid(cursed)) return

        // لا تحذف رسايل البوت نفسه
        if (m.key.fromMe) return

        // جيب النص من أي مكان - رسالة عادية أو كابشن صورة / فيديو
        const rawText = (
            m.text ||
            m.msg?.caption ||
            m.msg?.text ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            ''
        )

        const cleanText = String(rawText).trim().toLowerCase()

        // ✅ فك اللعنة بشرطين:
        // 1. النص = مياو بالضبط لوحدها
        // 2. نوع الرسالة نص فقط - مش ملصق ولا صورة ولا فيديو
        const isTextOnly = m.mtype === 'conversation' || m.mtype === 'extendedTextMessage' || !m.mtype

        if (cleanText === 'مياو' && isTextOnly) {
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

        // ❌ غير كذا احذف أي شي يرسله الملعون
        // نص - صورة - فيديو - ملصق - صوتي - ملف - رياكشن
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