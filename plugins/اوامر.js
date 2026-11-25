// plugins/اوامر.js
// ✧ ARTHUR BOT - قائمة الأقسام والأوامر التلقائية ✧
// ✧ بطريقة كلاوس - ButtonV2 مثل ق1 ✧

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { ButtonV2 } from '../core/NIXCODE.js'
import {
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    proto
} from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ownerNumber = '967780023229'
const channelUrl = 'https://whatsapp.com/channel/0029XXXXXXXX'
const imageUrl = 'https://pomf2.lain.la/f/3ohvpe3a.jpeg'

const CACHE_TTL = 30_000
let cachedMenu = null
let cachedAt = 0

const normalize = (value = '') => String(value)
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .toLowerCase()

// ✧ طريقة أسهل: قاعدة واحدة لكل أمر بدل تكرار بنترست ✧
const CANONICAL_RULES = [
    { keys: ['بنتر', 'pint', 'pin'], to: 'بنترست' },
    { keys: ['تيك', 'tiktok', 'tik'], to: 'تيك توك' },
    { keys: ['انستا', 'insta'], to: 'انستقرام' },
    { keys: ['فيس', 'face'], to: 'فيسبوك' },
    { keys: ['يوتيوب', 'youtube', 'yt'], to: 'يوتيوب' },
    { keys: ['واتس', 'whatsapp'], to: 'واتساب' },
    { keys: ['جوجل', 'google'], to: 'جوجل' },
]

const getCanonicalCommand = (value = '') => {
    const n = normalize(value).replace(/\s+/g, '')
    for (const rule of CANONICAL_RULES) {
        if (rule.keys.some(k => n.includes(k))) return rule.to
    }
    return String(value).trim()
}

const getCanonicalKey = (value = '') => {
    return getCanonicalCommand(value)
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[\u064B-\u0652]/g, '')
        .replace(/\s+/g, '')
        .replace(/ا/g, '')
        .replace(/ي/g, '')
        .replace(/ه$/g, '')
}

const isSameCommand = (a, b) => {
    const ka = getCanonicalKey(a)
    const kb = getCanonicalKey(b)
    if (ka === kb) return true
    if (getCanonicalCommand(a) === getCanonicalCommand(b)) return true
    if (!ka || !kb) return false
    if (ka.length >= 3 && kb.length >= 3) {
        if (ka.startsWith(kb) && (ka.length - kb.length) <= 3) return true
        if (kb.startsWith(ka) && (kb.length - ka.length) <= 3) return true
    }
    return false
}

const CATEGORY_ALIASES = {
    group: 'إدارة المجموعات',
    groups: 'إدارة المجموعات',
    admin: 'إدارة المجموعات',
    administration: 'إدارة المجموعات',
    moderation: 'إدارة المجموعات',
    downloader: 'التحميلات',
    download: 'التحميلات',
    games: 'الألعاب',
    game: 'الألعاب',
    fun: 'الترفيه',
    entertainment: 'الترفيه',
    unions: 'النقابات',
    guild: 'النقابات',
    tools: 'الأدوات',
    tool: 'الأدوات',
    sticker: 'الأدوات',
    ai: 'الذكاء الاصطناعي',
    owner: 'المطور',
    dev: 'المطور',
    main: 'النظام',
    system: 'النظام',
    music: 'الموسيقى',
    islamic: 'الإسلامي',
    community: 'المجتمع'
}

const CATEGORY_ORDER = [
    'إدارة المجموعات',
    'التحميلات',
    'الألعاب',
    'الترفيه',
    'النقابات',
    'الأدوات',
    'الذكاء الاصطناعي',
    'الموسيقى',
    'الإسلامي',
    'المجتمع',
    'المطور',
    'النظام',
    'أخرى'
]

const getCategory = (plugin) => {
    const raw = plugin?.category ??
        (Array.isArray(plugin?.tags) ? plugin.tags[0] : plugin?.tags) ??
        'أخرى'
    const value = String(raw || 'أخرى').trim()
    return CATEGORY_ALIASES[normalize(value)] || value
}

