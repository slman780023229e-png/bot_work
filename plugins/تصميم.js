// plugins/تصميم.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - AI Image Design & 4K ✧

import 'dotenv/config'
import OpenAI, { toFile } from 'openai'
import axios from 'axios'
import FormData from 'form-data'
import sharp from 'sharp'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const REMAKER_CREATE =
    'https://developer.remaker.ai/api/remaker/v1/ai-enhance/create-job'

const REMAKER_STATUS =
    'https://developer.remaker.ai/api/remaker/v1/ai-enhance'

/* تحميل الصورة */
async function downloadImage(m) {
    const q = m.quoted || m

    try {
        // الطريقة الأساسية في Baileys
        if (typeof q.download === 'function') {
            const data = await q.download()
            if (Buffer.isBuffer(data) && data.length) {
                return data
            }
        }
    } catch (e) {
        console.log('[ARTHUR BOT] download 1:', e.message)
    }

    try {
        if (typeof m.download === 'function') {
            const data = await m.download()
            if (Buffer.isBuffer(data) && data.length) {
                return data
            }
        }
    } catch (e) {
        console.log('[ARTHUR BOT] download 2:', e.message)
    }

    return null
}

/* تحسين الصورة بواسطة OpenAI */
async function improveImage(buffer, mime) {

    let ext = 'jpg'

    if (mime.includes('png')) ext = 'png'
    else if (mime.includes('webp')) ext = 'webp'
    else if (mime.includes('jpeg')) ext = 'jpg'

    const file = await toFile(
        buffer,
        `input.${ext}`,
        {
            type: mime || 'image/jpeg'
        }
    )

    const prompt = `
حسّن الصورة المرفقة إلى تصميم احترافي عالي الجودة.

حافظ على العنصر الأساسي وهوية الصورة كما هي.

المطلوب:
- تحسين الحدة والتفاصيل.
- تحسين الإضاءة والتباين.
- تحسين الألوان بشكل احترافي.
- إزالة التشويش والعيوب.
- تحسين جودة الخلفية بدون تغييرها بشكل مبالغ.
- الحفاظ على الأشخاص وملامحهم.
- الحفاظ على الشعارات والكتابة الموجودة.
- عدم إضافة عناصر عشوائية.
- عدم تغيير المنتج أو الشخصية الأساسية.

اجعل النتيجة واقعية ونظيفة واحترافية جداً،
وكأنها صورة إعلانية عالية الجودة.
`

    const result = await openai.images.edit({
        model: 'gpt-image-1.5',
        image: file,
        prompt,
        quality: 'high',
        size: 'auto'
    })

    const base64 = result?.data?.[0]?.b64_json

    if (!base64) {
        throw new Error('OpenAI لم يرجع صورة')
    }

    return Buffer.from(base64, 'base64')
}

