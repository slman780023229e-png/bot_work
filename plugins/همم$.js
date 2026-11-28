let handler = async (m, { conn }) => {
  await conn.sendMessage(m.chat, { text: '✅ البلجنز شغالة، وصلني امرك' }, { quoted: m })
}
handler.command = /^همم$/i
export default handler