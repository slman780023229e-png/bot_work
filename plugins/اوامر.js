// plugins/اوامر.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - هجين: ق1 + tags مع بعض ✧
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
// 1 | اسماء أقسام ق1 - ق10 - عدلها على كيفك
// ═══════════════════════════════════
const Q_NAMES = {
    'ق1': { title: 'الجروبات والمشرفين', desc: 'إدارة وحماية الجروبات', icon: '👑' },
    'ق2': { title: 'التحميلات', desc: 'تحميل الفيديوهات والصور والملفات', icon: '📥' },
    'ق3': { title: 'الترفيه والتسلية', desc: 'أوامر المرح والتفاعل', icon: '🎭' },
    'ق4': { title: 'الألعاب', desc: 'ألعاب وتحديات', icon: '🎮' },
    'ق5': { title: 'النقابات', desc: 'أوامر النقابات وإدارة النقابة', icon: '👑' },
    'ق6': { title: 'الأدوات', desc: 'أدوات ومميزات البوت', icon: '🛠️' },
    'ق7': { title: 'الإيديت والأغاني', desc: 'الإيديت والموسيقى والأغاني', icon: '🎬' },
    'ق8': { title: 'القسم الثامن', desc: 'أقسام وأوامر البوت', icon: '📂' },
    'ق9': { title: 'القسم التاسع', desc: 'أقسام وأوامر البوت', icon: '📂' },
    'ق10': { title: 'القسم العاشر', desc: 'أقسام وأوامر البوت', icon: '📂' },
}

