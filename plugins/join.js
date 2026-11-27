let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

let handler = async (m, { conn, text, usedPrefix, command, isOwner, isMods }) => {
  try {
    // التحقق من صلاحية المستخدم (فقط المطورين)
    if (!isOwner && !isMods) {
      return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 🔒 ╎ *صلاحية مرفوضة*
*┃* 🔒 ╎ *هذا الأمر متاح للمطورين فقط*
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
      )
    }

    // استخراج الرابط من الرد أو النص
    let link = (m.quoted ? m.quoted.text : text) || ''
    let [_, code] = link.match(linkRegex) || []

    if (!code) {
      return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 🔗 ╎ *رابط غير صحيح*
*┃* 🔗 ╎ *أرسل رابط المجموعة مع الأمر*
*┃* 🔗 ╎ *مثال:* ${usedPrefix + command} https://chat.whatsapp.com/xxxx
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
      )
    }

    // جلب معلومات الدعوة لمعرفة حالة الموافقة واسم المجموعة
    let inviteInfo = null
    try {
      inviteInfo = await conn.groupGetInviteInfo(code)
    } catch {}

    const groupName = inviteInfo?.subject || 'غير معروفة'
    const needsApproval = Boolean(inviteInfo?.joinApprovalMode)

    // محاولة الانضمام أو تقديم طلب الانضمام
    try {
      let res = await conn.groupAcceptInvite(code)

      // إذا كانت المجموعة تتطلب موافقة المشرفين
      if (needsApproval || !res) {
        return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 📩 ╎ *تم إرسال طلب الانضمام*
*┃* 📩 ╎ *المجموعة:* ${groupName}
*┃* 📩 ╎ *الحالة:* بانتظار موافقة المشرفين
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
        )
      }

      return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ✅ ╎ *تم الانضمام بنجاح*
*┃* ✅ ╎ *المجموعة:* ${groupName}
*┃* ✅ ╎ *البوت:* 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
      )
    } catch (err) {
      console.error('[ARTHUR JOIN ERROR]', err)

      const errMsg = String(err?.message || err || '')
      const status = err?.data || err?.output?.statusCode

      // بعض إصدارات Baileys ترمي خطأ عند إرسال طلب موافقة أو وجود طلب مسبق
      if (needsApproval || /approval|pending|request/i.test(errMsg)) {
        return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 📩 ╎ *المجموعة تتطلب موافقة*
*┃* 📩 ╎ *المجموعة:* ${groupName}
*┃* 📩 ╎ *الحالة:* تم إرسال الطلب أو معلق مسبقًا
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
        )
      }

      let reason = 'الرابط منتهي الصلاحية أو غير صالح'
      if (status === 409 || /already/i.test(errMsg)) {
        reason = 'البوت موجود داخل المجموعة بالفعل'
      } else if (status === 403 || /forbidden|removed|kicked/i.test(errMsg)) {
        reason = 'البوت مطرود أو محظور من هذه المجموعة'
      } else if (status === 410 || /gone|revoked|expired/i.test(errMsg)) {
        reason = 'تم إلغاء الرابط أو انتهت صلاحيته'
      }

      return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ❌ ╎ *فشل الانضمام للمجموعة*
*┃* ❌ ╎ *السبب:* ${reason}
*┃* ❌ ╎ *التفاصيل:* ${errMsg || status || 'خطأ غير معروف'}
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
      )
    }
  } catch (e) {
    console.error('[ARTHUR JOIN FATAL]', e)
    return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ⚠️ ╎ *حدث خطأ غير متوقع*
*┃* ⚠️ ╎ *السبب:* ${e.message}
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
    )
  }
}

handler.help = ['تعالي [رابط الجروب]']
handler.tags = ['owner']
handler.command = /^(join|تعالي)$/i

handler.owner = true
handler.mods = false
handler.premium = false
handler.group = false
handler.private = false

export default handler