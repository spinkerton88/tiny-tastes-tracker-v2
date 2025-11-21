import React, { useState, useEffect } from 'react';
import { UserProfile, TriedFoodLog } from '../../types';
import { allFoods } from '../../constants';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';

interface ProfilePageProps {
  userProfile: UserProfile | null;
  triedFoods: TriedFoodLog[];
  onSaveProfile: (profile: UserProfile) => void;
  onResetData: () => void;
}

const SyncInfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[501]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">Syncing Data Across Devices</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
        </div>
        <div className="p-6 modal-scroll-content prose-static">
            <p>You can keep your Tiny Tastes data in sync between your phone, tablet, and computer by using a cloud storage service like iCloud Drive or Google Drive.</p>
            <h4 className="font-semibold mt-4">How it works:</h4>
            <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>
                    <strong>First-Time Save:</strong><br />
                    On your primary device, tap <strong>"Download Backup"</strong>. When your device asks where to save the <code>tiny-tastes-backup.json</code> file, choose a location inside your <strong>iCloud Drive</strong> or <strong>Google Drive</strong>.
                </li>
                <li>
                    <strong>Loading on Another Device:</strong><br />
                    On your second device, open the app and tap <strong>"Load from Backup File"</strong> on this page. Navigate to your cloud drive and select the <code>.json</code> file you saved. Your data will now be loaded.
                </li>
                <li>
                    <strong>Updating Your Backup:</strong><br />
                    After logging new foods or recipes, save your progress by tapping <strong>"Update Backup File"</strong>. Select the <em>same</em> <code>.json</code> file in your cloud drive to overwrite it with your latest data.
                </li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">Note: The "Update Backup File" feature requires a modern browser like Chrome or Edge.</p>
        </div>
      </div>
    </div>
);

