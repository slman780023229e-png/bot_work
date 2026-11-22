let handler  = async (m, { conn }) => { 
 let name = conn.getName(m.sender) 
 let teks = ` 
 ${pickRandom([`*زوجي🎀😽*
`])} 
 `.trim() 
 conn.reply(m.chat, teks, m, { mentions: { mentionedJid: [m.sender] }}) 
 } 
 handler.customPrefix = /(مراتي)/i 
 handler.command = new RegExp 
 handler.rowner = true;

 export default handler 

 function pickRandom(list) { 
 return list[Math.floor(Math.random() * list.length)] 
 }