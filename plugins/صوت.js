import axios from 'axios'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'

const execAsync = promisify(execFile)
const FFMPEG = ffmpegPath

function splitText(text, max = 180){
  let parts = text.match(/[^.!؟\n,،]+[.!؟\n,،]?/g) || [text]
  let chunks = []
  let cur = ''
  for(let p of parts){
    p = p.trim()
    if(!p) continue
    if((cur + ' ' + p).length > max){
      if(cur) chunks.push(cur.trim())
      if(p.length > max){
        let words = p.split(' ')
        let tmp = ''
        for(let w of words){
          if((tmp + ' ' + w).length > max){ chunks.push(tmp.trim()); tmp = w }
          else tmp += ' ' + w
        }
        cur = tmp.trim()
      } else cur = p
    } else cur += ' ' + p
  }
  if(cur) chunks.push(cur.trim())
  return chunks.filter(Boolean)
}

// فلاتر الاصوات الخمسة
function getVoiceFilter(voiceNum){
  switch(voiceNum){
    case 2: // بنت - نرفع النبرة شوي
      return 'asetrate=48000*1.28,aresample=48000,atempo=0.98,loudnorm'
    case 3: // طفل - نرفع النبرة كثير
      return 'asetrate=48000*1.55,aresample=48000,atempo=0.98,loudnorm'
    case 4: // عجوز / عميق - ننزل النبرة
      return 'asetrate=48000*0.72,aresample=48000,atempo=0.95,loudnorm'
    case 5: // روبوت - صدى + تشويش خفيف
      return 'aecho=0.8:0.7:40|60:0.3|0.25,atempo=0.95,loudnorm'
    case 1:
    default: // رجال طبيعي - اهدى واوضح
      return 'atempo=0.95,loudnorm'
  }
}

const VOICE_NAMES = {
  1: 'رجال 👨',
  2: 'بنت 👧',
  3: 'طفل 👶',
  4: 'عجوز / عميق 🧔',
  5: 'روبوت 🤖'
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }
  await react('🎙️')

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'bot-voice-'))
  const oggPath = path.join(tmpDir,'out.ogg')
  const videoPath = path.join(tmpDir,'in.mp4')

  try{
    // نعرف اي صوت اختار؟ صوت1 ولا صوت2...
    let voiceNum = 1
    let cmdMatch = (command || '').match(/صوت(\d)/)
    if(cmdMatch) voiceNum = parseInt(cmdMatch[1])
    if(voiceNum < 1 || voiceNum > 5) voiceNum = 1

    let input = (text || '').trim()
    let quoted = m.quoted

    // ===== فيديو الى صوت =====
    let isVideo = false
    if(quoted){
      let mime = quoted.mimetype || quoted.msg?.mimetype || ''
      if(mime.includes('video') || quoted.msg?.videoMessage) isVideo = true
    }
    if(isVideo){
      await m.reply(`سمعت، الحين بفصل الصوت من الفيديو... ⏳`)
      let videoBuffer = null
      try { videoBuffer = await conn.downloadMediaMessage(quoted) } catch {}
      if(!videoBuffer?.length && m.quoted?.download){ try{ videoBuffer = await m.quoted.download() }catch{} }
      if(!videoBuffer?.length) return m.reply('ما قدرت احمل الفيديو')
      fs.writeFileSync(videoPath, videoBuffer)
      await execAsync(FFMPEG, ['-y','-i', videoPath, '-vn', '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])
      const oggBuffer = fs.readFileSync(oggPath)
      await conn.sendMessage(m.chat, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
      await react('✅')
      return
    }

    // ===== كتابة الى صوت =====
    if(quoted && !input){
      let qText = quoted.text || quoted.body || quoted.msg?.conversation || quoted.msg?.extendedTextMessage?.text || ''
      if(qText) input = qText.trim()
    }

    if(!input) return m.reply(`*اختر صوت واكتب:*\n\n.صوت1 هلا والله - رجال 👨\n.صوت2 هلا والله - بنت 👧\n.صوت3 هلا والله - طفل 👶\n.صوت4 هلا والله - عجوز 🧔\n.صوت5 هلا والله - روبوت 🤖\n\nاو رد على اي كتابة واكتب .صوت1\nاو رد على اي فيديو واكتب .صوت1`)

    if(input.length > 3000) input = input.slice(0, 3000)

    let lang = /[\u0600-\u06FF]/.test(input) ? 'ar' : 'en'
    let chunks = splitText(input, 180)
    await m.reply(`بحول كلامك لصوت ${VOICE_NAMES[voiceNum]}... ثواني ⏳`)

    let files = []
    for(let i = 0; i < chunks.length; i++){
      let chunk = chunks[i]
      let mp3 = path.join(tmpDir, `part${i}.mp3`)
      try{
        const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(chunk)}&tl=${lang}&total=1&idx=0&textlen=${chunk.length}`
        const { data } = await axios.get(gUrl, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' } })
        fs.writeFileSync(mp3, Buffer.from(data))
        files.push(mp3)
      }catch(e){ console.log('chunk fail', i) }
      await new Promise(r => setTimeout(r, 250))
    }
    if(!files.length) throw new Error('فشل')

    let listPath = path.join(tmpDir, 'list.txt')
    let listContent = ''
    for(let f of files){
      let withSilence = f.replace('.mp3', '_s.mp3')
      try{
        await execAsync(FFMPEG, ['-y','-i', f, '-af', 'apad=pad_dur=0.4', withSilence])
        listContent += `file '${withSilence.replace(/\\/g,'/')}'\n`
      }catch{
        listContent += `file '${f.replace(/\\/g,'/')}'\n`
      }
    }
    fs.writeFileSync(listPath, listContent)
    let mergedMp3 = path.join(tmpDir, 'merged.mp3')
    await execAsync(FFMPEG, ['-y','-f','concat','-safe','0','-i', listPath, '-c','copy', mergedMp3])

    // تطبيق فلتر الصوت اللي اخترته
    let filter = getVoiceFilter(voiceNum)
    await execAsync(FFMPEG, ['-y','-i', mergedMp3, '-af', filter, '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])
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
handler.command = /^(صوت|صوت1|صوت2|صوت3|صوت4|صوت5|انطق|تكلم|قول)$/i
export default handler