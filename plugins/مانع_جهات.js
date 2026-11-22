// plugins/مانع_جهات.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - مانع جهات - نسخة التشخيص النهائية ✧

const listener = async function (m, { conn, isROwner, isAdmin, isBotAdmin, usedPrefix }) {
    try {
        // لا نعتمد على m.isGroup لأنه يجي undefined في بعض القوالب
        // نفحص هل الشات جروب من نهايته
        const chatId = m.chat || ""
        const isGroupChat = chatId.endsWith("@g.us") || m.isGroup === true
        if (!isGroupChat) return
        if (!m.message && !m.mtype) return

        const sender = m.sender
        const senderNumber = sender.split("@")[0]
        const text = (m.text || m.body || "").trim()
        const prefix = usedPrefix || "."

        // ═══ 1 | الأوامر ═══
        const isCmd = text.startsWith(prefix + "مانع_جهات") || text.startsWith(prefix + "مانع-جهات") || text === "مانع_جهات" || text === "مانع-جهات"

        if (isCmd) {
            if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
            let chat = global.db.data.chats[chatId]
            let arg = text.replace(/.*مانع[_-]جهات\s*/i, "").trim().toLowerCase()

            if (arg === "تفعيل" || arg === "on" || arg === "تشغيل") {
                chat.antiContact = true
                if (global.db.write) await global.db.write()
                console.log(`[مانع_جهات] ✅ تم التفعيل في ${chatId} | القيمة الحين: ${global.db.data.chats[chatId].antiContact}`)
                return conn.sendMessage(chatId, { text: '✅ تم تفعيل مانع جهات الاتصال\nجرب الحين ارسل جهة اتصال من رقم ثاني' }, { quoted: m })
            }
            if (arg === "تعطيل" || arg === "off" || arg === "ايقاف") {
                chat.antiContact = false
                if (global.db.write) await global.db.write()
                return conn.sendMessage(chatId, { text: '❌ تم تعطيل مانع جهات الاتصال.' }, { quoted: m })
            }
            if (arg === "حالة" || arg === "فحص") {
                return conn.sendMessage(chatId, { text: `الحالة: ${chat.antiContact ? "مفعّل ✅" : "معطّل ❌"}\nالجروب: ${chatId}\nالبوت مشرف؟ ${isBotAdmin}` }, { quoted: m })
            }
            return conn.sendMessage(chatId, { text: `• ${prefix}مانع_جهات تفعيل\n• ${prefix}مانع_جهات تعطيل\n• ${prefix}مانع_جهات حالة` }, { quoted: m })
        }

        // ═══ 2 | المستمع ═══
        // طباعة كل رسالة عشان تتأكد ان المستمع شغال اصلاً
        console.log(`[مانع_جهات] رسالة | نوع: ${m.mtype} | من: ${senderNumber} | مفاتيح: ${JSON.stringify(Object.keys(m.message || {}))}`)

        let chat = global.db?.data?.chats?.[chatId]
        console.log(`[مانع_جهات] هل المانع مفعّل في هالجروب؟ ${chat?.antiContact}`)
        if (!chat?.antiContact) return

        // فحص جهة الاتصال بكل الطرق الممكنة
        const msg = m.message || {}
        const isContact =
            m.mtype === "contactMessage" ||
            m.mtype === "contactsArrayMessage" ||
            !!msg.contactMessage ||
            !!msg.contactsArrayMessage ||
            !!msg.viewOnceMessage?.message?.contactMessage ||
            !!msg.viewOnceMessage?.message?.contactsArrayMessage ||
            !!msg.viewOnceMessageV2?.message?.contactMessage ||
            !!msg.ephemeralMessage?.message?.contactMessage ||
            JSON.stringify(msg).includes("contactMessage") ||
            JSON.stringify(msg).includes("contactsArrayMessage") ||
            JSON.stringify(msg).includes("displayName") && JSON.stringify(msg).includes("vcard")

        console.log(`[مانع_جهات] هل هي جهة اتصال؟ ${isContact}`)
        if (!isContact) return

        console.log(`[مانع_جهات] ⚠️ تم اكتشاف جهة اتصال من ${senderNumber} - جاري الحذف والطرد`)

        const botJid = conn.user.jid
        if (sender === botJid || sender === botJid.split(":")[0] + "@s.whatsapp.net") {
            console.log(`[مانع_جهات] المرسل هو البوت نفسه، تخطي`)
            return
        }

        // ⚠️ شلت فحص isBotAdmin - بنحاول نطرد غصب ولو فشل بنقولك ليش
        // 1 | حذف
        try {
            await conn.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: m.key.id, participant: sender }
            })
            console.log(`[مانع_جهات] ✅ تم الحذف`)
        } catch (e) {
            console.log(`[مانع_جهات] ❌ فشل الحذف: ${e.message}`)
            try { await conn.sendMessage(chatId, { delete: m.key }) } catch {}
        }

        // 2 | طرد
        try {
            await conn.groupParticipantsUpdate(chatId, [sender], "remove")
            console.log(`[مانع_جهات] ✅ تم الطرد`)
            await conn.sendMessage(chatId, {
                text: `🚫 تم طرد @${senderNumber}\nالسبب: إرسال جهة اتصال`,
                mentions: [sender]
            })
        } catch (e) {
            console.log(`[مانع_جهات] ❌ فشل الطرد: ${e.message}`)
            // هنا بيقولك في الجروب ليش ما طرد - هذي اهم رسالة
            await conn.sendMessage(chatId, { text: `⚠️ اكتشفت جهة اتصال من @${senderNumber} بس ما قدرت اطرده\nالسبب: ${e.message}\n\nتأكد ان البوت مشرف في الجروب!`, mentions: [sender] })
        }

    } catch (e) {
        console.error("[مانع_جهات] خطأ عام:", e)
    }
}

let handler = async (m, { conn, usedPrefix }) => { return }

handler.before = listener
handler.all = listener
handler.command = /^(مانع_جهات|مانع-جهات)$/i
handler.group = false
handler.botAdmin = false

export default handler