import React, { useState } from "react";
import { User, UserRole } from "../types";
import { 
  UserPlus, Edit2, Trash2, Shield, UserCheck, 
  UserX, Phone, Info, Key, X, Check, Eye, EyeOff
} from "lucide-react";

interface UsersViewProps {
  users: User[];
  currentUser: User;
  onSaveUser: (u: Partial<User>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onResetPassword: (userId: string, tempPass: string) => Promise<void>;
}

export default function UsersView({ 
  users, 
  currentUser, 
  onSaveUser, 
  onDeleteUser,
  onResetPassword
}: UsersViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Password reset states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Real-time validations
  const resetHasEightChars = resetNewPassword.length >= 8;
  const resetHasUppercase = /[A-Z]/.test(resetNewPassword);
  const resetHasDigit = /[0-9]/.test(resetNewPassword);
  const resetPasswordsMatch = resetNewPassword === resetConfirmPassword && resetConfirmPassword !== "";
  const isResetFormValid = resetHasEightChars && resetHasUppercase && resetHasDigit && resetPasswordsMatch;

  // Form states
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("MANAGER");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formPhone, setFormPhone] = useState("");

  const openAddModal = () => {
    setEditingUser(null);
    setFormName("");
    setFormUsername("");
    setFormRole("MANAGER");
    setFormIsActive(true);
    setFormPhone("");
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormRole(u.role);
    setFormIsActive(u.isActive);
    setFormPhone(u.phone || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) return;

    const payload: Partial<User> = {
      id: editingUser?.id,
      name: formName.trim(),
      username: formUsername.trim().toLowerCase(),
      role: formRole,
      isActive: formIsActive,
      phone: formPhone.trim() || undefined
    };

    await onSaveUser(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper header action block */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 block">
              <Shield className="h-5 w-5" />
            </span>
            <span>Gestion des Utilisateurs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Créez, modifiez et configurez les rôles d'accès des gestionnaires et administrateurs de la flotte.
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl border border-emerald-700 flex items-center justify-center space-x-2 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Créer un compte</span>
        </button>
      </div>

      {/* User listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const isCurrentUser = u.id === currentUser.id;
          return (
            <div 
              key={u.id}
              className={`bg-white rounded-2xl border transition-all p-5 relative overflow-hidden flex flex-col justify-between ${
                isCurrentUser 
                  ? "border-emerald-500/45 ring-2 ring-emerald-500/10 shadow-md" 
                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              {/* Badge indicating Current Logged in User */}
              {isCurrentUser && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] uppercase font-bold tracking-wider px-3 py-1 rounded-bl-xl font-mono">
                  En cours
                </div>
              )}

