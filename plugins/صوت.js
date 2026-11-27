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

const handler = async (m, { conn, text, usedPrefix }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }

  let input = (text || '').trim()
  // الكلام الجديد اللي تبيه ينطقه
  // مثال: ترد على فويس وتكتب .صوت هلا والله
  // input هنا = "هلا والله"

  if(!input) return m.reply(`رد على اي فويس واكتب:\n${usedPrefix}صوت الكلام الجديد اللي تبيه\n\nمثال:\nترد على فويس صاحبك وتكتب:\n${usedPrefix}صوت انا رحت السوق اليوم`)

  if(input.length > 500) input = input.slice(0, 500)

  const elevenKey = process.env.ELEVENLABS_API_KEY
  if(!elevenKey) return m.reply(`لازم تحط ELEVENLABS_API_KEY في .env`)

  await react('⏳')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'arthur-clone-'))
  const mp3Path = path.join(tmpDir,'in.mp3')
  const oggPath = path.join(tmpDir,'out.ogg')
  const samplePath = path.join(tmpDir,'sample.mp3')

  try{
    let voiceId = process.env.MY_VOICE_ID // صوتك الثابت اذا موجود

    // === اذا رديت على فويس، استنسخ صوت الفويس هذا ===
    if(m.quoted && (m.quoted.mimetype?.includes('audio') || m.quoted.msg?.mimetype?.includes('audio'))){
      await m.reply(`سمعت الفويس، الحين بنسخ صوته وانطق كلامك الجديد بنفس الصوت... ⏳`)

      // 1. حمل الفويس اللي رديت عليه
      const voiceBuffer = await m.quoted.download()
      if(!voiceBuffer?.length) throw new Error('ما قدرت احمل الفويس')
      fs.writeFileSync(samplePath, voiceBuffer)

      // 2. ارفع الفويس لـ ElevenLabs عشان يسوي صوت جديد مؤقت بنفس الصوت
      const form = new FormData()
      form.append('name', `temp_${Date.now()}`)
      form.append('files', fs.createReadStream(samplePath), { filename: 'sample.mp3', contentType: 'audio/mpeg' })
      form.append('description', 'clone from reply')
      form.append('labels', JSON.stringify({}))

      const cloneRes = await axios.post('https://api.elevenlabs.io/v1/voices/add', form, {
        headers: { 'xi-api-key': elevenKey, ...form.getHeaders() },
        timeout: 60000
      })

      voiceId = cloneRes.data?.voice_id
      if(!voiceId) throw new Error('فشل استنساخ الصوت، جرب فويس اوضح واطول من 10 ثواني')
    }

    if(!voiceId) throw new Error('رد على فويس، او حط MY_VOICE_ID في .env')

    // 3. انطق الكلام الجديد بنفس الصوت
    const { data } = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      text: input,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.35, similarity_boost: 0.9, style: 0.3, use_speaker_boost: true }
    }, {
      responseType: 'arraybuffer',
      headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json' },
      timeout: 30000
    })

    const mp3Buffer = Buffer.from(data)
    fs.writeFileSync(mp3Path, mp3Buffer)
    await execAsync(FFMPEG, ['-y','-i', mp3Path, '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])
    const oggBuffer = fs.readFileSync(oggPath)

    await conn.sendMessage(m.chat, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
    await react('✅')

    // 4. امسح الصوت المؤقت عشان ما يمتلئ حسابك
    if(m.quoted && voiceId !== process.env.MY_VOICE_ID){
      try{ await axios.delete(`https://api.elevenlabs.io/v1/voices/${voiceId}`, { headers: { 'xi-api-key': elevenKey } }) }catch{}
    }

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
handler.command = /^(صوت|انطق)$/i
export default handler