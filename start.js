import chalk from 'chalk';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENTRY_FILE = path.join(__dirname, 'index.js');
const RESTART_DELAY = 3000;

const gold = chalk.hex('#D4AF37');
const red = chalk.hex('#C62828');
const white = chalk.hex('#F5F0E6');
const gray = chalk.hex('#888888');
const green = chalk.hex('#42D392');

let child = null;
let restartTimer = null;
let shuttingDown = false;
let launching = false;

function protectSessions() {
  const sessionDirs = ['ArthurSession', 'ArthurSubBot', 'BackupSession', 'session', 'sessions', 'ملف_الاتصال'];
  for (const name of sessionDirs) {
    const target = path.join(__dirname, name);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      console.log(green(`🛡️ [حماية] تم الحفاظ على مجلد الجلسة: ${name}`));
    }
  }
}

function clearTemporaryFiles() {
  // حذف الملفات المؤقتة فقط، مع الحفاظ على المجلدات والملفات الدائمة والجلسات.
  const tempDirs = ['tmp', 'temp'];
  for (const name of tempDirs) {
    const dir = path.join(__dirname, name);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      try {
        fs.unlinkSync(path.join(dir, entry.name));
      } catch (error) {
        console.log(chalk.yellow(`⚠️ تعذر حذف ملف مؤقت ${entry.name}: ${error.message}`));
      }
    }
  }
}

function showBanner() {
  const width = 58;
  const rule = '═'.repeat(width);
  console.log(gold(`╔${rule}╗`));
  console.log(gold('║') + red('                    ♛  ⚡  ♛') + '                     ' + gold('║'));
  console.log(gold('║') + chalk.bold.hex('#D4AF37')('                 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓') + '                 ' + gold('║'));
  console.log(gold(`╠${rule}╣`));
  console.log(gold('║') + white('              ◈  ARTHUR CORE ENGINE  ◈') + '              ' + gold('║'));
  console.log(gold('║') + white('              ◇  SESSION PROTECTION  ◇') + '              ' + gold('║'));
  console.log(gold('║') + white('              ⬡  AUTO RESTART SYSTEM  ⬡') + '              ' + gold('║'));
  console.log(gold(`╚${rule}╝`));
  console.log('');
}

function progressBar(percent, size = 24) {
  const filled = Math.round((percent / 100) * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function showLoading(label) {
  for (let percent = 0; percent <= 100; percent += 20) {
    process.stdout.write(`\r${red('◆')} ${white(label)} ${gold(`[${progressBar(percent)}]`)} ${gold(`${percent}%`)}`);
    await sleep(70);
  }
  console.log(` ${green('✓ COMPLETE')}`);
}

async function launchBot() {
  if (shuttingDown || launching) return;
  launching = true;

  if (!fs.existsSync(ENTRY_FILE)) {
    console.error(red('❌ ملف index.js غير موجود؛ تعذر تشغيل البوت.'));
    process.exitCode = 1;
    launching = false;
    return;
  }

  console.clear();
  protectSessions();
  clearTemporaryFiles();
  showBanner();
  await showLoading('INITIALIZING ARTHUR KERNEL');
  await showLoading('CHECKING BOT MODULES');
  await showLoading('STARTING ARTHUR ENGINE');

  if (shuttingDown) {
    launching = false;
    return;
  }

  console.log('');
  console.log(green('✓ ARTHUR BOT IS STARTING'));
  console.log(gray('ENTRY: index.js'));
  console.log(gray('DATABASE: handled by the existing project code'));
  console.log('');

  try {
    child = spawn(process.execPath, [ENTRY_FILE, ...process.argv.slice(2)], {
      cwd: __dirname,
      stdio: 'inherit',
      env: process.env
    });

    child.once('error', (error) => {
      console.error(red(`❌ تعذر تشغيل index.js: ${error.message}`));
    });

    child.once('close', (code, signal) => {
      child = null;
      if (shuttingDown) return;
      console.log('');
      console.log(red(`⚠️ توقف ARTHUR BOT (code: ${code ?? 'null'}, signal: ${signal ?? 'none'})`));
      console.log(white(`سيتم إعادة التشغيل بعد ${RESTART_DELAY / 1000} ثوانٍ...`));
      restartTimer = setTimeout(() => {
        restartTimer = null;
        launchBot().catch((error) => console.error(red(error.stack || error.message)));
      }, RESTART_DELAY);
    });
  } catch (error) {
    console.error(red(`❌ خطأ أثناء بدء البوت: ${error.message}`));
    restartTimer = setTimeout(() => {
      restartTimer = null;
      launchBot().catch((err) => console.error(red(err.stack || err.message)));
    }, RESTART_DELAY);
  } finally {
    launching = false;
  }
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${gold(`إيقاف المشغل بأمان (${signal})...`)}`);
  if (restartTimer) clearTimeout(restartTimer);
  if (child && !child.killed) child.kill('SIGTERM');
  else process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  console.error(red(`Arthur Start Error: ${error.stack || error.message}`));
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error(red(`Arthur Start Rejection: ${reason?.stack || reason}`));
});

launchBot().catch((error) => {
  launching = false;
  console.error(red(`فشل تشغيل المشغل: ${error.stack || error.message}`));
  process.exitCode = 1;
});
