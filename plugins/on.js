// plugins/welcome.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - الترحيب والمغادرة ⚡

import fetch from 'node-fetch'

const welcomeImage = 'https://pomf2.lain.la/f/83fjjuya.jpg'
const goodbyeImage = 'https://pomf2.lain.la/f/83fjjuya.jpg'
const audioUrl = 'https://file.garden/aauvg01sjleV_ic1/%D8%AA%D8%B1%D8%AD%D9%8A%D8%A8.opus'

async function fetchBufferSafe(url, timeoutMs = 15000) {
    if (!url) return null
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            }
        })
        if (!res.ok) return null
        const arrayBuf = await res.arrayBuffer()
        const buf = Buffer.from(arrayBuf)
        return buf.length > 0 ? buf : null
    } catch {
        return null
    } finally {
        clearTimeout(timer)
    }
}

const handler = async (m, { conn, command, args, isAdmin, isOwner }) => {
    if (!m.isGroup) {
        return m.reply('🔒 هذا الأمر مخصص للجروبات فقط.')
    }

    if (!global.db.data.chats[m.chat]) {
        global.db.data.chats[m.chat] = {}
    }

    const chat = global.db.data.chats[m.chat]
    const type = (args[0] || '').toLowerCase()

    // .on welcome = تشغيل
    // .off welcome = إيقاف
    const enable = command === 'on'

    if (type !== 'welcome') {
        return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ *أمر الترحيب*
*┃* ⚡ ╎ *تشغيل:* ${m.prefix || '.'}${command} welcome
*┃* ⚡ ╎ *مثال:* .on welcome / .off welcome
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
        )
    }

    if (!(isAdmin || isOwner)) {
        return m.reply('❌ هذا الأمر للمشرفين فقط.')
    }

    chat.welcome = enable

    return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ *الترحيب:* ${enable ? '✅ تم التفعيل' : '❌ تم التعطيل'}
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
    )
}

handler.command = ['on', 'off']
handler.group = true
handler.register = true

// ======================================================
// ⚡ الترحيب والمغادرة
// ======================================================

handler.before = async (m, { conn }) => {
    try {
        if (!m.isGroup) return

        if (!global.db.data.chats[m.chat]) {
            global.db.data.chats[m.chat] = {}
        }

        const chat = global.db.data.chats[m.chat]

        if (!chat.welcome) return

        // 27 = دخول
        // 28 = خروج
        // 32 = مغادرة/إزالة
        if (![27, 28, 32].includes(m.messageStubType)) return

        const groupMetadata = await conn.groupMetadata(m.chat)
        const groupSize = groupMetadata.participants.length
        const groupDescription = groupMetadata.desc || 'لا يوجد وصف متاح'

        // ==================================================
        // استخراج الشخص الذي دخل / خرج
        // ==================================================

        let rawParam = m.messageStubParameters?.[0] || ''
        let userId = ''
        let userName = 'عضو'

        try {
            if (typeof rawParam === 'string' && rawParam.startsWith('{')) {
                const parsed = JSON.parse(rawParam)
                userId = parsed.phoneNumber || parsed.id || parsed.jid || ''
                userName = parsed.username || parsed.name || 'عضو'
            } else {
                userId = rawParam
            }
        } catch {
            userId = rawParam
        }

        // ==================================================
        // البحث عن العضو داخل بيانات المجموعة
        // ==================================================

        const participant = groupMetadata.participants.find(p =>
            p.id === userId ||
            p.jid === userId ||
            p.phoneNumber === userId
        )

        if (participant) {
            userId = participant.jid || participant.id || participant.phoneNumber || userId

            try {
                const name = await conn.getName(userId)
                if (name && !/^\d+$/.test(name)) {
                    userName = name
                }
            } catch {}
        }

        // ==================================================
        // تنظيف الـ JID للمينشن
        // ==================================================

        if (userId && !userId.includes('@')) {
            userId = `${userId}@s.whatsapp.net`
        }

        if (!userId && m.sender) {
            userId = m.sender
        }

        const mention = userId ? `@${userId.split('@')[0]}` : userName
        const mentions = userId ? [userId] : []

        // ==================================================
        // ✨ دخول عضو جديد
        // ==================================================

        if (m.messageStubType === 27) {
            const txtwelcome =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ✨ ╎ *تـرحـيـب*
*┃* ✨ ╎ *العضو:* ${mention}
*┃* ✨ ╎ *المجموعة:* ${groupMetadata.subject}
*┃* ✨ ╎ *الأعضاء:* ${groupSize}
*┃* ✨ ╎ *الوصف:* ${groupDescription.substring(0, 100)}
*◇❐ ═━━╾⚡╼━━═ ❐◇*`

            try {
                const imgBuffer = await fetchBufferSafe(welcomeImage)

                if (imgBuffer) {
                    await conn.sendMessage(m.chat, {
                        image: imgBuffer,
                        caption: txtwelcome,
                        mentions
                    })
                } else {
                    await conn.sendMessage(m.chat, {
                        text: txtwelcome,
                        mentions
                    })
                }

                const audioBuffer = await fetchBufferSafe(audioUrl)
                if (audioBuffer) {
                    await conn.sendMessage(m.chat, {
                        audio: audioBuffer,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true
                    })
                }
            } catch (e) {
                console.error('[ARTHUR BOT-WELCOME-ERROR]', e)
            }

            return
        }

        // ==================================================
        // 🍂 خروج عضو
        // ==================================================

        if (m.messageStubType === 28 || m.messageStubType === 32) {
            const txtBye =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 🍂 ╎ *وداعـاً*
*┃* 🍂 ╎ *العضو:* ${mention}
*┃* 🍂 ╎ *المجموعة:* ${groupMetadata.subject}
*┃* 🍂 ╎ *الأعضاء:* ${groupSize}
*┃* 🍂 ╎ *نتمنى رؤيتك مرة أخرى*
*◇❐ ═━━╾⚡╼━━═ ❐◇*`

            try {
                const imgBuffer = await fetchBufferSafe(goodbyeImage)

                if (imgBuffer) {
                    await conn.sendMessage(m.chat, {
                        image: imgBuffer,
                        caption: txtBye,
                        mentions
                    })
                } else {
                    await conn.sendMessage(m.chat, {
                        text: txtBye,
                        mentions
                    })
                }
            } catch (e) {
                console.error('[ARTHUR BOT-GOODBYE-ERROR]', e)
            }

            return
        }
    } catch (e) {
        console.error('[ARTHUR BOT-WELCOME-BEFORE]', e)
    }
}

// ======================================================
// الإعدادات
// ======================================================

handler.help = [
    'on welcome',
    'off welcome'
]

handler.tags = [
    'group'
]

export default handler