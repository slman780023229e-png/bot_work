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
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()

const COMMAND_ALIASES = {
    'بينتر': 'بنترست',
    'بنتر': 'بنترست',
    'بينترست': 'بنترست',
    'بينتريست': 'بنترست',
    'بنتريست': 'بنترست',
    'بنتيرست': 'بنترست',
    'بينتيرست': 'بنترست',
    'بنتير': 'بنترست',
    'بينتير': 'بنترست',
    'pinterest': 'بنترست',
    'pintrest': 'بنترست',
    'pin': 'بنترست',
    'pint': 'بنترست',
    'pins': 'بنترست',
    'تيكتوك': 'تيك توك',
    'تيك': 'تيك توك',
    'tiktok': 'تيك توك',
    'انستا': 'انستقرام',
    'انستغرام': 'انستقرام',
    'instagram': 'انستقرام',
    'فيس': 'فيسبوك',
    'facebook': 'فيسبوك',
    'يوتيوب': 'يوتيوب',
    'youtube': 'يوتيوب',
    'واتس': 'واتساب',
    'whatsapp': 'واتساب',
    'جوجل': 'جوجل',
    'google': 'جوجل'
}

const getCanonicalCommand = (value = '') => {
    const n = normalize(value)
    if (!n) return ''
    if (COMMAND_ALIASES[n]) return COMMAND_ALIASES[n]

    const compact = n.replace(/\s+/g, '')
    if (
        compact.startsWith('بنتر') ||
        compact.startsWith('بينتر') ||
        compact.startsWith('بنتير') ||
        compact.startsWith('بينتير') ||
        compact.includes('pinter') ||
        compact === 'pint' ||
        compact === 'pin'
    ) {
        return 'بنترست'
    }

    return String(value).trim()
}

const getCommandKey = (value = '') => normalize(getCanonicalCommand(value)).replace(/\s+/g, '')

