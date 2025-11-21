
import React, { useState, useRef } from 'react';
import { UserProfile, TriedFoodLog } from '../../types';
import Icon from '../ui/Icon';
import { allFoods } from '../../constants';

interface DoctorReportModalProps {
  userProfile: UserProfile | null;
  triedFoods: TriedFoodLog[];
  onClose: () => void;
}

const DoctorReportModal: React.FC<DoctorReportModalProps> = ({ userProfile, triedFoods, onClose }) => {
  const [dateRange, setDateRange] = useState<'all' | '30' | '90'>('30');
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter Logic
  const filterDate = new Date();
  if (dateRange === '30') filterDate.setDate(filterDate.getDate() - 30);
  if (dateRange === '90') filterDate.setDate(filterDate.getDate() - 90);
  
  const filteredLogs = triedFoods.filter(log => {
    if (dateRange === 'all') return true;
    return new Date(log.date) >= filterDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const flaggedLogs = filteredLogs.filter(log => log.allergyReaction && log.allergyReaction !== 'none');
  
  // Stats
  const totalFoodsTried = new Set(filteredLogs.map(f => f.id)).size;
  
  const handlePrint = () => {
    window.print();
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Food', 'Reaction', 'Allergy Flag', 'Notes'];
    const rows = filteredLogs.map(log => [
        log.date,
        log.id,
        `${log.reaction}/7`,
        log.allergyReaction || 'None',
        `"${(log.notes || '').replace(/"/g, '""')}"`
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\r\n" + rows.join("\r\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${userProfile?.babyName || 'Baby'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFoodEmoji = (name: string) => {
    const food = allFoods.flatMap(c => c.items).find(f => f.name === name);
    return food?.emoji || '';
  };

  const knownAllergies = Array.isArray(userProfile?.knownAllergies) ? userProfile?.knownAllergies : [];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
      <style>
        {`
            @media print {
                body * {
                    visibility: hidden;
                }
                #doctor-report-container, #doctor-report-container * {
                    visibility: visible;
                }
                #doctor-report-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: auto;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    overflow: visible;
                }
                .no-print {
                    display: none !important;
                }
            }
        `}
      </style>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header - Non-Printable Controls */}
        <div className="flex justify-between items-center border-b p-4 bg-gray-50 no-print flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">Generate Doctor Report</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
        </div>

        {/* Controls & Actions - Non-Printable */}
        <div className="p-4 border-b bg-white no-print flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700">Time Period:</label>
                <select 
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                >
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 3 Months</option>
                    <option value="all">All Time</option>
                </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={downloadCSV} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Icon name="download" className="w-4 h-4 mr-2" /> CSV
                </button>
                <button onClick={handlePrint} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">
                    <Icon name="printer" className="w-4 h-4 mr-2" /> Print / Save PDF
                </button>
            </div>
        </div>

        {/* Report Preview - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8">
            <div id="doctor-report-container" className="bg-white max-w-3xl mx-auto p-8 shadow-sm min-h-full print:shadow-none">
                {/* Report Header */}
                <div className="border-b-2 border-gray-800 pb-6 mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Food Introduction Report</h1>
                        <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-teal-700">{userProfile?.babyName || "Baby"}</h2>
                        {userProfile?.birthDate && <p className="text-sm text-gray-600">DOB: {userProfile.birthDate}</p>}
                    </div>
                </div>

                {/* Summary Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Period</p>
                        <p className="text-lg font-bold text-gray-800">
                            {dateRange === 'all' ? 'All Time' : `Last ${dateRange} Days`}
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">New Foods Tried</p>
                        <p className="text-lg font-bold text-teal-600">{totalFoodsTried}</p>
                    </div>
                    <div className={`p-4 rounded-lg border ${flaggedLogs.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <p className={`text-xs uppercase tracking-wide font-semibold ${flaggedLogs.length > 0 ? 'text-red-600' : 'text-green-600'}`}>Reactions Flagged</p>
                        <p className={`text-lg font-bold ${flaggedLogs.length > 0 ? 'text-red-700' : 'text-green-700'}`}>{flaggedLogs.length}</p>
                    </div>
                </div>

                {/* Known Allergies Section (if any) */}
                {knownAllergies.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 mb-3">Known Allergies & Conditions</h3>
                        <div className="flex flex-wrap gap-2">
                            {knownAllergies.map(a => (
                                <span key={a} className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                                    {a}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Flagged Reactions Section */}
                {flaggedLogs.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-red-700 uppercase border-b border-red-200 pb-2 mb-3 flex items-center">
                            <Icon name="alert-triangle" className="w-4 h-4 mr-2" /> Adverse Reactions Reported
                        </h3>
                        <div className="space-y-3">
                            {flaggedLogs.map((log, idx) => (
                                <div key={idx} className="bg-red-50 border border-red-200 p-3 rounded-md">
                                    <div className="flex justify-between font-bold text-red-800 mb-1">
                                        <span>{getFoodEmoji(log.id)} {log.id}</span>
                                        <span>{log.date}</span>
                                    </div>
                                    <div className="text-sm text-red-700">
                                        <span className="font-semibold">Reaction Type:</span> {log.allergyReaction}
                                    </div>
                                    {log.notes && (
                                        <div className="text-sm text-red-700 mt-1 italic">
                                            " {log.notes} "
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Detailed Log Table */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 mb-4">Detailed Food Log</h3>
                    {filteredLogs.length > 0 ? (
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="py-2 font-semibold text-gray-600 w-24">Date</th>
                                    <th className="py-2 font-semibold text-gray-600 w-32">Food</th>
                                    <th className="py-2 font-semibold text-gray-600 w-24">Reaction</th>
                                    <th className="py-2 font-semibold text-gray-600">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLogs.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="py-2 text-gray-500 align-top">{log.date}</td>
                                        <td className="py-2 font-medium text-gray-800 align-top">{getFoodEmoji(log.id)} {log.id}</td>
                                        <td className="py-2 text-gray-600 align-top">
                                            {log.reaction}/7
                                            {log.allergyReaction && log.allergyReaction !== 'none' && (
                                                <span className="block text-xs text-red-600 font-bold">{log.allergyReaction}</span>
                                            )}
                                        </td>
                                        <td className="py-2 text-gray-500 align-top italic">{log.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500 italic text-center py-4">No logs found for this period.</p>
                    )}
                </div>

                {/* Footer for Report */}
                <div className="mt-12 pt-4 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-400">Generated by Tiny Tastes Tracker</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorReportModal;
