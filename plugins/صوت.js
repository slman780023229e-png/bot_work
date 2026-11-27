import axios from 'axios'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'
import FormData from 'form-data'

const execAsync = promisify(execFile)
const FFMPEG = ffmpegPath

// حط مفتاحك هنا مباشرة، عشان نجرب بدون .env
const elevenKey = 'sk_997a18b66c4b4aeaa7b3d1d3751bb4aae38c9f4c53e638a9'

const handler = async (m, { conn, text, usedPrefix }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }
  let input = (text || '').trim()
  if(!input) return m.reply(`رد على اي فويس واكتب:\n${usedPrefix}صوت الكلام الجديد`)

  if(input.length > 500) input = input.slice(0, 500)
  await react('⏳')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'arthur-clone-'))
  const mp3Path = path.join(tmpDir,'in.mp3')
  const oggPath = path.join(tmpDir,'out.ogg')
  const samplePath = path.join(tmpDir,'sample.mp3')

  try{
    let voiceId = null

    // اذا رديت على فويس، انسخ صوته
    if(m.quoted && (m.quoted.mimetype?.includes('audio') || m.quoted.msg?.mimetype?.includes('audio'))){
      await m.reply(`سمعت الفويس، الحين بنسخ صوته... ⏳`)
      const voiceBuffer = await m.quoted.download()
      if(!voiceBuffer?.length) throw new Error('ما قدرت احمل الفويس')
      fs.writeFileSync(samplePath, voiceBuffer)

      const form = new FormData()
      form.append('name', `temp_${Date.now()}`)
      form.append('files', fs.createReadStream(samplePath), { filename: 'sample.mp3', contentType: 'audio/mpeg' })
      form.append('description', 'clone from reply')

      const cloneRes = await axios.post('https://api.elevenlabs.io/v1/voices/add', form, {
        headers: { 'xi-api-key': elevenKey, ...form.getHeaders() },
        timeout: 60000
      })
      voiceId = cloneRes.data?.voice_id
      if(!voiceId) throw new Error('فشل استنساخ الصوت، جرب فويس اطول من 10 ثواني واوضح')
    } else {
      return m.reply(`لازم ترد على فويس!\nارسل فويس 15 ثانية، ورد عليه واكتب:\n${usedPrefix}صوت هلا والله`)
    }

    // انطق الكلام الجديد بنفس الصوت
    const { data } = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      text: input,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.35, similarity_boost: 0.9, style: 0.3, use_speaker_boost: true }
    }, {
      responseType: 'arraybuffer',
      headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json' },
      timeout: 30000
    })

    fs.writeFileSync(mp3Path, Buffer.from(data))
    await execAsync(FFMPEG, ['-y','-i', mp3Path, '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])
    const oggBuffer = fs.readFileSync(oggPath)
    await conn.sendMessage(m.chat, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
    await react('✅')

    // امسح الصوت المؤقت
    try{ await axios.delete(`https://api.elevenlabs.io/v1/voices/${voiceId}`, { headers: { 'xi-api-key': elevenKey } }) }catch{}

  }catch(e){
    console.error(e)
    await react('❌')
    await m.reply(`فشل: ${e.response?.data?.detail?.message || e.message}`)
  }finally{
    try{ fs.rmSync(tmpDir,{recursive:true,force:true}) }catch{}
  }
}

handler.help = ['صوت']
handler.tags = ['audio']
handler.command = /^(صوت|انطق)$/i
export default handler