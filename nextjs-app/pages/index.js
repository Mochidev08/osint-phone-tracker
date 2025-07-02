import Head from 'next/head';

export default function Home() {
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

        <div id="loading" className="mt-4 hidden text-center text-sm text-gray-500">Sedang mencari data...</div>

        <div id="results" className="mt-6 hidden">
          <h2 className="text-lg font-semibold mb-2">📋 Hasil Pencarian:</h2>
          <ul id="resultList" className="space-y-2 text-sm"></ul>
        </div>
      </div>

      <script>
        async function lookupPhone() {
          const phone = document.getElementById("phoneInput").value.trim();
          if (!phone.startsWith("+62")) {
            alert("Gunakan format internasional, contoh: +6281234567890");
            return;
          }

          document.getElementById("loading").classList.remove("hidden");
          document.getElementById("results").classList.add("hidden");

          try {
            const response = await fetch(`/api/lookup?phone=${encodeURIComponent(phone)}`);
            const data = await response.json();

            // Tampilkan hasil
            const resultList = document.getElementById("resultList");
            resultList.innerHTML = `
              <li>Nama: ${data.name}</li>
              <li>Provider: ${data.provider}</li>
              <li>Lokasi: ${data.location}</li>
              <li>Facebook: ${data.facebook ? 'Ada' : 'Tidak Ada'}</li>
              <li>Telegram: ${data.telegram ? 'Ada' : 'Tidak Ada'}</li>
              <li>Waktu Pencarian: ${new Date(data.timestamp).toLocaleString()}</li>
            `;
            document.getElementById("results").classList.remove("hidden");
          } catch (error) {
            alert("Terjadi kesalahan saat mencari data.");
          } finally {
            document.getElementById("loading").classList.add("hidden");
          }
        }
      </script>
    </div>
  );
}
