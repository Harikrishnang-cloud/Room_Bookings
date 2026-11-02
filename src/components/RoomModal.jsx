import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, DoorClosed, AlertTriangle } from 'lucide-react';

export default function RoomModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) {
  const isEditing = Boolean(initialData && initialData.id);

  const [formData, setFormData] = useState({
    roomNumber: '',
    roomName: '',
    description: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          roomNumber: initialData.roomNumber || '',
          roomName: initialData.roomName || '',
          description: initialData.description || '',
        });
      } else {
        setFormData({
          roomNumber: '',
          roomName: '',
          description: '',
        });
      }
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomNumber.trim()) {
      setError('Room number is required');
      toast.error('Room number is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save room');
      toast.error(err.message || 'Failed to save room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Room' : 'Add New Room'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isEditing ? 'Update room specifications' : 'Add an apartment room to the dashboard'}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Room Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 101, 204, Penthouse A"
              value={formData.roomNumber}
              onChange={(e) => setFormData((p) => ({ ...p, roomNumber: e.target.value }))}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Room Name / Type (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Deluxe Studio, Ocean View Suite"
              value={formData.roomName}
              onChange={(e) => setFormData((p) => ({ ...p, roomName: e.target.value }))}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows="3"
              placeholder="Room features, amenities, floor level..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
