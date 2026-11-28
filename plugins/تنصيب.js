// plugins/jadibot.js
// ✅ كود مضمون - نفس بنية تست.js + نفس زر نسخ.js

import { useMultiFileAuthState, fetchLatestWaWebVersion, makeCacheableSignalKeyStore, makeWASocket, proto, generateWAMessageFromContent } from "baileys"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'

if (!(global.conns instanceof Array)) global.conns = []
const FIXED_CODE = 'ARTHUR78'

let handler = async (m, { conn, args, usedPrefix, command, text }) => {
    // مثل تست.js بالضبط - يرد على طول، ما يسكت
    let number = (args.join(' ') || text || '').replace(/\D/g, '')

    if (!number) {
        await conn.sendMessage(m.chat, { text: `🤖 *تـنـصـيـب بـوت فـرعـي*\n\n📌 اكتب رقمك: ${usedPrefix + command} 967780023229` }, { quoted: m })
        return
    }
    if (number.length < 7 || number.length > 15) {
        await conn.sendMessage(m.chat, { text: `❌ *رقم غير صالح:* ${number}` }, { quoted: m })
        return
    }

    await conn.sendMessage(m.chat, { text: `⏳ *جاري طلب الكود...*` }, { quoted: m })

    let pathGataJadiBot = path.join('./2BSubBot/', number)
    if (!fs.existsSync(pathGataJadiBot)) fs.mkdirSync(pathGataJadiBot, { recursive: true })

    gataJadiBot({ pathGataJadiBot, m, conn }, number).catch(e => {
        console.log('[jadibot] خطأ:', e)
        conn.sendMessage(m.chat, { text: `❌ خطأ: ${e.message}` }, { quoted: m })
    })
}

handler.command = /^(تنصيب|jadibot|serbot|rentbot|subbot|بوت_فرعي)$/i
export default handler

export async function gataJadiBot(options, number) {
    let { pathGataJadiBot, m, conn } = options
    if (!fs.existsSync(pathGataJadiBot)) fs.mkdirSync(pathGataJadiBot, { recursive: true })

    const { version } = await fetchLatestWaWebVersion()
    const msgRetryCache = new NodeCache()
    const { state, saveCreds } = await useMultiFileAuthState(pathGataJadiBot)

    let sock = makeWASocket({
        logger: pino({ level: 'fatal' }),
        printQRInTerminal: false,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        msgRetryCache,
        browser: ['Windows', 'Chrome', '110.0.5481.177'],
        version: version,
        generateHighQualityLinkPreview: true
    })

    let codeSent = false

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        console.log('[jadibot] connection:', connection, 'qr:', !!qr)

        // اطلب الكود اول ما يجي qr
        if (qr && !codeSent) {
            codeSent = true
            try {
                let secret = ''
                try {
                    secret = await sock.requestPairingCode(number, FIXED_CODE)
                } catch {
                    secret = await sock.requestPairingCode(number)
                }
                secret = secret?.match(/.{1,4}/g)?.join('-') || secret
                let copyCode = secret.replace(/-/g, '')

                // 1. الصورة
                try {
                    await conn.sendMessage(m.chat, {
                        image: { url: 'https://files.catbox.moe/30s6np.jpg' },
                        caption: `🤖 *بوت فرعي للرقم:* ${number}\n🔑 الكود: *${secret}*`
                    }, { quoted: m })
                } catch {}

                // 2. زر النسخ - نفس نسخ.js بالضبط
                let captionText = `♡⃟⃝ ♡ ☙ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ☙ ♡\n│\n│ ♡ *🤖 تـنـصـيـب بـوت فـرعـي*\n│\n│ ⚔️ *الـكـود:* ${secret}\n│\n│ ❄️ افتح الواتساب على رقم ${number} > الأجهزة المرتبطة > ربط برقم الهاتف > أدخل الكود\n│\n👇 *اضغط زر نسخ الكود تحت:*`

                let msg = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                body: proto.Message.InteractiveMessage.Body.create({ text: captionText }),
                                footer: proto.Message.InteractiveMessage.Footer.create({ text: '✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✧' }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                    buttons: [{ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 نسخ الكود", copy_code: copyCode }) }]
                                })
                            })
                        }
                    }
                }, { quoted: m })
                await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
                console.log('[jadibot] تم ارسال الكود:', secret)
            } catch (e) {
                console.log('[jadibot] فشل طلب الكود:', e.message)
                codeSent = false
                await conn.sendMessage(m.chat, { text: `❌ فشل طلب الكود: ${e.message}` }, { quoted: m })
            }
        }

        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode
            console.log('[jadibot] اغلق، السبب:', reason)
            if (reason === 405 || reason === 401 || reason === 403) {
                try { fs.rmSync(pathGataJadiBot, { recursive: true, force: true }) } catch {}
            }
        }

        if (connection === 'open') {
            global.conns.push(sock)
            console.log(`🟢 Sub-bot (+${number}) connected`)
            await conn.sendMessage(m.chat, { text: `✅ *تــم الاتــصــال بــنــجــاح*\n\n📱 الــرقــم: ${number}` }, { quoted: m })
        }
    })

    sock.ev.on('creds.update', saveCreds)

    // ربط اوامر البوت الفرعي
    try {
        let handlerMod = await import('../handler.js')
        sock.ev.on('messages.upsert', handlerMod.handler.bind(sock))
    } catch {}
}