import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { X, Database, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Database Configuration
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Firebase Firestore & Local Store Settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current Connection Status */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
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
                  ? `Active project: ${currentConfig.projectId}. Real-time synchronization is enabled.`
                  : 'Using local reactive state. You can enter Firebase credentials below or set Vite environment variables to sync with live Firestore.'}
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
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {isFirebaseConfigured ? (
                <button
                  type="button"
                  onClick={handleResetToLocal}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Reset to Local Storage
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
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
