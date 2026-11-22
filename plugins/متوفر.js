// plugins/motawer.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - التحقق من توفر اللقب 👥

let handler = async (m, { conn, text }) => {
    try {
        const groupId = m.chat;
        const name = text?.trim();

        if (!name) {
            return m.reply('> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "وحدة التحقق من اللقب"*\n> \n> ✍️ *يرجى إدخال اللقب*\n> 📌 *مثال:* .متوفر الأسطورة');
        }

        // التأكد من وجود قاعدة البيانات
        if (!global.db?.data?.users) {
            return m.reply('> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "خطأ"*\n> \n> 🔮 قاعدة البيانات غير جاهزة');
        }

        const users = global.db.data.users;
        let taken = false;
        let owner = null;

        for (let key in users) {
            const user = users[key];
            if (user.groups?.[groupId]?.name?.toLowerCase() === name.toLowerCase()) {
                taken = true;
                owner = key;
                break;
            }
        }

        if (taken) {
            let ownerName = owner.split('@')[0];
            try {
                const nameFromConn = await conn.getName(owner);
                if (nameFromConn) ownerName = nameFromConn;
            } catch(e) {}
            
            await conn.sendMessage(m.chat, { text: `> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "اللقب غير متاح"*\n> \n> ❌ *اللقب* "${name}" محجوز بالفعل\n> 👤 *بواسطة:* ${ownerName}` }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { text: `> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "اللقب متاح"*\n> \n> ✅ *اللقب* "${name}" متاح للحجز\n> 💡 *للحجز:* .حجز_لقب ${name}` }, { quoted: m });
        }

    } catch (err) {
        console.error('[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓-Motawer]', err);
        await m.reply(`> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "خطأ"*\n> \n> 🔮 ${err.message || err}`);
    }
};

handler.help = ['متوفر <لقب>'];
handler.tags = ['unions'];
handler.command = /^(متوفر|available|check)$/i;
handler.group = true;

export default handler;