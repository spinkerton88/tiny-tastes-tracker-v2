import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FeedLog, DiaperLog, SleepLog, UserProfile, DailyLogAnalysis, MedicineLog, MedicineInstructions, GrowthLog } from '../../types';
import { predictSleepWindow, SleepPrediction, analyzeDailyLogTotals, getMedicineInstructions } from '../../services/geminiService';
import { calculateAgeInMonths } from '../../utils';
import { GrowthTracker } from '../views/GrowthTracker';
import Icon from '../ui/Icon';

interface NewbornPageProps {
    currentPage?: string;
    feedLogs: FeedLog[];
    diaperLogs: DiaperLog[];
    sleepLogs: SleepLog[];
    medicineLogs?: MedicineLog[];
    growthLogs?: GrowthLog[];
    onLogFeed: (log: FeedLog) => void;
    onLogDiaper: (log: DiaperLog) => void;
    onLogSleep: (log: SleepLog) => void;
    onUpdateSleepLog?: (log: SleepLog) => void;
    onLogMedicine?: (log: MedicineLog) => void;
    onLogGrowth?: (log: GrowthLog) => void;
    onDeleteGrowth?: (id: string) => void;
    baseColor?: string;
    userProfile?: UserProfile | null;
    onUpdateProfile?: (profile: UserProfile) => void;
}

// ... (Rest of formatTimer and helper functions remain unchanged)
const timeSince = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// ... (Existing Modals: BreastfeedingModal, BottleModal, DiaperModal, MedicineModal - KEEP AS IS)
const BreastfeedingModal: React.FC<{ onClose: () => void, onSave: (data: any) => void, lastSide?: 'left' | 'right' | 'both' }> = ({ onClose, onSave, lastSide }) => {
    const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
    const [timer, setTimer] = useState(0);
    const [isPaused, setIsPaused] = useState(true);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isPaused && activeSide) {
            intervalRef.current = window.setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPaused, activeSide]);

    const handleToggle = (side: 'left' | 'right') => {
        if (activeSide === side) {
            setIsPaused(!isPaused);
        } else {
            setActiveSide(side);
            setIsPaused(false);
        }
    };

    const handleFinish = () => {
        onSave({ type: 'breast', side: activeSide || 'left', durationSeconds: timer });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-rose-900/90 z-[1000] flex flex-col items-center justify-center p-6 text-white">
            <h2 className="text-2xl font-bold mb-8 opacity-80">Breastfeeding Timer</h2>
            
            <div className="text-7xl font-mono font-bold mb-12 tracking-wider">
                {formatTimer(timer)}
            </div>

            <div className="flex gap-6 w-full max-w-sm mb-12">
                <button 
                    onClick={() => handleToggle('left')}
                    className={`flex-1 aspect-square rounded-full flex flex-col items-center justify-center border-4 transition-all ${activeSide === 'left' ? 'bg-white text-rose-600 border-white scale-110' : 'border-white/30 text-white hover:bg-white/10'}`}
                >
                    <span className="text-3xl font-bold">L</span>
                    {activeSide === 'left' && <span className="text-xs mt-1 font-bold">{isPaused ? 'PAUSED' : 'ACTIVE'}</span>}
                    {lastSide === 'left' && activeSide !== 'left' && <span className="text-[10px] mt-1 opacity-70">Last Side</span>}
                </button>

                <button 
                    onClick={() => handleToggle('right')}
                    className={`flex-1 aspect-square rounded-full flex flex-col items-center justify-center border-4 transition-all ${activeSide === 'right' ? 'bg-white text-rose-600 border-white scale-110' : 'border-white/30 text-white hover:bg-white/10'}`}
                >
                    <span className="text-3xl font-bold">R</span>
                    {activeSide === 'right' && <span className="text-xs mt-1 font-bold">{isPaused ? 'PAUSED' : 'ACTIVE'}</span>}
                    {lastSide === 'right' && activeSide !== 'right' && <span className="text-[10px] mt-1 opacity-70">Last Side</span>}
                </button>
            </div>

            <div className="flex gap-4 w-full max-w-sm">
                <button onClick={onClose} className="flex-1 py-4 rounded-xl font-bold border border-white/30 text-white hover:bg-white/10">Discard</button>
                <button onClick={handleFinish} className="flex-[2] py-4 rounded-xl font-bold bg-white text-rose-600 shadow-lg">Finish Feed</button>
            </div>
        </div>
    );
};

