// plugins/اوامر.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - القائمة الرئيسية ✧

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    proto
} from '@whiskeysockets/baileys'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ownerNumber = '967780023229'
const channelUrl = 'https://whatsapp.com/channel/0029XXXXXXXX' // <-- حط رابط قناتك هنا

let cachedDynamicCategories = null
let lastScanTime = 0
const SCAN_CACHE_TTL = 120000

const normalizeCategoryName = (name) => {
    if (!name) return 'أخرى'
    const clean = String(name).trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').toLowerCase()

    if (/^(مطور|المطور|dev)$/.test(clean)) return 'المطور'
    if (/^(الادوات|ادوات|tools?)$/.test(clean)) return 'الأدوات'
    if (/^(النخبه|نخبه|النخب|elite)$/.test(clean)) return 'النخبة'
    if (/^(الادار|اداره|إدارة|admin|الجروبات|المشرفين)$/.test(clean)) return 'الجروبات والمشرفين'
    if (/^(التحميل|تحميل|التحميلات|download)$/.test(clean)) return 'التحميلات'
    if (/^(اسلامي|دين|الدين|islamic)$/.test(clean)) return 'الإسلامي'
    if (/^(حماية|الحماية|security)$/.test(clean)) return 'الحماية'
    if (/^(الاعضاء|اعضاء|members?)$/.test(clean)) return 'الأعضاء'
    if (/^(الالعاب|العاب|games?)$/.test(clean)) return 'الألعاب'
    if (/^(الترفيه|ترفيه|تسلية|fun)$/.test(clean)) return 'الترفيه والتسلية'
    if (/^(النقابات|نقابات|guild)$/.test(clean)) return 'النقابات'

    return String(name).trim()
}

const getCategoryIcon = (name) => {
    const n = String(name).toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, '')
    const icons = {
        'جروباتوالمشرفين': '👑',
        'ادار': '⚙️',
        'المطور': '👑',
        'مطور': '👑',
        'dev': '👑',
        'الادوات': '🛠️',
        'ادوات': '🛠️',
        'tool': '🛠️',
        'النظام': '⭐',
        'التحميلات': '📥',
        'تحميل': '📥',
        'download': '📥',
        'النخب': '👑',
        'elite': '👑',
        'الدين': '🕌',
        'اسلامي': '🕌',
        'حماية': '🛡️',
        'security': '🛡️',
        'الاعضاء': '👥',
        'members': '👥',
        'الالعاب': '🎮',
        'العاب': '🎮',
        'الترفيه': '🎭',
        'ترفيه': '🎭',
        'النقابات': '👑',
        'ايديت': '🎬',
        'اغاني': '🎬'
    }
    for (const key in icons) {
        if (n.includes(key)) return icons[key]
    }
    return '📂'
}

const getCategoryDesc = (name) => {
    const n = String(name).toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, '')
    if (n.includes('جروبات') || n.includes('مشرفين') || n.includes('ادار') || n.includes('admin')) return 'إدارة وحماية الجروبات'
    if (n.includes('تحميل') || n.includes('download')) return 'تحميل الفيديوهات والصور والملفات'
    if (n.includes('ترفيه') || n.includes('تسلية')) return 'أوامر المرح والتفاعل'
    if (n.includes('العاب') || n.includes('الالعاب')) return 'ألعاب وتحديات'
    if (n.includes('نقابات')) return 'أوامر النقابات وإدارة النقابة'
    if (n.includes('ادوات') || n.includes('tool')) return 'أدوات ومميزات البوت'
    if (n.includes('ايديت') || n.includes('اغاني')) return 'الإيديت والموسيقى والأغاني'
    if (n.includes('مطور') || n.includes('dev')) return 'أوامر التحكم والمطور'
    if (n.includes('نخب') || n.includes('elite')) return 'أوامر حصرية وخاصة'
    if (n.includes('دين') || n.includes('اسلامي')) return 'آيات وأذكار وخدمات إيمانية'
    if (n.includes('حماي')) return 'حماية وأمان المجموعات'
    return 'أقسام وأوامر البوت'
}

const fallbackRows = [
    { header: '👑', title: 'الجروبات والمشرفين', description: 'إدارة وحماية الجروبات', id: '.ق1' },
    { header: '📥', title: 'التحميلات', description: 'تحميل الفيديوهات والصور والملفات', id: '.ق2' },
    { header: '🎭', title: 'الترفيه والتسلية', description: 'أوامر المرح والتفاعل', id: '.ق3' },
    { header: '🎮', title: 'الألعاب', description: 'ألعاب وتحديات', id: '.ق4' },
    { header: '👑', title: 'النقابات', description: 'أوامر النقابات وإدارة النقابة', id: '.ق5' },
    { header: '🛠️', title: 'الأدوات', description: 'أدوات ومميزات البوت', id: '.ق6' },
    { header: '🎬', title: 'الإيديت والأغاني', description: 'الإيديت والموسيقى والأغاني', id: '.ق7' }
]

