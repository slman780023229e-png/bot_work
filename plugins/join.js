let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i

let handler = async (m, { conn, text, isOwner, isMods }) => {
  try {
    // التحقق من صلاحية المستخدم (فقط المطورين)
    if (!isOwner && !isMods) {
      return m.reply(`
╭━━━ ⚠️ ━━━╮
❌ هذا الأمر متاح فقط للمطورين!
📌 لا يمكن للمستخدمين العاديين استخدامه
╰━━━ ⚠️ ━━━╯
      `)
    }

    // استخراج الرابط من الرد أو النص
    let link = (m.quoted ? m.quoted.text : text) || text
    let [_, code] = link.match(linkRegex) || []

    if (!code) return m.reply(`
╭━━━ ⚠️ ━━━╮
❌ الرابط غير صحيح أو غير موجود!
📌 ضع رابط الجروب بشكل صحيح
✦ مثال:
*.انضم https://chat.whatsapp.com/××××××××*
╰━━━ ⚠️ ━━━╯
    `)

    // محاولة الانضمام إلى المجموعة
    try {
      let res = await conn.groupAcceptInvite(code)
      m.reply(`
╭━━━ ✅ ━━━╮
🎉 تم انضمام البوت بنجاح!
👑 البوت: بــوت 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓
⚡ استمتعوا بالبوت واحترموه
╰━━━ ✅ ━━━╯
      `)
    } catch (err) {
      console.error(err)
      m.reply(`
╭━━━ ❌ ━━━╮
❌ فشل الانضمام للجروب!
🔹 الأسباب المحتملة:
1️⃣ الرابط منتهي الصلاحية
2️⃣ البوت تم طرده مسبقًا
3️⃣ تجاوز البوت الحد الأقصى من المجموعات
4️⃣ المشكلة من واتساب
📌 تحقق من الرابط وحاول مرة أخرى
╰━━━ ❌ ━━━╯
      `)
    }

  } catch (e) {
    console.error(e)
    m.reply(`
╭━━━ ⚠️ ━━━╮
❌ حدث خطأ غير متوقع!
🔹 تأكد من الرابط وصلاحيات البوت
📌 حاول مرة أخرى لاحقًا
╰━━━ ⚠️ ━━━╯
    `)
  }
}

handler.help = ['تعالي [رابط الجروب]']
handler.tags = ['owner']
handler.command = /^join|تعالي$/i

// إعدادات إضافية للتأكيد على أن الأمر فقط للمالكين
handler.owner = true
handler.mods = false
handler.premium = false
handler.group = false
handler.private = false

export default handler