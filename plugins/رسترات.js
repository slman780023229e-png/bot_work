// plugins/ريستارت.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - إعادة التشغيل التلقائي 🔄

import fs from 'fs'
import path from 'path'
import { theme } from '../core/theme.js'

let restartTimeout = null

async function triggerSafeRestart(chatJid, customMessage = null) {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

    const restartFile = path.join(dataDir, 'restart.json')
    const payload = {
      jid: chatJid,
      timestamp: Date.now(),
      message:
        customMessage ||
        theme.build([
          { type: 'title', text: '✅ ARTHUR BOT: "تمت إعادة التشغيل"' },
          { type: 'divider' },
          { type: 'line', text: '🚀 *تمت إعادة تشغيل النواة بنجاح*' },
          { type: 'line', text: '🟢 البوت متصل ويعمل بكفاءة الآن' }
        ])
    }

    fs.writeFileSync(restartFile, JSON.stringify(payload, null, 2), 'utf-8')
  } catch (err) {
    console.error('⚠️ فشل حفظ ملف إشعار الريستارت:', err?.message || err)
  }

  try {
    if (global.db?.save) await global.db.save()
  } catch {}

  setTimeout(() => {
    console.log('🔄 ARTHUR BOT: جاري إعادة التشغيل الآن...')
    process.exit(0) // start.js سيعيد تشغيل index.js تلقائياً خلال 3 ثوانٍ
  }, 1500)
}

let handler = async (m, { text, usedPrefix, command }) => {
  const input = (text || '').trim().toLowerCase()

  // 1️⃣ إلغاء التايمر المجدول
  if (input === '0' || input === 'الغاء' || input === 'إلغاء' || input === 'cancel') {
    if (restartTimeout) {
      clearTimeout(restartTimeout)
      restartTimeout = null
      return m.reply(
        theme.build([
          { type: 'title', text: '🛑 ARTHUR BOT: "تم إلغاء إعادة التشغيل"' },
          { type: 'divider' },
          { type: 'line', text: '✅ تم إيقاف المؤقت المجدول بنجاح' }
        ])
      )
    } else {
      return m.reply(
        theme.build([
          { type: 'title', text: 'ℹ️ ARTHUR BOT: "لا يوجد مؤقت نشط"' },
          { type: 'divider' },
          { type: 'line', text: 'لا توجد إعادة تشغيل مجدولة لإلغائها حالياً.' }
        ])
      )
    }
  }

  // 2️⃣ إعادة تشغيل فورية
  if (input === 'الان' || input === 'الآن' || input === 'now' || input === 'فوري') {
    await m.reply(
      theme.build([
        { type: 'title', text: '🔄 ARTHUR BOT: "إعادة تشغيل فورية"' },
        { type: 'divider' },
        { type: 'line', text: '⏳ جاري حفظ البيانات وإعادة التشغيل الآن...' }
      ])
    )
    return triggerSafeRestart(m.chat)
  }

  // 3️⃣ إعادة تشغيل بعد عدد دقائق محدد
  if (input && !isNaN(input)) {
    const minutes = parseInt(input, 10)
    if (minutes < 1) {
      return m.reply('⚠️ اكتب رقماً صحيحاً أكبر من 0، أو اكتب `0` للإلغاء.')
    }

    if (restartTimeout) clearTimeout(restartTimeout)

    await m.reply(
      theme.build([
        { type: 'title', text: '🔄 ARTHUR BOT: "تم تفعيل إعادة التشغيل"' },
        { type: 'divider' },
        { type: 'info', label: '⏰ المدة', value: `${minutes} دقيقة` },
        { type: 'line', text: '⏳ سيتم حفظ البيانات وإعادة تشغيل النظام تلقائياً' },
        { type: 'divider' },
        { type: 'warning', text: `⚡ للإلغاء: ${usedPrefix + command} 0` }
      ])
    )

    restartTimeout = setTimeout(() => {
      restartTimeout = null
      triggerSafeRestart(m.chat)
    }, minutes * 60 * 1000)

    return
  }

  // 4️⃣ عرض قائمة المساعدة
  return m.reply(
    theme.build([
      { type: 'title', text: '🔄 ARTHUR BOT: "وحدة إعادة التشغيل"' },
      { type: 'divider' },
      { type: 'line', text: '⚔️ *إعادة تشغيل تلقائي للنظام*' },
      { type: 'divider' },
      { type: 'info', label: '🔮 الاستخدام', value: `${usedPrefix + command} <الوقت بالدقائق>` },
      { type: 'spacer' },
      { type: 'info', label: '📌 أمثلة', value: '' },
      { type: 'line', text: `${usedPrefix + command} الان  (إعادة تشغيل فورية)` },
      { type: 'line', text: `${usedPrefix + command} 30` },
      { type: 'line', text: `${usedPrefix + command} 60` },
      { type: 'divider' },
      { type: 'warning', text: `⚡ للإلغاء: ${usedPrefix + command} 0` }
    ])
  )
}

handler.command = ['ريستارت', 'restart', 'اعاده', 'ريست', 'اعادة_تشغيل']
handler.help = ['ريستارت']
handler.tags = ['owner']
handler.owner = true

export default handler
