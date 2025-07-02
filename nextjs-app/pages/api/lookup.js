import { createClient } from '@supabase/supabase-js';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function detectProvider(phone) {
  if (phone.startsWith('+6281')) return 'Telkomsel';
  if (phone.startsWith('+6282')) return 'Indosat';
  if (phone.startsWith('+6285')) return 'XL / Axis';
  return 'Tidak Diketahui';
}

export default async function handler(req, res) {
  const { phone } = req.query;
  if (!phone || !phone.startsWith('+62')) {
    return res.status(400).json({ error: 'Gunakan format +62...' });
  }

  let name = 'Tidak Ditemukan';
  let facebook = false;
  let telegram = false;
  let truecallerName = 'Tidak Ditemukan';
  let truecallerFound = false;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    // Set User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );

    // --- SCRAPE GOOGLE ---
    await page.goto(
      `https://www.google.com/search?q="${encodeURIComponent(phone)}"`,
      { waitUntil: 'networkidle2' }
    );
    // Tunggu judul hasil muncul
    await page.waitForSelector('div.yuRUbf > a > h3', { timeout: 5000 }).catch(() => {});
    // Ambil judul pertama
    name = await page.$eval('div.yuRUbf > a > h3', el => el.innerText)
      .catch(() => 'Tidak Ditemukan');
    const html = await page.content();
    facebook = html.includes('facebook.com/');
    telegram = html.includes('t.me/');

    console.log('Google scrape:', { name, facebook, telegram });

    // --- SCRAPE TRUECALLER ---
    const tcPage = await browser.newPage();
    await tcPage.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );
    const tcUrl = `https://www.truecaller.com/search/id/${phone.replace(/\+/g, '')}`;
    await tcPage.goto(tcUrl, { waitUntil: 'networkidle2' });

    // Tunggu elemen nama profil (selector bisa diubah sesuai inspeksi terbaru)
    await tcPage.waitForSelector('h1 span', { timeout: 5000 }).catch(() => {});
    truecallerName = await tcPage.$eval('h1 span', el => el.innerText)
      .catch(() => 'Tidak Ditemukan');
    truecallerFound = truecallerName !== 'Tidak Ditemukan';

    console.log('Truecaller scrape:', { truecallerName, truecallerFound });

  } catch (err) {
    console.error('Scraping error:', err);
  } finally {
    await browser.close();
  }

  // Simpan ke Supabase
  await supabase.from('logs').insert({
    phone,
    provider: detectProvider(phone),
    name,
    facebook,
    telegram,
    truecaller: truecallerFound,
    truecaller_name: truecallerName
  });

  return res.status(200).json({
    phone,
    provider: detectProvider(phone),
    name,
    facebook,
    telegram,
    truecaller: truecallerFound,
    truecaller_name: truecallerName,
    timestamp: new Date().toISOString()
  });
}
