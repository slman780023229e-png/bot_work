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

import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ownerNumber = '967780023229'
const channelUrl = 'https://whatsapp.com/channel/0029XXXXXXXX' // <-- حط رابط قناتك هنا

// ✅ الرابط الجديد
const imageUrl = 'https://n.uguu.se/xhgiNqAmQfvh.jpg'

// ✅ القائمة الثابتة حقك - اذا القراءة التلقائية فشلت، هذي تشتغل
const FIXED_ROWS = [
    { header: '👑', title: 'الجروبات والمشرفين', description: 'إدارة وحماية الجروبات', id: '.ق1' },
    { header: '📥', title: 'التحميلات', description: 'تحميل الفيديوهات والصور والملفات', id: '.ق2' },
    { header: '🎭', title: 'الترفيه والتسلية', description: 'أوامر المرح والتفاعل', id: '.ق3' },
    { header: '🎮', title: 'الألعاب', description: 'ألعاب وتحديات', id: '.ق4' },
    { header: '👑', title: 'النقابات', description: 'أوامر النقابات وإدارة النقابة', id: '.ق5' },
    { header: '🛠️', title: 'الأدوات', description: 'أدوات ومميزات البوت', id: '.ق6' },
    { header: '🎬', title: 'الإيديت والأغاني', description: 'الإيديت والموسيقى والأغاني', id: '.ق7' },
]

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

// ✅ الحالة 1: قراءة ق1 .. ق10 تلقائي من الملفات
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
            sections.push({ header: info.icon, title: info.title, description: info.desc, id: `.${key}`, key, type: 'q' })
            break
        }
    }
    sections.sort((a, b) => parseInt(a.key.replace('ق', '')) - parseInt(b.key.replace('ق', '')))
    return sections
}

