import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams, Link, Navigate, ScrollRestoration } from 'react-router-dom';
import {
  GurLogo, Icon, Img,
  RestRegStep1, RestRegStep2, RestRegStep3, RestaurantDashboard,
} from './GurApp.jsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RESTAURANTS, CATEGORIES } from '../data/restaurants.js';
import { placesUygula } from '../data/placesBirlestir.js';
const HAVUZ_GUNCEL = placesUygula(RESTAURANTS);   // Google Places önbelleği varsa birleştirilmiş havuz (scripts/places-sync.mjs)
import { koordinat, bulunamadi, coz, topluCoz, yaklasikMi, HASSASIYET_METNI } from './webGeo.js';
import { directionsUrl, defaultMapProvider } from '../../shared/deeplink.js';
import {
  useDepo, useIsletme, usePlatform, useGelir, yaz, favoriCevir, favoriEkle, gecildi, talepEkle, hepsiniSil,
  yakinaGore, mesafeMetni, yonetimUygula, desteKur, kampanyaOlay, kotaOku, kotaKullan, kotaBonusVer, ILCELER, cihazKonumu, ilceSec, izle, sahiplikUygula, isletmeCikis,
} from './webStore.js';

// GUR Web — mobil uygulamanın (mobile/) son sürümünün web karşılığı: açılış, rıza, giriş/kayıt, konum, keşfet, kaydır
// (sağa kaydet · sola geç · yukarı detaylar), favoriler, detay (yol tarifi, masa ayırtma kapısı), profil.
// Veri: shared/ + src/data/ (mobil ve sunucuyla ortak). Her ekran gerçek bir adrese sahip.

