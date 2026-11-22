// plugins/ريستارت.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - إعادة التشغيل التلقائي 🔄

import { theme } from '../core/theme.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // ⬇️ لو كتب الوقت بس - تشغيل التايمر
  if (text && !isNaN(text)) {
    let minutes = parseInt(text)
    if (minutes < 1) minutes = 1
    
    // ⬇️ رسالة تأكيد
    await m.reply(theme.build([
      { type: 'title', text: '🔄 ARTHUR BOT: "تم تفعيل إعادة التشغيل"' },
      { type: 'divider' },
      { type: 'info', label: '⏰ المدة', value: `${minutes} دقيقة` },
      { type: 'line', text: '⏳ سيتم إعادة تشغيل النظام تلقائياً' }
    ]))
    
    // ⬇️ ضبط التايمر
    setTimeout(() => {
      console.log('🔄 ARTHUR BOT: إعادة تشغيل تلقائية...')
      process.exit(1) // يقفل البوت - المنصة هتشغله تاني
    }, minutes * 60 * 1000) // تحويل الدقائق لملي ثانية
    
  } else {
    // ⬇️ لو كتب الأمر بس - عرض المساعدة
    return m.reply(theme.build([
      { type: 'title', text: '🔄 ARTHUR BOT: "وحدة إعادة التشغيل"' },
      { type: 'divider' },
      { type: 'line', text: '⚔️ *إعادة تشغيل تلقائي للنظام*' },
      { type: 'divider' },
      { type: 'info', label: '🔮 الاستخدام', value: `${usedPrefix + command} <الوقت بالدقائق>` },
      { type: 'spacer' },
      { type: 'info', label: '📌 أمثلة', value: '' },
      { type: 'line', text: `${usedPrefix + command} 30` },
      { type: 'line', text: `${usedPrefix + command} 60` },
      { type: 'line', text: `${usedPrefix + command} 120` },
      { type: 'divider' },
      { type: 'warning', text: `⚡ للإلغاء: ${usedPrefix + command} 0` }
    ]))
  }
}

handler.command = ['ريستارت', 'restart', 'اعاده', 'ريست', 'اعادة_تشغيل']
handler.help = ['ريستارت']
handler.tags = ['owner']
handler.owner = true

export default handler