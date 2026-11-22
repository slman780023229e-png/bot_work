// plugins/chat-control.js

const handler = async (m, { conn, isAdmin }) => {
    // لازم يكون جروب
    if (!m.isGroup) {
        return m.reply('❌ الأمر ده للجروبات فقط.');
    }

    // لازم يكون أدمن
    if (!isAdmin) {
        return m.reply('❌ الأمر ده للأدمن فقط.');
    }

    // استخراج الأمر
    const text = m.text?.trim() || '';
    const args = text.split(/\s+/);

    // .شات فتح / .شات قفل
    const action = args[1];

    if (!action || !['فتح', 'قفل'].includes(action)) {
        return m.reply(
            `❌ الاستخدام الصحيح:\n\n` +
            `.شات فتح\n` +
            `.شات قفل`
        );
    }

    try {
        // فتح / قفل إرسال الرسائل
        if (action === 'قفل') {
            await conn.groupSettingUpdate(m.chat, 'announcement');

            await conn.sendMessage(m.chat, {
                text:
`*╭━━『★ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ★』 ━━°⃟✨*
> تم قفل الشات من قبل @${m.sender.split('@')[0]}
⁩  ╰✨━━━━━━━━━━°⃟✨`,
                mentions: [m.sender]
            });

        } else {
            await conn.groupSettingUpdate(m.chat, 'not_announcement');

            await conn.sendMessage(m.chat, {
                text:
`*╭━━『★ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ★』━━°⃟✨*
> تم فتح الشات من قبل @${m.sender.split('@')[0]}
⁩  ╰✨━━━━━━━━━━°⃟✨`,
                mentions: [m.sender]
            });
        }

    } catch (error) {
        console.error('Chat Control Error:', error);
        return m.reply('❌ حصل خطأ أثناء تغيير حالة الشات.');
    }
};

handler.help = ['شات فتح', 'شات قفل'];
handler.tags = ['group'];
handler.command = /^شات$/i;
handler.group = true;
handler.botAdmin = true;

export default handler;