import { useState } from "react";
import { 
  Vehicle, Chauffeur, Versement, Charge, ActivityLog, User 
} from "../types";
import { 
  Car, Users, ArrowUpRight, ArrowDownRight, AlertTriangle, 
  TrendingUp, Wallet, Wrench, CheckCircle2, ShieldAlert,
  CalendarCheck, Clock, FileWarning, Gauge, Printer, FileDown, FileText, X, Download,
  Award, Zap, BarChart3, PieChart as PieChartIcon, DollarSign, Fuel
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface DashboardViewProps {
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  payments: Versement[];
  expenses: Charge[];
  activities: ActivityLog[];
  currentUser: User;
  onDeclarePayment: () => void;
  onDeclareExpense: () => void;
  onLogActivity: () => void;
}

export default function DashboardView({
  vehicles,
  chauffeurs,
  payments,
  expenses,
  activities,
  currentUser,
  onDeclarePayment,
  onDeclareExpense,
  onLogActivity
}: DashboardViewProps) {
  const isDriver = false;
  const associatedDriver = undefined;
  
  const [isReportOpen, setIsReportOpen] = useState(false);

  const reportDays = ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12"];
  
  const reportRows = reportDays.map(d => {
    const dPayments = payments.filter(p => p.date === d && p.statut === "Validé");
    const dExpenses = expenses.filter(e => e.date === d && e.statut === "Validé");
    
    const dPaymentsAll = payments.filter(p => p.date === d);
    const expected = dPaymentsAll.reduce((sum, p) => sum + p.montantAttendu, 0);
    const collected = dPayments.reduce((sum, p) => sum + p.montantVerse, 0);
    const spent = dExpenses.reduce((sum, e) => sum + e.montant, 0);
    const balance = collected - spent;
    
    return { date: d, expected, collected, spent, balance };
  });

  const repTotalExpected = reportRows.reduce((sum, r) => sum + r.expected, 0);
  const repTotalCollected = reportRows.reduce((sum, r) => sum + r.collected, 0);
  const repTotalSpent = reportRows.reduce((sum, r) => sum + r.spent, 0);
  const repTotalBalance = repTotalCollected - repTotalSpent;

  const reportPaymentsList = payments.filter(p => reportDays.includes(p.date) && p.statut === "Validé");
  const reportExpensesList = expenses.filter(e => reportDays.includes(e.date) && e.statut === "Validé");

  const handlePrintReport = () => {
    const printContent = document.getElementById("rapport-financier-print-template");
    if (!printContent) return;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Rapport d'Activité Financière de la Flotte</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 35px; color: #1e293b; background: white; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
              .header h1 { font-size: 21px; color: #010409; margin: 0; text-transform: uppercase; }
              .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
              .card { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #f8fafc; }
              .card h3 { font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 5px 0; }
              .card p { font-size: 18px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; }
              th, td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
              th { background-color: #f1f5f9; font-weight: bold; border-top: 1px solid #cbd5e1; }
              .text-right { text-align: right; }
              .stamp-sec { margin-top: 50px; display: flex; justify-content: space-between; }
              .stamp-sec div { width: 220px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 5px; font-size: 11px; color: #64748b; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 800); };<\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const title = "RAPPORT D'ACTIVITE FINANCIERE DE LA FLOTTE";
    const period = "Periode : 08 Juin 2026 au 12 Juin 2026 (5 derniers jours)";

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(title, 14, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(period, 14, 25);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 32, 196, 32);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 36, 56, 20, 1.5, 1.5, "FD");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("RECETTES VALIDEES (5J)", 18, 41);
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(formatFCFA(repTotalCollected), 18, 48);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(75, 36, 56, 20, 1.5, 1.5, "FD");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("DEPENSES APPROUVEES (5J)", 79, 41);
    doc.setFontSize(11);
    doc.setTextColor(239, 68, 68);
    doc.text(formatFCFA(repTotalSpent), 79, 48);

    doc.setFillColor(236, 253, 245);
    doc.roundedRect(136, 36, 60, 20, 1.5, 1.5, "FD");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text("SOLDE NET (BILAN)", 140, 41);
    doc.setFontSize(11);
    doc.setTextColor(67, 56, 202);
    doc.text(formatFCFA(repTotalBalance), 140, 48);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text("1. Ventilation Journaliere Globalisee", 14, 65);

    const table1Headers = [["Date", "Attendu", "Encaissé", "Dépenses", "Solde"]];
    const table1Body = reportRows.map(r => [
      r.date, formatFCFA(r.expected), formatFCFA(r.collected), formatFCFA(r.spent), formatFCFA(r.balance)
    ]);
    table1Body.push(["TOTAUX", formatFCFA(repTotalExpected), formatFCFA(repTotalCollected), formatFCFA(repTotalSpent), formatFCFA(repTotalBalance)]);

    autoTable(doc, {
      startY: 68,
      head: table1Headers,
      body: table1Body,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 }
    });

    doc.save("Rapport_Activite_Financiere_FleetTrack.pdf");
  };
  
  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  const totalVehicles = vehicles.length;
  const activeDrivers = chauffeurs.filter(c => c.isActive).length;

  const todayPayments = payments.filter(p => p.date === "2026-06-12");
  const todayExpenses = expenses.filter(e => e.date === "2026-06-12" && e.statut === "Validé");
  
  const assignedVehicles = vehicles.filter(v => chauffeurs.some(c => c.vehiculeId === v.id && c.isActive));
  const expectedTodayTotal = assignedVehicles.reduce((acc, v) => acc + v.montantJournalier, 0);
  
  const collectedTodayTotal = todayPayments.filter(p => p.statut === "Validé").reduce((acc, p) => acc + p.montantVerse, 0);
  const pendingCollectionToday = todayPayments.filter(p => p.statut === "En attente").reduce((acc, p) => acc + p.montantVerse, 0);
  const unpaidTodayTotal = Math.max(0, expectedTodayTotal - collectedTodayTotal);
  const expensesTodayTotal = todayExpenses.reduce((acc, e) => acc + e.montant, 0);

  const systemAlerts: { type: "critical" | "warning"; message: string }[] = [];
  
  vehicles.forEach(v => {
    if (v.documents.assurance?.statut === "expire") {
      systemAlerts.push({ type: "critical", message: `Assurance expirée sur ${v.immatriculation}` });
    }
    if (v.documents.visiteTechnique?.statut === "expire") {
      systemAlerts.push({ type: "critical", message: `Visite technique expirée sur ${v.immatriculation}` });
    }
    if (v.etat === "en_panne") {
      systemAlerts.push({ type: "critical", message: `Véhicule ${v.immatriculation} en panne` });
    }
  });

  chauffeurs.forEach(c => {
    if (c.isActive) {
      const expDate = new Date(c.expPermis);
      const now = new Date("2026-06-12");
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        systemAlerts.push({ type: "critical", message: `Permis expiré pour ${c.prenom} ${c.nom}` });
      } else if (diffDays <= 30) {
        systemAlerts.push({ type: "warning", message: `Permis de ${c.prenom} ${c.nom} expire dans ${diffDays} jours` });
      }
    }
  });

  const rentabilityData = vehicles.map(v => {
    const vPayments = payments.filter(p => p.vehiculeId === v.id && p.statut === "Validé").reduce((sum, p) => sum + (Number(p.montantVerse) || 0), 0);
    const vExpenses = expenses.filter(e => e.vehiculeId === v.id && e.statut === "Validé").reduce((sum, e) => sum + (Number(e.montant) || 0), 0);
    const netProfit = vPayments - vExpenses;
    const activeDriver = chauffeurs.find(c => c.vehiculeId === v.id && c.isActive);

    return {
      matricule: v.immatriculation,
      desc: `${v.marque} ${v.modele}`,
      driverName: activeDriver ? `${activeDriver.prenom} ${activeDriver.nom}` : "Aucun",
      paymentsTotal: vPayments,
      expensesTotal: vExpenses,
      profit: netProfit,
      rate: vPayments > 0 ? ((netProfit / vPayments) * 100).toFixed(1) : "0"
    };
  });

  const last5Days = ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12"];
  const financialHistoryChart = last5Days.map(dayStr => {
    const dayP = payments.filter(p => p.date === dayStr);
    const expected = dayP.reduce((sum, p) => sum + p.montantAttendu, 0); 
    const validatedPaid = dayP.filter(p => p.statut === "Validé").reduce((sum, p) => sum + p.montantVerse, 0);
    const dayExp = expenses.filter(e => e.date === dayStr && e.statut === "Validé").reduce((sum, e) => sum + e.montant, 0);
    return { name: dayStr.split("-").slice(1).reverse().join("/"), Attendu: expected, Encaissé: validatedPaid, Depenses: dayExp };
  });

  const expenseCategories = Array.from(new Set(expenses.filter(e => e.statut === "Validé").map(e => e.typeCharge)));
  const expenseChartData = expenseCategories.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.typeCharge === cat && e.statut === "Validé").reduce((sum, e) => sum + e.montant, 0)
  }));
  const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Welcome Banner - Version sans SVG problématique */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
        
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-amber-500/20 backdrop-blur-sm text-amber-400 px-4 py-1.5 rounded-full text-xs font-semibold border border-amber-500/30 shadow-lg">
                <span>Tableau de Bord en Temps Réel</span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Bienvenue, <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">{currentUser.name}</span>
                </h1>
                <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                  {currentUser.role === "ADMIN" 
                    ? "Vous disposez d'une vision globale et d'un contrôle administratif complet sur l'ensemble de la flotte."
                    : "Gérez votre activité journalière, déclarez vos versements et suivez vos performances en temps réel."
                  }
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {currentUser.role === "MANAGER" ? (
                <>
                  <button
                    onClick={onDeclarePayment}
                    className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 flex items-center space-x-2 cursor-pointer transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                    <Wallet className="h-4 w-4" />
                    <span>Nouveau Versement</span>
                  </button>
                  <button
                    onClick={onDeclareExpense}
                    className="group bg-slate-800 border border-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all duration-300 flex items-center space-x-2 cursor-pointer"
                  >
                    <Fuel className="h-4 w-4 text-amber-500" />
                    <span>Nouvelle Dépense</span>
                  </button>
                </>
              ) : (
                <div className="bg-emerald-500/20 backdrop-blur-sm text-emerald-400 px-4 py-2.5 rounded-xl border border-emerald-500/30 flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-semibold">Mode Administrateur - Vue Globale Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {!isDriver && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Flotte Totale</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{totalVehicles}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-slate-500">{vehicles.filter(v => v.etat === "bon" || v.etat === "excellent").length} véhicules actifs</span>
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>

            <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Chauffeurs Actifs</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{activeDrivers}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-emerald-600 font-medium">En service</span>
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>

            <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Recettes du Jour</p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatFCFA(collectedTodayTotal)}</h3>
                  <div className="flex justify-between items-center mt-2 text-[11px]">
                    <span className="text-slate-500">Attendu: {formatFCFA(expectedTodayTotal)}</span>
                    {pendingCollectionToday > 0 && (
                      <span className="text-amber-600 font-semibold">{formatFCFA(pendingCollectionToday)} en attente</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>

            <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <ArrowDownRight className="h-4 w-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Dépenses & Impayés</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <div>
                      <p className="text-[10px] text-slate-400">À recouvrer</p>
                      <span className="text-lg font-bold text-amber-600">-{formatFCFA(unpaidTodayTotal)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Frais validés</p>
                      <span className="text-lg font-bold text-rose-600">{formatFCFA(expensesTodayTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          </div>

          {/* Alerts Section */}
          {systemAlerts.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-amber-500 p-2 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800">Centre d'Alertes</h3>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-bold ml-2">
                    {systemAlerts.length} alerte{systemAlerts.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {systemAlerts.slice(0, 6).map((alert, idx) => (
                    <div key={idx} className={`p-3 rounded-xl text-xs flex items-start space-x-2.5 border ${alert.type === "critical" ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                      <div className="mt-0.5"><div className={`h-2 w-2 rounded-full ${alert.type === "critical" ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'}`} /></div>
                      <p className="leading-tight font-medium">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg lg:col-span-2 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-amber-500" />
                      <span>Performance Financière</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Évolution des recettes et dépenses sur 5 jours</p>
                  </div>
                  <button onClick={() => setIsReportOpen(true)} className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-md">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Rapport Complet</span>
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialHistoryChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis tickFormatter={(v) => `${v / 1000}k`} stroke="#94a3b8" fontSize={11} />
                      <Tooltip formatter={(value: any) => [formatFCFA(value), ""]} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar name="Montant Attendu" dataKey="Attendu" fill="#475569" radius={[4, 4, 0, 0]} />
                      <Bar name="Montant Encaissé" dataKey="Encaissé" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar name="Dépenses" dataKey="Depenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <PieChartIcon className="h-5 w-5 text-amber-500" />
                  <span>Répartition des Charges</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Analyse par catégorie</p>
              </div>
              <div className="p-5">
                {expenseChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-slate-400">Aucune dépense validée</div>
                ) : (
                  <>
                    <div className="h-56 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={expenseChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                            {expenseChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />))}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatFCFA(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center"><p className="text-[10px] text-slate-400 font-semibold">Total</p><p className="text-sm font-bold text-slate-800">{formatFCFA(expenseChartData.reduce((sum, d) => sum + d.value, 0))}</p></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                      {expenseChartData.slice(0, 4).map((data, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} /><span className="text-slate-600 truncate flex-1">{data.name}</span><span className="text-slate-800 font-semibold text-[10px]">{formatFCFA(data.value)}</span></div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profitability Table - Sans ID */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Award className="h-5 w-5 text-emerald-500" />
                    <span>Analyse de Rentabilité par Véhicule</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Calcul basé sur les versements et dépenses validés</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[11px] font-mono text-slate-500 uppercase">
                    <th className="px-5 py-3 text-left">Véhicule</th><th className="px-5 py-3 text-left">Chauffeur</th>
                    <th className="px-5 py-3 text-right">Versements</th><th className="px-5 py-3 text-right">Dépenses</th>
                    <th className="px-5 py-3 text-right">Bénéfice Net</th><th className="px-5 py-3 text-right">Rendement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rentabilityData.map((item, idx) => {
                    const isPositive = item.profit >= 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="px-5 py-3"><div><span className="font-mono text-xs font-bold text-slate-700">{item.matricule}</span><p className="text-[11px] text-slate-500">{item.desc}</p></div></td>
                        <td className="px-5 py-3 text-sm text-slate-600">{item.driverName}</td>
                        <td className="px-5 py-3 text-right font-mono text-sm font-semibold text-emerald-600">{formatFCFA(item.paymentsTotal)}</td>
                        <td className="px-5 py-3 text-right font-mono text-sm text-rose-600">-{formatFCFA(item.expensesTotal)}</td>
                        <td className={`px-5 py-3 text-right font-mono text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{formatFCFA(item.profit)}</td>
                        <td className="px-5 py-3 text-right"><span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{isPositive ? '+' : ''}{item.rate}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Driver View placeholder */}
      {isDriver && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
            <p className="text-slate-500">Interface conducteur</p>
          </div>
        </div>
      )}

      {/* Financial Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-slide-down">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center space-x-3"><div className="bg-emerald-100 p-2 rounded-xl"><FileText className="h-5 w-5 text-emerald-600" /></div><div><h2 className="text-lg font-bold text-slate-800">Rapport d'Activité Financière</h2><p className="text-xs text-slate-500 font-mono">Période : 08/06 au 12/06/2026</p></div></div>
              <div className="flex items-center space-x-2">
                <button onClick={handleDownloadPDF} className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-2"><Download className="h-3.5 w-3.5" /><span>PDF</span></button>
                <button onClick={handlePrintReport} className="bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-2"><Printer className="h-3.5 w-3.5" /><span>Imprimer</span></button>
                <button onClick={() => setIsReportOpen(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
              </div>
            </div>
            <div className="p-8 bg-slate-100 overflow-y-auto flex-1">
              <div id="rapport-financier-print-template" className="bg-white p-8 shadow-xl border border-slate-200 w-full max-w-[21cm] mx-auto">
                <div className="text-center border-b-2 border-slate-800 pb-5 mb-6"><h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">Rapport d'Activité Financière de la Flotte</h1><p className="text-sm text-slate-500 mt-2">Généré le 12 Juin 2026 par FleetTrack Management</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50"><h3 className="text-xs font-bold text-slate-500 uppercase">Recettes Validées</h3><p className="text-xl font-bold text-emerald-600 mt-1">{formatFCFA(repTotalCollected)}</p></div>
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50"><h3 className="text-xs font-bold text-slate-500 uppercase">Dépenses Approuvées</h3><p className="text-xl font-bold text-rose-600 mt-1">{formatFCFA(repTotalSpent)}</p></div>
                  <div className="p-4 rounded-lg border border-slate-200 bg-emerald-50"><h3 className="text-xs font-bold text-emerald-800 uppercase">Solde Net</h3><p className="text-xl font-bold text-indigo-700 mt-1">{formatFCFA(repTotalBalance)}</p></div>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-500"><div className="w-48 text-center border-t border-dashed border-slate-300 pt-2">Visa de Direction Administrative</div><div className="w-48 text-center border-t border-dashed border-slate-300 pt-2">Signature du Contrôle Opérationnel</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-fade-in { animation: fade-in-up 0.3s ease-out; }
      `}</style>

    </div>
  );
}