# OSINT Phone Tracker

## Struktur proyek

- `static-html/`  
  HTML statis dengan TailwindCSS dan file vercel.json untuk deployment.

- `nextjs-app/`  
  Aplikasi Next.js dengan TailwindCSS dan API backend simulasi lookup.

## Cara penggunaan

### Static HTML

1. Buka folder `static-html/`  
2. Buka file `index.html` di browser langsung, atau deploy ke Vercel dengan root directory `static-html/`.  
3. Pastikan ada file `vercel.json` untuk redirect agar tidak error 404.

### Next.js App

1. Buka folder `nextjs-app/`  
2. Jalankan perintah berikut di terminal:
```
npm install
npm run dev
```
3. Akses http://localhost:3000

### Deploy ke Vercel

- Buat dua project Vercel:  
  - Project 1: gunakan root directory `static-html/`, framework preset `Other`.  
  - Project 2: gunakan root directory `nextjs-app/`, framework preset `Next.js`.

- Push ke GitHub, Vercel akan deploy otomatis.

---

Terima kasih telah menggunakan proyek ini!
