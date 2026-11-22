// plugins/facebook.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Facebook Downloader 📘

import axios from 'axios'

function parseString(string) {
    try {
        return JSON.parse(`{"text": "${string}"}`).text
    } catch {
        return string
    }
}

function match(data, ...patterns) {
    for (const pattern of patterns) {
        const result = data.match(pattern)
        if (result) return result
    }
    return null
}

async function fesnuk(postUrl, cookie = '', userAgent = '') {

    if (!postUrl || !postUrl.trim()) {
        throw new Error('يرجى إرسال رابط فيسبوك.')
    }

    if (!/(facebook\.com|fb\.watch)/i.test(postUrl)) {
        throw new Error('الرابط ليس رابط فيسبوك صحيح.')
    }

    const headers = {
        'sec-fetch-user': '?1',
        'sec-ch-ua-mobile': '?0',
        'sec-fetch-site': 'none',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'cache-control': 'max-age=0',
        'authority': 'www.facebook.com',
        'upgrade-insecure-requests': '1',
        'accept-language': 'en-GB,en;q=0.9',
        'sec-ch-ua': '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
        'user-agent':
            userAgent ||
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89.0.4389.114 Safari/537.36',
        'accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'cookie': cookie || ''
    }

    try {

        const response = await axios.get(postUrl, {
            headers,
            timeout: 60000,
            maxRedirects: 10,
            validateStatus: status => status >= 200 && status < 400
        })

        let data = response.data

        if (!data || typeof data !== 'string') {
            throw new Error('فيسبوك لم يرجع بيانات.')
        }

        // استخراج SD
        const sdMatch = match(
            data,
            /"browser_native_sd_url":"(.*?)"/,
            /"browser_native_sd_url"\s*:\s*"(.*?)"/,
            /sd_src\s*:\s*"([^"]*)"/
        )

        // استخراج HD
        const hdMatch = match(
            data,
            /"browser_native_hd_url":"(.*?)"/,
            /"browser_native_hd_url"\s*:\s*"(.*?)"/,
            /hd_src\s*:\s*"([^"]*)"/
        )

        // استخراج العنوان
        const titleMatch = match(
            data,
            /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i,
            /<meta\s+content=["'](.*?)["']\s+name=["']description["']/i
        )

        let sdUrl = sdMatch?.[1] || ''
        let hdUrl = hdMatch?.[1] || ''

        let title = titleMatch?.[1] || 'Facebook Video'

        // فك ترميز الروابط
        try {
            sdUrl = parseString(sdUrl)
            hdUrl = parseString(hdUrl)
        } catch {}

        title = parseString(title)

        if (!sdUrl && !hdUrl) {
            throw new Error(
                'لم يتم العثور على رابط الفيديو. قد يكون المنشور خاصًا أو غير متاح.'
            )
        }

        return {
            url: postUrl,
            title,
            quality: {
                sd: sdUrl,
                hd: hdUrl
            }
        }

    } catch (error) {

        console.error(
            '[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 Facebook]',
            error?.message || error
        )

        if (error?.message?.includes('لم يتم العثور')) {
            throw error
        }

        throw new Error(
            'تعذر جلب فيديو فيسبوك. تأكد أن المنشور عام.'
        )
    }
}

