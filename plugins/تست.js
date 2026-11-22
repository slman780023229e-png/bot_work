import fetch from 'node-fetch'

const handler = async (m, { conn }) => {

  const fk = {
    key: {
      remoteJid: 'status@broadcast',
      fromMe: false,
      id: 'Halo',
      participant: '0@s.whatsapp.net'
    },
    message: {
      extendedTextMessage: {
        text: ''
      }
    }
  }

  const videoUrl = 'https://files.catbox.moe/isiwqc.mp4'
  const res = await fetch(videoUrl)
  const buffer = await res.buffer()

  await conn.sendMessage(
    m.chat,
    {
      video: buffer,
      mimetype: 'video/mp4',
      ptv: true,
      seconds: 11
    },
    { quoted: fk }
  )
}

handler.command = ['تست']

export default handler