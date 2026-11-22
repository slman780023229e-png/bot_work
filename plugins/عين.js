// plugins/game-eye.js
// 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - لعبة تخمين الشخصية من العين 👁️

import { theme } from '../core/theme.js';
import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
import fetch from "node-fetch";

const timeout = 60000;
const reward = 500;

let handler = async (m, { conn, command }) => {

  conn.obito = conn.obito || {};
  const id = m.chat;

  // 🎯 الرد على الأزرار
  if (command.startsWith("مجوب_")) {

    let obito = conn.obito[id];
    if (!obito) {
      await m.react("⏳");
      return conn.reply(m.chat, theme.build([
        { type: 'title', text: '⚠️ تـنـبـيـه' },
        { type: 'subtitle', text: 'لا توجد لعبة نشطة حالياً' }
      ]), m);
    }

    let selectedIndex = parseInt(command.split("_")[1]);

    if (isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > 4) {
      await m.react("❌");
      return conn.reply(m.chat, theme.build([
        { type: 'title', text: 'خـطـأ' },
        { type: 'subtitle', text: 'اختيار غير صالح' }
      ]), m);
    }

    let selectedAnswer = obito.options[selectedIndex - 1];
    let isCorrect = obito.correctAnswer === selectedAnswer;

    if (isCorrect) {

      await m.react("✅");

      if (!global.db.data.users[m.sender].points) {
        global.db.data.users[m.sender].points = 0;
      }
      global.db.data.users[m.sender].points += reward;

      await conn.reply(m.chat, theme.build([
        { type: 'title', text: '✅ إجـابـة صـحـيـحـة' },
        { type: 'subtitle', text: `🎉 مبروك! +${reward} نقطة` },
        { type: 'divider' },
        { type: 'info', label: 'الإجابة', value: obito.correctAnswer },
        { type: 'info', label: 'نقاطك', value: `${global.db.data.users[m.sender].points} نقطة` }
      ]), m);

      clearTimeout(obito.timer);
      delete conn.obito[id];

    } else {

      obito.attempts -= 1;

      if (obito.attempts > 0) {

        await m.react("❌");

        await conn.reply(m.chat, theme.build([
          { type: 'title', text: '❌ إجـابـة خـاطـئـة' },
          { type: 'subtitle', text: `المحاولات المتبقية: ${obito.attempts}` },
          { type: 'divider' },
          { type: 'line', text: 'حاول مرة أخرى' }
        ]), m);

      } else {

        await m.react("❌");

        await conn.reply(m.chat, theme.build([
          { type: 'title', text: '❌ انـتـهـت الـمـحـاولات' },
          { type: 'subtitle', text: `الإجابة الصحيحة هي: ${obito.correctAnswer}` }
        ]), m);

        clearTimeout(obito.timer);
        delete conn.obito[id];
      }
    }

    return;
  }

  // 🎯 بدء اللعبة
  try {

    if (conn.obito[id]) {
      await m.react("⏳");
      return conn.reply(m.chat, theme.build([
        { type: 'title', text: '⚠️ تـنـبـيـه' },
        { type: 'subtitle', text: 'لديك لعبة نشطة بالفعل' }
      ]), m);
    }

    const response = await fetch(
      "https://raw.githubusercontent.com/DK3MK/worker-bot/main/eye.json"
    );

    const data = await response.json();

    if (!data.length) throw new Error("No Data");

    const item = data[Math.floor(Math.random() * data.length)];
    const { img, name } = item;

    let options = [name];

    while (options.length < 4) {
      let random = data[Math.floor(Math.random() * data.length)].name;
      if (!options.includes(random)) options.push(random);
    }

    options.sort(() => Math.random() - 0.5);

    const media = await prepareWAMessageMedia(
      { image: { url: img } },
      { upload: conn.waUploadToServer }
    );

    // بناء الأزرار
    const buttons = options.map((option, index) => ({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: `${theme.blood} ${option}`,
        id: `.مجوب_${index + 1}`
      })
    }));

    const interactiveMessage = {
      body: { text: `> ${theme.divider}
>
> 🜲⃝🪖 *لـعـبـة "تـخـمـيـن الـشـخـصـيـة"* 👁️
> 𖤐⃝🪄 *من صاحب هذه العين؟*
>
> ${theme.smallDivider}
>
> 👁️⃝🪄 *الـوقـت:* 60 ثانية
> ☣️⃝🪭 *الـجـائـزة:* ${reward} نقطة
> 𖤐⃝✨ *الـمـحـاولات:* 2
>
> ${theme.endDivider}` },
      footer: { text: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓' },
      header: {
        hasMediaAttachment: true,
        subtitle: '👁️ اختر الشخصية الصحيحة',
        imageMessage: media.imageMessage,
      },
      nativeFlowMessage: {
        buttons: buttons,
        messageParamsJson: JSON.stringify({
          bottom_sheet: {
            list_title: "👁️ اختر اسم الشخصية",
            button_title: "▻ الخيارات ⚡"
          }
        })
      }
    };

    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage)
          }
        }
      },
      { userJid: conn.user.jid, quoted: m }
    );

    await m.react("👁️");

    await conn.relayMessage(m.chat, msg.message, {
      messageId: msg.key.id
    });

    conn.obito[id] = {
      correctAnswer: name,
      options: options,
      attempts: 2,
      timer: setTimeout(async () => {
        if (conn.obito[id]) {
          await conn.reply(m.chat, theme.build([
            { type: 'title', text: '⏰ انـتـهـى الـوقـت' },
            { type: 'subtitle', text: `الإجابة الصحيحة هي: ${name}` }
          ]), m);
          delete conn.obito[id];
        }
      }, timeout)
    };

  } catch (e) {
    console.error(e);
    await m.react("❌");
    conn.reply(m.chat, theme.build([
      { type: 'title', text: 'خـطـأ' },
      { type: 'subtitle', text: 'حدث خطأ أثناء بدء اللعبة' }
    ]), m);
  }
};

handler.help = ["عين"];
handler.tags = ["game"];
handler.command = /^(عين|مجوب_\d+)$/i;

export default handler;