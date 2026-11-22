// plugins/مانع_جهات.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - مانع جهات الاتصال - النسخة المضمونة ✧

const listener = async function (m, { conn, isROwner, isAdmin, isBotAdmin, usedPrefix }) {
    try {
        if (!m.isGroup) return
        if (!m.message) return

        const chatId = m.chat
        const sender = m.sender
        const text = (m.text || m.body || "").trim()
        const prefix = usedPrefix || "."

        // ═══════════════════════════════════
        // 1 | أمر التفعيل / التعطيل
        // ═══════════════════════════════════
        const isCmd = text.startsWith(prefix + "مانع_جهات") || text.startsWith(prefix + "مانع-جهات") || text === "مانع_جهات" || text === "مانع-جهات"

        if (isCmd) {
            let admin = isAdmin || false
            try {
                const meta = await conn.groupMetadata(chatId)
                const p = meta.participants.find(v => v.id === sender)
                if (p && (p.admin === "admin" || p.admin === "superadmin")) admin = true
            } catch {}

            if (!admin && !isROwner) {
                return conn.sendMessage(chatId, { text: '⚠️ هذا الأمر للمشرفين فقط!' }, { quoted: m })
            }

            if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
            let chat = global.db.data.chats[chatId]
            let arg = text.replace(/.*مانع[_-]جهات\s*/i, "").trim().toLowerCase()

            if (arg === "تفعيل" || arg === "on" || arg === "تشغيل") {
                chat.antiContact = true
                if (global.db.write) await global.db.write()
                return conn.sendMessage(chatId, { text: '✅ تم تفعيل مانع جهات الاتصال\n🗑️ حذف + 🚫 طرد تلقائي' }, { quoted: m })
            }

            if (arg === "تعطيل" || arg === "off" || arg === "ايقاف") {
                chat.antiContact = false
                if (global.db.write) await global.db.write()
                return conn.sendMessage(chatId, { text: '❌ تم تعطيل مانع جهات الاتصال.' }, { quoted: m })
            }

            return conn.sendMessage(chatId, {
                text: `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  مانع جهات الاتصال\n  الحالة: ${chat.antiContact ? "مفعّل ✅" : "معطّل ❌"}\n\n  • ${prefix}مانع_جهات تفعيل\n  • ${prefix}مانع_جهات تعطيل\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
            }, { quoted: m })
        }

        // ═══════════════════════════════════
        // 2 | المستمع - حذف + طرد
        // ═══════════════════════════════════
        let chat = global.db?.data?.chats?.[chatId]
        if (!chat?.antiContact) return

        // فحص شامل لكل انواع جهات الاتصال
        const keys = Object.keys(m.message || {})
        const inner = m.message?.viewOnceMessage?.message ? Object.keys(m.message.viewOnceMessage.message) : []
        const isContact =
            m.mtype === "contactMessage" ||
            m.mtype === "contactsArrayMessage" ||
            keys.includes("contactMessage") ||
            keys.includes("contactsArrayMessage") ||
            inner.includes("contactMessage") ||
            inner.includes("contactsArrayMessage") ||
            !!m.message?.contactMessage ||
            !!m.message?.contactsArrayMessage

        if (!isContact) return

        // لا تطرد المالك ولا المشرفين
        if (isROwner) return
        let senderAdmin = isAdmin || false
        let botAdmin = isBotAdmin || false
        try {
            const meta = await conn.groupMetadata(chatId)
            const me = conn.user.jid
            for (let p of meta.participants) {
                if (p.id === sender && (p.admin === "admin" || p.admin === "superadmin")) senderAdmin = true
                if ((p.id === me || p.id === me.split(":")[0] + "@s.whatsapp.net") && (p.admin === "admin" || p.admin === "superadmin")) botAdmin = true
            }
        } catch {}
        if (senderAdmin) return
        if (!botAdmin) return

        // 1 | حذف الرسالة بالطريقة الصحيحة لـ Baileys الجديد
        try {
            await conn.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: m.key.id,
                    participant: sender
                }
            })
        } catch {
            try { await conn.sendMessage(chatId, { delete: m.key }) } catch {}
        }

        // 2 | طرد العضو
        await conn.groupParticipantsUpdate(chatId, [sender], "remove")

        // 3 | اشعار
        await conn.sendMessage(chatId, {
            text: `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  🚫 تم طرد @${sender.split("@")[0]}\n  السبب: إرسال جهة اتصال ممنوع\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`,
            mentions: [sender]
        })

    } catch (e) {
        console.error("[مانع_جهات]", e)
    }
}

let handler = async (m, { conn, usedPrefix }) => {
    // كل الشغل في المستمع تحت
    return
}

// ⚡ المستمع المضمون - الاثنين مع بعض عشان يشتغل في كل القوالب
handler.before = listener
handler.all = listener

handler.command = /^(مانع_جهات|مانع-جهات)$/i
handler.group = false
handler.botAdmin = false

export default handler