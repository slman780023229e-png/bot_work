// plugins/ضغطة.js
// هذا الملف هو اللي يخلي الضغطة تشتغل، حتى لو قالبك ما يدعم handler.before
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const normalize = (s) => String(s || '').trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').toLowerCase()

// نجيب اسم القسم من الضغطة
function getClickId(m) {
    let id = ''
    // ضغطة القائمة الجديدة interactive
    if (m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
        try {
            let p = JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)
            id = p.id || ''
        } catch {}
    }
    if (!id && m.message?.interactiveResponseMessage?.body?.text) {
        id = m.message.interactiveResponseMessage.body.text
    }
    // ضغطة القائمة القديمة list
    if (!id && m.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        id = m.message.listResponseMessage.singleSelectReply.selectedRowId
    }
    // ضغطة داخل viewOnce
    if (!id && m.message?.viewOnceMessage?.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
        try {
            let p = JSON.parse(m.message.viewOnceMessage.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)
            id = p.id || ''
        } catch {}
    }
    if (!id && m.message?.viewOnceMessageV2?.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
        try {
            let p = JSON.parse(m.message.viewOnceMessageV2.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)
            id = p.id || ''
        } catch {}
    }
    if (!id && m.message?.viewOnceMessage?.message?.interactiveResponseMessage?.body?.text) {
        id = m.message.viewOnceMessage.message.interactiveResponseMessage.body.text
    }
    if (!id && m.message?.viewOnceMessageV2?.message?.interactiveResponseMessage?.body?.text) {
        id = m.message.viewOnceMessageV2.message.interactiveResponseMessage.body.text
    }
    return id ? String(id).trim() : ''
}

