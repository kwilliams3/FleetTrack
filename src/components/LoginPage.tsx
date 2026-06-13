import React, { useState } from "react";
import { User } from "../types";
import { Gauge, Key, Lock, Eye, EyeOff, X, Check } from "lucide-react";

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
  onChangePassword: (userId: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

export default function LoginPage({ users, onLogin, onChangePassword }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorCode, setErrorCode] = useState("");

  // Forced password change module states
  const [showForceChange, setShowForceChange] = useState(false);
  const [forceChangeUser, setForceChangeUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changeError, setChangeError] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  // Password rules validation
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
      setErrorCode("Identifiant inconnu d'un de nos agents. Essayez 'admin' ou 'manager'.");
      return;
    }

    if (!matched.isActive) {
      setErrorCode("Ce compte a été suspendu par l'administrateur.");
      return;
    }

    // Password validation logic
    const isPasswordValid = matched.password 
      ? matched.password === password 
      : (matched.username === "admin" ? password === "admin123" : (matched.username === "manager" ? password === "manager123" : password.length >= 4));

    if (!isPasswordValid) {
      setErrorCode("Mot de passe incorrect pour cette session.");
      return;
    }
    
    // Successful authentication - check if force change is required
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
        // Log user in directly with updated password status
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Absolute decorative ambient elements */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-4">
        <div className="inline-flex bg-amber-500 text-slate-950 p-3.5 rounded-2xl font-bold shadow-lg">
          <Gauge className="h-8 w-8 text-slate-950" />
        </div>
        <div>
          <h2 className="text-3xl font-sans font-extrabold text-white tracking-tight">
            Portail FleetTrack
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 font-mono tracking-wide uppercase">
            Gestion de Flotte Automobile & Suivi de Caisse
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 animate-scale-up">
        {!showForceChange ? (
          /* STANDARD LOGIN CARD */
          <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-200/80 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">Connexion au système</h3>
              <p className="text-xs text-slate-500 mt-0.5">Saisissez les identifiants d'un profil habilité pour continuer.</p>
            </div>

            {errorCode && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 animate-shake">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="font-semibold">{errorCode}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-705">Identifiant de session</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : admin ou manager"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrorCode(""); }}
                  className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none w-full font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-705">Mot de passe de sécurité</label>
                <input
                  type="password"
                  required
                  placeholder="Mot de passe d'accès"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorCode(""); }}
                  className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:outline-none w-full"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-850 text-amber-400 hover:text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border border-slate-900 flex items-center justify-center space-x-2 shadow-xs"
              >
                <span>Authentification & Accès</span>
              </button>
            </form>


          </div>
        ) : (
          /* FORCED PASSWORD CHANGE MODULE CARD (Mimicking second image exactly) */
          <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-200/80 space-y-6 relative">
            
            {/* Top Close Button to abort and go back */}
            <button 
              type="button"
              onClick={() => {
                setShowForceChange(false);
                setForceChangeUser(null);
                setPassword("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Retourner à l'écran de connexion"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Lock/Security Icon */}
            <div className="text-center pt-2">
              <div className="inline-flex p-3 bg-red-50 text-red-600 rounded-full mb-3">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-sans font-bold text-slate-900 text-center tracking-tight">
                Changement de mot de passe obligatoire
              </h3>
              <p className="text-[11px] text-slate-500 text-center mt-2 px-1 max-w-sm leading-relaxed">
                Pour des raisons de sécurité, vous devez changer votre mot de passe lors de votre première connexion.
              </p>
            </div>

            {changeError && (
              <div className="bg-rose-50 border border-rose-205 text-rose-800 text-[11px] px-3 py-2.5 rounded-xl flex items-center space-x-2 animate-shake">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            <form onSubmit={handleForcePasswordSubmit} className="space-y-4">
              
              {/* Field 1: New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Saisir le nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setChangeError(""); }}
                    className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none w-full bg-yellow-50/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Field 2: Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Saisir à nouveau"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setChangeError(""); }}
                    className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Instructions checkbox helper list */}
              <div className="p-3 bg-slate-50/70 rounded-xl space-y-1.5 border border-slate-100">
                <p className="text-[10px] text-slate-500 font-medium font-sans">Le mot de passe doit contenir :</p>
                <ul className="text-[10px] space-y-1 font-sans text-slate-600">
                  <li className="flex items-center space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasEightChars ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={hasEightChars ? "text-emerald-700 font-medium" : ""}>Au moins 8 caractères</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={hasUppercase ? "text-emerald-700 font-medium" : ""}>Au moins une lettre majuscule</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasDigit ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={hasDigit ? "text-emerald-700 font-medium" : ""}>Au moins un chiffre</span>
                  </li>
                  {confirmPassword !== "" && (
                    <li className="flex items-center space-x-1.5 pt-0.5 border-t border-slate-200/50 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                      <span className={passwordsMatch ? "text-emerald-700 font-medium" : "text-rose-600"}>
                        {passwordsMatch ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || changeLoading}
                className={`w-full py-3 rounded-xl font-bold font-sans text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  isFormValid 
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {changeLoading ? (
                  <span>Modification en cours...</span>
                ) : (
                  <span>Changer le mot de passe</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
