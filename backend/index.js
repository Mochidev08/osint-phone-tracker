import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function detectProvider(phone) {
  if (phone.startsWith('+62811') || phone.startsWith('+62812')) return 'Telkomsel';
  if (phone.startsWith('+62813') || phone.startsWith('+62814')) return 'Indosat';
  if (phone.startsWith('+62815') || phone.startsWith('+62816')) return 'XL';
  return 'Tidak Diketahui';
}

async function scrapeTruecaller(phone) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.truecaller.com/search/id/${phone.replace('+', '')}`, {
    waitUntil: 'networkidle2',
  });
  const result = await page.evaluate(() => {
    const name = document.querySelector('.name')?.innerText || 'Tidak Ditemukan';
    const loc = document.querySelector('.location')?.innerText || 'Tidak Ditemukan';
    return { name, location: loc };
  });
  await browser.close();
  return result;
}

app.get('/lookup', async (req, res) => {
  const { phone } = req.query;
  if (!phone || !phone.startsWith('+62')) 
    return res.status(400).json({ error: 'Gunakan format +62...' });

  try {
    const result = await scrapeTruecaller(phone);
    await supabase.from('logs').insert([{
      phone,
      provider: detectProvider(phone),
      name: result.name,
      location: result.location,
      facebook: false,
      telegram: false,
      truecaller: true,
      truecaller_name: result.name,
      created_at: new Date()
    }]);
    return res.json({
      phone,
      provider: detectProvider(phone),
      name: result.name,
      location: result.location,
      facebook: false,
      telegram: false,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Terjadi kesalahan saat scraping data' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server live on port ${port}`));