let handler = async (m, { conn, usedPrefix }) => {
    let clicked = getClickId(m)
    if (!clicked) return
    console.log('[ضغطة] وصلت ضغطة:', clicked)

    // الحالة 1: ضغطة .ق1 .. .ق10
    if (/^\.?ق\s*\d+$/.test(clicked)) {
        let qKey = clicked.replace(/^\.?/, '').replace(/\s+/g, '') // ق2
        let qFile = path.join(__dirname, `${qKey}.js`)
        // اذا ملف ق2 موجود، نشغله مباشرة
        if (fs.existsSync(qFile)) {
            try {
                const mod = await import(`./${qKey}.js?t=${Date.now()}`)
                let qHandler = mod?.default
                if (qHandler) {
                    // نعطي ملف ق2 رسالة وهمية كأن المستخدم كتب .ق2
                    m.text = `.${qKey}`
                    m.body = `.${qKey}`
                    if (m.msg) m.msg.text = `.${qKey}`
                    await qHandler(m, { conn, usedPrefix: usedPrefix || '.', command: qKey, args: [], text: '', usedPrefix: usedPrefix || '.' })
                    return
                }
            } catch (e) {
                console.log('[ضغطة] خطأ في تشغيل', qKey, e.message)
            }
        }
        // اذا ما لقينا الملف، نرد على المستخدم ونقوله يكتب الامر
        return conn.sendMessage(m.chat, { text: `اكتب *${usedPrefix || '.'}${qKey}* لفتح القسم` }, { quoted: m })
    }

    // الحالة 2: ضغطة .قسم xxx
    if (/^\.?قسم\s+/i.test(clicked)) {
        let cat = clicked.replace(/^\.?قسم\s*/i, '').trim()
        // نرسل الامر لـ اوامر.js عن طريق اننا ننفذ دالة عرض القسم هنا مباشرة
        // نبحث في الملفات عن tags
        let files = []
        try { files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')) } catch {}
        let foundCmds = []
        let foundCat = ''
        for (let file of files) {
            if (file === 'اوامر.js' || file === 'ضغطة.js') continue
            let content = ''
            try { content = fs.readFileSync(path.join(__dirname, file), 'utf-8') } catch { continue }
            if (file.match(/^ق\d+\.js$/)) continue
            try {
                const mod = await import(`./${file}?t=${Date.now()}`)
                const p = mod?.default
                if (!p || typeof p !== 'object') continue
                let rawCat = p.category || (Array.isArray(p.tags) ? p.tags[0] : p.tags) || ''
                if (normalize(rawCat) === normalize(cat) || normalize(rawCat).includes(normalize(cat)) || normalize(cat).includes(normalize(rawCat))) {
                    foundCat = rawCat
                    let list = []
                    if (Array.isArray(p.command)) list = p.command
                    else if (p.command instanceof RegExp) list = p.command.source.replace(/[\^\$\(\)\?\.\*\+\|\\\/\[\]]/g, ' ').split(/\s+/).filter(s => s.length > 1)
                    else if (typeof p.command === 'string') list = [p.command]
                    for (let c of list) {
                        c = String(c).trim().replace(/[\^\$\(\)\?\|\\\/\[\]]/g, '').trim()
                        if (c && c.length > 1 && !foundCmds.includes(c)) foundCmds.push(c)
                    }
                }
            } catch {}
        }
        if (foundCmds.length) {
            let text = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n  قسم: ${foundCat}\n  📦 عدد الأوامر: ${foundCmds.length}\n\n`
            for (let c of foundCmds) text += `  • ${usedPrefix || '.'}${c}\n`
            text += `\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n  اكتب ${usedPrefix || '.'}اوامر للرجوع\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
            return conn.sendMessage(m.chat, { text }, { quoted: m })
        }
        return conn.sendMessage(m.chat, { text: `❌ ما لقيت قسم ${cat}` }, { quoted: m })
    }

    // الحالة 3: ضغطة اسم بس مثل "الإيديت والأغاني" او "الإسلامي"
    if (!clicked.startsWith('.') && clicked.length < 40 && !clicked.includes('http')) {
        // هل هو اسم قسم ق؟
        let qTitles = {
            'الجروبات والمشرفين': 'ق1',
            'التحميلات': 'ق2',
            'الترفيه والتسلية': 'ق3',
            'الألعاب': 'ق4',
            'النقابات': 'ق5',
            'الأدوات': 'ق6',
            'الإيديت والأغاني': 'ق7',
        }
        for (let title in qTitles) {
            if (normalize(title) === normalize(clicked) || normalize(title).includes(normalize(clicked)) || normalize(clicked).includes(normalize(title))) {
                let qKey = qTitles[title]
                // نعيد نفس منطق ق
                m.text = `.${qKey}`
                m.body = `.${qKey}`
                let qFile = path.join(__dirname, `${qKey}.js`)
                if (fs.existsSync(qFile)) {
                    try {
                        const mod = await import(`./${qKey}.js?t=${Date.now()}`)
                        await mod.default(m, { conn, usedPrefix: usedPrefix || '.', command: qKey, args: [], text: '', usedPrefix: usedPrefix || '.' })
                        return
                    } catch {}
                }
                return conn.sendMessage(m.chat, { text: `اكتب *${usedPrefix || '.'}${qKey}* لفتح قسم ${title}` }, { quoted: m })
            }
        }
        // اذا مو ق، فهو tags
        m.text = `.قسم ${clicked}`
        m.body = `.قسم ${clicked}`
        // ننفذ نفس منطق قسم عن طريق اعادة استدعاء هذا الهاندلر
        return handler(m, { conn, usedPrefix })
    }
}

// ✅ مهم: هذا اللي يخلي الملف يشتغل على كل رسالة، مو بس على الأوامر
// في بعض القوالب اسمه handler.all، وفي بعضها handler.before، نحط الاثنين
handler.all = handler
handler.before = handler

// ✅ ونخليه بعد يقبل اي نص، عشان القالب يشغله حتى لو ما فيه امر
handler.command = /.*/i
handler.customPrefix = /.*/i

export default handler