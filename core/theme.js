// core/theme.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight Unit No.2 Type B - Core Theme ✧
// ⚡⚡ ARTHUR - ALL IN ONE + LIGHTNING ⚡⚡

export const theme = {
  // الرموز الأساسية - من كل شي
  skull: '❄️',
  blood: '🩸',
  virus: '🗡️',
  eye: '🔮',
  sword: '⚔️',
  target: '✧',
  lightning: '⚡',
  moon: '☾',
  demon: '𖤐',
  eyeHorus: '𓂀',
  crown: '👑',
  darkStar: '𓉘᳟ี ⃞̸͢𑁃 ̚𓉝᳟ี',
  lightStar: '❄️ּ۪᪲۫ᮬ',

  // فواصل 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - نفس صندوقك بس مع كل الرموز والبرق أكثر
  divider: '*◇❐ ═━━╾⚡⚡⚡ ╼━━═ ❐◇*',
  smallDivider: '*┃* ⚡ ╎ ── ❄️ ⚔️ 🩸 🔮 𓂀 𖤐 ☾ 👑 ── ⚡',
  endDivider: '*◇❐ ═━━╾⚡⚡⚡╼━━═ ❐◇*',

  // تنسيق النص - البرق في كل شي
  title: (text) => `⚡ *${text}*`,
  subtitle: (text) => `⚡ *${text}*`,
  info: (text) => `⚡ *${text}*`,
  warning: (text) => `⚡ *${text}* ⚡`,
  success: (text) => `⚡ *${text}*`,
  error: (text) => `⚡ *${text}*`,

  // build full message - بنفس صندوق الستيكر اللي عجبك
  build: (sections) => {
    let msg = `*◇❐ ═━━╾⚡⚡⚡ ╼━━═ ❐◇*\n`
    for (const section of sections) {
      if (section.type === 'title') {
        msg += `*┃* ⚡ ╎ ❄️ *${section.text}*\n`
      } else if (section.type === 'subtitle') {
        msg += `*┃* ⚡ ╎ ⚔️ *${section.text}*\n`
      } else if (section.type === 'info') {
        msg += `*┃* ⚡ ╎ 🔮 *${section.label}:* ${section.value}\n`
      } else if (section.type === 'line') {
        msg += `*┃* ⚡ ╎ ${section.text}\n`
      } else if (section.type === 'divider') {
        msg += `*┃* ⚡ ╎ ── ❄️ ⚔️ 🩸 🔮 𓂀 𖤐 ☾ ──\n`
      } else if (section.type === 'spacer') {
        msg += `*┃* ⚡ ╎\n`
      }
    }
    msg += `*◇❐ ═━━╾⚡⚡⚡╼━━═ ❐◇*`
    return msg
  },

  // رسالة الملف الشخصي - من كل شي + برق
  profile: (data) => {
    let msg = `*◇❐ ═━━╾⚡⚡⚡ ╼━━═ ❐◇*\n`
    msg += `*┃* ⚡ ╎ ❀⃘⃛͜ ۪۪۪݃𓉘᳟ี ⃞̸͢𑁃 ̚𓉝᳟ี ͟͟͞͞⌒᳝︵໋۪۪۪۪۪᳝֔࣪┄꯭๋━┄꫶︦⡳۪۪۪۪۟︵໋۪۪۪۪۪᳝֔࣪⌒᳝ᦷ࣭࣪❄️ּ۪᪲۫ᮬ ࣭࣪ᦡ ۪ׄ⌒᳝\n`
    msg += `*┃* ⚡ ╎ ⃝⃘︢︣֟፝ · ͟͟͞͞Evernight· ͟͟͞͞➳ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 · ⚡\n`
    msg += `*┃* ⚡ ╎ ── ❄️ ⚔️ 🩸 🔮 𓂀 𖤐 ☾ 👑 𓋹 ──\n`
    for (const item of data) {
      if (item.type === 'header') {
        msg += `*┃* ⚡ ╎ ├ׁ̟̇˚₊· ͟͟͞͞➳❥ ⚡ ${item.text}\n`
      } else if (item.type === 'info') {
        msg += `*┃* ⚡ ╎ ├ׁ̟̇˚₊· ͟͟͞͞➳❥ ⚡ ${item.label}: ${item.value}\n`
      } else if (item.type === 'line') {
        msg += `*┃* ⚡ ╎ ├ׁ̟̇˚₊· ͟͟͞͞➳❥ ⚡ ${item.text}\n`
      }
    }
    msg += `*◇❐ ═━━╾⚡⚡⚡╼━━═ ❐◇*`
    return msg
  }
}

export const formatWithTheme = (data) => {
  return theme.build(data)
}