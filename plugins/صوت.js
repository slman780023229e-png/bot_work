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

  // شيل الايموجي والرموز
  t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
  t = t.replace(/[😂🤣❤️🔥✨👍🙏😅😍]/g, '')
  t = t.replace(/\s+/g, ' ').trim()

  const map = {
    'هلا والله': 'مرحباً بكم',
    'هلا': 'مرحباً',
    'كيفكم': 'كيف حالكم',
    'كيفك': 'كيف حالك',
    'وش': 'ماذا',
    'ايش': 'ماذا',
    'سويتو': 'فعلتم',
    'سويت': 'فعلت',
    'سويتوا': 'فعلتم',
    'تبي': 'هل تريد',
    'تبين': 'هل تريدين',
    'ابي': 'أريد',
    'ابغى': 'أريد',
    'عشان': 'من أجل',
    'عشان كذا': 'لذلك',
    'كذا': 'هكذا',
    'مرة': 'كثيراً',
    'مره': 'كثيراً',
    'حلو': 'جميل',
    'حلوه': 'جميلة',
    'زين': 'جيد',
    'تمام': 'حسناً',
    'يلا': 'هيا بنا',
    'يله': 'هيا بنا',
    'تعال': 'تعال',
    'روح': 'اذهب',
    'جيت': 'أتيت',
    'راح': 'ذهب',
    'جلسنا': 'جلسنا',
    'نسولف': 'نتحدث',
    'سولف': 'تحدث',
    'وين': 'أين',
    'ليش': 'لماذا',
    'متى': 'متى',
    'الحين': 'الآن',
    'دحين': 'الآن',
    'بعدين': 'بعد ذلك',
    'قبل شوي': 'قبل قليل',
    'تو': 'الآن',
    'انا': 'أنا',
    'انت': 'أنت',
    'انتي': 'أنتِ',
    'احنا': 'نحن',
    'هم': 'هم',
    'هذا': 'هذا',
    'هذي': 'هذه',
    'ذي': 'هذه',
    'ذا': 'هذا',
    'كل شي': 'كل شيء',
    'كلشي': 'كل شيء',
    'اشياء': 'أشياء',
    'شي': 'شيء',
    'وايد': 'كثيراً',
    'بسرعه': 'بسرعة',
    'شوي': 'قليلاً',
    'كثير': 'كثيراً',
    'مافي': 'لا يوجد',
    'مافيه': 'لا يوجد فيه',
    'فيه': 'فيه',
    'عندك': 'لديك',
    'عندي': 'لدي',
    'قاعد': 'جالس',
    'قاعدين': 'جالسون',
    'خلاص': 'حسناً، انتهى الأمر',
    'طيب': 'حسناً',
    'اوكي': 'حسناً',
    'تماماً': 'تماماً'
  }

  for(let k in map){
    let re = new RegExp(k, 'g')
    t = t.replace(re, map[k])
  }

  // رتب الفواصل والنقاط
  t = t.replace(/,+/g, '، ')
  t = t.replace(/\.+/g, '. ')
  t = t.replace(/\s+،/g, '،')
  t = t.replace(/\s+\./g, '.')
  t = t.replace(/\?+/g, '؟ ')
  t = t.replace(/!+/g, '! ')

  // اذا ما فيه نقطة في الاخير، حط نقطة
  if(!/[.!؟]$/.test(t.trim())) t = t.trim() + '.'

  // اول حرف كبير
  return t.trim()
}

