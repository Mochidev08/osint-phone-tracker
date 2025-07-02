import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function scrapeGoogle(phone) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto(`https://www.google.com/search?q=${phone}`, {
    waitUntil: 'networkidle2',
  });

  const result = await page.evaluate(() => {
    const name = document.querySelector('h3')?.innerText || 'Tidak Ditemukan';
    return { name };
  });

  await browser.close();
  return result;
}

async function scrapeFacebook(phone) {
  return { exists: false, name: 'Tidak Ditemukan' };
}

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

  const result = await page.evaluate(() => {
    const name = document.querySelector('.name')?.innerText || 'Tidak Ditemukan';
    const location = document.querySelector('.location')?.innerText || 'Tidak Ditemukan';
    return { name, location };
  });

  await browser.close();
  return result;
}

function detectProvider(phone) {
  if (phone.startsWith('+6281')) return 'Telkomsel';
  if (phone.startsWith('+6282')) return 'Indosat';
  if (phone.startsWith('+6285')) return 'Tri / By.U';
  if (phone.startsWith('+6289')) return 'XL / Axis';
  return 'Tidak Diketahui';
}

export default async function handler(req, res) {
  const { phone } = req.query;

  if (!phone || !phone.startsWith('+62')) {
    return res.status(400).json({ error: 'Gunakan format +62...' });
  }

  try {
    const googleResult = await scrapeGoogle(phone);
    const fbResult = await scrapeFacebook(phone);
    const truecallerResult = await scrapeTruecaller(phone);

    const { error } = await supabase.from('logs').insert([
      {
        phone,
        provider: detectProvider(phone),
        name: truecallerResult.name || googleResult.name || fbResult.name,
        location: truecallerResult.location || googleResult.location || fbResult.location,
        facebook: fbResult.exists,
        telegram: false,
        truecaller: true,
        truecaller_name: truecallerResult.name || '',
        created_at: new Date(),
      },
    ]);

    if (error) {
      return res.status(500).json({ error: 'Error saving to database' });
    }

    res.status(200).json({
      phone,
      provider: detectProvider(phone),
      name: truecallerResult.name || googleResult.name || fbResult.name,
      location: truecallerResult.location || googleResult.location || fbResult.location,
      facebook: fbResult.exists,
      telegram: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({ error: 'Terjadi kesalahan saat scraping data' });
  }
}
  
