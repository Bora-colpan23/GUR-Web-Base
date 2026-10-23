import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// GUR — Vite yapılandırması
// `npm run dev:https` (mode "https"): kendinden imzalı sertifikayla HTTPS. Telefondan yerel ağ adresiyle açılınca tarayıcının şifreleme
// özellikleri (admin/işletme girişi) yalnızca https ya da localhost'ta çalışır; http://192.168... adresinde çalışmaz.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https' ? [basicSsl()] : [])],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
}));