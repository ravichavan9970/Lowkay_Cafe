import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Camera, X, QrCode, AlertCircle, RefreshCw, CheckCircle2, Sparkles, UtensilsCrossed } from 'lucide-react';

interface CameraQrScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'lowkey-qr-reader-container';

  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [cameraPermissionState, setCameraPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Handle scanned QR payload
  const handleDecodedText = (decodedText: string) => {
    try {
      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setScanSuccess(`QR Code Detected: ${decodedText}`);

      // Stop scanner immediately
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
        setIsScanning(false);
      }

      // Check if it's a URL
      let targetPath = '';
      if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
        const parsed = new URL(decodedText);
        targetPath = parsed.pathname + parsed.search;
      } else if (decodedText.startsWith('/')) {
        targetPath = decodedText;
      } else if (/^table\s*#?\s*(\d+)/i.test(decodedText)) {
        const match = decodedText.match(/^table\s*#?\s*(\d+)/i);
        if (match) targetPath = `/table/${match[1]}`;
      } else if (/^\d+$/.test(decodedText.trim())) {
        targetPath = `/table/${decodedText.trim()}`;
      } else if (/takeaway/i.test(decodedText)) {
        targetPath = '/takeaway';
      }

      // Navigate after small success animation
      setTimeout(() => {
        onClose();
        if (targetPath) {
          navigate(targetPath);
        } else {
          // If unparsed, go to table 1 or show
          navigate('/table/1');
        }
      }, 700);
    } catch (err) {
      console.error('Scan parse error', err);
    }
  };

  const startScanner = async () => {
    setErrorMessage(null);
    setScanSuccess(null);

    try {
      // Clean up existing instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Ignore if not running
        }
        scannerRef.current = null;
      }

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Try back camera first
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => handleDecodedText(decodedText),
        () => {
          // Scanning frame dropped or empty, ignore
        }
      );

      setIsScanning(true);
      setCameraPermissionState('granted');
    } catch (err: any) {
      console.warn('Failed to start environment camera, falling back to any camera', err);
      try {
        if (scannerRef.current) {
          await scannerRef.current.start(
            { facingMode: 'user' },
            { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            (decodedText) => handleDecodedText(decodedText),
            () => {}
          );
          setIsScanning(true);
          setCameraPermissionState('granted');
          return;
        }
      } catch (fallbackErr: any) {
        console.error('Camera access completely denied or not found', fallbackErr);
        setCameraPermissionState('denied');
        setErrorMessage(
          fallbackErr?.message ||
            'Camera permission denied or camera not available on this device. You can tap your table number below to open the menu instantly.'
        );
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow container element to mount
      const timer = setTimeout(() => {
        startScanner();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
        setIsScanning(false);
      }
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch {}
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-950 rounded-3xl border border-yellow-400/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black shadow-md shadow-yellow-400/25">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white leading-tight">
                Table QR Scanner
              </h3>
              <p className="text-[11px] text-yellow-400/90 font-mono -mt-0.5">
                POINT CAMERA AT ANY TABLE QR CODE
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (scannerRef.current && isScanning) {
                scannerRef.current.stop().catch(() => {});
              }
              onClose();
            }}
            className="p-2 rounded-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Container */}
        <div className="relative my-5 rounded-2xl overflow-hidden bg-black border border-neutral-800 flex flex-col items-center justify-center min-h-[280px]">
          
          {/* HTML5 QR Camera Element */}
          <div id={containerId} className="w-full h-full min-h-[280px]" />

          {/* Scanner Optical Reticle Overlay when active */}
          {isScanning && !scanSuccess && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-56 h-56 border-2 border-yellow-400/70 rounded-2xl relative shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg"></span>
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg"></span>
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg"></span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-yellow-400 rounded-br-lg"></span>

                {/* Sweeping Laser Line */}
                <div className="w-full h-0.5 bg-yellow-400 shadow-[0_0_12px_#facc15] animate-bounce duration-1000 mt-28"></div>
              </div>
              <p className="text-[11px] font-bold text-yellow-300 mt-4 bg-black/70 px-3 py-1 rounded-full backdrop-blur-md">
                Align QR code within yellow box
              </p>
            </div>
          )}

          {/* Success State Overlay */}
          {scanSuccess && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-3 animate-bounce" />
              <h4 className="font-display font-black text-lg text-white">QR Code Verified!</h4>
              <p className="text-xs text-yellow-400 font-mono mt-1 max-w-xs break-all">
                {scanSuccess}
              </p>
              <p className="text-[11px] text-neutral-400 mt-2">Opening dining menu...</p>
            </div>
          )}

          {/* Camera Permission / Error Fallback */}
          {errorMessage && (
            <div className="absolute inset-0 bg-neutral-950 p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
              <h4 className="font-display font-bold text-sm text-white">Camera Access Notice</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">{errorMessage}</p>
              <button
                onClick={startScanner}
                className="mt-4 px-4 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Table Selector: Never stuck! */}
        <div className="space-y-2 pt-2 border-t border-neutral-850">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold">
            <span>Or select your table number directly:</span>
            <span className="text-yellow-400 font-bold">10 Tables Available</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (scannerRef.current && isScanning) {
                    scannerRef.current.stop().catch(() => {});
                  }
                  onClose();
                  navigate(`/table/${num}?token=demo-token-tbl-${num}`);
                }}
                className="py-2 rounded-xl bg-neutral-900 hover:bg-yellow-400 hover:text-black border border-neutral-800 text-xs font-black text-white transition-all active:scale-95 text-center"
              >
                T-{num}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (scannerRef.current && isScanning) {
                scannerRef.current.stop().catch(() => {});
              }
              onClose();
              navigate('/takeaway');
            }}
            className="w-full mt-2 py-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <span>🥡 Outside / Takeaway Pickup Order</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CameraQrScanner;