function splitText(text, max = 150){
  let parts = text.match(/[^.!؟\n،,]+[.!؟\n،,]?/g) || [text]
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

function getVoiceFilter(voiceNum){
  switch(voiceNum){
    case 2: return 'asetrate=48000*1.28,aresample=48000,atempo=0.88,loudnorm'
    case 3: return 'asetrate=48000*1.55,aresample=48000,atempo=0.88,loudnorm'
    case 4: return 'asetrate=48000*0.72,aresample=48000,atempo=0.88,loudnorm'
    case 5: return 'aecho=0.8:0.7:40|60:0.3|0.25,atempo=0.88,loudnorm'
    case 1:
    default: return 'atempo=0.88,loudnorm' // بطيء وواضح، عشان يفتهم
  }
}

const VOICE_NAMES = {
  1: 'رجال فصيح 👨',
  2: 'بنت فصيحة 👧',
  3: 'طفل فصيح 👶',
  4: 'عجوز فصيح 🧔',
  5: 'روبوت فصيح 🤖'
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }
  await react('🎙️')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'bot-voice-'))
  const oggPath = path.join(tmpDir,'out.ogg')
  const videoPath = path.join(tmpDir,'in.mp4')

  try{
    let voiceNum = 1
    let cmdMatch = (command || '').match(/صوت(\d)/)
    if(cmdMatch) voiceNum = parseInt(cmdMatch[1])
    if(voiceNum < 1 || voiceNum > 5) voiceNum = 1

    let input = (text || '').trim()
    let quoted = m.quoted

    let isVideo = false
    if(quoted){
      let mime = quoted.mimetype || quoted.msg?.mimetype || ''
      if(mime.includes('video') || quoted.msg?.videoMessage) isVideo = true
    }
    if(isVideo){
      await m.reply(`سأفصل الصوت من الفيديو الآن...`)
      let videoBuffer = null
      try { videoBuffer = await conn.downloadMediaMessage(quoted) } catch {}
      if(!videoBuffer?.length && m.quoted?.download){ try{ videoBuffer = await m.quoted.download() }catch{} }
      if(!videoBuffer?.length) return m.reply('لم أستطع تحميل الفيديو')
      fs.writeFileSync(videoPath, videoBuffer)
      await execAsync(FFMPEG, ['-y','-i', videoPath, '-vn', '-c:a','libopus','-b:a','128k','-ar','48000','-ac','1', oggPath])
      const oggBuffer = fs.readFileSync(oggPath)
      await conn.sendMessage(m.chat, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
      await react('✅')
      return
    }

    if(quoted && !input){
      let qText = quoted.text || quoted.body || quoted.msg?.conversation || quoted.msg?.extendedTextMessage?.text || ''
      if(qText) input = qText.trim()
    }

    if(!input) return m.reply(`*اختر صوتاً واكتب بالفصحى:*\n\n.صوت1 مرحباً بكم، كيف حالكم؟ - رجال 👨\n.صوت2 مرحباً بكم، كيف حالكم؟ - بنت 👧\n.صوت3 مرحباً بكم، كيف حالكم؟ - طفل 👶\n.صوت4 مرحباً بكم، كيف حالكم؟ - عجوز 🧔\n.صوت5 مرحباً بكم، كيف حالكم؟ - روبوت 🤖\n\nأو رد على أي كتابة واكتب .صوت1\nأو رد على أي فيديو واكتب .صوت1`)

    if(input.length > 3000) input = input.slice(0, 3000)

    // ===== تحويل للفصحى قبل النطق =====
    let isArabic = /[\u0600-\u06FF]/.test(input)
    let fushaText = input
    if(isArabic){
      fushaText = toFusha(input)
    }

    let lang = isArabic ? 'ar' : 'en'
    let chunks = splitText(fushaText, 150)
    await m.reply(`سأحول كلامك إلى صوت ${VOICE_NAMES[voiceNum]} باللغة العربية الفصحى...\n\nالنص بعد الترتيب:\n"${fushaText}"`)

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
      await new Promise(r => setTimeout(r, 300))
    }
    if(!files.length) throw new Error('فشل')

    let listPath = path.join(tmpDir, 'list.txt')
    let listContent = ''
    for(let f of files){
      let withSilence = f.replace('.mp3', '_s.mp3')
      try{
        // وقفة 0.6 ثانية بين الجمل، عشان يصير مرتب وجميل
        await execAsync(FFMPEG, ['-y','-i', f, '-af', 'apad=pad_dur=0.6', withSilence])
        listContent += `file '${withSilence.replace(/\\/g,'/')}'\n`
      }catch{
        listContent += `file '${f.replace(/\\/g,'/')}'\n`
      }
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
    await m.reply(`لم ينجح الأمر، حاول مرة أخرى`)
  }finally{
    try{ fs.rmSync(tmpDir,{recursive:true,force:true}) }catch{}
  }
}

handler.help = ['صوت']
handler.tags = ['audio']
handler.command = /^(صوت|صوت1|صوت2|صوت3|صوت4|صوت5|انطق|تكلم|قول)$/i
export default handler