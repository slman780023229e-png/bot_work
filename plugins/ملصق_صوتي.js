import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'

const execAsync = promisify(execFile)
const FFMPEG = ffmpegPath

const handler = async (m, { conn, usedPrefix }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }
  if(!m.quoted){
    return m.reply(`ارسل فيديو فيه صوت، بعدين رد عليه بـ:\n${usedPrefix}ملصق_صوتي`)
  }
  await react('⏳')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'arthur-sound-'))
  try{
    const videoBuffer = await m.quoted.download()
    if(!videoBuffer?.length) throw new Error('ما قدرت احمل الفيديو')
    const videoPath = path.join(tmpDir,'video.mp4')
    fs.writeFileSync(videoPath, videoBuffer)

    // فحص الصوت
    let hasAudio = true
    try{
      const probe = await execAsync(FFMPEG, ['-i', videoPath]).catch(e=>e)
      const out = (probe.stdout||'') + (probe.stderr||'') + (probe.message||'')
      if(!out.includes('Audio:')) hasAudio = false
    }catch{}
    if(!hasAudio) throw new Error('هذا الفيديو ما فيه صوت اصلا، ارسل فيديو فيه صوت.')

    const stickerWebp = path.join(tmpDir,'sticker.webp')
    const soundMp3 = path.join(tmpDir,'sound.mp3')
    const soundOgg = path.join(tmpDir,'sound.ogg')

    // 1. ملصق متحرك 512x512 - 5 ثواني
    await execAsync(FFMPEG, ['-y','-i',videoPath,'-t','5','-vf','scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15','-c:v','libwebp','-lossless','0','-quality','70','-loop','0','-an', stickerWebp])

    // 2. صوت 5 ثواني MP3
    await execAsync(FFMPEG, ['-y','-i',videoPath,'-t','5','-vn','-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','128k', soundMp3])

    // 3. نفس الصوت بصيغة OGG عشان يرسل كـ فويس
    await execAsync(FFMPEG, ['-y','-i',videoPath,'-t','5','-vn','-c:a','libopus','-b:a','128k', soundOgg])

    const stickerBuf = fs.readFileSync(stickerWebp)
    const soundBuf = fs.readFileSync(soundOgg)
    if(soundBuf.length < 1000) throw new Error('الصوت طلع فاضي.')

    // === الارسال بدون حزمة ===
    // اول شي الملصق عادي في الشات
    await conn.sendMessage(m.chat, { sticker: stickerBuf }, { quoted: m })

    // بعدها الصوت مباشرة كـ فويس، عشان تسمعه مع الملصق
    await conn.sendMessage(m.chat, { audio: soundBuf, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })

    await react('✅')
    await m.reply(`تم ✅\nوصلك الملصق متحرك + صوت الفيديو تحته 🔊`)
  }catch(e){
    console.error(e); await react('❌'); await m.reply(`فشل: ${e.message}`)
  }finally{ try{ fs.rmSync(tmpDir,{recursive:true,force:true}) }catch{} }
}

handler.help = ['ملصق_صوتي']
handler.tags = ['sticker']
handler.command = /^(ملصق_صوتي|ملصق_صوتي|صوتي)$/i
export default handler