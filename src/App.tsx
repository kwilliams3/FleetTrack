import React, { useState, useEffect } from "react";
import { 
  User, Vehicle, Chauffeur, AffectationHistory, Versement, Charge, ActivityLog 
} from "./types";
import Navbar from "./components/Navbar";
import DashboardView from "./components/DashboardView";
import VehiclesView from "./components/VehiclesView";
import ChauffeursView from "./components/ChauffeursView";
import VersementsView from "./components/VersementsView";
import ChargesView from "./components/ChargesView";
import LoginPage from "./components/LoginPage";
import UsersView from "./components/UsersView";

import { 
  LayoutDashboard, Car, Users, Wallet, Wrench, Database, 
  Calendar, Check, AlertTriangle, X, ShieldAlert, UserCog, LogOut,
  TrendingUp, Fuel, Clock, CheckCircle, XCircle, AlertCircle
} from "lucide-react";

export default function App() {
  // Sync Data States
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [assignments, setAssignments] = useState<AffectationHistory[]>([]);
  const [payments, setPayments] = useState<Versement[]>([]);
  const [expenses, setExpenses] = useState<Charge[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Navigation and UI States
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Common Action Modals State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Activity Form States
  const [actChauffeurId, setActChauffeurId] = useState("");
  const [actKm, setActKm] = useState<number | "">("");
  const [actPresent, setActPresent] = useState(true);
  const [actObservations, setActObservations] = useState("");
  const [actVehStatus, setActVehStatus] = useState("Bon état de marche");

  // ==========================================
  // SYNC UTILS: API REQUESTS (Gardé identique)
  // ==========================================
  const triggerToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4050);
  };

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data");
      const data = await res.json();
      
      setUsers(data.users || []);
      setVehicles(data.vehicles || []);
      setChauffeurs(data.chauffeurs || []);
      setAssignments(data.assignments || []);
      setPayments(data.payments || []);
      setExpenses(data.expenses || []);
      setActivities(data.activities || []);

      const cached = localStorage.getItem("fleet_user");
      if (cached && data.users && data.users.length > 0) {
        try {
          const cachedUser = JSON.parse(cached) as User;
          const matched = data.users.find((u: User) => u.id === cachedUser.id);
          if (matched) {
            setCurrentUser(matched);
          } else {
            setCurrentUser(null);
          }
        } catch (e) {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Impossible d'accéder au serveur API backend.", err);
      triggerToast("Erreur lors de la synchronisation avec le serveur", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("fleet_user", JSON.stringify(user));
    triggerToast(`Bienvenue de retour, ${user.name} !`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("fleet_user");
    triggerToast("Déconnexion réussie.", "info");
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  // Action: Reset Database
  const handleResetDb = async () => {
    if (confirm("Voulez-vous restaurer la base de données de démonstration d'usine ? Toutes les modifications locales seront écrasées.")) {
      try {
        const res = await fetch("/api/reset", { method: "POST" });
        await res.json();
        triggerToast("Données réinitialisées avec succès aux valeurs par défaut Cameroun.", "info");
        fetchSystemData();
      } catch (err) {
        triggerToast("Une erreur est survenue lors de la réinitialisation.", "error");
      }
    }
  };

  // ... (Toutes les autres fonctions handleSaveVehicle, handleDeleteVehicle, etc. restent identiques)
  // Pour garder la réponse lisible, je continue avec les fonctions existantes...
  const handleSaveVehicle = async (v: Vehicle) => {
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Véhicule enregistré (${v.immatriculation})`);
        fetchSystemData();
      } else {
        triggerToast(data.error || "Une erreur est survenue.", "error");
      }
    } catch (err) {
      triggerToast("Erreur de connexion serveur.", "error");
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        triggerToast("Le véhicule a été retiré de la flotte.");
        fetchSystemData();
      }
    } catch (err) {
      triggerToast("Erreur lors de la suppression.", "error");
    }
  };

  const handleSaveChauffeur = async (c: Chauffeur) => {
    try {
      const res = await fetch("/api/chauffeurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Profil chauffeur modifié (${c.prenom} ${c.nom})`);
        fetchSystemData();
      }
    } catch (err) {
      triggerToast("Erreur de sauvegarde chauffeur.", "error");
    }
  };

  const handleDeleteChauffeur = async (id: string) => {
    try {
      const res = await fetch(`/api/chauffeurs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        triggerToast("Chauffeur supprimé avec succès.");
        fetchSystemData();
      }
    } catch (err) {
      triggerToast("Erreur de suppression.", "error");
    }
  };

  const handleAssignChauffeur = async (vehId: string, chauffeurId: string, remark: string) => {
    try {
      const res = await fetch("/api/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehiculeId: vehId, chauffeurId, remarque: remark })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Affectation conducteur validée et historique archivé.");
        fetchSystemData();
      }
    } catch (err) {
      triggerToast("Erreur d'affectation.", "error");
    }
  };

  const handleAddPayment = async (form: Partial<Versement>) => {
    try {
      const res = await fetch("/api/versements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Versement encaissé et validé directement.");
        fetchSystemData();
      }
    } catch (err) {
      triggerToast("Erreur d'enregistrement.", "error");
    }
  };

  const handleValidatePayment = async (id: string, action: 'APPROVE' | 'REJECT', motif?: string) => {
    try {
      const res = await fetch("/api/versements/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, motifRefus: motif })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(action === 'APPROVE' ? "Versement approuvé et inscrit aux bilans." : "Versement refusé.");
        fetchSystemData();
      }
    } catch (err) {
      triggerToast("Erreur de validation.", "error");
    }
  };

  const handleAddCharge = async (form: Partial<Charge>) => {
    try {
      const res = await fetch("/api/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Note de charge flotte enregistrée directement.");
        fetchSystemData();
      }
    } catch (err) {
      triggerToast("Erreur d'écriture de dépenses.", "error");
    }
  };

  const handleValidateCharge = async (id: string, action: 'APPROVE' | 'REJECT', motif?: string) => {
    try {
      const res = await fetch("/api/charges/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, motifRefus: motif })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(action === 'APPROVE' ? "Note de frais d'exploitation validée." : "Frais rejetés.");
        fetchSystemData();
      }
    } catch (err) {
      triggerToast("Erreur de connexion.", "error");
    }
  };

  const handleSaveUser = async (u: Partial<User>) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(u)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Compte utilisateur enregistré avec succès !");
        fetchSystemData();
      } else {
        triggerToast(data.error || "Une erreur est survenue.", "error");
      }
    } catch (err) {
      triggerToast("Erreur de connexion.", "error");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        triggerToast("Le compte utilisateur a été supprimé.");
        fetchSystemData();
      } else {
        triggerToast(data.error || "Impossible de supprimer.", "error");
      }
    } catch (err) {
      triggerToast("Erreur lors de la suppression.", "error");
    }
  };

  const handleResetPassword = async (userId: string, tempPass: string) => {
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: tempPass })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Le mot de passe temporaire a été enregistré.");
        fetchSystemData();
      } else {
        triggerToast(data.error || "Une erreur est survenue.", "error");
      }
    } catch (err) {
      triggerToast("Erreur de connexion serveur.", "error");
    }
  };

  const handleChangePassword = async (userId: string, newPass: string) => {
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: newPass })
      });
      const data = await res.json();
      if (data.success) {
        await fetchSystemData();
        return { success: true };
      } else {
        return { success: false, error: data.error || "Impossible de changer." };
      }
    } catch (err) {
      return { success: false, error: "Erreur de connexion serveur." };
    }
  };

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actChauffeurId) {
      triggerToast("Veuillez sélectionner un chauffeur.", "error");
      return;
    }

    try {
      const res = await fetch("/api/activites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chauffeurId: actChauffeurId,
          present: actPresent,
          kilometrageJournalier: actKm ? Number(actKm) : 0,
          etatVehicule: actVehStatus,
          observations: actObservations
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("La présence et le journal d'utilisation ont été inscrits !");
        setIsActivityModalOpen(false);
        setActKm("");
        setActObservations("");
        setActChauffeurId("");
        fetchSystemData();
      }
    } catch (err) {
      triggerToast("Erreur d'enregistrement d'activité.", "error");
    }
  };

  const pendingPaymentsCount = payments.filter(p => p.statut === "En attente").length;
  const pendingExpensesCount = expenses.filter(e => e.statut === "En attente").length;

  if (!currentUser) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
        {toast && (
          <div className="fixed top-6 right-6 z-50 animate-slide-down">
            <div className={`p-4 rounded-xl border flex items-center space-x-3 shadow-2xl backdrop-blur-sm ${
              toast.type === "error" 
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                : toast.type === "info" 
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}>
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
              <span className="text-sm font-semibold font-sans">{toast.message}</span>
            </div>
          </div>
        )}
        <LoginPage users={users} onLogin={handleLogin} onChangePassword={handleChangePassword} />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen flex flex-col">
      
      {/* Toast Notification Container - Amélioré */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 animate-slide-down">
          <div className={`p-4 rounded-xl border flex items-center space-x-3 shadow-2xl backdrop-blur-sm ${
            toast.type === "error" 
              ? "bg-rose-500/10 border-rose-500/30 text-rose-600" 
              : toast.type === "info" 
              ? "bg-blue-500/10 border-blue-500/30 text-blue-600"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
          }`}>
            {toast.type === "success" && <CheckCircle className="h-5 w-5" />}
            {toast.type === "error" && <AlertCircle className="h-5 w-5" />}
            {toast.type === "info" && <Clock className="h-5 w-5" />}
            <span className="text-sm font-semibold font-sans">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Render top navbar - Sans onUserChange et onLogout */}
      {currentUser && (
        <Navbar 
          currentUser={currentUser} 
          onResetDb={handleResetDb}
        />
      )}

      {/* Primary Split Sidebar + Main Content Layout - Sidebar fixe qui ne scrolle pas */}
      <div className="flex-1 flex relative">
        
        {/* Left Sidebar Navigation Menu - FIXED POSITION */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-300 flex flex-col shadow-2xl border-r border-slate-700/50 z-30">
          
          {/* Scrollable menu content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="p-4 space-y-6">
              
              {/* Section: Menu principal */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2 px-3 mb-3">
                  <TrendingUp className="h-3 w-3 text-amber-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navigation Principale</p>
                </div>
                
                {/* Tab 1: Dashboard */}
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-sans font-medium text-sm transition-all duration-300 group ${
                    activeTab === "dashboard"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg scale-105"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
                  }`}
                >
                  <LayoutDashboard className={`h-5 w-5 shrink-0 transition-transform duration-300 ${activeTab === "dashboard" ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>Tableau de Bord</span>
                  {activeTab === "dashboard" && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-950 animate-pulse" />
                  )}
                </button>

                {/* Tab 2: Vehicles */}
                <button
                  onClick={() => setActiveTab("vehicles")}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-sans font-medium text-sm transition-all duration-300 group ${
                    activeTab === "vehicles"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg scale-105"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
                  }`}
                >
                  <Car className={`h-5 w-5 shrink-0 transition-transform duration-300 ${activeTab === "vehicles" ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>Gestion Véhicules</span>
                </button>

                {/* Tab 3: Chauffeurs */}
                <button
                  onClick={() => setActiveTab("chauffeurs")}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-sans font-medium text-sm transition-all duration-300 group ${
                    activeTab === "chauffeurs"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg scale-105"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
                  }`}
                >
                  <Users className={`h-5 w-5 shrink-0 transition-transform duration-300 ${activeTab === "chauffeurs" ? "scale-110" : "group-hover:scale-110"}`} />
                  <span>Chauffeurs</span>
                </button>

                {/* Tab 4: Versements */}
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-sans font-medium text-sm transition-all duration-300 group ${
                    activeTab === "payments"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg scale-105"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Wallet className={`h-5 w-5 shrink-0 transition-transform duration-300 ${activeTab === "payments" ? "scale-110" : "group-hover:scale-110"}`} />
                    <span>Versements</span>
                  </div>
                  {pendingPaymentsCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono animate-pulse ${
                      activeTab === "payments" 
                        ? "bg-slate-950 text-amber-400" 
                        : "bg-amber-500 text-slate-950"
                    }`}>
                      {pendingPaymentsCount}
                    </span>
                  )}
                </button>

                {/* Tab 5: Charges & Dépenses */}
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-sans font-medium text-sm transition-all duration-300 group ${
                    activeTab === "expenses"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg scale-105"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Fuel className={`h-5 w-5 shrink-0 transition-transform duration-300 ${activeTab === "expenses" ? "scale-110" : "group-hover:scale-110"}`} />
                    <span>Dépenses & Pannes</span>
                  </div>
                  {pendingExpensesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500 text-white animate-pulse">
                      {pendingExpensesCount}
                    </span>
                  )}
                </button>

                {/* Tab 6: Users management for ADMIN only */}
                {currentUser?.role === "ADMIN" && (
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-sans font-medium text-sm transition-all duration-300 group ${
                      activeTab === "users"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg scale-105"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
                    }`}
                  >
                    <UserCog className={`h-5 w-5 shrink-0 transition-transform duration-300 ${activeTab === "users" ? "scale-110" : "group-hover:scale-110"}`} />
                    <span>Gestion Utilisateurs</span>
                  </button>
                )}
              </div>

              {/* Section: Statistiques rapides */}
              <div className="pt-4 border-t border-slate-700/30">
                <div className="space-y-2 px-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statistiques</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Véhicules</span>
                    <span className="text-white font-bold font-mono">{vehicles.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Chauffeurs</span>
                    <span className="text-white font-bold font-mono">{chauffeurs.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Versements</span>
                    <span className="text-emerald-400 font-bold font-mono">{payments.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer section - Fixed at bottom */}
          <div className="border-t border-slate-700/50 p-4 space-y-3 bg-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-mono text-slate-400">
                  Rôle : <span className="font-semibold text-amber-400">{currentUser.role}</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 font-semibold text-xs transition-all duration-300 border border-rose-500/20 hover:border-rose-500/40 group"
            >
              <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Quitter la session</span>
            </button>
          </div>
        </aside>

        {/* Main Content - avec marge pour compenser la sidebar fixe */}
        <main className="flex-1 ml-64 px-6 lg:px-8 py-8 w-full min-w-0">
          {loading ? (
            /* Loading states skeleton views améliorés */
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-lg animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 bg-slate-100 rounded-lg w-1/4"></div>
                  <div className="h-12 bg-slate-50 rounded-xl w-3/4"></div>
                  <div className="h-24 bg-slate-50 rounded-xl"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-lg animate-pulse">
                    <div className="space-y-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl"></div>
                      <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                      <div className="h-8 bg-slate-50 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            currentUser && (
              <div className="animate-fade-in-up">
                {/* Tab Display Router */}
                {activeTab === "dashboard" && (
                  <DashboardView 
                    vehicles={vehicles}
                    chauffeurs={chauffeurs}
                    payments={payments}
                    expenses={expenses}
                    activities={activities}
                    currentUser={currentUser}
                    onDeclarePayment={() => {
                      setActiveTab("payments");
                      setIsPaymentModalOpen(true);
                    }}
                    onDeclareExpense={() => {
                      setActiveTab("expenses");
                      setIsExpenseModalOpen(true);
                    }}
                    onLogActivity={() => setIsActivityModalOpen(true)}
                  />
                )}

                {activeTab === "vehicles" && (
                  <VehiclesView 
                    vehicles={vehicles}
                    chauffeurs={chauffeurs}
                    assignments={assignments}
                    currentUser={currentUser}
                    onSaveVehicle={handleSaveVehicle}
                    onDeleteVehicle={handleDeleteVehicle}
                    onAssignChauffeur={handleAssignChauffeur}
                  />
                )}

                {activeTab === "chauffeurs" && (
                  <ChauffeursView 
                    chauffeurs={chauffeurs}
                    vehicles={vehicles}
                    currentUser={currentUser}
                    onSaveChauffeur={handleSaveChauffeur}
                    onDeleteChauffeur={handleDeleteChauffeur}
                  />
                )}

                {activeTab === "payments" && (
                  <VersementsView 
                    payments={payments}
                    vehicles={vehicles}
                    chauffeurs={chauffeurs}
                    currentUser={currentUser}
                    onAddPayment={handleAddPayment}
                    onValidatePayment={handleValidatePayment}
                  />
                )}

                {activeTab === "expenses" && (
                  <ChargesView 
                    expenses={expenses}
                    vehicles={vehicles}
                    chauffeurs={chauffeurs}
                    currentUser={currentUser}
                    onAddCharge={handleAddCharge}
                    onValidateCharge={handleValidateCharge}
                  />
                )}

                {activeTab === "users" && currentUser.role === "ADMIN" && (
                  <UsersView 
                    users={users}
                    currentUser={currentUser}
                    onSaveUser={handleSaveUser}
                    onDeleteUser={handleDeleteUser}
                    onResetPassword={handleResetPassword}
                  />
                )}
              </div>
            )
          )}
        </main>
      </div>

      {/* Styles CSS pour animations et scrollbar personnalisée */}
      <style>{`
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
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
        
        /* Custom scrollbar pour la sidebar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.5);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.8);
        }
      `}</style>

      {/* ========================================================== */}
      {/* MODAL: ACTIVITÉ CHAUFFEUR - Version embellie */}
      {/* ========================================================== */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md transform transition-all duration-300 animate-slide-down">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                <span>Déclaration de Service</span>
              </h2>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitActivity} className="p-6 space-y-5">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Chauffeur *</label>
                <select
                  required
                  value={actChauffeurId}
                  onChange={(e) => setActChauffeurId(e.target.value)}
                  className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none w-full text-slate-800 bg-white transition-all duration-200"
                >
                  <option value="">-- Sélectionnez un chauffeur --</option>
                  {chauffeurs.map((c) => {
                    const veh = vehicles.find(v => v.id === c.vehiculeId);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.prenom} {c.nom} {veh ? `- ${veh.immatriculation}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Statut opérationnel</label>
                <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl">
                  <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={actPresent}
                      onChange={() => setActPresent(true)}
                      className="h-4 w-4 text-amber-500 mr-2 focus:ring-amber-500"
                    />
                    <span className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Présent</span>
                    </span>
                  </label>
                  <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={!actPresent}
                      onChange={() => setActPresent(false)}
                      className="h-4 w-4 text-slate-500 mr-2"
                    />
                    <span className="flex items-center space-x-1">
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <span>Absent</span>
                    </span>
                  </label>
                </div>
              </div>

              {actPresent && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Kilométrage journalier <span className="text-amber-600">(km)</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 145"
                      value={actKm}
                      onChange={(e) => setActKm(e.target.value !== "" ? Number(e.target.value) : "")}
                      className="border border-slate-300 rounded-xl px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none w-full transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">État du véhicule</label>
                    <input
                      type="text"
                      placeholder="Ex: Bon état, aucun souci mécanique"
                      value={actVehStatus}
                      onChange={(e) => setActVehStatus(e.target.value)}
                      className="border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none text-sm w-full transition-all duration-200"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Observations / Incidents</label>
                <textarea
                  placeholder="Signalez tout incident, panne ou observation particulière..."
                  value={actObservations}
                  onChange={(e) => setActObservations(e.target.value)}
                  rows={3}
                  className="border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none text-sm w-full resize-none transition-all duration-200"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Enregistrer l'activité
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}