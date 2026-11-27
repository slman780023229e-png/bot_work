import crypto from 'crypto'
import https from 'https'
import JSZip from 'jszip'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'

const execAsync = promisify(execFile)
const FFMPEG = ffmpegPath

function sha256(b){ return crypto.createHash('sha256').update(b).digest() }
function base64url(b){ return Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'') }
function encryptMedia(buffer, mediaKey, hkdfInfo){
  const expanded = Buffer.from(crypto.hkdfSync('sha256', mediaKey, Buffer.alloc(32), Buffer.from(hkdfInfo), 112))
  const iv = expanded.subarray(0,16), cipherKey = expanded.subarray(16,48), macKey = expanded.subarray(48,80)
  const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv)
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  const mac = crypto.createHmac('sha256', macKey).update(iv).update(encrypted).digest().subarray(0,10)
  const enc = Buffer.concat([encrypted, mac])
  return { encryptedBuffer: enc, fileSha256: sha256(buffer), fileEncSha256: sha256(enc) }
}
async function uploadMedia(conn, buffer, mediaPath, hkdfInfo){
  const mediaKey = crypto.randomBytes(32)
  const encrypted = encryptMedia(buffer, mediaKey, hkdfInfo)
  const iq = await conn.query({ tag:'iq', attrs:{ id: conn.generateMessageTag?.() || Date.now().toString(), to:'s.whatsapp.net', type:'set', xmlns:'w:m' }, content:[{ tag:'media_conn', attrs:{} }] })
  const mediaConn = iq.content?.find(v=>v.tag==='media_conn')
  const auth = mediaConn.attrs?.auth
  const hosts = (mediaConn.content||[]).filter(v=>v.tag==='host').map(v=>v.attrs?.hostname).filter(Boolean)
  const token = base64url(encrypted.fileEncSha256)
  for(const host of hosts){
    try{
      const url = new URL(`https://${host}${mediaPath}/${token}?auth=${encodeURIComponent(auth)}&token=${token}`)
      const result = await new Promise((resolve,reject)=>{
        const req = https.request({ hostname:url.hostname, port:443, path:url.pathname+url.search, method:'POST', timeout:60000, headers:{ Origin:'https://web.whatsapp.com', Referer:'https://web.whatsapp.com/', 'Content-Type':'application/octet-stream', 'Content-Length': encrypted.encryptedBuffer.length }}, res=>{
          const chunks=[]; res.on('data',c=>chunks.push(c)); res.on('end',()=>{ const body=Buffer.concat(chunks).toString(); if(res.statusCode<200||res.statusCode>=300) return reject(new Error(`Upload ${res.statusCode}`)); try{ resolve(JSON.parse(body)) }catch{ reject(new Error('Upload bad')) } })
        }); req.on('error',reject); req.end(encrypted.encryptedBuffer)
      })
      const directPath = result.direct_path || result.directPath || result.path
      if(!directPath) continue
      return { mediaKey, fileLength: buffer.length, fileSha256: encrypted.fileSha256, fileEncSha256: encrypted.fileEncSha256, directPath }
    }catch(e){ console.log('[UPLOAD]', e.message) }
  }
  throw new Error('فشل الرفع')
}

const handler = async (m, { conn, usedPrefix }) => {
  const react = async(e)=>{ try{ await conn.sendMessage(m.chat,{react:{text:e,key:m.key}}) }catch{} }
  if(!m.quoted){
    return m.reply(`ارسل فيديو، بعدين رد عليه بـ:\n${usedPrefix}ملصق_صوتي`)
  }
  await react('⏳')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'arthur-sound-'))
  try{
    const videoBuffer = await m.quoted.download()
    if(!videoBuffer?.length) throw new Error('ما قدرت احمل الفيديو')
    const videoPath = path.join(tmpDir,'video.mp4')
    fs.writeFileSync(videoPath, videoBuffer)
    const stickerWebp = path.join(tmpDir,'sticker_001.webp')
    const soundMp3 = path.join(tmpDir,'sound_001.mp3')
    await execAsync(FFMPEG, ['-y','-i',videoPath,'-t','5','-vf','scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15','-c:v','libwebp','-lossless','0','-quality','65','-loop','0', stickerWebp])
    await execAsync(FFMPEG, ['-y','-i',videoPath,'-t','5','-vn','-c:a','libmp3lame','-q:a','4', soundMp3])
    const stickerBuf = fs.readFileSync(stickerWebp)
    if(!fs.existsSync(soundMp3)) throw new Error('هذا الفيديو ما فيه صوت، ارسل فيديو فيه صوت.')
    const soundBuf = fs.readFileSync(soundMp3)
    const trayBuf = await sharp(stickerBuf).resize(96,96,{fit:'cover'}).webp({quality:75}).toBuffer()
    const thumbBuf = await sharp(trayBuf).resize(252,252,{fit:'cover'}).jpeg({quality:80}).toBuffer()
    const zip = new JSZip()
    zip.file('sticker_001.webp', stickerBuf)
    zip.file('sound_001.mp3', soundBuf)
    zip.file('tray_icon.webp', trayBuf)
    const archive = await zip.generateAsync({ type:'nodebuffer', compression:'STORE' })
    const packUpload = await uploadMedia(conn, archive, '/mms/sticker-pack', 'WhatsApp Sticker Pack Keys')
    const thumbUpload = await uploadMedia(conn, thumbBuf, '/mms/thumbnail-sticker-pack', 'WhatsApp Sticker Pack Thumbnail Keys')
    const packId = 'ARTHUR_SOUND_' + crypto.randomUUID()
    const message = {
      messageContextInfo:{ messageSecret: crypto.randomBytes(32) },
      stickerPackMessage:{
        stickerPackId: packId,
        name: `ARTHUR SOUND`,
        publisher: 'ARTHUR BOT',
        packDescription: `ملصق صوتي`,
        stickers:[{ fileName:'sticker_001.webp', isAnimated:true, emojis:['🔊'], accessibilityLabel:'', isLottie:false, mimetype:'image/webp', soundFileName:'sound_001.mp3', hasSound:true }],
        fileLength: packUpload.fileLength, fileSha256: packUpload.fileSha256, fileEncSha256: packUpload.fileEncSha256, mediaKey: packUpload.mediaKey, directPath: packUpload.directPath,
        mediaKeyTimestamp: Math.floor(Date.now()/1000), stickerPackSize: packUpload.fileLength, stickerPackOrigin: 2, trayIconFileName:'tray_icon.webp',
        thumbnailDirectPath: thumbUpload.directPath, thumbnailSha256: thumbUpload.fileSha256, thumbnailEnc256: thumbUpload.fileSha256, thumbnailHeight:252, thumbnailWidth:252, imageDataHash: thumbUpload.fileSha256.toString('base64')
      }
    }
    await conn.relayMessage(m.chat, message, { messageId: crypto.randomBytes(10).toString('hex') })
    await react('✅')
    await m.reply(`تم ✅\nاضغط على الملصق لتسمع نفس صوت الفيديو 🔊`)
  }catch(e){
    console.error(e); await react('❌'); await m.reply(`فشل: ${e.message}`)
  }finally{ try{ fs.rmSync(tmpDir,{recursive:true,force:true}) }catch{} }
}

handler.help = ['ملصق_صوتي']
handler.tags = ['sticker']
handler.command = /^(ملصق_صوتي|ملصق_صوتي|صوتي)$/i
export default handler