const BottleModal: React.FC<{ onClose: () => void, onSave: (data: any) => void }> = ({ onClose, onSave }) => {
    const [amount, setAmount] = useState(2); // oz

    const handleSave = () => {
        onSave({ type: 'bottle', amount });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-popIn">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Bottle Feed</h3>
                
                <div className="flex items-center justify-center gap-6 mb-8">
                    <button onClick={() => setAmount(Math.max(0.5, amount - 0.5))} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-600">-</button>
                    <div className="text-center">
                        <span className="text-5xl font-bold text-rose-600">{amount}</span>
                        <span className="text-gray-500 font-medium ml-1">oz</span>
                    </div>
                    <button onClick={() => setAmount(amount + 0.5)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-600">+</button>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 text-white font-bold bg-rose-600 rounded-xl shadow-md">Log Feed</button>
                </div>
            </div>
        </div>
    );
};

const DiaperModal: React.FC<{ onClose: () => void, onSave: (type: 'wet' | 'dirty' | 'mixed') => void }> = ({ onClose, onSave }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-popIn">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Diaper Check</h3>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button onClick={() => { onSave('wet'); onClose(); }} className="aspect-square rounded-xl bg-blue-50 border-2 border-blue-100 flex flex-col items-center justify-center gap-2 hover:bg-blue-100">
                        <Icon name="droplet" className="w-8 h-8 text-blue-500" />
                        <span className="font-bold text-blue-700">Wet</span>
                    </button>
                    <button onClick={() => { onSave('dirty'); onClose(); }} className="aspect-square rounded-xl bg-orange-50 border-2 border-orange-100 flex flex-col items-center justify-center gap-2 hover:bg-orange-100">
                        <Icon name="poop" className="w-8 h-8 text-orange-600" /> {/* Using poop-like icon or circle */}
                        <span className="font-bold text-orange-700">Dirty</span>
                    </button>
                    <button onClick={() => { onSave('mixed'); onClose(); }} className="aspect-square rounded-xl bg-purple-50 border-2 border-purple-100 flex flex-col items-center justify-center gap-2 hover:bg-purple-100">
                        <div className="flex gap-1">
                            <Icon name="droplet" className="w-4 h-4 text-blue-500" />
                            <Icon name="poop" className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-bold text-purple-700">Both</span>
                    </button>
                </div>

                <button onClick={onClose} className="w-full py-3 text-gray-500 font-bold">Cancel</button>
            </div>
        </div>
    );
};

