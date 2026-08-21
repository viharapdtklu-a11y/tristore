/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Store, MapPin, Phone, Percent, ShieldAlert, CheckCircle, Save, 
  Smartphone, Monitor, Download, FileSpreadsheet, HelpCircle, 
  RefreshCw, Sparkles, Check, AlertTriangle 
} from 'lucide-react';
import { StoreSettings, SyncConfig } from '../types';
import { initializeGoogleSheets } from '../utils/syncService';

interface SettingsTabProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings, silent?: boolean, persistToServer?: boolean) => void;
  syncConfig: SyncConfig;
  onUpdateSyncConfig: (cfg: SyncConfig) => void;
  onTriggerSync: () => Promise<void>;
  onPullFromSheets: () => Promise<void>;
  isSyncing: boolean;
  onOpenSyncGuide: () => void;
}

export default function SettingsTab({ 
  settings, 
  onSaveSettings,
  syncConfig,
  onUpdateSyncConfig,
  onTriggerSync,
  onPullFromSheets,
  isSyncing,
  onOpenSyncGuide
}: SettingsTabProps) {
  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [isTaxEnabled, setIsTaxEnabled] = useState(settings.isTaxEnabled);
  const [taxPercentage, setTaxPercentage] = useState(settings.taxPercentage);
  const [isSaved, setIsSaved] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Focus tracking to prevent real-time cloud background poll from overwriting active inputs
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isSheetsUrlFocused, setIsSheetsUrlFocused] = useState(false);

  // Local Google Sheets sync state
  const [localSheetsUrl, setLocalSheetsUrl] = useState(syncConfig.googleSheetsUrl || '');

  // Auto-sheets initialization states
  const [isInitializingSheets, setIsInitializingSheets] = useState(false);
  const [initFeedback, setInitFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);
  const showToast = (message: string, type: 'success' | 'warning' = 'warning') => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  };

  const propagateState = (updatedFields: Partial<StoreSettings>, persistToServer = false) => {
    onSaveSettings({
      name: updatedFields.name !== undefined ? updatedFields.name : name,
      address: updatedFields.address !== undefined ? updatedFields.address : address,
      phone: updatedFields.phone !== undefined ? updatedFields.phone : phone,
      isTaxEnabled: updatedFields.isTaxEnabled !== undefined ? updatedFields.isTaxEnabled : isTaxEnabled,
      taxPercentage: updatedFields.taxPercentage !== undefined ? updatedFields.taxPercentage : taxPercentage,
    }, true, persistToServer);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    propagateState({ name: val }, false);
  };

  const handleNameBlur = () => {
    setIsNameFocused(false);
    propagateState({ name }, true);
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    propagateState({ address: val }, false);
  };

  const handleAddressBlur = () => {
    setIsAddressFocused(false);
    propagateState({ address }, true);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    propagateState({ phone: val }, false);
  };

  const handlePhoneBlur = () => {
    setIsPhoneFocused(false);
    propagateState({ phone }, true);
  };

  const handleTaxToggleChange = (checked: boolean) => {
    setIsTaxEnabled(checked);
    propagateState({ isTaxEnabled: checked }, true);
  };

  const handleTaxPercentageChange = (val: number) => {
    setTaxPercentage(val);
    propagateState({ taxPercentage: val }, true);
  };

  const handleAutoInitSheets = async () => {
    if (!localSheetsUrl) {
      showToast("Silakan masukkan URL Google Apps Script Web App terlebih dahulu!", 'warning');
      return;
    }
    
    // Auto-save the connection URL
    onUpdateSyncConfig({
      ...syncConfig,
      googleSheetsUrl: localSheetsUrl,
      isEnabled: true
    });

    setIsInitializingSheets(true);
    setInitFeedback(null);
    try {
      const res = await initializeGoogleSheets(localSheetsUrl);
      setInitFeedback({ success: res.success, message: res.message });
      setTimeout(() => setInitFeedback(null), 6000);
    } catch (err: any) {
      setInitFeedback({ success: false, message: err.message || 'Gagal terhubung ke Google Sheets!' });
      setTimeout(() => setInitFeedback(null), 6000);
    } finally {
      setIsInitializingSheets(false);
    }
  };

  const handleTriggerSyncWrapper = async () => {
    if (!localSheetsUrl) {
      showToast("Silakan masukkan URL Google Apps Script Web App terlebih dahulu!", 'warning');
      return;
    }

    // Auto-save connection
    onUpdateSyncConfig({
      ...syncConfig,
      googleSheetsUrl: localSheetsUrl,
      isEnabled: true
    });

    // Run action
    setTimeout(async () => {
      await onTriggerSync();
    }, 150);
  };

  const handlePullFromSheetsWrapper = async () => {
    if (!localSheetsUrl) {
      showToast("Silakan masukkan URL Google Apps Script Web App terlebih dahulu!", 'warning');
      return;
    }

    // Auto-save connection
    onUpdateSyncConfig({
      ...syncConfig,
      googleSheetsUrl: localSheetsUrl,
      isEnabled: true
    });

    // Run action
    setTimeout(async () => {
      await onPullFromSheets();
    }, 150);
  };

  // Keep local inputs fully synchronized with server updates in real-time unless focused/edited
  useEffect(() => {
    if (!isNameFocused) setName(settings.name);
  }, [settings.name]);

  useEffect(() => {
    if (!isAddressFocused) setAddress(settings.address);
  }, [settings.address]);

  useEffect(() => {
    if (!isPhoneFocused) setPhone(settings.phone);
  }, [settings.phone]);

  useEffect(() => {
    setIsTaxEnabled(settings.isTaxEnabled);
    setTaxPercentage(settings.taxPercentage);
  }, [settings.isTaxEnabled, settings.taxPercentage]);

  useEffect(() => {
    if (!isSheetsUrlFocused) {
      setLocalSheetsUrl(syncConfig.googleSheetsUrl || '');
    }
  }, [syncConfig]);

  useEffect(() => {
    // Check if prompt is already stored globally
    if ((window as any).deferredPrompt) {
      setInstallPrompt((window as any).deferredPrompt);
    }

    const handlePrompt = () => {
      setInstallPrompt((window as any).deferredPrompt);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('pwa-prompt-available', handlePrompt);
    window.addEventListener('pwa-installed', handleInstalled);

    // Also check standard window.matchMedia if running standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePrompt);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = installPrompt || (window as any).deferredPrompt;
    if (!promptEvent) return;
    
    // Show the install prompt
    promptEvent.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clear deferredPrompt since it can only be used once
    (window as any).deferredPrompt = null;
    setInstallPrompt(null);
  };

  const handleSaveSyncConfig = () => {
    onUpdateSyncConfig({
      ...syncConfig,
      googleSheetsUrl: localSheetsUrl,
      isEnabled: true
    });
    showToast("Koneksi Google Sheets berhasil disimpan & disinkronkan!", "success");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      name,
      address,
      phone,
      isTaxEnabled,
      taxPercentage
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 relative animate-fade-in pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-55 p-3.5 px-5 rounded-2xl shadow-xl border flex items-center gap-2.5 bg-white dark:bg-slate-900 border-amber-100 dark:border-amber-900 text-slate-800 dark:text-slate-100 min-w-[300px] animate-fade-in">
          <div className="p-1 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-500 shrink-0">
            <AlertTriangle size={15} />
          </div>
          <span className="text-xs font-bold leading-normal">{toast.message}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Store className="text-[#78c953]" size={18} />
          Menu Pengaturan Aplikasi & POS
        </h2>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
          Konfigurasi identitas toko fisik, aturan pajak penjualan, sistem pencadangan awan otomatis dengan Google Sheets, serta pengaturan instalasi PWA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SUB-JUDUL 1: PROFIL IDENTITAS TOKO */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
              <Store size={14} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">I. Profil Identitas Toko</h3>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">Informasi utama yang akan tercetak di header struk belanja pelanggan</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-450 dark:text-slate-500 block mb-1">Nama Toko (Header Struk)</label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-[#78c953] transition-all">
                <Store className="text-slate-400 dark:text-slate-500" size={15} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={handleNameBlur}
                  placeholder="Contoh: COFFEE SHOP MENTENG"
                  className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold text-slate-450 dark:text-slate-500 block mb-1">Alamat Operasional Toko</label>
              <div className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-[#78c953] transition-all">
                <MapPin className="text-slate-400 dark:text-slate-500 mt-0.5" size={15} />
                <textarea
                  required
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => setIsAddressFocused(true)}
                  onBlur={handleAddressBlur}
                  placeholder="Contoh: Jl. Menteng Raya No. 12, Jakarta Pusat"
                  rows={2}
                  className="w-full bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold text-slate-450 dark:text-slate-500 block mb-1">Nomor Telepon Kontak</label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-[#78c953] transition-all">
                <Phone className="text-slate-400 dark:text-slate-500" size={15} />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={handlePhoneBlur}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUB-JUDUL 2: KONFIGURASI PERPAJAKAN TOKO */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="p-1.5 bg-[#78c953]/10 text-[#78c953] rounded-lg shrink-0">
              <Percent size={14} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">II. Kebijakan Pajak Penjualan (PPN)</h3>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">Atur kewajiban pungutan PPN otomatis di kasir pembayaran</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex gap-2 items-center">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-xs block">Aktifkan Pungutan Pajak PPN</span>
                  <span className="text-[9px] text-slate-450 dark:text-slate-500">Tambahkan beban PPN otomatis pada lembar kalkulasi transaksi</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isTaxEnabled}
                  onChange={(e) => handleTaxToggleChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-750 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#78c953]"></div>
              </label>
            </div>

            {isTaxEnabled ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-start gap-2">
                  <ShieldAlert className="text-[#78c953] mt-0.5 shrink-0" size={14} />
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-normal">
                    Kasir saat ini mengenakan PPN sebesar <strong>{taxPercentage}%</strong> pada setiap checkout penjualan. Nilai ini dihitung setelah diskon transaksi dipotong.
                  </p>
                </div>
                
                <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Persentase Tarif PPN (%)</label>
                  <div className="flex items-center gap-1.5 p-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-[#78c953] focus-within:ring-1 focus-within:ring-[#78c953] rounded-lg max-w-[120px] transition-all">
                    <Percent size={13} className="text-slate-400 dark:text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={taxPercentage}
                      onChange={(e) => handleTaxPercentageChange(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-full bg-transparent font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none text-right"
                    />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl flex items-start gap-2">
                <ShieldAlert className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" size={14} />
                <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-normal">
                  Pajak PPN dinonaktifkan. Jumlah nilai pajak pada struk checkout kasir akan selalu tercatat <strong>Rp 0 (Bebas Pajak)</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button Profile & Tax */}
        <div className="flex gap-2 justify-end items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {isSaved && (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 text-xs font-bold mr-2">
              <CheckCircle size={15} />
              Pengaturan Profil Toko & Pajak Tersimpan !
            </div>
          )}

          <button
            type="submit"
            className="p-2.5 px-6 bg-[#78c953] hover:bg-[#68b544] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-100 dark:shadow-none"
          >
            <Save size={14} />
            Simpan Identitas & Pajak
          </button>
        </div>
      </form>

      {/* SUB-JUDUL 3: INTEGRASI GOOGLE SHEETS */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-[#78c953] rounded-lg shrink-0">
              <FileSpreadsheet size={14} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">III. Sinkronisasi Cloud Google Sheets</h3>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">Hubungkan data stok barang & histori penjualan kasir secara nirkabel</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSyncGuide}
            className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[9px] font-bold cursor-pointer transition-colors flex items-center gap-1"
          >
            <HelpCircle size={11} />
            Buku Panduan Setup
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">URL Google Apps Script Web App</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Tempelkan URL Google Apps Script Web App (/exec)..."
                  value={localSheetsUrl}
                  onChange={(e) => setLocalSheetsUrl(e.target.value)}
                  onFocus={() => setIsSheetsUrlFocused(true)}
                  onBlur={() => setIsSheetsUrlFocused(false)}
                  className="flex-1 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-[#78c953] transition-all"
                />
                <button
                  type="button"
                  onClick={handleSaveSyncConfig}
                  className="p-2.5 px-4 bg-slate-850 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0 font-sans"
                >
                  <Save size={14} />
                  Simpan Koneksi
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
              <button
                type="button"
                onClick={handleTriggerSyncWrapper}
                disabled={!localSheetsUrl || isSyncing}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-sans"
                title="Unggah (Upload) semua data produk, kategori, dan transaksi lokal ke Google Sheets Anda."
              >
                {isSyncing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Sync Sekarang
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePullFromSheetsWrapper}
                disabled={!localSheetsUrl || isSyncing}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-sans"
                title="Unduh (Download) semua data produk, kategori, dan transaksi dari Google Sheets Anda ke perangkat ini."
              >
                {isSyncing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Mengunduh...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Tarik Data (Download)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAutoInitSheets}
                disabled={!localSheetsUrl || isInitializingSheets}
                className="p-2.5 px-4 bg-[#78c953] hover:bg-[#68b544] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-sans"
                title="Inisialisasi semua target sheet (Sheet_Produk, Sheet_Kategori, Sheet_Transaksi) secara otomatis di Google Spreadsheet Anda tanpa setup sendiri!"
              >
                {isInitializingSheets ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Buat Sheet Otomatis
                  </>
                )}
              </button>
            </div>

            {/* Shareable Link Block for syncing other devices */}
            {syncConfig.googleSheetsUrl && (
              <div className="pt-3 border-t border-slate-200/30 dark:border-slate-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                    Link Sinkronisasi Instan (Multi-Browser & Perangkat)
                  </span>
                  <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950 text-emerald-850 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full select-none">
                    Rekomendasi
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">
                  Buka tautan ini di browser lain atau perangkat kasir tambahan untuk secara otomatis menyambungkan konfigurasi Google Sheets ini secara nirkabel!
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?sheetsUrl=${encodeURIComponent(syncConfig.googleSheetsUrl)}`}
                    className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-mono text-slate-600 dark:text-slate-400 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const syncLink = `${window.location.origin}${window.location.pathname}?sheetsUrl=${encodeURIComponent(syncConfig.googleSheetsUrl)}`;
                      navigator.clipboard.writeText(syncLink);
                      showToast("Link sinkronisasi disalin ke clipboard!", "success");
                    }}
                    className="p-2 px-3 bg-slate-800 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 shrink-0 cursor-pointer transition-colors"
                  >
                    <Save size={12} />
                    Salin Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {initFeedback && (
          <div className={`p-3 rounded-xl text-xs font-semibold border ${initFeedback.success ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'}`}>
            {initFeedback.message}
          </div>
        )}

        {syncConfig.lastSyncedAt && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold flex items-center gap-1">
            <Check size={12} />
            Histori Sinkronisasi Cloud: {new Date(syncConfig.lastSyncedAt).toLocaleString('id-ID')}
          </p>
        )}
      </div>

      {/* SUB-JUDUL 4: INSTALASI PWA */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-lg shrink-0">
              <Smartphone size={14} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">IV. Aplikasi Kasir Seluler Standalone (PWA)</h3>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">Instal aplikasi di desktop, HP Android, atau iPhone untuk akses cepat offline</p>
            </div>
          </div>
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${
            isInstalled 
              ? "bg-emerald-50 text-[#78c953] border-emerald-100" 
              : "bg-amber-50 text-amber-700 border-amber-100"
          }`}>
            {isInstalled ? "Terpasang (Aplikasi)" : "Bisa Diinstal"}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#78c953] shadow-md p-1 shrink-0 relative overflow-hidden flex items-center justify-center">
            <img 
              src="/icon.jpg" 
              alt="PWA Icon" 
              className="w-full h-full object-cover rounded-[10px]"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://picsum.photos/seed/kopi/120/120";
              }}
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Kasir Pintar Pro - Standalone POS</h4>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Jalankan aplikasi kasir langsung dari layar utama ponsel pintar atau laptop Anda dengan mode layar penuh, respons cepat, dan bebas beban loading browser eksternal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
          {/* Android / Desktop Install Block */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                <Monitor size={12} className="text-[#78c953]" />
                <span>Untuk Android & Windows/Mac</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[9px] mt-0.5">
                Cari simbol instalasi (ikon unduh) di sebelah kanan kolom pencarian browser Chrome atau klik tombol pasang di bawah ini.
              </p>
            </div>
            
            <div className="pt-2">
              {installPrompt ? (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="w-full p-2 bg-[#78c953] hover:bg-[#68b544] text-white font-extrabold rounded-lg text-[9px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs font-sans"
                >
                  <Download size={11} />
                  Pasang Aplikasi Sekarang
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-lg text-[9px] flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200 dark:border-slate-800"
                >
                  <CheckCircle size={10} />
                  Sudah Terpasang / Siap
                </button>
              )}
            </div>
          </div>

          {/* iOS / Safari Manual Block */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                <Smartphone size={12} className="text-blue-500" />
                <span>Instalasi iPhone / Safari</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[9px] mt-0.5 leading-normal">
                Buka web ini lewat browser Safari iPhone, klik tombol <strong className="text-slate-700 dark:text-slate-300 font-bold">Share (Bagikan)</strong> di bawah layar, lalu pilih <strong className="text-slate-700 dark:text-slate-300 font-bold">Tambahkan ke Layar Utama</strong>.
              </p>
            </div>
            <div className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-1.5 rounded-md text-center border border-slate-150 dark:border-slate-800">
              Ikon Kasir Hijau Akan Terpasang di Layar Utama HP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
