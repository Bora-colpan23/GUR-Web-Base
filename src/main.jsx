import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import AdminKapi from './admin/AdminKapi.jsx';
import {
  GurWebLayout, SiteShell, HomePage, WelcomePage, LoginPage, RegisterPage, KonumPage,
  DoyurucuRegisterPage, RestoranHaritaPage,
  ExplorePage, SwipePage, DetailPage, FavoritesPage, ProfilePage,
} from './app/GurWeb.jsx';
import { GurmePage } from './app/GurGurme.jsx';
import { IsletmeLandingPage, IsletmeGirisPage, IsletmeSahiplenPage, IsletmePanelPage } from './app/GurBusinessWeb.jsx';

// GUR web sitesi (mobil uygulamanın son sürümünün web karşılığı) + GUR İşletme (Doyurucu) + yönetici paneli
//   /                 Ana sayfa       /giris (?kayit=1)     Giriş / kayıt (tek ekran)     /konum  Konum seçimi
//   /kesfet           Keşfet          /kesfet/swipe         Kaydır (sağa kaydet · sola geç · yukarı detaylar)
//   /kesfet/harita    Liste + harita (Booking tarzı): kaydırmaya alternatif, bünyedeki restoranlar
//   /restoran/:id     Mekân detayı    /favoriler, /profil
//   /doyurucu         GUR İşletme: kurumsal tanıtım (neden sahiplenmeli)
//   /doyurucu/giris   İşletme hesabı  /doyurucu/sahiplen    Kaydını bul → doğrula → başvur
//   /doyurucu/panel   Etkileşim, bilgiler, masa talepleri
//   /doyurucu/kayit   Havuzda olmayan mekân için yeni kayıt (3 adım)
//   /admin            Yönetici paneli
const router = createBrowserRouter([
  {
    element: <GurWebLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/baslayin', element: <WelcomePage /> },
      { path: '/giris', element: <LoginPage /> },
      { path: '/kayit', element: <RegisterPage /> },
      { path: '/gurme', element: <GurmePage /> },
      { path: '/konum', element: <KonumPage /> },
      { path: '/konum/degistir', element: <KonumPage /> },
      { path: '/doyurucu', element: <IsletmeLandingPage /> },
      { path: '/doyurucu/giris', element: <IsletmeGirisPage /> },
      { path: '/doyurucu/sahiplen', element: <IsletmeSahiplenPage /> },
      { path: '/doyurucu/panel', element: <IsletmePanelPage /> },
      { path: '/doyurucu/restoranlar', element: <Navigate to="/kesfet/harita" replace /> },
      { path: '/doyurucu/kayit', element: <DoyurucuRegisterPage /> },
      {
        element: <SiteShell />,
        children: [
          { path: '/kesfet', element: <ExplorePage /> },
          { path: '/kesfet/swipe', element: <SwipePage /> },
          { path: '/kesfet/harita', element: <RestoranHaritaPage /> },
          { path: '/restoran/:id', element: <DetailPage /> },
          { path: '/favoriler', element: <FavoritesPage /> },
          { path: '/profil', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '/admin', element: <AdminKapi /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
