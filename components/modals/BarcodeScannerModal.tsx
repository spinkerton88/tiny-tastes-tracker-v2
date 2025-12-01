
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
        // Initialize scanner
        const scannerId = "reader";
        
        // Safety check if element exists
        if (!document.getElementById(scannerId)) return;

        const scanner = new Html5QrcodeScanner(
            scannerId,
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E
                ]
            },
            /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Ignore scanning errors as they happen every frame no barcode is detected
            }
        );

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (e) {
                    console.error("Error clearing scanner", e);
                }
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[600]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Icon name="scan-barcode" className="w-5 h-5 text-teal-600" />
                        Scan Pouch or Snack
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-0 bg-black relative min-h-[300px]">
                    <div id="reader" className="w-full h-full"></div>
                </div>

                <div className="p-4 text-center">
                    <p className="text-sm text-gray-600">Point camera at the barcode.</p>
                    <p className="text-xs text-gray-400 mt-1">We'll magically extract the ingredients!</p>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;
