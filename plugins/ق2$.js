// plugins/كود.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - إدارة الأكواد 📦 ✧

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { downloadContentFromMessage } from "@whiskeysockets/baileys"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pluginsDir = path.join(__dirname, "..", "plugins")

// ── تنظيف اسم الملف - يمنع ../ و / و $ واي رمز يخرب ──
function cleanName(name) {
    if (!name) return null
    let n = name.trim()
        .replace(/\.js$/i, "")
        .replace(/```/g, "")
        .replace(/[\/\\:*?"<>|$`]/g, "") // هنا نشيل $ و / وكل الرموز الخطيرة
        .replace(/\s+/g, "-")
        .trim()
    // نسمح بس بحروف عربي + انجليزي + ارقام + _ -
    n = n.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "")
    if (!n || n === "." || n === "..") return null
    if (n.length > 50) n = n.slice(0, 50)
    return n
}

// ── تنظيف الكود - بدون اضافة اي حرف ──
function cleanCode(code) {
    if (!code) return ""
    let c = code
        .replace(/\uFEFF/g, "") // BOM
        .replace(/\r\n/g, "\n")
        .trim()

    // شيل ```javascript و ``` من البداية والنهاية
    if (c.startsWith("```")) {
        c = c.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/,"").trim()
    }

    // اذا الكود كله داخل ``` في النص
    const match = c.match(/```(?:js|javascript)?\n?([\s\S]*?)```/)
    if (match) c = match[1].trim()

    // شيل $ اللي يجي من النسخ في اول السطر - بس اذا كان في بداية الكود
    // مثال: "$ const x = 1" -> "const x = 1"
    c = c.split("\n").map(line => {
        if (/^\$\s+/.test(line) && !line.includes("`")) return line.replace(/^\$\s+/, "")
        return line
    }).join("\n")

    return c.trim()
}

function getPlugins() {
    try {
        return fs.readdirSync(pluginsDir).filter(f => f.endsWith(".js"))
    } catch { return [] }
}

function findPlugin(name) {
    const clean = cleanName(name)
    if (!clean) return null
    const all = getPlugins()
    // تطابق دقيق اول
    let found = all.find(f => f.toLowerCase() === clean.toLowerCase() + ".js")
    if (found) return found
    // تطابق بدون - و _
    found = all.find(f => f.toLowerCase().replace(/[-_]/g, "") === clean.toLowerCase().replace(/[-_]/g, "") + ".js")
    if (found) return found
    return null
}

