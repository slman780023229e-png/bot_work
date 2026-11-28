// plugins/المطور.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Developer 🔘

import {
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    proto
} from '@whiskeysockets/baileys'

import fetch from 'node-fetch'

let handler = async (m, { conn }) => {

    try {

        // =========================
        // ⚡ تفاعل برق
        // =========================

        try {
            await m.react('⚡')
        } catch {}

        // =========================
        // 👤 اسم المستخدم
        // =========================

        let username = 'صديقي'

        try {
            username = await conn.getName(m.sender)
        } catch {
            username = 'صديقي'
        }

        const mention =
            '@' + m.sender.split('@')[0]

        // =========================
        // 📞 المطور الأول - آرثر
        // =========================

        await conn.sendMessage(
            m.chat,
            {
                contacts: {
                    displayName: '𝐀𝐑𝐓𝐇𝐔𝐑 ⚡',

                    contacts: [
                        {
                            displayName: '𝐀𝐑𝐓𝐇𝐔𝐑 ⚡',

                            vcard:
`BEGIN:VCARD
VERSION:3.0
FN:𝐀𝐑𝐓𝐇𝐔𝐑 ⚡
TEL;type=CELL;type=VOICE;waid=967783028397:+967783028397
END:VCARD`
                        }
                    ]
                }
            },
            { quoted: m }
        )

        // =========================
        // 🎥 الفيديو
        // =========================

        await conn.sendMessage(
            m.chat,
            {
                video: {
                    url: 'https://files.catbox.moe/samb4m.mp4'
                },
                mimetype: 'video/mp4',
                caption: '*𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡*'
            },
            { quoted: m }
        )

        // =========================
        // 🖼️ الصورة الجديدة
        // =========================

        const imageUrl =
            'https://files.catbox.moe/648htm.jpg'

        const res =
            await fetch(imageUrl)

        if (!res.ok) {
            throw new Error(
                `فشل تحميل الصورة: ${res.status}`
            )
        }

        const buffer =
            Buffer.from(
                await res.arrayBuffer()
            )

        const media =
            await prepareWAMessageMedia(
                {
                    image: buffer
                },
                {
                    upload:
                        conn.waUploadToServer
                }
            )

        // =========================
        // 📝 الكلام
        // =========================

        const text =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚡ ╎ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓*
*┃* ⚡ ╎ *مرحباً يا ${username}* 👋
*┃*
*┃* 👤 ╎ ${mention}
*┃*
*┃* 🪄 ╎ *مطور بوت 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓*
*┃*
*┃* 📜 ╎ *يمكنك الاستفسار عن:*
*┃* 🔗 ╎ *اي كود*
*┃* 🚫 ╎ *اي بوت*
*┃* 👤 ╎ *اي سيرفر*
*┃*
*┃* 📞 ╎ *+967783028397*
*◇❐ ═━━╾⚡╼━━═ ❐◇*`

        // =========================
        // 🔘 الرسالة + الأزرار
        // =========================

        const interactive =
            proto.Message.InteractiveMessage.fromObject({

                body:
                    proto.Message.InteractiveMessage.Body.fromObject({
                        text
                    }),

                footer:
                    proto.Message.InteractiveMessage.Footer.fromObject({
                        text:
                            '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡'
                    }),

                header:
                    proto.Message.InteractiveMessage.Header.fromObject({
                        title: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓',
                        hasMediaAttachment: true,
                        imageMessage:
                            media.imageMessage
                    }),

                nativeFlowMessage:
                    proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({

                        buttons: [

                            {
                                name: 'quick_reply',

                                buttonParamsJson:
                                    JSON.stringify({
                                        display_text:
                                            '📜 الاوامر',

                                        id:
                                            '.اوامر'
                                    })
                            }

                        ]

                    })

            })

        // =========================
        // 📤 إنشاء الرسالة
        // =========================

        const msg =
            generateWAMessageFromContent(
                m.chat,
                {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },

                            interactiveMessage:
                                interactive
                        }
                    }
                },
                {
                    quoted: m
                }
            )

        // =========================
        // 🚀 إرسال الرسالة
        // =========================

        await conn.relayMessage(
            m.chat,
            msg.message,
            {
                messageId:
                    msg.key.id
            }
        )

        // =========================
        // 📞 المطور الثاني - سلمان كما هو
        // =========================

        await conn.sendMessage(
            m.chat,
            {
                contacts: {
                    displayName:
                        'سلمان✨',

                    contacts: [
                        {
                            displayName:
                                'سلمان✨',

                            vcard:
`BEGIN:VCARD
VERSION:3.0
FN:سلمان✨
TEL;type=CELL;type=VOICE;waid=967780023229:+967780023229
END:VCARD`
                        }
                    ]
                }
            },
            { quoted: m }
        )

    } catch (error) {

        console.error(
            '❌ ARTHUR DEVELOPER ERROR:',
            error
        )

        try {

            await m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ❌ ╎ *حصل خطأ أثناء تنفيذ أمر المطور*
*┃*
*┃* ⚡ ╎ ${error?.message || 'خطأ غير معروف'}
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
            )

        } catch {}

    }
}

// =========================
// ⚙️ الأوامر
// =========================

handler.help = [
    'مطور',
    'المطور',
    'owner'
]

handler.tags = [
    'main'
]

handler.command =
    /^(مطور|المطور|owner)$/i

export default handler