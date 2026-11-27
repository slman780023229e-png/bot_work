import axios from 'axios'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'

const execAsync = promisify(execFile)
const FFMPEG = ffmpegPath

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }
  await react('🎙️')

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'bot-voice-'))
  const mp3Path = path.join(tmpDir,'in.mp3')
  const oggPath = path.join(tmpDir,'out.ogg')
  const videoPath = path.join(tmpDir,'in.mp4')

  try{
    let input = (text || '').trim()
    let quoted = m.quoted

    // ===== ميزة 1: تحويل الفيديو الى صوت =====
    // اذا رديت على فيديو
    let isVideo = false
    if(quoted){
      let mime = quoted.mimetype || quoted.msg?.mimetype || ''
      if(mime.includes('video') || quoted.msg?.videoMessage || quoted.videoMessage) isVideo = true
    }
    // او اذا الامر هو فيديو_صوت
    if(isVideo || command === 'فيديو_صوت' || command === 'فيديو-صوت' || input === 'فيديو'){
      if(!quoted) return m.reply(`رد على اي فيديو واكتب:\n${usedPrefix}صوت`)
      await m.reply(`سمعت، الحين بفصل الصوت من الفيديو... ⏳`)

      let videoBuffer = null
      try { videoBuffer = await conn.downloadMediaMessage(quoted) } catch(e){ console.log(e.message) }
      if(!videoBuffer?.length && m.quoted?.download){ try{ videoBuffer = await m.quoted.download() }catch{} }
      if(!videoBuffer?.length) return m.reply('ما قدرت احمل الفيديو، جرب مرة ثانية')

      fs.writeFileSync(videoPath, videoBuffer)

      // فصل الصوت من الفيديو، وحوله لفويس واتساب
      await execAsync(FFMPEG, ['-y','-i', videoPath, '-vn', '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])

      const oggBuffer = fs.readFileSync(oggPath)
      await conn.sendMessage(m.chat, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
      await react('✅')
      return
    }

    // ===== ميزة 2: تحويل الكتابة الى صوت =====
    if(quoted && !input){
      let qText = quoted.text || quoted.body || quoted.msg?.conversation || quoted.msg?.extendedTextMessage?.text || ''
      if(qText) input = qText.trim()
    }

    if(!input) return m.reply(`*طريقة الاستخدام:*\n\n1- تحويل كتابة لصوت:\n${usedPrefix}صوت هلا والله كيفكم\nاو رد على اي كتابة واكتب ${usedPrefix}صوت\n\n2- تحويل فيديو لصوت:\nرد على اي فيديو واكتب ${usedPrefix}صوت`)

    if(input.length > 500) input = input.slice(0, 500)

    let lang = /[\u0600-\u06FF]/.test(input) ? 'ar' : 'en'
    const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(input)}&tl=${lang}&total=1&idx=0&textlen=${input.length}`
    
    const { data } = await axios.get(gUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    fs.writeFileSync(mp3Path, Buffer.from(data))
    await execAsync(FFMPEG, ['-y','-i', mp3Path, '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])
    const oggBuffer = fs.readFileSync(oggPath)

    await conn.sendMessage(m.chat, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
    await react('✅')

  }catch(e){
    console.error(e)
    await react('❌')
    await m.reply(`ما ضبط، جرب مرة ثانية`)
  }finally{
    try{ fs.rmSync(tmpDir,{recursive:true,force:true}) }catch{}
  }
}

handler.help = ['صوت']
handler.tags = ['audio']
handler.command = /^(صوت|انطق|تكلم|قول|فيديو_صوت|فيديو-صوت)$/i
export default handler