let handler = async (m, { conn, command, args, isROwner, isAdmin }) => {
  // 1. أمر التفعيل والتعطيل للمشرفين
  if (command === 'مانع_جهات' || command === 'مانع-جهات') {
    if (!isAdmin && !isROwner) {
      return conn.sendMessage(m.chat, { text: '⚠️ هذا الأمر للمشرفين فقط!' }, { quoted: m })
    }

    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    let chat = global.db.data.chats[m.chat]

    let status = args[0]?.toLowerCase()

    if (status === 'تفعيل' || status === 'on') {
      chat.antiContact = true
      return conn.sendMessage(m.chat, { text: '✅ تم تفعيل مانع جهات الاتصال (حذف + طرد).' }, { quoted: m })
    } else if (status === 'تعطيل' || status === 'off') {
      chat.antiContact = false
      return conn.sendMessage(m.chat, { text: '❌ تم تعطيل مانع جهات الاتصال.' }, { quoted: m })
    } else {
      return conn.sendMessage(m.chat, { 
        text: `*طريقة الاستخدام:*\n\n• \`.مانع_جهات تفعيل\`\n• \`.مانع_جهات تعطيل\`` 
      }, { quoted: m })
    }
  }

  // 2. تطبيق الأفعال (Delete + Kick) عند إرسال جهة اتصال
  let chat = global.db?.data?.chats?.[m.chat]
  
  if (chat?.antiContact && (m.mtype === 'contactMessage' || m.mtype === 'contactsArrayMessage')) {
    // تتخطي الأدمين حتى لا يطرد البوت المشرفين
    if (isAdmin) return 

    try {
      // فعل 1: حذف الرسالة فوراً
      await conn.sendMessage(m.chat, { delete: m.key })

      // فعل 2: طرد العضو من المجموعة
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')

      // إشعار بالحدث
      await conn.sendMessage(m.chat, {
        text: `🚫 *تم طرد المستخدم:* @${m.sender.split('@')[0]}\nسبب الطرد: إرسال جهات اتصال (ممنوع في الجروب).`,
        mentions: [m.sender]
      })

    } catch (e) {
      console.error('خطأ في تنفيذ الإجراء:', e)
    }
  }
}

handler.before = async function (m, options) {
  await handler(m, options)
}

handler.command = /^(مانع_جهات|مانع-جهات)$/i
handler.group = true
handler.botAdmin = true // ضروري لتمكين صلاحية الحذف والطرد

export default handler