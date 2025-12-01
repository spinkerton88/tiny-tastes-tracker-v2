
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Icon from '../ui/Icon';

interface BarcodeScannerModalProps {
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose, onScanSuccess }) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef<boolean>(false);

    useEffect(() => {
        const scannerId = "reader";
        if (!document.getElementById(scannerId)) return;

        // Initialize the scanner with the core class (no default UI)
        const html5QrCode = new Html5Qrcode(scannerId, false);
        scannerRef.current = html5QrCode;

        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            // Aspect ratio isn't strictly necessary if we use CSS to cover, 
            // but setting it helps the library select resolution.
            // 1.0 is safe, or window ratio.
            aspectRatio: 1.0, 
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E
            ]
        };

        const startScanner = async () => {
            try {
                // This triggers the browser permission prompt
                await html5QrCode.start(
                    { facingMode: "environment" }, 
                    config,
                    (decodedText) => {
                        // Success
                        if (isScanningRef.current) {
                            isScanningRef.current = false;
                            // Stop immediately to freeze on the frame/result
                            html5QrCode.stop().then(() => {
                                html5QrCode.clear();
                                onScanSuccess(decodedText);
                            }).catch(err => {
                                // Even if stop fails, proceed
                                console.warn("Stop failed", err);
                                onScanSuccess(decodedText);
                            });
                        }
                    },
                    (errorMessage) => {
                        // Frame error, ignore
                    }
                );
                isScanningRef.current = true;
            } catch (err) {
                console.error("Error starting scanner", err);
                setError("Camera permission denied or unavailable. Please check your settings.");
            }
        };

        // Small timeout to ensure DOM is ready and previous instances cleared
        const timer = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timer);
            isScanningRef.current = false;
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().then(() => {
                        scannerRef.current?.clear();
                    }).catch(err => console.error("Cleanup error", err));
                } else {
                    scannerRef.current.clear();
                }
            }
        };
    }, [onScanSuccess]);

    return (
        // Use 100dvh (dynamic viewport height) to account for iOS Safari address bar quirks
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col h-[100dvh]">
            
            {/* Header: Added pt-safe for Notch */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2 drop-shadow-md">
                        <Icon name="scan-barcode" className="w-5 h-5 text-teal-400" />
                        Scan Product
                    </h3>
                    <p className="text-xs text-gray-300 drop-shadow-sm">Align barcode in box</p>
                </div>
                
                {/* Larger touch target for Close button */}
                <button 
                    onClick={onClose} 
                    className="pointer-events-auto bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/30 transition-colors text-white border border-white/10 shadow-lg"
                    aria-label="Close Scanner"
                >
                    <Icon name="x" className="w-6 h-6" />
                </button>
            </div>

            {/* Scanner Container */}
            <div className="flex-1 relative w-full h-full bg-black overflow-hidden">
                 <div id="reader" className="w-full h-full"></div>
            </div>

            {/* Footer: Added pb-safe for Home Indicator */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] flex flex-col items-center bg-gradient-to-t from-black/90 to-transparent z-20 pointer-events-none">
                <button 
                    onClick={onClose}
                    className="pointer-events-auto text-white text-sm font-semibold bg-white/20 border border-white/30 px-8 py-3 rounded-full backdrop-blur-md hover:bg-white/30 transition-all active:scale-95"
                >
                    Cancel Scan
                </button>
                {error && <p className="text-red-400 text-xs mt-3 bg-black/80 inline-block px-3 py-1 rounded text-center">{error}</p>}
            </div>

            {/* CSS to ensure the video element fills the container */}
            <style>{`
                #reader video {
                    object-fit: cover;
                    width: 100%;
                    height: 100%;
                }
            `}</style>
        </div>
    );
};

export default BarcodeScannerModal;
