let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

async function requestJoinByInvite(conn, code) {
  return conn.query({
    tag: 'iq',
    attrs: {
      id: conn.generateMessageTag?.() || Date.now().toString(),
      to: 'g.us',
      type: 'set',
      xmlns: 'w:g2'
    },
    content: [
      {
        tag: 'invite',
        attrs: { code }
      }
    ]
  })
}

let handler = async (m, { conn, text, usedPrefix, command, isOwner, isMods }) => {
  try {
    if (!isOwner && !isMods) {
      return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 🔒 ╎ *صلاحية مرفوضة*
*┃* 🔒 ╎ *هذا الأمر متاح للمطورين فقط*
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
      )
    }

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

    let inviteInfo = null
    try {
      inviteInfo = await conn.groupGetInviteInfo(code)
    } catch {}

    const groupName = inviteInfo?.subject || 'غير معروفة'
    const needsApproval = Boolean(inviteInfo?.joinApprovalMode)

    try {
      let res = await conn.groupAcceptInvite(code)

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

      // محاولة إرسال طلب الانضمام صراحةً إذا كانت المجموعة تتطلب موافقة أو أعطت not-authorized
      if (needsApproval || /not-authorized|approval|pending|request/i.test(errMsg)) {
        try {
          await requestJoinByInvite(conn, code)
          return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 📩 ╎ *تم تقديم طلب الانضمام*
*┃* 📩 ╎ *المجموعة:* ${groupName}
*┃* 📩 ╎ *الحالة:* بانتظار موافقة المشرفين
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
          )
        } catch (reqErr) {
          console.error('[ARTHUR JOIN REQUEST ERR]', reqErr)
          return m.reply(
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ❌ ╎ *تعذر الانضمام أو إرسال الطلب*
*┃* ❌ ╎ *المجموعة:* ${groupName}
*┃* ❌ ╎ *السبب:* قد يكون البوت مطرودًا سابقًا أو الرابط مرفوض من واتساب (${errMsg})
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
          )
        }
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