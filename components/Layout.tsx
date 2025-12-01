
import React from 'react';
import { Page, UserProfile, AppMode, AppModeConfig } from '../types';
import Icon from './ui/Icon';

interface LayoutProps {
  currentPage: string; // Changed from Page to string to support other modes' nav items
  setCurrentPage: (page: any) => void;
  profile: UserProfile | null;
  progress: { triedCount: number; totalCount: number };
  mode?: AppMode;
  config?: AppModeConfig;
  children: React.ReactNode;
}

const NavButton: React.FC<{
  page: string;
  label: string;
  icon: string;
  currentPage: string;
  setCurrentPage: (page: any) => void;
  activeColorClass: string;
}> = ({ page, label, icon, currentPage, setCurrentPage, activeColorClass }) => {
  const isActive = currentPage === page;
  const color = isActive ? activeColorClass : 'text-gray-500 hover:text-gray-700';

  return (
    <button
      onClick={() => setCurrentPage(page)}
      className={`nav-btn flex flex-col items-center justify-center p-3 w-full transition-colors ${color}`}
    >
      <Icon name={icon} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

const Layout: React.FC<LayoutProps> = ({ currentPage, setCurrentPage, profile, children, mode = 'EXPLORER', config }) => {
  // Fallback config if not provided
  const themeColor = config?.themeColor || 'bg-teal-600';
  const homeTitle = config?.homeTitle || 'Tiny Tastes Tracker';
  const navItems = config?.navItems || [
      { id: 'tracker', label: 'Tracker', icon: 'grid-3x3' },
      { id: 'recommendations', label: 'Recs', icon: 'lightbulb' },
      { id: 'recipes', label: 'Recipes', icon: 'notebook-pen' },
      { id: 'learn', label: 'Learn', icon: 'book-open' },
      { id: 'profile', label: 'Profile', icon: 'user' }
  ];
  const activeTextColor = config?.textColor || 'text-teal-600';

  const getSubtitle = () => {
    if (profile?.babyName) {
      return <>Tracking for: <span className="font-semibold opacity-90">{profile.babyName}</span></>;
    }
    return "Let's track some tiny tastes!";
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header: Added pt-safe for iPhone Notch support */}
      <header className={`${themeColor} shadow-md sticky top-0 z-10 transition-colors duration-500 pt-safe`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
              <div>
                  <h1 className="text-2xl font-bold text-white md:text-3xl drop-shadow-sm">
                    {homeTitle}
                  </h1>
                  <p className="text-sm text-teal-50 mt-1">{getSubtitle()}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {mode} MODE
                  </span>
              </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full">
        <div className="page-content py-6 px-4 sm:px-6 lg:px-8">
            {children}
        </div>
      </main>

      {/* Nav: Added pb-safe for iPhone Home Indicator support */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 pb-safe">
        <div className="max-w-7xl mx-auto flex justify-around px-2 sm:px-6 lg:px-8">
          {navItems.map(item => (
              <NavButton 
                key={item.id}
                page={item.id}
                label={item.label}
                icon={item.icon}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                activeColorClass={activeTextColor}
              />
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
