// plugins/اوامر.js
// ✧ ARTHUR BOT - قائمة الأقسام والأوامر التلقائية ✧

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import {
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    proto
} from '@whiskeysockets/baileys'
import fetch from 'node-fetch'
import { ButtonV2 } from '../core/NIXCODE.js'
import { COMMAND_EMOJIS, getCommandEmoji as getDictEmoji } from '../core/commandEmojis.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ownerNumber = '967780023229'
const channelUrl = 'https://whatsapp.com/channel/0029XXXXXXXX'
const defaultImageUrl = 'https://pomf2.lain.la/f/3ohvpe3a.jpeg'

// صور الأقسام مع تصغير يحافظ على الوجه بالكامل وقص سفلي طفيف جدًا (0.05)
const SECTION_IMAGES = {
    groups: { url: 'https://files.catbox.moe/yu3pvo.jpg', cropBottom: 0.05 },
    download: { url: 'https://files.catbox.moe/is2shx.jpg', cropBottom: 0.05 },
    games: { url: 'https://files.catbox.moe/81wrja.jpg', cropBottom: 0.05 },
    system: { url: 'https://files.catbox.moe/od62an.jpg', cropBottom: 0.05 }
}

const CACHE_TTL = 30_000
let cachedMenu = null
let cachedAt = 0
const rawImgCache = new Map()
const processedImgCache = new Map()
let sharpLib = null
let sharpChecked = false

const normalize = (value = '') => String(value)
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()

const matchesAny = (text, list) => list.some(item => text.includes(item))

const COMMAND_ALIASES = {
    'بينتر': 'بنترست', 'بنتر': 'بنترست', 'بينترست': 'بنترست', 'بينتريست': 'بنترست',
    'بنتريست': 'بنترست', 'بنتيرست': 'بنترست', 'بينتيرست': 'بنترست', 'بنتير': 'بنترست',
    'بينتير': 'بنترست', 'pinterest': 'بنترست', 'pintrest': 'بنترست', 'pin': 'بنترست',
    'pint': 'بنترست', 'pins': 'بنترست',
    'تيكتوك': 'تيك توك', 'تيك': 'تيك توك', 'tiktok': 'تيك توك',
    'انستا': 'انستقرام', 'انستغرام': 'انستقرام', 'instagram': 'انستقرام',
    'فيس': 'فيسبوك', 'facebook': 'فيسبوك',
    'يوتيوب': 'يوتيوب', 'youtube': 'يوتيوب',
    'واتس': 'واتساب', 'whatsapp': 'واتساب',
    'جوجل': 'جوجل', 'google': 'جوجل',
    'نخبه': 'النخبه', 'النخبه': 'النخبه', 'نخبة': 'النخبه', 'النخبة': 'النخبه'
}

const getCanonicalCommand = (value = '') => {
    const n = normalize(value)
    if (!n) return ''
    if (COMMAND_ALIASES[n]) return COMMAND_ALIASES[n]

    const compact = n.replace(/\s+/g, '')
    if (
        compact.startsWith('بنتر') || compact.startsWith('بينتر') ||
        compact.startsWith('بنتير') || compact.startsWith('بينتير') ||
        compact.includes('pinter') || compact === 'pint' || compact === 'pin'
    ) return 'بنترست'

    if (compact === 'نخبه' || compact === 'النخبه') return 'النخبه'
    return String(value).trim()
}

const getCommandKey = (value = '') => normalize(getCanonicalCommand(value)).replace(/\s+/g, '')

const EMOJI_RULES = [
    [['منشن', 'تاغ', 'نداء'], '🎀'],
    [['بوست', 'نشر', 'رساله', 'اذاعه'], '🪄'],
    [['لينك', 'رابط', 'دعوه'], '🔗'],
    [['طرد', 'حظر', 'بان', 'ازاله', 'مخالفه'], '🚫'],
    [['اعفاء', 'ترقيه', 'مشرف', 'ادمن', 'رتبه'], '👤'],
    [['نخبه', 'لقب', 'نقابه', 'ملك', 'تاج'], '👑'],
    [['تحويل', 'تبديل', 'عكس', 'مقلب'], '🔄'],
    [['بنتر', 'تيك', 'انستا', 'فيس', 'يوتيوب', 'تحميل', 'تنزيل'], '📥'],
    [['لعبه', 'تحدي', 'مسابقه', 'اكس', 'سؤال', 'خمن', 'فزوره'], '🎮'],
    [['ملصق', 'ستيكر', 'صوره', 'تصميم', 'فلتر'], '🖼️'],
    [['ذكاء', 'ai', 'شات', 'سوال', 'شرح', 'ترجمه'], '🤖'],
    [['اغاني', 'موسيقى', 'صوت', 'شيله', 'نشيد'], '🎵'],
    [['قران', 'اذكار', 'حديث', 'صلاه', 'دعاء', 'تسبيح'], '🕌'],
    [['مطور', 'ريستارت', 'تحديث', 'فحص', 'بنق', 'حاله'], '👑'],
    [['مجموع', 'قروب', 'حمايه', 'قفل', 'فتح'], '🛡️'],
    [['بحث', 'جوجل', 'ويكي', 'معلومه'], '🔍']
]

