// plugins/ملفات.js
// ✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - إدارة ملفات المشروع 📁

import fs from "fs";
import path from "path";
import { downloadContentFromMessage, generateWAMessageFromContent, generateMessageIDV2 } from '@whiskeysockets/baileys';

const formatBox = (lines) => {
    const body = lines.map(line => `*┃* 📁 ╎ ${line}`).join('\n');
    return `*◇❐ ═━━╾⚡ ╼━━═ ❐◇*\n${body}\n*◇❐ ═━━╾⚡╼━━═ ❐◇*`;
};

// المجلدات والملفات المستثناة (مجلد الجلسة ومجلد المكتبات والملفات الحساسة)
const IGNORED_DIRS = new Set([
    'ملف_الاتصال',
    'node_modules',
    'session',
    'sessions',
    'auth',
    'auth_info',
    'auth_info_baileys',
    'baileys_auth',
    'creds',
    '.git',
    '.github',
    '.npm',
    '.cache',
    'tmp',
    'temp'
]);

const IGNORED_FILES = new Set([
    'creds.json',
    '.env'
]);

const isIgnoredPath = (relPath) => {
    const parts = relPath.split(/[\\/]/).filter(Boolean);
    for (const part of parts) {
        const lower = part.toLowerCase();
        if (IGNORED_DIRS.has(part) || IGNORED_DIRS.has(lower)) return true;
        if (lower.includes('session') || lower.includes('auth_info')) return true;
    }
    const base = path.basename(relPath).toLowerCase();
    if (IGNORED_FILES.has(base)) return true;
    return false;
};

// مسح جميع ملفات المشروع باستثناء الجلسات والمكتبات
const getAllProjectFiles = (rootDir, currentDir = rootDir, result = []) => {
    let entries;
    try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
        return result;
    }

    for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

        if (isIgnoredPath(relPath)) continue;

        if (entry.isDirectory()) {
            getAllProjectFiles(rootDir, fullPath, result);
        } else if (entry.isFile()) {
            result.push(relPath);
        }
    }
    return result;
};

