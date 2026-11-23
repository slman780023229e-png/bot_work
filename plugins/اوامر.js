// plugins/اوامر.js
// ARTHUR BOT - صورة + قائمة في رسالة واحدة - الضغطة تشتغل
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

// ✅ رابط الصورة حقك من قبل - اذا سويت .دايم بيصير هو اللي يشتغل تلقائي
const MENU_IMAGE = 'https://files.catbox.moe/xxxxxx.jpg'

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

function getQSections() {
    let files = []
    try { files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')) } catch { return [] }
    let sections = []
    for (let file of files) {
        if (file === 'اوامر.js') continue
        let content = ''
        try { content = fs.readFileSync(path.join(__dirname, file), 'utf-8') } catch { continue }
        let matches = content.match(/ق\s*\d+/g)
        if (!matches) continue
        for (let m of matches) {
            let key = m.replace(/\s+/g, '')
            if (!/^ق\d+$/.test(key)) continue
            if (sections.find(s => s.key === key)) continue
            let info = Q_NAMES[key] || { title: `قسم ${key}`, desc: 'أقسام وأوامر البوت', icon: '📂' }
            sections.push({ type: 'q', key, title: info.title, desc: info.desc, icon: info.icon })
            break
        }
    }
    sections.sort((a, b) => parseInt(a.key.replace('ق', '')) - parseInt(b.key.replace('ق', '')))
    return sections
}

async function getTagSections() {
    let files = []
    try { files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')) } catch { return {} }
    let grouped = {}
    for (let file of files) {
        if (file === 'اوامر.js') continue
        let content = ''
        try { content = fs.readFileSync(path.join(__dirname, file), 'utf-8') } catch { continue }
        if (file.match(/^ق\d+\.js$/) || content.match(/handler\.command\s*=\s*\/\^?\(?ق\d+/)) continue
        try {
            const mod = await import(`./${file}?t=${Date.now()}`)
            const p = mod?.default
            if (!p || typeof p !== 'object') continue
            let rawCat = p.category || (Array.isArray(p.tags) ? p.tags[0] : p.tags) || 'أخرى'
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
                if (/^ق\d+$/.test(c)) continue
                if (!grouped[cat].includes(c)) grouped[cat].push(c)
            }
        } catch {}
    }
    for (let k in grouped) if (!grouped[k].length) delete grouped[k]
    for (let k in grouped) grouped[k].sort((a, b) => a.localeCompare(b, 'ar'))
    return grouped
}

async function getAllSections() {
    let qSections = getQSections()
    let tagGrouped = await getTagSections()
    let qTitles = new Set(qSections.map(s => normalize(s.title)))
    let tagSections = []
    for (let cat of Object.keys(tagGrouped)) {
        if (qTitles.has(normalize(cat))) continue
        tagSections.push({ type: 'tag', key: cat, title: cat, icon: getIcon(cat), cmds: tagGrouped[cat] })
    }
    tagSections.sort((a, b) => a.title.localeCompare(b.title, 'ar'))
    return { all: [...qSections, ...tagSections], qSections, tagGrouped, tagSections }
}

// تحويل الضغطة لأمر
function convertClick(m) {
    let selectedId = ''
    if (m.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        selectedId = m.message.listResponseMessage.singleSelectReply.selectedRowId
    } else if (m.message?.interactiveResponseMessage?.body?.text) {
        selectedId = m.message.interactiveResponseMessage.body.text
    } else if (m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
        try {
            let p = JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)
            selectedId = p.id || ''
        } catch {}
    } else if (m.message?.viewOnceMessage?.message?.interactiveResponseMessage?.body?.text) {
        selectedId = m.message.viewOnceMessage.message.interactiveResponseMessage.body.text
    } else if (m.message?.viewOnceMessageV2?.message?.interactiveResponseMessage?.body?.text) {
        selectedId = m.message.viewOnceMessageV2.message.interactiveResponseMessage.body.text
    } else if (m.message?.viewOnceMessage?.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        selectedId = m.message.viewOnceMessage.message.listResponseMessage.singleSelectReply.selectedRowId
    } else if (m.message?.viewOnceMessageV2?.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        selectedId = m.message.viewOnceMessageV2.message.listResponseMessage.singleSelectReply.selectedRowId
    }
    if (!selectedId) return null
    selectedId = String(selectedId).trim()
    if (!selectedId) return null
    console.log('[اوامر] ضغطة:', selectedId)

    if (/^\.?ق\s*\d+$/.test(selectedId)) {
        let cmd = selectedId.replace(/\s+/g, '')
        if (!cmd.startsWith('.')) cmd = '.' + cmd
        return cmd
    }
    if (/^\.?قسم\s+/i.test(selectedId)) {
        return selectedId.startsWith('.') ? selectedId : '.' + selectedId
    }
    if (!selectedId.startsWith('.') && selectedId.length < 40 && !selectedId.includes('http')) {
        let qSections = getQSections()
        let qMatch = qSections.find(s =>
            normalize(s.title) === normalize(selectedId) ||
            normalize(s.title).includes(normalize(selectedId)) ||
            normalize(selectedId).includes(normalize(s.title))
        )
        if (qMatch) return `.${qMatch.key}`
        return `.قسم ${selectedId}`
    }
    return null
}

async function showTagSection(conn, m, catName, usedPrefix) {
    let qSections = getQSections()
    let qMatch = qSections.find(s =>
        normalize(s.title) === normalize(catName) ||
        normalize(catName).includes(normalize(s.title)) ||
        normalize(s.title).includes(normalize(catName))
    )
    if (qMatch) {
        m.text = `.${qMatch.key}`
        m.body = `.${qMatch.key}`
        if (m.msg) m.msg.text = `.${qMatch.key}`
        return { isQ: true }
    }
    let { tagGrouped } = await getAllSections()
    let found = Object.keys(tagGrouped).find(c => normalize(c) === normalize(catName))
    if (!found) found = Object.keys(tagGrouped).find(c => normalize(c).includes(normalize(catName)) || normalize(catName).includes(normalize(c)))
    if (!found) {
        return conn.sendMessage(m.chat, { text: `❌ ما لقيت قسم ${catName}\nاكتب .اوامر وشوف الأقسام` }, { quoted: m })
    }
    let cmds = tagGrouped[found]
    let text = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n`
    text += `  ${getIcon(found)} قسم: ${found}\n`
    text += `  📦 عدد الأوامر: ${cmds.length}\n\n`
    for (let c of cmds) text += `  • ${usedPrefix || '.'}${c}\n`
    text += `\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n  اكتب ${usedPrefix || '.'}اوامر للرجوع\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
    await conn.sendMessage(m.chat, { text }, { quoted: m })
    return { isQ: false }
}

// ✅ جلب الصورة - من menu-url.txt اذا موجود، ولا من الرابط حقك
async function getImageMedia(conn) {
    try {
        let imageUrl = MENU_IMAGE
        let urlFile = path.join(__dirname, 'menu-url.txt')
        if (fs.existsSync(urlFile)) {
            let saved = fs.readFileSync(urlFile, 'utf-8').trim()
            if (saved.startsWith('https://') && !saved.includes('xxxxxx')) imageUrl = saved
        }
        // اذا الرابط وهمي، نرجع null وما نخرب القائمة
        if (!imageUrl || imageUrl.includes('xxxxxx')) return null
        const res = await fetch(imageUrl, { signal: AbortSignal.timeout(7000) })
        if (!res.ok) return null
        const buf = Buffer.from(await res.arrayBuffer())
        if (!buf.length) return null
        return await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer })
    } catch { return null }
}

