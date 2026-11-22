// plugins/اوامر.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - القائمة الرئيسية ✧

import {
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    proto
} from '@whiskeysockets/baileys'

import fetch from 'node-fetch'

const handler = async (m, { conn }) => {

    try {

        // 🪄 تفاعل عند كتابة "اوامر"
        await m.react('🪄')

        const user = await conn.getName(m.sender)

        const imageUrl =
            'https://files.catbox.moe/fgcxgo.jpg'

        // =====================================
        // تحميل الصورة
        // =====================================

        const imageRes = await fetch(imageUrl)

        if (!imageRes.ok) {
            throw new Error('فشل تحميل صورة القائمة')
        }

        const imageBuffer =
            Buffer.from(
                await imageRes.arrayBuffer()
            )

        const media =
            await prepareWAMessageMedia(
                {
                    image: imageBuffer
                },
                {
                    upload: conn.waUploadToServer
                }
            )

        // =====================================
        // النص
        // =====================================

        const text =
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🎀 أهلاً بك يا ${user}
*╰━━━━━━━━━━━━━━╯*

*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* ✦ نحنُ الأفضل حينَ نصنعُ المستحيل
*┃* ✦ نرتّبُ الفوضى ونحوّلها إلى جمال
*┃* ✦ كل ما تحتاجه بين يديك
*┃*
*┃* ❝ إن كان الإبداعُ طريقاً...
*┃*      فـ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 هو الطريق ❞
*┃* تم التطوير من قبل 👑𝐊𝐀𝐍𝐄𝐊𝐈
*┃* 🌺 اختر ما تريد من الأسفل
*╰━━━━━━━━━━━━━━╯*

*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🎀 استمتع بالخدمات
*┃* ✨ واستكشف عالم 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓
*╰━━━━━━━━━━━━━━╯*`

        // =====================================
        // الرسالة التفاعلية
        // =====================================

        const interactiveMessage = {

            body: {
                text: text
            },

            footer: {
                text: '✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 | الأفضل دائماً ✦'
            },

            header: {
                title: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓',
                hasMediaAttachment: true,
                imageMessage: media.imageMessage
            },

            nativeFlowMessage: {

                buttons: [

                    // =================================
                    // 📂 الأقسام
                    // =================================

                    {
                        name: 'single_select',

                        buttonParamsJson:
                            JSON.stringify({

                                title: '📂 قائمة الأوامر',

                                sections: [

                                    {
                                        title:
                                            '╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮',

                                        rows: [

                                            {
                                                header: '👑',
                                                title:
                                                    'الجروبات والمشرفين',
                                                description:
                                                    'إدارة وحماية الجروبات',
                                                id: '.ق1'
                                            },

                                            {
                                                header: '📥',
                                                title:
                                                    'التحميلات',
                                                description:
                                                    'تحميل الفيديوهات والصور والملفات',
                                                id: '.ق2'
                                            },

                                            {
                                                header: '🎭',
                                                title:
                                                    'الترفيه والتسلية',
                                                description:
                                                    'أوامر المرح والتفاعل',
                                                id: '.ق3'
                                            },

                                            {
                                                header: '🎮',
                                                title:
                                                    'الألعاب',
                                                description:
                                                    'ألعاب وتحديات',
                                                id: '.ق4'
                                            },

                                            {
                                                header: '👑',
                                                title:
                                                    'النقابات',
                                                description:
                                                    'أوامر النقابات وإدارة النقابة',
                                                id: '.ق5'
                                            },

                                            {
                                                header: '🛠️',
                                                title:
                                                    'الأدوات',
                                                description:
                                                    'أدوات ومميزات البوت',
                                                id: '.ق6'
                                            },

                                            {
                                                header: '🎬',
                                                title:
                                                    'الإيديت والأغاني',
                                                description:
                                                    'الإيديت والموسيقى والأغاني',
                                                id: '.ق7'
                                            }

                                        ]
                                    }

                                ]

                            })
                    },

                    // =================================
                    // 👑 المطور
                    // =================================

                    {
                        name: 'cta_url',

                        buttonParamsJson:
                            JSON.stringify({

                                display_text:
                                    '👑 المطور',

                                url:
                                    `https://wa.me/${ownerNumber}`,

                                merchant_url:
                                    `https://wa.me/${ownerNumber}`

                            })
                    },

                    // =================================
                    // 📢 القناة
                    // =================================

                    {
                        name: 'cta_url',

                        buttonParamsJson:
                            JSON.stringify({

                                display_text:
                                    '📢 القناة',

                                url:
                                    channelUrl,

                                merchant_url:
                                    channelUrl

                            })
                    },

                    // =================================
                    // 🤖 تنصيب
                    // =================================

                    {
                        name: 'quick_reply',

                        buttonParamsJson:
                            JSON.stringify({

                                display_text:
                                    '🤖 تنصيب البوت',

                                id:
                                    '.تنصيب'

                            })
                    }

                ],

                messageParamsJson: ''
            }
        }

        // =====================================
        // إنشاء الرسالة
        // =====================================

        const msg =
            generateWAMessageFromContent(
                m.chat,

                {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage:
                                proto.Message.InteractiveMessage
                                    .fromObject(
                                        interactiveMessage
                                    )
                        }
                    }
                },

                {
                    userJid: conn.user.jid,
                    quoted: m
                }
            )

        // =====================================
        // إرسال
        // =====================================

        await conn.relayMessage(
            m.chat,
            msg.message,
            {
                messageId: msg.key.id
            }
        )

    } catch (e) {

        console.error(
            '❌ ARTHUR BOT MENU ERROR:',
            e
        )

        await m.reply(
            '❌ حصل خطأ أثناء فتح قائمة 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓.'
        )
    }
}

handler.help = ['اوامر']

handler.tags = ['main']

handler.command =
    /^(اوامر)$/i

export default handler