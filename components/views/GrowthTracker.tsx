
import React, { useState, useMemo } from 'react';
import { GrowthLog } from '../../types';
import Icon from '../ui/Icon';

interface GrowthTrackerProps {
    logs: GrowthLog[];
    onSave: (log: GrowthLog) => void;
    onDelete: (id: string) => void;
    baseColor: string;
}

const SimpleChart: React.FC<{ data: { value: number, date: string }[], color: string, unit: string, label: string }> = ({ data, color, unit, label }) => {
    if (data.length < 2) {
        return (
            <div className="h-40 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 text-gray-400 text-xs">
                Not enough data for {label} chart
            </div>
        );
    }

    const values = data.map(d => d.value);
    const min = Math.min(...values) * 0.95;
    const max = Math.max(...values) * 1.05;
    const range = max - min || 1;

    // SVG scaling
    const height = 150;
    const width = 300;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">{label} Trend</h4>
            <div className="relative h-[150px] w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="0" x2={width} y2="0" stroke="#f3f4f6" strokeWidth="1" />
                    <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#f3f4f6" strokeWidth="1" />
                    <line x1="0" y1={height} x2={width} y2={height} stroke="#f3f4f6" strokeWidth="1" />
                    
                    {/* Chart Line */}
                    <polyline fill="none" stroke={color} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Data Points */}
                    {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * width;
                        const y = height - ((d.value - min) / range) * height;
                        return (
                            <g key={i}>
                                <circle cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2" />
                                {/* Show label for last point */}
                                {i === data.length - 1 && (
                                    <text x={x} y={y - 10} textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">
                                        {d.value}{unit}
                                    </text>
                                )}
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    );
};

export const GrowthTracker: React.FC<GrowthTrackerProps> = ({ logs, onSave, onDelete, baseColor }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [weightLb, setWeightLb] = useState('');
    const [weightOz, setWeightOz] = useState('');
    const [heightIn, setHeightIn] = useState('');
    const [headIn, setHeadIn] = useState('');
    const [notes, setNotes] = useState('');

    // Derived Data
    const sortedLogs = useMemo(() => [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [logs]);
    const latestLog = sortedLogs[0];

    const weightData = useMemo(() => 
        sortedLogs
            .filter(l => l.weightLb !== undefined)
            .map(l => ({ 
                date: l.date, 
                value: parseFloat(((l.weightLb || 0) + (l.weightOz || 0)/16).toFixed(2)) 
            }))
            .reverse() // Oldest first for chart
    , [sortedLogs]);

    const heightData = useMemo(() => 
        sortedLogs
            .filter(l => l.heightIn !== undefined && l.heightIn > 0)
            .map(l => ({ date: l.date, value: l.heightIn || 0 }))
            .reverse()
    , [sortedLogs]);

    const handleSave = () => {
        if (!weightLb && !heightIn && !headIn) {
            alert("Please enter at least one measurement.");
            return;
        }

        const newLog: GrowthLog = {
            id: crypto.randomUUID(),
            date,
            weightLb: weightLb ? parseFloat(weightLb) : undefined,
            weightOz: weightOz ? parseFloat(weightOz) : undefined,
            heightIn: heightIn ? parseFloat(heightIn) : undefined,
            headCircumferenceIn: headIn ? parseFloat(headIn) : undefined,
            notes
        };

        onSave(newLog);
        setIsFormOpen(false);
        // Reset form
        setWeightLb(''); setWeightOz(''); setHeightIn(''); setHeadIn(''); setNotes('');
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className={`bg-${baseColor}-50 p-4 rounded-xl border border-${baseColor}-100 flex flex-col justify-center items-center shadow-sm`}>
                    <div className="p-2 bg-white rounded-full mb-2 shadow-sm">
                        <Icon name="scale" className={`w-5 h-5 text-${baseColor}-600`} />
                    </div>
                    <span className={`text-[10px] uppercase font-bold text-${baseColor}-400 tracking-wider`}>Weight</span>
                    <span className={`text-xl font-black text-${baseColor}-800 mt-1`}>
                        {latestLog?.weightLb ? `${latestLog.weightLb}lb ${latestLog.weightOz ? `${latestLog.weightOz}oz` : ''}` : '--'}
                    </span>
                </div>
                <div className={`bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center items-center shadow-sm`}>
                    <div className="p-2 bg-white rounded-full mb-2 shadow-sm">
                        <Icon name="ruler" className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Height</span>
                    <span className="text-xl font-black text-blue-800 mt-1">
                        {latestLog?.heightIn ? `${latestLog.heightIn} in` : '--'}
                    </span>
                </div>
            </div>

            {/* Actions */}
            {!isFormOpen ? (
                <button 
                    onClick={() => setIsFormOpen(true)}
                    className={`w-full py-3 bg-${baseColor}-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-${baseColor}-700 transition-colors`}
                >
                    <Icon name="plus" className="w-5 h-5" /> Log Measurements
                </button>
            ) : (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-fadeIn">
                    <h3 className="font-bold text-gray-800 mb-4">New Measurement</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Weight</label>
                                <div className="flex gap-2 mt-1">
                                    <input type="number" placeholder="lb" value={weightLb} onChange={e => setWeightLb(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm" />
                                    <input type="number" placeholder="oz" value={weightOz} onChange={e => setWeightOz(e.target.value)} className="w-full border-gray-300 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Height (in)</label>
                                <input type="number" placeholder="inches" value={heightIn} onChange={e => setHeightIn(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Head Circumference (in)</label>
                            <input type="number" placeholder="inches (optional)" value={headIn} onChange={e => setHeadIn(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Notes</label>
                            <input type="text" placeholder="e.g. 6 month checkup" value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setIsFormOpen(false)} className="flex-1 py-2 text-gray-600 font-bold bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleSave} className={`flex-1 py-2 text-white font-bold bg-${baseColor}-600 rounded-lg`}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="space-y-4">
                <SimpleChart data={weightData} color="#0d9488" unit="lb" label="Weight" />
                {heightData.length > 1 && <SimpleChart data={heightData} color="#3b82f6" unit="in" label="Height" />}
            </div>

            {/* History List */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wide">Measurement History</h3>
                {sortedLogs.length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm italic">No measurements logged yet.</p>
                ) : (
                    <div className="space-y-2">
                        {sortedLogs.map(log => (
                            <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold mb-0.5">{new Date(log.date).toLocaleDateString()}</p>
                                    <div className="flex gap-3 text-sm text-gray-800 font-medium">
                                        {log.weightLb && <span>{log.weightLb}lb {log.weightOz}oz</span>}
                                        {log.heightIn && <span>{log.heightIn}"</span>}
                                        {log.headCircumferenceIn && <span className="text-gray-500 text-xs">Head: {log.headCircumferenceIn}"</span>}
                                    </div>
                                    {log.notes && <p className="text-xs text-gray-500 mt-1 italic">"{log.notes}"</p>}
                                </div>
                                <button onClick={() => { if(confirm('Delete this entry?')) onDelete(log.id); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                    <Icon name="trash-2" className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
