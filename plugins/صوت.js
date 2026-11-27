import axios from 'axios'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'

const execAsync = promisify(execFile)
const FFMPEG = ffmpegPath

// ===== تحويل العامي الى فصحى =====
function toFusha(text){
  let t = text
  t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
  t = t.replace(/\s+/g, ' ').trim()
  const map = {
    'هلا والله': 'مرحباً بكم', 'هلا': 'مرحباً', 'كيفكم': 'كيف حالكم', 'كيفك': 'كيف حالك',
    'وش': 'ماذا', 'ايش': 'ماذا', 'سويتو': 'فعلتم', 'سويت': 'فعلت',
    'تبي': 'هل تريد', 'ابي': 'أريد', 'ابغى': 'أريد', 'عشان': 'من أجل', 'كذا': 'هكذا',
    'مرة': 'كثيراً', 'حلو': 'جميل', 'زين': 'جيد', 'تمام': 'حسناً', 'يلا': 'هيا بنا',
    'وين': 'أين', 'ليش': 'لماذا', 'الحين': 'الآن', 'بعدين': 'بعد ذلك', 'قبل شوي': 'قبل قليل',
    'انا': 'أنا', 'انت': 'أنت', 'احنا': 'نحن', 'كل شي': 'كل شيء', 'شي': 'شيء',
    'مافي': 'لا يوجد', 'عندي': 'لدي', 'خلاص': 'حسناً، انتهى الأمر', 'طيب': 'حسناً'
  }
  for(let k in map){ t = t.replace(new RegExp(k, 'g'), map[k]) }
  t = t.replace(/,+/g, '، ').replace(/\.+/g, '. ').replace(/\s+،/g, '،').replace(/\s+\./g, '.')
  if(!/[.!؟]$/.test(t.trim())) t = t.trim() + '.'
  return t.trim()
}