async function showMenu(conn, m) {
    let user = m.pushName || 'مستخدم'
    let { all, qSections, tagSections } = await getAllSections()
    if (!all.length) {
        return conn.sendMessage(m.chat, { text: '❌ ما لقيت أي أقسام!' }, { quoted: m })
    }

    let rows = all.slice(0, 10).map(s => ({
        header: s.icon,
        title: String(s.title).slice(0, 24),
        description: String(s.type === 'q' ? s.desc : `${s.cmds.length} أمر`).slice(0, 72),
        id: s.type === 'q' ? `.${s.key}` : `.قسم ${s.title}`
    }))

    const totalCmds = Object.values(await getTagSections()).flat().length
    const text = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n  ⚡ أهلاً بك يا ${user}\n\n  ✦ الفخامة لها عنوان واحد\n  ✦ القوة .. السرعة .. الهيبة\n  ✦ اختر .. واستمتع\n  ✦ ${qSections.length} قسم ثابت | ${tagSections.length} قسم تلقائي | ${totalCmds} أمر\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`

    // ✅ الصورة + القائمة مع بعض في نفس الرسالة
    const media = await getImageMedia(conn)
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

let handler = async (m, { conn, usedPrefix }) => {
    try {
        let full = (m.text || m.body || '').trim()
        if (/^\.?قسم/i.test(full)) {
            let cat = full.replace(/^\.?قسم\s*/i, '').trim()
            if (!cat) return showMenu(conn, m)
            let res = await showTagSection(conn, m, cat, usedPrefix || '.')
            if (res?.isQ) return
            return
        }
        return showMenu(conn, m)
    } catch (e) {
        console.error('MENU ERROR:', e)
        await conn.sendMessage(m.chat, { text: `❌ حصل خطأ: ${e.message}` }, { quoted: m })
    }
}

// ✅ الضغطة في مكانين معاً عشان تشتغل 100%
handler.before = async (m, { conn }) => {
    let cmd = convertClick(m)
    if (cmd) {
        m.text = cmd
        m.body = cmd
        if (m.msg) m.msg.text = cmd
    }
}
handler.all = async (m, { conn }) => {
    if (!m.text && !m.body) {
        let cmd = convertClick(m)
        if (cmd) {
            m.text = cmd
            m.body = cmd
            if (m.msg) m.msg.text = cmd
        }
    }
}

handler.help = ['اوامر', 'قسم']
handler.tags = ['main']
handler.command = /^(اوامر|menu|القائمة|قسم|ق)$/i
export default handler