// plugins/مانع_جهات.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - مانع جهات الاتصال ✧

let handler = async (m, { conn, usedPrefix }) => {
    // هذا الـ handler الرئيسي ما نستخدمه، كل الشغل في before
    return
}

// كل الشغل هنا في before عشان يفحص كل رسالة
handler.before = async function (m, { conn, isROwner, isAdmin, isBotAdmin, usedPrefix }) {
    if (!m.isGroup) return
    if (!m.message) return

    const text = m.text || m.body || ""
    const sender = m.sender
    const chatId = m.chat

    // ── 1. أمر التفعيل والتعطيل ──
    // نفحص النص يدوياً لأن before ما يوصله command
    const prefix = usedPrefix || "."
    const cleanText = text.trim()
    const isCmd = cleanText.startsWith(prefix + "مانع_جهات") || cleanText.startsWith(prefix + "مانع-جهات") || cleanText.startsWith("مانع_جهات") || cleanText.startsWith("مانع-جهات")

    if (isCmd) {
        // فحص المشرف يدوياً من الميتاداتا - اضمن من isAdmin
        let isAdminReal = isAdmin || false
        try {
            const metadata = await conn.groupMetadata(chatId)
            const participant = metadata.participants.find(p => p.id === sender)
            if (participant && (participant.admin === "admin" || participant.admin === "superadmin")) isAdminReal = true
        } catch {}

        if (!isAdminReal && !isROwner) {
            return conn.sendMessage(chatId, { text: '⚠️ هذا الأمر للمشرفين فقط!' }, { quoted: m })
        }

        if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
        let chat = global.db.data.chats[chatId]

        // نجيب كلمة تفعيل / تعطيل من النص
        let arg = cleanText.replace(/.*مانع[_-]جهات\s*/i, "").trim().toLowerCase()

        if (arg === 'تفعيل' || arg === 'on' || arg === 'تشغيل') {
            chat.antiContact = true
            if (global.db.write) await global.db.write()
            return conn.sendMessage(chatId, { text: '✅ تم تفعيل مانع جهات الاتصال (حذف + طرد).' }, { quoted: m })
        } else if (arg === 'تعطيل' || arg === 'off' || arg === 'ايقاف') {
            chat.antiContact = false
            if (global.db.write) await global.db.write()
            return conn.sendMessage(chatId, { text: '❌ تم تعطيل مانع جهات الاتصال.' }, { quoted: m })
        } else {
            return conn.sendMessage(chatId, {
                text: `*طريقة الاستخدام:*\n\n• \`${prefix}مانع_جهات تفعيل\`\n• \`${prefix}مانع_جهات تعطيل\``
            }, { quoted: m })
        }
    }

    // ── 2. فحص جهة الاتصال ──
    let chat = global.db?.data?.chats?.[chatId]
    if (!chat?.antiContact) return

    // فحص شامل - مو بس m.mtype
    const msgType = m.mtype || Object.keys(m.message || {})[0] || ""
    const isContact = msgType === 'contactMessage' || msgType === 'contactsArrayMessage' || !!m.message?.contactMessage || !!m.message?.contactsArrayMessage

    if (!isContact) return

    // لا تطرد المشرفين ولا المالك
    if (isROwner) return
    let isSenderAdmin = isAdmin || false
    try {
        const metadata = await conn.groupMetadata(chatId)
        const participant = metadata.participants.find(p => p.id === sender)
        if (participant && (participant.admin === "admin" || participant.admin === "superadmin")) isSenderAdmin = true
    } catch {}
    if (isSenderAdmin) return

    // لازم البوت يكون مشرف
    if (!isBotAdmin) {
        // نتأكد يدوياً
        try {
            const metadata = await conn.groupMetadata(chatId)
            const botId = conn.user.jid
            const botPart = metadata.participants.find(p => p.id === botId || p.id.split(':')[0] + '@s.whatsapp.net' === botId)
            if (!botPart || (botPart.admin !== "admin" && botPart.admin !== "superadmin")) return
        } catch { return }
    }

    try {
        // 1. حذف الرسالة
        try { await conn.sendMessage(chatId, { delete: m.key }) } catch {}

        // 2. طرد العضو
        await conn.groupParticipantsUpdate(chatId, [sender], 'remove')

        // 3. اشعار
        await conn.sendMessage(chatId, {
            text: `🚫 *تم طرد المستخدم:* @${sender.split('@')[0]}\nسبب الطرد: إرسال جهات اتصال (ممنوع في الجروب).`,
            mentions: [sender]
        })

    } catch (e) {
        console.error('خطأ مانع جهات:', e)
    }
}

handler.group = false // نخليه false عشان before يشتغل
handler.botAdmin = false

export default handler