const FALLBACK_EMOJIS = ['⚡', '✨', '🎯', '🌟', '🔥', '💎', '🧭', '📌']

// يقرأ التعبير الرمزي من core/commandEmojis.js أولًا، ثم القواعد والاحتياط
const resolveCommandEmoji = (cmd = '') => {
    const raw = String(cmd || '').trim()
    if (!raw) return '⚡'

    const canonical = getCanonicalCommand(raw)
    const candidates = [raw, canonical, normalize(raw), normalize(canonical)]

    for (const candidate of candidates) {
        if (!candidate) continue
        if (Object.prototype.hasOwnProperty.call(COMMAND_EMOJIS, candidate)) {
            return COMMAND_EMOJIS[candidate]
        }
        const fromDict = getDictEmoji(candidate, null)
        if (fromDict) return fromDict
    }

    const k = normalize(canonical || raw)
    const found = EMOJI_RULES.find(([keys]) => matchesAny(k, keys))
    if (found) return found[1]

    let hash = 0
    for (let i = 0; i < k.length; i++) {
        hash = (hash * 31 + k.charCodeAt(i)) >>> 0
    }
    return FALLBACK_EMOJIS[hash % FALLBACK_EMOJIS.length]
}

const getSectionReaction = (category) => {
    if (!category) return '🔎'
    const iconFromCategory = resolveCommandEmoji(`${category.name} ${category.icon || ''}`)
    if (iconFromCategory && iconFromCategory !== '⚡') return iconFromCategory
    const firstCmd = category.commands?.[0]?.command
    return firstCmd ? resolveCommandEmoji(firstCmd) : '📂'
}

const CATEGORY_ALIASES = {
    group: 'إدارة المجموعات', groups: 'إدارة المجموعات', admin: 'إدارة المجموعات',
    administration: 'إدارة المجموعات', moderation: 'إدارة المجموعات',
    downloader: 'التحميلات', download: 'التحميلات',
    games: 'الألعاب', game: 'الألعاب',
    fun: 'الترفيه', entertainment: 'الترفيه',
    unions: 'النقابات', guild: 'النقابات',
    tools: 'الأدوات', tool: 'الأدوات', sticker: 'الأدوات',
    ai: 'الذكاء الاصطناعي',
    owner: 'المطور', dev: 'المطور',
    main: 'النظام', system: 'النظام',
    music: 'الموسيقى', islamic: 'الإسلامي', community: 'المجتمع'
}

const CATEGORY_ORDER = [
    'إدارة المجموعات', 'التحميلات', 'الألعاب', 'الترفيه', 'النقابات',
    'الأدوات', 'الذكاء الاصطناعي', 'الموسيقى', 'الإسلامي', 'المجتمع',
    'المطور', 'النظام', 'أخرى'
]

const getCategory = (plugin) => {
    const raw = plugin?.category ??
        (Array.isArray(plugin?.tags) ? plugin.tags[0] : plugin?.tags) ??
        'أخرى'
    const value = String(raw || 'أخرى').trim()
    return CATEGORY_ALIASES[normalize(value)] || value
}

const CATEGORY_META = [
    { keys: ['مجموع', 'ادار', 'حماي'], icon: '🛡️', desc: 'إدارة المجموعات وحمايتها', img: SECTION_IMAGES.groups },
    { keys: ['تحميل'], icon: '📥', desc: 'تحميل الصور والفيديوهات والملفات', img: SECTION_IMAGES.download },
    { keys: ['العاب'], icon: '🎮', desc: 'ألعاب وتحديات ومسابقات', img: SECTION_IMAGES.games },
    { keys: ['ترفيه'], icon: '🎭', desc: 'أوامر المرح والتفاعل', img: SECTION_IMAGES.games },
    { keys: ['نقاب'], icon: '👑', desc: 'إدارة الألقاب والنقابات', img: SECTION_IMAGES.groups },
    { keys: ['ادوات'], icon: '🛠️', desc: 'أدوات ومميزات البوت', img: SECTION_IMAGES.download },
    { keys: ['ذكاء'], icon: '🤖', desc: 'أدوات الذكاء الاصطناعي', img: SECTION_IMAGES.system },
    { keys: ['موسيقى'], icon: '🎵', desc: 'الأغاني والصوتيات', img: SECTION_IMAGES.download },
    { keys: ['اسلام'], icon: '🕌', desc: 'أوامر وخدمات إسلامية', img: SECTION_IMAGES.games },
    { keys: ['مجتمع'], icon: '🌐', desc: 'روابط ومجتمع البوت', img: SECTION_IMAGES.groups },
    { keys: ['مطور'], icon: '👑', desc: 'أوامر المطور والإدارة', img: SECTION_IMAGES.system },
    { keys: ['نظام'], icon: '⭐', desc: 'معلومات وخدمات النظام', img: SECTION_IMAGES.system }
]

