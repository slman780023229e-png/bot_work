// plugins/jadibot.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - تنصيب بوت فرعي - كود ثابت ARTHUR78 🤖

import { useMultiFileAuthState, DisconnectReason, fetchLatestWaWebVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import { makeWASocket } from '../core/Prototype_core.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gataJBOptions = {}
const maxAttempts = 5
if (!(global.conns instanceof Array)) global.conns = []

// ✅ الكود الثابت حقك
const FIXED_CODE = 'ARTHUR78' // ارثر + 78

function extractNumber(input) {
    let cleaned = String(input || '').replace(/[\s\-\(\)\.]/g, '')
    cleaned = cleaned.replace(/^\+/, '').replace(/^00/, '')
    let match = cleaned.match(/\d+/)
    return match ? match[0] : ''
}

function isValidPhoneNumber(number) {
    if (!number) return false
    number = String(number).replace(/\D/g, '')
    if (number.length < 7 || number.length > 15) return false
    if (/^(\d)\1+$/.test(number)) return false
    return true
}

let handler = async (m, { conn, args, usedPrefix, command, text }) => {
    try {
        let jadibotOn = true
        try {
            let s = global.db?.data?.settings?.[conn.user.jid]
            if (s && typeof s.jadibotmd !== 'undefined') jadibotOn = s.jadibotmd
        } catch {}
        if (!jadibotOn) return m.reply(`*❌ نظام البوتات الفرعية معطل*`)
        if (conn.user.jid === m.sender) return

        let isGroup = m.isGroup
        let mainBotJid = global.conn?.user?.jid
        let currentBotJid = conn.user?.jid

        if (currentBotJid !== mainBotJid && isGroup && mainBotJid) {
            try {
                let metadata = await conn.groupMetadata(m.chat)
                let mainBotInGroup = metadata.participants.some(p => p.id === mainBotJid)
                if (mainBotInGroup) return
            } catch {}
        }

        let fullText = args.join(' ') || (text || '')
        let number = extractNumber(fullText)

        // ✅ جديد: اذا ما كتب رقم، خذ رقم اللي ارسل الرسالة (اي شخص)
        if (!number) {
            let senderRaw = 
                m.key?.participantPn ||
                m.participantPn ||
                m.sender ||
                m.key?.participant ||
                ''

            let senderNum = String(senderRaw).split('@')[0].split(':')[0]
            senderNum = senderNum.replace(/\D/g, '')

            // اذا طلع LID (رقم وهمي طويل) حاول تجيب الرقم الحقيقي
            if (senderNum.length > 15 || senderNum.startsWith('0')) {
                try {
                    let meta = await conn.groupMetadata(m.chat).catch(() => null)
                    let p = meta?.participants?.find(x => x.id === m.sender || x.lid === m.sender)
                    if (p?.pn) senderNum = String(p.pn).split('@')[0].replace(/\D/g, '')
                } catch {}
            }

            number = extractNumber(senderNum)

            if (number && isValidPhoneNumber(number)) {
                await m.reply(`🤖 *تم اخذ رقمك تلقائياً:* ${number}\n⏳ جاري تجهيز البوت الفرعي لك...`)
            } else {
                number = ''
            }
        }

        if (!number) {
            return m.reply(`🤖 *تـنـصـيـب بـوت فـرعـي*\n\n⚠️ ما قدرت اقرأ رقمك تلقائياً\n\n📌 مثال: ${usedPrefix + command} 967780023229\n\n💡 او اكتب ${usedPrefix + command} فقط وبياخذ رقمك تلقائياً`)
        }
        if (!isValidPhoneNumber(number)) {
            return m.reply(`❌ *رقم غير صالح:* ${number}`)
        }

        let id = number
        let pathGataJadiBot = path.join('./2BSubBot/', id)
        if (!fs.existsSync(pathGataJadiBot)) fs.mkdirSync(pathGataJadiBot, { recursive: true })

        gataJBOptions.pathGataJadiBot = pathGataJadiBot
        gataJBOptions.m = m
        gataJBOptions.conn = conn
        gataJBOptions.args = args
        gataJBOptions.usedPrefix = usedPrefix
        gataJBOptions.command = command
        gataJBOptions.fromCommand = true
        await m.reply(`⏳ *جاري تجهيز البوت الفرعي للرقم:* ${number}\n\n🔑 الكود بيكون: *${FIXED_CODE}*`)
        gataJadiBot(gataJBOptions, number)
    } catch (e) {
        return m.reply(`❌ خطأ: ${e.message}`)
    }
}

handler.command = /^(تنصيب|jadibot|serbot|rentbot|subbot|بوت_فرعي)$/i
export default handler

export async function gataJadiBot(options, number) {
    let { pathGataJadiBot, m, conn } = options
    if (!fs.existsSync(pathGataJadiBot)) fs.mkdirSync(pathGataJadiBot, { recursive: true })

    try {
        const { version } = await fetchLatestWaWebVersion()
        const msgRetry = (MessageRetryMap) => {}
        const msgRetryCache = new NodeCache()
        const { state, saveState, saveCreds } = await useMultiFileAuthState(pathGataJadiBot)

        const connectionOptions = {
            logger: pino({ level: 'fatal' }),
            printQRInTerminal: false,
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
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
            const { connection, lastDisconnect, isNewLogin, qr } = update
            if (isNewLogin) sock.isInit = false
            if (qr) {
                try {
                    // ✅ الكود الثابت ARTHUR78 - ارثر + 78
                    let secret = ''
                    try {
                        secret = await sock.requestPairingCode(number, FIXED_CODE)
                        console.log('[jadibot] تم طلب الكود الثابت ARTHUR78 للرقم', number)
                    } catch (e) {
                        console.log('[jadibot] واتساب رفض الكود الثابت، بجيب كود عشوائي:', e.message)
                        secret = await sock.requestPairingCode(number)
                    }
                    secret = secret?.match(/.{1,4}/g)?.join('-') || secret

                    if (m?.chat) {
                        const imageUrl = 'https://files.catbox.moe/ly97es.jpg'
                        let msg = `♡⃟⃝ ♡ ☙ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ☙ ♡
☙ ⃞̸͢𑁃̚ ♡ ⃞̸͢𑁃̚ ☙
│
│ ♡ *🤖 تـنـصـيـب بـوت فـرعـي*
│
│ ♡ ˖⁺‧₊˚♡˚₊‧⁺˖ ♡
│ ⚔️ *الـكـود:* ${secret}
│ 🔑 الكود الثابت: ${FIXED_CODE}
│
│ ❄️ *الـخـطـوات:*
│ ❶ افتح الواتساب على رقم ${number}
│ ❷ اضغط على الثلاث نقاط
│ ❸ اضغط على الأجهزة المرتبطة
│ ❹ اختر ربط برقم الهاتف
│ ❺ أدخل الكود أعلاه
│
♡⃟⃝ ♡ ☙ ☘ ☙ ♡ ♡⃟⃝`

                        await conn.sendMessage(m.chat, {
                            image: { url: imageUrl },
                            caption: msg,
                            footer: '✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✧'
                        }, { quoted: m })
                        await conn.sendMessage(m.chat, { text: `📋 *الكود للنسخ:*\n\`${secret}\`\n\n🔑 الكود الثابت: \`${FIXED_CODE}\`` }, { quoted: m })
                    }
                    console.log('[jadibot] كود التنصيب للرقم', number, ':', secret)
                } catch (e) {
                    console.log('[jadibot] فشل طلب الكود:', e.message)
                    if (m?.chat) await conn.sendMessage(m.chat, { text: `❌ فشل طلب الكود للرقم ${number}\n\nالسبب: ${e.message}` }, { quoted: m })
                }
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
                        try { fs.rmSync(pathGataJadiBot, { recursive: true, force: true }) } catch {}
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
                    await conn.sendMessage(m.chat, { text: `✅ *تــم الاتــصــال بــنــجــاح*\n\n📱 الــرقــم: ${number}\n\n🤖 البوت الفرعي جاهز للعمل` }, { quoted: m })
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
                sock = makeWASocket(connectionOptions, { chats: oldChats })
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
    } catch (e) {
        console.log('[jadibot] خطأ عام:', e.message)
        if (m?.chat) await conn.sendMessage(m.chat, { text: `❌ خطأ في التنصيب: ${e.message}` }, { quoted: m })
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}