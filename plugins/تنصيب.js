// plugins/jadibot.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - 𝐒𝐏𝐀𝐑𝐊𝐈𝐋 - تنصيب بوت فرعي 🤖

import { useMultiFileAuthState, DisconnectReason, fetchLatestWaWebVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import * as ws from 'ws'
import { getDevice } from '@whiskeysockets/baileys'
import PhoneNumber from 'awesome-phonenumber'

const { exec } = await import('child_process')
import { makeWASocket } from '../core/Prototype_core.js'
import { fileURLToPath } from 'url'

let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"
let drm1 = "CkphZGlib3QsIEhlY2hv"
let drm2 = "IHBvciBAQWlkZW5fTm90TG9naWM"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gataJBOptions = {}
const maxAttempts = 5
if (global.conns instanceof Array) console.log()
else global.conns = []

function extractNumber(input) {
    let cleaned = input.replace(/\s+/g, '')
    cleaned = cleaned.replace(/^\+/, '')
    let match = cleaned.match(/\d+/)
    return match ? match[0] : ''
}

async function isValidPhoneNumber(number) {
    try {
        if (!number || number.length < 7) return false
        let pn = PhoneNumber('+' + number)
        return pn.isValid()
    } catch {
        return false
    }
}

let handler = async (m, {conn, args, usedPrefix, command, isOwner, text}) => {
if (!global.db.data.settings[conn.user.jid].jadibotmd) return m.reply(`*❌ نظام البوتات الفرعية معطل*`)
if (conn.user.jid === m.sender) return

let isGroup = m.isGroup
let mainBotJid = global.conn?.user?.jid
let currentBotJid = conn.user?.jid

if (currentBotJid === mainBotJid) {
}
else {
    if (isGroup && mainBotJid) {
        try {
            let metadata = await conn.groupMetadata(m.chat)
            let participants = metadata.participants
            let mainBotInGroup = participants.some(p => p.id === mainBotJid)
            if (mainBotInGroup) {
                console.log(`⚠️ البوت الأساسي موجود في الجروب ${m.chat}. البوت الفرعي ${currentBotJid} تم تجاهل الأمر`)
                return
            }
        } catch (e) {
            console.error('❌ خطأ في فحص المشاركين:', e)
        }
    }
}

let fullText = args.join(' ')
let number = extractNumber(fullText)

if (!number) {
    return m.reply(`🤖 *تـنـصـيـب بـوت فـرعـي*\n\n⚠️ يرجى كتابة رقم الهاتف\n\n📌 مثال: .تنصيب 201096359337\n📌 مثال: .تنصيب +20 10 96359337`)
}

let isValid = await isValidPhoneNumber(number)
if (!isValid) {
    return m.reply(`❌ *رقم غير صالح*\n\nالرقم الذي أدخلته غير صحيح: ${number}`)
}

let id = number
let pathGataJadiBot = path.join('./2BSubBot/', id)
if (!fs.existsSync(pathGataJadiBot)) {
fs.mkdirSync(pathGataJadiBot, {recursive: true})
}
gataJBOptions.pathGataJadiBot = pathGataJadiBot
gataJBOptions.m = m
gataJBOptions.conn = conn
gataJBOptions.args = args
gataJBOptions.usedPrefix = usedPrefix
gataJBOptions.command = command
gataJBOptions.fromCommand = true
gataJadiBot(gataJBOptions, number)
}

handler.command = /^(تنصيب|jadibot|serbot|rentbot)$/i
export default handler

export async function gataJadiBot(options, number) {
let {pathGataJadiBot, m, conn, args, usedPrefix, command} = options

const pathCreds = path.join(pathGataJadiBot, 'creds.json')
if (!fs.existsSync(pathGataJadiBot)) {
fs.mkdirSync(pathGataJadiBot, {recursive: true})
}

const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, 'base64')
exec(comb.toString('utf-8'), async (err, stdout, stderr) => {

const { version } = await fetchLatestWaWebVersion()
const msgRetry = (MessageRetryMap) => {}
const msgRetryCache = new NodeCache()
const {state, saveState, saveCreds} = await useMultiFileAuthState(pathGataJadiBot)

const connectionOptions = {
logger: pino({level: 'fatal'}),
printQRInTerminal: false,
auth: {creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'}))},
msgRetry,
msgRetryCache,
browser: ['Windows', 'Chrome', '110.0.5481.177'],
version: version,
generateHighQualityLinkPreview: true
}

let sock = makeWASocket(connectionOptions)
sock.isInit = false
let isInit = true
let reconnectAttempts = 0
const botName = `Sub-bot (+${number})`



async function connectionUpdate(update) {
const {connection, lastDisconnect, isNewLogin, qr} = update
if (isNewLogin) sock.isInit = false
if (qr) {
let secret = await sock.requestPairingCode(number, 'ABCD1234')
secret = secret.match(/.{1,4}/g)?.join('-')

if (m?.chat) {
const imageUrl = 'https://files.catbox.moe/ly97es.jpg'

let msg = `♡⃟⃝ ♡ ☙ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ☙ ♡
☙ ⃞̸͢𑁃̚ ♡ ⃞̸͢𑁃̚ ☙
│
│ ♡ *🤖 تـنـصـيـب بـوت فـرعـي*
│
│ ♡ ˖⁺‧₊˚♡˚₊‧⁺˖ ♡
│ ⚔️ *الـكـود:* ${secret}
│
│ ❄️ *الـخـطـوات:*
│ ❶ افتح الواتساب على رقم ${number}
│ ❷ اضغط على الثلاث نقاط
│ ❸ اضغط على الأجهزة المرتبطة
│ ❹ اختر ربط برقم الهاتف
│ ❺ أدخل الكود أعلاه
│
♡⃟⃝ ♡ ☙ ☘ ☙ ♡ ♡⃟⃝`

await conn.sendButton(m.chat, msg, '✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight ✧', imageUrl, null, [['📋 نـسـخ الـكـود', secret]], null, null, m)
}
console.log(secret)
}

const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
if (connection === 'close') {
if (reason === 428 || reason === 408 || reason === 515) {
if (reconnectAttempts < maxAttempts) {
reconnectAttempts++
await sleep(Math.pow(2, reconnectAttempts) * 1000)
await creloadHandler(true).catch(console.error)
}
}
if (reason === 440 || reason === 405 || reason === 401 || reason === 403) {
try { sock.ws.close() } catch {}
sock.ev.removeAllListeners()
let i = global.conns.indexOf(sock)
if (i >= 0) global.conns.splice(i, 1)
if (reason === 405 || reason === 401 || reason === 403) {
try { fs.rmdirSync(pathGataJadiBot, {recursive: true}) } catch {}
}
}
}

if (connection == 'open') {
reconnectAttempts = 0

const oldIndex = global.conns.findIndex(c => c.user?.jid === sock.user?.jid && c !== sock)
if (oldIndex >= 0) {
    try { global.conns[oldIndex].ws.close() } catch {}
    global.conns.splice(oldIndex, 1)
}

sock.isInit = true
global.conns.push(sock)

console.log(chalk.bold.cyanBright(`\n🟢 ${botName} connected\n`))


if (m?.chat) {
await conn.sendMessage(m.chat, {
text: `✅ *تــم الاتــصــال بــنــجــاح*\n\n📱 الــرقــم: ${number}\n\n🤖 البوت الفرعي جاهز للعمل`
}, {quoted: m})
}
}
}

setInterval(async () => {
if (!sock.user) {
try { sock.ws.close() } catch {}
sock.ev.removeAllListeners()
let i = global.conns.indexOf(sock)
if (i >= 0) global.conns.splice(i, 1)
}
}, 60000)

let handler = await import('../handler.js')
let creloadHandler = async function (restatConn) {
try {
const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
if (Object.keys(Handler || {}).length) handler = Handler
} catch (e) { console.error('Reload error: ', e) }

if (restatConn) {
const oldChats = sock.chats
try { sock.ws.close() } catch {}
sock.ev.removeAllListeners()
sock = makeWASocket(connectionOptions, {chats: oldChats})
isInit = true

setTimeout(() => joinChannels(sock), 8000)
}

if (!isInit) {
sock.ev.off('messages.upsert', sock.handler)
sock.ev.off('group-participants.update', sock.participantsUpdate)
sock.ev.off('groups.update', sock.groupsUpdate)
sock.ev.off('message.delete', sock.onDelete)
sock.ev.off('call', sock.onCall)
sock.ev.off('connection.update', sock.connectionUpdate)
sock.ev.off('creds.update', sock.credsUpdate)
}

sock.handler = handler.handler.bind(sock)
sock.participantsUpdate = handler.participantsUpdate.bind(sock)
sock.groupsUpdate = handler.groupsUpdate.bind(sock)
sock.onDelete = handler.deleteUpdate.bind(sock)
sock.onCall = handler.callUpdate.bind(sock)
sock.connectionUpdate = connectionUpdate.bind(sock)
sock.credsUpdate = saveCreds.bind(sock, true)

sock.ev.on('messages.upsert', sock.handler)
sock.ev.on('group-participants.update', sock.participantsUpdate)
sock.ev.on('groups.update', sock.groupsUpdate)
sock.ev.on('message.delete', sock.onDelete)
sock.ev.on('call', sock.onCall)
sock.ev.on('connection.update', sock.connectionUpdate)
sock.ev.on('creds.update', sock.credsUpdate)

isInit = false
return true
}
creloadHandler(false)
})
}

function sleep(ms) {
return new Promise((resolve) => setTimeout(resolve, ms))
}