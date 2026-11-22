// plugins/مخفي.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - مخفي 👻 ✧

import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

let handler = async (m, { conn, text }) => {
    try {

        // التأكد إن الأمر داخل جروب
        if (!m.chat || !m.chat.endsWith('@g.us')) {
            return m.reply('❌ الأمر ده للجروبات فقط.')
        }

        // جلب بيانات الجروب مباشرة
        const metadata = await conn.groupMetadata(m.chat)

        const participants = metadata?.participants || []

        if (!participants.length) {
            return m.reply('❌ مقدرتش أجيب أعضاء الجروب.')
        }

        // استخراج أرقام الأعضاء
        const mentionedJid = participants
            .map(p => p.id || p.jid || p.lid)
            .filter(Boolean)

        // الكلام
        const messageText = text?.trim()

        if (!messageText && !m.quoted) {
            return m.reply(
                '👻 اكتب الكلام بعد الأمر.\n\nمثال:\n.مخفي السلام عليكم يا شباب'
            )
        }

        // لو فيه رد على رسالة
        if (m.quoted) {

            const quotedText =
                m.quoted.text ||
                m.quoted.caption ||
                ''

            const finalText = messageText || quotedText

            const msg = generateWAMessageFromContent(
                m.chat,
                {
                    extendedTextMessage: {
                        text: finalText,
                        contextInfo: {
                            mentionedJid
                        }
                    }
                },
                {
                    quoted: m
                }
            )

            await conn.relayMessage(
                m.chat,
                msg.message,
                {
                    messageId: msg.key.id
                }
            )

            return
        }

        // منشن مخفي للنص العادي
        const msg = generateWAMessageFromContent(
            m.chat,
            {
                extendedTextMessage: {
                    text: messageText,
                    contextInfo: {
                        mentionedJid
                    }
                }
            },
            {
                quoted: m
            }
        )

        await conn.relayMessage(
            m.chat,
            msg.message,
            {
                messageId: msg.key.id
            }
        )

    } catch (e) {

        console.error('❌ ARTHUR BOT HIDETAG ERROR:', e)

        await m.reply(
            '❌ حصل خطأ أثناء تنفيذ أمر المخفي.'
        )
    }
}

handler.help = ['مخفي']
handler.tags = ['group']

handler.command = /^(مخفي|hidetag|notificar)$/i

handler.group = true
handler.admin = true

export default handler