const getIcon = (category) => {
    const key = normalize(category)
    if (key.includes('مجموع') || key.includes('ادار') || key.includes('حماي')) return '🛡️'
    if (key.includes('تحميل')) return '📥'
    if (key.includes('العاب')) return '🎮'
    if (key.includes('ترفيه')) return '🎭'
    if (key.includes('نقاب')) return '👑'
    if (key.includes('ادوات')) return '🛠️'
    if (key.includes('ذكاء')) return '🤖'
    if (key.includes('موسيقى')) return '🎵'
    if (key.includes('اسلام')) return '🕌'
    if (key.includes('مجتمع')) return '🌐'
    if (key.includes('مطور')) return '👑'
    if (key.includes('نظام')) return '⭐'
    return '📂'
}

// ✧ إيموجي لكل أمر حسب معناه ✧
const getCommandIcon = (command = '') => {
    const n = normalize(command)
    if (n.includes('نخبه') || n.includes('vip') || n.includes('مميز')) return '👑'
    if (n.includes('منشن') || n.includes('تاق') || n.includes('الكل')) return '👥'
    if (n.includes('طرد') || n.includes('حظر') || n.includes('بان')) return '🚫'
    if (n.includes('ترقيه') || n.includes('ادمن') || n.includes('مشرف')) return '👑'
    if (n.includes('اعفاء') || n.includes('عفو')) return '🛡️'
    if (n.includes('بوست') || n.includes('منشور')) return '📝'
    if (n.includes('لينك') || n.includes('رابط') || n.includes('دعوه')) return '🔗'
    if (n.includes('فتح') || n.includes('قفل') || n.includes('شات')) return '🔓'
    if (n.includes('مخفي') || n.includes('شبح')) return '👻'
    if (n.includes('منع') || n.includes('مانع')) return '📵'
    if (n.includes('بنترست') || n.includes('بنتر')) return '📌'
    if (n.includes('تيك')) return '🎵'
    if (n.includes('انستا')) return '📸'
    if (n.includes('فيس')) return '📘'
    if (n.includes('يوتيوب')) return '▶️'
    if (n.includes('جوجل') || n.includes('بحث')) return '🔍'
    if (n.includes('صوره') || n.includes('صورة') || n.includes('خلفيه')) return '🖼️'
    if (n.includes('ملصق') || n.includes('ستيكر')) return '🏷️'
    if (n.includes('اغنيه') || n.includes('موسيقى') || n.includes('صوت')) return '🎵'
    if (n.includes('لعبه') || n.includes('لعب') || n.includes('تحدي')) return '🎮'
    if (n.includes('زواج') || n.includes('حب')) return '💍'
    if (n.includes('ذكاء') || n.includes('اسال')) return '🤖'
    if (n.includes('قران') || n.includes('اسلام') || n.includes('دعاء') || n.includes('اذكار')) return '🕌'
    if (n.includes('تنصيب') || n.includes('تثبيت')) return '⚙️'
    if (n.includes('اوامر') || n.includes('قائمه') || n.includes('مساعده')) return '📂'
    if (n.includes('بنك') || n.includes('فلوس') || n.includes('عملات')) return '💰'
    if (n.includes('سرقه') || n.includes('حرامي')) return '🦹'
    if (n.includes('ترتيب') || n.includes('توب') || n.includes('افضل')) return '🏆'
    return '✦'
}

const getCategoryDescription = (category) => {
    const key = normalize(category)
    if (key.includes('مجموع')) return 'إدارة المجموعات وحمايتها'
    if (key.includes('تحميل')) return 'تحميل الصور والفيديوهات والملفات'
    if (key.includes('العاب')) return 'ألعاب وتحديات ومسابقات'
    if (key.includes('ترفيه')) return 'أوامر المرح والتفاعل'
    if (key.includes('نقاب')) return 'إدارة الألقاب والنقابات'
    if (key.includes('ادوات')) return 'أدوات ومميزات البوت'
    if (key.includes('ذكاء')) return 'أدوات الذكاء الاصطناعي'
    if (key.includes('موسيقى')) return 'الأغاني والصوتيات'
    if (key.includes('اسلام')) return 'أوامر وخدمات إسلامية'
    if (key.includes('مطور')) return 'أوامر المطور والإدارة'
    if (key.includes('نظام')) return 'معلومات وخدمات النظام'
    if (key.includes('مجتمع')) return 'روابط ومجتمع البوت'
    return 'الأوامر المتاحة في هذا القسم'
}

