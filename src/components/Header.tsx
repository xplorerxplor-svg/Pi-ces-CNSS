import React from 'react';
import { Wifi, UserCheck, Shield, ChevronDown, Smartphone, Menu } from 'lucide-react';
import { UserProfile } from '../types.js';

interface HeaderProps {
  title: string;
  subtitle?: string;
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
  onOpenAndroidExport?: () => void;
  onToggleMobileMenu?: () => void;
  isOnline?: boolean;
}

export const USERS_LIST: UserProfile[] = [
  {
    id: 'AGT-001',
    name: 'Julien Dubois',
    email: 'j.dubois@doccheck.gouv.fr',
    role: 'AGENT',
    initials: 'JD'
  },
  {
    id: 'AGT-002',
    name: 'Sarah Belkacem',
    email: 's.belkacem@doccheck.gouv.fr',
    role: 'AGENT',
    initials: 'SB'
  },
  {
    id: 'ADM-001',
    name: 'Directeur d\'Audit & Contrôle',
    email: 'admin@doccheck.gouv.fr',
    role: 'ADMIN',
    initials: 'AD'
  }
];

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  currentUser,
  onSwitchUser,
  onOpenAndroidExport,
  onToggleMobileMenu,
  isOnline = true
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Bouton Hamburger sur Mobile */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-slate-800 tracking-tight truncate flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-normal truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Bouton Exporter vers Android */}
        {onOpenAndroidExport && (
          <button
            onClick={onOpenAndroidExport}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-200 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Tester et installer sur smartphone Android"
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            <span className="hidden md:inline">Tester sur Android</span>
            <span className="text-[9px] bg-white/20 px-1 sm:px-1.5 py-0.2 rounded font-mono">APK</span>
          </button>
        )}

        {/* Status Réseau */}
        <div className={`hidden xl:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
          isOnline 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-rose-600'} animate-pulse`}></span>
          {isOnline ? 'Système Connecté' : 'Mode Hors-Ligne'}
        </div>

        {/* Profil Agent / Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
          >
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {currentUser.initials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="truncate max-w-[100px] md:max-w-[140px]">{currentUser.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  currentUser.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[140px]">
                {currentUser.email}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Changer de profil opérateur
              </div>
              {USERS_LIST.map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSwitchUser(user);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    user.id === currentUser.id ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    user.role === 'ADMIN' ? 'bg-purple-700 text-white' : 'bg-slate-700 text-white'
                  }`}>
                    {user.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{user.role}</div>
                  </div>
                  {user.id === currentUser.id && (
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
