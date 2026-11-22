// plugins/الطلاق.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - أمر الطلاق 💔

const handler = async (m, { conn, groupMetadata }) => {
  try {
    if (!m.isGroup) {
      return m.reply('❌ الأمر ده للجروبات بس 😼')
    }

    if (!groupMetadata?.participants?.length) {
      return m.reply('❌ مش قادر أجيب أعضاء الجروب دلوقتي 😿')
    }

    const participants = groupMetadata.participants
      .map(v => v.id)
      .filter(Boolean)

    if (participants.length < 2) {
      return m.reply('❌ محتاج عضوين على الأقل 😼')
    }

    // اختيار شخصين عشوائيًا
    const a = participants[Math.floor(Math.random() * participants.length)]

    let b
    do {
      b = participants[Math.floor(Math.random() * participants.length)]
    } while (b === a)

    const toM = jid => '@' + jid.split('@')[0]

    const text = `
💔 *تم الطلاق رسميًا* 😂

${toM(a)} حررتك ياعم 😼

${toM(b)} أي خدمة روحي لأي واحد مز تاني 😽
`.trim()

    await conn.sendMessage(
      m.chat,
      {
        text,
        mentions: [a, b]
      },
      { quoted: m }
    )

  } catch (e) {
    console.error('خطأ في أمر الطلاق:', e)
    m.reply('❌ حصل خطأ وأنا بطلقهم 😂')
  }
}

handler.command = ['طلاق']
handler.group = true

export default handler