const scanPluginFiles = (directory, result = []) => {
    let entries = []
    try {
        entries = fs.readdirSync(directory, { withFileTypes: true })
    } catch {
        return result
    }
    for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
        const fullPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            scanPluginFiles(fullPath, result)
        } else if (
            entry.isFile() &&
            entry.name.endsWith('.js') &&
            entry.name !== 'اوامر.js' &&
            !/^ق\s*\d+\.js$/i.test(entry.name)
        ) {
            result.push(fullPath)
        }
    }
    return result
}

const cleanCommand = (value) => String(value ?? '')
    .trim()
    .replace(/^[.!/#]+/, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()

const commandsFromPattern = (pattern) => {
    if (!(pattern instanceof RegExp)) return []
    let source = pattern.source
    if (!source || source === '(?:)') return []
    source = source.replace(/^\^/, '').replace(/\$$/, '')
    source = source.replace(/^\(\?:/, '').replace(/\)$/, '')
    source = source.replace(/\\d\+/g, ' رقم')
    source = source.replace(/\\s\*/g, ' ')
    source = source.replace(/\\-/g, '-')
    return source.split('|')
        .map(part => part
            .replace(/\\([A-Za-zء-ي])/g, '$1')
            .replace(/[()[\]{}?*+.$^]/g, '')
            .replace(/\\/g, '')
            .trim())
        .filter(part =>
            part.length > 1 &&
            /^[\p{L}\p{N}_\- ]+$/u.test(part) &&
            !/^(?:s|d|w|b|i|g)$/i.test(part)
        )
}

const getPluginCommands = (plugin, fileName) => {
    let candidates = []
    if (Array.isArray(plugin?.help)) candidates.push(...plugin.help)
    const raw = plugin?.command
    if (Array.isArray(raw)) candidates.push(...raw)
    else if (typeof raw === 'string') candidates.push(raw)
    else if (raw instanceof RegExp) candidates.push(...commandsFromPattern(raw))
    if (plugin?.customPrefix instanceof RegExp) candidates.push(...commandsFromPattern(plugin.customPrefix))

    const cleaned = []
    for (const item of candidates) {
        const command = getCanonicalCommand(cleanCommand(item))
        if (!command || command.length > 45) continue
        if (/^(?:ق\s*\d+|اوامر|قسم)$/i.test(command)) continue
        if (!cleaned.includes(command)) cleaned.push(command)
    }
    if (!cleaned.length && plugin && ['object', 'function'].includes(typeof plugin) && fileName) {
        const fallback = getCanonicalCommand(cleanCommand(path.basename(fileName, '.js')))
        if (fallback && !/^ق\s*\d+$/i.test(fallback)) cleaned.push(fallback)
    }
    if (!cleaned.length) return []
    const unique = []
    for (const cmd of cleaned) {
        if (!unique.some(prev => isSameCommand(prev, cmd))) unique.push(cmd)
    }
    if (unique.length === 1) return unique
    const longest = [...unique].sort((a, b) => b.length - a.length)[0]
    return [longest]
}

const getMenuData = async (force = false) => {
    const now = Date.now()
    if (!force && cachedMenu && now - cachedAt < CACHE_TTL) return cachedMenu
    const files = scanPluginFiles(__dirname)
    const categories = new Map()
    const globalSeen = []
    for (const fullPath of files) {
        try {
            const stat = fs.statSync(fullPath)
            const moduleUrl = `${pathToFileURL(fullPath).href}?menu=${stat.mtimeMs}`
            const imported = await import(moduleUrl)
            const plugin = imported?.default
            if (!plugin || !['object', 'function'].includes(typeof plugin)) continue
            if (!plugin.command && !plugin.customPrefix) continue
            const category = getCategory(plugin)
            const commands = getPluginCommands(plugin, fullPath)
            if (!commands.length) continue
            if (!categories.has(category)) categories.set(category, new Map())
            const bucket = categories.get(category)
            for (const rawCommand of commands) {
                const command = getCanonicalCommand(rawCommand)
                if (globalSeen.some(prev => isSameCommand(prev, command))) continue
                globalSeen.push(command)
                const key = getCanonicalKey(command)
                if (!bucket.has(key)) {
                    bucket.set(key, {
                        command,
                        icon: getCommandIcon(command),
                        description: plugin.description || plugin.desc || 'أمر من أوامر البوت'
                    })
                }
            }
        } catch (error) {
            console.error(`[ARTHUR MENU] تعذر قراءة ${path.basename(fullPath)}:`, error.message)
        }
    }
    const orderedCategories = [...categories.keys()].sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a)
        const bi = CATEGORY_ORDER.indexOf(b)
        if (ai !== -1 || bi !== -1) {
            if (ai === -1) return 1
            if (bi === -1) return -1
            return ai - bi
        }
        return a.localeCompare(b, 'ar')
    })
    const result = {
        categories: orderedCategories.map(name => ({
            name,
            icon: getIcon(name),
            description: getCategoryDescription(name),
            commands: [...categories.get(name).values()]
                .sort((a, b) => a.command.localeCompare(b.command, 'ar'))
        })),
        totalCommands: orderedCategories.reduce(
            (sum, name) => sum + categories.get(name).size, 0
        )
    }
    cachedMenu = result
    cachedAt = now
    return result
}