const MedicineModal: React.FC<{ onClose: () => void, onSave: (med: MedicineLog) => void }> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [weight, setWeight] = useState('');
    const [amount, setAmount] = useState('');
    const [instructions, setInstructions] = useState<MedicineInstructions | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGetSafetyInfo = async () => {
        if (!name.trim() || !weight.trim()) {
            setError("Please enter medicine name and baby's weight.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await getMedicineInstructions(name, weight);
            setInstructions(result);
        } catch (err) {
            setError("Could not retrieve safety info. Please consult your doctor.");
        } finally {
            setLoading(false);
        }
    };

    const handleLog = () => {
        if (!name.trim()) return;
        onSave({
            id: crypto.randomUUID(),
            medicineName: name,
            amount: amount,
            timestamp: new Date().toISOString(),
            notes: `Weight at time of dose: ${weight}`
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-90 flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-popIn flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-teal-800 flex items-center gap-2">
                        <Icon name="pill" className="w-6 h-6" /> Medicine Tracker
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                        <input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="e.g. Infant Tylenol" 
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Baby's Weight (required for safety check)</label>
                        <input 
                            value={weight} 
                            onChange={(e) => setWeight(e.target.value)} 
                            placeholder="e.g. 15 lbs or 7 kg" 
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                        />
                    </div>

                    {!instructions && (
                        <button 
                            onClick={handleGetSafetyInfo} 
                            disabled={loading || !name || !weight}
                            className="w-full py-2 bg-teal-100 text-teal-700 rounded-lg font-bold text-sm hover:bg-teal-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading ? <div className="spinner w-4 h-4 border-teal-600"></div> : <Icon name="shield-check" className="w-4 h-4" />}
                            Get Safety Info
                        </button>
                    )}

                    {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

                    {instructions && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-3 text-sm animate-fadeIn">
                            <div className="flex items-start gap-2">
                                <Icon name="alert-triangle" className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                <p className="font-bold text-orange-800 text-xs leading-relaxed">{instructions.critical_warning}</p>
                            </div>
                            
                            <div className="bg-white/60 p-2 rounded border border-orange-100">
                                <p className="text-xs font-bold text-orange-700 uppercase mb-1">Safe Administration Checklist:</p>
                                <ul className="list-disc pl-4 space-y-1 text-gray-700 text-xs">
                                    {instructions.safe_administration_checklist.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            {instructions.source_tip && (
                                <p className="text-[10px] text-gray-500 italic border-t border-orange-200 pt-2 flex items-center gap-1">
                                    <Icon name="phone" className="w-3 h-3" /> {instructions.source_tip}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Given (Optional)</label>
                        <input 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            placeholder="e.g. 2.5 ml" 
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Only enter after confirming safe dosage with a doctor.</p>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 text-gray-600 font-bold bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={handleLog} className="flex-1 py-2 text-white font-bold bg-teal-600 rounded-lg shadow-md hover:bg-teal-700">Log Dose</button>
                </div>
            </div>
        </div>
    );
};

// ... (HealthCheckView - KEEP AS IS)
const HealthCheckView: React.FC<{ feedLogs: FeedLog[], diaperLogs: DiaperLog[], userProfile: UserProfile | null }> = ({ feedLogs, diaperLogs, userProfile }) => {
    const [analysis, setAnalysis] = useState<DailyLogAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate rolling 24h stats
    const stats = useMemo(() => {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentFeeds = feedLogs.filter(l => new Date(l.timestamp) >= oneDayAgo);
        const recentDiapers = diaperLogs.filter(l => new Date(l.timestamp) >= oneDayAgo);
        
        const wetDiapers = recentDiapers.filter(d => d.type === 'wet' || d.type === 'mixed').length;
        const dirtyDiapers = recentDiapers.filter(d => d.type === 'dirty' || d.type === 'mixed').length;
        
        const totalFeedOz = recentFeeds.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const totalFeeds = recentFeeds.length;

        return { wetDiapers, dirtyDiapers, totalFeedOz, totalFeeds };
    }, [feedLogs, diaperLogs]);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const ageMonths = userProfile?.birthDate ? calculateAgeInMonths(userProfile.birthDate) : 3; // default to 3m if unknown
            const ageDesc = `${ageMonths} months old`;
            
            const result = await analyzeDailyLogTotals(ageDesc, stats);
            setAnalysis(result);
        } catch (err) {
            console.error(err);
            setError("Sage couldn't connect to safety databases right now.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'Normal') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'Watch Closely' || status === 'Low' || status === 'High') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (status === 'Contact Pediatrician') return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-100 rounded-full">
                        <Icon name="activity" className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Daily Safety Check</h2>
                        <p className="text-xs text-gray-500">Compare your last 24h totals against medical guidelines.</p>
                    </div>
                </div>

                {/* Input Summary */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <span className="block text-xl font-bold text-gray-800">{stats.wetDiapers}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Wet Diapers</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <span className="block text-xl font-bold text-gray-800">{stats.dirtyDiapers}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Dirty Diapers</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <span className="block text-xl font-bold text-gray-800">
                            {stats.totalFeedOz > 0 ? `${stats.totalFeedOz}oz` : `${stats.totalFeeds}x`}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Intake (24h)</span>
                    </div>
                </div>

                {!analysis ? (
                    <button 
                        onClick={handleAnalyze} 
                        disabled={loading}
                        className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-md hover:bg-teal-700 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Checking Guidelines...
                            </>
                        ) : (
                            <>
                                <Icon name="shield-check" className="w-5 h-5" />
                                Is This Normal?
                            </>
                        )}
                    </button>
                ) : (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Overall Status */}
                        <div className={`p-4 rounded-xl border text-center ${getStatusColor(analysis.overall_status)}`}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1">Overall Assessment</p>
                            <p className="text-2xl font-black">{analysis.overall_status}</p>
                        </div>

                        {/* Metrics Breakdown */}
                        <div className="space-y-3">
                            {analysis.data_points.map((point, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-800">{point.metric}</h4>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(point.status)}`}>
                                            {point.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                                        <span>Your value: <strong>{point.value_logged}</strong></span>
                                        <span>Normal: {point.normal_range}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{point.guidance}</p>
                                </div>
                            ))}
                        </div>

                        {/* Warning/Disclaimer */}
                        <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex gap-2 items-start">
                            <Icon name="alert-triangle" className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-orange-800 font-medium">{analysis.disclaimer_warning}</p>
                        </div>

                        <button 
                            onClick={handleAnalyze} 
                            className="w-full py-2 text-sm text-teal-600 font-bold hover:bg-teal-50 rounded-lg transition-colors"
                        >
                            Refresh Check
                        </button>
                    </div>
                )}
                
                {error && <p className="text-sm text-red-600 mt-4 text-center bg-red-50 p-2 rounded">{error}</p>}
            </div>
        </div>
    );
};

// --- Sleep & Growth View Component ---

const SleepGrowthView: React.FC<{ 
    sleepLogs: SleepLog[], 
    growthLogs: GrowthLog[], 
    onLogGrowth: (log: GrowthLog) => void,
    onDeleteGrowth: (id: string) => void
}> = ({ sleepLogs, growthLogs, onLogGrowth, onDeleteGrowth }) => {
    const [activeTab, setActiveTab] = useState<'sleep' | 'growth'>('sleep');
    const [prediction, setPrediction] = useState<SleepPrediction | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePredict = async () => {
        setLoading(true);
        setError(null);
        try {
            // Prepare Data: Filter last 48 hours and completed sleeps
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            const recentLogs = sleepLogs
                .filter(log => new Date(log.startTime) >= twoDaysAgo && log.endTime)
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()); // Sort Ascending for sequential processing

            const sortedDesc = [...sleepLogs].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
            const latest = sortedDesc[0];

            if (latest && !latest.endTime) {
                setError("Baby is currently sleeping! Wake them up to predict the next nap.");
                setLoading(false);
                return;
            }

            const lastWakeTime = latest ? latest.endTime : new Date().toISOString();
            const logSummary = recentLogs.map(l => `Sleep: ${new Date(l.startTime).toLocaleTimeString()} - Wake: ${new Date(l.endTime!).toLocaleTimeString()}`).join('\n');

            const result = await predictSleepWindow(
                new Date().toLocaleTimeString(), 
                new Date(lastWakeTime!).toLocaleTimeString(), 
                logSummary || "No recent sleep data found."
            );
            
            setPrediction(result);
        } catch (err) {
            console.error(err);
            setError("Sage is having trouble predicting right now.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 pb-24">
            {/* Tab Toggle */}
            <div className="flex border border-indigo-100 rounded-xl overflow-hidden bg-white p-1">
                <button 
                    onClick={() => setActiveTab('sleep')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'sleep' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Sleep
                </button>
                <button 
                    onClick={() => setActiveTab('growth')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'growth' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Growth
                </button>
            </div>

            {activeTab === 'sleep' ? (
                <>
                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Icon name="moon" className="w-32 h-32 text-indigo-900" />
                        </div>
                        
                        <h2 className="text-xl font-bold text-indigo-900 mb-2 relative z-10">Sleep Sweet Spot</h2>
                        <p className="text-sm text-indigo-700 mb-6 relative z-10 max-w-xs">
                            Sage analyzes your recent logs to find the perfect window for the next nap.
                        </p>

                        {prediction ? (
                            <div className="bg-white rounded-xl p-5 shadow-sm relative z-10 animate-fadeIn border border-indigo-100">
                                {prediction.prediction_status === 'Ready' ? (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Nap Time</p>
                                                <p className="text-3xl font-black text-indigo-600 mt-1">{prediction.next_sweet_spot_start}</p>
                                            </div>
                                            <div className="bg-indigo-50 p-2 rounded-lg text-center min-w-[80px]">
                                                <p className="text-[10px] text-indigo-400 uppercase font-bold">Avg Window</p>
                                                <p className="text-lg font-bold text-indigo-700">{prediction.average_wake_window_minutes}m</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex gap-2 items-start">
                                                <Icon name="info" className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-gray-600">{prediction.reasoning_summary}</p>
                                            </div>
                                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-2 items-start">
                                                <Icon name="lightbulb" className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-yellow-800 font-medium">{prediction.troubleshooting_tip}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handlePredict} 
                                            className="w-full mt-4 py-2 text-xs font-bold text-indigo-400 hover:text-indigo-600 border-t border-gray-100"
                                        >
                                            Refresh Prediction
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <Icon name="alert-circle" className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                        <h3 className="font-bold text-gray-700">Needs More Data</h3>
                                        <p className="text-sm text-gray-500 mt-1">Keep logging sleeps! We need about 48 hours of consistent data to find the pattern.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button 
                                onClick={handlePredict}
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 relative z-10"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analyzing Patterns...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="sparkles" className="w-4 h-4" />
                                        Predict Next Nap
                                    </>
                                )}
                            </button>
                        )}
                        
                        {error && <p className="text-sm text-red-600 font-medium mt-3 bg-red-50 p-2 rounded relative z-10 text-center">{error}</p>}
                    </div>

                    <div className="px-1">
                        <h3 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wide">Recent Sleep Logs</h3>
                        {sleepLogs.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-sm text-gray-400">No sleep logs yet.</p>
                            </div>
                        ) : (
                            sleepLogs.slice(0, 10).map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-4 mb-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.endTime ? 'bg-indigo-50 text-indigo-500' : 'bg-green-50 text-green-600 animate-pulse'}`}>
                                            <Icon name="moon" className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm">{log.endTime ? 'Nap' : 'Sleeping Now...'}</h4>
                                            <p className="text-xs text-gray-500">
                                                {new Date(log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                {log.endTime && ` - ${new Date(log.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                            </p>
                                        </div>
                                    </div>
                                    {log.endTime && (
                                        <span className="text-xs font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded">
                                            {Math.round((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 60000)}m
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <GrowthTracker 
                    logs={growthLogs}
                    onSave={onLogGrowth}
                    onDelete={onDeleteGrowth}
                    baseColor="indigo"
                />
            )}
        </div>
    );
};

const NewbornPage: React.FC<NewbornPageProps> = ({ 
    currentPage, feedLogs, diaperLogs, sleepLogs, medicineLogs = [], growthLogs = [],
    onLogFeed, onLogDiaper, onLogSleep, onUpdateSleepLog, onLogMedicine, onLogGrowth = () => {}, onDeleteGrowth = () => {},
    baseColor = 'rose', userProfile, onUpdateProfile 
}) => {
    // ... (Keep existing modal state logic: showBreastTimer, showBottleModal etc.)
    const [showBreastTimer, setShowBreastTimer] = useState(false);
    const [showBottleModal, setShowBottleModal] = useState(false);
    const [showDiaperModal, setShowDiaperModal] = useState(false);
    const [showMedicineModal, setShowMedicineModal] = useState(false);
    const [showFeedOptions, setShowFeedOptions] = useState(false);

    const feedInterval = userProfile?.feedIntervalHours || 3;

    // --- Derived Data for Dashboard ---
    const lastFeed = feedLogs[0];
    const lastDiaper = diaperLogs[0];
    const lastSleep = sleepLogs[0];
    const lastMedicine = medicineLogs[0];
    
    // Check if currently sleeping
    const isSleeping = lastSleep && !lastSleep.endTime;

    const nextFeedTime = lastFeed 
        ? new Date(new Date(lastFeed.timestamp).getTime() + (feedInterval * 60 * 60 * 1000)) 
        : null;

    const triggerHaptic = () => {
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const handleFeedClick = () => {
        triggerHaptic();
        setShowFeedOptions(true);
    };

    const handleSleepClick = () => {
        triggerHaptic();
        if (isSleeping && onUpdateSleepLog) {
            // Wake Up
            onUpdateSleepLog({
                ...lastSleep,
                endTime: new Date().toISOString()
            });
        } else {
            // Start Sleep
            onLogSleep({ id: crypto.randomUUID(), type: 'sleep', startTime: new Date().toISOString() });
        }
    };

    const handleUpdateInterval = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onUpdateProfile && userProfile) {
            onUpdateProfile({ ...userProfile, feedIntervalHours: Number(e.target.value) });
        }
    };

    if (currentPage === 'sleep_growth' || currentPage === 'growth') {
        return <SleepGrowthView sleepLogs={sleepLogs} growthLogs={growthLogs} onLogGrowth={onLogGrowth} onDeleteGrowth={onDeleteGrowth} />;
    }

    if (currentPage === 'health_check' || currentPage === 'diapers' || currentPage === 'health') {
        return <HealthCheckView feedLogs={feedLogs} diaperLogs={diaperLogs} userProfile={userProfile || null} />;
    }

    // ... (Keep the main dashboard return statement identical to previous, just wrapped correctly)
    return (
        <div className="flex flex-col h-[calc(100vh-140px)] relative">
            {/* 1. Dashboard Banner */}
            <div className="bg-gradient-to-r from-rose-50 to-white p-5 rounded-2xl shadow-sm border border-rose-100 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-rose-900">Baby Status</h2>
                    <span className="text-xs font-semibold bg-white px-2 py-1 rounded-full text-rose-400 shadow-sm border border-rose-50">
                        {new Date().toLocaleDateString()}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Sleep Status (Top Left - Larger) */}
                    <div className={`p-4 rounded-xl border shadow-inner flex items-center justify-between transition-colors ${isSleeping ? 'bg-indigo-100 border-indigo-200' : 'bg-gray-50 border-gray-100'} col-span-2 sm:col-span-1`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isSleeping ? 'bg-indigo-200 text-indigo-700' : 'bg-amber-100 text-amber-500'}`}>
                                <Icon name={isSleeping ? "moon" : "sun"} className="w-5 h-5" />
                            </div>
                            <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wide block ${isSleeping ? "text-indigo-700" : "text-gray-400"}`}>Status</span>
                                <span className={`text-base font-bold ${isSleeping ? "text-indigo-900" : "text-gray-800"}`}>
                                    {isSleeping ? 'Asleep' : 'Awake'}
                                </span>
                            </div>
                        </div>
                        {isSleeping && <span className="text-xs font-bold text-indigo-600 animate-pulse">Zzz...</span>}
                    </div>

                    {/* Next Feed (Top Right - Interactive) */}
                    <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-center col-span-2 sm:col-span-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Next Feed</span>
                            <div className="relative">
                                <select 
                                    value={feedInterval} 
                                    onChange={handleUpdateInterval} 
                                    className="appearance-none bg-rose-50 text-rose-600 text-[10px] font-bold py-0.5 pl-2 pr-4 rounded border border-rose-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-300"
                                >
                                    <option value="1.5">1.5h</option>
                                    <option value="2">2h</option>
                                    <option value="2.5">2.5h</option>
                                    <option value="3">3h</option>
                                    <option value="3.5">3.5h</option>
                                    <option value="4">4h</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-rose-500">
                                    <Icon name="chevron-down" className="w-2.5 h-2.5" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Icon name="clock" className="w-4 h-4 text-rose-300" />
                            <span className="text-lg font-bold text-gray-800">
                                {nextFeedTime ? nextFeedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            </span>
                        </div>
                    </div>

                    {/* Last Feed (Bottom Left) */}
                    <div className="bg-white p-3 rounded-xl border border-rose-50 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Last Fed</span>
                        <div className="flex items-center gap-2">
                            <Icon name="milk" className="w-4 h-4 text-rose-400" />
                            <span className="text-sm font-bold text-gray-800">{lastFeed ? timeSince(lastFeed.timestamp) : '--'}</span>
                        </div>
                        {lastFeed && <span className="text-[10px] text-gray-400 mt-0.5 ml-6">{lastFeed.type === 'bottle' ? `${lastFeed.amount}oz` : `${Math.floor((lastFeed.durationSeconds || 0)/60)}m`}</span>}
                    </div>

                    {/* Last Diaper (Bottom Right) */}
                    <div className="bg-white p-3 rounded-xl border border-blue-50 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Last Diaper</span>
                        <div className="flex items-center gap-2">
                            <Icon name="baby" className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-bold text-gray-800">{lastDiaper ? timeSince(lastDiaper.timestamp) : '--'}</span>
                        </div>
                        {lastDiaper && <span className="text-[10px] text-gray-400 mt-0.5 ml-6 capitalize">{lastDiaper.type}</span>}
                    </div>
                </div>
            </div>

            {/* 2. Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                <button 
                    onClick={handleFeedClick}
                    className="flex flex-col items-center gap-2 p-3 bg-white border border-rose-100 rounded-xl shadow-sm hover:bg-rose-50 transition-colors active:scale-95"
                >
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                        <Icon name="milk" className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Feed</span>
                </button>

                <button 
                    onClick={() => { triggerHaptic(); setShowDiaperModal(true); }}
                    className="flex flex-col items-center gap-2 p-3 bg-white border border-blue-100 rounded-xl shadow-sm hover:bg-blue-50 transition-colors active:scale-95"
                >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Icon name="droplet" className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Diaper</span>
                </button>

                <button 
                    onClick={handleSleepClick}
                    className="flex flex-col items-center gap-2 p-3 bg-white border border-indigo-100 rounded-xl shadow-sm hover:bg-indigo-50 transition-colors active:scale-95"
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSleeping ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                        <Icon name={isSleeping ? "sun" : "moon"} className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{isSleeping ? 'Wake' : 'Sleep'}</span>
                </button>

                <button 
                    onClick={() => { triggerHaptic(); setShowMedicineModal(true); }}
                    className="flex flex-col items-center gap-2 p-3 bg-white border border-teal-100 rounded-xl shadow-sm hover:bg-teal-50 transition-colors active:scale-95"
                >
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                        <Icon name="pill" className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Meds</span>
                </button>
            </div>

            {/* 3. Recent History List */}
            <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-20">
                <h3 className="text-sm font-bold text-gray-500 mb-3 px-1">Today's Logs</h3>
                {[...feedLogs, ...diaperLogs, ...sleepLogs, ...medicineLogs]
                    .sort((a, b) => new Date((b as any).timestamp || (b as any).startTime).getTime() - new Date((a as any).timestamp || (a as any).startTime).getTime())
                    .slice(0, 20)
                    .map((log: any) => {
                        let icon = 'circle';
                        let color = 'text-gray-400';
                        let bg = 'bg-gray-50';
                        let title = 'Event';
                        let detail = '';

                        if (log.amount !== undefined && log.medicineName) {
                            icon = 'pill';
                            color = 'text-teal-600';
                            bg = 'bg-teal-50';
                            title = log.medicineName;
                            detail = log.amount || 'Dose Logged';
                        } else if (log.amount !== undefined || log.durationSeconds !== undefined) {
                            icon = 'milk'; 
                            color = 'text-rose-500'; 
                            bg = 'bg-rose-50';
                            title = log.type === 'breast' ? `Nursing (${log.side})` : 'Bottle';
                            detail = log.type === 'bottle' ? `${log.amount}oz` : `${Math.floor(log.durationSeconds/60)}m`;
                        } else if (log.type === 'wet' || log.type === 'dirty' || log.type === 'mixed') {
                            icon = 'baby';
                            color = 'text-blue-500';
                            bg = 'bg-blue-50';
                            title = 'Diaper';
                            detail = log.type;
                        } else if (log.type === 'sleep') {
                            icon = 'moon';
                            color = 'text-indigo-500';
                            bg = 'bg-indigo-50';
                            title = 'Sleep';
                            detail = log.endTime ? `${Math.round((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 60000)}m nap` : 'Sleeping...';
                        }

                        return (
                            <div key={log.id} className="flex items-center gap-3 p-3 mb-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
                                    <Icon name={icon} className={`w-5 h-5 ${color}`} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
                                    <p className="text-xs text-gray-500 capitalize">{detail}</p>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">
                                    {new Date(log.timestamp || log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        );
                    })}
            </div>

            {/* Overlays */}
            {showFeedOptions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-sm overflow-hidden animate-popIn">
                        <div className="p-4 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-rose-800 uppercase">Select Feed Type</h4>
                            <button onClick={() => setShowFeedOptions(false)} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                        </div>
                        <div className="p-2">
                            <button onClick={() => { setShowFeedOptions(false); setShowBreastTimer(true); }} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors">
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-full"><Icon name="clock" className="w-5 h-5"/></div>
                                <div>
                                    <span className="block font-bold text-gray-800">Breastfeeding Timer</span>
                                    <span className="text-xs text-gray-500">Track duration and side</span>
                                </div>
                            </button>
                            <button onClick={() => { setShowFeedOptions(false); setShowBottleModal(true); }} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors">
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-full"><Icon name="milk" className="w-5 h-5"/></div>
                                <div>
                                    <span className="block font-bold text-gray-800">Bottle Log</span>
                                    <span className="text-xs text-gray-500">Track amount in oz/ml</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBreastTimer && (
                <BreastfeedingModal 
                    onClose={() => setShowBreastTimer(false)} 
                    onSave={(data) => onLogFeed({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...data })}
                    lastSide={lastFeed?.type === 'breast' ? lastFeed.side : undefined}
                />
            )}

            {showBottleModal && (
                <BottleModal 
                    onClose={() => setShowBottleModal(false)}
                    onSave={(data) => onLogFeed({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...data })}
                />
            )}

            {showDiaperModal && (
                <DiaperModal 
                    onClose={() => setShowDiaperModal(false)}
                    onSave={(type) => onLogDiaper({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), type })}
                />
            )}

            {showMedicineModal && onLogMedicine && (
                <MedicineModal 
                    onClose={() => setShowMedicineModal(false)}
                    onSave={onLogMedicine}
                />
            )}
        </div>
    );
};

export default NewbornPage;