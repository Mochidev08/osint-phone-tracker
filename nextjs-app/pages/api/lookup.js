import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Fungsi deteksi provider berdasarkan awalan nomor
function detectProvider(phone) {
  if (phone.startsWith('+6281')) return 'Telkomsel';
  if (phone.startsWith('+6282')) return 'Indosat';
  if (phone.startsWith('+6285')) return 'Tri / By.U';
  if (phone.startsWith('+6289')) return 'XL / Axis';
  return 'Tidak Diketahui';
}

// Scraping dari Truecaller
async function scrapeTruecaller(phone) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto(`https://www.truecaller.com/search/id/${phone}`, {
    waitUntil: 'networkidle2',
  });

  // Tunggu elemen muncul (maks. 5 detik)
  await page.waitForTimeout(3000);
  const result = await page.evaluate(() => {
    const name = document.querySelector('.name')?.innerText || 'Tidak Ditemukan';
    const location = document.querySelector('.location')?.innerText || 'Tidak Ditemukan';
    return { name, location };
  });

  await browser.close();
  return result;
}

// Scraping Google (placeholder)
async function scrapeGoogle(phone) {
  return { name: "Tidak Ditemukan" };
}

// Placeholder Facebook
async function scrapeFacebook(phone) {
  return { exists: false, name: "Tidak Ditemukan" };
}

// Placeholder Telegram
async function scrapeTelegram(phone) {
  return { exists: false };
}

// API Handler
export default async function handler(req, res) {
  const { phone } = req.query;

  if (!phone || !phone.startsWith('+62')) {
    return res.status(400).json({ error: 'Gunakan format +62...' });
  }

  try {
    // Jalankan scraping
    const [truecallerResult, googleResult, fbResult, tgResult] = await Promise.all([
      scrapeTruecaller(phone),
      scrapeGoogle(phone),
      scrapeFacebook(phone),
      scrapeTelegram(phone),
    ]);

    const provider = detectProvider(phone);
    const name = truecallerResult.name || googleResult.name || fbResult.name || 'Tidak Ditemukan';
    const location = truecallerResult.location || 'Tidak Ditemukan';

    // Simpan ke Supabase
    await supabase.from('logs').insert([
      {
        phone,
        provider,
        name,
        location,
        facebook: fbResult.exists,
        telegram: tgResult.exists,
        truecaller: true,
        truecaller_name: truecallerResult.name || '',
        created_at: new Date(),
      }
    ]);

    // Kirim hasil ke frontend
    res.status(200).json({
      phone,
      provider,
      name,
      location,
      facebook: fbResult.exists,
      telegram: tgResult.exists,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("Error scraping:", err);
    res.status(500).json({ error: 'Terjadi kesalahan saat scraping data' });
  }
}
  