async function sendFacebookVideo(m, conn, url, title) {

    // نحاول HD أولاً
    try {

        if (url) {

            const test = await axios.head(url, {
                timeout: 30000,
                maxRedirects: 5,
                validateStatus: () => true
            })

            if (test.status >= 200 && test.status < 400) {

                await conn.sendMessage(
                    m.chat,
                    {
                        video: { url },
                        mimetype: 'video/mp4',
                        caption:
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 📘 〕━━━╮
┃
┃ ✅ تم تحميل فيديو فيسبوك
┃
┃ 🎬 ${title.substring(0, 70)}
┃
┃ 📥 الجودة: HD
┃
╰━━━━━━━━━━━━━━━━╯`
                    },
                    { quoted: m }
                )

                return true
            }
        }

    } catch (e) {
        console.log(
            '[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓] HD failed:',
            e.message
        )
    }

    return false
}

let handler = async (
    m,
    {
        args,
        conn,
        usedPrefix,
        command
    }
) => {

    const react = async emoji => {
        try {
            await conn.sendMessage(
                m.chat,
                {
                    react: {
                        text: emoji,
                        key: m.key
                    }
                }
            )
        } catch {}
    }

    const url = args?.[0]

    // بدون رابط
    if (!url) {

        await react('❌')

        return conn.reply(
            m.chat,
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 📘 〕━━━╮
┃
┃ 📥 تحميل فيسبوك
┃
┃ استخدم الأمر:
┃
┃ ${usedPrefix}${command} رابط_الفيديو
┃
┃ مثال:
┃ ${usedPrefix}${command} https://facebook.com/...
┃
╰━━━━━━━━━━━━━━━━╯`,
            m
        )
    }

    // فحص الرابط
    if (!/(facebook\.com|fb\.watch)/i.test(url)) {

        await react('❌')

        return conn.reply(
            m.chat,
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ❌ 〕━━━╮
┃
┃ الرابط غير صحيح.
┃
┃ أرسل رابط فيديو من Facebook.
┃
╰━━━━━━━━━━━━━━━━╯`,
            m
        )
    }

    await react('📥')

    let statusMsg = null

    try {

        statusMsg = await conn.reply(
            m.chat,
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 📘 〕━━━╮
┃
┃ ⏳ جاري جلب فيديو Facebook...
┃
┃ 📡 جاري استخراج رابط التحميل
┃
╰━━━━━━━━━━━━━━━━╯`,
            m
        )

        // جلب الروابط
        const result = await fesnuk(url)

        const title =
            result.title ||
            'Facebook Video'

        const hd = result.quality?.hd
        const sd = result.quality?.sd

        let sent = false

        // =========================
        // HD
        // =========================

        if (hd) {

            sent = await sendFacebookVideo(
                m,
                conn,
                hd,
                title
            )
        }

        // =========================
        // SD
        // =========================

        if (!sent && sd) {

            try {

                await conn.sendMessage(
                    m.chat,
                    {
                        video: {
                            url: sd
                        },
                        mimetype: 'video/mp4',
                        caption:
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 📘 〕━━━╮
┃
┃ ✅ تم تحميل فيديو فيسبوك
┃
┃ 🎬 ${title.substring(0, 70)}
┃
┃ 📥 الجودة: SD
┃
╰━━━━━━━━━━━━━━━━╯`
                    },
                    { quoted: m }
                )

                sent = true

            } catch (e) {

                console.log(
                    '[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓] SD failed:',
                    e.message
                )
            }
        }

        // حذف رسالة الانتظار
        if (statusMsg?.key) {

            try {
                await conn.sendMessage(
                    m.chat,
                    {
                        delete: statusMsg.key
                    }
                )
            } catch {}
        }

        if (!sent) {

            await react('❌')

            return conn.reply(
                m.chat,
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ❌ 〕━━━╮
┃
┃ تعذر إرسال الفيديو.
┃
┃ ✦ جرب رابط Facebook آخر.
┃ ✦ تأكد أن الفيديو عام.
┃
╰━━━━━━━━━━━━━━━━╯`,
                m
            )
        }

        await react('✅')

    } catch (error) {

        console.error(
            '[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 Facebook ERROR]',
            error
        )

        if (statusMsg?.key) {

            try {
                await conn.sendMessage(
                    m.chat,
                    {
                        delete: statusMsg.key
                    }
                )
            } catch {}
        }

        await react('❌')

        return conn.reply(
            m.chat,
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ❌ 〕━━━╮
┃
┃ فشل تحميل Facebook
┃
┃ ✦ تأكد أن الرابط صحيح.
┃ ✦ تأكد أن الفيديو عام.
┃ ✦ جرب رابط Reels أو فيديو آخر.
┃
┃ ⚠️ ${error?.message || 'حدث خطأ غير معروف'}
┃
╰━━━━━━━━━━━━━━━━╯`,
            m
        )
    }
}

handler.help = [
    'فيس <رابط>',
    'فيسبوك <رابط>'
]

handler.tags = [
    'downloader'
]

handler.command =
    /^(فيس|فيسبوك|fb|face|facebook)$/i

export default handler