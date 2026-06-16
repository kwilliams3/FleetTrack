import { User, UserRole } from "../types";
import { Shield, UserCheck, Gauge, CalendarDays, RefreshCw, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface NavbarProps {
  currentUser: User;
  onResetDb: () => void;
}

export default function Navbar({ currentUser, onResetDb }: NavbarProps) {
  const [isHoveringReset, setIsHoveringReset] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mettre à jour la date chaque jour à minuit
  useEffect(() => {
    setCurrentDate(new Date());

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      setCurrentDate(new Date());
      
      const intervalId = setInterval(() => {
        setCurrentDate(new Date());
      }, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }, timeUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, []);

  // Vérification toutes les minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDate(new Date());
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toUpperCase();
  };

  return (
    <header className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border-b border-slate-700/50 sticky top-0 z-40">
      {/* Glow effect subtil en haut */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
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

          {/* Center Info: Dynamic date */}
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
              <span className="text-white font-semibold font-mono text-sm tracking-wide">
                {formatDate(currentDate)}
              </span>
            </div>
            <div className="ml-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Date en temps réel" />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Reset Button */}
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

            {/* Profile Info - Affichage simple sans dropdown ni déconnexion */}
            <div className="flex items-center space-x-3 bg-gradient-to-br from-slate-800 to-slate-800/80 p-1.5 pr-3 rounded-xl border border-slate-700/60 shadow-lg">
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
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}