// ✅ الحالة 2: قراءة اقسام tags تلقائي من الملفات
async function getTagSections() {
    let files = []
    try { files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')) } catch { return [] }
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
    let qTitles = new Set(getQSections().map(s => normalize(s.title)))
    let out = []
    for (let cat of Object.keys(grouped)) {
        if (qTitles.has(normalize(cat))) continue
        out.push({ header: getIcon(cat), title: cat, description: `${grouped[cat].length} أمر`, id: `.قسم ${cat}`, type: 'tag', cmds: grouped[cat] })
    }
    out.sort((a, b) => a.title.localeCompare(b.title, 'ar'))
    return out
}

// ✅ دمج الحالتين: ق + tags
async function getAllRows() {
    try {
        let q = getQSections()
        let tags = await getTagSections()
        let all = [...q, ...tags]
        if (!all.length) return FIXED_ROWS
        return all
    } catch {
        return FIXED_ROWS
    }
}

// ✅ عرض قسم tags لما يضغط عليه
async function showTagSection(conn, m, catName, usedPrefix) {
    let qSections = getQSections()
    let qMatch = qSections.find(s =>
        normalize(s.title) === normalize(catName) ||
        normalize(catName).includes(normalize(s.title)) ||
        normalize(s.title).includes(normalize(catName))
    )
    // اذا طلع قسم ق، نرجع isQ عشان القالب يحوله لأمر ق
    if (qMatch) return { isQ: true, key: qMatch.key }

    let tagSections = await getTagSections()
    let found = tagSections.find(s => normalize(s.title) === normalize(catName))
    if (!found) found = tagSections.find(s => normalize(s.title).includes(normalize(catName)) || normalize(catName).includes(normalize(s.title)))
    if (!found) {
        return conn.sendMessage(m.chat, { text: `❌ ما لقيت قسم ${catName}\nاكتب .اوامر وشوف الأقسام المتوفرة` }, { quoted: m })
    }
    let text = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n  ${found.header} قسم: ${found.title}\n  📦 عدد الأوامر: ${found.cmds.length}\n\n`
    for (let c of found.cmds) text += `  • ${usedPrefix || '.'}${c}\n`
    text += `\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n  اكتب ${usedPrefix || '.'}اوامر للرجوع\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
    await conn.sendMessage(m.chat, { text }, { quoted: m })
    return { isQ: false }
}

// ✅ تحويل الضغطة لأمر - يشتغل في الحالتين
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

    // الحالة 1: ضغطة .ق1 .. .ق10
    if (/^\.?ق\s*\d+$/.test(selectedId)) {
        let cmd = selectedId.replace(/\s+/g, '')
        if (!cmd.startsWith('.')) cmd = '.' + cmd
        return cmd
    }
    // الحالة 2: ضغطة .قسم xxx
    if (/^\.?قسم\s+/i.test(selectedId)) {
        return selectedId.startsWith('.') ? selectedId : '.' + selectedId
    }
    // ضغطة اسم بس مثل "الإيديت والأغاني" او "الإسلامي"
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

const handler = async (m, { conn, usedPrefix }) => {

    try {

        // اذا كتب .قسم xxx
        let full = (m.text || m.body || '').trim()
        if (/^\.?قسم\s+/i.test(full)) {
            let cat = full.replace(/^\.?قسم\s*/i, '').trim()
            if (!cat) {
                // اذا كتب .قسم لحاله، نعرض القائمة
            } else {
                let res = await showTagSection(conn, m, cat, usedPrefix || '.')
                if (res?.isQ) return // القالب بيحولها لأمر ق
                return
            }
        }

        // ⚡ تفاعل برق
        try { await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } }) } catch {}

        const user = await conn.getName(m.sender)

        // ✅ الصورة + القائمة مع بعض - اذا الصورة فشلت نرسل القائمة بدون صورة، ما نسكت
        let media = null
        try {
            const imageRes = await fetch(imageUrl)
            if (imageRes.ok) {
                const imageBuffer = Buffer.from(await imageRes.arrayBuffer())
                media = await prepareWAMessageMedia({ image: imageBuffer }, { upload: conn.waUploadToServer })
            }
        } catch (e) {
            console.log('[اوامر] الصورة فشلت، بنكمل بدونها:', e.message)
        }

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

        // ✅ الصفوف تلقائية: ق + tags، اذا فشلت نرجع للثابتة حقك
        let allRows = await getAllRows()
        // واتساب يقبل 10 صفوف بس في القسم الواحد، نقسمها لقسمين اذا زادت
        let sections = []
        if (allRows.length <= 10) {
            sections = [{ title: '╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮', rows: allRows.map(r => ({ header: r.header, title: String(r.title).slice(0, 24), description: String(r.description).slice(0, 72), id: r.id })) }]
        } else {
            let qRows = allRows.filter(r => r.type === 'q' || FIXED_ROWS.find(f => f.id === r.id))
            let tagRows = allRows.filter(r => r.type === 'tag')
            if (qRows.length) sections.push({ title: '╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮', rows: qRows.slice(0, 10).map(r => ({ header: r.header, title: String(r.title).slice(0, 24), description: String(r.description).slice(0, 72), id: r.id })) })
            if (tagRows.length) sections.push({ title: '╭━━━〔 أقسام تلقائية 〕━━━╮', rows: tagRows.slice(0, 10).map(r => ({ header: r.header, title: String(r.title).slice(0, 24), description: String(r.description).slice(0, 72), id: r.id })) })
            if (!sections.length) sections = [{ title: '╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮', rows: FIXED_ROWS }]
        }

        const interactiveMessage = {

            body: {
                text: text
            },

            footer: {
                text: '✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 | الأفضل دائماً ✦'
            },

            header: media?.imageMessage ? {
                title: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓',
                hasMediaAttachment: true,
                imageMessage: media.imageMessage
            } : {
                title: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓',
                hasMediaAttachment: false
            },

            nativeFlowMessage: {

                buttons: [

                    {
                        name: 'single_select',

                        buttonParamsJson:
                            JSON.stringify({

                                title: '📂 قائمة الأوامر',

                                sections: sections

                            })
                    },

                    {
                        name: 'cta_url',

                        buttonParamsJson:
                            JSON.stringify({

                                display_text:
                                    '👑 المطور',

                                url:
                                    `https://wa.me/${ownerNumber}`,

                                merchant_url:
                                    `https://wa.me/${ownerNumber}`

                            })
                    },

                    {
                        name: 'cta_url',

                        buttonParamsJson:
                            JSON.stringify({

                                display_text:
                                    '📢 القناة',

                                url:
                                    channelUrl,

                                merchant_url:
                                    channelUrl

                            })
                    },

                    {
                        name: 'quick_reply',

                        buttonParamsJson:
                            JSON.stringify({

                                display_text:
                                    '🤖 تنصيب البوت',

                                id:
                                    '.تنصيب'

                            })
                    }

                ],

                messageParamsJson: ''
            }
        }

        const msg =
            generateWAMessageFromContent(
                m.chat,

                {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage:
                                proto.Message.InteractiveMessage
                                    .fromObject(
                                        interactiveMessage
                                    )
                        }
                    }
                },

                {
                    userJid: conn.user.jid,
                    quoted: m
                }
            )

        await conn.relayMessage(
            m.chat,
            msg.message,
            {
                messageId: msg.key.id
            }
        )

    } catch (e) {

        console.error(
            '❌ ARTHUR BOT MENU ERROR:',
            e
        )

        await m.reply(
            '❌ حصل خطأ أثناء فتح قائمة 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓.'
        )
    }
}

// ✅ الضغطة تشتغل في الحالتين - في before و all معاً، اذا واحد ما اشتغل الثاني يلحقه
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

handler.command =
    /^(اوامر|قسم)$/i

export default handler