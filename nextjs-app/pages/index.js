import { useState } from 'react';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [show, setShow] = useState(false);

  const fmt = phone.replace('+', '');

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">🔍 OSINT Nomor Telepon</h1>
        <input
          type="tel"
          placeholder="+6281234567890"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl mb-4"
        />
        <button
          onClick={() => setShow(true)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
        >
          Cari Sekarang
        </button>

        {show && phone.startsWith('+62') && (
          <ul className="mt-6 space-y-2 text-blue-600">
            <li><a href={`https://www.google.com/search?q="\${phone}"`} target="_blank">🔎 Google</a></li>
            <li><a href={`https://www.facebook.com/search/top?q=\${phone}`} target="_blank">📘 Facebook</a></li>
            <li><a href={`https://t.me/\${fmt}`} target="_blank">✈️ Telegram</a></li>
            <li><a href={`https://wa.me/\${fmt}`} target="_blank">💬 WhatsApp</a></li>
            <li><a href={`/api/lookup?phone=\${fmt}`} target="_blank">📞 Truecaller (API)</a></li>
          </ul>
        )}
      </div>
    </main>
  );
}