const normalize = (s) => String(s || '').trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').toLowerCase()
const cleanCat = (name) => {
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
    let n = normalize(name)
    if (n.includes('جروبات') || n.includes('مشرفين') || n.includes('مطور')) return '👑'
    if (n.includes('ادوات')) return '🛠️'
    if (n.includes('تحميل')) return '📥'
    if (n.includes('نخب')) return '👑'
    if (n.includes('دين') || n.includes('اسلامي')) return '🕌'
    if (n.includes('حماي')) return '🛡️'
    if (n.includes('اعضاء')) return '👥'
    if (n.includes('العاب')) return '🎮'
    if (n.includes('ترفيه') || n.includes('تسلية')) return '🎭'
    if (n.includes('نقابات')) return '👑'
    if (n.includes('ايديت') || n.includes('اغاني')) return '🎬'
    return '📂'
}
const getDesc = (name) => {
    let n = normalize(name)
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
// 2 | الطريقة الأولى: قراءة من ق1 و ق2 ...
// ═══════════════════════════════════
function getQSections() {
    let files = []
    try { files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')) } catch { return [] }
    let sections = []
    for (let file of files) {
        if (file === 'اوامر.js') continue
        let content = ''
        try { content = fs.readFileSync(path.join(__dirname, file), 'utf-8') } catch { continue }
        // يدور على ق1 / ق2 في الكود، حتى لو كان في regex
        let matches = content.match(/ق\s*\d+/g)
        if (!matches) continue
        for (let m of matches) {
            let key = m.replace(/\s+/g, '')
            if (!/^ق\d+$/.test(key)) continue
            if (sections.find(s => s.key === key)) continue
            let info = Q_NAMES[key] || { title: `قسم ${key}`, desc: 'أقسام وأوامر البوت', icon: '📂' }
            sections.push({ type: 'q', key, id: `.${key}`, title: info.title, desc: info.desc, icon: info.icon, file })
            break
        }
    }
    sections.sort((a, b) => parseInt(a.key.replace('ق', '')) - parseInt(b.key.replace('ق', '')))
    return sections
}

// ═══════════════════════════════════
// 3 | الطريقة الثانية: قراءة من tags الملفات
// ═══════════════════════════════════
async function getTagSections() {
    let files = []
    try { files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')) } catch { return {} }
    let grouped = {} // { قسم: [اوامر] }
    let qKeys = new Set(getQSections().map(s => s.key))

    for (let file of files) {
        if (file === 'اوامر.js') continue
        // نتخطى ملفات ق1 و ق2 نفسها عشان ما تتكرر
        let content = ''
        try { content = fs.readFileSync(path.join(__dirname, file), 'utf-8') } catch { continue }
        if (/ق\s*\d+/.test(content)) {
            // هذا ملف قسم، لا نحسبه كأمر عادي
            // بس نفحص: اذا كان ملف ق1 نفسه، نتخطاه
            let isQFile = content.match(/handler\.command\s*=\s*\/\^?\(?ق\d+/ ) || file.match(/^ق\d+\.js$/)
            if (isQFile) continue
        }
        try {
            const mod = await import(`./${file}?t=${Date.now()}`)
            const p = mod?.default
            if (!p || typeof p !== 'object') continue
            let rawCat = p.category || (Array.isArray(p.tags) ? p.tags[0] : p.tags) || null
            if (!rawCat) {
                // ملف ما له tags → نحطه في "أخرى" عشان ما يضيع
                rawCat = 'أخرى'
            }
            let cat = cleanCat(rawCat)
            if (!grouped[cat]) grouped[cat] = []
            let list = []
            if (Array.isArray(p.command)) list = p.command
            else if (p.command instanceof RegExp) {
                list = p.command.source.replace(/[\^\$\(\)\?\.\*\+\|\\\/\[\]]/g, ' ').split(/\s+/).filter(s => s.length > 1)
            } else if (typeof p.command === 'string') list = [p.command]
            for (let c of list) {
                c = String(c).trim().replace(/[\^\$\(\)\?\|\\\/\[\]]/g, '').replace(/^\^/, '').trim()
                if (!c || c.length < 2) continue
                if (/^ق\d+$/.test(c)) continue // لا نحسب ق1 كأمر عادي
                if (!grouped[cat].includes(c)) grouped[cat].push(c)
            }
        } catch {}
    }
    // احذف الأقسام الفاضية
    for (let k in grouped) if (!grouped[k].length) delete grouped[k]
    // رتب الأوامر داخل كل قسم أبجدياً
    for (let k in grouped) grouped[k].sort((a, b) => a.localeCompare(b, 'ar'))
    return grouped
}

// ═══════════════════════════════════
// 4 | دمج الطريقتين - هجين
// ═══════════════════════════════════
async function getAllSections() {
    let qSections = getQSections()
    let tagGrouped = await getTagSections()

    // اسماء الأقسام اللي موجودة في ق1 ... عشان ما نكررها من tags
    let qTitles = new Set(qSections.map(s => normalize(s.title)))
    // ربط: اذا قسم tags اسمه نفس اسم قسم ق، ندمجه وما نكرره
    // مثلاً: ق2 = التحميلات، و tags = التحميلات → نعرض ق2 بس

    let tagSections = []
    for (let cat of Object.keys(tagGrouped)) {
        if (qTitles.has(normalize(cat))) continue // موجود في ق، لا نكرره
        if (cat === 'أخرى' && !tagGrouped[cat].length) continue
        tagSections.push({
            type: 'tag',
            key: cat,
            id: `.قسم ${cat}`,
            title: cat,
            desc: `${getDesc(cat)} (${tagGrouped[cat].length})`,
            icon: getIcon(cat),
            cmds: tagGrouped[cat]
        })
    }
    // رتب اقسام tags أبجدياً
    tagSections.sort((a, b) => a.title.localeCompare(b.title, 'ar'))

    // الترتيب النهائي: ق1 و ق2 ... أولاً، وبعدين اقسام tags
    let all = [...qSections, ...tagSections]
    return { all, qSections, tagGrouped, tagSections }
}

// ═══════════════════════════════════
// 5 | عرض قسم tags (اللي ما له ملف ق)
// ═══════════════════════════════════
async function showTagSection(conn, m, catName, usedPrefix) {
    let { tagGrouped } = await getAllSections()
    let found = Object.keys(tagGrouped).find(c => normalize(c) === normalize(catName))
    if (!found) found = Object.keys(tagGrouped).find(c => normalize(c).includes(normalize(catName)) || normalize(catName).includes(normalize(c)))
    if (!found) return conn.sendMessage(m.chat, { text: `❌ ما لقيت قسم *${catName}*` }, { quoted: m })
    let cmds = tagGrouped[found]
    let text = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  ${getIcon(found)} قسم: ${found}\n  📦 عدد الأوامر: ${cmds.length}\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n`
    for (let c of cmds) text += `  • ${usedPrefix}${c}\n`
    text += `\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  اكتب ${usedPrefix}اوامر للرجوع\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
    await conn.sendMessage(m.chat, { text }, { quoted: m })
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
// 6 | الهاندلر الرئيسي
// ═══════════════════════════════════
let handler = async (m, { conn, usedPrefix }) => {
    try {
        let full = (m.text || '').trim()
        // اذا كتب .قسم xxx → هذا قسم tags
        if (/^\.?قسم/i.test(full)) {
            let cat = full.replace(/^\.?قسم\s*/i, '').trim()
            if (!cat) return showMenu(conn, m)
            return showTagSection(conn, m, cat, usedPrefix || '.')
        }
        return showMenu(conn, m)
    } catch (e) {
        console.error('❌ MENU ERROR:', e)
        await m.reply('❌ حصل خطأ أثناء فتح القائمة.')
    }
}

async function showMenu(conn, m) {
    try { await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } }) } catch {}
    let user = m.pushName || 'مستخدم'
    try { if (typeof conn.getName === 'function') user = (await conn.getName(m.sender)) || user } catch {}

    let { all, qSections, tagSections } = await getAllSections()
    console.log('[اوامر هجين] ق:', qSections.map(s => s.key), '| tags:', tagSections.map(s => s.title))

    if (!all.length) {
        return conn.sendMessage(m.chat, { text: `❌ ما لقيت أي أقسام!\n\nتأكد ان عندك:\n• ملفات ق1 و ق2 ...\n• أو ملفات فيها tags` }, { quoted: m })
    }

    // ✅ الصفوف: ق1 → .ق1، و tags → .قسم الاسم
    let rows = all.slice(0, 10).map(s => ({
        header: s.icon,
        title: String(s.title).slice(0, 24),
        description: String(s.desc).slice(0, 72),
        id: s.id
    }))

    const media = await getImageMedia(conn)
    const totalCmds = Object.values(await getTagSections()).flat().length
    const text = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  ⚡ أهلاً بك يا ${user}\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  ✦ الفخامة لها عنوان واحد\n  ✦ القوة .. السرعة .. الهيبة\n  ✦ اختر .. واستمتع\n  ✦ ${qSections.length} قسم ثابت | ${tagSections.length} قسم تلقائي | ${totalCmds} أمر\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`

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

// ✅ يلتقط ضغطة القائمة للطريقتين
handler.before = async (m, { conn }) => {
    try {
        let selectedId = m.message?.listResponseMessage?.singleSelectReply?.selectedRowId
            || m.message?.interactiveResponseMessage?.body?.text
            || ''
        if (!selectedId) return
        selectedId = selectedId.trim()
        // طريقة ق1: .ق1 → نخلي القالب ينفذ ملف ق1
        if (/^\.?ق\d+$/.test(selectedId)) {
            m.text = selectedId.startsWith('.') ? selectedId : '.' + selectedId
            m.body = m.text
            return
        }
        // طريقة tags: .قسم xxx → ننفذه هنا مباشرة
        if (/^\.?قسم\s+/i.test(selectedId)) {
            let cat = selectedId.replace(/^\.?قسم\s*/i, '').trim()
            await showTagSection(conn, m, cat, '.')
            m.text = ''
        }
    } catch {}
}

handler.help = ['اوامر', 'قسم']
handler.tags = ['main']
handler.command = /^(اوامر|menu|القائمة|قسم|ق)$/i
export default handler