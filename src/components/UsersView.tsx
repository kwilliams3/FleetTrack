import React, { useState } from "react";
import { User, UserRole } from "../types";
import { 
  UserPlus, Edit2, Trash2, Shield, UserCheck, 
  UserX, Phone, Info, Key, X, Check, Eye, EyeOff,
  Users, Award, Calendar, Mail, Lock, Smartphone
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

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const resetHasEightChars = resetNewPassword.length >= 8;
  const resetHasUppercase = /[A-Z]/.test(resetNewPassword);
  const resetHasDigit = /[0-9]/.test(resetNewPassword);
  const resetPasswordsMatch = resetNewPassword === resetConfirmPassword && resetConfirmPassword !== "";
  const isResetFormValid = resetHasEightChars && resetHasUppercase && resetHasDigit && resetPasswordsMatch;

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

  const adminCount = users.filter(u => u.role === "ADMIN").length;
  const managerCount = users.filter(u => u.role === "MANAGER").length;
  const activeCount = users.filter(u => u.isActive).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="h-7 w-7 text-emerald-500" />
            <span>Gestion des Utilisateurs</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gérez les accès et les autorisations du personnel</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <UserPlus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Total utilisateurs</p>
            <h3 className="text-2xl font-bold text-slate-800">{users.length}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Administrateurs</p>
            <h3 className="text-2xl font-bold text-amber-600">{adminCount}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Gestionnaires</p>
            <h3 className="text-2xl font-bold text-indigo-600">{managerCount}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Award className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Comptes actifs</p>
            <h3 className="text-2xl font-bold text-emerald-600">{activeCount}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>
      </div>

      {/* User listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u, index) => {
          const isCurrentUser = u.id === currentUser.id;
          return (
            <div 
              key={u.id}
              className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Current User Badge */}
              {isCurrentUser && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[9px] font-bold shadow-md">
                    <Award className="h-3 w-3" />
                    <span>Session active</span>
                  </span>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl shadow-lg ${
                    u.role === "ADMIN" 
                      ? "bg-gradient-to-br from-slate-800 to-slate-900" 
                      : "bg-gradient-to-br from-indigo-500 to-indigo-600"
                  }`}>
                    {u.role === "ADMIN" ? (
                      <Shield className="h-6 w-6 text-amber-400" />
                    ) : (
                      <UserCheck className="h-6 w-6 text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">{u.name}</h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">@{u.username}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === "ADMIN" 
                          ? "bg-slate-100 text-slate-700" 
                          : "bg-indigo-100 text-indigo-700"
                      }`}>
                        {u.role === "ADMIN" ? "Administrateur" : "Gestionnaire"}
                      </span>
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.isActive 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {u.isActive ? "Actif" : "Inactif"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-slate-600">
                    <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{u.phone || "Téléphone non renseigné"}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-600">
                    <Key className="h-3.5 w-3.5 text-slate-400" />
                    <span>Authentification sécurisée</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
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
                    className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-all duration-200 group"
                    title="Réinitialiser le mot de passe"
                  >
                    <Key className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => openEditModal(u)}
                    className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (isCurrentUser) {
                        alert("Vous ne pouvez pas supprimer votre propre compte.");
                        return;
                      }
                      if (confirm(`Confirmer la suppression de ${u.name} ?`)) {
                        await onDeleteUser(u.id);
                      }
                    }}
                    disabled={isCurrentUser}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isCurrentUser 
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                        : "bg-rose-50 hover:bg-rose-100 text-rose-600"
                    }`}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================== */}
      {/* MODAL: ADD/EDIT USER */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-down relative">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
            
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5 rounded-xl shadow-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingUser ? "Modifiez les informations du compte" : "Créez un nouveau compte d'accès"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nom complet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Identifiant <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="jean.dupont"
                  disabled={!!editingUser}
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value.toLowerCase())}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                />
                {!editingUser && (
                  <p className="text-[10px] text-slate-400 mt-1">Utilisé pour la connexion (minuscules, unique)</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Rôle</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  >
                    <option value="MANAGER">Gestionnaire</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    placeholder="+237 6XX XXX XXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Compte actif</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingUser ? "Mettre à jour" : "Créer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: PASSWORD RESET */}
      {/* ========================================================== */}
      {isResetModalOpen && resettingUser && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-down relative">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600" />
            
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-lg">
                    <Key className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Réinitialisation</h2>
                    <p className="text-xs text-slate-500">Nouveau mot de passe temporaire</p>
                  </div>
                </div>
                <button onClick={() => setIsResetModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!isResetFormValid) return;
              try {
                setResetLoading(true);
                await onResetPassword(resettingUser.id, resetNewPassword);
                setIsResetModalOpen(false);
              } catch (err) {
                setResetError("Erreur lors de la réinitialisation.");
              } finally {
                setResetLoading(false);
              }
            }} className="p-6 space-y-5">
              
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs text-amber-800">
                  Définir un nouveau mot de passe pour <span className="font-bold">{resettingUser.name}</span>
                </p>
              </div>

              {resetError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded-xl">
                  {resetError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showResetNewPassword ? "text" : "password"}
                    required
                    placeholder="Saisir le mot de passe"
                    value={resetNewPassword}
                    onChange={(e) => { setResetNewPassword(e.target.value); setResetError(""); }}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showResetNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showResetConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirmer le mot de passe"
                    value={resetConfirmPassword}
                    onChange={(e) => { setResetConfirmPassword(e.target.value); setResetError(""); }}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showResetConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-1 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-500">Le mot de passe doit contenir :</p>
                <ul className="text-[10px] space-y-1">
                  <li className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${resetHasEightChars ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={resetHasEightChars ? "text-emerald-700 font-medium" : "text-slate-500"}>Au moins 8 caractères</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${resetHasUppercase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={resetHasUppercase ? "text-emerald-700 font-medium" : "text-slate-500"}>Au moins une majuscule</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${resetHasDigit ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={resetHasDigit ? "text-emerald-700 font-medium" : "text-slate-500"}>Au moins un chiffre</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!isResetFormValid || resetLoading}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
                    isResetFormValid && !resetLoading
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Key className="h-4 w-4" />
                  <span>{resetLoading ? "En cours..." : "Réinitialiser"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
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
        
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>

    </div>
  );
}