const unwrapMessage = (message, depth = 0) => {
    if (!message || depth > 5) return null
    if (message.interactiveResponseMessage || message.listResponseMessage) return message
    const wrappers = ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'documentWithCaptionMessage']
    for (const key of wrappers) {
        if (message[key]?.message) {
            const found = unwrapMessage(message[key].message, depth + 1)
            if (found) return found
        }
    }
    return message
}

const getSelectedId = (m) => {
    const message = unwrapMessage(m?.message)
    const rowId = message?.listResponseMessage?.singleSelectReply?.selectedRowId
    if (rowId) return String(rowId).trim()
    const paramsJson = message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
    if (paramsJson) {
        try {
            const params = JSON.parse(paramsJson)
            const selected = params.id || params.row_id || params.selectedRowId || params.selected_row_id
            if (selected) return String(selected).trim()
        } catch {}
    }
    const bodyText = message?.interactiveResponseMessage?.body?.text
    return bodyText ? String(bodyText).trim() : ''
}

const findCategory = (menu, name) => {
    const wanted = normalize(name)
    return menu.categories.find(item => normalize(item.name) === wanted)
}

// ✧ فتح القسم - بطريقة كلاوس ButtonV2 مثل ق1 بالضبط - مضمون ✧
const showCategory = async (conn, m, categoryName, usedPrefix = '.') => {
    try {
        const menu = await getMenuData()
        const category = findCategory(menu, categoryName)
        if (!category) {
            return m.reply(`❌ القسم "${categoryName}" غير موجود.\nاكتب ${usedPrefix}اوامر لعرض الأقسام المتاحة.`)
        }

        let body = `*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*\n`
        body += `*┃* ${category.icon} ${category.name}\n`
        body += `*╰━━━━━━━━━━━━━━╯*\n\n`
        body += `*╭━━━〔 ${category.icon} ${category.name.toUpperCase()} 〕━━━╮*\n`
        for (const item of category.commands) {
            body += `*┃* ${item.icon} ╎ ${usedPrefix}${item.command}\n`
        }
        body += `*╰━━━━━━━━━━━━━━╯*\n\n`
        body += `💡 *إجمالي أوامر القسم:* ${category.commands.length}\n\n`
        body += `*╰─ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ─╯*`

        // نفس كود ق1 حرفياً
        await new ButtonV2(conn)
            .setBody(body)
            .setFooter('© 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓')
            .setThumbnail(imageUrl)
            .addButton('📂 الـقـائـمـة', '.اوامر')
            .addButton('👑 تـنـصـيـب', '.تنصيب')
            .send(m.chat)

    } catch (e) {
        console.error('❌ [قسم] ButtonV2 ERROR:', e)
        // لو فشل الزر لأي سبب، نرسل القسم كنص عشان ما يقول خطا
        try {
            const menu = await getMenuData()
            const category = findCategory(menu, categoryName)
            if (category) {
                let fallback = `*${category.icon} ${category.name}*\n\n`
                for (const item of category.commands) {
                    fallback += `${item.icon} .${item.command}\n`
                }
                fallback += `\n📂 .اوامر | 👑 .تنصيب`
                await m.reply(fallback)
            } else {
                await m.reply('❌ حصل خطأ أثناء فتح القسم.')
            }
        } catch {
            await m.reply('❌ حصل خطأ أثناء فتح القسم.')
        }
    }
}

