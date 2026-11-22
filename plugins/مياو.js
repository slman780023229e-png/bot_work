// plugins/مياو.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - لعنة مياو 🐾

const cursedUsers = new Map()

const getJid = (jid = '') => {
    if (!jid) return ''
    return jid.split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

let handler = async (m, { conn, text, isAdmin, isOwner }) => {

    try {

        // لازم جروب
        if (!m.isGroup) return

        const sender = getJid(m.sender)

        /*
        |--------------------------------------------------------------------------
        | فك اللعنة
        |--------------------------------------------------------------------------
        */

        if (
            typeof m.text === 'string' &&
            m.text.trim().toLowerCase() === 'مياو' &&
            cursedUsers.has(m.chat)
        ) {

            const cursed = cursedUsers.get(m.chat)

            if (getJid(m.sender) === getJid(cursed)) {

                cursedUsers.delete(m.chat)

                await m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🐾 〕━━━╮
┃
┃ 🐱 تم فك اللعنة!
┃
┃ ✦ @${m.sender.split('@')[0]}
┃ ✦ قلت مياو بنجاح 😽
┃
┃ 🎉 خلاص تقدر تتكلم براحتك
┃
╰━━━━━━━━━━━━━━╯`,
                    { mentions: [m.sender] }
                )

                return
            }
        }

        /*
        |--------------------------------------------------------------------------
        | لو الشخص ملعون → امسح رسالته
        |--------------------------------------------------------------------------
        */

        if (cursedUsers.has(m.chat)) {

            const cursed = cursedUsers.get(m.chat)

            if (getJid(m.sender) === getJid(cursed)) {

                // لو البوت مش أدمن مش هيقدر يمسح
                try {
                    await conn.sendMessage(
                        m.chat,
                        {
                            delete: m.key
                        }
                    )
                } catch (e) {
                    console.log('[مياو] فشل حذف الرسالة:', e.message)
                }

                return
            }
        }

        /*
        |--------------------------------------------------------------------------
        | أمر مياو
        |--------------------------------------------------------------------------
        */

        const commandText = typeof m.text === 'string'
            ? m.text.trim()
            : ''

        if (!/^\.?مياو(?:\s|$)/i.test(commandText)) return

        // تحديد الشخص
        let target = null

        // 1️⃣ منشن
        if (m.mentionedJid?.length) {

            target = m.mentionedJid[0]

        }

        // 2️⃣ رد على شخص
        else if (m.quoted?.sender) {

            target = m.quoted.sender

        }

        if (!target) {

            return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🐾 〕━━━╮
┃
┃ 🐱 استخدم الأمر كده:
┃
┃ ✦ .مياو @الشخص
┃
┃ أو اعمل Reply على رسالته:
┃ ✦ .مياو
┃
╰━━━━━━━━━━━━━━╯`
            )
        }

        target = getJid(target)

        // منع لعنة المطور/المشرفين
        if (target === getJid(conn.user?.id)) {
            return m.reply('😹 مش هقدر ألعن نفسي يا عم.')
        }

        if (target === sender) {
            return m.reply('🐱 إنت عايز تلعن نفسك ولا إيه؟ 😂')
        }

        /*
        |--------------------------------------------------------------------------
        | تسجيل اللعنة
        |--------------------------------------------------------------------------
        */

        cursedUsers.set(m.chat, target)

        await conn.sendMessage(
            m.chat,
            {
                text:
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🐾 〕━━━╮
┃
┃ 😼 تم تفعيل لعنة مياو!
┃
┃ 👤 الضحية:
┃ @${target.split('@')[0]}
┃
┃ 🐾 البوت هيحذف كل رسائلك
┃ ✦ لحد ما تقول: مياو
┃
┃ 🔓 قول «مياو» لفك اللعنة
┃
╰━━━━━━━━━━━━━━╯`,
                mentions: [target]
            },
            { quoted: m }
        )

    } catch (e) {
        console.error('[مياو ERROR]', e)
    }
}

handler.command = /^(مياو)$/i
handler.tags = ['fun']
handler.help = ['مياو @منشن']

export default handler