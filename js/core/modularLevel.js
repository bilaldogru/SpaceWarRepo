/**
 * @file modularLevel.js
 * @description Geriye dönük uyumluluk için re-export köprüsü.
 *
 * Asıl kod js/core/level/ klasörüne ayrıştırıldı:
 *   constants.js    → Sabit veriler (MODULES, ödül tabloları, kalkan config)
 *   utils.js        → Yardımcı fonksiyonlar (mesafe, clamp, spawn vb.)
 *   shieldSystem.js → Kalkan modülü sistemi
 *   waveSystem.js   → Dalga ve spawn yönetimi
 *   moduleSystem.js → Taret satın alma ve sürükleme
 *   hudSystem.js    → HUD güncelleme
 *   combatSystem.js → Savaş fiziği ve düşman mantığı
 *   renderSystem.js → Canvas çizim sistemi
 *   index.js        → createModularLevel fabrika fonksiyonu
 *
 * Bu dosyayı import eden mevcut kodlar (levels/astra.js vb.) bozulmadan
 * çalışmaya devam eder. Yeni kod doğrudan level/index.js'i kullanabilir:
 *   import { createModularLevel, MODULES } from './level/index.js';
 */
export { createModularLevel, MODULES } from './level/index.js';
