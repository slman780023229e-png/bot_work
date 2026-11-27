// plugins/Changes.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - كشف تغييرات المجموعة ⚡

const handler = async (m, { conn, usedPrefix, command, isAdmin, isOwner }) => {
    if (!m.isGroup) {
        return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ *هذا الأمر مخصص للمجموعات فقط*
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
        )
    }

    if (!(isAdmin || isOwner)) {
        return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ *هذا الأمر للمشرفين فقط*
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
        )
    }

    if (!global.db?.data) {
        global.db = { data: { chats: {} } }
    }
    if (!global.db.data.chats) {
        global.db.data.chats = {}
    }
    if (!global.db.data.chats[m.chat]) {
        global.db.data.chats[m.chat] = {}
    }

    const chat = global.db.data.chats[m.chat]

    if (chat.changes) {
        chat.changes = false

        return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 🔄 ╎ *كشف التغييرات:* ❌ تم الإيقاف
*┃* 🔄 ╎ *لإعادة التشغيل:* ${usedPrefix + command}
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
        )
    }

    chat.changes = true

    return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 🔄 ╎ *كشف التغييرات:* ✅ تم التشغيل
*┃* 🔄 ╎ *قفل وفتح الشات، الاسم، الوصف*
*┃* 🔄 ╎ *ترقية وإزالة الإشراف، طرد عضو*
*┃* 🔄 ╎ *دخول وخروج الأعضاء غير مراقب*
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
    )
}

// ======================================================
// 🔄 مراقبة تغييرات المجموعة
// ======================================================

function extractJid(param) {
    if (!param) return ''
    let val = param
    try {
        if (typeof param === 'string' && param.startsWith('{')) {
            const parsed = JSON.parse(param)
            val = parsed.jid || parsed.id || parsed.phoneNumber || ''
        }
    } catch {}
    if (!val) return ''
    return val.includes('@') ? val : `${val}@s.whatsapp.net`
}

handler.before = async (m, { conn }) => {
    try {
        if (!m.isGroup) return

        const chat = global.db?.data?.chats?.[m.chat]
        if (!chat?.changes) return

        // تجاهل الدخول (27) والخروج الطوعي (28)
        // StubTypes الشائعة للتغييرات:
        // 21: تغيير اسم المجموعة
        // 22: تغيير صورة المجموعة
        // 23: تغيير رابط الدعوة
        // 24: تغيير وصف المجموعة
        // 25: قفل/فتح إعدادات المجموعة (announcement / locked)
        // 29: ترقية مشرف
        // 30: إزالة إشراف
        // 32: إزالة / طرد عضو
        const stubType = Number(m.messageStubType)
        if (![21, 22, 23, 24, 25, 29, 30, 32].includes(stubType)) return

        const actorJid = extractJid(m.sender || m.participant || m.key?.participant)
        const targetJid = extractJid(m.messageStubParameters?.[0])

        const mentions = []
        if (actorJid) mentions.push(actorJid)
        if (targetJid && !mentions.includes(targetJid)) mentions.push(targetJid)

        const actorTag = actorJid ? `@${actorJid.split('@')[0]}` : 'غير معروف'
        const targetTag = targetJid ? `@${targetJid.split('@')[0]}` : 'عضو'

        let detailLine = ''

        switch (stubType) {
            case 21: {
                const newSubject = m.messageStubParameters?.[0] || 'اسم جديد'
                detailLine = `*┃* 🔄 ╎ *تغيير الاسم:* ${newSubject}`
                break
            }
            case 22: {
                detailLine = `*┃* 🔄 ╎ *تغيير صورة المجموعة*`
                break
            }
            case 23: {
                detailLine = `*┃* 🔄 ╎ *إعادة تعيين رابط المجموعة*`
                break
            }
            case 24: {
                detailLine = `*┃* 🔄 ╎ *تحديث وصف المجموعة*`
                break
            }
            case 25: {
                const param0 = String(m.messageStubParameters?.[0] || '').toLowerCase()
                if (param0 === 'on' || param0 === 'true' || param0 === 'announcement') {
                    detailLine = `*┃* 🔄 ╎ *حالة الشات:* 🔒 تم القفل (المشرفون فقط)`
                } else if (param0 === 'off' || param0 === 'false' || param0 === 'not_announcement') {
                    detailLine = `*┃* 🔄 ╎ *حالة الشات:* 🔓 تم الفتح (جميع الأعضاء)`
                } else {
                    detailLine = `*┃* 🔄 ╎ *تعديل إعدادات المجموعة*`
                }
                break
            }
            case 29: {
                detailLine = `*┃* 🔄 ╎ *ترقية مشرف:* ${targetTag}`
                break
            }
            case 30: {
                detailLine = `*┃* 🔄 ╎ *إزالة إشراف:* ${targetTag}`
                break
            }
            case 32: {
                detailLine = `*┃* 🔄 ╎ *إزالة / طرد:* ${targetTag}`
                break
            }
        }

        const msg =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
${detailLine}
*┃* 🔄 ╎ *بواسطة:* ${actorTag}
*◇❐ ═━━╾⚡╼━━═ ❐◇*`

        await conn.sendMessage(m.chat, {
            text: msg,
            mentions
        })
    } catch (e) {
        console.error('[ARTHUR BOT-CHANGES-ERROR]', e)
    }
}

handler.help = ['تغييرات']
handler.tags = ['group']
handler.command = /^(تغييرات|changes)$/i

handler.group = true
handler.admin = true

export default handler