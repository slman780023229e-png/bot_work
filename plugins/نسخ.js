// plugins/نسخ.js
import { proto, generateWAMessageFromContent } from "baileys"

let handler = async (m, { conn, text }) => {
  let q = m.quoted || null
  let qText = ""
  try {
    if (q) {
      qText = q.text || q.caption || q.conversation || q.message?.conversation || q.message?.extendedTextMessage?.text || q.message?.imageMessage?.caption || q.message?.videoMessage?.caption || ""
    } else if (m.msg?.contextInfo?.quotedMessage) {
      let mq = m.msg.contextInfo.quotedMessage
      qText = mq.conversation || mq.extendedTextMessage?.text || mq.imageMessage?.caption || mq.videoMessage?.caption || ""
    }
  } catch {}

  let arg = (text || "").trim()
  if (arg.toLowerCase() == "نسخ" || arg.toLowerCase() == "copy") arg = ""

  let toCopy = arg || qText || ""
  if (!toCopy) return m.reply("❌ رد على رسالة فيها نص او اكتب .نسخ النص")

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
handler.help = ['نسخ']
handler.tags = ['tools']
handler.command = /^(نسخ|copy)$/i
export default handler