import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { X, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  isFirebaseConfigured,
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
} from '../services/firebase';

export default function FirebaseConfigModal({ isOpen, onClose }) {
  const currentConfig = getStoredFirebaseConfig() || {};
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!projectId || !apiKey) {
      toast.error('Please provide at least a Project ID and API Key.');
      return;
    }
    toast.success('Firebase configuration saved. Connecting...');
    saveFirebaseConfig({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    });
  };

  const handleResetToLocal = () => {
    toast.info('Switching to local storage mode...');
    clearFirebaseConfig();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe/Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Database Configuration
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Firebase Firestore & Local Store Settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto touch-scroll pb-safe">
          {/* Current Connection Status */}
          <div
            className={`p-3 sm:p-3.5 rounded-xl border flex items-start gap-3 ${
              isFirebaseConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isFirebaseConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs sm:text-sm font-bold">
                {isFirebaseConfigured
                  ? 'Connected to Firebase Firestore'
                  : 'Running in Local Reactive Mode'}
              </h4>
              <p className="text-xs mt-0.5 opacity-90">
                {isFirebaseConfigured
                  ? `Active project: ${currentConfig.projectId}. Real-time synchronization active.`
                  : 'Using local storage. You can enter Firebase credentials below or set Vite env variables.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. apartment-booking-123"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[44px] sm:min-h-[36px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[44px] sm:min-h-[36px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  placeholder="project.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[44px] sm:min-h-[36px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  placeholder="1:123456:web:abcd"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[44px] sm:min-h-[36px]"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {isFirebaseConfigured ? (
                <button
                  type="button"
                  onClick={handleResetToLocal}
                  className="text-xs text-slate-500 hover:text-slate-800 underline text-center sm:text-left py-1"
                >
                  Reset to Local Storage
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 min-h-[42px] flex items-center justify-center touch-manipulation"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs min-h-[42px] flex items-center justify-center touch-manipulation"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
