// plugins/نسخ.js
import { proto, generateWAMessageFromContent } from "baileys"

let handler = async (m, { conn, text }) => {
  let quotedText = ""
  try {
    if (m.quoted) {
      quotedText = m.quoted.text || m.quoted.caption || m.quoted.conversation || ""
      if (!quotedText && m.quoted.message) {
        quotedText = m.quoted.message.conversation || m.quoted.message.extendedTextMessage?.text || ""
      }
    }
  } catch {}

  let toCopy = text?.trim() || quotedText || `ARTHUR BOT ⚡`
  
  if (quotedText && !text) toCopy = quotedText

  let body = `*╭━〔⚡ نسخ مباشر 〕━╮*\n*┃ 📋 اضغط ينسخ فوراً*\n*┃*\n*┃* \`\`\`${toCopy.slice(0,3500)}\`\`\`\n*╰━━━━━━━━━━━━╯*`

  let msg = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
          body: proto.Message.InteractiveMessage.Body.create({ text: body }),
          footer: proto.Message.InteractiveMessage.Footer.create({ text: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡' }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "📋 نسخ",
                  copy_code: toCopy
                })
              }
            ]
          })
        })
      }
    }
  }, { quoted: m })

  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}
handler.help = ['نسخ']
handler.tags = ['tools']
handler.command = /^(نسخ|copy)$/i
export default handler