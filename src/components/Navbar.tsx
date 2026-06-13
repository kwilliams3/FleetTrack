import { User, UserRole } from "../types";
import { Shield, UserCheck, Gauge, CalendarDays, RefreshCw, LogOut, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  users: User[];
  currentUser: User;
  onUserChange: (user: User) => void;
  onResetDb: () => void;
  onLogout: () => void;
}

export default function Navbar({ users, currentUser, onUserChange, onResetDb, onLogout }: NavbarProps) {
  const [isHoveringReset, setIsHoveringReset] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border-b border-slate-700/50 sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
      {/* Glow effect subtil en haut */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand - Version améliorée */}
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 p-2 rounded-lg font-bold flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105">
                <Gauge className="h-5 w-5" />
              </div>
            </div>
            <div>
              <span className="font-sans font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                FleetTrack
              </span>
              <span className="text-[10px] font-mono text-amber-500/80 block -mt-1 hidden sm:block">Gestion de flotte</span>
            </div>
          </div>

          {/* Center Info: Virtual system date avec animation améliorée */}
          <div className="hidden md:flex items-center bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-700/60 shadow-lg">
            <div className="relative">
              <CalendarDays className="h-4 w-4 text-amber-500 animate-pulse" />
              <span className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-2 w-2 text-amber-300 animate-ping" />
              </span>
            </div>
            <div className="ml-2 flex items-baseline space-x-2">
              <span className="text-xs font-mono text-slate-400">Session de suivi</span>
              <span className="w-px h-3 bg-slate-600" />
              <span className="text-white font-semibold font-mono text-sm tracking-wide">12 JUIN 2026</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Reset Button amélioré */}
            <button
              onClick={onResetDb}
              onMouseEnter={() => setIsHoveringReset(true)}
              onMouseLeave={() => setIsHoveringReset(false)}
              title="Réinitialiser les données de démonstration"
              className="relative group overflow-hidden px-3 py-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/80 transition-all duration-300 flex items-center space-x-2 border border-transparent hover:border-slate-700"
            >
              <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${isHoveringReset ? 'rotate-180' : ''}`} />
              <span className="text-xs hidden lg:inline font-medium tracking-wide">Réinitialiser</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full" />
            </button>

            {/* Profile Card améliorée avec dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-gradient-to-br from-slate-800 to-slate-800/80 p-1.5 pr-3 rounded-xl border border-slate-700/60 hover:border-slate-600 transition-all duration-300 group shadow-lg"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-500/20 to-emerald-500/20 blur-sm" />
                  <div className="relative p-1.5 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg">
                    {currentUser.role === "ADMIN" ? (
                      <Shield className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                </div>
                
                <div className="text-left hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Utilisateur</p>
                  <p className="text-white font-sans text-sm font-semibold leading-tight">
                    {currentUser.name}
                  </p>
                </div>
                
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl z-50 overflow-hidden animate-slide-down">
                    <div className="p-3 border-b border-slate-700/50">
                      <p className="text-xs text-slate-400 font-mono">Connecté en tant que</p>
                      <p className="text-white font-bold">{currentUser.name}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        currentUser.role === "ADMIN" 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}>
                        {currentUser.role}
                      </span>
                    </div>
                    
                    <div className="p-2">
                      {users.filter(u => u.id !== currentUser.id).map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            onUserChange(user);
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors group flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm text-slate-200 group-hover:text-white">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.role}</p>
                          </div>
                          {user.role === "ADMIN" ? (
                            <Shield className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <UserCheck className="h-3 w-3 text-blue-400" />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <div className="p-2 border-t border-slate-700/50">
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </header>
  );
}
