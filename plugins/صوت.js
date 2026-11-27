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

const elevenKey = 'sk_5ea1711036aa51db87e0fe96cea8a0d1368d2f0803bfd39b'

// صوت جاهز عربي، اذا ما قدرت انسخ صوتك، استخدم هذا
const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM'

const handler = async (m, { conn, text, usedPrefix }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }
  await react('⏳')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'arthur-voice-'))
  const mp3Path = path.join(tmpDir,'in.mp3')
  const oggPath = path.join(tmpDir,'out.ogg')
  const samplePath = path.join(tmpDir,'sample.mp3')

  try{
    let input = (text || '').trim()
    let voiceId = DEFAULT_VOICE
    let quoted = m.quoted

    // === ميزة 1: رديت على كتابة ===
    // اذا رديت على رسالة كتابة، وما كتبت شي، خذ كلام الرسالة
    if(quoted && !input){
      let qText = quoted.text || quoted.body || quoted.msg?.conversation || quoted.msg?.extendedTextMessage?.text || ''
      if(qText) input = qText.trim()
    }

    // === ميزة 2: رديت على فويس ===
    let isVoiceReply = false
    if(quoted){
      let mime = quoted.mimetype || quoted.msg?.mimetype || ''
      if(mime.includes('audio') || quoted.msg?.audioMessage || quoted.audioMessage) isVoiceReply = true
    }

    if(isVoiceReply){
      await m.reply(`سمعت الفويس، الحين بحاول انسخ صوته... ⏳`)
      try{
        let voiceBuffer = null
        try { voiceBuffer = await conn.downloadMediaMessage(quoted) } catch(e){ console.log('dl1 fail', e.message) }
        if(!voiceBuffer?.length && m.quoted?.download){ try{ voiceBuffer = await m.quoted.download() }catch{} }
        if(!voiceBuffer?.length) throw new Error('ما قدرت احمل الفويس')

        fs.writeFileSync(samplePath, voiceBuffer)
        const form = new FormData()
        form.append('name', `temp_${Date.now()}`)
        form.append('files', fs.createReadStream(samplePath), { filename: 'sample.mp3', contentType: 'audio/mpeg' })
        const cloneRes = await axios.post('https://api.elevenlabs.io/v1/voices/add', form, {
          headers: { 'xi-api-key': elevenKey, ...form.getHeaders() },
          timeout: 60000
        })
        if(cloneRes.data?.voice_id){
          voiceId = cloneRes.data.voice_id
          console.log('Cloned voice:', voiceId)
        }
      }catch(cloneErr){
        console.log('Clone failed, using default voice:', cloneErr.response?.data || cloneErr.message)
        await m.reply(`ما قدرت انسخ الصوت بالضبط (${cloneErr.response?.data?.detail?.message || cloneErr.message})، بحولك لصوت جاهز...`)
        voiceId = DEFAULT_VOICE
      }
    }

    if(!input) return m.reply(`اكتب كذا:\n${usedPrefix}صوت هلا والله\nاو رد على اي كتابة واكتب:\n${usedPrefix}صوت\nاو رد على اي فويس واكتب:\n${usedPrefix}صوت الكلام الجديد`)
    if(input.length > 500) input = input.slice(0, 500)

    // === توليد الصوت ===
    const { data } = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      text: input,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.4, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true }
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

    // امسح الصوت المؤقت اذا كان مستنسخ
    if(voiceId !== DEFAULT_VOICE){
      try{ await axios.delete(`https://api.elevenlabs.io/v1/voices/${voiceId}`, { headers: { 'xi-api-key': elevenKey } }) }catch{}
    }

  }catch(e){
    console.error('VOICE ERROR FULL:', e.response?.data || e)
    await react('❌')
    await m.reply(`فشل: ${e.response?.data?.detail?.message || e.message}\n\nانسخ الخطأ اللي في الكونسول وارسله لي`)
  }finally{
    try{ fs.rmSync(tmpDir,{recursive:true,force:true}) }catch{}
  }
}

handler.help = ['صوت']
handler.tags = ['audio']
handler.command = /^(صوت|انطق|تكلم)$/i
export default handler