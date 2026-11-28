// plugins/نسخ.js
import { proto, generateWAMessageFromContent } from "baileys"

let handler = async (m, { conn, text }) => {
  let quoted = m.quoted ? m.quoted : m.msg?.contextInfo?.quotedMessage ? { message: m.msg.contextInfo.quotedMessage } : null
  let qText = ""
  try {
    qText = quoted?.text || quoted?.caption || quoted?.conversation || quoted?.message?.conversation || quoted?.message?.extendedTextMessage?.text || quoted?.message?.imageMessage?.caption || quoted?.message?.videoMessage?.caption || ""
  } catch {}

  let toCopy = text?.trim() || qText || "ARTHUR BOT ⚡"

  let msg = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
          body: proto.Message.InteractiveMessage.Body.create({ text: `*📋 جاهز للنسخ:*\n\`\`\`${toCopy.slice(0,3500)}\`\`\`` }),
          footer: proto.Message.InteractiveMessage.Footer.create({ text: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ⚡' }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [{ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 نسخ", copy_code: toCopy }) }]
          })
        })
      }
    }
  }, { quoted: m })

  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

handler.help = ['نسخ - ينسخ نص او رد']
handler.tags = ['tools']
handler.command = /^(نسخ|copy)$/i
export default handler