const handler = async (m, { conn, usedPrefix }) => {
    try {
        const prefix = usedPrefix || '.'
        const fullText = String(m.text || m.body || '').trim()
        const sectionMatch = fullText.match(/^(?:[.!/#])?قسم(?:\s+|$)(.*)$/i)
        if (sectionMatch && sectionMatch[1]?.trim()) {
            return await showCategory(conn, m, sectionMatch[1].trim(), prefix)
        }

        try {
            await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } })
        } catch {}
        let user = 'صديقي'
        try { user = await conn.getName(m.sender) || 'صديقي' } catch {}
        const menu = await getMenuData()
        if (!menu.categories.length) {
            return conn.sendMessage(m.chat, {
                text: '❌ لم أتمكن من العثور على أقسام. تأكد من وجود command و tags في ملفات الإضافات.'
            }, { quoted: m })
        }
        let media = null
        try {
            const response = await fetch(imageUrl)
            if (response.ok) {
                const buffer = Buffer.from(await response.arrayBuffer())
                media = await prepareWAMessageMedia({ image: buffer }, { upload: conn.waUploadToServer })
            }
        } catch (error) {
            console.log('[اوامر] تعذر تحميل صورة القائمة:', error.message)
        }
        const bodyText =
`*◇❐ ═━╾⚡ ╼━═ ❐◇*

⚡ أهلاً بك يا ${user}

📂 الأقسام: *${menu.categories.length}*
⚔️ الأوامر: *${menu.totalCommands}*

✦ القوة .. السرعة .. الهيبة
✦ اختر القسم لعرض أوامره

*𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓*`
        const rows = menu.categories.map(category => ({
            header: category.icon,
            title: `⟨ ${category.name} ⟩`.slice(0, 24),
            description: `${category.description} | ${category.commands.length} أمر`.slice(0, 72),
            id: `.قسم ${category.name}`
        }))
        const sections = []
        for (let i = 0; i < rows.length; i += 10) {
            sections.push({
                title: i === 0 ? '📂 أقسام ARTHUR BOT' : `📂 أقسام إضافية ${Math.floor(i / 10) + 1}`,
                rows: rows.slice(i, i + 10)
            })
        }
        const interactiveMessage = {
            body: { text: bodyText },
            footer: { text: '✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 | الأفضل دائماً ✦' },
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
                        buttonParamsJson: JSON.stringify({ title: '📂 قائمة الأقسام', sections })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({ display_text: '👑 المطور', url: `https://wa.me/${ownerNumber}`, merchant_url: `https://wa.me/${ownerNumber}` })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({ display_text: '📢 القناة', url: channelUrl, merchant_url: channelUrl })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ display_text: '🤖 تنصيب البوت', id: '.تنصيب' })
                    }
                ],
                messageParamsJson: ''
            }
        }
        const outgoing = generateWAMessageFromContent(
            m.chat,
            { viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage) } } },
            { userJid: conn.user.jid, quoted: m }
        )
        return await conn.relayMessage(m.chat, outgoing.message, { messageId: outgoing.key.id })
    } catch (error) {
        console.error('❌ ARTHUR BOT MENU ERROR:', error)
        return m.reply('❌ حصل خطأ أثناء فتح قائمة ARTHUR BOT.')
    }
}

// ✧ هذا هو السر: before بس يحول الزر لنص، و handler هو اللي ينفذ مثل ق1 ✧
handler.before = async (m) => {
    const selected = getSelectedId(m)
    if (!selected) return
    if (/^(?:\.|!|\/|#)?قسم\s+/i.test(selected) || selected === '.اوامر' || selected === '.تنصيب') {
        m.text = selected
        m.body = selected
        m.message = { conversation: selected }
    }
}

handler.help = ['اوامر', 'قسم']
handler.tags = ['main']
handler.command = /^(اوامر|قسم)$/i

export default handler