
import React from 'react';
import Icon from '../ui/Icon';

interface CertificateModalProps {
  babyName: string;
  date: string;
  onClose: () => void;
}

const CertificateModal: React.FC<CertificateModalProps> = ({ babyName, date, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-80 flex items-center justify-center p-4 z-[1000]">
      <style>
        {`
            @media print {
                @page { margin: 0; size: landscape; }
                body * { visibility: hidden; }
                #certificate-container, #certificate-container * { visibility: visible; }
                #certificate-container {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                .no-print { display: none !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
        `}
      </style>
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
         {/* Controls */}
         <div className="flex justify-between items-center border-b p-4 bg-gray-50 no-print">
            <h2 className="text-lg font-semibold text-gray-800">Your Certificate</h2>
            <div className="flex gap-2">
                <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
                    <Icon name="printer" className="w-4 h-4 mr-2" /> Print
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2"><Icon name="x" className="w-5 h-5"/></button>
            </div>
        </div>

        {/* Certificate View */}
        <div className="flex-1 bg-gray-200 p-4 sm:p-8 flex items-center justify-center">
            <div id="certificate-container" className="bg-white p-2 w-full max-w-[800px] aspect-[1.4/1] shadow-2xl relative border-8 border-teal-600 box-border">
                <div className="w-full h-full border-4 border-dashed border-teal-200 flex flex-col items-center justify-center text-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-50 via-white to-white relative overflow-hidden">
                    
                    {/* Background decorations */}
                    <div className="absolute top-4 left-4 text-teal-100"><Icon name="carrot" className="w-24 h-24 rotate-45" /></div>
                    <div className="absolute bottom-4 right-4 text-orange-100"><Icon name="apple" className="w-24 h-24 -rotate-12" /></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                        <div className="flex justify-center mb-6">
                            <Icon name="trophy" className="w-20 h-20 text-yellow-500 drop-shadow-sm" />
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-teal-800 mb-2 tracking-wide">Certificate of Achievement</h1>
                        <p className="text-lg text-teal-600 font-medium uppercase tracking-widest mb-8">The 100 Foods Challenge</p>
                        
                        <p className="text-xl text-gray-600 italic mb-4">This certifies that</p>
                        
                        <div className="text-4xl sm:text-6xl font-cursive font-bold text-gray-900 mb-8 border-b-2 border-gray-300 pb-2 px-12 inline-block min-w-[300px]">
                            {babyName || "Super Baby"}
                        </div>
                        
                        <p className="text-xl text-gray-600 italic mb-2">Has successfully tasted 100 new foods!</p>
                        <p className="text-sm text-gray-500">Awarded on {date}</p>
                        
                        <div className="mt-12 flex justify-between w-full px-12">
                             <div className="text-center">
                                 <div className="w-40 border-t border-gray-400 mb-2"></div>
                                 <p className="text-xs text-gray-400 uppercase">Tiny Tastes Tracker</p>
                             </div>
                             <div className="text-center">
                                 <Icon name="award" className="w-12 h-12 text-teal-600 mx-auto opacity-80" />
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
