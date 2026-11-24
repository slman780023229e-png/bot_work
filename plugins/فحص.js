// plugins/فحص.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - فحص السرعة والتشغيل والذاكرة ⚡ - بدون تعديل رسالة

import os from 'os'
import { performance } from 'perf_hooks'

function formatUptime(seconds) {
    seconds = Math.floor(seconds)
    let d = Math.floor(seconds / 86400)
    let h = Math.floor((seconds % 86400) / 3600)
    let m = Math.floor((seconds % 3600) / 60)
    let s = seconds % 60
    let out = []
    if (d > 0) out.push(`${d} يوم`)
    if (h > 0) out.push(`${h} ساعة`)
    if (m > 0) out.push(`${m} دقيقة`)
    out.push(`${s} ثانية`)
    return out.join(' و ')
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

function formatMB(bytes) {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function bar(percent) {
    let total = 10
    let filled = Math.round((percent / 100) * total)
    let empty = total - filled
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent.toFixed(0)}%`
}

let handler = async (m, { conn }) => {
    let start = performance.now()
    console.log('[فحص] وصل أمر فحص من:', m.sender)

    try {
        // ⚡ تفاعل
        try { await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } }) } catch {}

        // 1️⃣ سرعة الرد - نقيس بدون ما نرسل رسالة وسيطة
        let ping = performance.now() - start

        // 2️⃣ سرعة النت - مع تايمر يدوي عشان ما يعلق اذا النت بطيء
        let netSpeed = 'غير متوفر'
        try {
            let netStart = performance.now()
            let controller = new AbortController()
            let timeout = setTimeout(() => controller.abort(), 3000)
            const res = await fetch('https://www.google.com', { signal: controller.signal })
            clearTimeout(timeout)
            if (res.ok) netSpeed = `${(performance.now() - netStart).toFixed(0)}ms`
            else netSpeed = 'فشل'
        } catch {
            netSpeed = 'فشل'
        }

        // 3️⃣ مدة التشغيل
        let uptimeSec = process.uptime()
        let uptimeText = formatUptime(uptimeSec)
        let uptimeHours = (uptimeSec / 3600).toFixed(1)

        // 4️⃣ الذاكرة
        let mem = process.memoryUsage()
        let totalMem = os.totalmem()
        let freeMem = os.freemem()
        let usedMem = totalMem - freeMem
        let usedPercent = (usedMem / totalMem) * 100
        let heapPercent = (mem.heapUsed / mem.heapTotal) * 100

        // 5️⃣ النظام
        let cpus = os.cpus()
        let cpuModel = cpus[0]?.model?.split('@')[0]?.trim() || 'غير معروف'
        let cpuCores = cpus.length
        let load = os.loadavg()[0]?.toFixed(2) || '0'

        let text =
`*◇❐ ═━╾⚡ ╼━═ ❐◇*

  ⚡ فحص 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓

*◇❐ ═━╾⚡ ╼━═ ❐◇*

  🚀 *السرعة*
    - سرعة الرد: ${ping.toFixed(0)}ms
    - سرعة النت: ${netSpeed}
    - ${ping < 100 ? '🟢 ممتازة' : ping < 300 ? '🟡 جيدة' : '🔴 بطيئة'}

*◇❐ ═━╾⚡ ╼━═ ❐◇*

  ⏰ *مدة التشغيل*
    - شغال من: ${uptimeText}
    - بالساعات: ${uptimeHours} ساعة
    - ${uptimeSec < 3600 ? '🟡 توه شغال' : uptimeSec < 86400 ? '🟢 مستقر' : '👑 شغال من زمان'}

*◇❐ ═━╾⚡ ╼━═ ❐◇*

  🧠 *ذاكرة البوت*
    - المستخدمة: ${formatMB(mem.heapUsed)} / ${formatMB(mem.heapTotal)}
    - ${bar(heapPercent)}
    - الكلية (RSS): ${formatMB(mem.rss)}
    - الخارجية: ${formatMB(mem.external)}

  💻 *ذاكرة الجهاز*
    - المستخدمة: ${formatBytes(usedMem)} / ${formatBytes(totalMem)}
    - ${bar(usedPercent)}
    - المتوفرة: ${formatBytes(freeMem)}

*◇❐ ═━╾⚡ ╼━═ ❐◇*

  ⚙️ *النظام*
    - المعالج: ${cpuModel}
    - الأنوية: ${cpuCores}
    - الضغط: ${load}
    - النظام: ${os.platform()} ${os.arch()}
    - Node: ${process.version}

*◇❐ ═━╾⚡ ╼━═ ❐◇*
  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`

        // ✅ رسالة واحدة بس، بدون تعديل، بدون رسالة وسيطة
        await conn.sendMessage(m.chat, { text }, { quoted: m })
        console.log('[فحص] تم الرد بنجاح')

    } catch (e) {
        console.log('[فحص] خطأ:', e.message)
        // اذا فشل conn.sendMessage، نرد بـ m.reply كبديل اخير
        try {
            await m.reply(`❌ خطأ في الفحص: ${e.message}`)
        } catch {}
    }
}

handler.help = ['فحص', 'ping', 'سرعة']
handler.tags = ['main']
handler.command = /^(فحص|ping|بينج|سرعه|سرعة|speed|حاله|الحاله|status|uptime)$/i

export default handler