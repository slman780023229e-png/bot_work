// plugins/اوامر.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - قائمة + أقسام في ملف واحد - ترتيب تلقائي ✧
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
const channelUrl = 'https://whatsapp.com/channel/0029XXXXXXXX'
const MENU_IMAGE = 'https://n.uguu.se/gKecorVnmwDZ.jpg'

// ═══════════════════════════════════
// تطبيع اسم القسم
// ═══════════════════════════════════
const normalize = (name) => {
    if (!name) return 'أخرى'
    return String(name).trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .toLowerCase()
}

const cleanName = (name) => {
    let n = normalize(name)
    if (/^(مطور|المطور|dev)$/.test(n)) return 'المطور'
    if (/^(الادوات|ادوات|tools?)$/.test(n)) return 'الأدوات'
    if (/^(النخبه|نخبه|النخب|elite)$/.test(n)) return 'النخبة'
    if (/^(الادار|اداره|ادارة|admin|الجروبات|المشرفين)$/.test(n)) return 'الجروبات والمشرفين'
    if (/^(التحميل|تحميل|التحميلات|download)$/.test(n)) return 'التحميلات'
    if (/^(اسلامي|دين|الدين|islamic)$/.test(n)) return 'الإسلامي'
    if (/^(حماية|الحماية|security)$/.test(n)) return 'الحماية'
    if (/^(الاعضاء|اعضاء|members?)$/.test(n)) return 'الأعضاء'
    if (/^(الالعاب|العاب|games?)$/.test(n)) return 'الألعاب'
    if (/^(الترفيه|ترفيه|تسلية|fun)$/.test(n)) return 'الترفيه والتسلية'
    if (/^(النقابات|نقابات|guild)$/.test(n)) return 'النقابات'
    return String(name).trim()
}

const getIcon = (name) => {
    const n = normalize(name)
    if (n.includes('جروبات') || n.includes('مشرفين') || n.includes('مطور')) return '👑'
    if (n.includes('ادوات')) return '🛠️'
    if (n.includes('تحميل')) return '📥'
    if (n.includes('نخب')) return '👑'
    if (n.includes('دين') || n.includes('اسلامي')) return '🕌'
    if (n.includes('حماي')) return '🛡️'
    if (n.includes('اعضاء')) return '👥'
    if (n.includes('العاب') || n.includes('الالعاب')) return '🎮'
    if (n.includes('ترفيه') || n.includes('تسلية')) return '🎭'
    if (n.includes('نقابات')) return '👑'
    if (n.includes('ايديت') || n.includes('اغاني')) return '🎬'
    return '📂'
}

const getDesc = (name) => {
    const n = normalize(name)
    if (n.includes('جروبات') || n.includes('مشرفين')) return 'إدارة وحماية الجروبات'
    if (n.includes('تحميل')) return 'تحميل الفيديوهات والصور والملفات'
    if (n.includes('ترفيه')) return 'أوامر المرح والتفاعل'
    if (n.includes('العاب')) return 'ألعاب وتحديات'
    if (n.includes('نقابات')) return 'أوامر النقابات وإدارة النقابة'
    if (n.includes('ادوات')) return 'أدوات ومميزات البوت'
    if (n.includes('ايديت') || n.includes('اغاني')) return 'الإيديت والموسيقى والأغاني'
    if (n.includes('مطور')) return 'أوامر التحكم والمطور'
    if (n.includes('نخب')) return 'أوامر حصرية وخاصة'
    if (n.includes('دين') || n.includes('اسلامي')) return 'آيات وأذكار وخدمات إيمانية'
    if (n.includes('حماي')) return 'حماية وأمان المجموعات'
    return 'أقسام وأوامر البوت'
}

