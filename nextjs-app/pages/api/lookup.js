
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fungsi untuk scraping Google
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

// Fungsi untuk scraping Facebook
async function scrapeFacebook(phone) {
  // Implementasi scraping Facebook
  return { exists: false, name: 'Tidak Ditemukan' }; // Placeholder
}

// Fungsi untuk scraping Truecaller
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

// Fungsi handler untuk API
export default async function handler(req, res) {
  const { phone } = req.query;

  // Scraping dari Google, Facebook, dan Truecaller
  const googleResult = await scrapeGoogle(phone);
  const fbResult = await scrapeFacebook(phone);
  const truecallerResult = await scrapeTruecaller(phone);

  // Simpan ke database
  const { data, error } = await supabase
    .from('logs')
    .insert([
      {
        phone,
        provider: detectProvider(phone),
        name: truecallerResult.name || googleResult.name || fbResult.name,
        location: truecallerResult.location || googleResult.location || fbResult.location,
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
    telegram: false, // Update sesuai dengan logika yang ada
  });
    }
                                 
