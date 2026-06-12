import { User, UserRole } from "../types";
import { Shield, UserCheck, Gauge, CalendarDays, RefreshCw, LogOut } from "lucide-react";

interface NavbarProps {
  users: User[];
  currentUser: User;
  onUserChange: (user: User) => void;
  onResetDb: () => void;
  onLogout: () => void;
}

export default function Navbar({ users, currentUser, onUserChange, onResetDb, onLogout }: NavbarProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-bold flex items-center justify-center">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <span className="font-sans font-bold text-lg tracking-tight block">FleetTrack</span>
            </div>
          </div>

          {/* Center Info: Virtual system date info */}
          <div className="hidden md:flex items-center bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 font-mono text-xs text-slate-300 space-x-2">
            <CalendarDays className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>Date de Suivi :</span>
            <span className="text-white font-semibold">12 Juin 2026</span>
          </div>

          {/* Right Controls: Role Simulator & Reset */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onResetDb}
              title="Réinitialiser les données de démonstration"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-xs hidden lg:inline font-sans font-medium">Réinitialiser</span>
            </button>

            {/* Profile Info (No account switching capability for strict active session) */}
            <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
               <div className="p-1 bg-slate-700 rounded text-amber-400">
                {currentUser.role === "ADMIN" ? (
                  <Shield className="h-4 w-4 text-emerald-400" />
                ) : (
                  <UserCheck className="h-4 w-4 text-blue-400" />
                )}
              </div>
              
              <div className="text-left hidden sm:block pr-2 pl-1 select-none">
                <p className="text-[10px] text-slate-400 font-mono leading-none">Utilisateur</p>
                <p className="text-white font-sans text-xs font-bold mt-0.5">
                  {currentUser.name}
                </p>
              </div>
            </div>

            {/* Logout triggered here */}
            <button
              onClick={onLogout}
              title="Se déconnecter de l'application"
              className="p-1.5 text-rose-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs hidden lg:inline font-sans font-semibold">Quitter</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
