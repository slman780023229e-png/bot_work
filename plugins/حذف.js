// plugins/حذف.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓- أمر الحذف ✧

const handler = async (m, { conn, isAdmin, isROwner }) => {

    // لازم تعمل رد على رسالة
    if (!m.quoted) {
        return m.reply(
            '❌ اعمل رد على الرسالة اللي عايز تحذفها واكتب .حذف'
        )
    }

    // المشرفين فقط
    if (m.isGroup && !isAdmin && !isROwner) {
        return m.reply('❌ الأمر ده للمشرفين فقط.')
    }

    try {

        const q = m.quoted

        /*
         * بعض أنظمة البوت تخزن بيانات الرسالة
         * في أماكن مختلفة.
         */

        const id =
            q.id ||
            q.key?.id ||
            q.message?.key?.id ||
            q.stanzaId

        const participant =
            q.sender ||
            q.participant ||
            q.key?.participant

        const fromMe =
            q.fromMe ??
            q.key?.fromMe ??
            false

        if (!id) {

            console.log(
                'DELETE DEBUG:',
                {
                    id: q.id,
                    key: q.key,
                    stanzaId: q.stanzaId,
                    sender: q.sender,
                    participant: q.participant
                }
            )

            return m.reply(
                '❌ نظام البوت مش قادر يقرأ ID الرسالة اللي عملت عليها رد.'
            )
        }

        const deleteKey = {
            remoteJid: m.chat,
            fromMe: fromMe,
            id: id
        }

        // للجروبات
        if (m.isGroup && participant) {
            deleteKey.participant = participant
        }

        console.log(
            '[SPARKIL DELETE]',
            deleteKey
        )

        await conn.sendMessage(
            m.chat,
            {
                delete: deleteKey
            }
        )

    } catch (error) {

        console.error(
            '[SPARKIL DELETE ERROR]',
            error
        )

        await m.reply(
            '❌ فشل حذف الرسالة. تأكد أن البوت مشرف.'
        )
    }
}

handler.command =
    /^(حذف|مسح|امسح|delete|del)$/i

handler.help = [
    'حذف',
    'مسح',
    'امسح'
]

handler.tags = [
    'group'
]

handler.group = true
handler.botAdmin = true

export default handler