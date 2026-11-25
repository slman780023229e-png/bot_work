// plugins/رابط.js
import fetch from 'node-fetch'
import FormData from 'form-data'

const USERHASH = '9e25d335656bf4117a91f0a0f'

let handler = async (m, { conn, text }) => {
    try {
        // ===== رفع رابط لحسابك - urlupload =====
        if (text?.startsWith('http')) {
            await m.reply('⏳ جاري نسخ الرابط لحسابك...')
            const form = new FormData()
            form.append('reqtype', 'urlupload')
            form.append('userhash', USERHASH)
            form.append('url', text.trim())
            const res = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST', body: form, headers: form.getHeaders()
            })
            let url = (await res.text()).trim()
            if (!url.startsWith('https://')) return m.reply(`❌ فشل: ${url}`)
            return m.reply(`✅ تم النسخ لحسابك:\n${url}`)
        }

        const quoted = m.quoted
        if (!quoted) return m.reply(`رد على صورة واكتب .رابط\nأو اكتب .رابط + رابط الصورة`)

        const mime = quoted.mimetype || ''
        const buffer = await quoted.download()
        let ext = mime.split('/')[1]?.split(';')[0] || 'jpg'
        if (mime === 'image/jpeg') ext = 'jpg'
        if (mime.includes('ogg')) ext = 'opus'
        if (mime === 'audio/mpeg') ext = 'mp3'
        const filename = `arthur_${Date.now()}.${ext}`

        await m.reply('⏳ جاري الرفع...')

        async function uploadPomf(url) {
            const form = new FormData()
            form.append('files[]', buffer, { filename, contentType: mime })
            const res = await fetch(url, { method: 'POST', body: form, headers: form.getHeaders() })
            const data = await res.json()
            if (data?.success && data?.files?.[0]?.url) {
                let u = data.files[0].url
                if (!u.startsWith('http')) u = url.replace('/upload.php', '') + u
                return u
            }
            throw new Error('pomf fail')
        }

        async function uploadCatbox() {
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('userhash', USERHASH)
            form.append('fileToUpload', buffer, { filename, contentType: mime })
            const res = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST', body: form, headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' }
            })
            const txt = (await res.text()).trim()
            if (txt.startsWith('https://')) return txt
            throw new Error(txt)
        }

        async function upload0x(url) {
            const form = new FormData()
            form.append('file', buffer, { filename, contentType: mime })
            const res = await fetch(url, { method: 'POST', body: form, headers: form.getHeaders() })
            const txt = (await res.text()).trim()
            if (txt.startsWith('https://')) return txt
            throw new Error(txt)
        }

        async function uploadTmpfiles() {
            const form = new FormData()
            form.append('file', buffer, { filename, contentType: mime })
            const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form, headers: form.getHeaders() })
            const data = await res.json()
            if (data?.url) return data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
            throw new Error('tmpfiles fail')
        }

        const servers = [
            { name: 'Catbox - حسابك ✅', fn: () => uploadCatbox() },
            { name: 'Satoru', fn: () => uploadPomf('https://upload.satoru.click/upload.php') },
            { name: '0x0.st', fn: () => upload0x('https://0x0.st') },
            { name: 'Pomf Lain', fn: () => uploadPomf('https://pomf.lain.la/upload.php') },
            { name: 'Pomf2 Lain', fn: () => uploadPomf('https://pomf2.lain.la/upload.php') },
            { name: 'Envs.sh', fn: () => upload0x('https://envs.sh') },
            { name: 'Tmpfiles', fn: () => uploadTmpfiles() },
            { name: 'Transfer.sh', fn: () => upload0x('https://transfer.sh/') },
        ]

        let fileUrl = '', serverName = ''
        for (let s of servers) {
            try { fileUrl = await s.fn(); serverName = s.name; break }
            catch (e) { console.log(`فشل ${s.name}:`, e.message?.slice(0,100)); continue }
        }

        if (!fileUrl) return m.reply('❌ كل السيرفرات مشغولة، جرب بعد شوي.')

        await m.reply(`✅ تم الرفع بنجاح\n\n🌐 السيرفر: ${serverName}\n🔗 الرابط:\n${fileUrl}`)

    } catch (e) {
        console.log(e)
        await m.reply('❌ فشل الرفع')
    }
}

handler.command = /^(رابط)$/i
export default handler