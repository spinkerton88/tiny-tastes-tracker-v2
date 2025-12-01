
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Icon from '../ui/Icon';

interface BarcodeScannerModalProps {
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose, onScanSuccess }) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        const scannerId = "reader";
        
        if (!document.getElementById(scannerId)) return;

        // Calculate aspect ratio to try and fill screen
        const aspectRatio = window.innerWidth / window.innerHeight;

        const scanner = new Html5QrcodeScanner(
            scannerId,
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                // Use a vertical aspect ratio for mobile to better fill the screen
                aspectRatio: aspectRatio < 1 ? 0.75 : 1.33,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E
                ],
                showTorchButtonIfSupported: true,
                rememberLastUsedCamera: true
            },
            /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                if (scannerRef.current) {
                    try {
                        scannerRef.current.clear();
                    } catch (e) {
                        console.warn("Failed to clear scanner on success", e);
                    }
                }
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Ignore frame-by-frame errors
            }
        );

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (e) {
                    console.error("Error clearing scanner on unmount", e);
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
            <div id="reader" className="w-full h-full bg-black relative flex-1"></div>

            {/* Footer: Added pb-safe for Home Indicator */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] flex flex-col items-center bg-gradient-to-t from-black/90 to-transparent z-20 pointer-events-none">
                <button 
                    onClick={onClose}
                    className="pointer-events-auto text-white text-sm font-semibold bg-white/20 border border-white/30 px-8 py-3 rounded-full backdrop-blur-md hover:bg-white/30 transition-all active:scale-95"
                >
                    Cancel Scan
                </button>
                {error && <p className="text-red-400 text-xs mt-3 bg-black/80 inline-block px-3 py-1 rounded">{error}</p>}
            </div>

            {/* Style Overrides for Html5QrcodeScanner to look Native */}
            <style>{`
                #reader {
                    border: none !important;
                    display: flex;
                    flex-direction: column;
                    justify-content: center; /* Centers the permission button */
                    align-items: center;
                }
                #reader video {
                    object-fit: cover;
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                }
                /* Hide status text */
                #reader__status_span {
                    display: none !important;
                }
                /* Hide header info */
                #reader__header_message {
                    display: none !important;
                }
                /* Native-like Permission Button */
                #reader__dashboard_section_csr button {
                    background-color: #0d9488 !important; /* Teal-600 */
                    color: white !important;
                    padding: 14px 28px;
                    border-radius: 9999px; /* Pill shape */
                    border: none;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 20px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    transition: transform 0.1s;
                }
                #reader__dashboard_section_csr button:active {
                    transform: scale(0.95);
                }
                /* Style the "Scan an Image File" link */
                #reader__dashboard_section_swaplink {
                    color: rgba(255, 255, 255, 0.8) !important;
                    text-decoration: none;
                    margin-top: 24px;
                    display: block;
                    font-size: 14px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
                    padding-bottom: 2px;
                }
                /* Hide the camera selection dropdown if it appears before scanning */
                #reader__dashboard_section_csr span {
                    display: none !important;
                }
                #reader__scan_region {
                    min-height: 300px;
                }
            `}</style>
        </div>
    );
};

export default BarcodeScannerModal;