// ═══════════════════════════════════
// سكان كل الملفات وتجميع الأقسام
// مرتب تلقائياً
// ═══════════════════════════════════
async function scanPlugins() {
    const files = []
    const scanDir = (dir, rel = '') => {
        let entries = []
        try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
        for (const e of entries) {
            if (e.name.startsWith('.') || e.name === 'node_modules') continue
            const full = path.join(dir, e.name)
            const relPath = path.join(rel, e.name)
            if (e.isDirectory()) scanDir(full, relPath)
            else if (e.isFile() && e.name.endsWith('.js')) files.push(relPath)
        }
    }
    scanDir(__dirname)

    const grouped = {} // { قسم: [اوامر] }

    for (const file of files) {
        const base = path.basename(file)
        if (base === 'اوامر.js') continue
        try {
            const mod = await import(`./${file.split(path.sep).join('/')}?t=${Date.now()}`)
            const p = mod?.default
            if (!p || typeof p !== 'object') continue

            let rawCat = p.category || (Array.isArray(p.tags) ? p.tags[0] : p.tags) || null
            if (!rawCat) continue
            let cat = cleanName(rawCat)
            if (!grouped[cat]) grouped[cat] = []

            let list = []
            if (Array.isArray(p.command)) list = p.command
            else if (p.command instanceof RegExp) {
                // نحول الريجكس لأوامر مقروءة
                let src = p.command.source
                    .replace(/[\^\$\(\)\?\.\*\+\|\\\/\[\]]/g, ' ')
                    .split(/\s+/)
                    .filter(s => s.length > 1 && !['i', 'g'].includes(s))
                list = src
            }
            else if (typeof p.command === 'string') list = [p.command]

            for (let c of list) {
                c = String(c).trim()
                    .replace(/[\^\$\(\)\?\|\\\/\[\]]/g, '')
                    .replace(/^\^/, '').trim()
                if (!c || c.length < 2) continue
                if (!grouped[cat].includes(c)) grouped[cat].push(c)
            }
        } catch {}
    }

    // ✅ الترتيب التلقائي: أبجدي عربي + الأهم أولاً
    const priority = ['الجروبات والمشرفين', 'المطور', 'النخبة', 'التحميلات', 'الأدوات', 'الحماية']
    let cats = Object.keys(grouped).sort((a, b) => {
        let pa = priority.indexOf(a)
        let pb = priority.indexOf(b)
        if (pa !== -1 && pb !== -1) return pa - pb
        if (pa !== -1) return -1
        if (pb !== -1) return 1
        return a.localeCompare(b, 'ar') // ترتيب أبجدي عربي
    })

    // ترتيب الأوامر داخل كل قسم أبجدياً كمان
    for (let cat of cats) grouped[cat].sort((a, b) => a.localeCompare(b, 'ar'))

    return { grouped, cats }
}

async function getImageMedia(conn) {
    try {
        const res = await fetch(MENU_IMAGE, { signal: AbortSignal.timeout(7000) })
        if (!res.ok) return null
        const buf = Buffer.from(await res.arrayBuffer())
        if (!buf.length) return null
        return await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer })
    } catch { return null }
}

// ═══════════════════════════════════
// عرض قسم واحد
// ═══════════════════════════════════
async function showSection(conn, m, catName, usedPrefix) {
    const { grouped, cats } = await scanPlugins()
    // نلاقي القسم حتى لو كتب اسمه ناقص
    let found = cats.find(c => normalize(c) === normalize(catName))
    if (!found) found = cats.find(c => normalize(c).includes(normalize(catName)) || normalize(catName).includes(normalize(c)))
    if (!found) {
        return conn.sendMessage(m.chat, { text: `❌ ما لقيت قسم *${catName}*\n\nالأقسام المتوفرة:\n${cats.map(c => `• ${c}`).join('\n')}\n\nاكتب: ${usedPrefix}اوامر` }, { quoted: m })
    }
    let cmds = grouped[found]
    let text = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  ${getIcon(found)} قسم: ${found}\n  📦 عدد الأوامر: ${cmds.length}\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n`
    for (let c of cmds) text += `  • ${usedPrefix}${c}\n`
    text += `\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  اكتب ${usedPrefix}اوامر للرجوع\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
    await conn.sendMessage(m.chat, { text }, { quoted: m })
}