              <div>
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    u.role === "ADMIN" 
                      ? "bg-slate-900 text-amber-400" 
                      : "bg-indigo-50 text-indigo-600"
                  }`}>
                    {u.role === "ADMIN" ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      <UserCheck className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1 max-w-[70%]">
                    <p className="font-bold text-slate-900 text-xs truncate" title={u.name}>
                      {u.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      @{u.username}
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-sans font-medium select-none ${
                        u.role === "ADMIN" 
                          ? "bg-slate-100 text-slate-800" 
                          : "bg-indigo-55 text-indigo-700 bg-indigo-50/50"
                      }`}>
                        {u.role === "ADMIN" ? "Administrateur" : "Gestionnaire"}
                      </span>
                      <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-serif ${
                        u.isActive 
                          ? "bg-emerald-50 text-emerald-700" 
                          : "bg-rose-50 text-rose-700"
                      }`}>
                        {u.isActive ? "Actif" : "Coupé"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details list */}
                <div className="border-t border-slate-100 mt-4 pt-3 space-y-2">
                  <div className="flex items-center text-xs text-slate-500 space-x-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="font-mono text-[11px]">
                      {u.phone || "--- Aucun téléphone ---"}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-slate-500 space-x-2">
                    <Key className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>Clé d'authentification nominale</span>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end space-x-2 border-t border-slate-105 mt-4 pt-3.5">
                <button
                  onClick={() => {
                    setResettingUser(u);
                    setResetNewPassword("");
                    setResetConfirmPassword("");
                    setResetError("");
                    setShowResetNewPassword(false);
                    setShowResetConfirmPassword(false);
                    setIsResetModalOpen(true);
                  }}
                  className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-500 hover:text-amber-600 transition-colors border border-slate-100 hover:border-amber-200 cursor-pointer"
                  title="Réinitialiser le mot de passe"
                >
                  <Key className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => openEditModal(u)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors border border-slate-100 hover:border-slate-200 cursor-pointer"
                  title="Modifier l'utilisateur"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                
                <button
                  onClick={async () => {
                    if (isCurrentUser) {
                      alert("Option bloquée : Vous ne pouvez pas supprimer votre propre session active.");
                      return;
                    }
                    if (confirm(`Confirmez-vous la suppression irréversible du compte de ${u.name} ?`)) {
                      await onDeleteUser(u.id);
                    }
                  }}
                  disabled={isCurrentUser}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isCurrentUser 
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" 
                      : "hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-slate-100 hover:border-rose-200"
                  }`}
                  title="Supprimer définitivement"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* PASSWORD RESET DIALOG (Mimicking first image exactly) */}
      {isResetModalOpen && resettingUser && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-slate-900" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Réinitialiser le mot de passe
                </h2>
              </div>
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Subtext describing action */}
            <div className="px-6 pb-4">
              <p className="text-xs text-slate-550 leading-relaxed">
                Définir un nouveau mot de passe temporaire pour <span className="font-bold text-slate-800">{resettingUser.name}</span>. L'utilisateur devra le changer à sa prochaine connexion.
              </p>
            </div>

            {/* Reset Modal Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!isResetFormValid) return;
              try {
                setResetLoading(true);
                await onResetPassword(resettingUser.id, resetNewPassword);
                setIsResetModalOpen(false);
              } catch (err) {
                setResetError("Erreur lors de la réinitialisation du mot de passe.");
              } finally {
                setResetLoading(false);
              }
            }} className="px-6 pb-6 space-y-4">
              
              {resetError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2.5 rounded-xl">
                  {resetError}
                </div>
              )}

              {/* Field 1: New password */}
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showResetNewPassword ? "text" : "password"}
                    required
                    placeholder="Saisir le mot de passe temporaire"
                    value={resetNewPassword}
                    onChange={(e) => { setResetNewPassword(e.target.value); setResetError(""); }}
                    className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none w-full bg-yellow-50/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResetNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Field 2: Confirm password */}
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showResetConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirmer le mot de passe"
                    value={resetConfirmPassword}
                    onChange={(e) => { setResetConfirmPassword(e.target.value); setResetError(""); }}
                    className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResetConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Security strength bullets list */}
              <div className="p-3 bg-slate-50/60 rounded-xl space-y-1 border border-slate-100">
                <p className="text-[10px] text-slate-500 font-medium font-sans">Le mot de passe doit contenir :</p>
                <ul className="text-[10px] space-y-1 font-sans text-slate-600">
                  <li className="flex items-center space-x-1.5">
                    <span className={`w-1 h-1 rounded-full ${resetHasEightChars ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={resetHasEightChars ? "text-emerald-700 font-medium" : ""}>Au moins 8 caractères</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <span className={`w-1 h-1 rounded-full ${resetHasUppercase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={resetHasUppercase ? "text-emerald-700 font-medium" : ""}>Au moins une lettre majuscule</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <span className={`w-1 h-1 rounded-full ${resetHasDigit ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={resetHasDigit ? "text-emerald-700 font-medium" : ""}>Au moins un chiffre</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons row (Annuler & Réinitialiser style from Image 1) */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!isResetFormValid || resetLoading}
                  className={`font-bold text-xs px-5 py-2.5 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isResetFormValid 
                      ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800 shadow-xs" 
                      : "bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {resetLoading ? "Action..." : "Réinitialiser"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Account Dialog / Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            
            {/* Header banner */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center space-x-2">
                <Shield className="h-4.5 w-4.5 text-emerald-400" />
                <h2 className="text-xs font-bold tracking-wider uppercase font-sans">
                  {editingUser ? "Éditer le compte" : "Créer un compte d'accès"}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-800/80 p-1 rounded-full text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Nom complet de l'agent *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mbah Jean-Pierre"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/50 focus:outline-none w-full text-slate-800 bg-white shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Identifiant de connexion *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: jp.mbah"
                    disabled={!!editingUser}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/50 focus:outline-none w-full text-slate-800 bg-white disabled:bg-slate-50 disabled:text-slate-400 shadow-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">En minuscules, unique.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Rôle & Privilèges *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/50 focus:outline-none w-full text-slate-800 bg-white shadow-xs"
                  >
                    <option value="MANAGER">Gestionnaire (MANAGER)</option>
                    <option value="ADMIN">Administrateur (ADMIN)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Téléphone de l'agent</label>
                <input
                  type="text"
                  placeholder="Ex: +237 677 889 900"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/50 focus:outline-none w-full text-slate-800 bg-white shadow-xs"
                />
              </div>

              <div className="py-2.5">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span>Compte actif et autorisé à se connecter au système.</span>
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg border border-emerald-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
