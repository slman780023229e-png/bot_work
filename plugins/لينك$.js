// plugins/لينك.js

const handler = async (m, { conn }) => {

    if (!m.isGroup)
        return m.reply('❌ الأمر ده للجروبات فقط.')

    try {

        const metadata = await conn.groupMetadata(m.chat)
        const groupName = metadata.subject || 'الجروب'

        // جلب رابط الجروب
        let code

        try {
            code = await conn.groupInviteCode(m.chat)
        } catch (e) {
            console.error('groupInviteCode:', e)
            return m.reply(
                '❌ مقدرتش أجيب رابط الجروب.\n' +
                'تأكد إن البوت عنده صلاحية الحصول على رابط الدعوة.'
            )
        }

        if (!code)
            return m.reply('❌ رابط الجروب غير متاح حالياً.')

        const groupLink = `https://chat.whatsapp.com/${code}`

        const imageUrl =
            'https://files.catbox.moe/fnge8r.jpg'

        // الشخص اللي استخدم الأمر
        const user = m.sender
        const userMention = '@' + user.split('@')[0]

        const caption =
`*╭━━『★ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ★』━━°⃟✨*
> تفضل لينك الجروب الي طلبتو ${userMention}

> *اسم الجروب:* ${groupName}

🔗 *رابط الجروب:*
${groupLink}

⁩  ╰✨━━━━━━━━━━°⃟✨
*╭━━━━━━━━━━°⃟🎀`

        await conn.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: caption,
            mentions: [user]
        })

    } catch (error) {

        console.error('❌ خطأ أمر لينك:', error)

        await m.reply(
            '❌ حصل خطأ أثناء جلب رابط الجروب.'
        )
    }
}

handler.help = ['لينك']
handler.tags = ['group']
handler.command = /^لينك$/i
handler.group = true

export default handler