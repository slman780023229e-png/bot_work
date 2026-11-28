// plugins/jadibot.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - تنصيب بوت فرعي - Baileys v7 - كود ثابت ARTHUR78 + زر نسخ 🤖
// ✅ نفس الكود الشغال عندك، بس عدلت: رسالة وحدة (صورة + زر نسخ)

import { useMultiFileAuthState, DisconnectReason, fetchLatestWaWebVersion, makeCacheableSignalKeyStore, proto, generateWAMessageFromContent, generateWAMessageContent } from "baileys"
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

const FIXED_CODE = 'ARTHUR78'

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
    if (number.startsWith('115') && number.length === 11) return false
    return true
}

function cleanNum(jid) {
    if (!jid) return ''
    return String(jid).split(':')[0].split('@')[0].replace(/\D/g, '')
}

async function getRealNumber(m, conn) {
    let candidates = [
        m.key?.participantPn,
        m.key?.remoteJidPn,
        m.participantPn,
        m.key?.participantAlt,
        m.senderPn
    ]
    for (let c of candidates) {
        let num = cleanNum(c)
        if (num.startsWith('967') && num.length === 12) return num
        if (num.length >= 7 && num.length <= 15 && !num.startsWith('115')) return num
    }
    try {
        if (m.isGroup) {
            const meta = await conn.groupMetadata(m.chat)
            const me = meta?.participants?.find(p => p.id === m.sender || p.lid === m.sender || p.jid === m.sender)
            if (me?.pn) {
                let num = cleanNum(me.pn)
                if (num.length >= 7 && num.length <= 15) return num
            }
            const byLid = meta?.participants?.find(p => cleanNum(p.lid) === cleanNum(m.sender))
            if (byLid?.pn) {
                let num = cleanNum(byLid.pn)
                if (num.length >= 7 && num.length <= 15) return num
            }
        }
    } catch {}
    try {
        const lid = cleanNum(m.sender)
        if (conn.signalRepository?.lidMapping?.getPNForLID) {
            const pn = await conn.signalRepository.lidMapping.getPNForLID(`${lid}@lid`)
            if (pn) {
                let num = cleanNum(pn)
                if (num.length >= 7 && num.length <= 15) return num
            }
        }
        if (conn.getJidFromLid) {
            const pn = await conn.getJidFromLid(`${lid}@lid`).catch(() => null)
            if (pn) {
                let num = cleanNum(pn)
                if (num.length >= 7 && num.length <= 15) return num
            }
        }
    } catch {}
    try {
        let chatNum = cleanNum(m.chat)
        if (!m.isGroup && chatNum.length >= 7 && chatNum.length <= 15 && !chatNum.startsWith('115')) return chatNum
    } catch {}
    return ''
}

// ===== ✅ التعديل 1: دالة رسالة وحدة - صورة + زر نسخ - نفس طريقة نسخ.js =====
async function sendCodeWithImage(conn, m, captionText, copyCode) {
    let headerObj = {}
    try {
        const res = await fetch('https://files.catbox.moe/30s6np.jpg')
        const buf = Buffer.from(await res.arrayBuffer())
        const { imageMessage } = await generateWAMessageContent({ image: buf }, { upload: conn.waUploadToServer })
        if (imageMessage) headerObj = { hasMediaAttachment: true, imageMessage }
    } catch {}

    const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    body: proto.Message.InteractiveMessage.Body.create({ text: captionText }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: '✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✧' }),
                    header: proto.Message.InteractiveMessage.Header.fromObject(headerObj),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [
                            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 نسخ الكود", copy_code: copyCode }) }
                        ]
                    })
                })
            }
        }
    }, { quoted: m })
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
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

        if (!number) {
            number = await getRealNumber(m, conn)
            if (number.startsWith('115') || number.length > 15) number = ''
            if (number && isValidPhoneNumber(number)) {
                await m.reply(`🤖 *تم اخذ رقمك الحقيقي تلقائياً:* ${number}\n⏳ جاري طلب الكود...`)
            } else {
                number = ''
            }
        }

        if (!number) {
            return m.reply(`🤖 *تـنـصـيـب بـوت فـرعـي*\n\n⚠️ ما قدرت اقرأ رقمك الحقيقي تلقائياً\n\n📌 اكتب رقمك: ${usedPrefix + command} 967780023229`)
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
        // ✅ التعديل 2: رسالة وحدة بس قبل الطلب
        await m.reply(`⏳ *جاري طلب الكود...*`)
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
        const msgRetryCache = new NodeCache()
        const { state, saveState, saveCreds } = await useMultiFileAuthState(pathGataJadiBot)

        const connectionOptions = {
            logger: pino({ level: 'fatal' }),
            printQRInTerminal: false,
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
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
                    let secret = ''
                    let isFixed = true
                    try {
                        secret = await sock.requestPairingCode(number, FIXED_CODE)
                        console.log('[jadibot] تم طلب الكود الثابت ARTHUR78 للرقم', number)
                    } catch (e) {
                        console.log('[jadibot] واتساب رفض الكود الثابت، بجيب كود عشوائي:', e.message)
                        isFixed = false
                        secret = await sock.requestPairingCode(number)
                    }
                    secret = secret?.match(/.{1,4}/g)?.join('-') || secret
                    let copyCode = secret.replace(/-/g, '')

                    if (m?.chat) {
                        let captionText = `♡⃟⃝ ♡ ☙ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ☙ ♡
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
♡⃟⃝ ♡ ☙ ☘ ☙ ♡ ♡⃟⃝

👇 *اضغط زر نسخ الكود تحت، والصقه في الواتساب:*`

                        // ✅ التعديل 3: رسالة وحدة بس - صورة + زر نسخ، شلت الرسالة الاحتياطية
                        await sendCodeWithImage(conn, m, captionText, copyCode)
                    }
                    console.log('