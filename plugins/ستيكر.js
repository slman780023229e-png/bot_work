// plugins/sticker.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight - Sticker Maker 🎨

import { exec } from 'child_process'
import { promisify } from 'util'
import {
    writeFileSync,
    unlinkSync,
    existsSync,
    readFileSync
} from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import sharp from 'sharp'
import WebP from 'node-webpmux'
import crypto from 'crypto'

const execAsync = promisify(exec)


// ═══════════════════════════════════════
// ⚡ FPS الفيديو
// ═══════════════════════════════════════

async function getVideoFPS(inputPath) {
    try {
        const { stdout } = await execAsync(
            `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
            { timeout: 10000 }
        )

        let fps = stdout.trim()

        if (fps.includes('/')) {
            const [num, den] = fps.split('/').map(Number)

            if (den > 0) {
                fps = num / den
            }
        }

        return Math.min(
            Math.max(Math.round(Number(fps) || 15), 8),
            20
        )

    } catch {
        return 15
    }
}


// ═══════════════════════════════════════
// ⚡ مدة الفيديو
// ═══════════════════════════════════════

async function getVideoDuration(inputPath) {
    try {
        const { stdout } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
            { timeout: 10000 }
        )

        return parseFloat(stdout.trim()) || 5

    } catch {
        return 5
    }
}


// ═══════════════════════════════════════
// ⚡ إضافة حقوق الملصق
// ═══════════════════════════════════════

async function addStickerMetadata(
    webpBuffer,
    packName = '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight',
    authorName = '🪄 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓'
) {
    try {

        const img = new WebP.Image()

        await img.load(webpBuffer)

        const json = {
            'sticker-pack-id':
                crypto.randomBytes(16).toString('hex'),

            'sticker-pack-name':
                packName,

            'sticker-pack-publisher':
                authorName,

            'emojis': [
                '🪄',
                '✨'
            ]
        }

        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00,
            0x08, 0x00, 0x00, 0x00,
            0x01, 0x00,
            0x41, 0x57,
            0x07, 0x00,
            0x00, 0x00,
            0x00, 0x00,
            0x16, 0x00,
            0x00, 0x00
        ])

        const jsonBuffer =
            Buffer.from(
                JSON.stringify(json),
                'utf8'
            )

        const exif = Buffer.concat([
            exifAttr,
            jsonBuffer
        ])

        exif.writeUIntLE(
            jsonBuffer.length,
            14,
            4
        )

        img.exif = exif

        return await img.save(null)

    } catch (e) {

        console.log(
            '[Sticker Metadata]',
            e.message
        )

        return webpBuffer
    }
}


// ═══════════════════════════════════════
// 🎨 الأمر الرئيسي
// ═══════════════════════════════════════

const handler = async (m, { conn }) => {

    const react = async (emoji) => {
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


    // ═══════════════════════════════════
    // 📌 الحصول على الصورة / الفيديو
    // ═══════════════════════════════════

    const q = m.quoted || m

    const mime =
        (q.msg || q).mimetype || ''


    if (
        !mime ||
        (
            !mime.includes('image') &&
            !mime.includes('video')
        )
    ) {

        await react('❌')

        return m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 🎨 〕━━━╮
┃
┃ ❌ *مفيش صورة أو فيديو*
┃
┃ ↩️ رد على صورة أو فيديو
┃ واكتب:
┃
┃ .ستيكر
┃
╰━━━━━━━━━━━━━━╯`
        )
    }


    await react('⏳')


    try {

        // ═══════════════════════════════
        // 📥 تحميل الميديا
        // ═══════════════════════════════

        const media = await q.download()

        if (!media || !media.length) {
            throw new Error('تعذر تحميل الميديا')
        }


        // ═══════════════════════════════
        // 🖼️ صورة
        // ═══════════════════════════════

        if (mime.includes('image')) {

            let stickerBuffer =
                await sharp(media)
                    .resize(
                        512,
                        512,
                        {
                            fit: 'contain',
                            withoutEnlargement: false,
                            background: {
                                r: 0,
                                g: 0,
                                b: 0,
                                alpha: 0
                            }
                        }
                    )
                    .webp({
                        quality: 90
                    })
                    .toBuffer()


            stickerBuffer =
                await addStickerMetadata(
                    stickerBuffer,
                    '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight',
                    '🪄 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓'
                )


            await conn.sendMessage(
                m.chat,
                {
                    sticker: stickerBuffer
                },
                {
                    quoted: m
                }
            )


            await react('✅')

            return
        }


        // ═══════════════════════════════
        // 🎬 فيديو
        // ═══════════════════════════════

        if (mime.includes('video')) {

            const id = Date.now()

            const inputPath =
                join(
                    tmpdir(),
                    `e7_sticker_in_${id}.mp4`
                )

            const outputPath =
                join(
                    tmpdir(),
                    `e7_sticker_out_${id}.webp`
                )

            writeFileSync(
                inputPath,
                media
            )


            // FPS
            const fps =
                await getVideoFPS(
                    inputPath
                )


            // مدة الفيديو
            const duration =
                await getVideoDuration(
                    inputPath
                )


            // واتساب للملصقات المتحركة
            // نخليها بحد أقصى 6 ثواني
            const maxDuration =
                Math.min(
                    Math.max(duration, 0.5),
                    6
                )


            // ═══════════════════════════════
            // 🎞️ تحويل الفيديو إلى WebP
            // ═══════════════════════════════

            const command = `
ffmpeg -y \
-i "${inputPath}" \
-t ${maxDuration} \
-vf "fps=${fps},scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0" \
-an \
-c:v libwebp \
-q:v 55 \
-compression_level 6 \
-loop 0 \
-preset default \
"${outputPath}"
`

            await execAsync(
                command,
                {
                    timeout: 120000
                }
            )


            if (!existsSync(outputPath)) {
                throw new Error(
                    'فشل تحويل الفيديو إلى WebP'
                )
            }


            let stickerBuffer =
                readFileSync(
                    outputPath
                )


            // ═══════════════════════════════
            // 📦 لو الحجم أكبر من 1MB
            // نقلل الجودة والفريمات
            // ═══════════════════════════════

            if (
                stickerBuffer.length >
                1024 * 1024
            ) {

                const smallPath =
                    join(
                        tmpdir(),
                        `e7_sticker_small_${id}.webp`
                    )


                const smallCommand = `
ffmpeg -y \
-i "${inputPath}" \
-t ${Math.min(maxDuration, 5)} \
-vf "fps=10,scale=384:384:force_original_aspect_ratio=decrease,pad=384:384:(ow-iw)/2:(oh-ih)/2:color=black@0" \
-an \
-c:v libwebp \
-q:v 70 \
-compression_level 6 \
-loop 0 \
-preset default \
"${smallPath}"
`


                await execAsync(
                    smallCommand,
                    {
                        timeout: 120000
                    }
                )


                if (
                    existsSync(
                        smallPath
                    )
                ) {

                    const smaller =
                        readFileSync(
                            smallPath
                        )

                    if (
                        smaller.length <
                        stickerBuffer.length
                    ) {
                        stickerBuffer =
                            smaller
                    }

                    try {
                        unlinkSync(
                            smallPath
                        )
                    } catch {}
                }
            }


            // ═══════════════════════════════
            // 🪄 حقوق 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓
            // ═══════════════════════════════

            stickerBuffer =
                await addStickerMetadata(
                    stickerBuffer,
                    '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Evernight',
                    '🪄 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓'
                )


            // ═══════════════════════════════
            // 📤 إرسال الملصق
            // ═══════════════════════════════

            await conn.sendMessage(
                m.chat,
                {
                    sticker:
                        stickerBuffer
                },
                {
                    quoted: m
                }
            )


            await react('✅')


            // ═══════════════════════════════
            // 🧹 تنظيف الملفات
            // ═══════════════════════════════

            try {
                unlinkSync(inputPath)
            } catch {}

            try {
                unlinkSync(outputPath)
            } catch {}

            return
        }

    } catch (e) {

        console.error(
            '[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓-Sticker]',
            e
        )

        await react('❌')

        await m.reply(
`╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ❌ 〕━━━╮
┃
┃ ❌ *فشل عمل الملصق*
┃
┃ ⚠️ ${e.message || 'خطأ غير معروف'}
┃
┃ 💡 لو فيديو:
┃ • خليه قصير
┃ • جرب فيديو بجودة أقل
┃
╰━━━━━━━━━━━━━━╯`
        )
    }
}


// ═══════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════

handler.command =
    /^(ستيكر|sticker|ملصق)$/i

handler.help = [
    'ستيكر'
]

handler.tags = [
    'sticker'
]

export default handler