import React, { useState } from "react";
import { User } from "../types";
import { Gauge, Key, Lock, Eye, EyeOff, X, Check, Shield, Sparkles, ArrowRight, Fingerprint, AlertCircle } from "lucide-react";

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
  onChangePassword: (userId: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

export default function LoginPage({ users, onLogin, onChangePassword }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  const [showForceChange, setShowForceChange] = useState(false);
  const [forceChangeUser, setForceChangeUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changeError, setChangeError] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  const hasEightChars = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";
  const isFormValid = hasEightChars && hasUppercase && hasDigit && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setErrorCode("Veuillez saisir votre identifiant.");
      return;
    }
    const matched = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!matched) {
      setErrorCode("Identifiant inconnu. Veuillez réessayer.");
      return;
    }

    if (!matched.isActive) {
      setErrorCode("Ce compte a été suspendu par l'administrateur.");
      return;
    }

    const isPasswordValid = matched.password 
      ? matched.password === password 
      : (matched.username === "admin" ? password === "admin123" : (matched.username === "manager" ? password === "manager123" : password.length >= 4));

    if (!isPasswordValid) {
      setErrorCode("Mot de passe incorrect.");
      return;
    }
    
    if (matched.mustChangePassword) {
      setForceChangeUser(matched);
      setNewPassword("");
      setConfirmPassword("");
      setChangeError("");
      setShowForceChange(true);
    } else {
      onLogin(matched);
    }
  };

  const handleForcePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forceChangeUser) return;
    if (!isFormValid) {
      setChangeError("Le mot de passe ne respecte pas les critères de sécurité requis.");
      return;
    }

    try {
      setChangeLoading(true);
      const res = await onChangePassword(forceChangeUser.id, newPassword);
      if (res.success) {
        const updatedUser = { ...forceChangeUser, mustChangePassword: false, password: newPassword };
        onLogin(updatedUser);
      } else {
        setChangeError(res.error || "Impossible de modifier le mot de passe.");
      }
    } catch (err) {
      setChangeError("Une erreur réseau s'est produite.");
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Simple dot pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-6 animate-fade-in-up">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-amber-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
          <div className="relative bg-gradient-to-br from-amber-400 to-amber-500 p-4 rounded-3xl shadow-2xl transform transition-all duration-300 hover:scale-105">
            <Gauge className="h-10 w-10 text-slate-950" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            FleetTrack
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Gestion de Flotte Automobile & Suivi de Caisse
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {!showForceChange ? (
          /* STANDARD LOGIN CARD - Premium Version */
          <div className="bg-white/95 backdrop-blur-sm py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-white/20 space-y-6 animate-slide-down">
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-2 bg-emerald-100 rounded-full mb-3">
                <Shield className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Connexion sécurisée</h3>
              <p className="text-xs text-slate-500 mt-1">Accédez à votre espace de gestion de flotte</p>
            </div>

            {errorCode && (
              <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl flex items-center space-x-3 animate-shake">
                <div className="bg-rose-500 p-1 rounded-full">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
                <span className="font-semibold flex-1">{errorCode}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Identifiant</label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    placeholder="admin / manager"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrorCode(""); }}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all duration-200 group-hover:border-slate-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Mot de passe</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorCode(""); }}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all duration-200 group-hover:border-slate-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="group relative w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 text-amber-500 font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                <span className="text-sm">Se connecter</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-[10px] text-slate-400">
                Système sécurisé - Toutes les connexions sont journalisées
              </p>
            </div>
          </div>
        ) : (
          /* FORCED PASSWORD CHANGE MODULE - Premium Version */
          <div className="bg-white/95 backdrop-blur-sm py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-white/20 space-y-6 relative animate-slide-down">
            
            <button 
              type="button"
              onClick={() => {
                setShowForceChange(false);
                setForceChangeUser(null);
                setPassword("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div className="inline-flex p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl mb-4 shadow-lg animate-pulse">
                <Lock className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Changement de mot de passe</h3>
              <p className="text-xs text-slate-500 mt-2 px-2">
                Pour des raisons de sécurité, vous devez changer votre mot de passe lors de votre première connexion.
              </p>
            </div>

            {changeError && (
              <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl flex items-center space-x-3">
                <div className="bg-rose-500 p-1 rounded-full">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
                <span className="font-semibold flex-1">{changeError}</span>
              </div>
            )}

            <form onSubmit={handleForcePasswordSubmit} className="space-y-5">
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Saisir le nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setChangeError(""); }}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all duration-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setChangeError(""); }}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all duration-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 space-y-2 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Critères de sécurité</p>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${hasEightChars ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-300'}`} />
                    <span className={`text-[11px] ${hasEightChars ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      Au moins 8 caractères
                    </span>
                    {hasEightChars && <Check className="h-3 w-3 text-emerald-500 ml-auto" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${hasUppercase ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-300'}`} />
                    <span className={`text-[11px] ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      Au moins une majuscule
                    </span>
                    {hasUppercase && <Check className="h-3 w-3 text-emerald-500 ml-auto" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${hasDigit ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-300'}`} />
                    <span className={`text-[11px] ${hasDigit ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      Au moins un chiffre
                    </span>
                    {hasDigit && <Check className="h-3 w-3 text-emerald-500 ml-auto" />}
                  </div>
                  {confirmPassword !== "" && (
                    <div className="flex items-center space-x-2 pt-1 border-t border-slate-200 mt-1">
                      <div className={`w-2 h-2 rounded-full ${passwordsMatch ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-rose-400'}`} />
                      <span className={`text-[11px] ${passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-rose-600'}`}>
                        {passwordsMatch ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
                      </span>
                      {passwordsMatch && <Check className="h-3 w-3 text-emerald-500 ml-auto" />}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || changeLoading}
                className={`group relative w-full font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden ${
                  isFormValid && !changeLoading
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg hover:shadow-xl"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {changeLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Modification en cours...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    <span>Changer le mot de passe</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>

    </div>
  );
}