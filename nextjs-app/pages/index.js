import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const lookupPhone = async () => {
    const phone = document.getElementById("phoneInput").value.trim();
    if (!phone.startsWith("+62")) {
      alert("Gunakan format internasional, contoh: +6281234567890");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch(`/api/lookup?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setResults(data);
    } catch (error) {
      alert("Terjadi kesalahan saat mencari data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 text-gray-800 flex items-center justify-center min-h-screen">
      <Head>
        <title>OSINT Nomor Telepon</title>
        <link rel="icon" href="/favicon.ico" />
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">🔍 OSINT Nomor Telepon</h1>
        <input id="phoneInput" type="tel" placeholder="+6281234567890" className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300" />
        <button onClick={lookupPhone} className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition">Cari Sekarang</button>

        {loading && <div className="mt-4 text-center text-sm text-gray-500">🔄 Sedang mencari data...</div>}

        {results && (
          <div id="results" className="mt-6">
            <h2 className="text-lg font-semibold mb-2">📋 Hasil Pencarian:</h2>
            <ul id="resultList" className="space-y-2 text-sm">
              <li>📞 Nomor: {results.phone}</li>
              <li>👤 Nama: {results.name || 'Tidak ditemukan'}</li>
              <li>📡 Provider: {results.provider || 'Tidak diketahui'}</li>
              <li>📍 Lokasi: {results.location || 'Tidak ditemukan'}</li>
              <li>📘 Facebook: {results.facebook ? 'Ada' : 'Tidak Ada'}</li>
              <li>✈️ Telegram: {results.telegram ? 'Ada' : 'Tidak Ada'}</li>
              <li>🕒 Waktu Pencarian: {results.timestamp ? new Date(results.timestamp).toLocaleString() : 'Tidak tersedia'}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
    }
          
