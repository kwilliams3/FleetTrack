import { useState } from "react";
import { 
  Vehicle, Chauffeur, Versement, Charge, ActivityLog, User 
} from "../types";
import { 
  Car, Users, ArrowUpRight, ArrowDownRight, AlertTriangle, 
  TrendingUp, Wallet, Wrench, CheckCircle2, ShieldAlert,
  CalendarCheck, Clock, FileWarning, Gauge, Printer, FileDown, FileText, X, Download
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

  // Dynamic report data calculation for the last 5 days
  const reportDays = ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12"];
  
  const reportRows = reportDays.map(d => {
    const dPayments = payments.filter(p => p.date === d && p.statut === "Validé");
    const dExpenses = expenses.filter(e => e.date === d && e.statut === "Validé");
    
    // Calculate the dynamic expected value from the database
    const dPaymentsAll = payments.filter(p => p.date === d);
    const expected = dPaymentsAll.reduce((sum, p) => sum + p.montantAttendu, 0);
    const collected = dPayments.reduce((sum, p) => sum + p.montantVerse, 0);
    const spent = dExpenses.reduce((sum, e) => sum + e.montant, 0);
    const balance = collected - spent;
    
    return {
      date: d,
      expected,
      collected,
      spent,
      balance
    };
  });

  const repTotalExpected = reportRows.reduce((sum, r) => sum + r.expected, 0);
  const repTotalCollected = reportRows.reduce((sum, r) => sum + r.collected, 0);
  const repTotalSpent = reportRows.reduce((sum, r) => sum + r.spent, 0);
  const repTotalBalance = repTotalCollected - repTotalSpent;

  // Filter actual transactions list within the 5 days for the details section
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
            <title>Rapport d'Activité Financière de la Flotte (5 derniers jours)</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 35px; color: #1e293b; background: white; line-height: 1.5; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
              .header h1 { font-size: 21px; color: #010409; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
              .header p { font-size: 13px; color: #64748b; margin: 5px 0 0 0; }
              .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
              .card { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #f8fafc; }
              .card h3 { font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 5px 0; }
              .card p { font-size: 18px; font-weight: bold; color: #0f172a; margin: 0; }
              .card.positive p { color: #10b981; }
              .section-title { font-size: 13px; font-weight: bold; margin: 25px 0 10px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; }
              th, td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
              th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; border-top: 1px solid #cbd5e1; }
              .text-right { text-align: right; }
              .stamp-sec { margin-top: 50px; display: flex; justify-content: space-between; }
              .stamp-sec div { width: 220px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 5px; font-size: 11px; color: #64748b; }
              @media print {
                body { padding: 0; }
                .card { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 800);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    // Title info
    const title = "RAPPORT D'ACTIVITE FINANCIERE DE LA FLOTTE";
    const period = "Periode : 08 Juin 2026 au 12 Juin 2026 (5 derniers jours)";
    const generated = "Genere le 12 Juin 2026 par FleetTrack Management";

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title, 14, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(period, 14, 25);
    doc.text(generated, 14, 29);

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Dynamic metrics blocks
    // Card 1: Recettes
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(14, 36, 56, 20, 1.5, 1.5, "FD");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("RECETTES VALIDEES (5J)", 18, 41);
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(formatFCFA(repTotalCollected), 18, 48);
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`De ${formatFCFA(repTotalExpected)} attendus`, 18, 52);

    // Card 2: Depenses
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(75, 36, 56, 20, 1.5, 1.5, "FD");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("DEPENSES APPROUVEES (5J)", 79, 41);
    doc.setFontSize(11);
    doc.setTextColor(239, 68, 68); // rose-600
    doc.text(formatFCFA(repTotalSpent), 79, 48);
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Carburants et pannes", 79, 52);

    // Card 3: Solde
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(136, 36, 60, 20, 1.5, 1.5, "FD");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.text("SOLDE NET (BILAN)", 140, 41);
    doc.setFontSize(11);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text(formatFCFA(repTotalBalance), 140, 48);
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Net percu de la flotte", 140, 52);

    // Table 1: Daily tabular breakdown
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("1. Ventilation Journaliere Globalisee", 14, 65);

    const table1Headers = [["Date d'operation", "Potentiel Attendu", "Montant Encaisse", "Charges Validees", "Rendement Net"]];
    const table1Body = reportRows.map(r => [
      r.date,
      formatFCFA(r.expected),
      formatFCFA(r.collected),
      formatFCFA(r.spent),
      formatFCFA(r.balance)
    ]);
    table1Body.push([
      "TOTAUX GENERAUX",
      formatFCFA(repTotalExpected),
      formatFCFA(repTotalCollected),
      formatFCFA(repTotalSpent),
      formatFCFA(repTotalBalance)
    ]);

    autoTable(doc, {
      startY: 68,
      head: table1Headers,
      body: table1Body,
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold"
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right", fontStyle: "bold" },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" }
      },
      didParseCell: (data) => {
        if (data.row.index === table1Body.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        }
      }
    });

    const nextY1 = (doc as any).lastAutoTable.finalY + 8;

    // Table 2: Journal des Versements
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("2. Journal des Versements de Caisse Valides (5j)", 14, nextY1);

    const table2Headers = [["Date", "Vehicule", "Chauffeur", "Reglement", "Montant Verse"]];
    const table2Body = reportPaymentsList.map(p => [
      p.date,
      p.matricule,
      p.nomChauffeur,
      p.moyenPaiement,
      formatFCFA(p.montantVerse)
    ]);

    autoTable(doc, {
      startY: nextY1 + 3,
      head: table2Headers,
      body: table2Body.length > 0 ? table2Body : [["Aucun versement valide pour cette periode.", "", "", "", ""]],
      theme: "striped",
      headStyles: {
        fillColor: [100, 116, 139], // slate-500
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold"
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      columnStyles: {
        4: { halign: "right", fontStyle: "bold", textColor: [16, 185, 129] }
      }
    });

    const nextY2 = (doc as any).lastAutoTable.finalY + 8;

    // Table 3: Journal des charges/expenses
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("3. Journal des Frais et Depenses Militants Valides (5j)", 14, nextY2);

    const table3Headers = [["Date", "Vehicule", "Type Charge", "Description", "Montant Execute"]];
    const table3Body = reportExpensesList.map(e => [
      e.date,
      e.matricule,
      e.typeCharge,
      e.description,
      formatFCFA(e.montant)
    ]);

    autoTable(doc, {
      startY: nextY2 + 3,
      head: table3Headers,
      body: table3Body.length > 0 ? table3Body : [["Aucun frais d'exploitation valide.", "", "", "", ""]],
      theme: "striped",
      headStyles: {
        fillColor: [100, 116, 139], // slate-500
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold"
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      },
      columnStyles: {
        4: { halign: "right", fontStyle: "bold", textColor: [220, 38, 38] }
      }
    });

    const nextY3 = (doc as any).lastAutoTable.finalY + 12;

    // Signatures
    const pageHeight = doc.internal.pageSize.height;
    let signatureY = nextY3;
    if (signatureY + 25 > pageHeight) {
      doc.addPage();
      signatureY = 30;
    }

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, signatureY, 74, signatureY);
    doc.text("Visa de Direction Administrative", 14, signatureY + 4);

    doc.line(136, signatureY, 196, signatureY);
    doc.text("Signature du Controle Operationnel", 136, signatureY + 4);

    doc.save("Rapport_Activite_Financiere_FleetTrack.pdf");
  };
  
  // Format currency helpers
  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  // ==========================================
  // CALCUL STATS MAIN (ADMIN & MANAGER)
  // ==========================================
  const totalVehicles = vehicles.length;
  const activeDrivers = chauffeurs.filter(c => c.isActive).length;
  const vehiclesInPanne = vehicles.filter(v => v.etat === "en_panne" || v.etat === "en_reparation").length;

  // Documents status calculations
  let expiredDocsCount = 0;
  let expiringDocsCount = 0;
  vehicles.forEach(v => {
    const list = [v.documents.carteGrise, v.documents.assurance, v.documents.visiteTechnique, v.documents.licenceTransport];
    list.forEach(doc => {
      if (doc) {
        if (doc.statut === "expire") expiredDocsCount++;
        else if (doc.statut === "expirant") expiringDocsCount++;
      }
    });
  });

  // Today is defined as 2026-06-12 in our simulation
  const todayPayments = payments.filter(p => p.date === "2026-06-12");
  const todayExpenses = expenses.filter(e => e.date === "2026-06-12" && e.statut === "Validé");
  
  // Expected revenue from all CURRENTLY assigned / running vehicles
  const assignedVehicles = vehicles.filter(v => chauffeurs.some(c => c.vehiculeId === v.id && c.isActive));
  const expectedTodayTotal = assignedVehicles.reduce((acc, v) => acc + v.montantJournalier, 0);
  
  const collectedTodayTotal = todayPayments
    .filter(p => p.statut === "Validé")
    .reduce((acc, p) => acc + p.montantVerse, 0);

  const pendingCollectionToday = todayPayments
    .filter(p => p.statut === "En attente")
    .reduce((acc, p) => acc + p.montantVerse, 0);

  // Today unpaid (expected total minus total actual validated payouts)
  const unpaidTodayTotal = Math.max(0, expectedTodayTotal - collectedTodayTotal);
  
  const expensesTodayTotal = todayExpenses.reduce((acc, e) => acc + e.montant, 0);

  // Alerts builder list
  const systemAlerts: { type: "critical" | "warning"; message: string; date?: string }[] = [];
  
  // Expiration documents alerts
  vehicles.forEach(v => {
    if (v.documents.assurance?.statut === "expire") {
      systemAlerts.push({ type: "critical", message: `Assurance expirée sur le véhicule ${v.immatriculation} (${v.marque} ${v.modele})` });
    } else if (v.documents.assurance?.statut === "expirant") {
      systemAlerts.push({ type: "warning", message: `L'assurance du véhicule ${v.immatriculation} expire bientôt (${v.documents.assurance.dateExpiration})` });
    }

    if (v.documents.visiteTechnique?.statut === "expire") {
      systemAlerts.push({ type: "critical", message: `Visite technique expirée sur le véhicule ${v.immatriculation}` });
    } else if (v.documents.visiteTechnique?.statut === "expirant") {
      systemAlerts.push({ type: "warning", message: `Visite technique du véhicule ${v.immatriculation} expire bientôt (${v.documents.visiteTechnique.dateExpiration})` });
    }
  });

  // License expiration alerts for chauffeurs
  chauffeurs.forEach(c => {
    if (c.isActive) {
      const expDate = new Date(c.expPermis);
      const now = new Date("2026-06-12");
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        systemAlerts.push({ type: "critical", message: `Permis de conduire EXPIRÉ pour le chauffeur ${c.prenom} ${c.nom}` });
      } else if (diffDays <= 30) {
        systemAlerts.push({ type: "warning", message: `Le permis du chauffeur ${c.prenom} ${c.nom} expire dans ${diffDays} jours` });
      }
    }
  });

  // Payments deficits alerts
  todayPayments.forEach(p => {
    if (p.ecart > 0) {
      systemAlerts.push({ type: "warning", message: `Écart de versement détecté aujourd'hui pour ${p.nomChauffeur} sur ${p.matricule} : -${formatFCFA(p.ecart)}` });
    }
  });

  // Vehicles in breakdown alert
  vehicles.forEach(v => {
    if (v.etat === "en_panne") {
      systemAlerts.push({ type: "critical", message: `Le véhicule ${v.immatriculation} (${v.marque}) est déclaré EN PANNE.` });
    }
  });


  // ==========================================
  // PROFITABILITY CALCULATIONS BY VEHICLE
  // ==========================================
  const rentabilityData = vehicles.map(v => {
    const vPayments = payments
      .filter(p => p.vehiculeId === v.id && p.statut === "Validé")
      .reduce((sum, p) => sum + (Number(p.montantVerse) || 0), 0);
      
    const vExpenses = expenses
      .filter(e => e.vehiculeId === v.id && e.statut === "Validé")
      .reduce((sum, e) => sum + (Number(e.montant) || 0), 0);

    const netProfit = vPayments - vExpenses;
    const activeDriver = chauffeurs.find(c => c.vehiculeId === v.id && c.isActive);

    return {
      id: v.id,
      matricule: v.immatriculation,
      desc: `${v.marque} ${v.modele}`,
      driverName: activeDriver ? `${activeDriver.prenom} ${activeDriver.nom}` : "Aucun",
      paymentsTotal: vPayments,
      expensesTotal: vExpenses,
      profit: netProfit,
      rate: vPayments > 0 && !isNaN(netProfit) && !isNaN(vPayments) ? ((netProfit / vPayments) * 100).toFixed(1) : "0"
    };
  });

  // Recharts Data formatting
  // Let's build a 5 days performance log (June 8 to June 12)
  const last5Days = ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12"];
  const financialHistoryChart = last5Days.map(dayStr => {
    // Expected on that day (sum of daily rates of assigned vehicles that day)
    const dayP = payments.filter(p => p.date === dayStr);
    
    // Dynamic calculation from database
    const expected = dayP.reduce((sum, p) => sum + p.montantAttendu, 0); 
    const validatedPaid = dayP.filter(p => p.statut === "Validé").reduce((sum, p) => sum + p.montantVerse, 0);
    const pendingPaid = dayP.filter(p => p.statut === "En attente").reduce((sum, p) => sum + p.montantVerse, 0);
    const dayExp = expenses.filter(e => e.date === dayStr && e.statut === "Validé").reduce((sum, e) => sum + e.montant, 0);

    return {
      name: dayStr.split("-").slice(1).reverse().join("/"), // MM/DD
      Attendu: expected,
      Encaissé: validatedPaid,
      EnAttente: pendingPaid,
      Dépenses: dayExp
    };
  });

  // Expenses categories Chart
  const expenseCategories = Array.from(new Set(expenses.filter(e => e.statut === "Validé").map(e => e.typeCharge)));
  const expenseChartData = expenseCategories.map((cat, idx) => {
    const total = expenses
      .filter(e => e.typeCharge === cat && e.statut === "Validé")
      .reduce((sum, e) => sum + e.montant, 0);
    return { name: cat, value: total };
  });

  const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  // ==========================================
  // DRIVER MODE VIEW COMPUTATIONS
  // ==========================================
  const driverVehicle = associatedDriver ? vehicles.find(v => v.id === associatedDriver.vehiculeId) : null;
  const driverPayments = associatedDriver ? payments.filter(p => p.chauffeurId === associatedDriver.id) : [];
  const driverExpenses = associatedDriver ? expenses.filter(e => e.chauffeurId === associatedDriver.id) : [];
  
  const driverTotalCollected = driverPayments.filter(p => p.statut === "Validé").reduce((sum, p) => sum + p.montantVerse, 0);
  const driverTotalPending = driverPayments.filter(p => p.statut === "En attente").reduce((sum, p) => sum + p.montantVerse, 0);
  const driverTotalExpenses = driverExpenses.filter(e => e.statut === "Validé").reduce((sum, e) => sum + e.montant, 0);

  const driverLastActivity = associatedDriver 
    ? activities.find(a => a.chauffeurId === associatedDriver.id)
    : null;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Dynamic Welcomer Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-80 h-full bg-linear-to-l from-amber-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/20">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Tableau de Bord Live</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">
              Bienvenue, {currentUser.name}
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              {currentUser.role === "ADMIN" 
                ? "Vous disposez d'un contrôle administratif complet de la flotte automobile, des versements et des charges d'exploitation."
                : currentUser.role === "MANAGER"
                ? "Vous pilotez la planification opérationnelle des véhicules, l'administration des chauffeurs et l'approbation des flux."
                : "Suivez votre activité journalière de transport, déclarez vos versements et soumettez vos notes de frais."
              }
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {currentUser.role === "MANAGER" ? (
              <>
                <button
                  onClick={onDeclarePayment}
                  className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-amber-400 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  id="btn-adm-payment"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Encaisser un Versement direct</span>
                </button>
                <button
                  onClick={onDeclareExpense}
                  className="bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  id="btn-adm-expense"
                >
                  <Wrench className="h-4 w-4 text-amber-500" />
                  <span>Enregistrer une Dépense Flotte</span>
                </button>
              </>
            ) : (
              <div className="bg-emerald-500/10 text-emerald-400 text-xs px-3.5 py-2 rounded-xl border border-emerald-500/20 flex items-center space-x-2 select-none">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="font-sans font-medium text-[11px] tracking-tight">Espace Administrateur connecté • Rapports et visualisations globaux activés (Lecture Seule)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== SCREEN 1: ADMIN & MANAGER VISUALS ==================== */}
      {!isDriver && (
        <>
          {/* Main Stats Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1: Vehicles */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="bg-slate-100 text-slate-900 p-3 rounded-xl">
                <Car className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Taille de la Flotte</p>
                <h3 className="text-2xl font-bold font-sans text-slate-900">{totalVehicles}</h3>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{vehicles.filter(v => v.etat === "bon" || v.etat === "excellent").length} véhicules actifs</span>
                </div>
              </div>
            </div>

            {/* Stat 2: Active Chauffeurs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Chauffeurs Actifs</p>
                <h3 className="text-2xl font-bold font-sans text-slate-900">{activeDrivers}</h3>
                <div className="flex items-center space-x-1.5 text-[10px] text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Service opérationnel</span>
                </div>
              </div>
            </div>

            {/* Stat 3: Monétaires Attendu vs Encaissé */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4 col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="space-y-1 w-full">
                <p className="text-xs text-slate-500 font-medium">Trésorerie/Versements (Aujourd'hui)</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-bold font-mono text-emerald-600">{formatFCFA(collectedTodayTotal)}</span>
                  <span className="text-xs text-slate-400 font-medium font-sans">reçus</span>
                </div>
                <div className="flex text-[10px] justify-between text-slate-500 font-mono">
                  <span>Attendu : {formatFCFA(expectedTodayTotal)}</span>
                  {pendingCollectionToday > 0 && (
                    <span className="text-amber-600 font-bold">({formatFCFA(pendingCollectionToday)} en attente)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stat 4: Dépenses / Impayés */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1 w-full">
                <p className="text-xs text-slate-500 font-medium">Dépenses & Impayés (Jour)</p>
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Restes à recouvrer</p>
                    <span className="text-sm font-bold font-mono text-amber-600">-{formatFCFA(unpaidTodayTotal)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400">Frais validés</p>
                    <span className="text-sm font-bold font-mono text-rose-600">{formatFCFA(expensesTodayTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Alert list row (If there are alerts) */}
          {systemAlerts.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-sans font-bold text-sm">Centre d'Alertes et de Validations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemAlerts.slice(0, 6).map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl text-xs flex items-start space-x-2.5 border ${
                      alert.type === "critical" 
                        ? "bg-rose-50/70 border-rose-100 text-rose-800" 
                        : "bg-amber-50/80 border-amber-100 text-amber-800"
                    }`}
                  >
                    <div className="mt-0.5">
                      {alert.type === "critical" ? (
                        <span className="inline-block h-2 w-2 rounded-full bg-rose-600" />
                      ) : (
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <p className="leading-tight">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core Analytics: Side by side Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Daily Revenue performance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 col-span-1 lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-50/50 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-sans text-slate-900">Activité Financière de la Flotte (5 derniers jours)</h3>
                  <p className="text-xs text-slate-500">Comparatif recettes attendues, reçues et dépenses approuvées</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <FileDown className="h-4 w-4" />
                    <span>Exporter Rapport PDF</span>
                  </button>
                  <TrendingUp className="h-4 w-4 text-emerald-500 hidden sm:block" />
                </div>
              </div>

              <div className="h-72 w-full font-mono text-slate-900 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialHistoryChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(value: any) => [formatFCFA(value), ""]} />
                    <Legend />
                    <Bar name="Montant Attendu" dataKey="Attendu" fill="#1e293b" radius={[4, 4, 0, 0]} />
                    <Bar name="Montant Encaissé" dataKey="Encaissé" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar name="Dépenses Flotte" dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Expenses share breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold font-sans text-slate-900">Répartition des Charges</h3>
                <p className="text-xs text-slate-500">Volume des pannes, carburant et entretiens validés</p>
              </div>

              {expenseChartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                  Aucune dépense validée pour le moment.
                </div>
              ) : (
                <div className="h-48 w-full font-sans flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatFCFA(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Total in center */}
                  <div className="absolute text-center">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none">Total</p>
                    <p className="text-sm font-bold font-mono text-slate-900">
                      {formatFCFA(expenseChartData.reduce((sum, d) => sum + d.value, 0))}
                    </p>
                  </div>
                </div>
              )}

              {/* Pie Legends */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
                {expenseChartData.slice(0, 4).map((data, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 truncate">
                    <span className="block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate">{data.name} ({formatFCFA(data.value)})</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Profitability Index List (Automated rentabilité feature) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-sans text-slate-900">Analyse Automatique de Rentabilité par Véhicule</h3>
                <p className="text-xs text-slate-500 font-sans">Formule : Rentabilité brute = Total Versements validés - Total Dépenses validées</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                Basé sur l'historique complet
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-mono text-slate-400 uppercase">
                    <th className="pb-3 pr-2">Véhicule</th>
                    <th className="pb-3 px-2">Chauffeur</th>
                    <th className="pb-3 px-2 text-right">Versements Reçus</th>
                    <th className="pb-3 px-2 text-right">Dépenses Déduites</th>
                    <th className="pb-3 pl-2 text-right">Bénéfice Net</th>
                    <th className="pb-3 pl-2 text-right">Rendement %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 font-sans text-xs">
                  {rentabilityData.map((item) => {
                    const isPositive = item.profit >= 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 pr-2 font-semibold text-slate-900">
                          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono mr-1.5">
                            {item.matricule}
                          </span>
                          {item.desc}
                        </td>
                        <td className="py-3 px-2 text-slate-500">{item.driverName}</td>
                        <td className="py-3 px-2 text-right font-mono text-slate-900">{formatFCFA(item.paymentsTotal)}</td>
                        <td className="py-3 px-2 text-right font-mono text-rose-600">-{formatFCFA(item.expensesTotal)}</td>
                        <td className={`py-3 pl-2 text-right font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatFCFA(item.profit)}
                        </td>
                        <td className="py-3 pl-2 text-right font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {isPositive ? '+' : ''}{item.rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==================== SCREEN 2: CHAUFFEUR DASHBOARD VIEW ==================== */}
      {isDriver && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Driver Left Card: Assigned vehicle & stats */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-6 md:col-span-1">
            <div className="text-center space-y-3">
              <img 
                src={associatedDriver?.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} 
                alt="Avatar" 
                className="h-20 w-20 rounded-full mx-auto object-cover border-2 border-amber-500 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-base font-bold font-sans text-slate-900">
                  {associatedDriver ? `${associatedDriver.prenom} ${associatedDriver.nom}` : "Chauffeur Invité"}
                </h3>
                <p className="text-xs text-slate-400 font-mono">Permis : {associatedDriver?.numPermis || "N/A"}</p>
                <p className="text-xs text-slate-400 font-mono">Expire le {associatedDriver?.expPermis || "N/A"}</p>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Véhicule Assigné</p>
                {driverVehicle ? (
                  <div className="mt-2 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">{driverVehicle.marque} {driverVehicle.modele}</p>
                      <p className="text-xs font-mono text-amber-600 bg-amber-50 border border-amber-200 inline-block px-1 rounded">
                        {driverVehicle.immatriculation}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 leading-none">Versement Journalier</p>
                      <p className="text-sm font-bold font-mono text-slate-900 mt-1">{formatFCFA(driverVehicle.montantJournalier)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Aucun véhicule ne vous est actuellement attribué.</p>
                )}
              </div>

              {/* Personal Totals */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block leading-tight">Mes Versements Validés</span>
                  <span className="text-xs font-bold font-mono text-slate-900 mt-1 block">{formatFCFA(driverTotalCollected)}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block leading-tight">Dépenses Remboursées</span>
                  <span className="text-xs font-bold font-mono text-slate-900 mt-1 block">{formatFCFA(driverTotalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Right block: Shift logs & recent table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-6 md:col-span-2">
            
            {/* Last shift status */}
            <div>
              <h3 className="text-sm font-bold font-sans text-slate-900">Statut de votre service</h3>
              <p className="text-xs text-slate-500 mb-4">Dernière activité déclarée dans le système</p>

              {driverLastActivity ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Date de service : {driverLastActivity.date} {driverLastActivity.date === "2026-06-12" ? "(Aujourd'hui)" : ""}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Kilométrage déclaré : <strong className="font-mono text-slate-800">{driverLastActivity.kilometrageJournalier} km</strong>
                      </p>
                      {driverLastActivity.observations && (
                        <p className="text-slate-400 italic text-[11px] mt-0.5">"{driverLastActivity.observations}"</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] uppercase">
                      Présent
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs font-sans">
                  Vous n'avez pas encore déclaré votre prise de service pour aujourd'hui (12 Juin 2026).
                  Veuillez cliquer sur "Enregistrer Service" pour enregistrer votre kilométrage.
                </div>
              )}
            </div>

            {/* Drivers payments list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-sans text-slate-900">Vos Dernières Déclarations de Versement</h3>
                <span className="text-[10px] text-slate-400 font-mono">Total : {driverPayments.length} versements</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Véhicule</th>
                      <th className="pb-2 text-right">Versé</th>
                      <th className="pb-2 text-right">Attendu</th>
                      <th className="pb-2 text-right">Différence / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60 font-sans">
                    {driverPayments.slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 font-mono text-slate-600">{p.date}</td>
                        <td className="py-2.5 font-semibold text-slate-900">{p.matricule}</td>
                        <td className="py-2.5 text-right font-mono font-semibold text-teal-600">{formatFCFA(p.montantVerse)}</td>
                        <td className="py-2.5 text-right font-mono text-slate-400">{formatFCFA(p.montantAttendu)}</td>
                        <td className="py-2.5 text-right flex items-center justify-end space-x-1.5 font-mono mt-0.5">
                          {p.ecart > 0 ? (
                            <span className="text-amber-500 text-[11px] font-semibold">-{formatFCFA(p.ecart)}</span>
                          ) : (
                            <span className="text-emerald-500 text-[11px] font-semibold">Ok</span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.statut === "Validé" ? "bg-emerald-50 text-emerald-700" :
                            p.statut === "Refusé" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {p.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {driverPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 italic">Aucun versement enregistré.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* FINANCIAL REPORT MODAL & PRINT PREVIEW                    */}
      {/* ========================================================== */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-up">
            
            {/* Modal Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Rapport d'Activité Financière de la Flotte</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Période : 5 Derniers Jours (08/06 au 12/06/2026)</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadPDF}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  title="Télécharger directement le rapport au format PDF via jsPDF"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger PDF (jsPDF)</span>
                </button>
                <button
                  onClick={handlePrintReport}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  title="Ouvrir l'aperçu avant impression du navigateur"
                >
                  <Printer className="h-4 w-4" />
                  <span>Version Imprimable</span>
                </button>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-150 p-2 rounded-lg cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / Paper Sheet Previewer */}
            <div className="p-8 bg-slate-100 overflow-y-auto flex-1 flex justify-center">
              <div 
                id="rapport-financier-print-template" 
                className="bg-white p-8 sm:p-12 shadow-md border border-slate-300 w-full max-w-[21cm] min-h-[29.7cm] text-slate-800 flex flex-col justify-between"
              >
                <div>
                  {/* Executive Header */}
                  <div className="header border-b-2 border-slate-800 pb-5 mb-6 text-center">
                    <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">Rapport d'Activité Financière de la Flotte</h1>
                    <p className="text-xs text-slate-500 mt-1">Généré le 12 Juin 2026 par FleetTrack Management</p>
                    <p className="text-[10px] font-mono text-slate-400">Période d'évaluation : 08 Juin 2026 - 12 Juin 2026 (5 derniers jours)</p>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="summary-cards grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="card p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recettes Validées (5j)</h3>
                      <p className="text-lg font-bold text-emerald-600 font-mono mt-1">{formatFCFA(repTotalCollected)}</p>
                      <span className="text-[10px] text-slate-400 italic">De {formatFCFA(repTotalExpected)} attendus</span>
                    </div>

                    <div className="card p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dépenses Approuvées (5j)</h3>
                      <p className="text-lg font-bold text-rose-600 font-mono mt-1">{formatFCFA(repTotalSpent)}</p>
                      <span className="text-[10px] text-slate-400 italic">Frais carburants et pannes</span>
                    </div>

                    <div className="card p-4 rounded-lg border border-slate-200 bg-emerald-50/50">
                      <h3 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Solde Net (Bilan)</h3>
                      <p className="text-lg font-bold text-indigo-700 font-mono mt-1">{formatFCFA(repTotalBalance)}</p>
                      <span className="text-[10px] text-slate-400 italic">Net perçu de la flotte</span>
                    </div>
                  </div>

                  {/* Daily Tabular Breakdown */}
                  <div className="section-title text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300 pb-1.5 mb-2.5">
                    1. Ventilation Journalière Globalisée
                  </div>
                  <table className="w-full text-xs text-left border-collapse border border-slate-200 mb-6">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-2 border border-slate-200">Date d'opération</th>
                        <th className="p-2 border border-slate-200 text-right">Potentiel Attendu</th>
                        <th className="p-2 border border-slate-200 text-right">Montant Encaissé</th>
                        <th className="p-2 border border-slate-200 text-right">Charges Validées</th>
                        <th className="p-2 border border-slate-200 text-right">Rendement Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                      {reportRows.map(r => (
                        <tr key={r.date} className="hover:bg-slate-50/40">
                          <td className="p-2 font-sans font-semibold border border-slate-200">{r.date}</td>
                          <td className="p-2 text-right border border-slate-200">{formatFCFA(r.expected)}</td>
                          <td className="p-2 text-right font-bold text-emerald-600 border border-slate-200">{formatFCFA(r.collected)}</td>
                          <td className="p-2 text-right text-rose-600 border border-slate-200">{formatFCFA(r.spent)}</td>
                          <td className={`p-2 text-right border border-slate-200 font-bold ${
                            r.balance >= 0 ? "text-slate-900" : "text-rose-700"
                          }`}>{formatFCFA(r.balance)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100/60 font-bold text-slate-900">
                        <td className="p-2 font-sans border border-slate-200">TOTAUX GENERAUX</td>
                        <td className="p-2 text-right border border-slate-200">{formatFCFA(repTotalExpected)}</td>
                        <td className="p-2 text-right text-emerald-700 border border-slate-200">{formatFCFA(repTotalCollected)}</td>
                        <td className="p-2 text-right text-rose-700 border border-slate-200">{formatFCFA(repTotalSpent)}</td>
                        <td className="p-2 text-right text-indigo-800 border border-slate-200">{formatFCFA(repTotalBalance)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Detail Transaction Lists */}
                  <div className="section-title text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300 pb-1.5 mb-2.5">
                    2. Journal des Versements de Caisse Validés (5j)
                  </div>
                  <table className="w-full text-[10px] text-left border-collapse border border-slate-200 mb-6">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-2 border border-slate-200">Date</th>
                        <th className="p-2 border border-slate-200">Véhicule</th>
                        <th className="p-2 border border-slate-200">Chauffeur</th>
                        <th className="p-2 border border-slate-200">Méthode de règlement</th>
                        <th className="p-2 border border-slate-200 text-right">Montant Versé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-sans">
                      {reportPaymentsList.map(p => (
                        <tr key={p.id}>
                          <td className="p-2 font-mono text-slate-500 border border-slate-200">{p.date}</td>
                          <td className="p-2 font-semibold text-slate-700 border border-slate-200">{p.matricule}</td>
                          <td className="p-2 border border-slate-200">{p.nomChauffeur}</td>
                          <td className="p-2 text-slate-500 border border-slate-200">{p.moyenPaiement}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-600 border border-slate-200">{formatFCFA(p.montantVerse)}</td>
                        </tr>
                      ))}
                      {reportPaymentsList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-2 text-center text-slate-400 italic">Aucun règlement validé.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="section-title text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300 pb-1.5 mb-2.5">
                    3. Journal des Frais et Dépenses Militants Validés (5j)
                  </div>
                  <table className="w-full text-[10px] text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-2 border border-slate-200">Date</th>
                        <th className="p-2 border border-slate-200">Véhicule</th>
                        <th className="p-2 border border-slate-200">Type de Charge</th>
                        <th className="p-2 border border-slate-200">Explication de la Panne</th>
                        <th className="p-2 border border-slate-200 text-right">Montant Exécuté</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-sans">
                      {reportExpensesList.map(e => (
                        <tr key={e.id}>
                          <td className="p-2 font-mono text-slate-500 border border-slate-200">{e.date}</td>
                          <td className="p-2 font-semibold text-slate-700 border border-slate-200">{e.matricule}</td>
                          <td className="p-2 text-slate-500 border border-slate-200">{e.typeCharge}</td>
                          <td className="p-2 border border-slate-200">{e.description}</td>
                          <td className="p-2 text-right font-mono font-bold text-rose-600 border border-slate-200">{formatFCFA(e.montant)}</td>
                        </tr>
                      ))}
                      {reportExpensesList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-2 text-center text-slate-400 italic">Aucun frais d'exploitation validé.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Authority Stamps / Signatures block */}
                <div className="stamp-sec mt-10 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="w-[180px] text-center border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400">
                    Visa de Direction Administrative
                  </div>
                  <div className="w-[180px] text-center border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400">
                    Signature du Contrôle Opérationnel
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
