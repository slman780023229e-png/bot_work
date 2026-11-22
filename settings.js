// config.js
// 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓

import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'

//حط lid بتاعك من امر lid
global.owner = ['185899757400132', '233144431206490', '135974805860531', '116853997338673']

// ========== المطورين ==========
global.mods = []
global.prems = []

// ========== إعدادات البوت ==========
global.baileys = '@whiskeysockets/baileys'
global.botName = 'آرثر'
global.botNameShort = 'آرثر'
global.watermark = '◇❐ ═━╾⚡ ╼━═ ❐◇\n𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓\n◇❐ ═━╾ ⚡ ╼━═ ❐◇'

// ========== المكتبات العامة ==========
global.fetch = fetch
global.axios = axios
global.moment = moment
global.fs = fs

// ========== إعدادات البوت ==========
global.packname = '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓'

global.multiplier = 85

// اكتب رقمك هنا الي عايز تربط بي البوت من دون + او فواصل 
global.botNumberCode = "967780023229"

// روابط  السوشيال ميديا بتاعتي 
global.yt = 'https://www.youtube.com/@kaneki-n2x'
global.ig = 'https://www.instagram.com/kanie_226?igsi=YWpjd2IxOTd6MnJy'
global.md = 'https://www.instagram.com/kanie_226?igsi=YWpjd2IxOTd6MnJy'
global.fb = 'https://www.facebook.com/share/1CxEMXw5H5/'
global.tk = 'https://www.tiktok.com/@5trua5?_r=1&_t=ZS-97C5LgOJgX6'
global.paypal = 'https://paypal.me/Prototype'
global.soporteGB = ''

//  ٤١٤×٧٣٦ صور الخطاء لو عايز تغيره بس عشان تكون عارف لزما تكون الصور بي ابعاد مثلا
global.dfailPool = [
    'https://files.catbox.moe/fgcxgo.jpg',
    'https://files.catbox.moe/ly97es.jpg',
    'https://files.catbox.moe/qzwau7.jpg',
    'https://files.catbox.moe/j9xoj4.jpg',
    'https://files.catbox.moe/wxt4x6.jpg',
    'https://files.catbox.moe/bdusr8.jpg',
    'https://files.catbox.moe/ib1nil.jpg',
    'https://files.catbox.moe/ct7jf0.jpg',
    'https://files.catbox.moe/gf3tkn.jpg'
]

// ========== رسائل dfail ==========
global.dfailMessages = {
    rowner: '❌ *المطور فقط*',
    owner: '❌ *المطور فقط*',
    mods: '❌ *القادة فقط*',
    premium: '⭐ *بريميوم فقط*',
    group: '👥 *جروبات فقط*',
    private: '📱 *خاص فقط*',
    admin: '👑 *مشرفين فقط*',
    botAdmin: '🤖 *البوت مش أدمن*',
    unreg: '📝 *غير مسجل*',
    restrict: '🚫 *معطل حالياً*'
}

// ========== زخرفة dfail ==========
global.dfailTitle = 'آرثر'
global.dfailDesc = '𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓'
global.dfailUrl = ''

// ========== مراقبة الملف ==========
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})