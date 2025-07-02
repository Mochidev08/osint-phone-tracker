import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Deteksi provider
function detectProvider(phone) {
  if (phone.startsWith("+6281")) return "Telkomsel";
  if (phone.startsWith("+6282")) return "Indosat";
  if (phone.startsWith("+6283")) return "XL";
  if (phone.startsWith("+6285")) return "Tri/Smartfren";
  return "Tidak Diketahui";
}

// Scrape dari Truecaller (tanpa Puppeteer)
async function scrapeTruecaller(phone) {
  try {
    const res = await fetch(`https://www.truecaller.com/search/id/${phone}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    const html = await res.text();

    const nameMatch = html.match(/"name":"(.*?)"/);
    const locationMatch = html.match(/"address":"(.*?)"/);

    const name = nameMatch?.[1] || "Tidak Ditemukan";
    const location = locationMatch?.[1] || "Tidak Ditemukan";

    return { name, location };
  } catch (err) {
    return { name: "Tidak Ditemukan", location: "Tidak Ditemukan" };
  }
}

// Simulasi Facebook & Telegram (dummy)
function searchFacebook(phone) {
  return { exists: false };
}
function searchTelegram(phone) {
  return { exists: false };
}

export default async function handler(req, res) {
  const { phone } = req.query;

  if (!phone || !phone.startsWith("+62")) {
    return res.status(400).json({ error: "Gunakan format +62..." });
  }

  const provider = detectProvider(phone);
  const timestamp = new Date().toISOString();

  const truecallerResult = await scrapeTruecaller(phone);
  const facebookResult = searchFacebook(phone);
  const telegramResult = searchTelegram(phone);

  // Simpan ke Supabase
  const { error } = await supabase.from("logs").insert([
    {
      phone,
      provider,
      name: truecallerResult.name,
      location: truecallerResult.location,
      facebook: facebookResult.exists,
      telegram: telegramResult.exists,
      truecaller: true,
      truecaller_name: truecallerResult.name,
      created_at: timestamp,
    }
  ]);

  if (error) {
    return res.status(500).json({ error: "Gagal menyimpan ke database" });
  }

  return res.status(200).json({
    phone,
    provider,
    name: truecallerResult.name,
    location: truecallerResult.location,
    facebook: facebookResult.exists,
    telegram: telegramResult.exists,
    timestamp
  });
      }