let handler = async (m, { conn, args, usedPrefix, command }) => {

    const react = async (e) => {
        try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }); } catch {}
    };

    const pluginsDir = path.dirname(global.__filename(import.meta.url, true));
    const rootDir = path.resolve(pluginsDir, '..');
    const currentFileRel = path.relative(rootDir, global.__filename(import.meta.url, true)).replace(/\\/g, '/');

    const resolveSafePath = (inputPath) => {
        const cleaned = inputPath.replace(/^[\\/]+/, '').trim();
        const full = path.resolve(rootDir, cleaned);
        const rel = path.relative(rootDir, full).replace(/\\/g, '/');
        if (rel.startsWith('..') || path.isAbsolute(rel) || isIgnoredPath(rel)) {
            return null;
        }
        return { full, rel };
    };

    const findProjectFile = (query) => {
        const cleanQuery = query.trim().replace(/\\/g, '/');
        const allFiles = getAllProjectFiles(rootDir).filter(f => f !== currentFileRel);

        let found = allFiles.find(f => f.toLowerCase() === cleanQuery.toLowerCase());
        if (found) return found;

        if (!cleanQuery.includes('.')) {
            found = allFiles.find(f => f.toLowerCase() === (cleanQuery + '.js').toLowerCase());
            if (found) return found;
        }

        const baseQuery = path.basename(cleanQuery).toLowerCase();
        found = allFiles.find(f => path.basename(f).toLowerCase() === baseQuery);
        if (found) return found;

        found = allFiles.find(f => path.basename(f, path.extname(f)).toLowerCase() === baseQuery.replace(/\.[^.]+$/, ''));
        if (found) return found;

        found = allFiles.find(f => f.toLowerCase().includes(cleanQuery.toLowerCase()));
        if (found) return found;

        return null;
    };

    const action = (args[0] || "").toLowerCase();

    // ⭐ عرض الكود - بنظام Rich Message
    if (/^(عرض|show|get|قراءة)$/i.test(action)) {
        const nameArg = args.slice(1).join(" ").trim();
        if (!nameArg) {
            return m.reply(formatBox([
                `*عـرض مـلـف - ARTHUR BOT*`,
                `*الاستخدام:* ${usedPrefix + command} عرض <اسم أو مسار الملف>`,
                `*مثال:* ${usedPrefix + command} عرض core/theme.js`
            ]));
        }

        const foundRel = findProjectFile(nameArg);
        if (!foundRel) {
            await react("❌");
            return m.reply(formatBox([
                `*خـطـأ - ARTHUR BOT*`,
                `*السبب:* الملف "${nameArg}" غير موجود أو محمي`
            ]));
        }

        const filePath = path.join(rootDir, foundRel);
        const code = fs.readFileSync(filePath, "utf-8");
        const fileSize = (Buffer.byteLength(code, 'utf-8') / 1024).toFixed(2);
        const totalLines = code.split('\n').length;
        const ext = path.extname(foundRel).replace('.', '') || 'javascript';

        await react("📄");

        const botMeta = {
            isForwarded: true,
            forwardingScore: 1,
            forwardedAiBotMessageInfo: {
                botJid: "867051314767696@bot"
            },
            forwardOrigin: 4
        };

        const codeLines = code.split('\n');
        const codeBlocks = [];
        let currentBlock = '';
        let blockType = 1;

        for (let i = 0; i < codeLines.length; i++) {
            const line = codeLines[i];
            if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
                if (currentBlock) {
                    codeBlocks.push({ highlightType: blockType, codeContent: currentBlock });
                    currentBlock = '';
                }
                blockType = 3;
                currentBlock += line + '\n';
            } else if (line.includes('handler.') || line.includes('export')) {
                if (currentBlock) {
                    codeBlocks.push({ highlightType: blockType, codeContent: currentBlock });
                    currentBlock = '';
                }
                blockType = 2;
                currentBlock += line + '\n';
            } else if (line.trim() === '' || line.trim().startsWith('import') || line.trim().startsWith('const') || line.trim().startsWith('let')) {
                if (currentBlock && blockType !== 2 && blockType !== 3) {
                    blockType = 1;
                }
                currentBlock += line + '\n';
            } else {
                if (currentBlock && blockType !== 2 && blockType !== 3) {
                    blockType = 4;
                }
                currentBlock += line + '\n';
            }
        }
        if (currentBlock) {
            codeBlocks.push({ highlightType: blockType, codeContent: currentBlock });
        }

        const richMessage = {
            richResponseMessage: {
                messageType: 1,
                submessages: [
                    {
                        messageType: 2,
                        messageText: `\n📄 *${foundRel}*\n📦 ${fileSize} KB | 📝 ${totalLines} سطر\n⚡ ${global.watermark || '✧ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✧'}\n`,
                    },
                    {
                        messageType: 2,
                        messageText: `\n💻 *المحتوى:*\n`,
                    },
                    {
                        messageType: 5,
                        codeMetadata: {
                            codeLanguage: ext === 'js' ? 'javascript' : ext,
                            codeBlocks: codeBlocks
                        }
                    }
                ],
                contextInfo: botMeta
            }
        };

        try {
            const senderId = conn.user?.jid || conn.user?.id || m.chat;
            const msg = await generateWAMessageFromContent(m.chat, {
                botForwardedMessage: { message: richMessage }
            }, {
                senderId,
                userJid: senderId,
                messageId: generateMessageIDV2(senderId)
            });

            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        } catch (err) {
            console.error("[ARTHUR BOT-Files]", err);
            await conn.sendMessage(m.chat, {
                text: `📄 *${foundRel}*\n📦 ${fileSize} KB | 📝 ${totalLines} سطر\n\n\`\`\`${ext}\n${code}\n\`\`\``
            }, { quoted: m });
        }

        return;
    }

    // ⭐ لست
    if (/^(لست|list|قائمة)$/i.test(action)) {
        const filterFolder = args.slice(1).join(" ").trim().toLowerCase();
        let files = getAllProjectFiles(rootDir).filter(f => f !== currentFileRel);

        if (filterFolder) {
            files = files.filter(f => f.toLowerCase().startsWith(filterFolder));
        }

        if (!files.length) {
            await react("📁");
            return m.reply(formatBox([
                `*قـائـمـة الـمـلـفـات*`,
                `*الحالة:* لا توجد ملفات مطابقة`
            ]));
        }

        const lines = [`*مـلـفـات الـمـشـروع - ARTHUR BOT*`];
        files.forEach((f, i) => lines.push(`*${i + 1}.* ${f}`));
        lines.push(`*المجموع:* ${files.length} ملف (مستثنى الجلسات والمكتبات)`);

        await react("📁");
        return m.reply(formatBox(lines));
    }

    // ⭐ حذف
    if (/^(حذف|delete|del|remove)$/i.test(action)) {
        const nameArg = args.slice(1).join(" ").trim();
        if (!nameArg) {
            return m.reply(formatBox([
                `*حـذف مـلـف - ARTHUR BOT*`,
                `*الاستخدام:* ${usedPrefix + command} حذف <اسم أو مسار الملف>`
            ]));
        }

        const foundRel = findProjectFile(nameArg);
        if (!foundRel) {
            await react("❌");
            return m.reply(formatBox([
                `*خـطـأ - ARTHUR BOT*`,
                `*السبب:* الملف "${nameArg}" غير موجود أو محمي`
            ]));
        }

        const filePath = path.join(rootDir, foundRel);
        const code = fs.readFileSync(filePath, "utf-8");
        const fileSize = (Buffer.byteLength(code, 'utf-8') / 1024).toFixed(2);
        const lineCount = code.split('\n').length;

        fs.unlinkSync(filePath);

        const baseName = path.basename(foundRel);
        if (global.plugins?.[baseName]) delete global.plugins[baseName];

        await react("🗑️");
        return m.reply(formatBox([
            `*تـم الـحـذف - ARTHUR BOT*`,
            `*المسار:* ${foundRel}`,
            `*الحجم:* ${fileSize} KB`,
            `*الأسطر:* ${lineCount} سطر`
        ]));
    }

    // ⭐ إضافة أو تعديل ملف في أي مسار
    if (/^(اضف|اضافه|اضافة|add|حفظ|save)$/i.test(action)) {
        const quoted = m.quoted;
        if (!quoted) {
            await react("❌");
            return m.reply(formatBox([
                `*خـطـأ - ARTHUR BOT*`,
                `*السبب:* رد على كود أو ملف لحفظه`
            ]));
        }

        const customTarget = args.slice(1).join(" ").trim();
        let code = "";
        let targetRel = "";

        const docMsg = quoted.message?.documentMessage || quoted.message?.documentWithCaptionMessage?.message?.documentMessage || null;

        if (docMsg) {
            let buffer;
            try {
                buffer = await quoted.download();
            } catch {
                try {
                    const stream = await downloadContentFromMessage(docMsg, "document");
                    const chunks = [];
                    for await (const c of stream) chunks.push(c);
                    buffer = Buffer.concat(chunks);
                } catch (e) {
                    await react("❌");
                    return m.reply(formatBox([
                        `*فشل تحميل الملف*`,
                        `*السبب:* ${e.message}`
                    ]));
                }
            }
            code = buffer.toString("utf-8");
            const docName = docMsg.fileName || `file_${Date.now()}.js`;
            if (customTarget) {
                targetRel = customTarget.includes('.') ? customTarget : path.posix.join(customTarget, docName);
            } else {
                const existing = findProjectFile(docName);
                targetRel = existing || (docName.endsWith('.js') ? `plugins/${docName}` : docName);
            }
        } else {
            code = quoted.text || quoted.body || "";
            if (!code.trim()) {
                await react("❌");
                return m.reply(formatBox([
                    `*خـطـأ - ARTHUR BOT*`,
                    `*السبب:* الرسالة المردود عليها فارغة`
                ]));
            }

            if (customTarget) {
                targetRel = customTarget.includes('.') ? customTarget : `${customTarget}.js`;
            } else {
                const pathComment = code.match(/\/\/\s*([a-zA-Z0-9_\u0600-\u06FF./-]+\.[a-zA-Z0-9]+)/);
                if (pathComment) {
                    targetRel = pathComment[1].trim();
                } else {
                    let extractedName = null;
                    const cmdMatch1 = code.match(/handler\.command\s*=\s*\/\^\(?([^)\/|\\s]+)/);
                    if (cmdMatch1) extractedName = cmdMatch1[1].trim();

                    if (!extractedName) {
                        const cmdMatch2 = code.match(/handler\.command\s*=\s*\[['"`]([^'"`]+)['"`]/);
                        if (cmdMatch2) extractedName = cmdMatch2[1].trim();
                    }

                    if (extractedName) {
                        const existing = findProjectFile(`${extractedName}.js`);
                        targetRel = existing || `plugins/${extractedName}.js`;
                    } else {
                        targetRel = `plugins/file_${Date.now().toString(36)}.js`;
                    }
                }
            }
        }

        const safe = resolveSafePath(targetRel);
        if (!safe) {
            await react("❌");
            return m.reply(formatBox([
                `*مسار غير مسموح - ARTHUR BOT*`,
                `*السبب:* لا يمكن الكتابة في مجلد الجلسات أو المكتبات`
            ]));
        }

        const isEdit = fs.existsSync(safe.full);
        fs.mkdirSync(path.dirname(safe.full), { recursive: true });
        fs.writeFileSync(safe.full, code, "utf-8");

        const baseName = path.basename(safe.rel);
        if (global.plugins?.[baseName]) delete global.plugins[baseName];

        const fileSize = (Buffer.byteLength(code, 'utf-8') / 1024).toFixed(2);
        const lineCount = code.split('\n').length;

        await react("✅");
        return m.reply(formatBox([
            isEdit ? `*تـم الـتـعـديـل - ARTHUR BOT*` : `*تـم الإضـافـة - ARTHUR BOT*`,
            `*المسار:* ${safe.rel}`,
            `*الحجم:* ${fileSize} KB`,
            `*الأسطر:* ${lineCount} سطر`
        ]));
    }

    // القائمة الافتراضية
    await react("📁");
    return m.reply(formatBox([
        `*إدارة مـلـفـات الـبـوت - ARTHUR BOT*`,
        `*${usedPrefix + command} لست:* عرض كل الملفات`,
        `*${usedPrefix + command} لست core:* ملفات مجلد معين`,
        `*${usedPrefix + command} عرض <مسار>:* عرض الكود`,
        `*${usedPrefix + command} اضف [مسار]:* حفظ أو تعديل ملف`,
        `*${usedPrefix + command} حذف <مسار>:* حذف ملف`
    ]));
};

handler.help = ["ملفات"];
handler.tags = ["owner"];
handler.command = /^(ملفات|ملف|ادارة|إدارة|files|file)$/i;
handler.owner = true;

export default handler;