// ═══════════════════════════════════
// عرض القائمة الرئيسية
// ═══════════════════════════════════
async function showMenu(conn, m) {
    try { await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } }) } catch {}
    let user = m.pushName || 'مستخدم'
    try { if (typeof conn.getName === 'function') user = (await conn.getName(m.sender)) || user } catch {}

    const { grouped, cats } = await scanPlugins()

    // ✅ بناء صفوف القائمة - مرتبة تلقائياً - ال id فيه اسم القسم
    let rows = cats.slice(0, 10).map(cat => ({
        header: getIcon(cat),
        title: String(cat).slice(0, 24),
        description: `${getDesc(cat)} (${grouped[cat].length})`.slice(0, 72),
        id: `.قسم ${cat}`
    }))
    if (!rows.length) {
        rows = [
            { header: '📂', title: 'لا توجد أقسام', description: 'أضف tags للملفات', id: '.اوامر' }
        ]
    }

    const media = await getImageMedia(conn)
    const text = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  ⚡ أهلاً بك يا ${user}\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  ✦ الفخامة لها عنوان واحد\n  ✦ القوة .. السرعة .. الهيبة\n  ✦ اختر .. واستمتع\n  ✦ ${cats.length} قسم | ${Object.values(grouped).flat().length} أمر\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`

    const header = media?.imageMessage
        ? { title: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓', hasMediaAttachment: true, imageMessage: media.imageMessage }
        : { title: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓', hasMediaAttachment: false }

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
                        sections: [{ title: '╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮', rows }]
                    })
                },
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '👑 المطور', url: `https://wa.me/${ownerNumber}`, merchant_url: `https://wa.me/${ownerNumber}` }) },
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 القناة', url: channelUrl, merchant_url: channelUrl }) },
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🤖 تنصيب البوت', id: '.تنصيب' }) }
            ],
            messageParamsJson: ''
        }
    }
    const userJid = conn?.user?.jid || conn?.user?.id || m.chat
    const msg = generateWAMessageFromContent(m.chat, { viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage) } } }, { userJid, quoted: m })
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

// ═══════════════════════════════════
// الهاندلر الرئيسي - ملف واحد لكل شي
// ═══════════════════════════════════
let handler = async (m, { conn, text, usedPrefix, args }) => {
    try {
        // اذا كتب .قسم xxx -> عرض القسم
        let fullText = (m.text || '').trim()
        if (/^\.?قسم/i.test(fullText)) {
            let cat = fullText.replace(/^\.?قسم\s*/i, '').trim() || (args?.join(' ') || '')
            if (!cat) return showMenu(conn, m)
            return showSection(conn, m, cat, usedPrefix || '.')
        }
        // غير كذا -> القائمة الرئيسية
        return showMenu(conn, m)
    } catch (e) {
        console.error('❌ MENU ERROR:', e)
        await m.reply('❌ حصل خطأ أثناء فتح القائمة.')
    }
}

// ✅ يلتقط ضغطة القائمة تلقائياً - بدون ملف ثاني
handler.before = async (m, { conn }) => {
    try {
        let selectedId = m.message?.listResponseMessage?.singleSelectReply?.selectedRowId
            || m.message?.interactiveResponseMessage?.body?.text
            || ''
        if (!selectedId) return
        if (selectedId.startsWith('.قسم')) {
            let cat = selectedId.replace(/^\.?قسم\s*/i, '').trim()
            // نحوله لأمر عادي عشان الهاندلر يمسكه
            m.text = `.قسم ${cat}`
            m.body = m.text
            // ننفذه مباشرة
            await showSection(conn, m, cat, '.')
            // نوقف انتشاره عشان ما يتكرر
            m.text = ''
        }
    } catch {}
}

handler.help = ['اوامر', 'قسم']
handler.tags = ['main']
handler.command = /^(اوامر|menu|القائمة|قسم|ق)$/i

export default handler