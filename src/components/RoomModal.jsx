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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe/Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" />

        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Room' : 'Add New Room'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                {isEditing ? 'Update room specifications' : 'Add an apartment room to dashboard'}
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto touch-scroll pb-safe">
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
              className="w-full px-3 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[38px]"
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
              className="w-full px-3 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[38px]"
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
              className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-3 pb-1 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