const getCommandEmoji = (cmd = '') => {
    const k = normalize(cmd)
    if (k.includes('منشن')) return '🎀'
    if (k.includes('بوست')) return '🪄'
    if (k.includes('لينك') || k.includes('رابط')) return '🔗'
    if (k.includes('طرد') || k.includes('حظر') || k.includes('بان')) return '🚫'
    if (k.includes('اعفاء') || k.includes('ترقيه') || k.includes('مشرف')) return '👤'
    if (
        k.includes('بنتر') ||
        k.includes('تيك') ||
        k.includes('انستا') ||
        k.includes('فيس') ||
        k.includes('يوتيوب') ||
        k.includes('تحميل')
    ) return '📥'
    if (
        k.includes('لعبه') ||
        k.includes('تحدي') ||
        k.includes('مسابقه') ||
        k.includes('اكس') ||
        k.includes('سؤال')
    ) return '🎮'
    if (k.includes('ملصق') || k.includes('ستيكر')) return '🖼️'
    if (k.includes('ذكاء') || k.includes('ai') || k.includes('شات')) return '🤖'
    if (k.includes('اغاني') || k.includes('موسيقى') || k.includes('صوت')) return '🎵'
    if (k.includes('قران') || k.includes('اذكار') || k.includes('حديث') || k.includes('صلاه')) return '🕌'
    if (k.includes('مطور') || k.includes('ريستارت') || k.includes('تحديث')) return '👑'
    return '⚡'
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

    if (Array.isArray(plugin?.help)) {
        candidates.push(...plugin.help)
    }

    const raw = plugin?.command
    if (Array.isArray(raw)) {
        candidates.push(...raw)
    } else if (typeof raw === 'string') {
        candidates.push(raw)
    } else if (raw instanceof RegExp) {
        candidates.push(...commandsFromPattern(raw))
    }

    if (plugin?.customPrefix instanceof RegExp) {
        candidates.push(...commandsFromPattern(plugin.customPrefix))
    }

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
        const key = getCommandKey(cmd)
        if (!unique.some(prev => getCommandKey(prev) === key)) unique.push(cmd)
    }

    if (unique.length === 1) return unique

    const canonicalValues = new Set(Object.values(COMMAND_ALIASES))
    const preferred = unique.find(c => canonicalValues.has(c))
    if (preferred) return [preferred]

    const longest = [...unique].sort((a, b) => b.length - a.length)[0]
    return [longest]
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
                const key = getCommandKey(command)
                if (!key) continue

                if (!bucket.has(key)) {
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

    const wrappers = [
        'ephemeralMessage',
        'viewOnceMessage',
        'viewOnceMessageV2',
        'documentWithCaptionMessage'
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

    const paramsJson =
        message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson

    if (paramsJson) {
        try {
            const params = JSON.parse(paramsJson)
            const selected = params.id ||
                params.row_id ||
                params.selectedRowId ||
                params.selected_row_id
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

const sendSectionCard = async (conn, m, body) => {
    if (typeof ButtonV2 === 'function') {
        try {
            const card = new ButtonV2(conn)
                .setBody(body)
                .setFooter('© 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓')
            if (typeof card.setThumbnail === 'function') card.setThumbnail(imageUrl)
            if (typeof card.addButton === 'function') {
                card.addButton('📂 الـقـائـمـة', '.اوامر')
                card.addButton('👑 تـنـصـيـب', '.تنصيب')
            }
            return await card.send(m.chat)
        } catch (error) {
            console.log('[اوامر] تعذر إرسال أزرار القسم، سيتم الإرسال نصياً:', error.message)
        }
    }
    return conn.sendMessage(m.chat, { text: body }, { quoted: m })
}

const showCategory = async (conn, m, categoryName, usedPrefix = '.') => {
    const menu = await getMenuData()
    const category = findCategory(menu, categoryName)

    if (!category) {
        const notFoundBody =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 🚫 ╎ القسم "${categoryName}" غير موجود
*┃* ⚡ ╎ اكتب ${usedPrefix}اوامر لعرض الأقسام
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`
        return await sendSectionCard(conn, m, notFoundBody)
    }

    const cmdLines = category.commands
        .map(item => `*┃* ${getCommandEmoji(item.command)} ╎ ${item.command}`)
        .join('\n')

    const body =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
${cmdLines}
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`

    return await sendSectionCard(conn, m, body)
}

const loadHeaderMedia = async (conn, url) => {
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        if (!response.ok) {
            console.log('[اوامر] فشل تحميل الصورة - الحالة:', response.status)
            return null
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        if (!buffer.length) return null

        const uploadFn = conn.waUploadToServer || conn.uploadFile
        if (typeof uploadFn === 'function') {
            return await prepareWAMessageMedia(
                { image: buffer },
                { upload: uploadFn.bind(conn) }
            )
        }

        return await prepareWAMessageMedia({ image: buffer }, {})
    } catch (error) {
        console.log('[اوامر] تعذر تجهيز صورة القائمة:', error.message)
        return null
    }
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
            await conn.sendMessage(m.chat, {
                react: { text: '⚡', key: m.key }
            })
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

        const media = await loadHeaderMedia(conn, imageUrl)

        const bodyText =
`*◇❐ ═━━╾⚡ ╼━━═ ❐◇*
*┃* 👑 ╎ أهلاً بك يا ${user}
*┃* 📂 ╎ الأقسام: *${menu.categories.length}*
*┃* ⚔️ ╎ الأوامر: *${menu.totalCommands}*
*┃* ⚡ ╎ اختر القسم لعرض أوامره
*◇❐ ═━━╾⚡╼╼━━═ ❐◇*`

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
                        buttonParamsJson: JSON.stringify({
                            title: '📂 قائمة الأقسام',
                            sections
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
                            id: `${prefix}تنصيب`
                        })
                    }
                ],
                messageParamsJson: ''
            }
        }

        const outgoing = generateWAMessageFromContent(
            m.chat,
            {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject(interactiveMessage)
                    }
                }
            },
            {
                userJid: conn?.user?.jid || conn?.user?.id,
                quoted: m
            }
        )

        return await conn.relayMessage(m.chat, outgoing.message, {
            messageId: outgoing.key.id
        })
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