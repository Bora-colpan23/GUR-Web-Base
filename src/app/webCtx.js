// Ortak bağlam: GurWeb (masaüstü) ve GurMobilWeb (telefon) aynı veriyi buradan okur.
// Ayrı dosya olmasının sebebi: iki modülün birbirini içe aktarıp döngüye girmemesi.
import { createContext, useContext } from 'react';

export const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
