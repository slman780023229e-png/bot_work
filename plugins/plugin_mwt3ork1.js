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
 }catch{}
 return ''
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