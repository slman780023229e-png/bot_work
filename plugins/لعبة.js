// plugins/game-rps-simple.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight Unit No.2 Type B - لعبة حجر/ورق/مقص 🪨📄✂️

let cooldowns = {};

let handler = async (m, { conn, text, usedPrefix, command }) => {

  await conn.sendMessage(m.chat, { react: { text: '🎮', key: m.key } });

  if (!text) {
    return conn.reply(m.chat, `> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "لعبة حجر/ورق/مقص"*\n> \n> 🪨 *اختر أحد الخيارات:*\n> 📌 ${usedPrefix}${command} حجر\n> 📌 ${usedPrefix}${command} ورق\n> 📌 ${usedPrefix}${command} مقص`, m);
  }

  if (cooldowns[m.sender] && cooldowns[m.sender] > Date.now()) {
    let remainingTime = Math.ceil((cooldowns[m.sender] - Date.now()) / 1000);
    return conn.reply(m.chat, `> ⏰ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "انتظر"*\n> \n> 🔮 انتظر ${remainingTime} ثانية`, m);
  }

  let botChoice = Math.random();
  if (botChoice < 0.34) botChoice = 'حجر';
  else if (botChoice > 0.34 && botChoice < 0.67) botChoice = 'مقص';
  else botChoice = 'ورق';

  let userChoice = text.toLowerCase();
  if (!['حجر', 'ورق', 'مقص'].includes(userChoice)) {
    return conn.reply(m.chat, '> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "اختيار غير صالح"*\n> \n> 🔮 اختر: حجر، ورق، أو مقص', m);
  }

  let result = '';
  if (userChoice === botChoice) result = 'تعادل 🤝';
  else if (
    (userChoice === 'حجر' && botChoice === 'مقص') ||
    (userChoice === 'مقص' && botChoice === 'ورق') ||
    (userChoice === 'ورق' && botChoice === 'حجر')
  ) result = 'فوز 🎉';
  else result = 'خسارة 😢';

  let title = result === 'فوز 🎉' ? '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "فزت!"' : (result === 'خسارة 😢' ? '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "خسرت!"' : '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "تعادل!"');

  conn.reply(m.chat, `> ❄️ *${title}*\n> \n> 🪨 *أنت:* ${userChoice}\n> 🤖 *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓:* ${botChoice}\n> \n> ${result}`, m);

  cooldowns[m.sender] = Date.now() + 5000;
};

handler.command = /^(لعبة|حجر|ورق|مقص|rps)$/i;
handler.tags = ['game'];

export default handler;