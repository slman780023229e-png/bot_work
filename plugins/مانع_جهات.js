// plugins/مانع_جهات.js

const extractContactInfo = (msg = {}) => {
    const unwrapped =
        msg.ephemeralMessage?.message ||
        msg.viewOnceMessage?.message ||
        msg.viewOnceMessageV2?.message ||
        msg.viewOnceMessageV2Extension?.message ||
        msg

    const hasSingleContact = Boolean(unwrapped.contactMessage)
    const hasContactsArray = Boolean(unwrapped.contactsArrayMessage)

    return hasSingleContact || hasContactsArray
}

const listener = async function (m, { conn, isBotAdmin, usedPrefix }) {
    try {
        const chatId = m.chat || ""
        const isGroupChat = chatId.endsWith("@g.us")
        if (!isGroupChat || !m.message) return

        const sender = m.sender || m.key?.participant || ""
        if (!sender) return

        const senderNumber = sender.split("@")[0]
        const text = (m.text || m.body || "").trim()
        const prefix = usedPrefix || "."

        // ═══ 1 | الأوامر (بدون قيود صلاحيات) ═══
        const cmdMatch = text.match(new RegExp(`^[\\${prefix}]?(مانع[_-]جهات)(?:\\s+(.*))?$`, "i"))
        if (cmdMatch) {
            global.db = global.db || { data: { chats: {} } }
            global.db.data = global.db.data || { chats: {} }
            global.db.data.chats[chatId] = global.db.data.chats[chatId] || {}

            const chat = global.db.data.chats[chatId]
            const arg = (cmdMatch[2] || "").trim().toLowerCase()

            if (["تفعيل", "on", "تشغيل"].includes(arg)) {
                chat.antiContact = true
                if (global.db.write) await global.db.write()
                return conn.sendMessage(chatId, { text: "✅ تم تفعيل مانع جهات الاتصال (سيتم طرد أي شخص يرسل جهة اتصال)." }, { quoted: m })
            }

            if (["تعطيل", "off", "ايقاف", "إيقاف"].includes(arg)) {
                chat.antiContact = false
                if (global.db.write) await global.db.write()
                return conn.sendMessage(chatId, { text: "❌ تم تعطيل مانع جهات الاتصال." }, { quoted: m })
            }

            if (["حالة", "فحص"].includes(arg)) {
                return conn.sendMessage(
                    chatId,
                    {
                        text: `📊 الحالة: ${chat.antiContact ? "مفعّل ✅" : "معطّل ❌"}\n🛡️ صلاحية إشراف البوت: ${isBotAdmin ? "مشرف ✅" : "غير مشرف ⚠️"}`
                    },
                    { quoted: m }
                )
            }

            return conn.sendMessage(
                chatId,
                {
                    text: `استخدام الأمر:\n• ${prefix}مانع_جهات تفعيل\n• ${prefix}مانع_جهات تعطيل\n• ${prefix}مانع_جهات حالة`
                },
                { quoted: m }
            )
        }

        // ═══ 2 | المستمع ═══
        const chat = global.db?.data?.chats?.[chatId]
        if (!chat?.antiContact) return

        const isContact =
            m.mtype === "contactMessage" ||
            m.mtype === "contactsArrayMessage" ||
            extractContactInfo(m.message)

        if (!isContact) return

        const rawBotJid = conn?.user?.jid || conn?.user?.id || ""
        const botNumber = rawBotJid.split(":")[0].split("@")[0]

        // تجاهل البوت فقط حتى لا يحاول طرد نفسه
        if (senderNumber === botNumber) return

        // حذف الرسالة
        try {
            await conn.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: m.key?.id,
                    participant: sender
                }
            })
        } catch {
            try {
                if (m.key) await conn.sendMessage(chatId, { delete: m.key })
            } catch {}
        }

        // محاولة الطرد مباشرة بدون انتظار فحص isBotAdmin
        try {
            await conn.groupParticipantsUpdate(chatId, [sender], "remove")
            await conn.sendMessage(
                chatId,
                {
                    text: `🚫 تم طرد @${senderNumber}\nالسبب: إرسال جهة اتصال.`,
                    mentions: [sender]
                }
            )
        } catch (e) {
            console.error("[مانع_جهات] فشل الطرد:", e)
            await conn.sendMessage(
                chatId,
                {
                    text: `⚠️ تم اكتشاف جهة اتصال من @${senderNumber} ولكن تعذّر طرده.\nالسبب: ${e.message || "تأكد أن البوت مشرف في المجموعة"}`,
                    mentions: [sender]
                }
            )
        }
    } catch (e) {
        console.error("[مانع_جهات] خطأ:", e)
    }
}

const handler = async () => {}
handler.before = listener
handler.customPrefix = /^(مانع[_-]جهات)/i
handler.command = new RegExp()

export default handler