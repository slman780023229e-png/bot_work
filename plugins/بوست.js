// plugins/post.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 𝐁𝐎𝐓 - نظام البوست 📢

import {
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    proto
} from '@whiskeysockets/baileys'

// 🎨 الألوان
const COLORS = [
    0xFFF44336,
    0xFFE91E63,
    0xFF9C27B0,
    0xFF673AB7,
    0xFF3F51B5,
    0xFF2196F3,
    0xFF03A9F4,
    0xFF00BCD4,
    0xFF009688,
    0xFF4CAF50,
    0xFF8BC34A,
    0xFFCDDC39,
    0xFFFFEB3B,
    0xFFFFC107,
    0xFFFF9800,
    0xFFFF5722
]

const handler = async (m, { conn, text }) => {

    try {

        // ==========================================
        // الرسالة التي تم الرد عليها
        // ==========================================

        const q = m.quoted

        const mime = q
            ? ((q.msg || q).mimetype || '')
            : ''

        const isImage =
            mime.includes('image')

        const isVideo =
            mime.includes('video')

        const isAudio =
            mime.includes('audio')

        const isVoice =
            isAudio &&
            (
                mime.includes('ogg') ||
                q?.msg?.audioMessage?.ptt
            )

        // ==========================================
        // الإعدادات الافتراضية
        // ==========================================

        let audienceType = 1

        let listEmoji = '🛸'

        let listName = '𝐒𝐏𝐀𝐑𝐊𝐈𝐋'

        let postText = ''

        let colorIndex = -1

        let remainingText =
            text
                ? text.trim()
                : ''


        // ==========================================
        // قراءة الأمر
        // ==========================================

        if (remainingText) {

            const parts =
                remainingText.split(/\s+/)

            const firstWord =
                parts[0]?.toLowerCase()


            // عام
            if (firstWord === 'عام') {

                audienceType = 0
                listEmoji = ''
                listName = ''

                remainingText =
                    parts.slice(1).join(' ')
            }


            // خاص
            else if (
                firstWord === 'خاص' ||
                firstWord === 'اقارب' ||
                firstWord === 'اصدقاء'
            ) {

                audienceType = 2

                listEmoji = '⭐'
                listName = 'الأقارب'

                remainingText =
                    parts.slice(1).join(' ')
            }


            // قائمة مخصصة
            else if (
                firstWord === 'قائمة' &&
                parts.length >= 3
            ) {

                audienceType = 1

                listEmoji = parts[1]

                listName = parts[2]

                remainingText =
                    parts.slice(3).join(' ')
            }


            // ======================================
            // اللون
            // ======================================

            if (remainingText) {

                const colorParts =
                    remainingText.split(/\s+/)

                const potentialColor =
                    parseInt(colorParts[0])

                if (
                    !isNaN(potentialColor) &&
                    potentialColor >= 0 &&
                    potentialColor <= 15
                ) {

                    colorIndex =
                        potentialColor

                    remainingText =
                        colorParts
                            .slice(1)
                            .join(' ')
                }
            }

            postText = remainingText
        }


        // ==========================================
        // اختيار اللون
        // ==========================================

        const finalColor =
            colorIndex >= 0 &&
            colorIndex < COLORS.length

                ? COLORS[colorIndex]

                : COLORS[
                    Math.floor(
                        Math.random() *
                        COLORS.length
                    )
                ]


        // ==========================================
        // لا يوجد محتوى
        // ==========================================

        if (
            !postText &&
            !isImage &&
            !isVideo &&
            !isAudio &&
            !isVoice
        ) {

            return m.reply(
`╭━━〔 📢 𝐒𝐏𝐀𝐑𝐊𝐈𝐋 〕━━╮

🎨 *أمر البوست*

👥 *أنواع الجمهور:*

• عام
• خاص
• قائمة <إيموجي> <اسم>

🎨 *الألوان:*
0 - 15

📝 *أمثلة:*

.بوست عام 5 مرحبا

.بوست خاص 2 أهلاً

.بوست قائمة 💎 جواهر 12 مرحباً

📷 أو اعمل رد على صورة/فيديو واكتب:
.بوست

╰━━━━━━━━━━━━━━━━━━╯`
            )
        }


        // ==========================================
        // وسائط
        // ==========================================

        if (
            isImage ||
            isVideo ||
            isAudio ||
            isVoice
        ) {

            if (!q?.download) {
                return m.reply(
                    '❌ مقدرتش أحمل الوسائط.'
                )
            }

            const media =
                await q.download()

            let mediaType =
                isImage
                    ? 'image'
                    : isVideo
                        ? 'video'
                        : 'audio'


            let mediaOptions = {
                [mediaType]: media
            }


            // الصوت
            if (isVoice) {

                mediaOptions = {
                    audio: media,
                    mimetype:
                        'audio/ogg; codecs=opus',
                    ptt: false
                }
            }


            const prepared =
                await prepareWAMessageMedia(
                    mediaOptions,
                    {
                        upload:
                            conn.waUploadToServer
                    }
                )


            const messageKey =
                isImage
                    ? 'imageMessage'
                    : isVideo
                        ? 'videoMessage'
                        : 'audioMessage'


            const contentMsg = {

                [messageKey]: {

                    ...prepared[messageKey],

                    caption:
                        postText || '',

                    contextInfo: {

                        isGroupStatus: true,

                        pairedMediaType:
                            'NOT_PAIRED_MEDIA',

                        statusAudienceMetadata: {

                            audienceType,

                            ...(listEmoji && {
                                listEmoji
                            }),

                            ...(listName && {
                                listName
                            })
                        }
                    }
                }
            }


            const webMsg =
                proto.Message.fromObject(
                    contentMsg
                )


            const waMsg =
                generateWAMessageFromContent(
                    m.chat,
                    webMsg,
                    {
                        userJid:
                            conn.user.jid,

                        quoted: m
                    }
                )


            await conn.relayMessage(
                m.chat,
                waMsg.message,
                {
                    messageId:
                        waMsg.key.id
                }
            )


            await m.react('✅')

            return
        }


        // ==========================================
        // بوست نصي
        // ==========================================

        const groupMetadata =
            await conn.groupMetadata(
                m.chat
            )


        const statusJidList =
            groupMetadata.participants
                .map(p => p.id)


        const messageSecret =
            Buffer.from(
                Array.from(
                    { length: 32 },
                    () =>
                        Math.floor(
                            Math.random() * 256
                        )
                )
            )


        await conn.relayMessage(
            m.chat,
            {

                statusJidList,

                messageContextInfo: {
                    messageSecret
                },

                groupStatusMessageV2: {

                    message: {

                        extendedTextMessage: {

                            text:
`𝐒𝐏𝐀𝐑𝐊𝐈𝐋 𝐁𝐎𝐓

${postText}`,

                            thumbnailUrl:
                                'https://file.garden/aauvg01sjleV_ic1/c2a3bfd6e9fd1db2f5358f8feec9261f.jpg',

                            textArgb:
                                4294967040,

                            backgroundArgb:
                                finalColor,

                            font: 5,

                            previewType: 0,

                            contextInfo: {

                                statusAttributions: [
                                    {
                                        type: 10
                                    }
                                ],

                                featureEligibilities: {
                                    canBeReshared: true,
                                    canReceiveMultiReact: true
                                },

                                statusSourceType: 4,

                                statusAudienceMetadata: {

                                    audienceType,

                                    ...(listEmoji && {
                                        listEmoji
                                    }),

                                    ...(listName && {
                                        listName
                                    })
                                }
                            },

                            inviteLinkGroupTypeV2: 0
                        }
                    }
                }
            },

            {}
        )


        await m.react('✅')


    } catch (error) {

        console.error(
            '❌ SPARKIL بوست:',
            error
        )

        try {
            await m.react('❌')
        } catch {}

        return m.reply(
            '❌ حصل خطأ أثناء إنشاء البوست.\n\n' +
            error.message
        )
    }
}


// ==========================================
// إعدادات الأمر
// ==========================================

handler.help = [
    'بوست'
]

handler.tags = [
    'group'
]

handler.command =
    /^(بوست|post)$/i

handler.group = true

// أي عضو يقدر يستخدمه
handler.admin = false

export default handler