// plugins/جلبمجلد.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - جلب المجلدات كملف ZIP 📁

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// مجلدات ما نبيها تطلع - عشان ما ترسل اشياء ثقيلة او خطيرة
const EXCLUDE = ['node_modules', '.git', '.cache', '.npm', 'sessions', 'data', 'tmp', '.github']

function getFolders() {
    let root = process.cwd()
    let items = fs.readdirSync(root, { withFileTypes: true })
    let folders = items
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .filter(name => !EXCLUDE.includes(name) && !name.startsWith('.'))
        .sort()
    return folders
}

function getFolderSize(folderPath) {
    let total = 0
    function walk(dir) {
        let files = []
        try { files = fs.readdirSync(dir) } catch { return }
        for (let f of files) {
            let p = path.join(dir, f)
            try {
                let stat = fs.statSync(p)
                if (stat.isDirectory()) walk(p)
                else total += stat.size
            } catch {}
        }
    }
    walk(folderPath)
    return total
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

function countFiles(folderPath) {
    let count = 0
    function walk(dir) {
        let files = []
        try { files = fs.readdirSync(dir) } catch { return }
        for (let f of files) {
            let p = path.join(dir, f)
            try {
                let stat = fs.statSync(p)
                if (stat.isDirectory()) walk(p)
                else count++
            } catch {}
        }
    }
    walk(folderPath)
    return count
}

async function makeZip(folderName, folderPath, zipPath) {
    // نحاول بـ archiver اولاً اذا موجود
    try {
        const archiver = (await import('archiver')).default
        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })
        return new Promise((resolve, reject) => {
            output.on('close', () => resolve(true))
            archive.on('error', (e) => reject(e))
            archive.pipe(output)
            archive.directory(folderPath, folderName)
            archive.finalize()
        })
    } catch {
        // اذا archiver مو موجود، نستخدم امر zip حق السيرفر
        try {
            await execAsync(`cd "${process.cwd()}" && zip -r "${zipPath}" "${folderName}"`)
            return true
        } catch (e) {
            throw new Error('ما قدرت اضغط المجلد. ثبت archiver: npm i archiver')
        }
    }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // ✅ للمالك فقط - لأنه بيجلب ملفات البوت كلها
    if (m.sender !== conn.user.jid && !m.isOwner && !m.isROwner) {
        // اذا تبيه للكل، شل هذا الشرط
        // return m.reply('❌ هذا الأمر للمالك فقط')
    }

    let folders = getFolders()
    if (!folders.length) return m.reply('❌ ما لقيت أي مجلد')

    let input = (text || '').trim()

    // 1️⃣ بدون رقم - يعرض كل المجلدات
    if (!input) {
        let list = folders.map((f, i) => {
            let folderPath = path.join(process.cwd(), f)
            let size = formatBytes(getFolderSize(folderPath))
            let files = countFiles(folderPath)
            return `*${i + 1}.* 📁 *${f}*\n   ├ 📄 الملفات: ${files} ملف\n   └ 💾 الحجم: ${size}`
        }).join('\n\n')

        return m.reply(
`*◇❐ ═━╾📁 ╼━═ ❐◇*

  📁 *كل مجلدات البوت*
  📊 العدد: ${folders.length} مجلد

*◇❐ ═━╾📁 ╼━═ ❐◇*

${list}

*◇❐ ═━╾📁 ╼━═ ❐◇*

  📌 *للجلب اكتب:*
  • ${usedPrefix + command} 1 - يجلب المجلد رقم 1
  • ${usedPrefix + command} 2 - يجلب المجلد رقم 2
  • ${usedPrefix + command} plugins - يجلب بالاسم

*◇❐ ═━╾📁 ╼━═ ❐◇*
  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
        )
    }

    // 2️⃣ جلب مجلد برقم او بالاسم
    let folderName = ''
    if (!isNaN(input)) {
        let num = parseInt(input)
        if (num < 1 || num > folders.length) {
            return m.reply(`❌ ما فيه مجلد رقم ${num}\n\nالمجلدات من 1 لـ ${folders.length}\nاكتب ${usedPrefix + command} بدون رقم عشان تشوف القائمة`)
        }
        folderName = folders[num - 1]
    } else {
        // بحث بالاسم
        folderName = folders.find(f => f.toLowerCase() === input.toLowerCase())
            || folders.find(f => f.toLowerCase().includes(input.toLowerCase()))
        if (!folderName) {
            return m.reply(`❌ ما لقيت مجلد اسمه *${input}*\n\nاكتب ${usedPrefix + command} بدون رقم عشان تشوف القائمة`)
        }
    }

    let folderPath = path.join(process.cwd(), folderName)
    let size = getFolderSize(folderPath)
    let files = countFiles(folderPath)

    // اذا المجلد كبير فوق 100MB ننبهه
    if (size > 100 * 1024 * 1024) {
        return m.reply(`⚠️ المجلد *${folderName}* كبير جداً: ${formatBytes(size)}\n\nما اقدر ارسله في الواتساب، حجمه فوق 100MB`)
    }

    await m.reply(`⏳ *جاري ضغط المجلد...*\n\n📁 المجلد: ${folderName}\n📄 الملفات: ${files} ملف\n💾 الحجم: ${formatBytes(size)}\n\nانتظر شوي...`)

    try {
        let zipName = `${folderName}.zip`
        let zipPath = path.join(process.cwd(), `tmp_${Date.now()}_${zipName}`)
        // نتأكد مجلد tmp موجود
        if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) {
            try { fs.mkdirSync(path.join(process.cwd(), 'tmp'), { recursive: true }) } catch {}
        }
        zipPath = path.join(process.cwd(), 'tmp', zipName)

        await makeZip(folderName, folderPath, zipPath)

        let zipSize = fs.existsSync(zipPath) ? fs.statSync(zipPath).size : 0

        // ✅ نرسل المجلد كملف ZIP
        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(zipPath),
            fileName: zipName,
            mimetype: 'application/zip',
            caption: `*◇❐ ═━╾📁 ╼━═ ❐◇*\n\n  ✅ تم جلب المجلد بنجاح\n\n  📁 المجلد: ${folderName}\n  📄 الملفات: ${files} ملف\n  💾 الحجم الأصلي: ${formatBytes(size)}\n  📦 حجم ZIP: ${formatBytes(zipSize)}\n\n*◇❐ ═━╾📁 ╼━═ ❐◇*\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
        }, { quoted: m })

        // نحذف ملف ZIP بعد الارسال عشان ما يمتلئ السيرفر
        try { fs.unlinkSync(zipPath) } catch {}
        console.log(`[جلبمجلد] تم ارسال مجلد ${folderName} لـ ${m.sender}`)

    } catch (e) {
        console.log('[جلبمجلد] خطأ:', e.message)
        return m.reply(`❌ فشل جلب المجلد: ${e.message}\n\n💡 اذا طلع لك خطأ archiver، ثبتها:\n\`npm install archiver\``)
    }
}

handler.help = ['جلبمجلد']
handler.tags = ['owner']
handler.command = /^(جلبمجلد|جلب_مجلد|getfolder|folder|مجلدات)$/i

export default handler