const getCategoryMeta = (category) => {
    const key = normalize(category)
    return CATEGORY_META.find(item => matchesAny(key, item.keys)) || {
        icon: '📂',
        desc: 'الأوامر المتاحة في هذا القسم',
        img: SECTION_IMAGES.system
    }
}

const getIcon = (category) => getCategoryMeta(category).icon
const getCategoryDescription = (category) => getCategoryMeta(category).desc
const getCategoryImage = (category) => getCategoryMeta(category).img

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

    source = source
        .replace(/^\^/, '').replace(/\$$/, '')
        .replace(/^\(\?:/, '').replace(/\)$/, '')
        .replace(/\\d\+/g, ' رقم')
        .replace(/\\s\*/g, ' ')
        .replace(/\\-/g, '-')

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

// يضمن إرجاع أمر واحد فقط لكل ملف بلجن
const getPluginCommands = (plugin, fileName) => {
    const candidates = []
    if (Array.isArray(plugin?.help)) candidates.push(...plugin.help)

    const raw = plugin?.command
    if (Array.isArray(raw)) candidates.push(...raw)
    else if (typeof raw === 'string') candidates.push(raw)
    else if (raw instanceof RegExp) candidates.push(...commandsFromPattern(raw))

    if (plugin?.customPrefix instanceof RegExp) {
        candidates.push(...commandsFromPattern(plugin.customPrefix))
    }

    const cleaned = []
    for (const item of candidates) {
        const command = getCanonicalCommand(cleanCommand(item))
        if (!command || command.length > 45 || /^(?:ق\s*\d+|اوامر|قسم)$/i.test(command)) continue
        const key = getCommandKey(command)
        if (key && !cleaned.some(c => getCommandKey(c) === key)) cleaned.push(command)
    }

    if (!cleaned.length && plugin && ['object', 'function'].includes(typeof plugin) && fileName) {
        const fallback = getCanonicalCommand(cleanCommand(path.basename(fileName, '.js')))
        if (fallback && !/^ق\s*\d+$/i.test(fallback)) cleaned.push(fallback)
    }

    if (!cleaned.length) return []
    if (cleaned.length === 1) return [cleaned[0]]

    const canonicalValues = new Set(Object.values(COMMAND_ALIASES))
    return [cleaned.find(c => canonicalValues.has(c)) || cleaned[0]]
}

