
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
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        const scannerId = "reader";
        
        // Wait for DOM
        const initScanner = async () => {
            if (!document.getElementById(scannerId)) return;
            
            // Clean up any existing instances first
            if (scannerRef.current) {
                try {
                    await scannerRef.current.clear();
                } catch (e) {
                    // Ignore clear errors
                }
                scannerRef.current = null;
            }

            const html5QrCode = new Html5Qrcode(scannerId, {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128
                ],
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                },
                verbose: false
            });
            
            scannerRef.current = html5QrCode;

            try {
                await html5QrCode.start(
                    { facingMode: "environment" }, 
                    { 
                        fps: 10,
                        aspectRatio: 1.0,
                        videoConstraints: {
                            facingMode: "environment",
                            focusMode: "continuous"
                        } as any
                    },
                    (decodedText) => {
                        if (isMounted.current) {
                            // Stop scanning immediately on success to freeze
                            html5QrCode.stop().then(() => {
                                html5QrCode.clear();
                                onScanSuccess(decodedText);
                            }).catch(() => {
                                // Force callback even if stop fails
                                onScanSuccess(decodedText);
                            });
                        }
                    },
                    (errorMessage) => {
                        // Ignore frame errors
                    }
                );
            } catch (err) {
                if (isMounted.current) {
                    console.error("Error starting scanner", err);
                    setError("Camera permission denied or unavailable. Please check settings.");
                }
            }
        };

        const timer = setTimeout(initScanner, 100);

        return () => {
            isMounted.current = false;
            clearTimeout(timer);
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().then(() => {
                        scannerRef.current?.clear();
                    }).catch(console.error);
                } else {
                    scannerRef.current.clear();
                }
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col h-[100dvh]">
            <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2 drop-shadow-md">
                        <Icon name="scan-barcode" className="w-5 h-5 text-teal-400" />
                        Scan Product
                    </h3>
                    <p className="text-xs text-gray-300 drop-shadow-sm">Align barcode in window</p>
                </div>
                
                <button 
                    onClick={onClose} 
                    className="pointer-events-auto bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/30 transition-colors text-white border border-white/10 shadow-lg"
                    aria-label="Close Scanner"
                >
                    <Icon name="x" className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 relative w-full h-full bg-black overflow-hidden">
                 <div id="reader" className="w-full h-full"></div>
                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-400 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-400 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-400 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-400 -mb-1 -mr-1"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-red-500/50 animate-pulse"></div>
                        </div>
                    </div>
                 </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] flex flex-col items-center bg-gradient-to-t from-black/90 to-transparent z-20 pointer-events-none">
                <button 
                    onClick={onClose}
                    className="pointer-events-auto text-white text-sm font-semibold bg-white/20 border border-white/30 px-8 py-3 rounded-full backdrop-blur-md hover:bg-white/30 transition-all active:scale-95"
                >
                    Cancel Scan
                </button>
                {error && <p className="text-red-400 text-xs mt-3 bg-black/80 inline-block px-3 py-1 rounded text-center">{error}</p>}
            </div>

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
