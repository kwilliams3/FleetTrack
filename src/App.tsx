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
  Calendar, Check, AlertTriangle, X, ShieldAlert, UserCog, LogOut
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
  // SYNC UTILS: API REQUESTS
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

      // Restore cached session or default to null
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
        // Keep null if never logged in to mandate LoginPage
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Impossible d'accéder au serveur API backend. Vitesse indisponible.", err);
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

  // Action: Save/Edit vehicle
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

  // Action: Delete vehicle
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

  // Action: Save/Edit Chauffeur
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

  // Action: Delete Chauffeur
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

  // Action: Affect Chauffeur to vehicle
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

  // Action: Declare payout (Versement)
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

  // Action: Validate/Reject Versement
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

  // Action: Declare Charge
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

  // Action: Approve/Reject Charge
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

  // Action: Save/Edit User (Admin Only)
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

  // Action: Delete User (Admin Only)
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

  // Action: Reset User Password (Admin Only / Temporary password)
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

  // Action: Force change password at first connection
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

  // Action: Log driver service presence (Activity)
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

  // Count queues numbers for UI navigation counters (Admins have reviews pending)
  const pendingPaymentsCount = payments.filter(p => p.statut === "En attente").length;
  const pendingExpensesCount = expenses.filter(e => e.statut === "En attente").length;

  if (!currentUser) {
    return (
      <div className="bg-slate-900 min-h-screen">
        {toast && (
          <div className="fixed top-6 right-6 z-50 animate-scale-up">
            <div className={`p-4 rounded-xl border flex items-center space-x-3 shadow-lg ${
              toast.type === "error" 
                ? "bg-rose-50 border-rose-200 text-rose-800" 
                : toast.type === "info" 
                ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              <span className="h-2 w-2 rounded-full bg-current animate-ping" />
              <span className="text-xs font-semibold font-sans">{toast.message}</span>
            </div>
          </div>
        )}
        <LoginPage users={users} onLogin={handleLogin} onChangePassword={handleChangePassword} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-800">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-scale-up">
          <div className={`p-4 rounded-xl border flex items-center space-x-3 shadow-lg ${
            toast.type === "error" 
              ? "bg-rose-50 border-rose-200 text-rose-800" 
              : toast.type === "info" 
              ? "bg-indigo-50 border-indigo-200 text-indigo-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}>
            <span className="h-2 w-2 rounded-full bg-current animate-ping" />
            <span className="text-xs font-semibold font-sans">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Render top navbar */}
      {currentUser && (
        <Navbar 
          users={users} 
          currentUser={currentUser} 
          onUserChange={(usr) => {
            setCurrentUser(usr);
            triggerToast(`Changement de session vers : ${usr.name}`, "info");
          }} 
          onResetDb={handleResetDb} 
          onLogout={handleLogout}
        />
      )}

      {/* Primary Split Sidebar + Main Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto min-h-0">
        
        {/* Left Sidebar Navigation Menu */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-[calc(100vh-4rem)] flex flex-col justify-between shrink-0 border-r border-slate-800 font-sans shadow-lg">
          <div className="p-4 space-y-6">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Espace de Travail</p>
              
              {/* Tab 1: Dashboard */}
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-sans font-medium text-xs transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md animate-fade-in"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
                <span>Tableau de Bord</span>
              </button>

              {/* Tab 2: Vehicles */}
              <button
                onClick={() => setActiveTab("vehicles")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-sans font-medium text-xs transition-all cursor-pointer ${
                  activeTab === "vehicles"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md animate-fade-in"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Car className="h-4.5 w-4.5 shrink-0" />
                <span>Gestion Véhicules</span>
              </button>

              {/* Tab 3: Chauffeurs */}
              <button
                onClick={() => setActiveTab("chauffeurs")}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-sans font-medium text-xs transition-all cursor-pointer ${
                  activeTab === "chauffeurs"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md animate-fade-in"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Users className="h-4.5 w-4.5 shrink-0" />
                <span>Chauffeurs</span>
              </button>

              {/* Tab 4: Versements */}
              <button
                onClick={() => setActiveTab("payments")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-sans font-medium text-xs transition-all cursor-pointer ${
                  activeTab === "payments"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md animate-fade-in"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Wallet className="h-4.5 w-4.5 shrink-0" />
                  <span className="truncate">Versements (Caisse)</span>
                </div>
                {pendingPaymentsCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                    activeTab === "payments" ? "bg-slate-950 text-amber-400" : "bg-amber-500 text-slate-950"
                  }`}>
                    {pendingPaymentsCount}
                  </span>
                )}
              </button>

              {/* Tab 5: Charges & Dépenses */}
              <button
                onClick={() => setActiveTab("expenses")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-sans font-medium text-xs transition-all cursor-pointer ${
                  activeTab === "expenses"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md animate-fade-in"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Wrench className="h-4.5 w-4.5 shrink-0" />
                  <span className="truncate">Dépenses & Pannes</span>
                </div>
                {pendingExpensesCount > 0 && (
                  <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0">
                    {pendingExpensesCount}
                  </span>
                )}
              </button>

              {/* Tab 7: accounts management for ADMIN only */}
              {currentUser?.role === "ADMIN" && (
                <button
                  onClick={() => setActiveTab("users")}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-sans font-medium text-xs transition-all cursor-pointer ${
                    activeTab === "users"
                      ? "bg-emerald-600 text-white font-bold shadow-md animate-fade-in"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <UserCog className={`h-4.5 w-4.5 shrink-0 ${activeTab === 'users' ? 'text-white' : 'text-emerald-400'}`} />
                  <span>Gestion Utilisateurs</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-950/45 border-t border-slate-800">
            <div className="flex items-center space-x-2 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <p className="text-[10px] font-mono text-slate-400 truncate">
                Rôle : <span className="font-semibold text-slate-200">{currentUser.role}</span>
              </p>
            </div>
            {/* Quitter button inside Sidebar */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-550 font-sans font-semibold text-xs transition-all border border-transparent hover:border-rose-500/20 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Quitter la session</span>
            </button>
          </div>
        </aside>

        {/* Content Body Display Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full min-w-0">
          {loading ? (
            /* Loading states skeleton views */
            <div className="space-y-6 font-sans">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 animate-pulse space-y-4">
                <div className="h-4 bg-slate-100 rounded-lg w-1/4"></div>
                <div className="h-10 bg-slate-105 rounded-xl w-3/4"></div>
                <div className="h-20 bg-slate-50 rounded-xl"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 animate-pulse space-y-3">
                    <div className="h-8 bg-slate-100 rounded"></div>
                    <div className="h-4 bg-slate-50 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-50 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            currentUser && (
              <>
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
              </>
            )
          )}
        </main>
      </div>

      {/* ========================================================== */}
      {/* MASTER DIALOG: CHAUFFEUR CHECKIN ACTIVITY MOUNT           */}
      {/* ========================================================== */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5 align-middle">
                <Calendar className="h-4 w-4 text-amber-500" />
                <span>Déclaration Prise / Fin de Service</span>
              </h2>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitActivity} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Chauffeur *</label>
                <select
                  required
                  value={actChauffeurId}
                  onChange={(e) => setActChauffeurId(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-slate-800 bg-white"
                >
                  <option value="">-- Sélectionnez le chauffeur --</option>
                  {chauffeurs.map((c) => {
                    const veh = vehicles.find(v => v.id === c.vehiculeId);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.prenom} {c.nom} {veh ? `(${veh.immatriculation})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Présence opérationnelle aujourd'hui ?</label>
                <div className="flex items-center space-x-4 pt-1">
                  <label className="inline-flex items-center text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={actPresent}
                      onChange={() => setActPresent(true)}
                      className="h-3.5 w-3.5 text-amber-500 mr-1.5"
                    />
                    <span>Présent en service</span>
                  </label>
                  <label className="inline-flex items-center text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={!actPresent}
                      onChange={() => setActPresent(false)}
                      className="h-3.5 w-3.5 text-slate-500 mr-1.5"
                    />
                    <span>Absent / Congé</span>
                  </label>
                </div>
              </div>

              {actPresent && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-indigo-700 font-bold font-sans">Kilométrage Journalier Déclaré (km) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 140"
                      value={actKm}
                      onChange={(e) => setActKm(e.target.value !== "" ? Number(e.target.value) : "")}
                      className="border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">État général constaté du véhicule</label>
                    <input
                      type="text"
                      placeholder="Ex: Bon état, aucun bruit anormal."
                      value={actVehStatus}
                      onChange={(e) => setActVehStatus(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none text-xs w-full"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium font-sans">Observations journalières, pannes ou incidents</label>
                <textarea
                  placeholder="Signalez ici tout incident ou observation sur le trajet (climat, travaux routiers, état des routes...)"
                  value={actObservations}
                  onChange={(e) => setActObservations(e.target.value)}
                  rows={3}
                  className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none text-xs w-full"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-amber-500 text-xs font-bold px-4 py-2 rounded-lg border border-slate-800"
                >
                  Inscrire au registre
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
