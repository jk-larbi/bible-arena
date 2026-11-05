import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  X,
  AlertCircle,
  CheckCircle2,
  Flashlight,
  SwitchCamera,
  ArrowRight,
  Link as LinkIcon,
  HelpCircle,
  Hash,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  Video,
} from 'lucide-react';
import { Button } from './Button';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (pin: string) => void;
  initialError?: string;
}

/**
 * Extracts a 6-digit PIN from any scanned QR text format:
 * - Direct PIN: "482910"
 * - Hash URL: "http://localhost:5173/#join-arena?pin=482910"
 * - Universal URL: "https://biblearena.app/?pin=482910#join-arena"
 * - Path URL: "https://biblearena.app/join/482910"
 * - Query URL: "https://biblearena.app/?pin=482910"
 * - JSON: '{"pin":"482910"}'
 */
export function extractPinFromScan(decodedText: string): string | null {
  if (!decodedText) return null;
  const trimmed = decodedText.trim();

  // 1. Direct 6-digit PIN
  if (/^\d{6}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Query param ?pin=XXXXXX or &pin=XXXXXX
  const pinParamMatch = trimmed.match(/[?&#]pin=(\d{6})/i);
  if (pinParamMatch) {
    return pinParamMatch[1];
  }

  // 3. Path structure /join/XXXXXX or /arena/XXXXXX
  const pathMatch = trimmed.match(/(?:join|arena)\/(\d{6})/i);
  if (pathMatch) {
    return pathMatch[1];
  }

  // 4. Any 6-digit number sequence preceded by pin keyword
  const keywordMatch = trimmed.match(/pin[:=\s_-]*(\d{6})/i);
  if (keywordMatch) {
    return keywordMatch[1];
  }

  // 5. Standalone 6-digit word boundary match
  const digitsMatch = trimmed.match(/\b\d{6}\b/);
  if (digitsMatch) {
    return digitsMatch[0];
  }

  return null;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  initialError,
}) => {
  const scannerContainerId = 'biblearena-qr-reader';
  const fileReaderContainerId = 'biblearena-qr-file-reader';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  type TabType = 'camera' | 'upload' | 'manual';
  const [activeTab, setActiveTab] = useState<TabType>('camera');

  const [scanState, setScanState] = useState<'requesting' | 'scanning' | 'success' | 'error'>(
    'requesting'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [detectedPin, setDetectedPin] = useState<string | null>(null);
  
  // Camera enumeration & selection
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // File upload state
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Manual fallback inputs
  const [manualPin, setManualPin] = useState('');
  const [pastedUrl, setPastedUrl] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Detect device characteristics on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      setIsMobileDevice(mobile);
    }
  }, []);

  // Safe camera shutdown and media track release
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (isScanningRef.current) {
          isScanningRef.current = false;
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('QR scanner stop error:', err);
      } finally {
        isScanningRef.current = false;
      }
    }
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  // Initialize and start camera scanner
  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    setErrorMessage(null);
    setScanState('requesting');

    // 1. Verify MediaDevices API availability
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setErrorMessage(
        'Camera API is not supported in this browser environment. You can upload a QR image or enter the 6-digit PIN.'
      );
      setScanState('error');
      setActiveTab('upload');
      return;
    }

    // 2. Verify secure context (HTTPS or localhost)
    if (window.isSecureContext === false && window.location.hostname !== 'localhost') {
      setErrorMessage(
        'Camera scanning requires a secure HTTPS connection. Please enter the game PIN or upload a QR image.'
      );
      setScanState('error');
      setActiveTab('manual');
      return;
    }

    try {
      await stopScanner();

      // Check available cameras
      let availableCameras: Array<{ id: string; label: string }> = [];
      try {
        availableCameras = await Html5Qrcode.getCameras();
        if (availableCameras && availableCameras.length > 0) {
          setCameras(availableCameras);
          if (!selectedCameraId && !cameraIdToUse) {
            // Mobile: try to find back/rear camera; Desktop: pick first
            const rearCamera = availableCameras.find(
              (c) => /back|rear|environment/i.test(c.label)
            );
            const defaultCam = rearCamera ? rearCamera.id : availableCameras[0].id;
            setSelectedCameraId(defaultCam);
            cameraIdToUse = defaultCam;
          }
        }
      } catch (enumErr) {
        console.warn('Camera enumeration note:', enumErr);
      }

      const qrScanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = qrScanner;

      // Adaptive QR scanning box
      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.max(160, Math.floor(minEdge * 0.72));
          return { width: boxSize, height: boxSize };
        },
        aspectRatio: 1.0,
      };

      // Determine camera target config
      const cameraConfig = cameraIdToUse || selectedCameraId
        ? { deviceId: { exact: cameraIdToUse || selectedCameraId } }
        : isMobileDevice
        ? { facingMode: { ideal: 'environment' } }
        : { facingMode: 'user' };

      await qrScanner.start(
        cameraConfig,
        config,
        (decodedText) => {
          // Success callback
          const pin = extractPinFromScan(decodedText);
          if (pin) {
            isScanningRef.current = false;
            setDetectedPin(pin);
            setScanState('success');

            // Haptic feedback if supported
            try {
              if (navigator.vibrate) {
                navigator.vibrate([40, 50, 40]);
              }
            } catch {}

            setTimeout(async () => {
              await stopScanner();
              onScanSuccess(pin);
            }, 600);
          } else {
            setErrorMessage('QR code detected, but it did not contain a valid BibleArena room code.');
          }
        },
        () => {
          // Non-critical frame decode failure (normal during scanning)
        }
      );

      isScanningRef.current = true;
      setScanState('scanning');

      // Check flashlight/torch capability
      try {
        const capabilities = (qrScanner as any).getRunningTrackCapabilities?.();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      } catch {}
    } catch (err: any) {
      console.warn('Camera startup failure:', err);
      isScanningRef.current = false;
      const errorStr = (err && (err.message || err.name || String(err))) || '';

      if (
        errorStr.includes('NotAllowedError') ||
        errorStr.includes('Permission') ||
        errorStr.includes('denied')
      ) {
        setErrorMessage(
          'Camera access was denied. You can enable camera permission in your browser or join using the PIN or Image Upload tabs.'
        );
      } else if (
        errorStr.includes('NotFoundError') ||
        errorStr.includes('DevicesNotFoundError')
      ) {
        setErrorMessage(
          'No camera was found on this device. You can join using the PIN or Image Upload tabs below.'
        );
      } else if (
        errorStr.includes('NotReadableError') ||
        errorStr.includes('TrackStartError')
      ) {
        setErrorMessage(
          'Camera is currently in use by another application (e.g. Zoom or video call). Please close it or enter the PIN.'
        );
      } else {
        setErrorMessage(
          'Could not start camera feed. Please enter the 6-digit game PIN or upload a QR image.'
        );
      }

      setScanState('error');
    }
  }, [isMobileDevice, onScanSuccess, selectedCameraId, stopScanner]);

  // Manage modal lifecycle and tab transitions
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'camera') {
        startScanner();
      } else {
        stopScanner();
      }
    } else {
      stopScanner();
      setScanState('requesting');
      setDetectedPin(null);
      setErrorMessage(null);
      setImagePreviewUrl(null);
      setImageFileName(null);
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, activeTab, startScanner, stopScanner]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopScanner();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, stopScanner]);

  // Switch camera when user selects from dropdown
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    if (activeTab === 'camera') {
      startScanner(newId);
    }
  };

  // Quick flip between front and rear cameras
  const handleFlipCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    startScanner(nextCamera.id);
  };

  // Toggle torch / flashlight
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const newTorch = !torchOn;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: newTorch }],
      });
      setTorchOn(newTorch);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  // Handle Image File Upload & Local Decoding
  const handleImageFileSelect = async (file: File) => {
    if (!file) return;
    setManualError(null);
    setIsAnalyzingImage(true);
    setImageFileName(file.name);

    // Create local object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    try {
      // Create reader instance for file decoding
      const fileScanner = new Html5Qrcode(fileReaderContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      const decodedText = await fileScanner.scanFile(file, false);
      try {
        await fileScanner.clear();
      } catch {}

      const pin = extractPinFromScan(decodedText);
      if (pin) {
        setDetectedPin(pin);
        setScanState('success');

        try {
          if (navigator.vibrate) navigator.vibrate([40, 50, 40]);
        } catch {}

        setTimeout(() => {
          onScanSuccess(pin);
        }, 600);
      } else {
        setManualError(
          'Image contains a QR code, but no valid BibleArena 6-digit game PIN was found.'
        );
      }
    } catch (err: any) {
      console.warn('Image QR scan failed:', err);
      setManualError(
        'Could not detect a clear QR code in this image. Please upload a clear screenshot or enter the PIN manually.'
      );
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Manual PIN submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const clean = manualPin.trim().replace(/\D/g, '');
    if (!clean || clean.length !== 6) {
      setManualError('Please enter a valid 6-digit room PIN.');
      return;
    }

    stopScanner();
    onScanSuccess(clean);
  };

  // Pasted Link extraction
  const handlePastedUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const extracted = extractPinFromScan(pastedUrl);
    if (!extracted) {
      setManualError('Could not find a valid 6-digit PIN in the pasted link.');
      return;
    }

    stopScanner();
    onScanSuccess(extracted);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
    >
      {/* Hidden file scanner container */}
      <div id={fileReaderContainerId} className="hidden" aria-hidden="true" />

      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-purple-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-md shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="scanner-modal-title"
                className="text-base sm:text-lg font-black text-[#0F172A] font-outfit"
              >
                Join Live Game
              </h2>
              <p className="text-xs text-[#64748B] font-inter">
                Scan QR code, upload screenshot, or enter PIN
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close scanner dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Camera | Upload Image | PIN / Link */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1">
          <button
            onClick={() => {
              setActiveTab('camera');
              setManualError(null);
            }}
            className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-black font-outfit transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-white text-[#7C3AED] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="truncate">Camera</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              stopScanner();
              setManualError(null);
            }}
            className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-black font-outfit transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white text-[#7C3AED] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="truncate">Upload QR</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('manual');
              stopScanner();
              setManualError(null);
            }}
            className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-black font-outfit transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-[#7C3AED] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span className="truncate">PIN / Link</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {activeTab === 'camera' && (
            <div className="space-y-3.5">
              {/* Permission & Privacy Rationale */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-[11px] text-[#6D28D9] font-inter">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#7C3AED]" />
                <span>Camera feed stays 100% private on your device.</span>
              </div>

              {/* Camera Scanner Viewport */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-w-[300px] sm:max-w-[320px] mx-auto border-2 border-slate-800 shadow-inner flex items-center justify-center">
                <div
                  id={scannerContainerId}
                  className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                />

                {/* Reticle HUD */}
                {scanState === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-2xl border-2 border-white/30">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#7C3AED] rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#7C3AED] rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#7C3AED] rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#7C3AED] rounded-br-lg" />
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent shadow-[0_0_12px_#38BDF8] animate-[bounce_2s_infinite]" />
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {scanState === 'requesting' && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-10">
                    <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-inter text-slate-300">
                      Starting camera... Please allow camera access if prompted.
                    </p>
                  </div>
                )}

                {/* Success state */}
                {scanState === 'success' && (
                  <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-400/40">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-emerald-300 font-outfit">
                        QR Code Verified!
                      </p>
                      <p className="text-xl font-black font-outfit text-white tracking-widest mt-1">
                        PIN: {detectedPin}
                      </p>
                      <p className="text-xs text-emerald-200/80 mt-1">
                        Connecting to arena lobby...
                      </p>
                    </div>
                  </div>
                )}

                {/* Error / Denied state */}
                {scanState === 'error' && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-20">
                    <AlertCircle className="w-10 h-10 text-amber-400" />
                    <p className="text-xs font-inter text-slate-300 max-w-xs">
                      {errorMessage || 'Camera is unavailable.'}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black font-outfit transition-colors cursor-pointer"
                      >
                        Upload QR Image
                      </button>
                      <button
                        onClick={() => setActiveTab('manual')}
                        className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-black font-outfit transition-colors cursor-pointer"
                      >
                        Enter PIN
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Camera Selection & Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {cameras.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1 text-xs text-slate-700 border border-slate-200">
                    <Video className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={selectedCameraId}
                      onChange={handleCameraChange}
                      className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[160px] truncate"
                      aria-label="Select Camera Device"
                    >
                      {cameras.map((cam, idx) => (
                        <option key={cam.id} value={cam.id}>
                          {cam.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {cameras.length > 1 && (
                  <button
                    onClick={handleFlipCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-inter transition-colors cursor-pointer"
                    title="Flip camera"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span>Flip</span>
                  </button>
                )}

                {hasTorch && (
                  <button
                    onClick={handleToggleTorch}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-inter transition-colors cursor-pointer ${
                      torchOn
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                    <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                  </button>
                )}
              </div>

              <p className="text-center text-[11px] text-slate-500 font-inter">
                Hold your device steady so the host's QR code fills the frame.
              </p>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFileSelect(e.target.files[0]);
                  }
                }}
              />

              {/* Drag and Drop Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 min-h-[200px] ${
                  isDraggingFile
                    ? 'border-[#7C3AED] bg-purple-50'
                    : 'border-slate-300 hover:border-[#7C3AED] hover:bg-slate-50'
                }`}
              >
                {imagePreviewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded QR Code"
                      className="max-h-36 max-w-full rounded-xl object-contain mx-auto shadow-sm border border-slate-200"
                    />
                    <p className="text-xs font-bold text-slate-600 truncate max-w-[240px]">
                      {imageFileName}
                    </p>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shadow-xs">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                )}

                {isAnalyzingImage ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED]">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning image for QR code...</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-black text-slate-800 font-outfit">
                      Click to browse or drag & drop an image
                    </p>
                    <p className="text-[11px] text-slate-500 font-inter mt-1">
                      Supports PNG, JPG, WEBP screenshots of host QR codes
                    </p>
                  </div>
                )}
              </div>

              {manualError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-inter text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              <p className="text-center text-[11px] text-slate-500 font-inter">
                Captured or saved a screenshot of the host's screen? Drop it here to join instantly without a camera.
              </p>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-5">
              {/* 6-Digit PIN Entry */}
              <form onSubmit={handleManualSubmit} className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#475569] font-outfit">
                  Enter 6-Digit Room PIN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={manualPin}
                    onChange={(e) => setManualPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 482910"
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-200 text-center font-outfit font-black text-xl tracking-widest text-[#0F172A] focus:border-[#7C3AED] focus:outline-none"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={manualPin.length !== 6}
                    className="px-5 font-black font-outfit"
                  >
                    Join <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute font-outfit">
                  Or Paste Link
                </span>
              </div>

              {/* Paste URL Entry */}
              <form onSubmit={handlePastedUrlSubmit} className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#475569] font-outfit">
                  Paste Game Invitation URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="url"
                      value={pastedUrl}
                      onChange={(e) => setPastedUrl(e.target.value)}
                      placeholder="https://.../?pin=123456"
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl border-2 border-slate-200 text-xs font-inter text-[#0F172A] focus:border-[#7C3AED] focus:outline-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={!pastedUrl.trim()}
                    className="px-4 font-bold font-outfit text-xs border-slate-300 text-slate-700"
                  >
                    Extract & Join
                  </Button>
                </div>
              </form>

              {manualError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-inter text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-inter px-5">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            No account required to join as guest
          </span>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-600 font-bold hover:underline cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
