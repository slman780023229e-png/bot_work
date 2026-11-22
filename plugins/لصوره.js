// plugins/لصورة.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - تحويل الاستيكر إلى صورة 🖼️

import axios from 'axios';

const BASE_URL = 'https://elysiatools.com';

let handler = async (m, { conn, usedPrefix, command }) => {

    // التأكد أن المستخدم رد على استيكر
    if (!m.quoted || !/(webp|sticker)/.test(m.quoted.mimetype || "")) {
        return conn.reply(m.chat, `> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "وحدة تحويل الاستيكر لصورة"*\n> \n> 🎨 *الاستخدام:* رد على الاستيكر بـ ${usedPrefix + command}\n> 📌 *مثال:* ${usedPrefix + command} (مع الرد على استيكر)`, m)
    }

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    try {
        // تحميل الاستيكر
        let stickerBuffer = await m.quoted.download();

        if (!stickerBuffer || stickerBuffer.length < 100) {
            throw new Error('الاستيكر تالف');
        }

        await m.reply('> 🖼️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "جاري تحويل الاستيكر إلى صورة..."*');

        let resultBuffer = null;

        // محاولة 1: استخدام API خارجي
        try {
            const formData = new FormData();
            const blob = new Blob([stickerBuffer], { type: 'image/webp' });
            formData.append('file', blob, 'image.webp');

            const uploadRes = await axios.post(`${BASE_URL}/upload/animated-webp-apng-to-mp4`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000
            });

            const filePath = uploadRes.data.filePath || uploadRes.data.url;
            
            if (filePath) {
                const convertRes = await axios.post(`${BASE_URL}/en/api/tools/webp-to-png`, {
                    imageFile: filePath
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });

                let resultUrl = convertRes.data.data?.filePath || convertRes.data.filePath;
                if (resultUrl) {
                    if (resultUrl.startsWith('/')) resultUrl = BASE_URL + resultUrl;
                    const imageRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 30000 });
                    resultBuffer = Buffer.from(imageRes.data);
                }
            }
        } catch (apiError) {
            console.log("[𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓-ToImg] API failed, trying FFmpeg...");
        }

        // محاولة 2: استخدام FFmpeg مباشرة
        if (!resultBuffer) {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const { promises: fs } = await import('fs');
            const { join } = await import('path');
            
            const execAsync = promisify(exec);
            const tmpDir = join(process.cwd(), 'tmp');
            await fs.mkdir(tmpDir, { recursive: true });
            
            const inputFile = join(tmpDir, Date.now() + '.webp');
            const outputFile = inputFile.replace('.webp', '.png');
            
            await fs.writeFile(inputFile, stickerBuffer);
            
            try {
                await execAsync(`ffmpeg -i "${inputFile}" -c:v png "${outputFile}" -y`);
                resultBuffer = await fs.readFile(outputFile);
                await fs.unlink(inputFile).catch(() => {});
                await fs.unlink(outputFile).catch(() => {});
            } catch (ffmpegError) {
                await fs.unlink(inputFile).catch(() => {});
                throw new Error("فشل تحويل الاستيكر إلى صورة");
            }
        }

        if (!resultBuffer || resultBuffer.length < 1000) {
            throw new Error("الملف الناتج تالف");
        }

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        // إرسال الصورة
        await conn.sendMessage(m.chat, {
            image: resultBuffer,
            caption: `> ✅ *ARTHUR BOT: "تم التحويل"*\n> \n> 🎨 تم تحويل الاستيكر إلى صورة\n> 📁 الحجم: ${(resultBuffer.length / 1024).toFixed(2)} KB`,
            mentions: [m.sender]
        });

    } catch (e) {
        console.log("[ARTHUR BOT-ToImg]", e);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        conn.reply(m.chat, `> ❄️ *𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓: "فشل التحويل"*\n> \n> 📌 *السبب:* ${e.message || 'الاستيكر غير مدعوم'}\n> 💡 *الحل:* جرب استيكر آخر`, m);
    }
}

handler.command = ["لصوره", "لصورة", "تحويل-صوره", "toimg", "sticker2img"];
handler.tags = ['sticker'];
handler.help = ['لصورة'];

export default handler;