const getMenuData = async (force = false) => {
    const now = Date.now()
    if (!force && cachedMenu && now - cachedAt < CACHE_TTL) return cachedMenu

    const files = scanPluginFiles(__dirname)
    const categories = new Map()

    for (const fullPath of files) {
        try {
            const stat = fs.statSync(fullPath)
            const moduleUrl = `${pathToFileURL(fullPath).href}?menu=${stat.mtimeMs}`
            const plugin = (await import(moduleUrl))?.default

            if (!plugin || !['object', 'function'].includes(typeof plugin)) continue
            if (!plugin.command && !plugin.customPrefix) continue

            const category = getCategory(plugin)
            const commands = getPluginCommands(plugin, fullPath)
            if (!commands.length) continue

            if (!categories.has(category)) categories.set(category, new Map())
            const bucket = categories.get(category)

            for (const rawCommand of commands) {
                const command = getCanonicalCommand(rawCommand)
                const key = getCommandKey(command)
                if (key && !bucket.has(key)) {
                    bucket.set(key, {
                        command,
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
            image: getCategoryImage(name),
            commands: [...categories.get(name).values()]
                .sort((a, b) => a.command.localeCompare(b.command, 'ar'))
        })),
        totalCommands: orderedCategories.reduce((sum, name) => sum + categories.get(name).size, 0)
    }

    cachedMenu = result
    cachedAt = now
    return result
}

const unwrapMessage = (message, depth = 0) => {
    if (!message || depth > 5) return null
    if (message.interactiveResponseMessage || message.listResponseMessage) return message

    const wrappers = [
        'ephemeralMessage', 'viewOnceMessage',
        'viewOnceMessageV2', 'documentWithCaptionMessage'
    ]

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

const getSharp = async () => {
    if (sharpChecked) return sharpLib
    sharpChecked = true
    try {
        const mod = await import('sharp')
        sharpLib = mod?.default || mod
    } catch {
        sharpLib = null
    }
    return sharpLib
}

const loadRawImageBuffer = async (url) => {
    if (!url) return null
    if (rawImgCache.has(url)) return rawImgCache.get(url)
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
        if (!response.ok) return null
        const buf = Buffer.from(await response.arrayBuffer())
        if (!buf.length) return null
        rawImgCache.set(url, buf)
        return buf
    } catch {
        return null
    }
}

// يصغّر الصورة مع الحفاظ على الوجه كاملًا وقص خفيف جدًا من الأسفل
const frameSectionImage = async (rawBuf, cropBottom = 0.05, maxWidth = 600, maxHeight = 420) => {
    if (!rawBuf?.length) return null
    const sharp = await getSharp()
    if (!sharp) return rawBuf

    try {
        const meta = await sharp(rawBuf).metadata()
        const srcW = meta.width || 0
        const srcH = meta.height || 0
        let pipeline = sharp(rawBuf)

        if (srcW > 0 && srcH > 0 && cropBottom > 0) {
            const safeRatio = Math.min(Math.max(Number(cropBottom) || 0, 0), 0.12)
            const keepH = Math.max(1, Math.round(srcH * (1 - safeRatio)))
            pipeline = pipeline.extract({ left: 0, top: 0, width: srcW, height: keepH })
        }

        return await pipeline
            .resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer()
    } catch {
        return rawBuf
    }
}

const loadSectionBuffer = async (imgConfig) => {
    const cfg = typeof imgConfig === 'string'
        ? { url: imgConfig, cropBottom: 0.05 }
        : (imgConfig || { url: defaultImageUrl, cropBottom: 0.05 })

    const targetUrl = cfg.url || defaultImageUrl
    const cropRatio = cfg.cropBottom ?? 0.05
    const cacheKey = `${targetUrl}|${cropRatio}`

    if (processedImgCache.has(cacheKey)) return processedImgCache.get(cacheKey)

    const raw = await loadRawImageBuffer(targetUrl) || await loadRawImageBuffer(defaultImageUrl)
    if (!raw) return null

    const framed = await frameSectionImage(raw, cropRatio)
    const finalBuf = framed || raw
    processedImgCache.set(cacheKey, finalBuf)
    return finalBuf
}

const loadHeaderMediaFromBuffer = async (conn, buffer) => {
    try {
        if (!buffer?.length) return null
        const uploadFn = conn.waUploadToServer || conn.uploadFile
        const uploadOpts = typeof uploadFn === 'function' ? { upload: uploadFn.bind(conn) } : {}
        return await prepareWAMessageMedia({ image: buffer }, uploadOpts)
    } catch (error) {
        console.log('[اوامر] تعذر تجهيز الصورة:', error.message)
        return null
    }
}

const buildQuickReplyButtons = (prefix = '.') => [
    { display: '📂 الـقـائـمـة', id: `${prefix}اوامر` },
    { display: '👑 تـنـصـيـب', id: `${prefix}تنصيب` }
]

// إرسال رسالة القسم مع صورة مصغّرة تحفظ كامل الوجه + زرّين مضمونين تحته
const sendSectionCard = async (conn, m, body, prefix = '.', sectionImg = SECTION_IMAGES.system) => {
    const imgBuf = await loadSectionBuffer(sectionImg) || await loadSectionBuffer({ url: defaultImageUrl, cropBottom: 0.05 })
    const buttons = buildQuickReplyButtons(prefix)

    if (typeof ButtonV2 === 'function') {
        const attempts = [imgBuf, null]
        for (const thumb of attempts) {
            try {
                const card = new ButtonV2(conn).setBody(body).setFooter('© 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓')
                if (thumb && typeof card.setThumbnail === 'function') card.setThumbnail(thumb)
                if (typeof card.addButton === 'function') {
                    for (const btn of buttons) card.addButton(btn.display, btn.id)
                }
                return await card.send(m.chat)
            } catch {}
        }
    }

    try {
        const media = await loadHeaderMediaFromBuffer(conn, imgBuf)
        const interactive = {
            body: { text: body },
            footer: { text: '© 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓' },
            nativeFlowMessage: {
                buttons: buttons.map(btn => ({
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: btn.display, id: btn.id })
                })),
                messageParamsJson: ''
            }
        }
        if (media?.imageMessage) {
            interactive.header = {
                title: '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓',
                hasMediaAttachment: true,
                imageMessage: media.imageMessage
            }
        }

        const msg = generateWAMessageFromContent(
            m.chat,
            { viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactive) } } },
            { userJid: conn?.user?.jid || conn?.user?.id, quoted: m }
        )
        return await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    } catch {}

    return conn.sendMessage(m.chat, { text: body }, { quoted: m })
}

