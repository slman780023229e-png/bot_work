let handler = async (m) => {
  await m.reply('تم، ملف اوامر يشتغل')
}
handler.help = ['اوامر']
handler.tags = ['main']
handler.command = /^(اوامر|قسم)$/i
export default handler