/* Remaker */
async function remakerUpscale(buffer) {

    const form = new FormData()

    form.append(
        'image_file',
        buffer,
        {
            filename: 'design.png',
            contentType: 'image/png'
        }
    )

    const response = await axios.post(
        REMAKER_CREATE,
        form,
        {
            headers: {
                ...form.getHeaders(),
                Authorization: process.env.REMAKER_API_KEY,
                Accept: 'application/json'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 120000
        }
    )

    const jobId =
        response?.data?.result?.job_id

    if (!jobId) {
        throw new Error(
            'Remaker لم يرجع Job ID'
        )
    }

    for (let i = 0; i < 40; i++) {

        await new Promise(
            resolve => setTimeout(resolve, 3000)
        )

        const status = await axios.get(
            `${REMAKER_STATUS}/${jobId}`,
            {
                headers: {
                    Authorization:
                        process.env.REMAKER_API_KEY,
                    Accept: 'application/json'
                },
                timeout: 60000
            }
        )

        const result =
            status?.data?.result

        if (
            result &&
            Array.isArray(result.output_image_url) &&
            result.output_image_url.length
        ) {

            const imageUrl =
                result.output_image_url[0]

            const image =
                await axios.get(
                    imageUrl,
                    {
                        responseType:
                            'arraybuffer',
                        timeout: 120000
                    }
                )

            return Buffer.from(image.data)
        }
    }

    throw new Error(
        'Remaker لم ينتهِ خلال الوقت المحدد'
    )
}

/* تجهيز 4K */
async function create4K(buffer) {

    const metadata =
        await sharp(buffer).metadata()

    const width =
        metadata.width || 1920

    const height =
        metadata.height || 1080

    const ratio =
        width / height

    let targetWidth
    let targetHeight

    if (ratio >= 1.70 && ratio <= 1.85) {

        targetWidth = 3840
        targetHeight = 2160

    } else if (ratio >= 0.54 && ratio <= 0.58) {

        targetWidth = 2160
        targetHeight = 3840

    } else if (ratio >= 0.95 && ratio <= 1.05) {

        targetWidth = 3840
        targetHeight = 3840

    } else if (width >= height) {

        targetWidth = 3840

        targetHeight =
            Math.round(
                height * (3840 / width)
            )

    } else {

        targetHeight = 3840

        targetWidth =
            Math.round(
                width * (3840 / height)
            )
    }

    return await sharp(buffer)
        .resize(
            targetWidth,
            targetHeight,
            {
                fit: 'fill',
                kernel: sharp.kernel.lanczos3
            }
        )
        .png({
            compressionLevel: 0
        })
        .toBuffer()
}

/* الأمر */
let handler = async (m, { conn }) => {

    try {

        const q = m.quoted || m

        const mime =
            q.mimetype ||
            q.msg?.mimetype ||
            q.message?.imageMessage?.mimetype ||
            ''

        // لا توجد صورة
        if (!mime.startsWith('image/')) {

            await m.react('❌').catch(() => {})

            return conn.reply(
                m.chat,

`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🎨 *تصميم بالذكاء الاصطناعي*
*┃*
*┃* 📸 أرسل صورة
*┃* ↩️ اعمل Reply على الصورة
*┃* ✨ واكتب: *.تصميم*
*┃*
*┃* 🎨 تحسين احترافي
*┃* 🚀 رفع الجودة
*┃* 💎 تجهيز 4K
*╰━━━━━━━━━━━━━━╯*

*✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 | AI DESIGN ✦*`,
                m
            )
        }

        // فحص المفاتيح
        if (!process.env.OPENAI_API_KEY) {

            return conn.reply(
                m.chat,
                '❌ لم يتم العثور على OPENAI_API_KEY في إعدادات المنصة.',
                m
            )
        }

        if (!process.env.REMAKER_API_KEY) {

            return conn.reply(
                m.chat,
                '❌ لم يتم العثور على REMAKER_API_KEY في إعدادات المنصة.',
                m
            )
        }

        await m.react('⏳').catch(() => {})

        const status =
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🎨 جاري معالجة الصورة...
*┃*
*┃* 🤖 الذكاء الاصطناعي
*┃* ✨ تحسين التفاصيل
*┃* 🚀 رفع الجودة
*┃* 💎 تجهيز 4K
*┃*
*┃* ⏳ انتظر قليلاً...
*╰━━━━━━━━━━━━━━╯*`

        await conn.reply(
            m.chat,
            status,
            m
        )

        /* تحميل الصورة */
        const original =
            await downloadImage(m)

        if (!original) {

            await m.react('❌').catch(() => {})

            return conn.reply(
                m.chat,
                `*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* ❌ لم أستطع تحميل الصورة.
*┃*
*┃* ↩️ تأكد أنك تعمل Reply
*┃* على صورة عادية.
*╰━━━━━━━━━━━━━━╯*`,
                m
            )
        }

        console.log(
            '[ARTHUR BOT DESIGN] Original:',
            original.length
        )

        /* OpenAI */
        const aiImage =
            await improveImage(
                original,
                mime
            )

        console.log(
            '[ARTHUR BOT DESIGN] OpenAI:',
            aiImage.length
        )

        /* Remaker */
        const enhanced =
            await remakerUpscale(
                aiImage
            )

        console.log(
            '[ARTHUR BOT DESIGN] Remaker:',
            enhanced.length
        )

        /* 4K */
        const finalImage =
            await create4K(
                enhanced
            )

        console.log(
            '[ARTHUR BOT DESIGN] Final:',
            finalImage.length
        )

        /* إرسال */
        await conn.sendMessage(
            m.chat,
            {
                document: finalImage,
                mimetype: 'image/png',
                fileName:
                    `ARTHUR BOT-DESIGN-4K-${Date.now()}.png`,
                caption:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* ✅ تم الانتهاء
*┃*
*┃* 🎨 التصميم: مكتمل
*┃* ✨ التحسين: مكتمل
*┃* 🚀 الجودة: محسنة
*┃* 💎 4K: مكتمل
*╰━━━━━━━━━━━━━━╯*

*✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 | AI DESIGN ✦*`
            },
            {
                quoted: m
            }
        )

        await m.react('✅').catch(() => {})

    } catch (e) {

        console.error(
            '[ARTHUR BOT DESIGN ERROR]',
            e
        )

        await m.react('❌').catch(() => {})

        await conn.reply(
            m.chat,
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* ❌ حدث خطأ أثناء معالجة الصورة.
*┃*
*┃* ✦ ${String(e?.message || e).substring(0, 500)}
*╰━━━━━━━━━━━━━━╯*`,
            m
        )
    }
}

handler.help = ['تصميم']
handler.tags = ['ai']
handler.command = /^(تصميم)$/i

export default handler