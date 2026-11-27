// core/theme.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight Unit No.2 Type B - Core Theme ✧

export const theme = {
  // الرموز الأساسية
  frost: '❄️',
  blood: '🩸',
  blade: '🗡️',
  eye: '🔮',
  sword: '⚔️',
  target: '✧',
  lightning: '⚡',
  moon: '☾',
  mark: '𖤐',
  horus: '𓂀',
  crown: '👑',

  // الفواصل
  divider: '*◇❐ ═━━╾ ⚡ ╼━━═ ❐◇*',
  endDivider: '*◇❐ ═━━╾ ✦ ╼━━═ ❐◇*',

  // تنسيق النصوص
  title: (text) => `⚡ *${text}*`,
  subtitle: (text) => `⚔️ *${text}*`,
  info: (text) => `🔮 *${text}*`,
  warning: (text) => `⚡ *${text}*`,
  success: (text) => `✧ *${text}*`,
  error: (text) => `🩸 *${text}*`,

  // بناء الرسالة الكاملة
  build: (sections) => {
    let msg = `${theme.divider}\n`

    for (const section of sections) {
      switch (section.type) {
        case 'title':
          msg += `*┃* ⚡ *${section.text}*\n`
          break
        case 'subtitle':
          msg += `*┃* ⚔️ *${section.text}*\n`
          break
        case 'info':
          msg += `*┃* 🔮 *${section.label}:* ${section.value}\n`
          break
        case 'line':
          msg += `*┃* ✧ ${section.text}\n`
          break
        case 'divider':
          msg += `*┃* ── ❄️ ⚔️ 🔮 ☾ ──\n`
          break
        case 'spacer':
          msg += `*┃*\n`
          break
        default:
          break
      }
    }

    msg += `${theme.endDivider}`
    return msg
  },

  // رسالة الملف الشخصي
  profile: (data) => {
    let msg = `${theme.divider}\n`
    msg += `*┃* ⚡ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓* ╎ _Evernight_\n`
    msg += `*┃* ── ❄️ ⚔️ 🔮 👑 ──\n`

    for (const item of data) {
      switch (item.type) {
        case 'header':
          msg += `*┃* 👑 *${item.text}*\n`
          break
        case 'info':
          msg += `*┃* 🔮 *${item.label}:* ${item.value}\n`
          break
        case 'line':
          msg += `*┃* ✧ ${item.text}\n`
          break
        default:
          break
      }
    }

    msg += `${theme.endDivider}`
    return msg
  }
}

export const formatWithTheme = (data) => {
  return theme.build(data)
}
