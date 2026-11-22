// plugins/منشن.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - منشن جميع أعضاء الجروب 🎀

import axios from 'axios'

// 🖼️ صورة أمر المنشن
const imageUrl = 'https://files.catbox.moe/8riky3.jpg'

// 🌍 أكواد الدول
const countries = [
  ['20', '🇪🇬', 'مصر'],
  ['213', '🇩🇿', 'الجزائر'],
  ['216', '🇹🇳', 'تونس'],
  ['212', '🇲🇦', 'المغرب'],
  ['218', '🇱🇾', 'ليبيا'],
  ['249', '🇸🇩', 'السودان'],

  ['966', '🇸🇦', 'السعودية'],
  ['971', '🇦🇪', 'الإمارات'],
  ['974', '🇶🇦', 'قطر'],
  ['965', '🇰🇼', 'الكويت'],
  ['973', '🇧🇭', 'البحرين'],
  ['968', '🇴🇲', 'عُمان'],

  ['962', '🇯🇴', 'الأردن'],
  ['961', '🇱🇧', 'لبنان'],
  ['964', '🇮🇶', 'العراق'],
  ['967', '🇾🇪', 'اليمن'],
  ['970', '🇵🇸', 'فلسطين'],
  ['963', '🇸🇾', 'سوريا'],

  ['90', '🇹🇷', 'تركيا'],
  ['44', '🇬🇧', 'بريطانيا'],
  ['33', '🇫🇷', 'فرنسا'],
  ['49', '🇩🇪', 'ألمانيا'],
  ['39', '🇮🇹', 'إيطاليا'],
  ['34', '🇪🇸', 'إسبانيا'],
  ['7', '🇷🇺', 'روسيا'],

  ['81', '🇯🇵', 'اليابان'],
  ['82', '🇰🇷', 'كوريا الجنوبية'],
  ['86', '🇨🇳', 'الصين'],
  ['91', '🇮🇳', 'الهند'],
  ['92', '🇵🇰', 'باكستان'],
  ['880', '🇧🇩', 'بنغلاديش'],

  ['62', '🇮🇩', 'إندونيسيا'],
  ['60', '🇲🇾', 'ماليزيا'],
  ['65', '🇸🇬', 'سنغافورة'],
  ['63', '🇵🇭', 'الفلبين'],
  ['66', '🇹🇭', 'تايلاند'],

  ['55', '🇧🇷', 'البرازيل'],
  ['52', '🇲🇽', 'المكسيك'],
  ['27', '🇿🇦', 'جنوب أفريقيا'],
  ['234', '🇳🇬', 'نيجيريا'],
  ['254', '🇰🇪', 'كينيا'],

  ['61', '🇦🇺', 'أستراليا'],
  ['64', '🇳🇿', 'نيوزيلندا'],
  ['65', '🇸🇬', 'سنغافورة'],
  ['353', '🇮🇪', 'أيرلندا'],
  ['31', '🇳🇱', 'هولندا'],
  ['32', '🇧🇪', 'بلجيكا'],
  ['41', '🇨🇭', 'سويسرا'],
  ['43', '🇦🇹', 'النمسا'],
  ['45', '🇩🇰', 'الدنمارك'],
  ['46', '🇸🇪', 'السويد'],
  ['47', '🇳🇴', 'النرويج'],
  ['48', '🇵🇱', 'بولندا'],
  ['351', '🇵🇹', 'البرتغال'],
  ['30', '🇬🇷', 'اليونان'],

  ['98', '🇮🇷', 'إيران'],
  ['972', '🇮🇱', 'إسرائيل'],
  ['93', '🇦🇫', 'أفغانستان'],
  ['998', '🇺🇿', 'أوزبكستان'],
  ['994', '🇦🇿', 'أذربيجان'],
  ['995', '🇬🇪', 'جورجيا'],
  ['7', '🇰🇿', 'كازاخستان'],

  ['1', '🇺🇸', 'أمريكا/كندا']
]

// 🌍 معرفة الدولة من رقم الهاتف
function getCountry(number) {
  number = String(number || '').replace(/\D/g, '')

  // الأكواد الأطول أولاً
  const sorted = [...countries].sort(
    (a, b) => b[0].length - a[0].length
  )

  for (const [code, flag, country] of sorted) {
    if (number.startsWith(code)) {
      return {
        flag,
        country
      }
    }
  }

  return {
    flag: '🌍',
    country: 'غير معروف'
  }
}

const handler = async (m, { conn, isAdmin, isOwner }) => {

  try {

    // 🚫 لازم يكون الأمر داخل جروب
    if (!m.isGroup) {
      return m.reply('❌ الأمر ده شغال داخل الجروبات فقط 🎀')
    }

    // 🔐 للمشرفين والمطور فقط
    if (!isAdmin && !isOwner) {
      return m.reply('❌ الأمر ده للمشرفين والمطور فقط 🎀')
    }

    // 📋 معلومات الجروب
    const metadata = await conn.groupMetadata(m.chat)

    const participants = metadata.participants || []

    if (!participants.length) {
      return m.reply('❌ مفيش أعضاء في الجروب.')
    }

    // 📌 جميع الـ JID للمنشن
    const mentions = []

    let text = ''

    text += `╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n`
    text += `┃ 🎀 منشن جميع أعضاء الجروب\n`
    text += `┃ 👥 العدد: ${participants.length}\n`
    text += `╰━━━━━━━━━━━━━━╯\n\n`

    // 👥 إضافة كل الأعضاء
    for (let i = 0; i < participants.length; i++) {

      const participant = participants[i]

      const jid = participant.id

      if (!jid) continue

      mentions.push(jid)

      /*
       * استخراج الرقم
       *
       * بعض إصدارات Baileys تستخدم:
       * participant.phoneNumber
       * أو participant.phone
       * وبعضها يستخدم jid مباشرة
       */
      let number =
        participant.phoneNumber ||
        participant.phone ||
        jid.split('@')[0]

      number = String(number)
        .replace(/\D/g, '')

      // 🌍 تحديد الدولة
      const info = getCountry(number)

      // 🏷️ المنشن
      text += `${i + 1}. ${info.flag} @${number} — ${info.country} — 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓\n`
    }

    text += `\n`
    text += `╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮\n`
    text += `┃ ✨ تم منشن جميع الأعضاء\n`
    text += `┃ 👥 ${participants.length} عضو\n`
    text += `╰━━━━━━━━━━━━━━╯`

    // 🖼️ تحميل الصورة
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    })

    const imageBuffer = Buffer.from(response.data)

    // 📤 إرسال الصورة + النص + المنشن
    await conn.sendMessage(
      m.chat,
      {
        image: imageBuffer,
        caption: text,
        mentions: mentions
      },
      {
        quoted: m
      }
    )

  } catch (error) {

    console.error('❌ خطأ في أمر منشن:', error)

    await m.reply(
      '❌ حصل خطأ أثناء تنفيذ أمر المنشن 🎀\n\n' +
      'تأكد إن البوت موجود في الجروب وعنده صلاحية إرسال الرسائل.'
    )
  }
}

// 📝 بيانات الأمر
handler.help = ['منشن']
handler.tags = ['group']
handler.command = ['منشن']

export default handler