// GUR'un üç temel rengi (logodaki G · U · R): sarı-turuncu, turuncu, kırmızı.
export const C3 = { g: '#FFA500', u: '#FF6600', r: '#FF0000' };
// Dolgu düğmeleri: yazı okunur kalsın diye üç rengin koyulaştırılmış tonları; saf renkler çizgi, ikon, rozet ve zeminde kullanılır.
export const GRAD = 'linear-gradient(135deg, #FF8F00 0%, #FF6600 48%, #F51C00 100%)';
// Kurumsal kimlik: GUR metin yazı tipi Outfit (logo Poppins). Yedek olarak sistem yazı tipi.
export const F = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
import { Ctx, useApp } from './webCtx.js';
import { YorumBolumu, SponsorluSerit, GELIR_CSS } from './GelirWeb.jsx';
import { KesfetApp, ProfilApp, ANA_CSS } from './GurAnaEkran.jsx';
import { YUMUSAK_CSS } from './yumusak.js';
import { KotaPaneli, OdulluReklam } from './GurOdul.jsx';
import { quotaState } from '../../shared/deck.js';
import { useMobil, MOBIL_CSS, MobilKarsilama, MobilKesfet, MobilFavoriler, MobilProfil, MobilDetay } from './GurMobilWeb.jsx';
export { useApp };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes badgeMarquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  html, body { background:#fafaf8 !important; }
  .gw { font-family:${F}; color:#2D2419; min-height:100vh; background:#fafaf8; }
  .gw * { box-sizing:border-box; font-style:normal; }
  .gw a { text-decoration:none; color:inherit; }
  .gw-wrap { max-width:1240px; margin:0 auto; padding:0 28px; }
  .gw-nav { position:sticky; top:0; z-index:50; background:rgba(255,255,255,.94); backdrop-filter:blur(10px); border-bottom:1px solid rgba(0,0,0,.06); }
  .gw-nav-in { display:flex; align-items:center; gap:28px; height:70px; }
  .gw-link { padding:9px 16px; border-radius:999px; font-weight:600; font-size:14px; color:#6B5D4C; display:inline-flex; align-items:center; gap:8px; }
  .gw-link:hover { background:#FFF3EA; }
  .gw-link.active { background:#FFF3EA; color:#FF6600; }
  .gw-grid { display:grid; gap:22px; grid-template-columns:repeat(auto-fill,minmax(270px,1fr)); }
  .gw-cats { display:grid; gap:18px; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); }
  .gw-hover { transition:transform .18s, box-shadow .18s; cursor:pointer; }
  .gw-hover:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,.14) !important; }
  .gw-split { display:grid; grid-template-columns:1fr 1fr; min-height:100vh; }
  .gw-detail { display:grid; grid-template-columns:1.25fr 1fr; gap:40px; align-items:start; }
  .gw-profile { display:grid; grid-template-columns:340px 1fr; gap:40px; align-items:start; }
  .gw-stage { height:calc(100vh - 70px); display:flex; justify-content:center; padding:22px 20px; background:radial-gradient(60% 60% at 12% 0%, rgba(255,138,0,.20), transparent 70%), radial-gradient(55% 55% at 92% 8%, rgba(255,59,48,.12), transparent 70%), #fff; }
  .gw-stage > div { width:100%; max-width:520px; height:100%; position:relative; border-radius:32px; overflow:hidden; border:1px solid rgba(0,0,0,.1); box-shadow:0 12px 40px rgba(0,0,0,.08); }
  .gw-form { max-width:680px; margin:32px auto; height:calc(100vh - 64px); min-height:620px; background:#fff; border-radius:28px; overflow:hidden; border:1px solid rgba(0,0,0,.1); box-shadow:0 12px 40px rgba(0,0,0,.05); position:relative; }
  .gw-dash { max-width:1100px; margin:0 auto; height:calc(100vh - 56px); height:calc(100dvh - 56px); position:relative; box-shadow:0 0 60px rgba(0,0,0,.25); }
  .gw input:focus, .gw select:focus { outline:3px solid rgba(255,102,0,.35); }
  ::-webkit-scrollbar { width:8px; height:8px; } ::-webkit-scrollbar-thumb { background:rgba(0,0,0,.18); border-radius:8px; }
  html { -webkit-text-size-adjust:100%; text-size-adjust:100%; }
  .gw-nav { -webkit-backdrop-filter:blur(10px); }
  .gw-mtop, .gw-bottom { display:none; }
  @media (max-width: 900px) {
    .gw-split, .gw-detail, .gw-profile { grid-template-columns:1fr; }
    .gw-wrap { padding:0 16px; } .gw-nav-in { gap:8px; } .gw-hide-sm { display:none !important; }
    .gw-form { margin:0; height:100vh; height:100dvh; border-radius:0; } .gw-split > .gw-brand { min-height:38vh; }
  }
  /* Telefon (Safari/Chrome mobil): mobil uygulama görünümü — alt bar, ortada logo, 2'li kategori kartları, tek sütun liste */
  @media (max-width: 700px) {
    html, body { overscroll-behavior-y:none; -webkit-tap-highlight-color:transparent; }
    .gw { -webkit-touch-callout:none; }
    .gw input:not([type=checkbox]), .gw select, .gw textarea { font-size:16px !important; } /* iOS Safari odaklanınca yakınlaştırmasın */
    .gw button, .gw a, .gw [role=button] { touch-action:manipulation; }
    .gw-nav { display:none; }
    .gw-mtop { display:flex; align-items:center; justify-content:center; position:relative; padding:calc(14px + env(safe-area-inset-top)) 16px 4px; }
    .gw-mtop .gw-avatar { position:absolute; right:16px; bottom:2px; }
    .gw-bottom { display:flex; position:fixed; left:12px; right:12px; bottom:calc(12px + env(safe-area-inset-bottom)); z-index:60; align-items:center; justify-content:space-around; background:#fff; border-radius:26px; padding:10px 8px; box-shadow:0 6px 28px rgba(0,0,0,.16); }
    .gw-bottom a.gw-tab { display:flex; flex-direction:column; align-items:center; gap:3px; padding:4px 18px; font-size:10px; font-weight:700; color:#FF6600; opacity:.45; }
    .gw-bottom a.gw-tab.active { opacity:1; }
    .gw-page { padding-bottom:calc(104px + env(safe-area-inset-bottom)); }
    .gw-split { min-height:100vh; min-height:100dvh; grid-template-rows:auto 1fr; }
    .gw-split > .gw-brand { min-height:34vh; padding-top:calc(32px + env(safe-area-inset-top)) !important; }
    .gw-split > .gw-pane { border-radius:40px 40px 0 0; padding:44px 24px calc(40px + env(safe-area-inset-bottom)) !important; margin-top:-30px; position:relative; z-index:2; }
    .gw-stage { height:calc(100vh - 92px - env(safe-area-inset-bottom)); height:calc(100dvh - 92px - env(safe-area-inset-bottom)); padding:env(safe-area-inset-top) 0 0; background:#0a0a12; }
    .gw-stage > div { max-width:none; border-radius:0; border:none; box-shadow:none; }
    .gw-auth-body { padding-top:20px; } .gw-auth-card { padding:24px 20px; border-radius:24px; }
    .gw-afield input, .gw-afield select { font-size:16px !important; }
    .gw-banner { height:170px !important; border-radius:24px !important; margin-bottom:18px !important; }
    .gw-banner-in { padding:0 18px !important; }
    .gw-banner h1 { font-size:20px !important; margin-bottom:2px !important; }
    .gw-banner p { font-size:12px !important; margin-bottom:12px !important; }
    .gw-cats { grid-template-columns:1fr 1fr; gap:12px; } .gw-cats > a { height:120px !important; }
    .gw-grid { grid-template-columns:1fr; gap:16px; }
    .gw-photo { height:260px !important; border-radius:22px !important; }
    .gw-h1 { font-size:28px !important; }
    .gw-detail { gap:22px; }
    .gw-form { padding-top:env(safe-area-inset-top); }
    .gw-dash { box-shadow:none; }
  }

  /* ───────── Ana sayfa: tgoyemek tarzı düzen, GUR renkleri ───────── */
  .gw-tgo-hero { padding:72px 0 56px; background:radial-gradient(60% 90% at 12% 0%, rgba(255,138,0,.20), transparent 70%), radial-gradient(55% 80% at 92% 8%, rgba(255,59,48,.12), transparent 70%), #fff; }
  .gw-tgo-h1 { font-size:clamp(30px,5.2vw,58px); margin:0 auto 34px; max-width:980px; font-weight:700; }
  .gw-tgo-search { display:flex; align-items:center; gap:12px; max-width:640px; margin:0 auto 26px; background:#fff; border-radius:999px; padding:8px 8px 8px 22px; box-shadow:0 4px 30px rgba(0,0,0,.08); border:1px solid rgba(0,0,0,.06); }
  .gw-tgo-search input { flex:1; min-width:0; border:none !important; outline:none; box-shadow:none !important; font-size:15px; background:transparent; padding:10px 0; }
  .gw-tgo-districts { display:flex; gap:10px; overflow-x:auto; justify-content:center; padding:4px 2px 8px; scrollbar-width:none; }
  .gw-tgo-districts::-webkit-scrollbar { display:none; }
  .gw-tgo-districts button { display:inline-flex; align-items:center; gap:6px; border:none; background:transparent; font-weight:600; font-size:14px; padding:8px 12px; border-radius:999px; cursor:pointer; white-space:nowrap; color:#2A140C; }
  .gw-tgo-districts button:hover { background:rgba(255,102,0,.1); }
  .gw-tgo-features { display:grid; grid-template-columns:1.15fr 1fr 1fr; border-top:1px solid rgba(0,0,0,.12); border-left:1px solid rgba(0,0,0,.12); }
  .gw-tgo-features > * { border-right:1px solid rgba(0,0,0,.12); border-bottom:1px solid rgba(0,0,0,.12); padding:34px 30px; }
  .gw-tgo-intro { grid-row:span 2; background:linear-gradient(180deg, rgba(255,138,0,.10), rgba(255,255,255,0)); }
  .gw-tgo-intro h2 { font-size:clamp(26px,3vw,36px); margin:0 0 12px; }
  .gw-tgo-intro p { color:#57534E; margin:0; max-width:360px; }
  .gw-tgo-ico { width:56px; height:56px; border-radius:18px; background:rgba(255,102,0,.10); display:inline-flex; align-items:center; justify-content:center; margin-bottom:18px; }
  .gw-tgo-cell h3 { font-size:21px; margin:0 0 8px; }
  .gw-tgo-cell p { color:#57534E; margin:0; font-size:14.5px; }
  .gw-tgo-facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); border-top:1px solid rgba(0,0,0,.12); border-left:1px solid rgba(0,0,0,.12); }
  .gw-tgo-facts > div { border-right:1px solid rgba(0,0,0,.12); border-bottom:1px solid rgba(0,0,0,.12); padding:16px 18px; display:flex; flex-direction:column; gap:4px; }
  .gw-tgo-facts span { font-size:12px; color:#8f8a85; font-weight:600; }
  .gw-tgo-facts b { font-size:17px; font-weight:700; color:#2A140C; }
  /* Giriş/kayıt: pastel zemin + ortada çizgili kart */
  .gw-auth-page { min-height:100vh; min-height:100dvh; background:radial-gradient(60% 50% at 12% 0%, rgba(255,138,0,.20), transparent 70%), radial-gradient(55% 45% at 92% 6%, rgba(255,59,48,.12), transparent 70%), #fff; display:flex; flex-direction:column; }
  .gw-auth-top { display:flex; align-items:center; justify-content:space-between; padding:calc(18px + env(safe-area-inset-top)) 28px 0; max-width:1240px; width:100%; margin:0 auto; }
  .gw-auth-back { border:1.5px solid #2A140C; background:#fff; border-radius:999px; padding:8px 18px; font-weight:700; font-size:14px; cursor:pointer; width:84px; white-space:nowrap; }
  .gw-auth-body { flex:1; width:100%; max-width:520px; margin:0 auto; padding:36px 20px calc(48px + env(safe-area-inset-bottom)); text-align:center; }
  .gw-auth-card { background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:28px; padding:30px 28px; text-align:left; box-shadow:0 12px 40px rgba(0,0,0,.05); }
  .gw-afield { display:flex; flex-direction:column; gap:7px; font-size:14px; font-weight:700; color:#2A140C; margin-bottom:18px; }
  .gw-afield input, .gw-afield select { border:1.5px solid rgba(0,0,0,.14) !important; border-radius:14px; padding:14px 16px; font-size:15px; font-weight:400; background:#fff; color:#2A140C; width:100%; box-shadow:none; }
  .gw-afield input:focus, .gw-afield select:focus { border-color:#FF6600 !important; box-shadow:0 0 0 4px rgba(255,102,0,.18) !important; }
  .gw-acheck { display:flex; align-items:center; gap:12px; margin:4px 0 22px; font-size:14px; color:#57534E; cursor:pointer; }
  .gw-acheck input { width:22px; height:22px; accent-color:#FF6600; flex-shrink:0; }
  .gw-tgo-bands { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .gw-tgo-band { border-radius:28px; padding:36px; display:flex; flex-direction:column; gap:12px; }
  .gw-tgo-band h2 { margin:0; font-size:28px; }
  .gw-tgo-band p { margin:0 0 10px; opacity:.88; max-width:420px; }
  @media (max-width: 900px) {
    .gw-tgo-features { grid-template-columns:1fr 1fr; }
    .gw-tgo-intro { grid-column:1 / -1; grid-row:auto; }
    .gw-tgo-bands { grid-template-columns:1fr; }
  }
  @media (max-width: 560px) {
    .gw-tgo-hero { padding:40px 0 34px; }
    .gw-tgo-features { grid-template-columns:1fr; border-left:none; } .gw-tgo-features > * { border-right:none; padding:26px 4px; }
    .gw-tgo-districts { justify-content:flex-start; }
    .gw-tgo-band { padding:28px 24px; }
  }

  /* ───────── Mobil uygulamanın son sürümünden gelen ekranlar ───────── */
  .gw-yollar { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; max-width:920px; margin:0 auto; }
  @media (max-width:700px) { .gw-yollar { grid-template-columns:1fr; } }
  /* Açılış: marka anı; süreler --k katsayısıyla tek yerden ölçeklenir */
  @keyframes acLogo { from { opacity:0; transform:scale(.86); } to { opacity:1; transform:scale(1); } }
  @keyframes acLine { from { transform:scaleX(0); } to { transform:scaleX(1); } }
  @keyframes acFade { from { opacity:0; } to { opacity:1; } }
  .gw-acilis { position:fixed; inset:0; z-index:1000; background:#FDFBF7; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; }
  .gw-acilis-logo { animation:acLogo calc(.6s * var(--k)) var(--spring) both; }
  .gw-acilis-line { height:3px; width:min(34vw,150px); margin-top:18px; background:#FF6600; border-radius:2px; transform-origin:left; animation:acLine calc(.9s * var(--k)) var(--ease-out) calc(.26s * var(--k)) both; }
  .gw-acilis-sub { margin:18px 0 0; font-size:12px; font-weight:700; letter-spacing:4.5px; color:#6F6459; animation:acFade calc(.48s * var(--k)) ease calc(.43s * var(--k)) both; }
  .gw-acilis-city { position:absolute; bottom:calc(46px + env(safe-area-inset-bottom)); margin:0; font-size:12.5px; color:#6F6459; animation:acFade calc(.48s * var(--k)) ease calc(.43s * var(--k)) both; }
  /* Modallar (rıza, onay, görsel) */
  .gw-modal { position:fixed; inset:0; z-index:900; display:flex; align-items:flex-end; justify-content:center; padding:0; }
  .gw-modal-card { background:#fff; width:100%; max-width:480px; border-radius:28px 28px 0 0; padding:26px 24px calc(30px + env(safe-area-inset-bottom)); }
  @media (min-width:700px) { .gw-modal { align-items:center; } .gw-modal-card { border-radius:28px; padding-bottom:30px; } }
  .gw-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:999px; font-size:12px; font-weight:700; }
  .gw-badge.dark { background:#2A140C; color:#FFD27A; } .gw-badge.soft { background:rgba(255,102,0,.10); color:#A84D09; }
  .gw-heartbtn { position:absolute; top:8px; right:8px; width:44px; height:44px; border-radius:50%; border:none; background:rgba(255,255,255,.92); cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .gw-konumcipi { display:inline-flex; align-items:center; gap:7px; padding:9px 16px; border-radius:999px; background:#fff; border:1px solid rgba(0,0,0,.12); font-weight:700; font-size:14px; min-height:44px; }
  .gw-konumcipi span { color:#B4530A; font-weight:700; margin-left:4px; }
  .gw-chiprow { display:flex; gap:8px; overflow-x:auto; padding:2px 2px 10px; scrollbar-width:none; }
  .gw-chiprow::-webkit-scrollbar { display:none; }
  .gw-kchip { display:inline-flex; align-items:center; min-height:44px; padding:0 18px; border-radius:999px; background:#fff; border:1px solid #E3DCD2; font-weight:600; font-size:14px; color:#4A443E; cursor:pointer; white-space:nowrap; font-family:inherit; }
  .gw-kchip.on { background:#FF6600; border-color:#FF6600; color:#fff; font-weight:700; }
  .gw-kchip.static { cursor:default; min-height:36px; background:#F6F3EE; border-color:transparent; }
  .gw-ilce { min-height:44px; padding:0 18px; border-radius:999px; background:#fff; border:1px solid #E3DCD2; font-weight:600; font-size:14.5px; cursor:pointer; font-family:inherit; }
  .gw-ilce:hover { border-color:#FF6600; }
  /* Kaydır */
  .gw-deckpage { height:calc(100vh - 70px); height:calc(100dvh - 70px); display:flex; flex-direction:column; align-items:center; padding:18px 20px 16px; background:radial-gradient(60% 50% at 12% 0%, rgba(255,138,0,.16), transparent 70%), radial-gradient(55% 45% at 92% 6%, rgba(255,59,48,.10), transparent 70%), #fff; position:relative; }
  .gw-deckhead { text-align:center; margin-bottom:12px; } .gw-deckhead h1 { font-size:clamp(24px,3.2vw,32px); margin:0; } .gw-deckhead p { margin:4px 0 0; color:#6F6459; font-size:14px; }
  .gw-deckarea { position:relative; flex:1; width:100%; max-width:460px; min-height:360px; display:flex; }
  .gw-deckkart { position:absolute; inset:0; border-radius:28px; overflow:hidden; background:#e8e0d8; box-shadow:0 14px 44px rgba(0,0,0,.22); user-select:none; touch-action:none; will-change:transform; }
  .gw-damga { position:absolute; top:46px; padding:6px 16px; border:3.5px solid #fff; color:#fff; border-radius:12px; font-weight:800; letter-spacing:1.5px; font-size:20px; background:rgba(0,0,0,.35); pointer-events:none; }
  .gw-damga.left { left:18px; transform:rotate(-12deg); } .gw-damga.right { right:18px; transform:rotate(12deg); } .gw-damga.center { left:50%; transform:translateX(-50%); }
  .gw-deckbtns { display:flex; align-items:center; justify-content:center; gap:18px; padding:16px 0 4px; }
  .gw-yuvarlak { width:56px; height:56px; border-radius:50%; background:#fff; border:1px solid rgba(45,36,25,.1); box-shadow:0 6px 20px rgba(0,0,0,.12); cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .gw-yuvarlak.buyuk { width:68px; height:68px; }
  .gw-toast { position:absolute; left:50%; top:78px; transform:translateX(-50%); margin:0; background:#2A140C; color:#fff; border-radius:999px; padding:0 18px; font-size:14px; font-weight:600; line-height:38px; white-space:nowrap; pointer-events:none; opacity:0; transition:opacity .2s; }
  .gw-toast:not(:empty) { opacity:1; }
  @media (max-width:700px) {
    .gw-deckpage { height:calc(100vh - 92px - env(safe-area-inset-bottom)); height:calc(100dvh - 92px - env(safe-area-inset-bottom)); padding:calc(14px + env(safe-area-inset-top)) 12px 6px; }
    .gw-deckarea { max-width:none; }
  }

  /* ───────── Doyurucu: aktif restoranlar + harita (Booking tarzı) ───────── */
  .gw-dbar { height:56px; display:flex; align-items:center; gap:18px; padding:0 20px; background:#2A140C; color:#fff; position:sticky; top:0; z-index:40; }
  .gw-dlink { display:inline-flex; align-items:center; gap:7px; padding:8px 14px; border-radius:999px; font-size:14px; font-weight:600; color:rgba(255,255,255,.75); white-space:nowrap; }
  .gw-dlink:hover { background:rgba(255,255,255,.1); color:#fff; } .gw-dlink.active { background:rgba(255,102,0,.25); color:#FFB27A; }
  .gw-bk { height:100vh; height:100dvh; display:flex; flex-direction:column; background:#f5f5f7; }
  .gw-bk.musteri { height:calc(100vh - 70px); height:calc(100dvh - 70px); }
  @media (max-width:700px) { .gw-bk.musteri { height:calc(100vh - 92px - env(safe-area-inset-bottom)); height:calc(100dvh - 92px - env(safe-area-inset-bottom)); padding-top:env(safe-area-inset-top); } .gw-bk.musteri .gw-bk-not { display:none; } }
  .gw-bk-tools { display:flex; gap:10px; flex-wrap:wrap; padding:12px 20px; background:#fff; border-bottom:1px solid rgba(0,0,0,.08); align-items:center; }
  .gw-bk-search { flex:1 1 260px; display:flex; align-items:center; gap:10px; border:1.5px solid rgba(0,0,0,.18); border-radius:999px; padding:0 16px; background:#fff; min-height:44px; }
  .gw-bk-search input { flex:1; border:none !important; outline:none; box-shadow:none !important; font-size:15px; background:transparent; min-width:0; }
  .gw-bk-tools select { border:1.5px solid rgba(0,0,0,.18); border-radius:999px; min-height:44px; padding:0 14px; background:#fff; font-size:14px; width:auto !important; }
  .gw-bk-stat { padding:8px 20px; font-size:13.5px; color:#4A443E; background:#fff; border-bottom:1px solid rgba(0,0,0,.06); }
  .gw-bk-not { display:block; font-size:12px; color:#6F6459; margin-top:2px; }
  .gw-bk-tab { display:none; }
  .gw-bk-body { flex:1; min-height:0; display:grid; grid-template-columns:minmax(380px,520px) 1fr; }
  .gw-bk-list { overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:12px; }
  .gw-bk-item { display:flex; gap:14px; background:#fff; border:1.5px solid rgba(0,0,0,.08); border-radius:18px; padding:12px; cursor:pointer; transition:border-color .2s, box-shadow .2s; }
  .gw-bk-item:hover { box-shadow:0 8px 24px rgba(0,0,0,.08); } .gw-bk-item.on { border-color:#FF6600; box-shadow:0 0 0 3px rgba(255,102,0,.18); }
  .gw-bk-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
  .gw-bk-puan { flex-shrink:0; min-width:38px; height:34px; padding:0 8px; display:inline-flex; align-items:center; justify-content:center; background:#FF6600; color:#fff; font-weight:800; font-size:15px; border-radius:10px 10px 10px 2px; }
  .gw-durum { font-size:12px; font-weight:700; padding:3px 10px; border-radius:999px; background:#F6F3EE; color:#6F6459; } .gw-durum.ok { background:rgba(19,179,100,.12); color:#0A7C46; }
  .gw-bk-btn { min-height:36px; padding:0 14px; border-radius:999px; border:1.5px solid #2A140C; background:#fff; font-weight:700; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-family:inherit; }
  .gw-bk-btn.on { background:#FF6600; border-color:#FF6600; color:#fff; }
  .gw-bk-mapwrap { position:relative; min-height:300px; } .gw-bk-harita { position:absolute; inset:0; z-index:1; }
  .gw-bk-bos { position:absolute; z-index:5; left:50%; top:50%; transform:translate(-50%,-50%); background:#fff; border-radius:18px; padding:18px 22px; max-width:320px; box-shadow:0 10px 36px rgba(0,0,0,.2); display:flex; flex-direction:column; gap:6px; font-size:14px; text-align:center; pointer-events:none; }
  .gw-pinwrap { background:none; border:none; }
  .gw-pin { display:inline-flex; align-items:center; justify-content:center; min-width:42px; height:26px; padding:0 8px; border-radius:13px 13px 13px 3px; background:#FF6600; color:#fff; font:800 13px/1 'Outfit', system-ui, sans-serif; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,.4); transition:transform .25s var(--spring), background .2s; }
  .gw-pin.yak { border-style:dashed; background:#E07A2E; } .gw-pin.on { background:#2A140C; transform:scale(1.25); }
  .leaflet-popup-content { font-family:'Outfit', system-ui, sans-serif; font-size:13px; margin:12px 14px; } .leaflet-popup-content p { margin:3px 0; } .leaflet-popup-content a { color:#B4530A; font-weight:700; }
  @media (max-width:900px) {
    .gw-bk-body { grid-template-columns:1fr; }
    .gw-bk-tab { display:flex; background:#fff; border-bottom:1px solid rgba(0,0,0,.08); }
    .gw-bk-tab button { flex:1; min-height:46px; border:none; background:none; font-weight:700; font-size:14px; font-family:inherit; border-bottom:3px solid transparent; cursor:pointer; color:#6F6459; }
    .gw-bk-tab button.on { color:#B4530A; border-bottom-color:#FF6600; }
    .gw-bk-body.g-liste .gw-bk-mapwrap { display:none; } .gw-bk-body.g-harita .gw-bk-list { display:none; }
    .gw-bk-item img, .gw-bk-item .img-fallback { width:96px !important; }
    .gw-dbar { gap:8px; padding:0 10px; } .gw-dlink { padding:8px 10px; font-size:13px; }
  }
  @media (prefers-reduced-motion: reduce) { .gw-pin, .gw-bk-item { transition:none; } }

  /* ───────── GUR'un üç temel rengi: G #FFA500 · U #FF6600 · R #FF0000 ───────── */
  :root { --g: #FFA500; --u: #FF6600; --r: #FF0000; --tri: linear-gradient(90deg, #FFA500 0%, #FF6600 50%, #FF0000 100%); }
  /* Üst çubukların altında üç renkli ince çizgi (logodaki sırayla) */
  .gw-nav::after, .gw-dbar::after, .gw-homehead::after, .gw-auth-page::before { content:''; position:absolute; left:0; right:0; height:3px; background:var(--tri); }
  .gw-nav::after, .gw-dbar::after, .gw-homehead::after { bottom:0; } .gw-auth-page::before { top:0; }
  .gw-auth-page { position:relative; }
  /* Pastel zeminler üç rengin üçünü de taşır: sarı-turuncu, turuncu, kırmızı */
  .gw-tgo-hero, .gw-auth-page, .gw-deckpage {
    background: radial-gradient(48% 75% at 4% 0%, rgba(255,165,0,.42), transparent 72%), radial-gradient(40% 65% at 50% -10%, rgba(255,102,0,.26), transparent 72%), radial-gradient(50% 75% at 98% 2%, rgba(255,0,0,.22), transparent 72%), #fff;
  }
  /* İki ağırlıklı başlığın kalın kısmı: G-U-R geçişi (okunur kalsın diye uçları hafif koyulaştırıldı) */
  .gw-tri-text { background:linear-gradient(90deg, #F08A00 0%, #FF6600 50%, #E60000 100%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:#E65C00; padding-right:.04em; }
  /* Açılışta logonun altındaki çizgi */
  .gw-acilis-line { background:var(--tri); }
  /* Seçili çipler ve puan kutuları */
  .gw-kchip.on { background:linear-gradient(135deg, #FF8F00, #FF6600 55%, #F51C00); border-color:transparent; }
  .gw-bk-puan { background:linear-gradient(135deg, #FFA500, #FF6600 55%, #FF0000); }
  .gw-pin { background:linear-gradient(135deg, #FF8F00, #FF6600 55%, #F51C00); }
  .gw-pin.yak { background:linear-gradient(135deg, #FFB233, #FF8A33); }
  .gw-bk-btn.on { background:linear-gradient(135deg, #FF8F00, #FF6600 55%, #F51C00); border-color:transparent; }
  /* Kaydır: damgalar G-U-R'un kendi renkleri */
  .gw-damga.sag { border-color:#FF6600; color:#fff; background:rgba(255,102,0,.85); }
  .gw-damga.sol { border-color:#FF0000; color:#fff; background:rgba(255,0,0,.85); }
  .gw-damga.yukari { border-color:#FFA500; color:#2A140C; background:rgba(255,165,0,.92); }
  .gw-yuvarlak { border-width:2px; }
  /* Alt bar ve bantlar */
  .gw-bottom::before { content:''; position:absolute; left:26px; right:26px; top:0; height:3px; border-radius:0 0 3px 3px; background:var(--tri); }
  .gw-tgo-band:first-child { background:linear-gradient(120deg, #FFA500 0%, #FF6600 45%, #FF0000 110%) !important; }
  .gw-tgo-band:nth-child(2) { position:relative; overflow:hidden; } .gw-tgo-band:nth-child(2)::before { content:''; position:absolute; left:0; right:0; top:0; height:5px; background:var(--tri); }
  .gw-tgo-intro { background:linear-gradient(180deg, rgba(255,165,0,.14), rgba(255,102,0,.06) 55%, rgba(255,255,255,0)); }
  .gw-tgo-facts > div:nth-child(3n+1) { box-shadow:inset 0 3px 0 #FFA500; } .gw-tgo-facts > div:nth-child(3n+2) { box-shadow:inset 0 3px 0 #FF6600; } .gw-tgo-facts > div:nth-child(3n) { box-shadow:inset 0 3px 0 #FF0000; }
  .gw-badge.soft { background:rgba(255,165,0,.18); color:#8A5200; }
  .gw-durum.ok { background:rgba(255,165,0,.16); color:#8A5200; }
  .gw-bk-item.on { border-color:#FF6600; box-shadow:0 0 0 3px rgba(255,165,0,.28); }
  .gw-konumcipi { border-color:rgba(255,102,0,.45); }

  /* ───────── Etkileşim efektleri: üstüne gelince aktifleşme ───────── */
  /* Fare ya da dokunmatik ped olan cihazlarda (hover:hover); telefonda "yapışık hover" olmasın diye dokunmatikte uygulanmaz. */
  @media (hover:hover) and (pointer:fine) {
    .gw button:not(:disabled), .gw [role=button], .gw label.gw-acheck, .gw select { cursor:pointer; }
    /* Hap düğmeler (satır içi stilli): ortak geçiş + parıltı şeridi için kırpma */
    .gw :is(button,a)[style*="border-radius: 999px"], .gw button[style*="border-radius: 30px"] {
      position:relative; overflow:hidden; isolation:isolate;
      transition: transform .35s var(--spring), box-shadow .3s var(--ease-out), background-color .2s, border-color .2s, color .2s, filter .2s;
    }
    .gw :is(button,a)[style*="border-radius: 999px"]::after { content:''; position:absolute; top:0; bottom:0; left:-70%; width:45%; background:linear-gradient(100deg, transparent, rgba(255,255,255,.5), transparent); transform:skewX(-20deg); transition:left .75s var(--ease-out); pointer-events:none; z-index:-1; }
    /* Dolgu (üç renkli) düğmeler: yüksel, parla, ışık şeridi geçsin */
    .gw :is(button,a)[style*="linear-gradient"][style*="border-radius: 999px"]:not(:disabled):hover { transform:translateY(-2px); filter:brightness(1.07) saturate(1.1); box-shadow:0 10px 26px rgba(255,102,0,.42), 0 0 0 4px rgba(255,165,0,.22); }
    .gw :is(button,a)[style*="linear-gradient"][style*="border-radius: 999px"]:not(:disabled):hover::after { left:130%; }
    /* Çerçeveli düğmeler: turuncu tint, çerçeve ve yazı turuncuya döner */
    .gw :is(button,a)[style*="solid rgb(28, 25, 23)"]:not(:disabled):hover, .gw button[style*="border-radius: 30px"]:not(:disabled):hover {
      transform:translateY(-2px); background:rgba(255,102,0,.10) !important; border-color:#FF6600 !important; color:#B4530A !important; box-shadow:0 8px 20px rgba(255,102,0,.22);
    }
    .gw :is(button,a)[style*="solid rgb(28, 25, 23)"]:not(:disabled):hover::after { left:130%; }
    /* Çipler, ilçe/kategori seçenekleri, semt etiketleri, konum çipi */
    .gw .gw-kchip:not(.static):hover, .gw .gw-ilce:hover, .gw .gw-konumcipi:hover { transform:translateY(-2px); border-color:#FF6600; background:rgba(255,102,0,.08); color:#B4530A; box-shadow:0 6px 16px rgba(255,102,0,.2); }
    .gw .gw-kchip.on:hover { color:#fff; background:linear-gradient(135deg, #FF8F00, #FF6600 55%, #F51C00); filter:brightness(1.06); }
    .gw .gw-tgo-districts button { transition:transform .3s var(--spring), background-color .2s, box-shadow .2s; }
    .gw .gw-tgo-districts button:hover { transform:translateY(-2px); background:rgba(255,165,0,.22); box-shadow:0 4px 12px rgba(255,102,0,.18); }
    /* Yuvarlak kaydır düğmeleri ve kalp */
    .gw .gw-yuvarlak { transition:transform .4s var(--spring), box-shadow .3s, background-color .2s; }
    .gw .gw-yuvarlak:hover { transform:scale(1.14); background:rgba(255,165,0,.12); }
    .gw .gw-heartbtn { transition:transform .35s var(--spring), background-color .2s; } .gw .gw-heartbtn:hover { transform:scale(1.15); background:#fff; }
    /* Doyurucu: düğmeler, çubuk bağlantıları */
    .gw .gw-bk-btn:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(255,102,0,.28); background:rgba(255,102,0,.10); border-color:#FF6600; color:#B4530A; }
    .gw .gw-bk-btn.on:hover { color:#fff; filter:brightness(1.08); }
    .gw .gw-dlink { transition:background-color .2s, color .2s, transform .3s var(--spring); } .gw .gw-dlink:hover { transform:translateY(-1px); }
    .gw .gw-link { transition:background-color .2s, color .2s, transform .3s var(--spring); } .gw .gw-link:hover { background:rgba(255,102,0,.10); color:#B4530A; transform:translateY(-1px); }
    /* Kartlarda fotoğraf yavaşça yakınlaşır */
    .gw .gw-hover img, .gw .gw-bk-item img { transition:transform .7s var(--ease-out), opacity .4s !important; }
    .gw .gw-hover:hover img, .gw .gw-bk-item:hover img { transform:scale(1.07); }
    .gw .gw-bk-item:hover { border-color:rgba(255,102,0,.55); }
    /* Giriş kutuları ve arama çubukları */
    .gw .gw-afield input:hover, .gw .gw-afield select:hover { border-color:rgba(255,102,0,.6) !important; }
    .gw .gw-tgo-search, .gw .gw-bk-search, .gw .gw-bk-tools select { transition:box-shadow .25s, border-color .25s, transform .3s var(--spring); }
    .gw .gw-tgo-search:hover, .gw .gw-tgo-search:focus-within { box-shadow:0 8px 34px rgba(255,102,0,.22); }
    .gw .gw-bk-search:hover, .gw .gw-bk-tools select:hover { border-color:#FF6600; }
    .gw .gw-tgo-cell { transition:background-color .25s; } .gw .gw-tgo-cell:hover { background:rgba(255,165,0,.07); }
    .gw .gw-tgo-cell:hover .gw-tgo-ico { transform:scale(1.1) rotate(-4deg); } .gw .gw-tgo-ico { transition:transform .45s var(--spring); }
    /* Metin bağlantıları: altı üç renkli çizgiyle uzar */
    .gw main a:not([class]):not([style*="border-radius"]):hover, .gw footer a:hover { text-decoration:none; background:linear-gradient(90deg, #FFA500, #FF6600, #FF0000) left bottom / 100% 2px no-repeat; }
  }
  /* Basılı tutma geri bildirimi her cihazda anında */
  .gw .gw-yuvarlak:active, .gw .gw-kchip:active, .gw .gw-ilce:active, .gw .gw-bk-btn:active { transform:scale(.94); transition-duration:.08s; }
  @media (prefers-reduced-motion: reduce) {
    .gw :is(button,a)::after { display:none; }
    .gw .gw-yuvarlak:hover, .gw .gw-heartbtn:hover, .gw .gw-kchip:hover, .gw .gw-ilce:hover, .gw .gw-bk-btn:hover, .gw :is(button,a):hover { transform:none !important; }
    .gw .gw-hover:hover img, .gw .gw-bk-item:hover img { transform:none; }
  }

  /* ───────── GUR İşletme: kurumsal site + panel ───────── */
  .gw-ibpage { background:#fff; min-height:100vh; }
  .gw-ib { position:sticky; top:0; z-index:50; background:rgba(255,255,255,.92); backdrop-filter:saturate(180%) blur(18px); -webkit-backdrop-filter:saturate(180%) blur(18px); border-bottom:1px solid rgba(0,0,0,.07); }
  .gw-ib::after { content:''; position:absolute; left:0; right:0; bottom:-1px; height:3px; background:var(--tri); }
  .gw-ib-in { display:flex; align-items:center; gap:22px; height:68px; justify-content:space-between; }
  .gw-ib-etiket { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:800; letter-spacing:.14em; color:#B4530A; border:1.5px solid rgba(255,102,0,.5); border-radius:999px; padding:4px 10px 4px 8px; } .gw-ib-etiket.on { color:#FFB27A; border-color:rgba(255,178,122,.6); }
  .gw-ib-nav { display:flex; gap:4px; flex:1; justify-content:center; }
  .gw-ib-nav a { padding:8px 14px; border-radius:999px; font-weight:600; font-size:14px; color:#4A443E; white-space:nowrap; }
  .gw-ib-nav a:hover { background:rgba(255,102,0,.1); color:#B4530A; text-decoration:none; }
  @media (max-width:1000px) { .gw-ib-nav { display:none; } }
  .gw-ib-hero { padding:64px 0 72px; }
  .gw-ib-herogrid { display:grid; grid-template-columns:1.1fr .9fr; gap:48px; align-items:center; }
  .gw-ib-card { background:#fff; border:1px solid rgba(0,0,0,.09); border-radius:26px; padding:26px; box-shadow:0 14px 44px rgba(0,0,0,.07); }
  .gw-ib-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
  .gw-ib-stats > div { background:#FBFAF8; border-radius:16px; padding:12px 14px; display:flex; flex-direction:column; } .gw-ib-stats b { font-size:24px; } .gw-ib-stats span { font-size:12.5px; color:#6F6459; }
  .gw-ib-sec { padding:72px 28px; }
  .gw-ib-baslik { text-align:center; max-width:680px; margin:0 auto 36px; } .gw-ib-baslik span { font-size:12px; font-weight:800; letter-spacing:.08em; color:#B4530A; }
  .gw-ib-baslik h2 { font-size:clamp(26px,3.4vw,38px); margin:8px 0 12px; } .gw-ib-baslik p { color:#4A443E; margin:0; }
  .gw-cmp { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:22px; }
  .gw-cmp-kol { border-radius:24px; padding:26px 28px; } .gw-cmp-kol h3 { font-size:20px; margin:0 0 14px; }
  .gw-cmp-kol p { display:flex; gap:12px; margin:0 0 10px; font-size:15px; } .gw-cmp-kol p span { flex-shrink:0; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; margin-top:2px; }
  .gw-cmp-kol.once { background:#F6F3EE; color:#4A443E; } .gw-cmp-kol.once span { background:rgba(255,0,0,.12); color:#C2282D; }
  .gw-cmp-kol.sonra { background:linear-gradient(160deg, rgba(255,165,0,.14), rgba(255,102,0,.08)); border:1.5px solid rgba(255,102,0,.35); } .gw-cmp-kol.sonra span { background:#FF6600; color:#fff; }
  .gw-reasons { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  .gw-ib-band { background:#FBF7F1; }
  .gw-metrik { display:flex; flex-direction:column; gap:10px; max-width:980px; margin:0 auto; }
  .gw-metrik-satir { display:grid; grid-template-columns:44px 1.2fr 1.4fr; gap:16px; align-items:center; background:#fff; border:1px solid rgba(0,0,0,.08); border-radius:18px; padding:14px 18px; }
  .gw-metrik-satir b { font-size:16px; } .gw-metrik-satir p { margin:2px 0 0; color:#6F6459; font-size:13.5px; } .gw-metrik-ne { color:#4A443E !important; font-size:14px !important; }
  .gw-ib-fiyat { max-width:520px; margin:0 auto; background:#fff; border:1.5px solid rgba(255,102,0,.4); border-radius:28px; padding:30px; text-align:center; box-shadow:0 14px 44px rgba(255,102,0,.12); }
  .gw-ib-fiyat > b { font-size:56px; letter-spacing:-.04em; } .gw-ib-fiyat ul { list-style:none; padding:0; margin:12px 0 22px; text-align:left; display:grid; gap:8px; }
  .gw-ib-fiyat li, .gw-ib-liste li { display:flex; gap:10px; } .gw-ib-fiyat li span, .gw-ib-liste li span { color:#FF6600; font-weight:800; }
  .gw-ib-liste { list-style:none; padding:0; margin:18px 0 0; display:grid; gap:10px; }
  .gw-sss { border-bottom:1px solid #E3DCD2; } .gw-sss summary { cursor:pointer; list-style:none; padding:18px 4px; font-weight:700; font-size:16px; display:flex; justify-content:space-between; gap:16px; min-height:44px; }
  .gw-sss summary::-webkit-details-marker { display:none; } .gw-sss summary::after { content:'+'; font-size:22px; color:#B4530A; transition:transform .25s var(--spring); } .gw-sss[open] summary::after { transform:rotate(45deg); }
  .gw-sss p { margin:0 0 18px; color:#4A443E; padding-right:36px; }
  .gw-ib-cta { background:linear-gradient(120deg, #FFA500 0%, #FF6600 48%, #FF0000 115%); border-radius:30px; padding:52px 28px; text-align:center; color:#fff; } .gw-ib-cta h2 { color:#fff; font-size:clamp(26px,3.4vw,38px); margin:0 0 10px; } .gw-ib-cta p { margin:0 auto 24px; max-width:460px; opacity:.95; }
  .gw-ibfoot { border-top:1px solid rgba(0,0,0,.08); padding:40px 0 48px; background:#fff; }
  .gw-ibfoot-in { display:grid; grid-template-columns:1.4fr 1fr 1fr 1fr; gap:28px; } .gw-ibfoot-in > div { display:flex; flex-direction:column; gap:8px; font-size:14px; } .gw-ibfoot-in b { margin-bottom:4px; }
  .gw-ib-giris { display:grid; grid-template-columns:1fr 460px; gap:48px; align-items:center; }
  .gw-stepper { display:flex; justify-content:center; gap:10px; list-style:none; padding:0; margin:0 0 20px; flex-wrap:wrap; }
  .gw-stepper li { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:600; color:#6F6459; padding:6px 14px 6px 6px; border-radius:999px; background:#fff; border:1px solid #E3DCD2; }
  .gw-stepper li span { width:26px; height:26px; border-radius:50%; background:#EFE9E1; display:inline-flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; }
  .gw-stepper li.on { color:#2A140C; border-color:#FF6600; } .gw-stepper li.on span { background:linear-gradient(135deg,#FF8F00,#FF6600 55%,#F51C00); color:#fff; } .gw-stepper li.done span { background:#0A7C46; color:#fff; }
  .gw-sonuc { display:flex; align-items:center; gap:14px; width:100%; padding:10px 6px; background:none; border:none; border-bottom:1px solid #EFE9E1; font-family:inherit; font-size:15px; cursor:pointer; border-radius:12px; }
  .gw-sonuc:hover:not(:disabled) { background:rgba(255,165,0,.1); } .gw-sonuc:disabled { cursor:not-allowed; }
  .gw-secili { display:flex; align-items:center; gap:12px; background:#FFF8F0; border:1px solid rgba(255,102,0,.25); border-radius:16px; padding:10px 12px; margin-bottom:18px; }
  .gw-demo { background:#FFF8E6; border:1px dashed #E0A100; border-radius:16px; padding:14px 16px; text-align:left; font-size:14px; } .gw-demo p { margin:4px 0 10px; color:#4A443E; }
  .gw-pn { min-height:100vh; background:#f5f5f7; } .gw-pn-in { padding-top:28px; padding-bottom:64px; }
  .gw-pn-ust { display:flex; justify-content:space-between; gap:16px; align-items:flex-end; margin-bottom:18px; flex-wrap:wrap; }
  .gw-pn-sec { border:1.5px solid rgba(0,0,0,.18); border-radius:999px; min-height:44px; padding:0 16px; background:#fff; width:auto !important; }
  .gw-pn-tab { display:flex; gap:4px; border-bottom:1px solid rgba(0,0,0,.1); margin-bottom:20px; overflow-x:auto; }
  .gw-pn-tab button { background:none; border:none; padding:12px 18px; font-weight:700; font-size:15px; color:#6F6459; cursor:pointer; border-bottom:3px solid transparent; white-space:nowrap; font-family:inherit; display:flex; gap:8px; align-items:center; }
  .gw-pn-tab button.on { color:#B4530A; border-bottom-color:#FF6600; } .gw-pn-tab i { font-style:normal; background:#FF0000; color:#fff; border-radius:999px; font-size:11px; padding:1px 7px; }
  .gw-kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
  .gw-kpi-k { background:#fff; border-radius:18px; padding:16px 18px; display:flex; flex-direction:column; gap:4px; } .gw-kpi-k span { font-size:13px; color:#6F6459; font-weight:600; } .gw-kpi-k b { font-size:30px; letter-spacing:-.02em; } .gw-kpi-k small { color:#6F6459; font-size:12.5px; }
  .gw-pn-iki { display:grid; grid-template-columns:1.4fr 1fr; gap:14px; margin-bottom:14px; }
  .gw-pn-kart { background:#fff; border-radius:22px; padding:22px 24px; margin-bottom:14px; } .gw-pn-kart h2 { font-size:20px; margin:0 0 14px; }
  .gw-chart { display:flex; gap:10px; align-items:flex-end; height:170px; padding-bottom:4px; } .gw-chart-g { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; }
  .gw-chart-b { flex:1; width:100%; display:flex; gap:3px; align-items:flex-end; } .gw-chart-b i { flex:1; border-radius:6px 6px 0 0; min-height:2px; transition:height .5s var(--ease-out); } .gw-chart-g > span { font-size:12px; color:#6F6459; }
  .gw-chart-leg { display:flex; gap:14px; flex-wrap:wrap; font-size:12.5px; color:#6F6459; margin:12px 0 0; align-items:center; } .gw-chart-leg span { width:10px; height:10px; border-radius:3px; display:inline-block; margin-right:-6px; }
  .gw-bar { height:8px; border-radius:4px; background:#EFE9E1; margin-top:6px; overflow:hidden; } .gw-bar i { display:block; height:100%; border-radius:4px; transition:width .5s var(--ease-out); }
  .gw-tablo-h, .gw-tablo-s { display:grid; grid-template-columns:1.4fr .5fr .5fr 1.6fr; gap:14px; align-items:center; padding:12px 4px; } .gw-tablo-h { font-size:12.5px; font-weight:700; color:#6F6459; border-bottom:1px solid #E3DCD2; }
  .gw-tablo-s { border-bottom:1px solid #F1ECE5; font-size:14px; } .gw-tablo-s small { display:block; color:#6F6459; font-size:12.5px; } .gw-tablo-s i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:8px; }
  .gw-pn-form { display:grid; grid-template-columns:1fr 1fr; gap:0 18px; } .gw-pn-form .gw-afield:first-child { grid-column:1 / -1; }
  .gw-kaynak { font-style:normal; font-size:11.5px; font-weight:700; background:#F6F3EE; color:#6F6459; border-radius:999px; padding:2px 10px; } .gw-kaynak.sizden { background:rgba(255,165,0,.2); color:#8A5200; }
  .gw-talep { display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid #F1ECE5; flex-wrap:wrap; }
  .gw-ib-bos { text-align:center; max-width:560px; margin:48px auto; background:#fff; border-radius:26px; padding:40px 28px; } .gw-ib-bos p { color:#4A443E; margin:10px 0 22px; }
  @media (max-width:900px) {
    .gw-ib-herogrid, .gw-ib-giris, .gw-cmp, .gw-reasons, .gw-pn-iki { grid-template-columns:1fr; }
    .gw-kpi { grid-template-columns:1fr 1fr; } .gw-ibfoot-in { grid-template-columns:1fr 1fr; }
    .gw-metrik-satir { grid-template-columns:44px 1fr; } .gw-metrik-ne { grid-column:1 / -1; }
    .gw-tablo-h { display:none; } .gw-tablo-s { grid-template-columns:1fr 1fr; } .gw-tablo-s > span:first-child, .gw-tablo-s > span:last-child { grid-column:1 / -1; }
    .gw-pn-form { grid-template-columns:1fr; } .gw-ib-sec { padding:48px 16px; } .gw-ib-hero { padding:40px 0 48px; }
  }

  /* ───────── Mahalle seçici: sıralı, sayılı, hepsi görünür ───────── */
  .gw-mah-kap { max-width:980px; margin:0 auto; }
  .gw-mah-baslik { margin:0 0 10px; font-size:12.5px; font-weight:700; letter-spacing:.04em; color:#6F6459; text-align:center; }
  .gw-mah { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; }
  .gw-mah-chip { display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:0 14px 0 8px; border-radius:999px; background:#fff; border:1.5px solid rgba(0,0,0,.12); font-family:inherit; font-size:14.5px; font-weight:600; color:#2A140C; cursor:pointer; white-space:nowrap; transition:transform .3s var(--spring), border-color .2s, background-color .2s, box-shadow .2s; }
  .gw-mah-chip em { font-style:normal; font-size:12.5px; font-weight:700; color:#6F6459; background:#F6F3EE; border-radius:999px; padding:2px 9px; }
  .gw-mah-sira { width:26px; height:26px; border-radius:50%; background:#F1ECE5; color:#4A443E; font-size:12.5px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
  .gw-mah-sira.s1 { background:#FFA500; color:#2A140C; } .gw-mah-sira.s2 { background:#FF6600; color:#fff; } .gw-mah-sira.s3 { background:#FF0000; color:#fff; }
  .gw-mah-chip.on { background:linear-gradient(135deg, #FF8F00, #FF6600 55%, #F51C00); border-color:transparent; color:#fff; } .gw-mah-chip.on em { background:rgba(255,255,255,.25); color:#fff; }
  .gw-mah-chip.ilce { min-height:50px; font-size:16px; font-weight:700; padding-right:16px; }
  .gw-mah-chip.ilce.sec { border-color:#FF6600; background:rgba(255,165,0,.14); box-shadow:0 0 0 3px rgba(255,165,0,.22); }
  .gw-mah-chip.ilce.on.sec { background:linear-gradient(135deg, #FF8F00, #FF6600 55%, #F51C00); }
  .gw-mah-baslik.alt { display:flex; justify-content:center; align-items:center; gap:12px; flex-wrap:wrap; margin:16px 0 10px; }
  .gw-mah-link { background:none; border:none; padding:0; font-family:inherit; font-size:12.5px; font-weight:800; color:#B4530A; cursor:pointer; text-decoration:underline; text-underline-offset:3px; min-height:32px; }  .gw-mah-daha { min-height:44px; padding:0 18px; border-radius:999px; background:transparent; border:1.5px dashed #FF6600; color:#B4530A; font-family:inherit; font-weight:700; font-size:14px; cursor:pointer; }
  @media (hover:hover) and (pointer:fine) {
    .gw-mah-chip:hover { transform:translateY(-2px); border-color:#FF6600; background:rgba(255,102,0,.08); box-shadow:0 6px 16px rgba(255,102,0,.2); }
    .gw-mah-chip.on:hover { background:linear-gradient(135deg, #FF8F00, #FF6600 55%, #F51C00); filter:brightness(1.06); }
    .gw-mah-daha:hover { background:rgba(255,102,0,.1); }
  }
  @media (max-width:700px) {
    .gw-mah { flex-wrap:nowrap; justify-content:flex-start; overflow-x:auto; scroll-snap-type:x proximity; scroll-padding-left:16px; padding:4px 16px 10px; margin:0 -16px; scrollbar-width:none; -webkit-overflow-scrolling:touch; -webkit-mask-image:linear-gradient(90deg, #000 0, #000 88%, transparent 100%); mask-image:linear-gradient(90deg, #000 0, #000 88%, transparent 100%); }
    .gw-mah::-webkit-scrollbar { display:none; } .gw-mah-chip { scroll-snap-align:start; flex-shrink:0; } .gw-mah-daha { display:none; }
    .gw-mah-baslik { text-align:left; padding-left:2px; }
  }

  /* ───────── (eski) Yatay kaydırılabilir şerit ───────── */
  .gw-serit { position:relative; max-width:1040px; margin:0 auto; }
  .gw-serit::before, .gw-serit::after { content:''; position:absolute; top:0; bottom:0; width:42px; z-index:2; pointer-events:none; }
  .gw-serit::before { left:0; background:linear-gradient(90deg, rgba(255,255,255,.9), transparent); } .gw-serit::after { right:0; background:linear-gradient(-90deg, rgba(255,255,255,.9), transparent); }
  .gw-serit-in { justify-content:flex-start !important; overflow-x:auto; scroll-snap-type:x proximity; cursor:grab; scrollbar-width:none; -webkit-overflow-scrolling:touch; overscroll-behavior-x:contain; padding:4px 30px 8px !important; }
  .gw-serit-in:active { cursor:grabbing; }
  .gw-serit-in > button { flex-shrink:0; scroll-snap-align:start; user-select:none; }
  .gw-serit-in > :first-child { margin-left:auto; } .gw-serit-in > :last-child { margin-right:auto; } /* sığıyorsa ortalı, taşıyorsa baştan */
  .gw-serit-ok { position:absolute; top:50%; transform:translateY(-58%); z-index:3; width:38px; height:38px; border-radius:50%; border:1px solid rgba(0,0,0,.12); background:#fff; box-shadow:0 4px 14px rgba(0,0,0,.14); font-size:22px; line-height:1; cursor:pointer; color:#2A140C; display:flex; align-items:center; justify-content:center; padding:0 0 3px; }
  .gw-serit-ok.sol { left:0; } .gw-serit-ok.sag { right:0; }
  .gw-serit-ok:hover { background:rgba(255,102,0,.1); border-color:#FF6600; color:#B4530A; }

  /* ───────── Kaydır: yukarı kaydırınca açılan detay sayfası ───────── */
  @keyframes sheetUp { from { transform:translateY(100%); } to { transform:none; } }
  .gw-dsheet-ov { position:fixed; inset:0; z-index:850; display:flex; align-items:flex-end; justify-content:center; }
  .gw-dsheet { position:relative; width:100%; max-width:620px; max-height:90vh; max-height:90dvh; background:#fff; border-radius:28px 28px 0 0; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 -10px 50px rgba(0,0,0,.25); animation:sheetUp .5s var(--spring) both; transition:transform .3s var(--ease-out); }
  .gw-dsheet-tut { padding:10px 0 6px; cursor:grab; touch-action:none; display:flex; justify-content:center; flex-shrink:0; } .gw-dsheet-tut span { width:44px; height:5px; border-radius:3px; background:#D6CFC7; }
  .gw-dsheet-x { position:absolute; top:8px; right:12px; width:44px; height:44px; border-radius:50%; border:none; background:#F6F3EE; font-size:16px; color:#2A140C; cursor:pointer; z-index:3; }
  .gw-dsheet-in { overflow-y:auto; padding:0 22px 8px; flex:1; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; }
  .gw-dsheet-foto { display:flex; gap:10px; overflow-x:auto; scroll-snap-type:x mandatory; margin:0 -22px; padding:0 22px; scrollbar-width:none; } .gw-dsheet-foto::-webkit-scrollbar { display:none; }
  .gw-dsheet-foto > div { flex:0 0 82%; height:210px; border-radius:20px; overflow:hidden; scroll-snap-align:center; background:#e8e0d8; position:relative; }
  .gw-dsheet-menu { display:flex; gap:10px; overflow-x:auto; margin:8px -22px 0; padding:0 22px; scrollbar-width:none; } .gw-dsheet-menu::-webkit-scrollbar { display:none; }
  .gw-dsheet-menu > div { flex:0 0 130px; height:182px; border-radius:14px; overflow:hidden; background:#e8e0d8; position:relative; }
  .gw-dsheet-eylem { display:flex; gap:8px; padding:12px 18px calc(12px + env(safe-area-inset-bottom)); border-top:1px solid #EFE9E1; background:#fff; flex-shrink:0; }
  .gw-deck-ipucu { display:inline-flex; align-items:center; gap:6px; margin-top:10px; padding:5px 12px; border-radius:999px; background:rgba(255,255,255,.18); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); color:#fff; font-size:12px; font-weight:600; animation:ipucu 1.8s ease-in-out infinite; }
  @keyframes ipucu { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
  @media (prefers-reduced-motion: reduce) { .gw-deck-ipucu, .gw-dsheet { animation:none; } }

  /* ───────── Fotoğraf galerisi (detay sayfası) ───────── */
  .gw-gal { position:relative; margin:0 -22px; }
  .gw-gal .gw-dsheet-foto { margin:0; cursor:grab; user-select:none; -webkit-user-select:none; }
  .gw-gal .gw-dsheet-foto.drag { scroll-snap-type:none; cursor:grabbing; }
  .gw-gal .gw-dsheet-foto img { pointer-events:none; -webkit-user-drag:none; }
  .gw-gal-ok { position:absolute; top:105px; transform:translateY(-50%); z-index:3; width:40px; height:40px; border-radius:50%; border:1px solid rgba(0,0,0,.1); background:rgba(255,255,255,.95); box-shadow:0 4px 14px rgba(0,0,0,.2); font-size:24px; line-height:1; padding:0 0 3px; cursor:pointer; color:#2A140C; display:flex; align-items:center; justify-content:center; }
  .gw-gal-ok.sol { left:30px; } .gw-gal-ok.sag { right:30px; }
  .gw-gal-ok:hover { background:#fff; color:#B4530A; }
  .gw-gal-nokta { display:flex; align-items:center; justify-content:center; gap:2px; margin-top:6px; }
  .gw-gal-nokta button { width:22px; height:28px; border:none; background:none; padding:0; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .gw-gal-nokta button span { width:8px; height:8px; border-radius:4px; background:#D6CFC7; transition:width .3s var(--spring), background-color .2s; display:block; } .gw-gal-nokta button span.on { width:22px; background:#FF6600; }
  .gw-gal-nokta small { margin-left:10px; font-size:12px; color:#6F6459; font-weight:600; }
  @media (hover:none) { .gw-gal-ok { display:none; } }

  /* ───────── Apple tasarım katmanı ───────── */  :root { --spring: linear(0, 0.18 2.6%, 0.52 6.3%, 0.84 11%, 1.04 16.5%, 1.09 20%, 1.08 24.5%, 1.03 32%, 1 40%, 0.995 55%, 1); --ease-out: cubic-bezier(.22,1,.36,1); }
  html, body { background:#f5f5f7 !important; }
  .gw { background:#f5f5f7; font-family:${F}; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; font-optical-sizing:auto; }
  /* Tüm metin ve kontroller sistem yazı tipini kullanır (uygulamadan gelen bileşenler dahil); logo Poppins kalır */
  .gw input, .gw select, .gw textarea, .gw button, .gw p, .gw span:not(.gw-logo), .gw h1, .gw h2, .gw h3, .gw label, .gw div { font-family:${F} !important; }
  .gw .gur-logo, .gw .gur-logo * { font-family:'Poppins', sans-serif !important; } /* logo markası Poppins kalır */
  /* İzleme (tracking) boyuta göre: büyükte negatif, küçükte hafif pozitif; satır aralığı büyüdükçe daralır */
  .gw h1 { letter-spacing:-0.035em; line-height:1.06; font-weight:700 !important; }
  .gw h2 { letter-spacing:-0.025em; line-height:1.15; font-weight:700 !important; }
  .gw h3 { letter-spacing:-0.015em; line-height:1.25; font-weight:600 !important; }
  .gw p { line-height:1.5; letter-spacing:-0.006em; }
  .gw-bottom a.gw-tab, .gw-link { letter-spacing:0.01em; }
  /* Malzemeler: yarı saydam, bulanık katman; içerik altından kayar; üstte ışığı yakalayan ince çizgi */
  .gw-nav { background:rgba(255,255,255,.72); backdrop-filter:saturate(180%) blur(24px); -webkit-backdrop-filter:saturate(180%) blur(24px); border-bottom:.5px solid rgba(0,0,0,.1); }
  .gw-bottom { background:rgba(255,255,255,.72) !important; backdrop-filter:saturate(180%) blur(28px); -webkit-backdrop-filter:saturate(180%) blur(28px); border:.5px solid rgba(255,255,255,.7); border-top-color:rgba(255,255,255,.95); box-shadow:0 10px 40px rgba(0,0,0,.14), 0 1px 0 rgba(255,255,255,.8) inset !important; }
  /* Kartlar: yumuşak büyük köşe, ince çizgi, katmanlı gölge */
  .gw-hover { border-radius:20px; box-shadow:none !important; border:1px solid rgba(0,0,0,.09); } /* tgo: düz, ince çizgili kartlar */
  /* Geri bildirim basışta anında (pointer-down), bırakınca yay gibi geri döner */
  .gw button, .gw a, .gw [role=button] { transition:transform .5s var(--spring), box-shadow .3s var(--ease-out), background-color .2s, opacity .2s; }
  .gw button:active, .gw a.gw-hover:active, .gw [role=button]:active, .gw-bottom a:active, .gw-link:active { transform:scale(.96); transition-duration:.08s; }
  .gw-hover { transition:transform .5s var(--spring), box-shadow .3s var(--ease-out); }
  .gw-hover:hover { transform:translateY(-3px) scale(1.008); box-shadow:0 2px 4px rgba(0,0,0,.04), 0 20px 48px rgba(0,0,0,.12) !important; }
  .gw-hover:active { transform:scale(.975); transition-duration:.08s; }
  .gw-link { transition:background-color .2s; }
  .gw-link:hover { background:rgba(0,0,0,.05); } .gw-link.active { background:rgba(255,102,0,.12); }
  /* Yüzeyler açılırken malzemeleşir: bulanıklık + ölçek birlikte */
  @keyframes materialize { from { opacity:0; transform:scale(.96) translateY(10px); backdrop-filter:blur(0); } to { opacity:1; transform:none; } }
  @keyframes scrim { from { opacity:0; } to { opacity:1; } }
  .gw-sheet { animation:materialize .45s var(--spring) both; }
  .gw-scrim { animation:scrim .3s var(--ease-out) both; background:rgba(0,0,0,.45) !important; backdrop-filter:blur(24px) saturate(160%) !important; -webkit-backdrop-filter:blur(24px) saturate(160%); }
  .gw input:not([type=checkbox]):focus, .gw select:focus { outline:none; box-shadow:0 0 0 4px rgba(255,102,0,.25); }
  .gw a:focus-visible, .gw button:focus-visible, .gw [role=button]:focus-visible { outline:3px solid rgba(255,102,0,.5); outline-offset:3px; }
  @media (max-width: 700px) {
    .gw h1 { letter-spacing:-0.03em; }
    .gw-bottom { border-radius:28px; }
  }
  /* Erişilebilirlik: hareketi azalt → kayma ve yay yok, kısa opaklık geçişi */
  @media (prefers-reduced-motion: reduce) {
    .gw *, .gw *::before, .gw *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.15s !important; }
    .gw-hover:hover, .gw button:active, .gw-hover:active { transform:none !important; }
    .gw-sheet { animation:scrim .2s linear both; }
  }
  /* Saydamlığı azalt → mat, opak yüzeyler */
  @media (prefers-reduced-transparency: reduce) {
    .gw-nav, .gw-bottom { background:#fff !important; backdrop-filter:none; -webkit-backdrop-filter:none; }
    .gw-scrim { backdrop-filter:none !important; -webkit-backdrop-filter:none; background:rgba(0,0,0,.8) !important; }
  }
  /* Yüksek karşıtlık → belirgin kenarlıklar */
  @media (prefers-contrast: more) {
    .gw-hover, .gw-bottom, .gw-nav { border:1px solid rgba(0,0,0,.6) !important; }
  }
`;

// ───────────────────────── Veri & durum ─────────────────────────
// Açılış (marka anı): ilk açılış ~2.6 sn · dönen kullanıcı ~0.7 sn · azaltılmış hareket ~0.2 sn · dokununca anında.
function Acilis({ goruldu, onBitti }) {
  const az = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const k = az ? 0.08 : goruldu ? 0.27 : 1;
  useEffect(() => {
    const t = setTimeout(onBitti, Math.round(2600 * k));
    return () => clearTimeout(t);
  }, [k, onBitti]);
  return (
    <div className="gw-acilis" role="button" tabIndex={0} aria-label="Açılışı geç" style={{ '--k': k }}
      onClick={onBitti} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onBitti()}>
      <div className="gw-acilis-logo"><GurLogo size={74} /></div>
      <div className="gw-acilis-line" />
      <p className="gw-acilis-sub">LEZZET PLATFORMU</p>
      <p className="gw-acilis-city">İstanbul</p>
    </div>
  );
}

// Rıza: bir MODAL, karar verilmeden geçilemez; iki seçenek AYNI görsel ağırlıkta (karanlık kalıp yok).
function RizaKutusu({ onKarar }) {
  return (
    <div className="gw-scrim gw-modal" role="alertdialog" aria-modal="true" aria-labelledby="riza-baslik">
      <div className="gw-sheet gw-modal-card">
        <span className="gw-tgo-ico" style={{ marginBottom: 14 }}><Icon n="shield" size={24} color="#FF6600" /></span>
        <h2 id="riza-baslik" style={{ fontSize: 24, margin: '0 0 8px' }}>Ölçümleme çerezleri</h2>
        <p style={{ margin: 0, color: '#6F6459' }}>
          Siteyi geliştirmek için anonim kullanım istatistikleri toplayabiliriz. Zorunlu olanlar dışında hiçbir şey iznin olmadan
          çalışmaz; kararını Profil'den her zaman değiştirebilirsin.
        </p>
        <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
          <button autoFocus style={tgoPill(true, { width: '100%', padding: '15px 0' })} onClick={() => onKarar('kabul')}>Kabul et</button>
          <button style={tgoPill(false, { width: '100%', padding: '15px 0' })} onClick={() => onKarar('ret')}>Yalnızca zorunlu</button>
        </div>
      </div>
    </div>
  );
}

// Tek onaylı geri alınamaz işlemler için (çıkış, hesap silme): iki düğme aynı boyda.
function OnayKutusu({ baslik, metin, onayMetin, onOnay, onVazgec }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onVazgec();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onVazgec]);
  return (
    <div className="gw-scrim gw-modal" role="alertdialog" aria-modal="true" aria-labelledby="onay-baslik" onClick={onVazgec}>
      <div className="gw-sheet gw-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 id="onay-baslik" style={{ fontSize: 22, margin: '0 0 8px' }}>{baslik}</h2>
        <p style={{ margin: 0, color: '#6F6459' }}>{metin}</p>
        <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
          <button style={tgoPill(true, { width: '100%', padding: '15px 0', background: '#C2282D' })} onClick={onOnay}>{onayMetin}</button>
          <button autoFocus style={tgoPill(false, { width: '100%', padding: '15px 0' })} onClick={onVazgec}>Vazgeç</button>
        </div>
      </div>
    </div>
  );
}

export function GurWebLayout() {
  const { pathname } = useLocation();
  const kabuklu = /^\/(kesfet|restoran|favoriler|profil)/.test(pathname);   // kabuklu sayfalar arasında üst menü yeniden çizilmez
  const kokAnahtar = kabuklu ? 'kabuk' : pathname;
  const depo = useDepo();
  const isletme = useIsletme(); const platform = usePlatform(); const gelir = useGelir();
  const goruldu = useRef(depo.acilisGoruldu).current;
  const [acilisBitti, setAcilisBitti] = useState(false);
  // Konuma göre sıralama — sunucunun kullandığı fonksiyonun aynısı (shared/deck.js).
  const sirali = useMemo(() => yakinaGore(HAVUZ_GUNCEL, depo.konum), [depo.konum]);
  // Onaylı sahiplenme ve işletmenin girdiği alanlar kayda uygulanır (girilen alan kaynağı ezer).
  const feed = useMemo(() => yonetimUygula(sahiplikUygula(sirali, isletme), platform), [sirali, isletme, platform]); // eslint-disable-line react-hooks/exhaustive-deps
  const bitir = useCallback(() => { setAcilisBitti(true); yaz({ acilisGoruldu: true }); }, []);

  const value = useMemo(() => ({
    depo, isletme, platform, gelir, restaurants: feed,
    isFav: (r) => depo.favoriler.includes(String(r?.id)),
    toggleFav: (r) => favoriCevir(r.id),
  }), [depo, isletme, platform, gelir, feed]);

  return (
    <Ctx.Provider value={value}>
      <div className="gw"><style>{CSS + MOBIL_CSS + GELIR_CSS + ANA_CSS + YUMUSAK_CSS}</style>
        {!acilisBitti ? <Acilis goruldu={goruldu} onBitti={bitir} /> : null}
        <div key={kokAnahtar} className={kabuklu ? 'gw-kok kabuk' : 'gw-kok'}><Outlet /></div><ScrollRestoration />
        {/* Rıza, açılış geçilene kadar sorulmuyor: ilk izlenim bir onay kutusu olmasın. */}
        {acilisBitti && depo.riza === null ? <RizaKutusu onKarar={(k) => yaz({ riza: k })} /> : null}
      </div>
    </Ctx.Provider>
  );
}

// ───────────────────────── Ortak parçalar ─────────────────────────
const Btn2 = ({ children, onClick, to, ghost, style }) => {
  const s = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', borderRadius: 30, fontFamily: F, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: ghost ? '2px solid rgba(255,255,255,.6)' : 'none', background: ghost ? 'rgba(255,255,255,.08)' : '#fff', color: ghost ? '#fff' : '#FF6600', boxShadow: ghost ? 'none' : '0 6px 24px rgba(255,69,0,.2)', ...style };
  return to ? <Link to={to} style={s}>{children}</Link> : <button onClick={onClick} style={s}>{children}</button>;
};

const TabIcon = ({ n, size = 22 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (n === 'kart') return <svg {...p}><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 8h6M9 12h4" /></svg>;
  if (n === 'kisi') return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
  return <Icon n={n} size={size} color="currentColor" />;
};

function NavBar() {
  const { depo } = useApp();
  const { pathname } = useLocation();
  const onSwipe = pathname.startsWith('/kesfet/swipe') || pathname.startsWith('/kesfet/harita');
  const basHarf = (depo.kullanici?.ad || 'G').slice(0, 1).toLocaleUpperCase('tr');
  const favSayi = depo.favoriler.length;
  return (
    <>
    {/* Telefon: üstte ortada logo, altta mobil uygulamadaki gibi 4 sekmeli hap bar */}
    {!onSwipe && (
      <div className="gw-mtop"><Link to="/kesfet" aria-label="GUR Keşfet"><GurLogo size={42} pill /></Link></div>
    )}
    <nav className="gw-bottom" aria-label="Ana menü">
      <NavLink to="/kesfet" end className="gw-tab"><TabIcon n="search" />Keşfet</NavLink>
      <NavLink to="/kesfet/swipe" className="gw-tab"><TabIcon n="kart" />Kaydır</NavLink>
      <NavLink to="/favoriler" className="gw-tab"><TabIcon n="heart" />Favoriler</NavLink>
      <NavLink to="/profil" className="gw-tab"><TabIcon n="kisi" />Profil</NavLink>
    </nav>
    <header className="gw-nav">
      <div className="gw-wrap gw-nav-in">
        <Link to="/" aria-label="GUR ana sayfa"><GurLogo size={38} pill /></Link>
        <nav style={{ display: 'flex', gap: 4, flex: 1 }} aria-label="Gezinme">
          <NavLink to="/kesfet" end className="gw-link"><TabIcon n="search" size={16} />Keşfet</NavLink>
          <NavLink to="/kesfet/swipe" className="gw-link"><TabIcon n="kart" size={16} />Kaydır</NavLink>
          <NavLink to="/kesfet/harita" className="gw-link"><TabIcon n="pin" size={16} />Harita</NavLink>
          <NavLink to="/favoriler" className="gw-link"><TabIcon n="heart" size={16} />Favoriler{favSayi > 0 && ` (${favSayi})`}</NavLink>
        </nav>
        <Link to="/doyurucu" className="gw-link gw-hide-sm"><Icon n="catalbicak" size={16} />Doyurucu için</Link>
        <Link to="/profil" aria-label="Profilim" style={{ width: 40, height: 40, borderRadius: '50%', background: '#FF6600', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{basHarf}</Link>
      </div>
    </header>
    </>
  );
}

export function SiteShell() {
  const { pathname } = useLocation();
  return (<><NavBar /><div className="gw-page" key={pathname}><Outlet /></div></>);
}

function Stars({ n, size = 14, off = '#ddd' }) {
  return <span>{[1, 2, 3, 4, 5].map((s) => <span key={s} style={{ fontSize: size, color: s <= n ? '#FFA500' : off }}>★</span>)}</span>;
}

// tgoyemek tarzı sayfa başlığı: pastel yıkama, iki ağırlıklı başlık (açık gri + koyu), isteğe bağlı çocuklar (arama vb.)
export function PageHero({ light, bold, sub, children, compact }) {
  return (
    <section className="gw-tgo-hero" style={compact ? { padding: '44px 0 36px' } : undefined}>
      <div className="gw-wrap" style={{ textAlign: 'center' }}>
        <h1 className="gw-tgo-h1" style={{ marginBottom: sub || children ? 20 : 0, fontSize: compact ? 'clamp(28px,4.2vw,46px)' : undefined }}>
          <span style={{ color: '#8f8a85', fontWeight: 400 }}>{light}</span> <span className="gw-tri-text">{bold}</span>
        </h1>
        {sub && <p style={{ margin: '0 auto 22px', color: '#6B5D4C', maxWidth: 560 }}>{sub}</p>}
        {children}
      </div>
    </section>
  );
}

export const tgoPill = (filled, extra) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 26px', borderRadius: 999, fontWeight: 700, fontSize: 15, border: filled ? '1.5px solid transparent' : '1.5px solid #2A140C', background: filled ? GRAD : '#fff', color: filled ? '#fff' : '#2A140C', cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap', ...extra });

export function RestaurantCard({ r, i = 0 }) {
  const { depo, isFav, toggleFav } = useApp();
  const fav = isFav(r);
  const mesafe = mesafeMetni(r);
  return (
    <Link to={`/restoran/${r.id}`} className="gw-hover" style={{ display: 'block', background: '#fff', borderRadius: 22, overflow: 'hidden', animation: `fadeInUp .4s ease-out ${Math.min(i, 8) * 0.04}s backwards` }}>
      <div style={{ position: 'relative', height: 190 }}>
        <Img src={r.imgs?.[0]} style={{ position: 'absolute', inset: 0 }} bg="#e8e0d8" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.5), transparent 50%)' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: '70%' }}>
          {r.gastro && <span className="gw-badge dark">★ Gastro Onaylı</span>}
        </div>
        <button aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'} onClick={(e) => { e.preventDefault(); toggleFav(r); }} className="gw-heartbtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? '#FF6600' : 'none'} stroke="#FF6600" strokeWidth="2.2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
        </button>
        {mesafe && <span style={{ position: 'absolute', bottom: 10, right: 12, color: '#fff', fontSize: 12, fontWeight: 600 }}>{mesafe}</span>}
      </div>
      <div style={{ padding: '14px 18px 18px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17 }}>{r.name}</h3>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6F6459' }}>{r.cat}{r.price ? ` · ${r.price}` : ''}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 10 }}>
          <Icon n="star" size={13} color="#F59E0B" /><b>{r.rating}</b>
          {r.ratingCount ? <span style={{ color: '#6F6459' }}>({r.ratingCount.toLocaleString('tr-TR')})</span> : null}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(r.tags || []).slice(0, 3).map((t) => <span key={t} style={{ background: 'rgba(255,102,0,.08)', color: '#A84D09', borderRadius: 14, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{t}</span>)}
        </div>
      </div>
    </Link>
  );
}

// ───────────────────────── Ana sayfa (tgoyemek.com tarzı düzen, GUR kimliğiyle) ─────────────────────────
const YOLLAR = [
  ['heart', 'Sağa kaydır', 'Beğendiğini kaydet', C3.u],
  ['cross', 'Sola kaydır', 'İlgilenmediğini geç', C3.r],
  ['eye', 'Yukarı kaydır', 'Detayları aç', C3.g],
];
const FEATURES = [
  ['pin', 'Yakınındakiler Önce', 'Konumunu paylaşırsan yakın mekanlar önce gelir; paylaşmazsan ilçeni seçersin. Ham koordinatın gönderilmez, mesafe tarayıcında hesaplanır.'],
  ['shield', 'Gastro Onaylı', 'Tanınmış şeflerin onayladığı restoranlar rozetiyle öne çıkar, ne yiyeceğini bilerek seçersin.'],
  ['chat', 'Üç kaynaktan yorum', 'GUR uygulamasından yazılan yorumlar, GUR’un kendi gurmelerinin GURME değerlendirmeleri ve Google Maps puanı — her biri kaynağıyla birlikte.'],
  ['plate', 'Ücretsiz Masa Ayırtma', 'Komisyon yok. Masa ayırtma, kaydını sahiplenmiş mekanlarda açıktır.'],
  ['doc', 'Menü Galerisi', 'Restoranların menülerini görsel galeri olarak incele, gitmeden karar ver.'],
  ['heart', 'İletişim ve Sosyal Medya', 'Telefon, web sitesi, Instagram ve Facebook bağlantıları mekân sayfasında bir arada.'],
];

// İlçe → mahalle hiyerarşisi: önce bağlı olunan İLÇELER (restoran sayısına göre çoktan aza, sıra numarası ve sayıyla), seçili ilçenin altında MAHALLELERİ.
// Hepsi görünür; fazlası "+N mahalle daha" ile açılır. Telefonda her satır parmakla yatay kayar (solma ipucuyla, gizli ok yok).
function useIlceler(restaurants) {
  return useMemo(() => {
    const ilce = {};
    restaurants.forEach((r) => {
      const d = r.district || 'Diğer'; const m = r.tags?.[1];
      const o = ilce[d] || (ilce[d] = { ad: d, n: 0, say: {} });
      o.n += 1; if (m) o.say[m] = (o.say[m] || 0) + 1;
    });
    const sirala = (a, b) => b.n - a.n || a.ad.localeCompare(b.ad, 'tr');
    return Object.values(ilce).map((o) => ({ ad: o.ad, n: o.n, mahalleler: Object.entries(o.say).map(([ad, n]) => ({ ad, n })).sort(sirala) })).sort(sirala);
  }, [restaurants]);
}

function BolgeSecici({ ilceler, onSec, aktif = '', ilceUygula = false }) {
  const [acik, setAcik] = useState(ilceler[0]?.ad);
  const [hepsi, setHepsi] = useState(false);
  const ilce = ilceler.find((i) => i.ad === acik) || ilceler[0];
  if (!ilce) return null;
  const ILK = 10;
  const mahalleler = hepsi ? ilce.mahalleler : ilce.mahalleler.slice(0, ILK);
  return (
    <div className="gw-mah-kap">
      <p className="gw-mah-baslik">İlçeler · restoran sayısına göre</p>
      <div className="gw-mah" role="group" aria-label="İlçeler, restoran sayısına göre sıralı">
        {ilceler.map((d, i) => (
          <button key={d.ad} type="button" className={`gw-mah-chip ilce ${acik === d.ad ? 'sec' : ''} ${aktif === d.ad ? 'on' : ''}`} aria-pressed={acik === d.ad}
            onClick={() => { setAcik(d.ad); setHepsi(false); if (ilceUygula) onSec(d.ad); }}>
            <span className={`gw-mah-sira s${Math.min(i + 1, 4)}`}>{i + 1}</span>{d.ad}<em>{d.n}</em>
          </button>
        ))}
      </div>
      <p className="gw-mah-baslik alt">
        <span><b>{ilce.ad}</b> mahalleleri · restoran sayısına göre</span>
        <button type="button" className="gw-mah-link" onClick={() => onSec(ilce.ad)}>Tüm {ilce.ad} restoranları ({ilce.n}) →</button>
      </p>
      <div className="gw-mah" role="group" aria-label={`${ilce.ad} mahalleleri, restoran sayısına göre sıralı`}>
        {mahalleler.map((m, i) => (
          <button key={m.ad} type="button" className={`gw-mah-chip ${aktif === m.ad ? 'on' : ''}`} aria-pressed={aktif === m.ad} onClick={() => onSec(m.ad)}>
            <span className={`gw-mah-sira s${Math.min(i + 1, 4)}`}>{i + 1}</span>{m.ad}<em>{m.n}</em>
          </button>
        ))}
        {ilce.mahalleler.length > ILK && (
          <button type="button" className="gw-mah-daha" aria-expanded={hepsi} onClick={() => setHepsi(!hepsi)}>
            {hepsi ? 'Daha az göster' : `+${ilce.mahalleler.length - ILK} mahalle daha`}
          </button>
        )}
      </div>
    </div>
  );
}
function HomePageWeb() {
  const nav = useNavigate();
  const { restaurants } = useApp();
  const [q, setQ] = useState('');
  const go = (v) => nav(v ? `/kesfet?q=${encodeURIComponent(v)}` : '/kesfet');
  // 1 yorumlu 5 puanlı mekan vitrine çıkmasın: en az 200 değerlendirmesi olanlar arasından en yüksek puanlılar.
  const featured = useMemo(() => [...restaurants].filter((r) => (r.ratingCount || 0) >= 200).sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount).slice(0, 6), [restaurants]);
  const ilceler = useIlceler(restaurants);
  const pill = (filled) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '11px 22px', borderRadius: 999, fontWeight: 700, fontSize: 14, border: filled ? 'none' : '1.5px solid #2A140C', background: filled ? GRAD : '#fff', color: filled ? '#fff' : '#2A140C', cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' });
  return (
    <div style={{ background: '#fff' }}>
      <header className="gw-homehead" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.88)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' }}>
        <div className="gw-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <Link to="/" aria-label="GUR ana sayfa"><GurLogo size={38} pill /></Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/doyurucu" className="gw-hide-sm" style={{ fontWeight: 600, fontSize: 14, padding: '0 10px' }}>Doyurucu için</Link>
            <Link to="/giris" style={pill(true)}>Giriş Yap</Link>
            <Link to="/kayit" style={pill(false)}>Üye Ol</Link>
          </div>
        </div>
      </header>

      <section className="gw-tgo-hero">
        <div className="gw-wrap" style={{ textAlign: 'center' }}>
          <h1 className="gw-tgo-h1"><span style={{ color: '#8f8a85', fontWeight: 400 }}>İstanbul'un Lezzetleri</span> <span className="gw-tri-text">Bir Kaydırma Uzağında!</span></h1>
          <form className="gw-tgo-search" onSubmit={(e) => { e.preventDefault(); go(q.trim()); }}>
            <Icon n="search" size={20} color="#2A140C" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Restoran, mutfak veya semt ara" aria-label="Ara" />
            <Link to="/kesfet" className="gw-hide-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', padding: '0 6px' }}><Icon n="pin" size={16} />Tüm İstanbul</Link>
            <button type="submit" aria-label="Ara" style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: GRAD, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </form>
          <BolgeSecici ilceler={ilceler} onSec={go} />
        </div>
      </section>

      <section className="gw-wrap" style={{ padding: '44px 28px 0' }}>
        <h2 style={{ fontSize: 30, margin: '0 0 6px', textAlign: 'center' }}><span style={{ color: '#8f8a85', fontWeight: 400 }}>Üç Yön,</span> Üç Karar</h2>
        <p style={{ textAlign: 'center', color: '#6F6459', margin: '0 0 22px' }}>Karta dokunursan detay açılır; kaydırdıkça deste ilerler.</p>
        <div className="gw-yollar">
          {YOLLAR.map(([ic, b, a, renk]) => (
            <div key={b} className="gw-hover" style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 20, padding: 16, cursor: 'default' }}>
              <span className="gw-tgo-ico" style={{ width: 44, height: 44, borderRadius: 999, margin: 0, background: `22` }}><Icon n={ic} size={19} color={renk} /></span>
              <div><b style={{ display: 'block' }}>{b}</b><span style={{ color: '#6F6459', fontSize: 14 }}>{a}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="gw-wrap" style={{ padding: '56px 28px 24px' }}>
        <div className="gw-tgo-features">
          <div className="gw-tgo-intro">
            <h2>GUR Sana Neler Sunuyor?</h2>
            <p>İstanbul'un restoranlarını kaydırarak keşfet, beğendiğini kaydet, detayları görmek için yukarı kaydır.</p>
            <Link to="/kesfet" style={{ ...pill(true), marginTop: 18, display: 'inline-flex' }}>Keşfetmeye Başla</Link>
          </div>
          {FEATURES.map(([ic, t, d], i) => (
            <div key={t} className="gw-tgo-cell">
              <span className="gw-tgo-ico" style={{ background: `1F` }}><Icon n={ic} size={26} color={[C3.g, C3.u, C3.r][i % 3]} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="gw-wrap" style={{ padding: '24px 28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 30, margin: 0 }}>Semtin Yıldızı Restoranlar</h2>
          <Link to="/kesfet" style={{ color: '#FF6600', fontWeight: 700 }}>Hepsini gör →</Link>
        </div>
        <p style={{ color: '#6B5D4C', margin: '6px 0 22px' }}>En az 200 değerlendirmesi olan, en yüksek puanlı mekanlar.</p>
        <div className="gw-grid">{featured.map((r, i) => <RestaurantCard key={r.id} r={r} i={i} />)}</div>
      </section>

      <section className="gw-wrap" style={{ padding: '40px 28px 64px' }}>
        <div className="gw-tgo-bands">
          <div className="gw-tgo-band" style={{ background: GRAD, color: '#fff' }}>
            <h2>Restoran Başvurusu</h2>
            <p>GUR'a katıl, menünü ve fotoğraflarını yayınla, İstanbul'daki yemek severlere ulaş.</p>
            <Link to="/doyurucu" style={{ ...pill(false), border: 'none', color: '#FF6600', alignSelf: 'flex-start' }}>Restoranımı Ekle</Link>
          </div>
          <div className="gw-tgo-band" style={{ background: '#2A140C', color: '#fff' }}>
            <h2>Ana Ekranına Ekle</h2>
            <p>Telefonunda Safari'de Paylaş ▸ "Ana Ekrana Ekle" de; GUR uygulama gibi tam ekran açılır.</p>
            <Link to="/kesfet" style={{ ...pill(false), border: 'none', alignSelf: 'flex-start' }}>Hemen Dene</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(0,0,0,.08)', padding: '28px 0 40px' }}>
        <div className="gw-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <GurLogo size={30} pill />
          <nav style={{ display: 'flex', gap: 22, fontSize: 14, fontWeight: 600, color: '#6B5D4C' }}>
            <Link to="/kesfet">Keşfet</Link><Link to="/doyurucu">Doyurucu</Link><Link to="/giris">Giriş Yap</Link>
          </nav>
        </div>
        <p className="gw-wrap" style={{ margin: '18px auto 0', fontSize: 12.5, color: '#6F6459' }}>
          Mekan listesi Google Maps taramasından (Bakırköy, 218 kayıt) geliyor; fotoğraflar örnek görsellerdir. Fotoğraf, menü ve saat bilgisi mekân sahiplenince dolar.
        </p>
      </footer>
    </div>
  );
}

// ───────────────────────── Karşılama + giriş ekranları ─────────────────────────
// Giriş/kayıt ekranları: tgoyemek tarzı — pastel zemin, ortada iki ağırlıklı başlık ve ince çizgili kart; renkler GUR'un turuncusu
function AuthShell({ light, bold, sub, back, icon, children }) {
  const nav = useNavigate();
  return (
    <div className="gw-auth-page">
      <div className="gw-auth-top">
        {back ? <button className="gw-auth-back" onClick={() => nav(back)}>‹ Geri</button> : <span />}
        <Link to="/" aria-label="GUR ana sayfa"><GurLogo size={38} pill /></Link>
        <span style={{ width: 84 }} />
      </div>
      <div className="gw-auth-body">
        {icon && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><span className="gw-tgo-ico" style={{ margin: 0 }}><Icon n={icon === true ? 'plate' : icon} color="#FF6600" size={26} /></span></div>}
        <h1 className="gw-tgo-h1" style={{ fontSize: 'clamp(28px,4vw,42px)', marginBottom: 10 }}><span style={{ color: '#8f8a85', fontWeight: 400 }}>{light}</span> <span className="gw-tri-text">{bold}</span></h1>
        {sub && <p style={{ margin: '0 auto 26px', color: '#6B5D4C', maxWidth: 420, textAlign: 'center' }}>{sub}</p>}
        <div className="gw-auth-card">{children}</div>
      </div>
    </div>
  );
}

export function AField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="gw-afield">{label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}
function ASelect({ label, value, onChange, options }) {
  return (
    <label className="gw-afield">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)}><option value="">Seçiniz</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
    </label>
  );
}
export const ABtn = ({ children, onClick, to, outline, type = 'button', style }) => {
  const s = tgoPill(!outline, { width: '100%', padding: '16px 0', fontSize: 16, ...style });
  return to ? <Link to={to} style={s}>{children}</Link> : <button type={type} onClick={onClick} style={s}>{children}</button>;
};

export function WelcomePage() {
  return (
    <AuthShell light="Hoş geldin!" bold="Lezzet Seni Bekliyor" sub="İstanbul'un en iyi restoranlarını keşfet, favorilerini kaydet" back="/">
      <ABtn to="/giris">GUR uldamaya başla sende</ABtn>
      <div style={{ height: 12 }} />
      <ABtn to="/doyurucu" outline>Doyurucu için doğru yer</ABtn>
    </AuthShell>
  );
}

// Giriş / Kayıt tek ekranda. DOĞRULAMA her zaman çalışır (boş formla giriş yok); koşul onayı dekoratif değil.
const epostaGecerli = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function LoginPage() {
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const kayit = sp.get('kayit') === '1';
  const [ad, setAd] = useState(''); const [eposta, setEposta] = useState(''); const [parola, setParola] = useState('');
  const [onay, setOnay] = useState(false); const [hata, setHata] = useState(null);

  const eksik = kayit
    ? (!ad.trim() ? 'Adını yaz' : !epostaGecerli(eposta) ? 'Geçerli bir e-posta yaz'
      : parola.length < 6 ? 'Parola en az 6 karakter olmalı' : !onay ? 'Koşulları onayla' : null)
    : (!epostaGecerli(eposta) ? 'Geçerli bir e-posta yaz' : parola.length < 6 ? 'Parola en az 6 karakter olmalı' : null);

  const gonder = (ev) => {
    ev.preventDefault();
    if (eksik) { setHata(eksik); return; }   // doğrulama ilk satırda
    setHata(null);
    yaz((d) => ({ kullanici: { ad: ad.trim() || eposta.split('@')[0], email: eposta.trim(), tarih: d.kullanici?.tarih || new Date().toISOString() } }));
    nav('/konum', { state: { kayittan: kayit }, replace: true });
  };
  const degis = () => { setHata(null); setSp(kayit ? {} : { kayit: '1' }, { replace: true }); };

  return (
    <AuthShell light={kayit ? 'Hesap' : 'Tekrar'} bold={kayit ? 'Oluştur' : 'Hoş Geldin'}
      sub={kayit ? 'Favorilerin ve yorumların hesabına bağlı kalsın.' : 'Kaldığın yerden devam et.'} back="/">
      <form onSubmit={gonder} noValidate>
        {kayit && <AField label="Ad Soyad" value={ad} onChange={setAd} placeholder="Adın" />}
        <AField label="E-posta" value={eposta} onChange={setEposta} placeholder="ornek@mail.com" type="email" />
        <AField label="Parola" value={parola} onChange={setParola} placeholder="En az 6 karakter" type="password" />
        {kayit && (
          <label className="gw-acheck">
            <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} />
            Kullanım koşullarını ve gizlilik metnini okudum, kabul ediyorum.
          </label>
        )}
        {hata && <p role="alert" style={{ color: '#C2282D', fontWeight: 600, fontSize: 14, margin: '0 0 12px' }}>{hata}</p>}
        <ABtn type="submit">{kayit ? 'Kaydını tamamla' : 'Giriş yap'}</ABtn>
      </form>
      <button onClick={degis} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, color: '#B4530A', fontWeight: 700, fontSize: 14, fontFamily: F }}>
        {kayit ? 'Hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt için dokun'}
      </button>
    </AuthShell>
  );
}

export function RegisterPage() { return <Navigate to="/giris?kayit=1" replace />; }

// Konum: üç yol, üçü de EŞİT AĞIRLIKTA (karanlık kalıp yok). Ham koordinat hiçbir yere gönderilmez — mesafe tarayıcıda hesaplanır.
export function KonumPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const kayittan = !!loc.state?.kayittan;
  const degistir = loc.pathname.endsWith('/degistir');
  const [liste, setListe] = useState(false);
  const [bekle, setBekle] = useState(false);
  const [not, setNot] = useState('');

  const bitir = (konum) => { yaz({ konum }); nav(degistir ? '/kesfet' : '/kesfet', { replace: true }); };
  const cihaz = async () => {
    setBekle(true);
    const k = await cihazKonumu();
    setBekle(false);
    // İzin reddedilirse AKIŞ TIKANMAZ: elle seçim listesi açılır.
    if (k) bitir(k); else { setNot('Konum izni alınamadı. İlçeni listeden seçebilirsin.'); setListe(true); }
  };
  const ayni = { width: '100%', padding: '16px 0', fontSize: 16 };

  return (
    <AuthShell light="Nerede yemek" bold="arıyorsun?" back={degistir ? '/profil' : '/giris'} icon="pin"
      sub="Yakınındaki mekanları önce göstermek için konumunu kullanabiliriz. Ham koordinatın hiçbir yere gönderilmiyor — mesafe tarayıcında hesaplanıyor.">
      {kayittan && (
        <div role="progressbar" aria-label="Adım 2 / 2" aria-valuenow={2} aria-valuemin={1} aria-valuemax={2} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ flex: 1, height: 4, borderRadius: 2, background: '#FF6600' }} /><span style={{ flex: 1, height: 4, borderRadius: 2, background: '#FF6600' }} />
          <b style={{ fontSize: 12, color: '#6F6459' }}>2/2</b>
        </div>
      )}
      {not && <p role="status" style={{ margin: '0 0 14px', color: '#6F6459', fontSize: 14 }}>{not}</p>}
      {liste && (
        <div style={{ marginBottom: 20 }}>
          <b style={{ display: 'block', fontSize: 13, margin: '0 0 10px' }}>İlçeni seç</b>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ILCELER.map((i) => <button key={i.ad} className="gw-ilce" onClick={() => bitir(ilceSec(i.ad))}>{i.ad}</button>)}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        <ABtn onClick={cihaz} style={ayni}>{bekle ? 'Konum alınıyor…' : 'Konumumu kullan'}</ABtn>
        <ABtn outline onClick={() => setListe(true)} style={ayni}>İlçemi seçeyim</ABtn>
        {/* Üçüncü yol da AYNI boy ve puntoda: reddetmek kabul etmek kadar kolay olmalı. */}
        <ABtn outline onClick={() => bitir(null)} style={ayni}>Şimdi değil</ABtn>
      </div>
    </AuthShell>
  );
}

export function DoyuruculAuthPage() {
  return (
    <AuthShell light="Doyurucu" bold="Girişi" sub="Restoranınızı yönetin, istatistikleri takip edin" back="/" icon>
      <ABtn to="/doyurucu/giris">Giriş Yap</ABtn>
      <div style={{ height: 12 }} />
      <ABtn to="/doyurucu/kayit" outline>Yeni Hesap Oluştur</ABtn>
    </AuthShell>
  );
}

export function DoyurucuLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  return (
    <AuthShell light="İşletme" bold="Girişi" sub="İşletme hesabınızla giriş yapın" back="/doyurucu" icon>
      <form onSubmit={(ev) => { ev.preventDefault(); nav('/doyurucu/panel'); }}>
        <AField label="E-posta Adresi" value={email} onChange={setEmail} placeholder="restoran@mail.com" />
        <AField label="Şifre" value={password} onChange={setPassword} placeholder="******" type="password" />
        <p style={{ fontSize: 13, color: '#6B5D4C', textAlign: 'right', margin: '0 0 18px', textDecoration: 'underline' }}>Şifremi unuttum</p>
        <ABtn type="submit">İşletme Paneline Gir</ABtn>
      </form>
    </AuthShell>
  );
}

// Restoran kaydı: 3 adım, mevcut form bileşenleri geniş ekranda ortalanmış kartta
export function DoyurucuRegisterPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  return (
    <div className="gw-auth-page" style={{ padding: 1 }}>
      <div className="gw-form">
        {step === 1 && <RestRegStep1 onBack={() => nav('/doyurucu')} onNext={() => setStep(2)} />}
        {step === 2 && <RestRegStep2 onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <RestRegStep3 onBack={() => setStep(2)} onDone={() => nav('/doyurucu/sahiplen')} />}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const nav = useNavigate();
  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh' }}>
      <DoyurucuBar />
      <div className="gw-dash"><RestaurantDashboard onLogout={() => nav('/')} /></div>
    </div>
  );
}

// ───────────────────────── Keşfet ─────────────────────────
function KonumCipi() {
  const { depo } = useApp();
  const metin = depo.konum ? (depo.konum.ilce || 'Konumum') : 'Konum kapalı';
  return (
    <Link to="/konum/degistir" className="gw-konumcipi" aria-label={`Konum: ${metin}. Değiştirmek için dokun`}>
      <Icon n="pin" size={15} color="#2A140C" />{metin}<span>Değiştir</span>
    </Link>
  );
}

const SAYFA = 24;
function ExplorePageWeb() {
  const { restaurants } = useApp();
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [kategori, setKategori] = useState(null);
  const [adet, setAdet] = useState(SAYFA);

  const kategoriler = useMemo(() => CATEGORIES.map((c) => c.name).filter((n) => restaurants.some((r) => r.cat === n)), [restaurants]);
  const ilceler = useIlceler(restaurants);
  const liste = useMemo(() => {
    const a = q.trim().toLocaleLowerCase('tr');
    return restaurants.filter((r) => {
      if (kategori && r.cat !== kategori) return false;
      if (!a) return true;
      return `${r.name} ${r.cat} ${(r.tags || []).join(' ')} ${r.addr || ''}`.toLocaleLowerCase('tr').includes(a);
    });
  }, [restaurants, q, kategori]);
  useEffect(() => { setAdet(SAYFA); }, [q, kategori]);

  return (
    <div>
      <PageHero light="Canın Ne İstiyor?" bold="Hemen Keşfet!" compact>
        <div className="gw-tgo-search">
          <Icon n="search" size={20} color="#2A140C" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Restoran, mutfak ya da semt" aria-label="Restoran ara" />
          {q
            ? <button onClick={() => setQ('')} aria-label="Aramayı temizle" style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: '#f1efec', cursor: 'pointer', fontSize: 16 }}>✕</button>
            : <span style={{ width: 44, height: 44, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n="search" size={18} color="#fff" /></span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <KonumCipi />
          <Link to="/kesfet/harita" className="gw-konumcipi"><Icon n="pin" size={15} color="#2A140C" />Harita görünümü</Link>
        </div>
        {ilceler.length > 0 && (
          <BolgeSecici ilceler={ilceler} aktif={q} ilceUygula onSec={(m) => setQ(q === m ? '' : m)} />
        )}
      </PageHero>

      <div className="gw-wrap" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div className="gw-chiprow" role="group" aria-label="Kategoriler">
          <button className={`gw-kchip ${kategori ? '' : 'on'}`} onClick={() => setKategori(null)}>Tümü</button>
          {kategoriler.map((n) => (
            <button key={n} className={`gw-kchip ${kategori === n ? 'on' : ''}`} aria-pressed={kategori === n} onClick={() => setKategori(kategori === n ? null : n)}>{n}</button>
          ))}
        </div>
        <SponsorluSerit />
        <p style={{ margin: '4px 0 18px', color: '#6F6459', fontSize: 14 }} aria-live="polite">{liste.length} mekan</p>

        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <h2 style={{ fontSize: 22 }}>Sonuç yok</h2>
            <p style={{ color: '#6F6459' }}>“{q}” için mekan bulunamadı.</p>
            <Link to="/kesfet/swipe" style={tgoPill(true, { marginTop: 14 })}>Kaydırarak keşfet</Link>
          </div>
        ) : (
          <>
            <div className="gw-grid">{liste.slice(0, adet).map((r, i) => <RestaurantCard key={r.id} r={r} i={i % SAYFA} />)}</div>
            {adet < liste.length && (
              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <button style={tgoPill(false)} onClick={() => setAdet((a) => a + SAYFA)}>Daha fazla göster ({liste.length - adet})</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Kaydır (üç yön, üç karar) ─────────────────────────
// Sağa kaydet · sola geç · yukarı (ya da ortadaki düğme) detayları açar. Renk ayrım taşımıyor, ŞEKİL taşıyor: çarpı = geç, bilgi = detaylar, kalp = kaydet.
function DeckKart({ r, derinlik, ust, exitDir, onKarar, onDetay }) {
  const st = useRef({ x0: 0, y0: 0, drag: false, moved: false });
  const [p, setP] = useState({ dx: 0, dy: 0 });
  const [cikis, setCikis] = useState(null);

  const bitir = useCallback((yon) => {
    setCikis((c) => { if (c) return c; setTimeout(() => onKarar(yon, r), 280); return yon; });
  }, [onKarar, r]);
  useEffect(() => { if (exitDir && ust) bitir(exitDir); }, [exitDir]); // eslint-disable-line react-hooks/exhaustive-deps

  const down = (e) => {
    if (!ust || cikis) return;
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* yoksay: sürükleme yine çalışır */ }
    st.current = { x0: e.clientX, y0: e.clientY, drag: true, moved: false };
  };
  const move = (e) => {
    if (!st.current.drag) return;
    const dx = e.clientX - st.current.x0, dy = e.clientY - st.current.y0;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) st.current.moved = true;
    st.current.dx = dx; st.current.dy = dy;   // bırakma anında güncel konum (durumun yeniden çizilmesini beklemeden)
    setP({ dx, dy });
  };
  const up = () => {
    if (!st.current.drag) return;
    st.current.drag = false;
    const dx = st.current.dx || 0, dy = st.current.dy || 0;
    if (dy < -110 && Math.abs(dy) > Math.abs(dx)) { setP({ dx: 0, dy: 0 }); onDetay(); }
    else if (dx > 110) bitir('sag');
    else if (dx < -110) bitir('sol');
    else { setP({ dx: 0, dy: 0 }); if (!st.current.moved) onDetay(); }
  };
  const iptal = () => { st.current.drag = false; setP({ dx: 0, dy: 0 }); };

  const sur = st.current.drag;
  const uc = cikis === 'sag' ? { x: 700, y: 40, r: 18 } : cikis === 'sol' ? { x: -700, y: 40, r: -18 } : cikis === 'yukari' ? { x: 0, y: -800, r: 0 } : null;
  const x = uc ? uc.x : ust ? p.dx : 0, y = uc ? uc.y : ust ? p.dy : 0, rot = uc ? uc.r : ust ? p.dx * 0.05 : 0;
  const yatay = Math.abs(p.dx) >= Math.abs(p.dy);
  const damga = {
    sag: cikis === 'sag' ? 1 : Math.min(1, Math.max(0, p.dx / 110)) * (yatay ? 1 : 0),
    sol: cikis === 'sol' ? 1 : Math.min(1, Math.max(0, -p.dx / 110)) * (yatay ? 1 : 0),
    yukari: cikis === 'yukari' ? 1 : Math.min(1, Math.max(0, -p.dy / 110)) * (yatay ? 0 : 1),
  };

  return (
    <div className="gw-deckkart" role="group" aria-label={`${r.name}, ${r.cat}`}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={iptal}
      style={{
        transform: ust ? `translate(${x}px, ${y}px) rotate(${rot}deg)` : `scale(${1 - derinlik * 0.04}) translateY(${derinlik * 10}px)`,
        transition: sur ? 'none' : 'transform .4s var(--spring), opacity .3s',
        opacity: cikis ? 0 : 1, zIndex: 10 - derinlik, cursor: ust ? (sur ? 'grabbing' : 'grab') : 'default',
        pointerEvents: ust ? 'auto' : 'none',
      }}>
      <Img src={r.imgs?.[0]} style={{ position: 'absolute', inset: 0 }} bg="#e8e0d8" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.25) 40%, transparent 62%)', pointerEvents: 'none' }} />
      {[['sag', 'KAYDET', 'left'], ['sol', 'GEÇ', 'right'], ['yukari', 'DETAYLAR', 'center']].map(([k, t, yer]) => (
        <span key={k} className={`gw-damga ${yer} ${k}`} style={{ opacity: damga[k] }}>{t}</span>
      ))}
      {r.gastro && <span className="gw-badge dark" style={{ position: 'absolute', top: 16, left: 16 }}>★ Gastro Onaylı</span>}
      {r.sponsored && <span className="gw-badge dark" style={{ position: 'absolute', top: 16, right: 16 }}>Sponsorlu</span>}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '22px 22px 24px', color: '#fff', pointerEvents: 'none' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 26, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}>{r.name}</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, marginBottom: 8 }}>
          <span style={{ background: '#fff', color: '#2A140C', borderRadius: 10, padding: '3px 10px', fontWeight: 700, display: 'inline-flex', gap: 4, alignItems: 'center' }}><Icon n="star" size={12} color="#F59E0B" />{r.rating}</span>
          {mesafeMetni(r) && <span>{mesafeMetni(r)}</span>}
          {r.price && <span>· {r.price}</span>}
          <span style={{ color: '#FFB454', fontWeight: 700 }}>· {r.cat}</span>
        </div>
        {r.desc && <p style={{ margin: 0, fontSize: 13.5, opacity: .9 }}>{r.desc}</p>}
        {ust && <span className="gw-deck-ipucu"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="18 15 12 9 6 15" /></svg>Detaylar için yukarı kaydır</span>}
      </div>
    </div>
  );
}

// Fotoğraf galerisi: parmakla ya da fareyle sürükleyerek, ‹ › oklarıyla, noktalara dokunarak ya da ←/→ tuşlarıyla gezilir.
function Galeri({ imgs, ad }) {
  const ref = useRef(null);
  const s = useRef({ down: false, x: 0, sl: 0, moved: false });
  const [i, setI] = useState(0);
  const [surukle, setSurukle] = useState(false);
  const iRef = useRef(0); iRef.current = i;
  const adim = () => { const e = ref.current; const c = e?.children[0]; return c ? c.offsetWidth + 10 : 1; };
  const git = useCallback((n) => {
    const e = ref.current; if (!e) return;
    const k = Math.max(0, Math.min(imgs.length - 1, n));
    e.scrollTo({ left: k * adim(), behavior: 'smooth' });
    setI(k);
  }, [imgs.length]);
  const kaydi = () => { const e = ref.current; if (e && !s.current.down) setI(Math.max(0, Math.min(imgs.length - 1, Math.round(e.scrollLeft / adim())))); };
  useEffect(() => {
    const k = (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); git(iRef.current + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); git(iRef.current - 1); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [git]);
  const down = (e) => { if (e.pointerType !== 'mouse') return; s.current = { down: true, x: e.clientX, sl: ref.current.scrollLeft, moved: false }; setSurukle(true); };
  const move = (e) => { if (!s.current.down) return; const dx = e.clientX - s.current.x; if (Math.abs(dx) > 5) s.current.moved = true; ref.current.scrollLeft = s.current.sl - dx; };
  const up = () => { if (!s.current.down) return; s.current.down = false; setSurukle(false); git(Math.round(ref.current.scrollLeft / adim())); };
  if (!imgs.length) return null;
  return (
    <div className="gw-gal" role="group" aria-roledescription="galeri" aria-label={`${ad} fotoğrafları`}>
      <div ref={ref} className={`gw-dsheet-foto ${surukle ? 'drag' : ''}`} onScroll={kaydi}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        onClickCapture={(e) => { if (s.current.moved) { e.preventDefault(); e.stopPropagation(); s.current.moved = false; } }}>
        {imgs.map((u, k) => <div key={`${u}-${k}`} role="img" aria-label={`${ad} fotoğraf ${k + 1} / ${imgs.length}`}><Img src={u} style={{ width: '100%', height: '100%' }} bg="#e8e0d8" /></div>)}
      </div>
      {imgs.length > 1 && i > 0 && <button type="button" className="gw-gal-ok sol" aria-label="Önceki fotoğraf" onClick={() => git(i - 1)}>‹</button>}
      {imgs.length > 1 && i < imgs.length - 1 && <button type="button" className="gw-gal-ok sag" aria-label="Sonraki fotoğraf" onClick={() => git(i + 1)}>›</button>}
      {imgs.length > 1 && (
        <div className="gw-gal-nokta" role="tablist" aria-label="Fotoğraf seç">
          {imgs.map((_, k) => <button key={k} type="button" role="tab" aria-selected={k === i} aria-label={`Fotoğraf ${k + 1}`} onClick={() => git(k)}><span className={k === i ? 'on' : ''} /></button>)}
          <small aria-live="polite">{i + 1} / {imgs.length}</small>
        </div>
      )}
    </div>
  );
}
// Yukarı kaydırınca (ya da karta dokununca) kartın üstüne açılan detay sayfası: restoranın tüm özellikleri + kararlar.
// Sayfa açıkken deste kımıldamaz; karar (geç / kaydet) verilince sayfa kapanır ve kart uçar.
function DetaySayfasi({ r, onKapat, onKarar }) {
  const nav = useNavigate();
  const { isFav } = useApp();
  const [dy, setDy] = useState(0);
  const s = useRef({ y0: 0, drag: false });
  useEffect(() => {
    izle(r.id, 'goruntulenme');
    const k = (e) => e.key === 'Escape' && onKapat();
    window.addEventListener('keydown', k);
    const onceki = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = onceki; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tutDown = (e) => { s.current = { y0: e.clientY, drag: true }; try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* yoksay */ } };
  const tutMove = (e) => { if (s.current.drag) setDy(Math.max(0, e.clientY - s.current.y0)); };
  const tutUp = () => { if (!s.current.drag) return; s.current.drag = false; if (dy > 120) onKapat(); else setDy(0); };

  const imgs = r.imgs || [];
  const mesafe = mesafeMetni(r);
  const iletisim = [
    r.phone && ['Ara', `tel:${r.phone.replace(/\s/g, '')}`], r.website && ['Web sitesi', sosyalLink(r.website, 'https://')],
    r.instagram && ['Instagram', sosyalLink(r.instagram, 'https://instagram.com/')], r.facebook && ['Facebook', sosyalLink(r.facebook, 'https://facebook.com/')], r.email && ['E-posta', `mailto:${r.email}`],
  ].filter(Boolean);
  const yolTarifi = () => {
    izle(r.id, 'yol_tarifi');
    window.open(directionsUrl({ name: r.name, lat: r.lat, lng: r.lng, address: r.addr }, defaultMapProvider(navigator.userAgent)), '_blank', 'noopener,noreferrer');
  };
  const bilgiler = [['Puan', `★ ${r.rating}${r.ratingCount ? ` (${r.ratingCount.toLocaleString('tr-TR')})` : ''}`], mesafe && ['Bölge', mesafe], r.price && ['Fiyat', r.price], r.hours && ['Saatler', r.hours]].filter(Boolean);

  return (
    <div className="gw-scrim gw-dsheet-ov" role="dialog" aria-modal="true" aria-label={`${r.name} detayları`} onClick={onKapat}>
      <div className="gw-dsheet" onClick={(e) => e.stopPropagation()} style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}>
        <div className="gw-dsheet-tut" onPointerDown={tutDown} onPointerMove={tutMove} onPointerUp={tutUp} onPointerCancel={tutUp}><span /></div>
        <button type="button" className="gw-dsheet-x" aria-label="Detayı kapat" onClick={onKapat}>✕</button>
        <div className="gw-dsheet-in">
          <Galeri imgs={imgs} ad={r.name} />
          <p style={{ margin: '16px 0 4px', color: '#B4530A', fontWeight: 700, fontSize: 14 }}>{r.cat}</p>
          <h2 style={{ margin: '0 0 8px', fontSize: 28 }}>{r.name}</h2>
          {r.gastro && <span className="gw-badge soft" style={{ marginBottom: 10 }}>★ Gastro Onaylı{r.gastroChef ? ` · ${r.gastroChef}` : ''}</span>}
          <p style={{ margin: '0 0 14px', color: '#6F6459', fontSize: 14.5 }}>{r.addr}</p>
          <div className="gw-tgo-facts">{bilgiler.map(([l, v]) => <div key={l}><span>{l}</span><b>{v}</b></div>)}</div>
          {r.desc && <p style={{ margin: '16px 0 0', fontSize: 15.5, color: '#4A443E' }}>{r.desc}</p>}
          {r.popular?.length > 0 && <div style={{ marginTop: 16 }}><b>Öne çıkanlar</b><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{r.popular.map((x) => <span key={x} className="gw-kchip static">{x}</span>)}</div></div>}
          {r.menu?.length > 0
            ? <div style={{ marginTop: 18 }}><b>Menü</b><div className="gw-dsheet-menu">{r.menu.map((u, i) => <div key={`${u}-${i}`}><Img src={u} style={{ width: '100%', height: '100%' }} bg="#e8e0d8" /></div>)}</div></div>
            : <p style={{ margin: '16px 0 0', fontSize: 13.5, color: '#6F6459' }}>Menü henüz eklenmedi.</p>}
          <div style={{ marginTop: 18 }}>
            <b>İletişim ve sosyal medya</b>
            {iletisim.length
              ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{iletisim.map(([l, h]) => <a key={l} className="gw-kchip" href={h} target={h.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" onClick={() => izle(r.id, 'iletisim')}>{l}</a>)}</div>
              : <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#6F6459' }}>Bu mekân için henüz iletişim bilgisi yok.</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0 10px' }}>
            <button type="button" style={tgoPill(false, { padding: '10px 20px', fontSize: 14 })} onClick={yolTarifi}>Yol tarifi</button>
            <button type="button" style={tgoPill(false, { padding: '10px 20px', fontSize: 14 })} onClick={() => nav(`/restoran/${r.id}`)}>Mekân sayfasını aç →</button>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#6F6459' }}>{isFav(r) ? 'Bu mekân favorilerinde.' : 'Karar vermek için aşağıdaki düğmeleri kullan.'}</p>
        </div>
        <div className="gw-dsheet-eylem">
          <button type="button" style={tgoPill(false, { flex: 1, padding: '13px 0' })} onClick={() => onKarar('sol')}>✕ Geç</button>
          <button type="button" style={tgoPill(true, { flex: 1.2, padding: '13px 0' })} onClick={() => onKarar('sag')}>♥ Kaydet</button>
        </div>
      </div>
    </div>
  );
}
export function SwipePage() {
  const nav = useNavigate();
  const { depo, gelir, restaurants } = useApp();
  const ucretli = useRef(new Set());   // aynı kart için aynı olay iki kez ücretlendirilmesin
  const [sayac, setSayac] = useState(0);
  const [tur, setTur] = useState(0);
  const [btnYon, setBtnYon] = useState(null);
  const [not, setNot] = useState('');
  const [reklam, setReklam] = useState(false);   // ödüllü reklam penceresi
  const [acik, setAcik] = useState(false);   // yukarı kaydırınca/dokununca açılan detay sayfası

  // Deste oturum başında kuruluyor ve karar verildikçe KAYMIYOR: canlı hesaplansaydı kart kullanıcı görmeden listeden düşerdi.
  const deste = useMemo(
    () => desteKur(restaurants, { gecilen: tur === 0 ? depo.gecilen : [], tohum: tur + 1, kampanyalar: gelir.kampanyalar, gorulen: depo.kampanyaGorulen }),
    [restaurants, tur], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const kalan = deste.slice(sayac);
  const bitti = kalan.length === 0;
  const kt = kotaOku(depo);
  const ks = quotaState({ used: kt.kullanilan, bonus: kt.bonus });
  const engelli = !ks.allowed;   // günlük kota doldu: ücretsiz yol (reklam) açık
  useEffect(() => {
    const k0 = kalan[0]; if (!k0 || engelli) return;
    izle(k0.id, 'kart_gosterim');
    if (k0.sponsored) {
      const id = k0.sponsored.campaignId;
      kampanyaOlay(id, 'gosterim');
      yaz((d) => ({ kampanyaGorulen: [...new Set([...(d.kampanyaGorulen || []), id])] }));
    }
  }, [sayac, tur]); // eslint-disable-line react-hooks/exhaustive-deps
  const ucretle = (r, tip) => { const s = r?.sponsored; if (!s) return; const an = `${s.campaignId}:${tip}`; if (ucretli.current.has(an)) return; ucretli.current.add(an); kampanyaOlay(s.campaignId, tip); };
  const detayAc = () => { if (bitti || engelli) return; ucretle(kalan[0], 'tik'); setAcik(true); };

  const karar = useCallback((yon, r) => {
    if (yon === 'sag') { favoriEkle(r.id); ucretle(r, 'etkilesim'); } else gecildi(r.id);
    kotaKullan(); setSayac((s) => s + 1); setBtnYon(null);
    setNot(yon === 'sag' ? `${r.name} kaydedildi` : 'Geçildi');
  }, []);
  useEffect(() => { if (!not) return undefined; const t = setTimeout(() => setNot(''), 1600); return () => clearTimeout(t); }, [not]);

  const dugme = (yon) => { if (yon === 'detay') { detayAc(); return; } if (!bitti && !engelli && !btnYon) setBtnYon(yon); };
  useEffect(() => {
    const k = (e) => {
      if (bitti || acik || e.target.closest?.('input,textarea,select')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); dugme('sag'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); dugme('sol'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); detayAc(); }
      else if (e.key === 'Enter') { detayAc(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }); // her çizimde güncel kalan/btnYon ile

  const yuvarlak = (ikon, etiket, yon, buyuk, renk = C3.u) => (
    <button className={`gw-yuvarlak ${buyuk ? 'buyuk' : ''}`} aria-label={etiket} title={etiket} onClick={() => dugme(yon)} style={{ borderColor: renk, boxShadow: `0 6px 20px ${renk}44` }}>
      {ikon === 'detay'
        ? <svg width={buyuk ? 28 : 23} height={buyuk ? 28 : 23} viewBox="0 0 24 24" fill="none" stroke={renk} strokeWidth="2.4" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
        : <Icon n={ikon} size={buyuk ? 28 : 23} color={renk} strokeWidth={2.4} />}
    </button>
  );

  return (
    <div className="gw-deckpage">
      <div className="gw-deckhead">
        <h1>Kaydırarak keşfet</h1>
        <p>Sağa kaydet · sola geç · yukarı detay<span className="gw-deckhead-link"> · <Link to="/kesfet/harita" style={{ color: '#B4530A', fontWeight: 700 }}>Liste ve harita görünümü →</Link></span></p>
      </div>
      <div className="gw-deckarea">
        {engelli ? (
          <KotaPaneli onReklam={() => setReklam(true)} />
        ) : bitti ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', margin: 'auto' }}>
            <span className="gw-tgo-ico" style={{ margin: '0 auto 18px' }}><Icon n="brokenHeart" size={28} color="#FF6600" /></span>
            <h2 style={{ fontSize: 24 }}>Deste bitti</h2>
            <p style={{ color: '#6F6459', maxWidth: 360, margin: '8px auto 22px' }}>
              {depo.gecilen.length ? 'Geçtiklerine bir daha bakmak ister misin? Bu tur ücretsiz.' : 'Bugünlük bu kadar. Favorilerine göz atabilirsin.'}
            </p>
            <div style={{ display: 'grid', gap: 10, maxWidth: 320, margin: '0 auto' }}>
              {depo.gecilen.length > 0 && <button style={tgoPill(true, { width: '100%' })} onClick={() => { setTur((t) => t + 1); setSayac(0); }}>Geçtiklerine bir daha bak</button>}
              <Link to="/favoriler" style={tgoPill(false, { width: '100%' })}>Favorilerim</Link>
            </div>
          </div>
        ) : (
          kalan.slice(0, 3).reverse().map((r, i, a) => {
            const derinlik = a.length - 1 - i;
            return <DeckKart key={`${tur}-${r.id}`} r={r} derinlik={derinlik} ust={derinlik === 0} exitDir={derinlik === 0 ? btnYon : null}
              onKarar={karar} onDetay={detayAc} />;
          })
        )}
      </div>
      {!bitti && !engelli && <div className="gw-deckbtns">{yuvarlak('cross', 'Geç', 'sol', false, C3.r)}{yuvarlak('detay', 'Detayları aç', 'detay', true, C3.g)}{yuvarlak('heart', 'Kaydet', 'sag', false, C3.u)}</div>}
      <p className="gw-toast" role="status" aria-live="polite">{not}</p>
      {ks.pressure === 'near' && <p role="status" style={{ textAlign: 'center', color: '#B4530A', fontSize: 13, margin: '6px 0 0' }}>Bugünlük kaydırma hakkın bitmek üzere.</p>}
      {reklam && <OdulluReklam onBitir={(id) => { kotaBonusVer(id); setReklam(false); }} onKapat={() => setReklam(false)} />}
      {acik && kalan[0] && <DetaySayfasi r={kalan[0]} onKapat={() => setAcik(false)} onKarar={(y) => { setAcik(false); setBtnYon(y); }} />}
    </div>
  );
}

// ───────────────────────── Restoran detay ─────────────────────────
const sosyalLink = (v, taban) => (/^https?:/i.test(v) ? v : taban + String(v).replace(/^@/, ''));

function Lightbox({ src, onClose }) {
  useEffect(() => {
    if (!src) return undefined;
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [src, onClose]);
  if (!src) return null;
  return (
    <div className="gw-scrim gw-modal" role="dialog" aria-modal="true" aria-label="Görsel" onClick={onClose} style={{ flexDirection: 'column', gap: 14, background: 'rgba(10,8,6,.9)' }}>
      <img className="gw-sheet" src={src} alt="" style={{ maxWidth: '94vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 16 }} />
      <p style={{ color: 'rgba(255,255,255,.75)', margin: 0, fontSize: 14 }}>Kapatmak için dokun ya da Esc</p>
    </div>
  );
}

function DetailPageWeb() {
  const { id } = useParams();
  const { depo, restaurants, platform, isFav, toggleFav } = useApp();
  const r = restaurants.find((x) => String(x.id) === String(id)) || (platform.restoranAyar?.[String(id)]?.askida ? null : HAVUZ_GUNCEL.find((x) => String(x.id) === String(id)));
  const [foto, setFoto] = useState(0);
  const [buyuk, setBuyuk] = useState(null);
  const [bildirim, setBildirim] = useState('');
  useEffect(() => { setFoto(0); setBildirim(''); }, [id]);
  useEffect(() => { if (r) izle(r.id, 'goruntulenme'); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return <div className="gw-wrap" style={{ padding: '80px 0', textAlign: 'center' }}><h2>Mekan bulunamadı</h2><Link to="/kesfet" style={tgoPill(false, { marginTop: 14 })}>Keşfet'e dön</Link></div>;

  const imgs = r.imgs?.length ? r.imgs : [];
  const fav = isFav(r);
  const mesafe = mesafeMetni(r);
  const yorumlar = depo.yorumlar[String(r.id)] || [];
  const bilgiler = [
    ['Puan', `★ ${r.rating}${r.ratingCount ? ` (${r.ratingCount.toLocaleString('tr-TR')})` : ''}`],
    mesafe && ['Bölge', mesafe], r.price && ['Fiyat', r.price], r.hours && ['Saatler', r.hours],
  ].filter(Boolean);
  const iletisim = [
    r.phone && ['Ara', `tel:${r.phone.replace(/\s/g, '')}`],
    r.website && ['Web sitesi', sosyalLink(r.website, 'https://')],
    r.instagram && ['Instagram', sosyalLink(r.instagram, 'https://instagram.com/')],
    r.facebook && ['Facebook', sosyalLink(r.facebook, 'https://facebook.com/')],
    r.email && ['E-posta', `mailto:${r.email}`],
  ].filter(Boolean);

  const yolTarifi = () => {
    const url = directionsUrl({ name: r.name, lat: r.lat, lng: r.lng, address: r.addr }, defaultMapProvider(navigator.userAgent));
    izle(r.id, 'yol_tarifi');
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  // Masa ayırtma ÜCRETSİZ ve yalnızca kaydını SAHİPLENMİŞ mekanlarda açık: sahipsiz bir mekan adına söz veremeyiz.
  const masaAyirt = () => {
    if (!r.claimed) return;
    talepEkle({ restaurantId: r.id, ad: r.name, kisi: 2 });
    setBildirim(`${r.name} için talebin bu tarayıcıda kaydedildi. Sunucuya bağlanınca iletilecek — komisyon alınmıyor.`);
  };

  return (
    <div className="gw-wrap" style={{ paddingTop: 28, paddingBottom: 80 }}>
      <Link to="/kesfet" style={{ color: '#B4530A', fontWeight: 700, fontSize: 14 }}>‹ Keşfet</Link>
      <div className="gw-detail" style={{ marginTop: 16 }}>
        <div>
          <button className="gw-photo" onClick={() => setBuyuk(imgs[foto])} aria-label="Fotoğrafı büyüt" style={{ display: 'block', width: '100%', padding: 0, border: 'none', borderRadius: 24, overflow: 'hidden', position: 'relative', height: 440, cursor: 'zoom-in', background: '#e8e0d8' }}>
            <Img src={imgs[foto]} style={{ position: 'absolute', inset: 0 }} bg="#e8e0d8" />
          </button>
          {imgs.length > 1 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 14, overflowX: 'auto' }}>
              {imgs.map((img, i) => (
                <button key={`${img}-${i}`} onClick={() => setFoto(i)} aria-label={`${r.name} fotoğraf ${i + 1}`} style={{ flexShrink: 0, width: 110, height: 78, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', padding: 0, background: 'none', border: i === foto ? '3px solid #FF6600' : '3px solid transparent' }}>
                  <Img src={img} style={{ width: '100%', height: '100%' }} bg="#e8e0d8" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p style={{ margin: '0 0 6px', color: '#B4530A', fontWeight: 700 }}>{r.cat}</p>
          <h1 className="gw-h1" style={{ margin: '0 0 10px', fontSize: 40 }}>{r.name}</h1>
          {r.gastro && <span className="gw-badge soft" style={{ display: 'inline-flex', marginBottom: 12 }}>★ Gastro Onaylı{r.gastroChef ? ` · ${r.gastroChef}` : ''}</span>}
          <p style={{ margin: '0 0 18px', color: '#6F6459' }}>{r.addr}</p>
          <div className="gw-tgo-facts">{bilgiler.map(([l, v]) => <div key={l}><span>{l}</span><b>{v}</b></div>)}</div>
          {r.desc && <p style={{ margin: '18px 0 0', fontSize: 16, color: '#4A443E' }}>{r.desc}</p>}
          {r.popular?.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <b style={{ fontSize: 15 }}>Öne çıkanlar</b>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{r.popular.map((x) => <span key={x} className="gw-kchip static">{x}</span>)}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '24px 0 10px' }}>
            <button onClick={() => toggleFav(r)} aria-pressed={fav} style={tgoPill(!fav, { flex: '1 1 180px', background: fav ? '#f1efec' : GRAD, color: fav ? '#2A140C' : '#fff', border: 'none' })}>{fav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}</button>
            <button onClick={yolTarifi} style={tgoPill(false)}>Yol tarifi</button>
            <button onClick={masaAyirt} disabled={!r.claimed} style={tgoPill(!!r.claimed, r.claimed ? undefined : { background: '#f1efec', border: 'none', color: '#6F6459', cursor: 'not-allowed' })}>
              {r.claimed ? 'Masa ayırt' : 'Masa ayırtma kapalı'}
            </button>
          </div>
          {!r.claimed && <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6F6459' }}>Masa ayırtma ücretsizdir ve yalnızca kaydını sahiplenmiş mekanlarda açıktır; bu mekan henüz sahiplenilmedi.</p>}
          {bildirim && <p role="status" style={{ margin: '8px 0 0', fontSize: 14, color: '#0A7C46', fontWeight: 600 }}>{bildirim}</p>}

          <div style={{ marginTop: 22 }}>
            <b style={{ fontSize: 15 }}>İletişim ve sosyal medya</b>
            {iletisim.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {iletisim.map(([l, h]) => <a key={l} className="gw-kchip" onClick={() => izle(r.id, 'iletisim')} href={h} target={h.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{l}</a>)}
              </div>
            ) : <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6F6459' }}>Bu mekan için henüz iletişim bilgisi yok.</p>}
          </div>
        </div>
      </div>

      {r.menu?.length > 0 ? (
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 28, margin: '0 0 4px' }}>Menü</h2>
          <p style={{ margin: '0 0 14px', color: '#6F6459', fontSize: 14 }}>Sayfaya dokununca tam boy açılır.</p>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {r.menu.map((u, i) => (
              <button key={`${u}-${i}`} onClick={() => setBuyuk(u)} aria-label={`Menü sayfa ${i + 1}`} style={{ flexShrink: 0, width: 150, height: 210, borderRadius: 16, overflow: 'hidden', border: 'none', padding: 0, cursor: 'zoom-in', background: '#e8e0d8' }}>
                <Img src={u} style={{ width: '100%', height: '100%' }} bg="#e8e0d8" />
              </button>
            ))}
          </div>
        </section>
      ) : <p style={{ marginTop: 40, color: '#6F6459', fontSize: 14 }}>Menü henüz eklenmedi.</p>}

      <YorumBolumu r={r} />
      <Lightbox src={buyuk} onClose={() => setBuyuk(null)} />
    </div>
  );
}

// ───────────────────────── Favoriler ─────────────────────────
function FavoritesPageWeb() {
  const { depo, restaurants } = useApp();
  const liste = depo.favoriler.map((id) => restaurants.find((r) => String(r.id) === id)).filter(Boolean);
  return (
    <div>
      <PageHero light="Beğendiğin Yerler," bold="Hep Yanında!" sub={liste.length ? `${liste.length} mekan kayıtlı` : 'Henüz kayıtlı mekan yok'} compact />
      <div className="gw-wrap" style={{ paddingTop: 36, paddingBottom: 80 }}>
        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <span className="gw-tgo-ico" style={{ margin: '0 auto 18px' }}><Icon n="heart" size={28} color="#FF6600" /></span>
            <h2 style={{ fontSize: 24 }}>Kaydettiklerin burada</h2>
            <p style={{ color: '#6F6459', margin: '8px 0 24px' }}>Kaydırırken sağa attığın her mekan bu listeye düşüyor.</p>
            <Link to="/kesfet/swipe" style={tgoPill(true)}>Kaydırmaya başla</Link>
          </div>
        ) : <div className="gw-grid">{liste.map((r, i) => <RestaurantCard key={r.id} r={r} i={i} />)}</div>}
      </div>
    </div>
  );
}

// ───────────────────────── Profil ─────────────────────────
function ProfilSatir({ ikon, baslik, deger, onClick, son }) {
  const ic = (
    <>
      <span className="gw-tgo-ico" style={{ width: 36, height: 36, borderRadius: 999, margin: 0 }}><Icon n={ikon} size={16} color="#FF6600" /></span>
      <span style={{ flex: 1, fontWeight: 600 }}>{baslik}</span>
      {deger && <span style={{ color: '#6F6459', fontSize: 14 }}>{deger}</span>}
      {onClick && <span aria-hidden style={{ color: '#BDB4AA' }}>›</span>}
    </>
  );
  const stil = { display: 'flex', alignItems: 'center', gap: 13, minHeight: 56, padding: '10px 0', borderBottom: son ? 'none' : '1px solid #E3DCD2', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottomWidth: son ? 0 : 1, fontFamily: F, fontSize: 15 };
  return onClick
    ? <button onClick={onClick} style={{ ...stil, cursor: 'pointer', borderBottom: son ? 'none' : '1px solid #E3DCD2' }}>{ic}</button>
    : <div style={{ ...stil, borderBottom: son ? 'none' : '1px solid #E3DCD2' }}>{ic}</div>;
}

function ProfilePageWeb() {
  const nav = useNavigate();
  const { depo } = useApp();
  const [onay, setOnay] = useState(null); // 'cikis' | 'sil'
  const yorumSayisi = Object.values(depo.yorumlar).reduce((t, l) => t + l.length, 0);
  const ad = depo.kullanici?.ad;

  return (
    <div>
      <PageHero light="Merhaba" bold={`${ad ? ad.split(' ')[0] : 'Misafir'}!`} sub="Favorilerin, tercihlerin ve izinlerin burada." compact />
      <div className="gw-wrap" style={{ paddingTop: 36, paddingBottom: 80, maxWidth: 720 }}>
        <div className="gw-hover" style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 22, padding: 20, cursor: 'default' }}>
          <span style={{ width: 60, height: 60, borderRadius: 999, background: 'rgba(255,102,0,.08)', color: '#A84D09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>{(ad || 'G').slice(0, 1).toLocaleUpperCase('tr')}</span>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 18 }}>{ad || 'Misafir'}</b>
            <div style={{ color: '#6F6459', fontSize: 14 }}>{depo.kullanici?.email || 'Giriş yapılmadı'}</div>
          </div>
          {!depo.kullanici && <Link to="/giris" style={tgoPill(true, { padding: '10px 20px', fontSize: 14 })}>Giriş yap</Link>}
        </div>

        <div className="gw-tgo-facts" style={{ margin: '16px 0' }}>
          {[['Favori', depo.favoriler.length], ['Yorum', yorumSayisi]].map(([b, s]) => <div key={b}><span>{b}</span><b>{s}</b></div>)}
        </div>

        <div className="gw-hover" style={{ background: '#fff', borderRadius: 22, padding: '4px 20px', cursor: 'default' }}>
          <ProfilSatir ikon="pin" baslik="Konum" deger={depo.konum ? (depo.konum.ilce || 'Tarayıcıdan') : 'Kapalı'} onClick={() => nav('/konum/degistir')} />
          <ProfilSatir ikon="shield" baslik="Ölçümleme izni" deger={depo.riza === 'kabul' ? 'Açık' : 'Kapalı'} onClick={() => yaz({ riza: depo.riza === 'kabul' ? 'ret' : 'kabul' })} />
          <ProfilSatir ikon="chart" baslik="Bağlantı" deger="Yerel" son />
        </div>
        <p style={{ margin: '10px 4px 0', fontSize: 13, color: '#6F6459' }}>
          Sunucuya bağlı değil. Web sitesi yerel modda çalışıyor: favorilerin ve tercihlerin yalnızca bu tarayıcıda saklanıyor.
        </p>

        <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
          <button style={tgoPill(false, { width: '100%' })} onClick={() => setOnay('cikis')}>Çıkış yap</button>
          <button onClick={() => setOnay('sil')} style={{ minHeight: 44, background: 'none', border: 'none', cursor: 'pointer', color: '#C2282D', fontWeight: 600, fontFamily: F, fontSize: 14 }}>Hesabımı sil</button>
        </div>
      </div>

      {onay === 'cikis' && (
        <OnayKutusu baslik="Çıkış yapılsın mı?" metin="Favorilerin bu tarayıcıda kalır." onayMetin="Çıkış yap" onVazgec={() => setOnay(null)}
          onOnay={() => { yaz({ kullanici: null }); setOnay(null); nav('/'); }} />
      )}
      {onay === 'sil' && (
        <OnayKutusu baslik="Hesabın silinsin mi?" metin="Favorilerin, tercihlerin ve izinlerin bu tarayıcıdan kalıcı olarak silinir. Geri alınamaz." onayMetin="Sil" onVazgec={() => setOnay(null)}
          onOnay={() => { hepsiniSil(); setOnay(null); nav('/'); }} />
      )}
    </div>
  );
}

// ───────────────────────── Doyurucu: aktif restoranlar + harita (Booking tarzı) ─────────────────────────
export function DoyurucuBar() {
  return (
    <div className="gw-dbar">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Link to="/kesfet" aria-label="GUR ana menüye dön"><GurLogo size={30} pill /></Link><Link to="/doyurucu" aria-label="Doyurucu ana sayfa" className="gw-ib-etiket on"><Icon n="catalbicak" size={14} color="currentColor" strokeWidth={2.2} />DOYURUCU</Link></span>
      <nav aria-label="Doyurucu" style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto' }}>
        <NavLink to="/doyurucu/panel" className="gw-dlink"><Icon n="chart" size={15} color="currentColor" />İşletme paneli</NavLink>
        <NavLink to="/doyurucu/sahiplen" className="gw-dlink"><Icon n="shield" size={15} color="currentColor" />Kaydımı sahiplen</NavLink>
      </nav>
      <Link to="/doyurucu" className="gw-dlink" onClick={() => isletmeCikis()}>Çıkış</Link>
    </div>
  );
}

// Harita: OpenStreetMap karoları + puan etiketli iğneler (Booking'deki fiyat etiketi gibi, burada puan).
function HaritaKatmani({ ogeler, seciliId, onSec, gorunur, sigdir }) {
  const kap = useRef(null);
  const harita = useRef(null);
  const katman = useRef(null);
  const isaretler = useRef(new Map());
  const ilkSigdi = useRef(false);
  const secRef = useRef(onSec);
  secRef.current = onSec;
  const nav = useNavigate();
  const navRef = useRef(nav);
  navRef.current = nav;

  useEffect(() => {
    const m = L.map(kap.current, { zoomControl: true, scrollWheelZoom: true }).setView([40.9819, 28.8772], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }).addTo(m);
    katman.current = L.layerGroup().addTo(m);
    harita.current = m;
    return () => { m.remove(); harita.current = null; isaretler.current.clear(); };
  }, []);

  // İğneleri senkronla (popup metni textContent ile kuruluyor: veriden gelen metin HTML sayılmaz)
  useEffect(() => {
    const m = harita.current; if (!m) return;
    katman.current.clearLayers(); isaretler.current.clear();
    ogeler.forEach(({ r, lat, lng, h }) => {
      const mk = L.marker([lat, lng], {
        title: r.name, keyboard: true, riseOnHover: true,
        icon: L.divIcon({ className: 'gw-pinwrap', html: `<span class="gw-pin${h === 'sokak' || h === 'mahalle' ? ' yak' : ''}">${Number(r.rating).toFixed(1)}</span>`, iconSize: [46, 28], iconAnchor: [23, 28], popupAnchor: [0, -26] }),
      });
      const kutu = document.createElement('div');
      const ad = document.createElement('b'); ad.textContent = r.name;
      const alt = document.createElement('p'); alt.textContent = `${r.cat} · ★ ${r.rating}${r.ratingCount ? ` (${r.ratingCount.toLocaleString('tr-TR')})` : ''}`;
      const adr = document.createElement('p'); adr.textContent = r.addr || '';
      const yk = document.createElement('p'); yk.textContent = `Konum: ${HASSASIYET_METNI[h] || 'tam konum'}`; yk.style.color = '#6F6459'; yk.style.fontSize = '12px';
      const a = document.createElement('a'); a.textContent = 'Mekân sayfası →'; a.href = `/restoran/${r.id}`;
      a.addEventListener('click', (e) => { e.preventDefault(); navRef.current(`/restoran/${r.id}`); });
      kutu.append(ad, alt, adr, yk, a);
      mk.bindPopup(kutu, { closeButton: true, minWidth: 190 });
      mk.on('click', () => secRef.current(r.id));
      mk.addTo(katman.current);
      isaretler.current.set(String(r.id), mk);
    });
    if (!ilkSigdi.current && ogeler.length) {
      ilkSigdi.current = true;
      m.fitBounds(L.latLngBounds(ogeler.map((o) => [o.lat, o.lng])), { padding: [50, 50], maxZoom: 15 });
    }
  }, [ogeler]);

  // Seçili iğne: vurgula, haritayı oraya götür, popup aç
  useEffect(() => {
    isaretler.current.forEach((mk, id) => mk.getElement()?.querySelector('.gw-pin')?.classList.toggle('on', String(id) === String(seciliId)));
    const mk = isaretler.current.get(String(seciliId));
    const m = harita.current;
    if (mk && m) { m.flyTo(mk.getLatLng(), Math.max(m.getZoom(), 15), { duration: 0.6 }); setTimeout(() => mk.openPopup(), 450); }
  }, [seciliId, ogeler]);

  useEffect(() => {
    const m = harita.current;
    if (m && ogeler.length) m.fitBounds(L.latLngBounds(ogeler.map((o) => [o.lat, o.lng])), { padding: [50, 50], maxZoom: 15 });
  }, [sigdir]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (gorunur) setTimeout(() => harita.current?.invalidateSize(), 60); }, [gorunur]);

  return <div ref={kap} className="gw-bk-harita" role="application" aria-label="Restoran haritası" />;
}

const BK_SAYFA = 40;
export function RestoranHaritaPage() {
  // Müşteri sürümü: Keşfet'in alternatifi (liste + harita); işletme çubuğu, sahiplenme ve operatör etiketleri yok.
  const musteri = useLocation().pathname.startsWith('/kesfet');
  const { isFav, toggleFav } = useApp();
  const nav = useNavigate();
  const { restaurants } = useApp();
  const [q, setQ] = useState('');
  const [kategori, setKategori] = useState('');
  const [sira, setSira] = useState('puan');
  const [secili, setSecili] = useState(null);
  const [gorunum, setGorunum] = useState('liste');   // yalnızca dar ekranda: liste | harita
  const [surum, setSurum] = useState(0);              // adres önbelleği değişince yeniden çiz
  const [adet, setAdet] = useState(BK_SAYFA);
  const [ilerleme, setIlerleme] = useState(null);
  const [durum, setDurum] = useState('');
  const [sigdir, setSigdir] = useState(0);
  const iptal = useRef(null);

  const kategoriler = useMemo(() => CATEGORIES.map((c) => c.name).filter((n) => restaurants.some((r) => r.cat === n)), [restaurants]);
  const liste = useMemo(() => {
    const a = q.trim().toLocaleLowerCase('tr');
    const f = restaurants.filter((r) => (!kategori || r.cat === kategori)
      && (!a || `${r.name} ${r.cat} ${(r.tags || []).join(' ')} ${r.addr || ''}`.toLocaleLowerCase('tr').includes(a)));
    if (sira === 'puan') return [...f].sort((x, y) => y.rating - x.rating || (y.ratingCount || 0) - (x.ratingCount || 0));
    if (sira === 'yorum') return [...f].sort((x, y) => (y.ratingCount || 0) - (x.ratingCount || 0));
    if (sira === 'ad') return [...f].sort((x, y) => x.name.localeCompare(y.name, 'tr'));
    return f;
  }, [restaurants, q, kategori, sira]);
  useEffect(() => { setAdet(BK_SAYFA); }, [q, kategori, sira]);

  const ogeler = useMemo(
    () => liste.map((r) => ({ r, k: koordinat(r) })).filter((x) => x.k).map((x) => ({ r: x.r, lat: x.k.lat, lng: x.k.lng, h: x.k.hassasiyet })),
    [liste, surum], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const haritadaki = ogeler.length;
  const calisiyor = !!ilerleme;

  const durdur = () => { iptal.current?.abort(); };
  // Müşteri haritası açılır açılmaz ilk 30 mekânı yerleştirmeye başlar (önbellektekiler anında gelir); sayfadan çıkınca durur.
  useEffect(() => { if (musteri) konumlariBul(); return () => iptal.current?.abort(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const konumlariBul = async () => {
    const ac = new AbortController(); iptal.current = ac;
    const hedef = liste.filter((r) => !koordinat(r) && !bulunamadi(r)).slice(0, musteri ? 30 : 60);                // her turda en çok 60 mekân; devam etmek için tekrar basılır
    setDurum(''); setIlerleme({ biten: 0, toplam: hedef.filter((r) => !koordinat(r) && !bulunamadi(r)).length, ad: '' });
    await topluCoz(hedef, {
      sinyal: ac.signal,
      ilerle: (biten, toplam, r) => { setIlerleme({ biten, toplam, ad: r.name }); setSurum((s) => s + 1); },
    });
    if (iptal.current !== ac) return;   // daha yeni bir çalıştırma başladıysa eskisi durumu ezmesin
    setIlerleme(null); setSurum((s) => s + 1); setSigdir((s) => s + 1);
    if (ac.signal.aborted) setDurum('Durduruldu.');
  };

  const haritadaGoster = async (r) => {
    setSecili(r.id); setGorunum('harita'); setDurum('');
    if (!koordinat(r)) {
      setDurum(`${r.name}: adresten konum aranıyor…`);
      try {
        const k = await coz(r);
        setSurum((s) => s + 1);
        setDurum(k ? '' : `${r.name}: adresten konum bulunamadı.`);
      } catch { setDurum('Konum servisine ulaşılamadı. Biraz sonra tekrar dene.'); }
    }
  };
  const haritadanSec = (id) => {
    setSecili(id);
    const i = liste.findIndex((r) => String(r.id) === String(id));
    if (i >= adet) setAdet(i + 1);
    setTimeout(() => document.getElementById(`dr-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 80);
  };

  return (
    <div className={`gw-bk ${musteri ? 'musteri' : ''}`}>
      {!musteri && <DoyurucuBar />}
      <div className="gw-bk-tools">
        <div className="gw-bk-search">
          <Icon n="search" size={18} color="#2A140C" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Restoran, mutfak ya da mahalle ara" aria-label="Restoran ara" />
        </div>
        <select value={kategori} onChange={(e) => setKategori(e.target.value)} aria-label="Kategori">
          <option value="">Tüm kategoriler</option>{kategoriler.map((k) => <option key={k}>{k}</option>)}
        </select>
        <select value={sira} onChange={(e) => setSira(e.target.value)} aria-label="Sırala">
          <option value="puan">Puana göre</option><option value="yorum">Değerlendirme sayısına göre</option><option value="ad">Ada göre (A–Z)</option><option value="yakin">Konuma göre</option>
        </select>
        {calisiyor
          ? <button style={tgoPill(false, { padding: '10px 18px', fontSize: 14 })} onClick={durdur}>Durdur</button>
          : <button style={tgoPill(true, { padding: '10px 18px', fontSize: 14 })} onClick={konumlariBul}><Icon n="pin" size={15} color="#fff" />{musteri ? 'Haritaya daha fazla ekle' : 'Konumları bul'}</button>}
        <button style={tgoPill(false, { padding: '10px 18px', fontSize: 14 })} onClick={() => setSigdir((s) => s + 1)} disabled={!haritadaki}>Haritayı sığdır</button>
      </div>
      <div className="gw-bk-stat" aria-live="polite">
        <b>{liste.length}</b> {musteri ? 'restoran' : 'aktif restoran'} · <b>{haritadaki}</b> haritada
        {calisiyor && <span> · adresler çözülüyor: {ilerleme.biten}/{ilerleme.toplam}{ilerleme.ad ? ` — ${ilerleme.ad}` : ''}</span>}
        {durum && <span style={{ color: '#C2282D' }}> · {durum}</span>}
        <span className="gw-bk-not">{musteri ? 'Konumlar adreslerden OpenStreetMap ile bulunur; noktalı çerçeveli iğneler yaklaşık konumu gösterir.' : 'Mekân koordinatı listede yok; iğneler OpenStreetMap (Nominatim) ile bulunur (önce mekân adı, sonra sokak, sonra mahalle). Yaklaşık olanlar iğnede noktalı çerçeveyle, listede “yaklaşık” diye işaretlenir. Saniyede 1 istek gider.'}</span>
      </div>
      <div className="gw-bk-tab" role="tablist" aria-label="Görünüm">
        <button role="tab" aria-selected={gorunum === 'liste'} className={gorunum === 'liste' ? 'on' : ''} onClick={() => setGorunum('liste')}>Liste</button>
        <button role="tab" aria-selected={gorunum === 'harita'} className={gorunum === 'harita' ? 'on' : ''} onClick={() => setGorunum('harita')}>Harita</button>
      </div>

      <div className={`gw-bk-body g-${gorunum}`}>
        <div className="gw-bk-list">
          {liste.length === 0 && <p style={{ padding: 24, color: '#6F6459' }}>Eşleşen restoran yok.</p>}
          {liste.slice(0, adet).map((r) => {
            const k = koordinat(r); const on = String(secili) === String(r.id);
            return (
              <article key={r.id} id={`dr-${r.id}`} className={`gw-bk-item ${on ? 'on' : ''}`} onClick={() => setSecili(r.id)}>
                <Img src={r.imgs?.[0]} style={{ width: 128, minHeight: 128, borderRadius: 14, flexShrink: 0 }} bg="#e8e0d8" />
                <div className="gw-bk-info">
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Link to={`/restoran/${r.id}`} style={{ fontWeight: 700, fontSize: 17, color: '#2A140C' }}>{r.name}</Link>
                    <span className="gw-bk-puan" title={`${r.rating} / 5`}>{Number(r.rating).toFixed(1)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6F6459' }}>{r.cat}{r.tags?.[1] ? ` · ${r.tags[1]}` : ''}{r.ratingCount ? ` · ${r.ratingCount.toLocaleString('tr-TR')} değerlendirme` : ''}</div>
                  <div style={{ fontSize: 13, color: '#4A443E' }}>{r.addr}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                    {!musteri && <span className="gw-durum ok">● Aktif</span>}
                    {!musteri ? <span className={`gw-durum ${r.claimed ? 'ok' : ''}`}>{r.claimed ? 'Sahiplenildi' : 'Sahiplenilmedi'}</span> : r.gastro ? <span className="gw-durum ok">★ Gastro Onaylı</span> : null}
                    {k ? <span className={`gw-durum ${yaklasikMi(k) ? '' : 'ok'}`}>Haritada · {HASSASIYET_METNI[k.hassasiyet]}</span> : bulunamadi(r) ? <span className="gw-durum">Adres bulunamadı</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <button className="gw-bk-btn on" onClick={(e) => { e.stopPropagation(); haritadaGoster(r); }}><Icon n="pin" size={14} color="currentColor" />Haritada göster</button>
                    <button className="gw-bk-btn" onClick={(e) => { e.stopPropagation(); nav(`/restoran/${r.id}`); }}>Mekân sayfası</button>
                    {!musteri && !r.claimed && <button className="gw-bk-btn" onClick={(e) => { e.stopPropagation(); nav(`/doyurucu/sahiplen?id=${encodeURIComponent(r.id)}`); }}>Sahiplen</button>}
                    {musteri && <button className="gw-bk-btn" aria-pressed={isFav(r)} onClick={(e) => { e.stopPropagation(); toggleFav(r); }}>{isFav(r) ? '♥ Kaydedildi' : '♡ Kaydet'}</button>}
                  </div>
                </div>
              </article>
            );
          })}
          {adet < liste.length && <div style={{ padding: 18, textAlign: 'center' }}><button style={tgoPill(false, { padding: '10px 20px', fontSize: 14 })} onClick={() => setAdet((a) => a + BK_SAYFA)}>Daha fazla göster ({liste.length - adet})</button></div>}
        </div>
        <div className="gw-bk-mapwrap">
          <HaritaKatmani ogeler={ogeler} seciliId={secili} onSec={haritadanSec} gorunur={gorunum === 'harita'} sigdir={sigdir} />
          {haritadaki === 0 && !calisiyor && (
            <div className="gw-bk-bos" role="status">
              <b>Henüz haritada restoran yok</b>
              <span>“Konumları bul” ile listedeki restoranların adreslerini haritaya yerleştir ya da bir restoranda “Haritada göster”e bas.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Telefon / masaüstü ayrımı ─────────────────────────
// ≤700 px'te mobil uygulamanın ekranlarına benzeyen görünüm (GurMobilWeb.jsx), üstünde masaüstü sitesi.
export function HomePage() { return useMobil() ? <MobilKarsilama /> : <HomePageWeb />; }
export function ExplorePage() { return <KesfetApp />; }
export function DetailPage() { return useMobil() ? <MobilDetay /> : <DetailPageWeb />; }
export function FavoritesPage() { return useMobil() ? <MobilFavoriler /> : <FavoritesPageWeb />; }
export function ProfilePage() { return <ProfilApp />; }
