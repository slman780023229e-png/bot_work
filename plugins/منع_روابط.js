// plugins/منع_روابط.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight | منع الروابط 🔗

const handler = async (m, { conn, command, isAdmin }) => {

    if (!m.isGroup) {
        return m.reply('❌ الأمر ده للجروبات فقط.')
    }

    if (!global.db.data.chats[m.chat]) {
        global.db.data.chats[m.chat] = {}
    }

    const chat = global.db.data.chats[m.chat]

    // =========================
    // تفعيل منع الروابط
    // =========================

    if (command === 'منع_روابط') {

        if (!isAdmin) {
            return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔒 〕━━━╮
┃
┃ ❌ الأمر للمشرفين فقط.
┃
╰━━━━━━━━━━━━━━╯`
            )
        }

        chat.antiLink = true

        await conn.sendMessage(m.chat, {
            react: {
                text: '🔒',
                key: m.key
            }
        })

        return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔒 〕━━━╮
┃
┃ ✅ تم تفعيل منع الروابط.
┃
┃ 🔗 أي عضو يرسل رابط
┃ سيتم حذف رسالته.
┃
┃ 👑 المشرفون مستثنون.
┃
╰━━━━━━━━━━━━━━╯`
        )
    }

    // =========================
    // إيقاف منع الروابط
    // =========================

    if (command === 'فتح_روابط') {

        if (!isAdmin) {
            return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔒 〕━━━╮
┃
┃ ❌ الأمر للمشرفين فقط.
┃
╰━━━━━━━━━━━━━━╯`
            )
        }

        chat.antiLink = false

        await conn.sendMessage(m.chat, {
            react: {
                text: '🔓',
                key: m.key
            }
        })

        return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🔓 〕━━━╮
┃
┃ ✅ تم إيقاف منع الروابط.
┃
╰━━━━━━━━━━━━━━╯`
        )
    }
}


// ==========================================
// مراقبة الرسائل
// ==========================================

handler.all = async function (m) {

    if (!m.isGroup) return

    if (!global.db?.data?.chats?.[m.chat]) return

    const chat = global.db.data.chats[m.chat]

    if (!chat.antiLink) return

    if (!m.sender) return

    // =========================
    // جلب بيانات المجموعة
    // =========================

    let metadata

    try {
        metadata = await this.groupMetadata(m.chat)
    } catch {
        return
    }

    const participant =
        metadata.participants.find(
            p => p.id === m.sender
        )

    // المشرفون مستثنون
    if (
        participant?.admin === 'admin' ||
        participant?.admin === 'superadmin'
    ) {
        return
    }

    // =========================
    // استخراج النص
    // =========================

    let body = ''

    try {
        body =
            m.text ||
            m.body ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            ''
    } catch {
        return
    }

    if (!body) return

    // =========================
    // اكتشاف الروابط
    // =========================

    const linkRegex =
        /(https?:\/\/[^\s]+|www\.[^\s]+|(?:chat\.whatsapp\.com|wa\.me|t\.me|instagram\.com|facebook\.com|youtube\.com|youtu\.be|tiktok\.com|telegram\.me)\/[^\s]+)/i

    if (!linkRegex.test(body)) return

    // =========================
    // حذف الرسالة
    // =========================

    try {

        await this.sendMessage(
            m.chat,
            {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.sender
                }
            }
        )

    } catch (e) {
        console.error(
            '[ARTHUR BOT-AntiLink]',
            e.message
        )
    }

    // =========================
    // إنذار العضو
    // =========================

    if (!global.db.data.users[m.sender]) {
        global.db.data.users[m.sender] = {}
    }

    const user =
        global.db.data.users[m.sender]

    if (!user.linkWarnings) {
        user.linkWarnings = {}
    }

    if (!user.linkWarnings[m.chat]) {
        user.linkWarnings[m.chat] = 0
    }

    user.linkWarnings[m.chat]++

    const warnings =
        user.linkWarnings[m.chat]

    // =========================
    // الإنذار الثالث = طرد
    // =========================

    if (warnings >= 3) {

        try {

            await this.sendMessage(
                m.chat,
                {
                    text:
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🚫 〕━━━╮
┃
┃ ❌ تم حذف الرابط.
┃
┃ 👤 @${m.sender.split('@')[0]}
┃
┃ ⚠️ وصلت إلى 3 إنذارات.
┃ 🚪 سيتم إخراجك من المجموعة.
┃
╰━━━━━━━━━━━━━━╯`,
                    mentions: [m.sender]
                }
            )

            await this.groupParticipantsUpdate(
                m.chat,
                [m.sender],
                'remove'
            )

        } catch (e) {

            console.error(
                '[ARTHUR BOT-AntiLink-Kick]',
                e.message
            )

        }

        user.linkWarnings[m.chat] = 0

        return
    }

    // =========================
    // رسالة التحذير
    // =========================

    try {

        await this.sendMessage(
            m.chat,
            {
                text:
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚠️ 〕━━━╮
┃
┃ 🚫 ممنوع إرسال الروابط.
┃
┃ 👤 @${m.sender.split('@')[0]}
┃
┃ ⚠️ الإنذار: ${warnings}/3
┃
┃ ✦ عند الإنذار الثالث سيتم
┃ ✦ إخراج العضو من المجموعة.
┃
╰━━━━━━━━━━━━━━╯`,
                mentions: [m.sender]
            }
        )

    } catch {}

}


// ==========================================
// إعدادات البلوجن
// ==========================================

handler.command =
    /^(منع_روابط|فتح_روابط)$/i

handler.help = [
    'منع_روابط',
    'فتح_روابط'
]

handler.tags = [
    'group'
]

handler.group = true
handler.botAdmin = true

export default handler