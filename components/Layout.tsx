
import React, { useState } from 'react';
import { Page, UserProfile, AppMode, AppModeConfig } from '../types';
import Icon from './ui/Icon';

interface LayoutProps {
  currentPage: string;
  setCurrentPage: (page: any) => void;
  profile: UserProfile | null;
  allProfiles?: UserProfile[];
  onSwitchProfile?: (id: string) => void;
  onAddProfile?: () => void;
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

const Layout: React.FC<LayoutProps> = ({ currentPage, setCurrentPage, profile, allProfiles = [], onSwitchProfile, onAddProfile, children, mode = 'EXPLORER', config }) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

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

  const handleSwitch = (id: string) => {
      if (onSwitchProfile) onSwitchProfile(id);
      setIsSwitcherOpen(false);
  };

  const handleAdd = () => {
      if (onAddProfile) onAddProfile();
      setIsSwitcherOpen(false);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header: Added pt-safe for iPhone Notch support. Increased z-index to 50 to overlap content (like charts) */}
      <header className={`${themeColor} shadow-md sticky top-0 z-50 transition-colors duration-500 pt-safe`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center relative">
              <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm">
                    {homeTitle}
                  </h1>
                  
                  {/* Child Switcher */}
                  <div className="relative mt-1">
                      <button 
                        onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                        className="flex items-center gap-1 text-sm text-teal-50 font-medium hover:text-white transition-colors focus:outline-none"
                      >
                          <span>Tracking: <span className="font-bold border-b border-white/40">{profile?.babyName || 'Baby'}</span></span>
                          <Icon name="chevron-down" className={`w-3 h-3 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isSwitcherOpen && (
                          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-fadeIn z-[60]">
                              <div className="py-1">
                                  {allProfiles.map(p => (
                                      <button
                                        key={p.id}
                                        onClick={() => handleSwitch(p.id)}
                                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${p.id === profile?.id ? 'bg-teal-50 text-teal-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                      >
                                          {p.babyName}
                                          {p.id === profile?.id && <Icon name="check" className="w-3 h-3" />}
                                      </button>
                                  ))}
                                  <div className="border-t border-gray-100 mt-1 pt-1">
                                      <button 
                                        onClick={handleAdd}
                                        className="w-full text-left px-4 py-2 text-sm text-teal-600 font-bold hover:bg-gray-50 flex items-center gap-2"
                                      >
                                          <Icon name="plus-circle" className="w-4 h-4" /> Add Child
                                      </button>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {mode} MODE
                  </span>
              </div>
          </div>
        </div>
      </header>

      {/* Click backdrop for switcher */}
      {isSwitcherOpen && <div className="fixed inset-0 z-40" onClick={() => setIsSwitcherOpen(false)}></div>}

      <main className="flex-grow max-w-7xl mx-auto w-full">
        <div className="page-content py-6 px-4 sm:px-6 lg:px-8">
            {children}
        </div>
      </main>

      {/* Nav: Added pb-safe for iPhone Home Indicator support */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 pb-safe">
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
