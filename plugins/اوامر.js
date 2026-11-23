// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - يقرا تلقائي + الضغطة تثبت ✧
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ownerNumber = '967780023229'
const channelUrl = 'https://whatsapp.com/channel/0029XXXXXXXX'
const MENU_IMAGE = 'https://n.uguu.se/xhgiNqAmQfvh.jpg'

const Q_NAMES = { 'ق1':'الجروبات والمشرفين','ق2':'التحميلات','ق3':'الترفيه والتسلية','ق4':'الألعاب','ق5':'النقابات','ق6':'الأدوات','ق7':'الإيديت والأغاني' }
const normalize = s => String(s||'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').toLowerCase().trim()

async function getAllSections(){
  let files = fs.readdirSync(__dirname).filter(f=>f.endsWith('.js') && f!=='اوامر.js')
  let grouped = {}
  let qFound = new Set()
  for(let f of files){
    let content = fs.readFileSync(path.join(__dirname,f),'utf-8')
    let qm = content.match(/ق\s*\d+/g)
    if(qm) qm.forEach(x=>qFound.add(x.replace(/\s+/g,'')))
    if(f.match(/^ق\d+\.js$/)) continue
    try{
      const mod = await import(`./${f}?t=${Date.now()}`)
      const p = mod?.default
      if(!p?.command) continue
      let cat = p.tags?.[0] || p.category || 'أخرى'
      if(!grouped[cat]) grouped[cat]=[]
      let cmds = Array.isArray(p.command) ? p.command : [p.command.source?.replace(/[^\w\u0600-\u06FF]+/g,' ')||p.command]
      cmds.forEach(c=>{
        c=String(c).split(' ')[0].replace(/[^a-zA-Z0-9\u0600-\u06FF]/g,'')
        if(c.length>1 && !/^ق\d+$/.test(c) && !grouped[cat].includes(c)) grouped[cat].push(c)
      })
    }catch{}
  }
  return { grouped, qFound:[...qFound] }
}

async function getImageMedia(conn){
  try{
    let url = MENU_IMAGE
    let f = path.join(__dirname,'menu-url.txt')
    if(fs.existsSync(f)){ let s=fs.readFileSync(f,'utf-8').trim(); if(s.startsWith('https://')) url=s }
    const res = await fetch(url,{signal:AbortSignal.timeout(7000)})
    const buf = Buffer.from(await res.arrayBuffer())
    return await prepareWAMessageMedia({image:buf},{upload:conn.waUploadToServer})
  }catch{ return null }
}

async function showMenu(conn,m){
  try{await conn.sendMessage(m.chat,{react:{text:'⚡',key:m.key}})}catch{}
  const user = m.pushName||'مستخدم'
  const { grouped, qFound } = await getAllSections()
  const rows = []
  for(let q of qFound) rows.push({header:'👑',title:Q_NAMES[q]||q,description:`قسم ${q}`,id:`.${q}`})
  for(let cat of Object.keys(grouped)) rows.push({header:'📂',title:cat.slice(0,24),description:`${grouped[cat].length} أمر`,id:`.قسم ${cat}`})
  const media = await getImageMedia(conn)
  const text = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n⚡ أهلا بك يا ${user}\n✦ ${qFound.length} قسم ثابت | ${Object.keys(grouped).length} قسم تلقائي\n✦ ${Object.values(grouped).flat().length} أمر\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
  const header = media?.imageMessage ? {title:'𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓',hasMediaAttachment:true,imageMessage:media.imageMessage} : {title:'𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓'}
  const interactiveMessage = { body:{text}, footer:{text:'✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦'}, header, nativeFlowMessage:{ buttons:[ {name:'single_select',buttonParamsJson:JSON.stringify({title:'📂 قائمة الأوامر',sections:[{title:'𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓',rows:rows.slice(0,10)}]})}, {name:'cta_url',buttonParamsJson:JSON.stringify({display_text:'👑 المطور',url:`https://wa.me/${ownerNumber}`})}, {name:'cta_url',buttonParamsJson:JSON.stringify({display_text:'📢 القناة',url:channelUrl})} ], messageParamsJson:'' } }
  const msg = generateWAMessageFromContent(m.chat,{viewOnceMessage:{message:{interactiveMessage:proto.Message.InteractiveMessage.fromObject(interactiveMessage)}}},{userJid:conn.user.jid,quoted:m})
  await conn.relayMessage(m.chat,msg.message,{messageId:msg.key.id})
}

function getClickId(m){
 try{
  if(m.message?.listResponseMessage?.singleSelectReply?.selectedRowId) return m.message.listResponseMessage.singleSelectReply.selectedRowId
  let n = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
  if(n){ let p=JSON.parse(n); return p.id || p.selectedRowId || '' }
  if(m.message?.interactiveResponseMessage?.body?.text) return m.message.interactiveResponseMessage.body.text
  if(m.message?.viewOnceMessage?.message?.interactiveResponseMessage?.body?.text) return m.message.viewOnceMessage.message.interactiveResponseMessage.body.text
  if(m.message?.viewOnceMessageV2?.message?.interactiveResponseMessage?.body?.text) return m.message.viewOnceMessageV2.message.interactiveResponseMessage.body.text
  if(m.message?.viewOnceMessageV2?.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson){
   let p=JSON.parse(m.message.viewOnceMessageV2.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)
   return p.id || ''
  }
 }catch{} return ''
}

let handler = async (m,{conn,text})=>{
  if(text && /^قسم/i.test(text)){
    let cat=text.replace(/^\.?قسم\s*/i,'').trim()
    let {grouped}=await getAllSections()
    let found = Object.keys(grouped).find(k=>normalize(k)===normalize(cat)) || cat
    let cmds=grouped[found]||[]
    return conn.sendMessage(m.chat,{text:`*${found}*\n\n${cmds.map(c=>`• .${c}`).join('\n')}`},{quoted:m})
  }
  return showMenu(conn,m)
}

handler.before = async (m)=>{
  let id = String(getClickId(m)||'').trim()
  if(!id) return
  console.log('[ضغطة]', id)
  if(/^\.?ق\d+$/i.test(id)){
    let cmd=id.replace(/\s+/g,''); if(!cmd.startsWith('.')) cmd='.'+cmd
    m.text=cmd; m.body=cmd; return
  }
  if(id.length<50 && !id.startsWith('http')){
    let cmd = id.startsWith('.قسم') ? id : `.قسم ${id}`
    m.text=cmd; m.body=cmd
  }
}
handler.all = handler.before
handler.help=['اوامر']; handler.tags=['main']; handler.command=/^(اوامر|قسم|ق)$/i
export default handler