const showCategory = async (conn, m, categoryName, usedPrefix = '.') => {
    const menu = await getMenuData()
    const category = findCategory(menu, categoryName)

    if (!category) {
        try {
            await conn.sendMessage(m.chat, { react: { text: '🚫', key: m.key } })
        } catch {}

        const notFoundBody =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 🚫 ╎ القسم "${categoryName}" غير موجود
*┃* ⚡ ╎ اكتب ${usedPrefix}اوامر لعرض الأقسام
*◇❐ ═━━╾⚡╼━━═ ❐◇*`
        return await sendSectionCard(conn, m, notFoundBody, usedPrefix, { url: defaultImageUrl, cropBottom: 0.05 })
    }

    try {
        await conn.sendMessage(m.chat, {
            react: { text: getSectionReaction(category), key: m.key }
        })
    } catch {}

    const cmdLines = category.commands
        .map(item => `*┃* ${resolveCommandEmoji(item.command)} ╎ ${item.command}`)
        .join('\n')

    const body =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* ${category.icon} ╎ قسم: *${category.name}*
${cmdLines}
*◇❐ ═━━╾⚡╼━━═ ❐◇*`

    return await sendSectionCard(conn, m, body, usedPrefix, category.image)
}

const handler = async (m, { conn, usedPrefix }) => {
    if (m._menuHandled) return
    m._menuHandled = true

    try {
        const prefix = usedPrefix || '.'
        const selected = getSelectedId(m)
        const fullText = String(selected || m.text || m.body || '').trim()
        const sectionMatch = fullText.match(/^(?:[.!/#])?قسم(?:\s+|$)(.*)$/i)

        if (sectionMatch && sectionMatch[1]?.trim()) {
            return await showCategory(conn, m, sectionMatch[1].trim(), prefix)
        }

        try {
            await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } })
        } catch {}

        let user = 'صديقي'
        try {
            user = await conn.getName(m.sender) || 'صديقي'
        } catch {}

        const menu = await getMenuData()

        if (!menu.categories.length) {
            return conn.sendMessage(m.chat, {
                text: '❌ لم أتمكن من العثور على أقسام. تأكد من وجود command و tags في ملفات الإضافات.'
            }, { quoted: m })
        }

        const headerBuf = await loadSectionBuffer({ url: defaultImageUrl, cropBottom: 0.05 })
        const media = await loadHeaderMediaFromBuffer(conn, headerBuf)

        const bodyText =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 👑 ╎ أهلاً بك يا ${user}
*┃* 📂 ╎ الأقسام: *${menu.categories.length}*
*┃* ⚔️ ╎ الأوامر: *${menu.totalCommands}*
*┃* ⚡ ╎ اختر القسم لعرض أوامره
*◇❐ ═━━╾⚡╼━━═ ❐◇*`

        const rows = menu.categories.map(category => ({
            header: category.icon,
            title: `⟨ ${category.name} ⟩`.slice(0, 24),
            description: `${category.description} | ${category.commands.length} أمر`.slice(0, 72),
            id: `${prefix}قسم ${category.name}`
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
                            id: `${prefix}تنصيب`
                        })
                    }
                ],
                messageParamsJson: ''
            }
        }

        const outgoing = generateWAMessageFromContent(
            m.chat,
            { viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage) } } },
            { userJid: conn?.user?.jid || conn?.user?.id, quoted: m }
        )

        return await conn.relayMessage(m.chat, outgoing.message, { messageId: outgoing.key.id })
    } catch (error) {
        console.error('❌ ARTHUR BOT MENU ERROR:', error)
        return m.reply('❌ حصل خطأ أثناء فتح قائمة ARTHUR BOT.')
    }
}

handler.before = async (m) => {
    const selected = getSelectedId(m)
    if (!selected) return

    if (/^(?:\.|!|\/|#)?قسم\s+/i.test(selected)) {
        m.text = selected
        m.body = selected
    }
}

handler.help = ['اوامر', 'قسم']
handler.tags = ['main']
handler.command = /^(اوامر|قسم)$/i

export default handler