async function buildDynamicCategoryRows() {
    const now = Date.now()
    if (cachedDynamicCategories && now - lastScanTime < SCAN_CACHE_TTL) {
        return cachedDynamicCategories
    }

    const pluginsDir = __dirname
    const files = []

    const scanDir = (dir, rel = '') => {
        let entries = []
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true })
        } catch {
            return
        }
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
            const fullPath = path.join(dir, entry.name)
            const relPath = path.join(rel, entry.name)
            if (entry.isDirectory()) {
                scanDir(fullPath, relPath)
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                files.push(relPath)
            }
        }
    }

    scanDir(pluginsDir)

    const grouped = Object.create(null)
    const order = []

    for (const file of files) {
        const base = path.basename(file)
        if (['اوامر.js', 'قسم.js', 'ق.js', 'index.js'].includes(base)) continue

        try {
            const mod = await import(`./${file.split(path.sep).join('/')}`)
            const plugin = mod?.default
            if (!plugin || typeof plugin !== 'object') continue

            const rawCategory =
                plugin.category ||
                (Array.isArray(plugin.tags) && plugin.tags[0]) ||
                (typeof plugin.tags === 'string' && plugin.tags) ||
                null

            if (!rawCategory) continue

            const formattedCat = normalizeCategoryName(rawCategory)
            if (!grouped[formattedCat]) {
                grouped[formattedCat] = new Set()
                order.push(formattedCat)
            }

            let cmdList = []
            if (Array.isArray(plugin.command)) {
                cmdList = plugin.command
            } else if (plugin.command instanceof RegExp) {
                cmdList = [plugin.command.source]
            } else if (typeof plugin.command === 'string') {
                cmdList = plugin.command.split(/[,،\s]+/).filter(Boolean)
            }

            for (const c of cmdList) {
                const cleanCmd = String(c).trim().toLowerCase()
                if (cleanCmd) grouped[formattedCat].add(cleanCmd)
            }
        } catch {}
    }

    let rows = order.map((cat, idx) => {
        const count = grouped[cat].size
        return {
            header: getCategoryIcon(cat),
            title: String(cat).slice(0, 24),
            description: `${getCategoryDesc(cat)} (${count})`.slice(0, 72),
            id: `.ق${idx + 1}`
        }
    })

    if (!rows.length) {
        rows = fallbackRows
    } else if (rows.length > 10) {
        rows = rows.slice(0, 10)
    }

    cachedDynamicCategories = rows
    lastScanTime = now
    return rows
}

async function safeGetImageMedia(conn) {
    const imageUrl = 'https://d.uguu.se/hLnOouWdpweG.jpg'
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 7000)
        const res = await fetch(imageUrl, { signal: controller.signal })
        clearTimeout(timeout)
        if (!res.ok) return null
        const buf = Buffer.from(await res.arrayBuffer())
        if (!buf.length) return null
        return await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer })
    } catch {
        return null
    }
}

const handler = async (m, { conn }) => {
    try {
        try {
            await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } })
        } catch {}

        let user = 'مستخدم'
        try {
            if (typeof conn.getName === 'function') {
                user = (await conn.getName(m.sender)) || user
            } else if (m.pushName) {
                user = m.pushName
            }
        } catch {
            user = m.pushName || user
        }

        const dynamicRows = await buildDynamicCategoryRows()
        const media = await safeGetImageMedia(conn)

        const text =
`*◇❐ ═━╾⚡ ╼━═ ❐◇*

*◇❐ ═━╾ ⚡ ╼━═ ❐◇*
  ⚡ أهلاً بك يا ${user}

*◇❐ ═━╾⚡ ╼━═ ❐◇*

*◇❐ ═━╾ ⚡ ╼━═ ❐◇*
  ✦ الفخامة لها عنوان واحد
  ✦ القوة .. السرعة .. الهيبة
  ✦ اختر .. واستمتع

*◇❐ ═━╾⚡ ╼━═ ❐◇*

*◇❐ ═━╾ ⚡ ╼━═ ❐◇*
  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`

        const header = media?.imageMessage
            ? {
                  title: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓',
                  hasMediaAttachment: true,
                  imageMessage: media.imageMessage
              }
            : {
                  title: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓',
                  hasMediaAttachment: false
              }

        const interactiveMessage = {
            body: { text },
            footer: { text: '✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 | الأفضل دائماً ✦' },
            header,
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📂 قائمة الأوامر',
                            sections: [
                                {
                                    title: '╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮',
                                    rows: dynamicRows
                                }
                            ]
                        })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '👑 المطور',
                            url: `https://wa.me/${ownerNumber}`,
                            merchant_url: `https://wa.me/${ownerNumber}`
                        })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📢 القناة',
                            url: channelUrl,
                            merchant_url: channelUrl
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🤖 تنصيب البوت',
                            id: '.تنصيب'
                        })
                    }
                ],
                messageParamsJson: ''
            }
        }

        const userJid = conn?.user?.jid || conn?.user?.id || m.chat

        const msg = generateWAMessageFromContent(
            m.chat,
            {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage)
                    }
                }
            },
            {
                userJid,
                quoted: m
            }
        )

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    } catch (e) {
        console.error('❌ ARTHUR BOT MENU ERROR:', e)
        await m.reply('❌ حصل خطأ أثناء فتح قائمة 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓.')
    }
}

handler.help = ['اوامر']
handler.tags = ['main']
handler.command = /^(اوامر)$/i

export default handler