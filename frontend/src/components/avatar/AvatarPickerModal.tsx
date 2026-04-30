import React, { useCallback, useEffect, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, ZoomIn, ZoomOut, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { getCroppedJpegBlob } from './cropImage';
import { AvatarUploadError } from '@/lib/avatar/uploadAvatar';
import type { TranslationKey } from '@/i18n/translations';

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

interface AvatarPickerModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Called with a 512×512 JPEG Blob ready to upload. The caller is
   * responsible for sending it to Supabase Storage and updating the
   * profile's avatar_url.
   */
  onCropped: (blob: Blob) => Promise<void> | void;
  /** Optional: shown above the picker for context (e.g., user's name). */
  title?: string;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  open, onClose, onCropped, title,
}) => {
  const { t } = useLanguage();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Reset state when the modal closes.
  useEffect(() => {
    if (!open) {
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setBusy(false);
      setErrorKey(null);
      setErrorDetail(null);
    }
  }, [open]);

  const handleFile = (file: File) => {
    setErrorKey(null);
    setErrorDetail(null);
    if (!file.type.startsWith('image/')) {
      setErrorKey('avatar_err_not_image');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorKey('avatar_err_too_big');
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    setErrorKey(null);
    setErrorDetail(null);
    try {
      const { blob } = await getCroppedJpegBlob(imageSrc, croppedAreaPixels);
      await onCropped(blob);
      onClose();
    } catch (e) {
      if (e instanceof AvatarUploadError) {
        setErrorKey(e.codeKey);
        setErrorDetail(e.detail ?? null);
      } else {
        setErrorKey('avatar_err_generic');
        setErrorDetail((e as Error)?.message ?? null);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => (busy ? null : onClose())}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:w-[440px] max-w-[100vw] max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-border">
              <div className="min-w-0">
                <h2 className="text-base font-bold truncate">{t('avatar_modal_title')}</h2>
                {title && <p className="text-xs text-muted-foreground truncate">{title}</p>}
              </div>
              <button
                onClick={onClose}
                disabled={busy}
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-hidden">
              {imageSrc ? (
                <div className="relative w-full" style={{ height: '60vh', maxHeight: '420px' }}>
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
              ) : (
                <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
                  <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-4">
                    <ImagePlus size={28} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 px-2">
                    {t('avatar_modal_pick_hint')}
                  </p>
                  <label className="inline-block">
                    <span className="px-5 py-3 bg-accent-primary text-white rounded-xl font-bold text-sm cursor-pointer min-h-[44px] inline-flex items-center justify-center">
                      {t('avatar_modal_pick_btn')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Zoom + actions */}
            {imageSrc && (
              <div className="border-t border-border p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <ZoomOut size={16} className="text-muted-foreground shrink-0" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-accent-primary"
                  />
                  <ZoomIn size={16} className="text-muted-foreground shrink-0" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setImageSrc(null)}
                    disabled={busy}
                    className="flex-1 px-4 py-3 border border-border rounded-xl font-semibold text-sm hover:bg-surface-2 disabled:opacity-50 min-h-[44px]"
                  >
                    {t('avatar_modal_change')}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={busy || !croppedAreaPixels}
                    className="flex-1 px-4 py-3 bg-accent-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 min-h-[44px]"
                  >
                    {busy ? t('avatar_modal_uploading') : (
                      <>
                        <Check size={16} /> {t('avatar_modal_save')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {errorKey && (
              <div className="mx-4 mb-3 p-3 rounded-xl bg-accent-danger/10 border border-accent-danger/20 text-accent-danger text-xs flex gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="leading-relaxed">{t(errorKey)}</p>
                  {errorDetail && (
                    <p className="mt-1 text-accent-danger/70 font-mono text-[10px] break-all">{errorDetail}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
