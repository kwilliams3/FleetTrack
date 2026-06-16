import React, { useState } from "react";
import { Charge, Vehicle, Chauffeur, User } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Plus, Check, X, ShieldAlert, AlertTriangle, Calendar, Filter, 
  Wrench, Fuel, Image, AlertCircle, FileText, Clock, Settings, Eye, HelpCircle, Tag, MessageSquare, RefreshCw,
  Search, ChevronLeft, ChevronRight, Save, Info, TrendingUp, Receipt, Car, UserCheck, Award
} from "lucide-react";

interface ChargesViewProps {
  expenses: Charge[];
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  currentUser: User;
  onAddCharge: (form: Partial<Charge>) => void;
  onValidateCharge: (id: string, action: 'APPROVE' | 'REJECT', motif?: string) => void;
}

export default function ChargesView({
  expenses,
  vehicles,
  chauffeurs,
  currentUser,
  onAddCharge,
  onValidateCharge
}: ChargesViewProps) {
  const isManager = currentUser.role === "MANAGER";
  const isDriver = false;
  const associatedDriver = undefined;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<Charge | null>(null);
  const [searchVeh, setSearchVeh] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'timeline'>('expenses');
  const [timelineVehFilter, setTimelineVehFilter] = useState("all");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionTargetId, setDecisionTargetId] = useState<string | null>(null);
  const [decisionValue, setDecisionValue] = useState<'APPROVE' | 'REJECT' | null>("APPROVE");
  const [decisionObservation, setDecisionObservation] = useState("");

  const [formVehiculeId, setFormVehiculeId] = useState("");
  const [formTypeCharge, setFormTypeCharge] = useState<Charge['typeCharge']>("Carburant");
  const [formDescription, setFormDescription] = useState("");
  const [formMontant, setFormMontant] = useState<number | "">("");
  const [formJustificatif, setFormJustificatif] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  const handleOpenDeclare = () => {
    setCurrentStep(1);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormMontant("");
    setFormDescription("");
    setFormTypeCharge("Carburant");
    setFormJustificatif("");

    if (isDriver && associatedDriver) {
      setFormVehiculeId(associatedDriver.vehiculeId || "");
    } else {
      setFormVehiculeId("");
    }

    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVehiculeId || !formDescription || formMontant === "") {
      alert("Veuillez renseigner le véhicule, la description et le montant dépensé.");
      return;
    }

    onAddCharge({
      date: formDate,
      vehiculeId: formVehiculeId,
      chauffeurId: isDriver && associatedDriver ? associatedDriver.id : undefined,
      nomChauffeur: isDriver && associatedDriver ? `${associatedDriver.prenom} ${associatedDriver.nom}` : "Administration",
      typeCharge: formTypeCharge,
      description: formDescription,
      montant: Number(formMontant),
      justificatif: formJustificatif || `justificatif_${Date.now()}.jpg`
    });

    setIsModalOpen(false);
  };

  const handleConfirmDecision = () => {
    if (!decisionTargetId) return;
    if (!decisionValue) {
      alert("Veuillez choisir une décision.");
      return;
    }
    if (decisionValue === "REJECT" && !decisionObservation.trim()) {
      alert("Le motif de la décision est obligatoire pour un refus.");
      return;
    }

    onValidateCharge(decisionTargetId, decisionValue, decisionObservation);
    setDecisionModalOpen(false);
    setDecisionTargetId(null);
    setDecisionObservation("");
  };

  // Stats for cards
  const totalExpenses = expenses.length;
  const approvedExpenses = expenses.filter(e => e.statut === "Validé").length;
  const pendingExpenses = expenses.filter(e => e.statut === "En attente").length;
  const rejectedExpenses = expenses.filter(e => e.statut === "Refusé").length;

  const filteredExpenses = expenses.filter(e => {
    if (isDriver && associatedDriver) {
      if (e.chauffeurId !== associatedDriver.id) return false;
    }

    const vehMatch = e.matricule.toLowerCase().includes(searchVeh.toLowerCase()) || 
                     e.nomChauffeur.toLowerCase().includes(searchVeh.toLowerCase()) ||
                     e.description.toLowerCase().includes(searchVeh.toLowerCase());

    const typeMatch = filterType === "all" || e.typeCharge === filterType;
    const statusMatch = filterStatut === "all" || e.statut === filterStatut;

    return vehMatch && typeMatch && statusMatch;
  });

  const totalValidatedCosts = filteredExpenses
    .filter(e => e.statut === "Validé")
    .reduce((sum, e) => sum + e.montant, 0);

  const totalPendingCosts = filteredExpenses
    .filter(e => e.statut === "En attente")
    .reduce((sum, e) => sum + e.montant, 0);

  const exportPDF5Days = () => {
    const last5Dates = Array.from(new Set(filteredExpenses.map(e => e.date)))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 5);

    if (last5Dates.length === 0) {
      alert("Aucune donnée disponible pour l'export.");
      return;
    }

    const doc = new jsPDF();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RAPPORT MENSUEL DES DEPENSES - LES 5 DERNIERS JOURS", 14, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(241, 245, 249);
    doc.text(`Généré le: ${new Date().toLocaleString("fr-FR")} | Opérateur: ${currentUser.name} (${currentUser.role})`, 14, 25);
    doc.text(`Nombre de jours d'activité analysés: ${last5Dates.length}`, 14, 30);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("1. Tableau Récapitulatif par Jour", 14, 45);

    const summaryRows = last5Dates.map(date => {
      const dayExpenses = filteredExpenses.filter(e => e.date === date);
      const totalAmount = dayExpenses.reduce((sum, e) => sum + e.montant, 0);
      const totalApproved = dayExpenses.filter(e => e.statut === "Validé").reduce((sum, e) => sum + e.montant, 0);
      const totalPending = dayExpenses.filter(e => e.statut === "En attente").reduce((sum, e) => sum + e.montant, 0);
      const count = dayExpenses.length;

      const formatPDFValue = (val: number) => {
        return `${val.toLocaleString("fr-FR").replace(/[\u202f\u00a0\s]/g, " ")} FCFA`;
      };

      return [
        date,
        `${count} dépense(s)`,
        formatPDFValue(totalApproved),
        formatPDFValue(totalPending),
        formatPDFValue(totalAmount)
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Date d\'activité', 'Opérations', 'Total Validé', 'Total En Attente', 'Total Cumulé']],
      body: summaryRows,
      theme: 'striped',
      headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255] },
      styles: { fontSize: 9, font: 'Helvetica' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 15;
    
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("2. Détails des Dépenses sur la Période", 14, finalY);

    const detailedExpenses = filteredExpenses.filter(e => last5Dates.includes(e.date))
      .sort((a, b) => b.date.localeCompare(a.date));

    const formatPDFDetailed = (val: number) => {
      return `${val.toLocaleString("fr-FR").replace(/[\u202f\u00a0\s]/g, " ")} FCFA`;
    };

    const detailedRows = detailedExpenses.map(e => [
      e.date,
      e.matricule,
      e.typeCharge,
      e.description.length > 35 ? `${e.description.substring(0, 35)}...` : e.description,
      e.nomChauffeur,
      formatPDFDetailed(e.montant),
      e.statut
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Date', 'Véhicule', 'Type', 'Description', 'Auteur', 'Montant', 'Statut']],
      body: detailedRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      styles: { fontSize: 8, font: 'Helvetica' },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'center' }
      }
    });

    doc.save(`Rapport_Depenses_5Jours_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 1 && (!formVehiculeId || !formTypeCharge)) {
        alert("Veuillez sélectionner un véhicule et un type de charge");
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Carburant': return <Fuel className="h-3.5 w-3.5" />;
      case 'Panne mécanique': return <AlertCircle className="h-3.5 w-3.5" />;
      case 'Réparation': return <Wrench className="h-3.5 w-3.5" />;
      default: return <Settings className="h-3.5 w-3.5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Carburant': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Panne mécanique': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Réparation': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Entretien': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
            <Receipt className="h-7 w-7 text-amber-500" />
            <span>Gestion des Dépenses</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Suivez et validez les dépenses d'exploitation de la flotte</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Receipt className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Total dépenses</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalExpenses}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Check className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Dépenses validées</p>
            <h3 className="text-2xl font-bold text-emerald-600">{approvedExpenses}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">En attente</p>
            <h3 className="text-2xl font-bold text-amber-600">{pendingExpenses}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <X className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Dépenses refusées</p>
            <h3 className="text-2xl font-bold text-rose-600">{rejectedExpenses}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>
      </div>

      {/* Sub-tabs Selection */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-2">
        <button
          onClick={() => setActiveSubTab("expenses")}
          className={`px-5 py-3 text-sm font-bold font-sans border-b-2 transition-all duration-300 flex items-center space-x-2 ${
            activeSubTab === "expenses"
              ? "border-rose-500 text-rose-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Registre des Dépenses</span>
        </button>
        <button
          onClick={() => setActiveSubTab("timeline")}
          className={`px-5 py-3 text-sm font-bold font-sans border-b-2 transition-all duration-300 flex items-center space-x-2 ${
            activeSubTab === "timeline"
              ? "border-rose-500 text-rose-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Historique des Interventions</span>
        </button>
      </div>

      {activeSubTab === "expenses" ? (
        <>
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par véhicule, chauffeur ou description..."
                  value={searchVeh}
                  onChange={(e) => setSearchVeh(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all duration-200"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-slate-600 min-w-[180px]"
                >
                  <option value="all">Tous les types</option>
                  <option value="Carburant">Carburant</option>
                  <option value="Panne mécanique">Panne mécanique</option>
                  <option value="Réparation">Réparation</option>
                  <option value="Entretien">Entretien</option>
                  <option value="Pneus">Pneus</option>
                  <option value="Vidange">Vidange</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-slate-400" />
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-slate-600 min-w-[150px]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="Validé">Validés</option>
                  <option value="En attente">En attente</option>
                  <option value="Refusé">Refusés</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportPDF5Days}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Exporter PDF (5J)</span>
                </button>

                {isManager && (
                  <button
                    onClick={handleOpenDeclare}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nouvelle Dépense</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-rose-500" />
                  <h3 className="font-bold text-slate-800">Registre des dépenses</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Montants en FCFA</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[11px] font-mono text-slate-500 uppercase">
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Véhicule</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Description</th>
                    <th className="px-5 py-3 text-left">Auteur</th>
                    <th className="px-5 py-3 text-right">Montant</th>
                    <th className="px-5 py-3 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-slate-800">{e.date}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                          {e.matricule}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold ${getTypeColor(e.typeCharge)}`}>
                          {getTypeIcon(e.typeCharge)}
                          <span>{e.typeCharge}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-slate-600 max-w-xs truncate" title={e.description}>
                          {e.description}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600">{e.nomChauffeur}</td>
                      <td className="px-5 py-3 text-right font-mono text-sm font-bold text-rose-600">
                        {formatFCFA(e.montant)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedExpenseForDetail(e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 transition-colors"
                            title="Détails"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-600" />
                          </button>

                          {e.statut === "En attente" && isManager && (
                            <button
                              onClick={() => {
                                setDecisionTargetId(e.id);
                                setDecisionValue("APPROVE");
                                setDecisionObservation("");
                                setDecisionModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-semibold transition-colors"
                            >
                              Valider
                            </button>
                          )}

                          {e.statut !== "En attente" && (
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              e.statut === "Validé" ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {e.statut}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <div className="text-slate-400">
                          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Aucune dépense trouvée</p>
                          <p className="text-xs mt-1">Aucune transaction ne correspond à vos critères</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Car className="h-5 w-5 text-amber-500" />
                <select
                  value={timelineVehFilter}
                  onChange={(e) => setTimelineVehFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-slate-600 min-w-[200px]"
                >
                  <option value="all">Tous les véhicules</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                Chronologie des immobilisations et maintenances
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
            {(() => {
              const maintenanceTypes = ['Panne mécanique', 'Réparation', 'Entretien', 'Vidange', 'Pièces de rechange'];
              const list = expenses.filter(e => {
                const isMaintenance = maintenanceTypes.includes(e.typeCharge);
                const isVehSelected = timelineVehFilter === "all" || e.vehiculeId === timelineVehFilter;
                return isMaintenance && isVehSelected;
              }).sort((a, b) => b.date.localeCompare(a.date));

              if (list.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400">
                    <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Aucune intervention enregistrée</p>
                  </div>
                );
              }

              return (
                <div className="relative pl-8 border-l-2 border-rose-200 space-y-6 ml-4">
                  {list.map((e, idx) => (
                    <div key={e.id} className="relative group animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className={`absolute -left-[37px] top-1 h-3 w-3 rounded-full ${e.typeCharge === 'Panne mécanique' ? 'bg-rose-500 ring-4 ring-rose-200' : 'bg-amber-500 ring-4 ring-amber-200'}`} />
                      
                      <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-xs font-bold bg-slate-800 text-white px-2 py-1 rounded-lg">
                              {e.matricule}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{e.date}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${getTypeColor(e.typeCharge)}`}>
                              {e.typeCharge}
                            </span>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              e.statut === "Validé" ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {e.statut}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-700 mb-3">{e.description}</p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>{e.nomChauffeur}</span>
                          </div>
                          <span className="font-mono font-bold text-rose-600">{formatFCFA(e.montant)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL ULTRA PREMIUM : NOUVELLE DÉPENSE AVEC ÉTAPES */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-down relative">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500" />
            
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-6 pt-6 pb-4 border-b border-slate-100 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-lg">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Nouvelle Dépense</h2>
                    <p className="text-xs text-slate-500">Enregistrer une dépense d'exploitation</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between max-w-xs mx-auto">
                  {[1, 2].map((step) => (
                    <div key={step} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          currentStep >= step 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {currentStep > step ? <Check className="h-4 w-4" /> : step}
                        </div>
                        <span className={`text-[10px] mt-1 font-medium ${
                          currentStep >= step ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {step === 1 ? 'Informations' : 'Montant'}
                        </span>
                      </div>
                      {step < 2 && (
                        <div className={`absolute top-4 left-[calc(50%+16px)] w-[calc(100%-32px)] h-0.5 transition-all duration-300 ${
                          currentStep > step ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-slate-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-6">
                {currentStep === 1 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl">
                      <div className="flex items-center space-x-2 mb-4">
                        <Car className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-700">Informations de la dépense</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Date *</label>
                          <input
                            type="date"
                            required
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Véhicule *</label>
                          <select
                            required
                            value={formVehiculeId}
                            onChange={(e) => setFormVehiculeId(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          >
                            <option value="">-- Sélectionner --</option>
                            {vehicles.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.immatriculation} - {v.marque} {v.modele}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Type de dépense *</label>
                          <select
                            required
                            value={formTypeCharge}
                            onChange={(e) => setFormTypeCharge(e.target.value as any)}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          >
                            <option value="Carburant">⛽ Carburant</option>
                            <option value="Panne mécanique">🔧 Panne mécanique</option>
                            <option value="Réparation">🛠️ Réparation</option>
                            <option value="Entretien">🔩 Entretien</option>
                            <option value="Pneus">🚗 Pneus</option>
                            <option value="Vidange">💧 Vidange</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Description *</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Décrivez la dépense en détail..."
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Justificatif (optionnel)</label>
                          <input
                            type="text"
                            placeholder="Nom du fichier justificatif"
                            value={formJustificatif}
                            onChange={(e) => setFormJustificatif(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-5 rounded-xl">
                      <div className="flex items-center space-x-2 mb-4">
                        <TrendingUp className="h-4 w-4 text-rose-600" />
                        <h3 className="text-sm font-bold text-slate-700">Montant de la dépense</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Montant (FCFA) *</label>
                          <input
                            type="number"
                            required
                            placeholder="0"
                            value={formMontant}
                            onChange={(e) => setFormMontant(e.target.value !== "" ? Number(e.target.value) : "")}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-rose-600 text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          />
                        </div>

                        <div className="bg-white/50 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-slate-500 mt-0.5" />
                            <p className="text-xs text-slate-600">
                              Le justificatif de cette dépense devra être fourni pour validation.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 py-4 border-t border-slate-100 rounded-b-3xl">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Annuler
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center space-x-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Précédent</span>
                      </button>
                    )}
                    
                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                      >
                        <span>Continuer</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-8 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Enregistrer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: DETAILS DÉPENSE - SANS ID */}
      {/* ========================================================== */}
      {selectedExpenseForDetail && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-down">
            
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500" />
              
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-rose-100 p-2 rounded-xl">
                      <Receipt className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Détail de la dépense</h2>
                    </div>
                  </div>
                  <button onClick={() => setSelectedExpenseForDetail(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase">Date</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedExpenseForDetail.date}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase">Statut</p>
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    selectedExpenseForDetail.statut === "Validé" ? 'bg-emerald-100 text-emerald-700' :
                    selectedExpenseForDetail.statut === "Refusé" ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedExpenseForDetail.statut}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Véhicule</span>
                  <span className="font-bold text-slate-800">{selectedExpenseForDetail.matricule}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Type</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${getTypeColor(selectedExpenseForDetail.typeCharge)}`}>
                    {selectedExpenseForDetail.typeCharge}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Auteur</span>
                  <span className="font-bold text-slate-800">{selectedExpenseForDetail.nomChauffeur}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl">
                  <p className="text-[10px] text-rose-600 uppercase font-bold">Montant</p>
                  <p className="text-xl font-bold text-rose-600">{formatFCFA(selectedExpenseForDetail.montant)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Description</p>
                  <p className="text-sm text-slate-700 mt-1">{selectedExpenseForDetail.description}</p>
                </div>
                {selectedExpenseForDetail.justificatif && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Justificatif</p>
                    <p className="text-sm text-slate-700 mt-1 font-mono">{selectedExpenseForDetail.justificatif}</p>
                  </div>
                )}
              </div>

              {selectedExpenseForDetail.statut === "Refusé" && selectedExpenseForDetail.motifRefus && (
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <p className="text-[10px] font-bold text-rose-800 uppercase">Motif du rejet</p>
                  <p className="text-sm text-rose-700 mt-1">{selectedExpenseForDetail.motifRefus}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
              <button
                onClick={() => setSelectedExpenseForDetail(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: VALIDER OU REJETER */}
      {/* ========================================================== */}
      {decisionModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-down">
            
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500" />
              
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 p-2 rounded-xl">
                    <RefreshCw className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Validation de la dépense</h2>
                    <p className="text-xs text-slate-500">Prenez une décision</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecisionValue("APPROVE")}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-xl border-2 transition-all ${
                    decisionValue === "APPROVE"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold text-emerald-700">Accepter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionValue("REJECT")}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-xl border-2 transition-all ${
                    decisionValue === "REJECT"
                      ? "border-rose-500 bg-rose-50"
                      : "border-slate-200 hover:border-rose-300"
                  }`}
                >
                  <X className="h-5 w-5 text-rose-600" />
                  <span className="font-bold text-rose-700">Refuser</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Motif (obligatoire pour refus)</label>
                <textarea
                  rows={3}
                  placeholder="Expliquez votre décision..."
                  value={decisionObservation}
                  onChange={(e) => setDecisionObservation(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex justify-end space-x-3">
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDecision}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                Confirmer
              </button>
            </div>
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