function extractName(code) {
    // 1. من handler.command = /^ق2$/i
    let m = code.match(/handler\.command\s*=\s*\/\^[^a-zA-Z0-9_\u0600-\u06FF]*([a-zA-Z0-9_\u0600-\u06FF-]+)/)
    if (m) return cleanName(m[1])
    // 2. من handler.command = ["xxx"]
    m = code.match(/handler\.command\s*=\s*\[\s*["'`]([^"'`]+)["'`]/)
    if (m) return cleanName(m[1])
    // 3. من // plugins/xxx.js
    m = code.match(/\/\/\s*plugins\/([a-zA-Z0-9_\u0600-\u06FF-]+)\.js/)
    if (m) return cleanName(m[1])
    return null
}

let handler = async (m, { conn, args, usedPrefix }) => {
    const react = async (e) => { try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }) } catch {} }

    const action = (args[0] || "").toLowerCase()
    const nameArg = args.slice(1).join(" ").trim()

    const head = `*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n`
    const foot = `\n\n*◇❐ ═━╾⚡ ╼━═ ❐◇*\n\n*◇❐ ═━╾ ⚡ ╼━═ ❐◇*\n  𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`

    // ═══════════ عرض ═══════════
    if (/^(عرض|show|get)$/i.test(action)) {
        if (!nameArg) return m.reply(`${head}  📄 الاستخدام:\n  ${usedPrefix}كود عرض <اسم>${foot}`)
        const found = findPlugin(nameArg)
        if (!found) { await react("❌"); return m.reply(`${head}  ❌ الملف "${nameArg}" مو موجود${foot}`) }
        const filePath = path.join(pluginsDir, found)
        const code = fs.readFileSync(filePath, "utf-8")
        const size = (code.length / 1024).toFixed(2)
        const lines = code.split("\n").length
        await react("📄")
        // نرسله كملف عشان ما ينقص ولا حرف ولا يضيف $
        await conn.sendMessage(m.chat, {
            document: Buffer.from(code, "utf-8"),
            fileName: found,
            mimetype: "text/javascript",
            caption: `${head}  📄 ${found}\n  📦 ${size} KB | 📝 ${lines} سطر${foot}`
        }, { quoted: m })
        return
    }

    // ═══════════ لست ═══════════
    if (/^(لست|list|قائمة|قايمه)$/i.test(action)) {
        const plugins = getPlugins()
        if (!plugins.length) return m.reply(`${head}  📂 ما فيه بلوقنات${foot}`)
        let txt = `${head}  📦 قائمة الأكواد:\n\n`
        plugins.forEach((f, i) => { txt += `  ${i + 1}. ${f.replace(".js", "")}\n` })
        txt += `\n  📊 المجموع: ${plugins.length} كود${foot}`
        await react("📦")
        return m.reply(txt)
    }

    // ═══════════ مسح / حذف ═══════════
    if (/^(مسح|حذف|delete|del|remove)$/i.test(action)) {
        if (!nameArg) return m.reply(`${head}  🗑️ الاستخدام:\n  ${usedPrefix}كود مسح <اسم>${foot}`)
        const found = findPlugin(nameArg)
        if (!found) { await react("❌"); return m.reply(`${head}  ❌ الملف "${nameArg}" مو موجود${foot}`) }
        if (found === "كود.js" || found === "بلوقن.js") { await react("⛔"); return m.reply(`${head}  ⛔ ما تقدر تمسح ملف إدارة الأكواد نفسه${foot}`) }
        try {
            fs.unlinkSync(path.join(pluginsDir, found))
            await react("🗑️")
            return m.reply(`${head}  ✅ تم مسح ${found} بنجاح${foot}`)
        } catch (e) {
            await react("❌")
            return m.reply(`${head}  ❌ فشل المسح: ${e.message}${foot}`)
        }
    }

    // ═══════════ اضف ═══════════
    if (/^(اضف|اضافه|اضافة|add)$/i.test(action)) {
        const quoted = m.quoted
        if (!quoted) { await react("❌"); return m.reply(`${head}  ❌ رد على الكود أو الملف اللي تبغى تضيفه${foot}`) }

        let code = ""
        let fileName = ""

        const docMsg = quoted.message?.documentMessage || quoted.message?.documentWithCaptionMessage?.message?.documentMessage || null

        if (docMsg) {
            let buffer
            try { buffer = await quoted.download() } catch {
                try {
                    const stream = await downloadContentFromMessage(docMsg, "document")
                    const chunks = []
                    for await (const c of stream) chunks.push(c)
                    buffer = Buffer.concat(chunks)
                } catch (e) { await react("❌"); return m.reply(`${head}  ❌ فشل تحميل الملف${foot}`) }
            }
            code = cleanCode(buffer.toString("utf-8"))
            fileName = cleanName(docMsg.fileName || "")
        } else {
            code = cleanCode(quoted.text || quoted.body || "")
            if (!code) { await react("❌"); return m.reply(`${head}  ❌ الرسالة ما فيها كود${foot}`) }
            fileName = extractName(code) || cleanName(nameArg) || null
        }

        if (!fileName) fileName = `plugin_${Date.now().toString(36)}`
        if (!code.includes("handler") && !code.includes("export")) { await react("⚠️"); return m.reply(`${head}  ⚠️ هذا مو كود بلوقن سليم، تأكد منه${foot}`) }

        // فحص ان الكود سليم قبل الحفظ - بدون ما نضيف شي
        try { new Function(code) } catch (e) { await react("⚠️"); return m.reply(`${head}  ⚠️ الكود فيه خطأ، ما حفظته:\n  ${e.message}${foot}`) }

        const savePath = path.join(pluginsDir, fileName + ".js")
        const isEdit = fs.existsSync(savePath)
        fs.writeFileSync(savePath, code, "utf-8") // نحفظ الكود النظيف فقط

        await react("✅")
        return m.reply(`${head}  ${isEdit ? "✏️ تم التعديل" : "✅ تمت الإضافة"}\n  📄 الملف: ${fileName}.js\n  📦 ${(code.length / 1024).toFixed(2)} KB | 📝 ${code.split("\n").length} سطر${foot}`)
    }

    // ═══════════ القائمة الافتراضية ═══════════
    await react("📦")
    return m.reply(`${head}  📦 إدارة الأكواد\n\n  📄 كود عرض <اسم>\n  ➕ كود اضف - رد على كود\n  🗑️ كود مسح <اسم>\n  📋 كود لست\n\n  مثال: ${usedPrefix}كود اضف${foot}`)
}

handler.help = ["كود"]
handler.tags = ["owner"]
handler.command = /^(كود|code)$/i
handler.owner = true

export default handler