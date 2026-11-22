// plugins/instagram.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - Instagram Downloader 📸 ✧

import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { tmpdir } from 'os'
import {
    existsSync,
    unlinkSync,
    statSync,
    chmodSync
} from 'fs'
import os from 'os'

const execAsync = promisify(exec)

let ytDlpPath = null
let isInstalling = false
let installPromise = null


// ═══════════════════════════════
// 🖥️ النظام والمعالج
// ═══════════════════════════════

function getPlatform() {

    const arch = os.arch()
    const platform = os.platform()

    const archMap = {
        x64: 'amd64',
        x86_64: 'amd64',
        amd64: 'amd64',
        arm64: 'arm64',
        aarch64: 'arm64',
        armv7l: 'armv7l',
        armv6l: 'armv6l',
        i386: 'i386',
        i686: 'i386',
        x86: 'i386'
    }

    return {
        arch: archMap[arch] || 'amd64',

        platform:
            platform === 'win32'
                ? 'windows'
                : platform === 'darwin'
                    ? 'macos'
                    : 'linux'
    }
}


// ═══════════════════════════════
// 📦 تثبيت yt-dlp
// ═══════════════════════════════

async function autoInstallYTDLP(conn, chat) {

    if (isInstalling && installPromise)
        return installPromise

    const { arch, platform } = getPlatform()

    const outputPath =
        join(process.cwd(), 'yt-dlp')

    if (existsSync(outputPath)) {

        try {

            await execAsync(
                `"${outputPath}" --version`,
                { timeout: 5000 }
            )

            return outputPath

        } catch {}
    }

    isInstalling = true

    installPromise = (async () => {

        try {

            await conn.sendMessage(
                chat,
                {
                    text:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 📦 تجهيز مكتبة التحميل
*┃*
*┃* ⏳ انتظر لحظات...
*╰━━━━━━━━━━━━━━╯*`
                }
            )


            const urls = {

                linux: {

                    amd64:
                        'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',

                    arm64:
                        'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64',

                    armv7l:
                        'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_armv7l'
                },

                macos: {

                    default:
                        'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
                },

                windows: {

                    default:
                        'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
                }
            }


            const url =
                urls[platform]?.[arch] ||
                urls[platform]?.default ||
                `https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp${
                    platform === 'windows'
                        ? '.exe'
                        : ''
                }`


            try {
                await execAsync(
                    `rm -f "${outputPath}"`
                )
            } catch {}


            try {

                await execAsync(
                    `wget -q -O "${outputPath}" "${url}"`,
                    {
                        timeout: 120000
                    }
                )

            } catch {

                await execAsync(
                    `curl -L -o "${outputPath}" "${url}"`,
                    {
                        timeout: 120000
                    }
                )
            }


            if (!existsSync(outputPath))
                return null


            if (platform !== 'windows') {

                try {
                    chmodSync(
                        outputPath,
                        0o755
                    )
                } catch {}
            }


            try {

                await execAsync(
                    `"${outputPath}" --version`,
                    {
                        timeout: 10000
                    }
                )

            } catch {

                return null
            }


            return outputPath

        } catch (e) {

            console.error(
                'ARTHUR BOT YTDLP INSTALL:',
                e
            )

            return null

        }

    })().finally(() => {

        isInstalling = false
        installPromise = null

    })

    return installPromise
}


// ═══════════════════════════════
// 🎬 تحميل وتحويل الفيديو
// ═══════════════════════════════

async function downloadInstagram(
    url,
    outputPath,
    conn,
    chat
) {

    let bin = ytDlpPath


    if (!bin) {

        bin =
            await autoInstallYTDLP(
                conn,
                chat
            )

        if (!bin) {

            throw new Error(
                'فشل تجهيز مكتبة yt-dlp.'
            )
        }

        ytDlpPath = bin
    }


    // التأكد من yt-dlp
    try {

        await execAsync(
            `"${bin}" --version`,
            {
                timeout: 5000
            }
        )

    } catch {

        ytDlpPath = null

        bin =
            await autoInstallYTDLP(
                conn,
                chat
            )

        if (!bin)
            throw new Error(
                'تعذر تشغيل yt-dlp.'
            )

        ytDlpPath = bin
    }


    /*
     * 🎥 H.264 + AAC
     * أفضل توافق مع الموبايل وواتساب
     */

    const cmd =
        `"${bin}" "${url}" ` +
        `-o "${outputPath}" ` +

        `-f "bv*[vcodec^=avc1]+ba[acodec^=mp4a]/b[ext=mp4]/best" ` +

        `--merge-output-format mp4 ` +

        `--recode-video mp4 ` +

        `--no-playlist ` +

        `--no-warnings ` +

        `--restrict-filenames ` +

        `--postprocessor-args "ffmpeg:-c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 128k -movflags +faststart"`


    await execAsync(
        cmd,
        {
            timeout: 300000,
            maxBuffer:
                20 * 1024 * 1024
        }
    )


    if (!existsSync(outputPath)) {

        throw new Error(
            'لم يتم إنشاء ملف الفيديو.'
        )
    }


    return outputPath
}


// ═══════════════════════════════
// 📸 الأمر الرئيسي
// ═══════════════════════════════

let handler = async (
    m,
    {
        conn,
        text,
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


    // بدون رابط
    if (!text) {

        await react('❌')

        return m.reply(
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 📸 Instagram Downloader
*┃*
*┃* ✦ استخدم:
*┃* ${usedPrefix}${command} <رابط>
*┃*
*┃* 🎬 مثال:
*┃* ${usedPrefix}${command} https://www.instagram.com/reel/xxxx/
*╰━━━━━━━━━━━━━━╯*`
        )
    }


    // التحقق من الرابط
    if (
        !/instagram\.com/i.test(text) &&
        !/instagr\.am/i.test(text)
    ) {

        await react('❌')

        return m.reply(
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* ❌ الرابط ليس من Instagram
*┃*
*┃* 📸 أرسل رابط Reel أو Post عام.
*╰━━━━━━━━━━━━━━╯*`
        )
    }


    await react('⏳')


    let statusMsg = null
    let outputPath = null


    try {

        statusMsg = await m.reply(
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 📸 جاري تحميل الفيديو...
*┃*
*┃* ⏳ انتظر قليلًا
*╰━━━━━━━━━━━━━━╯*`
        )


        outputPath =
            join(
                tmpdir(),
                `e7_ig_${Date.now()}.mp4`
            )


        // تحميل + تحويل
        await downloadInstagram(
            text,
            outputPath,
            conn,
            m.chat
        )


        if (!existsSync(outputPath))
            throw new Error(
                'ملف الفيديو غير موجود.'
            )


        const size =
            statSync(outputPath).size


        const sizeMB =
            (
                size /
                1048576
            ).toFixed(2)


        // حذف رسالة الانتظار
        if (statusMsg?.key) {

            try {

                await conn.sendMessage(
                    m.chat,
                    {
                        delete:
                            statusMsg.key
                    }
                )

            } catch {}
        }


        // فيديو عادي
        if (
            size <
            100 * 1024 * 1024
        ) {

            await conn.sendMessage(
                m.chat,
                {

                    video: {
                        url: outputPath
                    },

                    mimetype:
                        'video/mp4',

                    caption:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🎬 تم تحميل الفيديو
*┃*
*┃* 📸 Instagram • HD
*┃* 📦 الحجم: ${sizeMB} MB
*┃*
*┃* ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓
*╰━━━━━━━━━━━━━━╯*`
                },
                {
                    quoted: m
                }
            )

        } else {

            // لو الفيديو أكبر من 100MB
            await conn.sendMessage(
                m.chat,
                {

                    document: {
                        url: outputPath
                    },

                    mimetype:
                        'video/mp4',

                    fileName:
                        `ARTHUR_Instagram_${Date.now()}.mp4`,

                    caption:
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* 🎬 تم تحميل الفيديو
*┃*
*┃* 📦 الحجم: ${sizeMB} MB
*┃* ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓
*╰━━━━━━━━━━━━━━╯*`
                },
                {
                    quoted: m
                }
            )
        }


        await react('✅')


        // حذف بعد الإرسال
        setTimeout(
            () => {

                try {

                    if (
                        outputPath &&
                        existsSync(outputPath)
                    ) {

                        unlinkSync(
                            outputPath
                        )
                    }

                } catch {}

            },
            10000
        )


    } catch (e) {

        console.error(
            '❌ ARTHUR BOT Instagram:',
            e
        )


        // حذف رسالة الانتظار
        if (statusMsg?.key) {

            try {

                await conn.sendMessage(
                    m.chat,
                    {
                        delete:
                            statusMsg.key
                    }
                )

            } catch {}
        }


        await react('❌')


        return m.reply(
`*╭━━━〔 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 〕━━━╮*
*┃* ❌ فشل تحميل Instagram
*┃*
*┃* ✦ ${String(
    e?.message ||
    'خطأ غير معروف'
).substring(0, 250)}
*┃*
*┃* 🎀 تأكد أن الرابط عام.
*╰━━━━━━━━━━━━━━╯*`
        )
    }
}


// ═══════════════════════════════
// 📌 إعداد الأمر
// ═══════════════════════════════

handler.command =
    /^(انستا|انستقرام|ig|instagram)$/i

handler.help = [
    'انستا <رابط>'
]

handler.tags = [
    'downloader'
]

export default handler