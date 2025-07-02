// pages/api/lookup.js

import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
delete process.env.SUPABASE_URL; // Force error if missing
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ENV ERROR: SUPABASE_URL atau SUPABASE_ANON_KEY tidak ditemukan");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function detectProvider(phone) {
  if (phone.startsWith('+62811') || phone.startsWith('+62812')) return 'Telkomsel';
  if (phone.startsWith('+62822')) return 'XL';
  if (phone.startsWith('+62855')) return 'Indosat';
  return 'Tidak diketahui';
}

// Fungsi scraping Google
async function scrapeGoogle(phone) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(phone)}`, {
    waitUntil: 'domcontentloaded',
  });

  const result = await page.evaluate(() => {
    const name = document.querySelector('h3')?.innerText || 'Tidak Ditemukan';
    return { name };
  });

  await browser.close();
  return result;
}

// Fungsi scraping Facebook (placeholder)
async function scrapeFacebook(phone) {
  return { exists: false, name: null };
}

// Fungsi scraping Truecaller
async function scrapeTruecaller(phone) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.goto(`https://www.truecaller.com/search/id/${phone.replace('+', '')}`, {
    waitUntil: 'domcontentloaded',
  });

  const result = await page.evaluate(() => {
    const name = document.querySelector('.name')?.innerText || 'Tidak Ditemukan';
    const location = document.querySelector('.location')?.innerText || 'Tidak Ditemukan';
    return { name, location };
  });

  await browser.close();
  return result;
}

// Handler utama API
export default async function handler(req, res) {
  const { phone } = req.query;
  if (!phone || !phone.replace(/\s/g, '').startsWith('+62')) {
    return res.status(400).json({ error: 'Gunakan format +62...' });
  }

  try {
    const googleResult = await scrapeGoogle(phone);
    const fbResult = await scrapeFacebook(phone);
    const truecallerResult = await scrapeTruecaller(phone);

    const resultData = {
      phone,
      provider: detectProvider(phone),
      name: truecallerResult.name || googleResult.name || fbResult.name,
      location: truecallerResult.location || null,
      facebook: fbResult.exists,
      telegram: false,
      truecaller: true,
      truecaller_name: truecallerResult.name,
      timestamp: new Date().toISOString(),
    };

    await supabase.from('logs').insert([
      {
        phone,
        provider: resultData.provider,
        name: resultData.name,
        location: resultData.location,
        facebook: resultData.facebook,
        telegram: resultData.telegram,
        truecaller: true,
        truecaller_name: resultData.truecaller_name,
        created_at: new Date(),
      },
    ]);

    res.status(200).json(resultData);
  } catch (e) {
    console.error('❌ ERROR:', e);
    res.status(500).json({ error: 'Terjadi kesalahan saat mencari data.' });
  }
          }
