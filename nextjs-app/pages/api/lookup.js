import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function scrapeTruecaller(phone) {
  try {
    const res = await fetch(`https://www.truecaller.com/search/id/${phone}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });
    const html = await res.text();

    const nameMatch = html.match(/"name":"(.*?)"/);
    const locationMatch = html.match(/"address":"(.*?)"/);

    const name = nameMatch ? nameMatch[1] : "Tidak Ditemukan";
    const location = locationMatch ? locationMatch[1] : "Tidak Ditemukan";

    return { name, location };
  } catch (error) {
    return { name: "Tidak Ditemukan", location: "Tidak Ditemukan" };
  }
}

function detectProvider(phone) {
  if (phone.startsWith("+62811") || phone.startsWith("+62812")) return "Telkomsel";
  if (phone.startsWith("+62813") || phone.startsWith("+62822")) return "XL";
  if (phone.startsWith("+62852") || phone.startsWith("+62853")) return "Telkomsel (Kartu As)";
  if (phone.startsWith("+62821") || phone.startsWith("+62823")) return "Indosat";
  return "Tidak Diketahui";
}

export default async function handler(req, res) {
  const { phone } = req.query;

  if (!phone || !phone.startsWith("+62")) {
    return res.status(400).json({ error: "Gunakan format +62..." });
  }

  try {
    const result = await scrapeTruecaller(phone);
    const provider = detectProvider(phone);

    const { error } = await supabase.from('logs').insert([{
      phone,
      provider,
      name: result.name,
      location: result.location,
      facebook: false,
      telegram: false,
      truecaller: true,
      truecaller_name: result.name,
      created_at: new Date(),
    }]);

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Gagal menyimpan ke database" });
    }

    res.status(200).json({
      phone,
      provider,
      name: result.name,
      location: result.location,
      facebook: false,
      telegram: false,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
      }
