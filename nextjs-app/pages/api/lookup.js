import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Fungsi deteksi provider
function detectProvider(phone) {
  if (phone.startsWith('+62811') || phone.startsWith('+62812')) return 'Telkomsel';
  if (phone.startsWith('+62821') || phone.startsWith('+62822')) return 'Indosat';
  if (phone.startsWith('+62852') || phone.startsWith('+62853')) return 'Telkomsel (Loop)';
  if (phone.startsWith('+62857')) return 'XL Axiata';
  return 'Tidak Diketahui';
}

// Scraping Truecaller
async function scrapeTruecaller(phone) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto(`https://www.truecaller.com/search/id/${phone.replace('+', '')}`, {
    waitUntil: 'networkidle2',
  });

  const result = await page.evaluate(() => {
    const name = document.querySelector('.name')?.innerText || 'Tidak Ditemukan';
    const location = document.querySelector('.location')?.innerText || 'Tidak Ditemukan';
    return { name, location };
  });

  await browser.close();
  return result;
}

// Scraping Google
async function scrapeGoogle(phone) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto(`https://www.google.com/search?q="${phone}"`, {
    waitUntil: 'networkidle2',
  });

  const result = await page.evaluate(() => {
    const name = document.querySelector('h3')?.innerText || 'Tidak Ditemukan';
    return { name };
  });

  await browser.close();
  return result;
}

// Placeholder Facebook
async function scrapeFacebook(phone) {
  return { exists: false }; // Bisa dikembangkan nanti
}

export default async function handler(req, res) {
  const { phone } = req.query;

  if (!phone || !phone.startsWith('+62')) {
    return res.status(400).json({ error: 'Gunakan format +62...' });
  }

  try {
    // Jalankan scraping
    const truecaller = await scrapeTruecaller(phone);
    const google = await scrapeGoogle(phone);
    const facebook = await scrapeFacebook(phone);

    // Simpan ke Supabase
    await supabase.from('logs').insert([
      {
        phone,
        provider: detectProvider(phone),
        name: truecaller.name || google.name,
        location: truecaller.location,
        facebook: facebook.exists,
        telegram: false,
        truecaller: true,
        truecaller_name: truecaller.name,
        created_at: new Date().toISOString(),
      }
    ]);

    res.status(200).json({
      phone,
      provider: detectProvider(phone),
      name: truecaller.name || google.name,
      location: truecaller.location,
      facebook: facebook.exists,
      telegram: false,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat scraping data' });
  }
               }
