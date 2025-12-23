
import React from 'react';
import { GrowthTracker } from '../views/GrowthTracker';
import { GrowthLog, UserProfile } from '../../types';

interface ToddlerGrowthPageProps {
    growthLogs: GrowthLog[];
    onLogGrowth: (log: GrowthLog) => void;
    onDeleteGrowth: (id: string) => void;
    baseColor?: string;
    userProfile?: UserProfile | null;
}

const ToddlerGrowthPage: React.FC<ToddlerGrowthPageProps> = ({ growthLogs, onLogGrowth, onDeleteGrowth, baseColor = 'indigo', userProfile }) => {
    return (
        <div className="h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Growth Tracker</h2>
            <p className="text-sm text-gray-600 mb-6">Track height and weight milestones.</p>
            
            <GrowthTracker 
                logs={growthLogs}
                onSave={onLogGrowth}
                onDelete={onDeleteGrowth}
                baseColor={baseColor}
                userProfile={userProfile}
            />
        </div>
    );
};

export default ToddlerGrowthPage;
