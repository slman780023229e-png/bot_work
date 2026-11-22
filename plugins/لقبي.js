// plugins/lakabi.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight Unit No.2 Type B - عرض لقبي 👥

let handler = async (m, { conn }) => {
    try {
        const groupId = m.chat;
        
        // التأكد من وجود قاعدة البيانات
        if (!global.db?.data?.users) {
            return m.reply('> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "خطأ"*\n> \n> 🔮 قاعدة البيانات غير جاهزة');
        }
        
        const users = global.db.data.users;
        const user = users[m.sender];

        if (!user || !user.groups || !user.groups[groupId] || !user.groups[groupId].name) {
            return m.reply('> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "غير مسجل"*\n> \n> 🔮 أنت غير مسجل في هذه المجموعة\n> 📌 استخدم .حجز_لقب لتسجيل لقبك');
        }

        const nickname = user.groups[groupId].name;
        
        let msg = `> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "لقبك"*\n> \n> 🏷️ *اللقب:* ${nickname}\n> 👤 *الاسم:* ${m.pushName || m.sender.split('@')[0]}`;

        await conn.sendMessage(m.chat, { text: msg }, { quoted: m });

    } catch (err) {
        console.error('[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓-Lakabi]', err);
        await m.reply(`> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "خطأ"*\n> \n> 🔮 ${err.message || err}`);
    }
};

handler.help = ['لقبي'];
handler.tags = ['unions'];
handler.command = /^(لقبي|mynickname|nick)$/i;
handler.group = true;

export default handler;