// plugins/lakabe.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight Unit No.2 Type B - عرض لقب عضو 👥

let handler = async (m, { conn, text }) => {
    try {
        let mentionedJid;

        // تحديد العضو المستهدف
        if (m.quoted && m.quoted.sender) {
            mentionedJid = await conn.convertLidToRealJid(m.quoted.sender, m.chat);
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            mentionedJid = await conn.convertLidToRealJid(m.mentionedJid[0], m.chat);
        } else if (text) {
            const number = text.replace(/[^0-9]/g, '');
            if (number) {
                mentionedJid = number + '@s.whatsapp.net';
            }
        }

        if (!mentionedJid) {
            return m.reply('> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "وحدة عرض اللقب"*\n> \n> 👥 *الاستخدام:* .لقبه @العضو\n> 📌 أو رد على رسالة العضو');
        }

        // التأكد من وجود قاعدة البيانات
        if (!global.db?.data?.users) {
            return m.reply('> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "خطأ"*\n> \n> 🔮 قاعدة البيانات غير جاهزة');
        }

        const users = global.db.data.users;
        const groupId = m.chat;
        const user = users[mentionedJid];

        if (!user || !user.groups || !user.groups[groupId]?.name) {
            let memberName = mentionedJid.split('@')[0];
            try {
                const nameFromConn = await conn.getName(mentionedJid);
                if (nameFromConn) memberName = nameFromConn;
            } catch(e) {}
            
            return m.reply(`> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "لا يوجد لقب"*\n> \n> 👤 ${memberName} لا يملك لقباً مسجلاً في هذه المجموعة`);
        }

        const nickname = user.groups[groupId].name;
        
        let memberName = mentionedJid.split('@')[0];
        try {
            const nameFromConn = await conn.getName(mentionedJid);
            if (nameFromConn) memberName = nameFromConn;
        } catch(e) {}

        let msg = `> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "لقب العضو"*\n> \n> 👤 *العضو:* ${memberName}\n> 🏷️ *اللقب:* ${nickname}`;

        await conn.sendMessage(m.chat, { text: msg, mentions: [mentionedJid] }, { quoted: m });

    } catch (err) {
        console.error('[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓-Lakabe]', err);
        await m.reply(`> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "خطأ"*\n> \n> 🔮 ${err.message || err}`);
    }
};

handler.help = ['لقبه'];
handler.tags = ['unions'];
handler.command = /^(لقبه|nickname|lakabe)$/i;
handler.group = true;

export default handler;