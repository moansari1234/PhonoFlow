import React, { useState } from "react";
import { Settings, Trash2, ShieldCheck, Download, Check, AlertTriangle } from "lucide-react";
import { UserProgressState } from "../types";

interface SettingsViewProps {
  progress: UserProgressState;
  onClearProgress: () => void;
  STORAGE_KEY: string;
}

export function SettingsView({ progress, onClearProgress, STORAGE_KEY }: SettingsViewProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const data = localStorage.getItem(STORAGE_KEY) || JSON.stringify(progress);
    navigator.clipboard.writeText(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 sm:pb-8">
      {/* Settings Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 text-emerald-600 mb-2">
          <Settings className="w-6 h-6" />
          <h1 className="text-2xl font-serif font-black text-neutral-900 tracking-tight">
            Application Settings
          </h1>
        </div>
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
          Manage your local application data and preferences. PhonoFlow is a privacy-first, offline-capable application. All your acoustic practice data and progress analytics are stored entirely locally on your device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Privacy & Export */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-neutral-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold font-serif">Data & Privacy</h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Your audio recordings and practice attempts are processed in real-time and saved directly to your browser's local storage. We do not upload your voice to any external servers.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold text-xs sm:text-sm border border-neutral-200 rounded-xl transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Progress Data (JSON)</span>
              </>
            )}
          </button>
        </div>

        {/* Danger Zone: Clear Data */}
        <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <AlertTriangle className="w-24 h-24 text-rose-600" />
          </div>
          <div className="space-y-3 relative z-10">
            <div className="flex items-center space-x-2 text-rose-700">
              <Trash2 className="w-5 h-5" />
              <h2 className="text-lg font-bold font-serif">Danger Zone</h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Permanently erase all your practice history, diagnostic baselines, and masteries from this device. This action cannot be undone.
            </p>
          </div>

          <div className="relative z-10">
            {!showConfirmClear ? (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs sm:text-sm border border-rose-200 rounded-xl transition-all"
              >
                <span>Clear All Local Progress</span>
              </button>
            ) : (
              <div className="flex flex-col space-y-2 animate-in fade-in zoom-in duration-200">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 text-center">
                  Are you absolutely sure?
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearProgress();
                      setShowConfirmClear(false);
                    }}
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Yes, Erase Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
