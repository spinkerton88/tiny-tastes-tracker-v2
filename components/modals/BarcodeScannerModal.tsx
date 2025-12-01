
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

        // Calculate aspect ratio to try and fill screen (portrait vs landscape)
        // Default to roughly smartphone portrait if window isn't available for some reason
        const aspectRatio = window.innerWidth / window.innerHeight;

        const scanner = new Html5QrcodeScanner(
            scannerId,
            { 
                fps: 10, 
                // Larger box for easier scanning
                qrbox: { width: 250, height: 250 },
                // Use undefined to let library adapt, or specific ratio. 
                // 1.0 is often safer for the 'scanner' widget style to avoid distortion, 
                // but let's try not setting it to let it fill the div.
                // Actually, the library docs suggest not setting it for responsive full width.
                // However, the scanner widget enforces a square aspect ratio often.
                // We'll use a vertical aspect ratio for mobile.
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
                // Pause/Clear immediately on success
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
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
            {/* Header with Close Button */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-12 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2 drop-shadow-md">
                        <Icon name="scan-barcode" className="w-5 h-5 text-teal-400" />
                        Scan Product
                    </h3>
                    <p className="text-xs text-gray-300 drop-shadow-sm">Align barcode in box</p>
                </div>
                <button 
                    onClick={onClose} 
                    className="pointer-events-auto bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors text-white border border-white/10"
                    aria-label="Close Scanner"
                >
                    <Icon name="x" className="w-6 h-6" />
                </button>
            </div>

            {/* Scanner Container - fills available space */}
            <div id="reader" className="w-full h-full bg-black relative flex-1"></div>

            {/* Helper Footer */}
            <div className="absolute bottom-10 left-0 right-0 text-center z-20 pointer-events-none">
                <button 
                    onClick={onClose}
                    className="pointer-events-auto text-white/90 text-sm font-medium bg-black/50 border border-white/20 px-6 py-2 rounded-full backdrop-blur-md hover:bg-black/70 transition-colors"
                >
                    Cancel Scan
                </button>
                {error && <p className="text-red-400 text-xs mt-3 bg-black/80 inline-block px-3 py-1 rounded">{error}</p>}
            </div>

            {/* Style Overrides for Html5QrcodeScanner */}
            <style>{`
                #reader {
                    border: none !important;
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
                /* Style the camera permission button */
                #reader__dashboard_section_csr button {
                    background-color: #0d9488 !important;
                    color: white !important;
                    padding: 12px 24px;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 40px;
                }
                /* Hide "Scan an Image File" link if undesired, or style it */
                #reader__dashboard_section_swaplink {
                    color: white !important;
                    text-decoration: underline;
                    margin-top: 20px;
                    display: block;
                    opacity: 0.8;
                }
                /* Hide the select element for camera if only one exists or to clean UI */
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
