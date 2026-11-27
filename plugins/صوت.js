import axios from 'axios'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'

const execAsync = promisify(execFile)
const FFMPEG = ffmpegPath

const handler = async (m, { conn, text, usedPrefix }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }

  let input = (text || '').trim()
  if(!input && m.quoted?.text) input = m.quoted.text.trim()

  if(!input){
    return m.reply(`اكتب كذا:\n${usedPrefix}صوت هلا والله كيف حالك`)
  }

  if(input.length > 500) input = input.slice(0, 500)
  await react('⏳')

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'arthur-tts-'))
  const mp3Path = path.join(tmpDir,'in.mp3')
  const oggPath = path.join(tmpDir,'out.ogg')

  try{
    const elevenKey = process.env.ELEVENLABS_API_KEY
    let mp3Buffer

    if(elevenKey){
      const isFemale = m.text?.toLowerCase().includes('بنت')
      const voiceId = isFemale ? 'EXAVITQu4vr4xnSDxMaL' : 'pNInz6obpgDQGcFmaJgB'
      const { data } = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        text: input,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2 }
      }, {
        responseType: 'arraybuffer',
        headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json' },
        timeout: 30000
      })
      mp3Buffer = Buffer.from(data)
    } else {
      // قوقل عربي اجباري
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(input)}&tl=ar&client=tw-ob`
      const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://translate.google.com/'
        },
        timeout: 20000
      })
      mp3Buffer = Buffer.from(data)
    }

    if(!mp3Buffer || mp3Buffer.byteLength < 1000) throw new Error('الصوت فاضي')

    fs.writeFileSync(mp3Path, mp3Buffer)

    // التحويل المهم: من mp3 الى ogg opus - هذا هو اللي يقبله واتساب كفويس
    await execAsync(FFMPEG, ['-y','-i', mp3Path, '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])

    const oggBuffer = fs.readFileSync(oggPath)
    if(!oggBuffer.length) throw new Error('فشل التحويل')

    await conn.sendMessage(m.chat, {
      audio: oggBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: m })

    await react('✅')

  }catch(e){
    console.error(e)
    await react('❌')
    await m.reply(`فشل: ${e.message}`)
  }finally{
    try{ fs.rmSync(tmpDir,{recursive:true,force:true}) }catch{}
  }
}

handler.help = ['صوت']
handler.tags = ['audio']
handler.command = /^(صوت|صوت_بنت|صوت_ولد|انطق)$/i
export default handler