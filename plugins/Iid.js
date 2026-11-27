// plugins/mylid.js
let handler = async (m, { conn }) => {
    let sender = m.sender;
    let imageUrl = 'https://files.catbox.moe/gf3tkn.jpg';
    
    await conn.sendButton(m.chat, sender, '', imageUrl, null, [['📋 نسخ LID', sender]], null, null, m);
};

handler.command = /^lid$/i;
handler.group = true;
export default handler;