const ProfileView: React.FC<{ userProfile: UserProfile | null, onSaveProfile: (profile: UserProfile) => void, onResetData: () => void }> = ({ userProfile, onSaveProfile, onResetData }) => {
    const [name, setName] = useState(userProfile?.babyName || '');
    const [birthDate, setBirthDate] = useState(userProfile?.birthDate || '');
    const [allergies, setAllergies] = useState(userProfile?.knownAllergies || '');
    const [showInfoModal, setShowInfoModal] = useState(false);
    
    const isSavePickerSupported = 'showSaveFilePicker' in window;
    
    useEffect(() => {
        setName(userProfile?.babyName || '');
        setBirthDate(userProfile?.birthDate || '');
        setAllergies(userProfile?.knownAllergies || '');
    }, [userProfile]);

    const handleSave = () => {
        onSaveProfile({
            ...userProfile,
            babyName: name,
            birthDate: birthDate,
            knownAllergies: allergies,
        });
        alert("Profile saved!");
    };
    
    const getBackupData = () => {
        return {
            profile: JSON.parse(localStorage.getItem(`tiny-tastes-tracker-profile`) || 'null'),
            triedFoods: JSON.parse(localStorage.getItem(`tiny-tastes-tracker-triedFoods`) || '[]'),
            recipes: JSON.parse(localStorage.getItem(`tiny-tastes-tracker-recipes`) || '[]'),
            mealPlan: JSON.parse(localStorage.getItem(`tiny-tastes-tracker-mealPlan`) || '{}'),
        };
    };

    const handleExport = () => {
        try {
            const dataToExport = getBackupData();
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = `tiny-tastes-backup.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
        } catch (error) {
            console.error("Failed to export data:", error);
            alert("Sorry, there was an error exporting your data.");
        }
    };
    
    const handleUpdateBackup = async () => {
        try {
            const dataToExport = getBackupData();
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // @ts-ignore
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: 'tiny-tastes-backup.json',
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] },
                }],
            });

            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            
            alert("Backup file updated successfully!");

        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log("User cancelled the save dialog.");
            } else {
                console.error("Failed to save data:", error);
                alert("Sorry, there was an error saving your data.");
            }
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not readable");
                const importedData = JSON.parse(text);

                if (!('profile' in importedData && 'triedFoods' in importedData && 'recipes' in importedData && 'mealPlan' in importedData)) {
                    throw new Error("Invalid data file format. The file must be a valid export from Tiny Tastes Tracker.");
                }

                if (window.confirm("This will overwrite all existing data on this device. This action cannot be undone. Are you sure you want to continue?")) {
                    localStorage.setItem(`tiny-tastes-tracker-profile`, JSON.stringify(importedData.profile || null));
                    localStorage.setItem(`tiny-tastes-tracker-triedFoods`, JSON.stringify(importedData.triedFoods || []));
                    localStorage.setItem(`tiny-tastes-tracker-recipes`, JSON.stringify(importedData.recipes || []));
                    localStorage.setItem(`tiny-tastes-tracker-mealPlan`, JSON.stringify(importedData.mealPlan || {}));
                    
                    alert("Data imported successfully! The app will now reload to apply the changes.");
                    window.location.reload();
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                alert(`Error importing data: ${message}`);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };
    
    const triggerImport = () => {
        document.getElementById('import-file-input')?.click();
    };
    
    return (
        <div className="space-y-6">
            {showInfoModal && <SyncInfoModal onClose={() => setShowInfoModal(false)} />}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800">My Baby's Profile</h3>
                <p className="text-sm text-gray-600 mt-1 mb-4">Personalize the app with your baby's name, birth date, and any known allergies.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="baby-name-input" className="block text-sm font-medium text-gray-700">Baby's Name:</label>
                        <input type="text" id="baby-name-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Alex" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="birth-date-input" className="block text-sm font-medium text-gray-700">Baby's Birth Date:</label>
                        <input type="date" id="birth-date-input" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" />
                    </div>
                </div>
                <div className="mt-4">
                    <label htmlFor="known-allergies-input" className="block text-sm font-medium text-gray-700">Known Allergies:</label>
                    <textarea id="known-allergies-input" value={allergies} onChange={e => setAllergies(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" placeholder="e.g., Dairy, Soy (for your reference)"></textarea>
                </div>
                <button onClick={handleSave} className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                    Save Profile
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Account & Data</h3>
                    <button onClick={() => setShowInfoModal(true)} title="Learn how to sync data" className="text-gray-400 hover:text-gray-600">
                        <Icon name="info" className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-medium text-gray-800">Backup & Restore Data</h4>
                        <p className="text-sm text-gray-600 mt-1">Save your data to a file to transfer between devices or keep as a backup.</p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={handleExport} className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                <Icon name="download" className="w-4 h-4" /> Download Backup
                            </button>
                            <button onClick={triggerImport} className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                <Icon name="folder-open" className="w-4 h-4" /> Load Backup
                            </button>
                            {isSavePickerSupported && (
                                <button onClick={handleUpdateBackup} className="sm:col-span-2 w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    <Icon name="save" className="w-4 h-4" /> Update Existing Backup File...
                                </button>
                            )}
                            <input type="file" id="import-file-input" accept=".json" onChange={handleImport} className="hidden" />
                        </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-medium text-red-800">Reset App Data</h4>
                        <p className="text-sm text-red-700 mt-1">This will permanently delete all your data from this device. Use this if you want to start over.</p>
                        <div className="mt-3">
                            <button onClick={onResetData} className="w-full sm:w-auto inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                                <Icon name="trash-2" className="w-4 h-4" /> Reset All Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NoLogIllustration = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="20" y="10" width="60" height="80" rx="5" />
        <rect x="28" y="10" width="15" height="10" strokeWidth="2.5" />
        <path d="M 30 30 H 70 M 30 40 H 70 M 30 50 H 50" />
        <circle cx="50" cy="65" r="12" strokeDasharray="4 4" />
        <path d="M 45 65 H 55 M 50 60 V 70" />
    </svg>
);


const LogView: React.FC<{ triedFoods: TriedFoodLog[]; babyName?: string }> = ({ triedFoods, babyName }) => {
    const exportToCSV = () => {
        if (triedFoods.length === 0) {
            alert("No data to export.");
            return;
        }
        const headers = ['Food Name', 'Date', 'Meal', 'Reaction (1-7)', 'More than 1 Bite?', 'Allergy Reaction', 'Notes', 'Try Count'];
        const rows = triedFoods.map(log => {
            const safeFoodName = `"${(log.id || '').replace(/"/g, '""')}"`;
            const safeNotes = `"${(log.notes || '').replace(/"/g, '""')}"`;
            return [ safeFoodName, log.date || '', log.meal || '', log.reaction || '', log.moreThanOneBite ? "Yes" : "No", log.allergyReaction || 'none', safeNotes, log.tryCount || 1 ].join(',');
        });
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\r\n" + rows.join("\r\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tiny_tastes_summary.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const emailPediatrician = () => {
        alert("Please export the CSV and attach it to an email to your pediatrician.");
        const subject = babyName ? `${babyName}'s Food Log Summary` : "Baby's Food Log Summary";
        const body = `Hi Dr. [Name],\n\nI've attached ${babyName ? babyName + "'s" : "our baby's"} food log summary as a .csv file for you to review.\n\nThanks!`;
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    };

    const getReactionDisplay = (reactionValue: number) => {
        if (reactionValue <= 2) return { emoji: '😩', text: 'Hated it' };
        if (reactionValue <= 4) return { emoji: '😒', text: 'Meh' };
        if (reactionValue >= 7) return { emoji: '😍', text: 'Loved it!' };
        return { emoji: '😋', text: 'Liked it' };
    };

    const getMealEmoji = (meal: string) => {
        const map: { [key: string]: string } = { breakfast: '🍳', lunch: '🥪', dinner: '🍝', snack: '🍎' };
        return map[meal] || '🍽️';
    };

    const sortedFoods = [...triedFoods].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-semibold text-gray-800">Summary of Tried Foods</h3>
                <div className="flex-shrink-0 flex gap-2">
                    <button onClick={exportToCSV} className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                        <Icon name="sheet" /> CSV
                    </button>
                    <button onClick={emailPediatrician} className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        <Icon name="mail" /> Email
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                {sortedFoods.length === 0 ? (
                    <EmptyState
                        illustration={<NoLogIllustration />}
                        title="No Foods Logged Yet"
                        message="When you log a food from the 'Tracker' tab, your detailed entry will appear here."
                    />
                ) : (
                    sortedFoods.map(log => {
                        const foodDetails = allFoods.flatMap(c => c.items).find(f => f.name === log.id);
                        const { emoji, text } = getReactionDisplay(log.reaction);
                        const tryCount = log.tryCount || 1;
                        return (
                            <div key={log.id} className="bg-white shadow rounded-lg p-4 border-l-4 border-teal-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-gray-800">{foodDetails?.emoji || '🍽️'} {log.id}</h3>
                                        {tryCount > 1 && (
                                            <span className="text-xs font-medium bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                                                Tried {tryCount} times
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500">{log.date}</span>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                    <div className="flex flex-col"><span className="text-gray-500">Meal</span><span className="font-medium text-gray-700">{getMealEmoji(log.meal)} {log.meal}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500">Reaction</span><span className="font-medium text-gray-700">{emoji} {text} ({log.reaction}/7)</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500">Amount</span><span className="font-medium text-gray-700">{log.moreThanOneBite ? 'More than 1 bite' : 'Just a taste'}</span></div>
                                </div>
                                {log.allergyReaction && log.allergyReaction !== 'none' && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm font-medium text-red-700">Possible Reaction: <span className="font-bold">{log.allergyReaction}</span></p>
                                    </div>
                                )}
                                {log.notes && (
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Notes:</span> {log.notes}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const ProfilePage: React.FC<ProfilePageProps> = ({ userProfile, triedFoods, onSaveProfile, onResetData }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'log'>('profile');
    
    const navButtonClasses = (tabName: 'profile' | 'log') => {
        const base = "recipe-sub-nav-btn";
        const active = "active";
        return `${base} ${activeTab === tabName ? active : ''}`;
    };

    return (
        <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile & Log</h2>
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px">
                    <button onClick={() => setActiveTab('profile')} className={navButtonClasses('profile')}>
                        <Icon name="user-cog" className="w-4 h-4 inline-block -mt-1 mr-1" /> Profile Settings
                    </button>
                    <button onClick={() => setActiveTab('log')} className={navButtonClasses('log')}>
                        <Icon name="clipboard-list" className="w-4 h-4 inline-block -mt-1 mr-1" /> Food Log
                    </button>
                </nav>
            </div>
            
            {activeTab === 'profile' && <ProfileView userProfile={userProfile} onSaveProfile={onSaveProfile} onResetData={onResetData} />}
            {activeTab === 'log' && <LogView triedFoods={triedFoods} babyName={userProfile?.babyName} />}
        </>
    );
};

export default ProfilePage;