function splitText(text, max = 150){
  let parts = text.match(/[^.!؟\n،,]+[.!؟\n،,]?/g) || [text]
  let chunks = [], cur = ''
  for(let p of parts){
    p = p.trim(); if(!p) continue
    if((cur + ' ' + p).length > max){
      if(cur) chunks.push(cur.trim())
      if(p.length > max){
        let words = p.split(' '), tmp = ''
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

// ===== فلاتر تغيير الصوت - للحيوانات والشخصيات =====
function getChangeFilter(name){
  name = name.toLowerCase().trim()
  // سنجاب - صوت رفيع جداً وسريع
  if(name.includes('سنجاب') || name.includes('فار') || name.includes('chipmunk')) return 'asetrate=48000*2.2,aresample=48000,atempo=0.9,loudnorm'
  // خروف - صوت ثقيل ومبحوح وممطوط
  if(name.includes('خروف') || name.includes('غنم') || name.includes('معزة')) return 'asetrate=48000*0.6,aresample=48000,atempo=0.85,vibrato=f=5:d=0.4,loudnorm'
  // قط - صوت ناعم ورفيع
  if(name.includes('قط') || name.includes('قطة') || name.includes('بسة')) return 'asetrate=48000*1.5,aresample=48000,atempo=0.95,vibrato=f=8:d=0.2,loudnorm'
  // كلب - صوت خشن وثقيل
  if(name.includes('كلب')) return 'asetrate=48000*0.7,aresample=48000,atempo=0.9,acompressor, loudnorm'
  // طفل
  if(name.includes('طفل') || name.includes('بيبي') || name.includes('صغير')) return 'asetrate=48000*1.55,aresample=48000,atempo=0.95,loudnorm'
  // بنت
  if(name.includes('بنت') || name.includes('مراه') || name.includes('امراه') || name.includes('نساء') || name.includes('انثى')) return 'asetrate=48000*1.28,aresample=48000,atempo=0.95,loudnorm'
  // عجوز
  if(name.includes('عجوز') || name.includes('شايب') || name.includes('شيخ') || name.includes('كبير')) return 'asetrate=48000*0.72,aresample=48000,atempo=0.9,loudnorm'
  // وحش / شيطان
  if(name.includes('وحش') || name.includes('شيطان') || name.includes('مرعب') || name.includes('زومبي')) return 'asetrate=48000*0.5,aresample=48000,atempo=0.9,aecho=0.8:0.7:100:0.5,loudnorm'
  // روبوت
  if(name.includes('روبوت') || name.includes('الي') || name.includes('كمبيوتر')) return 'aecho=0.8:0.7:40|60:0.3|0.25,atempo=0.95,loudnorm'
  // بطيء
  if(name.includes('بطيء') || name.includes('بطيئ')) return 'atempo=0.6,loudnorm'
  // سريع
  if(name.includes('سريع')) return 'atempo=1.5,loudnorm'
  // رجال
  if(name.includes('رجال') || name.includes('رجل') || name.includes('ولد') || name.includes('شاب')) return 'asetrate=48000*0.85,aresample=48000,atempo=0.95,loudnorm'
  // افتراضي - سنجاب اذا كتب شي غريب
  return 'asetrate=48000*1.8,aresample=48000,atempo=0.95,loudnorm'
}

function getVoiceFilter(voiceNum){
  switch(voiceNum){
    case 2: return 'asetrate=48000*1.28,aresample=48000,atempo=0.88,loudnorm'
    case 3: return 'asetrate=48000*1.55,aresample=48000,atempo=0.88,loudnorm'
    case 4: return 'asetrate=48000*0.72,aresample=48000,atempo=0.88,loudnorm'
    case 5: return 'aecho=0.8:0.7:40|60:0.3|0.25,atempo=0.88,loudnorm'
    default: return 'atempo=0.88,loudnorm'
  }
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }
  await react('🎙️')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'bot-voice-'))
  const oggPath = path.join(tmpDir,'out.ogg')
  const inPath = path.join(tmpDir,'in.mp3')

  try{
    let input = (text || '').trim()
    let quoted = m.quoted

    // ===== ميزة 1: تغيير صوت فويس - رد على فويس وكتبت صوت سنجاب / خروف =====
    if(quoted){
      let qMime = quoted.mimetype || quoted.msg?.mimetype || ''
      let isAudio = qMime.includes('audio') || quoted.msg?.audioMessage || quoted.msg?.voiceMessage || quoted.ptt || quoted.audioMessage
      // اذا رديت على صوت وكتبت "صوت سنجاب" او "صوت خروف" او اي اسم
      if(isAudio && input && (input.startsWith('صوت') || input.startsWith('حول') || input.length < 30)){
        // شيل كلمة صوت من البداية، خذ الاسم بس
        let effectName = input.replace(/^(صوت|حول|غير)\s*/i, '').trim() || 'سنجاب'
        // لو كتب بس "صوت" بدون اسم، خليه سنجاب
        if(!effectName) effectName = 'سنجاب'

        let audioBuffer = null
        try { audioBuffer = await conn.downloadMediaMessage(quoted) } catch {}
        if(!audioBuffer?.length && m.quoted?.download){ try{ audioBuffer = await m.quoted.download() }catch{} }
        if(!audioBuffer?.length) return m.reply('لم أستطع تحميل الصوت')

        fs.writeFileSync(inPath, audioBuffer)
        let filter = getChangeFilter(effectName)
        await execAsync(FFMPEG, ['-y','-i', inPath, '-af', filter, '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])
        const oggBuffer = fs.readFileSync(oggPath)
        await conn.sendMessage(m.chat, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
        await react('✅')
        return
      }

      // ===== فيديو الى صوت =====
      let isVideo = qMime.includes('video') || quoted.msg?.videoMessage
      if(isVideo){
        let videoBuffer = null
        try { videoBuffer = await conn.downloadMediaMessage(quoted) } catch {}
        if(!videoBuffer?.length && m.quoted?.download){ try{ videoBuffer = await m.quoted.download() }catch{} }
        if(!videoBuffer?.length) return m.reply('لم أستطع تحميل الفيديو')
        let vPath = path.join(tmpDir,'in.mp4')
        fs.writeFileSync(vPath, videoBuffer)
        await execAsync(FFMPEG, ['-y','-i', vPath, '-vn', '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])
        const oggBuffer = fs.readFileSync(oggPath)
        await conn.sendMessage(m.chat, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
        await react('✅')
        return
      }
    }

    // ===== ميزة 2: كتابة الى صوت فصحى =====
    let voiceNum = 1
    let cmdMatch = (command || '').match(/صوت(\d)/)
    if(cmdMatch) voiceNum = parseInt(cmdMatch[1])
    if(voiceNum < 1 || voiceNum > 5) voiceNum = 1

    if(quoted && !input){
      let qText = quoted.text || quoted.body || quoted.msg?.conversation || quoted.msg?.extendedTextMessage?.text || ''
      if(qText) input = qText.trim()
    }

    if(!input) return m.reply(`*طريقة الاستخدام:*\n\n1- كتابة لصوت فصيح:\n.صوت1 مرحباً بكم\n\n2- تغيير صوت فويس:\nرد على فويس واكتب:\nصوت سنجاب\nصوت خروف\nصوت قط\nصوت وحش\n\n3- فيديو لصوت:\nرد على فيديو واكتب .صوت`)

    if(input.length > 3000) input = input.slice(0, 3000)
    let isArabic = /[\u0600-\u06FF]/.test(input)
    let fushaText = isArabic ? toFusha(input) : input
    let lang = isArabic ? 'ar' : 'en'
    let chunks = splitText(fushaText, 150)

    // بدون اي رسالة "سأحول" - يحول مباشر
    let files = []
    for(let i = 0; i < chunks.length; i++){
      let mp3 = path.join(tmpDir, `part${i}.mp3`)
      try{
        const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(chunks[i])}&tl=${lang}&total=1&idx=0&textlen=${chunks[i].length}`
        const { data } = await axios.get(gUrl, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' } })
        fs.writeFileSync(mp3, Buffer.from(data))
        files.push(mp3)
      }catch{}
      await new Promise(r => setTimeout(r, 250))
    }
    if(!files.length) throw new Error('فشل')

    let listPath = path.join(tmpDir, 'list.txt')
    let listContent = ''
    for(let f of files){
      let withSilence = f.replace('.mp3', '_s.mp3')
      try{
        await execAsync(FFMPEG, ['-y','-i', f, '-af', 'apad=pad_dur=0.6', withSilence])
        listContent += `file '${withSilence.replace(/\\/g,'/')}'\n`
      }catch{ listContent += `file '${f.replace(/\\/g,'/')}'\n` }
    }
    fs.writeFileSync(listPath, listContent)
    let mergedMp3 = path.join(tmpDir, 'merged.mp3')
    await execAsync(FFMPEG, ['-y','-f','concat','-safe','0','-i', listPath, '-c','copy', mergedMp3])
    let filter = getVoiceFilter(voiceNum)
    await execAsync(FFMPEG, ['-y','-i', mergedMp3, '-af', filter, '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])
    const oggBuffer = fs.readFileSync(oggPath)
    await conn.sendMessage(m.chat, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
    await react('✅')

  }catch(e){
    console.error(e)
    await react('❌')
  }finally{
    try{ fs.rmSync(tmpDir,{recursive:true,force:true}) }catch{}
  }
}

handler.help = ['صوت']
handler.tags = ['audio']
handler.command = /^(صوت|صوت1|صوت2|صوت3|صوت4|صوت5|انطق|تكلم|قول)$/i
export default handler