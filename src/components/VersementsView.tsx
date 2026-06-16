import React, { useState } from "react";
import { Versement, Vehicle, Chauffeur, User } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Plus, Check, X, Wallet, ShieldAlert, AlertTriangle, Calendar, Filter, 
  Clock, Download, RefreshCw, FileText, Eye, HelpCircle, Tag, MessageSquare,
  Search, ChevronLeft, ChevronRight, Save, Info, CheckCircle2, ArrowRightLeft,
  TrendingUp, Award, Smartphone, Building, Users
} from "lucide-react";

interface VersementsViewProps {
  payments: Versement[];
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  currentUser: User;
  onAddPayment: (form: Partial<Versement>) => void;
  onValidatePayment: (id: string, action: 'APPROVE' | 'REJECT', motif?: string) => void;
}

export default function VersementsView({
  payments,
  vehicles,
  chauffeurs,
  currentUser,
  onAddPayment,
  onValidatePayment
}: VersementsViewProps) {
  const isManager = currentUser.role === "MANAGER";
  const isDriver = false;
  const associatedDriver = undefined;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentForDetail, setSelectedPaymentForDetail] = useState<Versement | null>(null);
  const [searchChauffeur, setSearchChauffeur] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterPayMethod, setFilterPayMethod] = useState("all");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionTargetId, setDecisionTargetId] = useState<string | null>(null);
  const [decisionValue, setDecisionValue] = useState<'APPROVE' | 'REJECT' | null>("APPROVE");
  const [decisionObservation, setDecisionObservation] = useState("");

  const [formVehiculeId, setFormVehiculeId] = useState("");
  const [formChauffeurId, setFormChauffeurId] = useState("");
  const [formMontantVerse, setFormMontantVerse] = useState<number | "">("");
  const [formPayMethod, setFormPayMethod] = useState<'MTN Mobile Money' | 'Orange Money' | 'Espèces (Cash)'>("MTN Mobile Money");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  const handleOpenDeclare = () => {
    setCurrentStep(1);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormMontantVerse("");
    setFormPayMethod("MTN Mobile Money");
    
    if (isDriver && associatedDriver) {
      setFormChauffeurId(associatedDriver.id);
      setFormVehiculeId(associatedDriver.vehiculeId || "");
    } else {
      setFormChauffeurId("");
      setFormVehiculeId("");
    }
    
    setIsModalOpen(true);
  };

  const selectedVehicle = vehicles.find(v => v.id === formVehiculeId);
  const expectedRate = selectedVehicle ? selectedVehicle.montantJournalier : 0;
  const computedEcart = expectedRate && formMontantVerse !== "" ? Math.max(0, expectedRate - Number(formMontantVerse)) : 0;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVehiculeId || !formChauffeurId || formMontantVerse === "") {
      alert("Veuillez renseigner le véhicule, le chauffeur et le montant versé.");
      return;
    }

    onAddPayment({
      date: formDate,
      vehiculeId: formVehiculeId,
      chauffeurId: formChauffeurId,
      montantVerse: Number(formMontantVerse),
      moyenPaiement: formPayMethod,
      provenance: isDriver ? "Chauffeur" : "Administration"
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
      alert("Le motif de la décision est obligatoire pour un rejet.");
      return;
    }

    onValidatePayment(decisionTargetId, decisionValue, decisionObservation);
    setDecisionModalOpen(false);
    setDecisionTargetId(null);
    setDecisionObservation("");
  };

  // Stats for cards
  const totalPayments = payments.length;
  const approvedCount = payments.filter(p => p.statut === "Validé").length;
  const pendingCount = payments.filter(p => p.statut === "En attente").length;

  const filteredPayments = payments.filter(p => {
    if (isDriver && associatedDriver) {
      if (p.chauffeurId !== associatedDriver.id) return false;
    }

    const driverMatch = p.nomChauffeur.toLowerCase().includes(searchChauffeur.toLowerCase()) || 
                        p.matricule.toLowerCase().includes(searchChauffeur.toLowerCase());

    const statusMatch = filterStatut === "all" || p.statut === filterStatut;
    const methodMatch = filterPayMethod === "all" || p.moyenPaiement === filterPayMethod;

    return driverMatch && statusMatch && methodMatch;
  });

  const visibleApproved = filteredPayments.filter(p => p.statut === "Validé");
  const visiblePending = filteredPayments.filter(p => p.statut === "En attente");

  const totalCollectedAmount = visibleApproved.reduce((sum, p) => sum + p.montantVerse, 0);
  const totalPendingAmount = visiblePending.reduce((sum, p) => sum + p.montantVerse, 0);
  const totalLateOutstanding = filteredPayments.filter(p => p.statut === "Validé").reduce((sum, p) => sum + p.ecart, 0);

  const exportPDF5Days = () => {
    const last5Dates = Array.from(new Set(filteredPayments.map(p => p.date)))
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
    doc.text("RAPPORT MENSUEL DES VERSEMENTS - LES 5 DERNIERS JOURS", 14, 15);
    
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
      const dayPayments = filteredPayments.filter(p => p.date === date);
      const totalExpected = dayPayments.reduce((sum, p) => sum + (Number(p.montantAttendu) || 0), 0);
      const totalPaid = dayPayments.reduce((sum, p) => sum + (Number(p.montantVerse) || 0), 0);
      const totalEcart = dayPayments.reduce((sum, p) => sum + (Number(p.ecart) || 0), 0);
      const count = dayPayments.length;
      const rate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

      const formatPDFValue = (val: number) => {
        return `${val.toLocaleString("fr-FR").replace(/[\u202f\u00a0\s]/g, " ")} FCFA`;
      };

      return [
        date,
        `${count} versement(s)`,
        formatPDFValue(totalExpected),
        formatPDFValue(totalPaid),
        formatPDFValue(totalEcart),
        `${rate}%`
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Date d\'activité', 'Transactions', 'Montant Attendu', 'Montant Versé', 'Écart', 'Taux']],
      body: summaryRows,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42] },
      styles: { fontSize: 9, font: 'Helvetica' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center' }
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
    doc.text("2. Détails des Transactions sur la Période", 14, finalY);

    const detailedPayments = filteredPayments.filter(p => last5Dates.includes(p.date))
      .sort((a, b) => b.date.localeCompare(a.date));

    const formatPDFDetailed = (val: number) => {
      return `${val.toLocaleString("fr-FR").replace(/[\u202f\u00a0\s]/g, " ")} FCFA`;
    };

    const detailedRows = detailedPayments.map(p => [
      p.date,
      p.matricule,
      p.nomChauffeur,
      formatPDFDetailed(p.montantAttendu),
      formatPDFDetailed(p.montantVerse),
      formatPDFDetailed(p.ecart),
      p.statut
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Date', 'Véhicule', 'Chauffeur', 'Attendu', 'Versé', 'Écart', 'Statut']],
      body: detailedRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      styles: { fontSize: 8, font: 'Helvetica' },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center' }
      }
    });

    doc.save(`Rapport_Versements_5Jours_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 1 && (!formVehiculeId || !formChauffeurId)) {
        alert("Veuillez sélectionner un véhicule et un chauffeur");
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
            <Wallet className="h-7 w-7 text-amber-500" />
            <span>Gestion des Versements</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Suivez et validez les encaissements de la flotte</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Total versements</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalPayments}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Versements validés</p>
            <h3 className="text-2xl font-bold text-emerald-600">{approvedCount}</h3>
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
            <h3 className="text-2xl font-bold text-amber-600">{pendingCount}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Arriérés cumulés</p>
            <h3 className="text-2xl font-bold text-rose-600">{formatFCFA(totalLateOutstanding)}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par chauffeur ou immatriculation..."
              value={searchChauffeur}
              onChange={(e) => setSearchChauffeur(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all duration-200"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-slate-600 min-w-[160px]"
            >
              <option value="all">Tous les statuts</option>
              <option value="Validé">Validés</option>
              <option value="En attente">En attente</option>
              <option value="Refusé">Refusés</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4 text-slate-400" />
            <select
              value={filterPayMethod}
              onChange={(e) => setFilterPayMethod(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-slate-600 min-w-[160px]"
            >
              <option value="all">Tous les moyens</option>
              <option value="MTN Mobile Money">MTN Mobile Money</option>
              <option value="Orange Money">Orange Money</option>
              <option value="Espèces (Cash)">Espèces</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF5Days}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg"
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
                <span>Nouveau Versement</span>
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
              <FileText className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-slate-800">Journal des Versements</h3>
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
                <th className="px-5 py-3 text-left">Chauffeur</th>
                <th className="px-5 py-3 text-right">Montant Attendu</th>
                <th className="px-5 py-3 text-right">Montant Versé</th>
                <th className="px-5 py-3 text-right">Écart</th>
                <th className="px-5 py-3 text-left">Moyen</th>
                <th className="px-5 py-3 text-right">Statut / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => {
                const hasEcart = p.ecart > 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-slate-800">{p.date}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                        {p.matricule}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-700">{p.nomChauffeur}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-slate-500">
                      {formatFCFA(p.montantAttendu)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm font-bold text-emerald-600">
                      {formatFCFA(p.montantVerse)}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono text-sm ${hasEcart ? 'font-bold text-amber-600' : 'text-slate-400'}`}>
                      {hasEcart ? `-${formatFCFA(p.ecart)}` : "✓"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-600">{p.moyenPaiement}</span>
                      <p className="text-[10px] text-slate-400">{p.provenance}</p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedPaymentForDetail(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 transition-colors"
                          title="Détails"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-600" />
                        </button>

                        {p.statut === "En attente" && isManager && (
                          <button
                            onClick={() => {
                              setDecisionTargetId(p.id);
                              setDecisionValue("APPROVE");
                              setDecisionObservation("");
                              setDecisionModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-semibold transition-colors"
                          >
                            Valider
                          </button>
                        )}

                        {p.statut !== "En attente" && (
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            p.statut === "Validé" ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {p.statut}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="text-slate-400">
                      <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Aucun versement trouvé</p>
                      <p className="text-xs mt-1">Aucune transaction ne correspond à vos critères</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL ULTRA PREMIUM : NOUVEAU VERSEMENT AVEC ÉTAPES */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-down relative">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />
            
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-6 pt-6 pb-4 border-b border-slate-100 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-lg">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Nouveau Versement</h2>
                    <p className="text-xs text-slate-500">Enregistrer un encaissement</p>
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
                          {step === 1 ? 'Transaction' : 'Confirmation'}
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
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-700">Informations de la transaction</h3>
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
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Chauffeur *</label>
                          <select
                            required
                            value={formChauffeurId}
                            onChange={(e) => {
                              setFormChauffeurId(e.target.value);
                              const targetChauff = chauffeurs.find(c => c.id === e.target.value);
                              if (targetChauff?.vehiculeId) {
                                setFormVehiculeId(targetChauff.vehiculeId);
                              } else {
                                setFormVehiculeId("");
                              }
                            }}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          >
                            <option value="">-- Sélectionner --</option>
                            {chauffeurs.filter(c => c.isActive).map(c => (
                              <option key={c.id} value={c.id}>
                                {c.prenom} {c.nom} - {c.telephone}
                              </option>
                            ))}
                          </select>
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
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Moyen de paiement *</label>
                          <select
                            required
                            value={formPayMethod}
                            onChange={(e) => setFormPayMethod(e.target.value as any)}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          >
                            <option value="MTN Mobile Money">📱 MTN Mobile Money</option>
                            <option value="Orange Money">📱 Orange Money</option>
                            <option value="Espèces (Cash)">💰 Espèces</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl">
                      <div className="flex items-center space-x-2 mb-4">
                        <Award className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-700">Montant du versement</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {expectedRate > 0 && (
                          <div className="bg-white p-3 rounded-lg text-center">
                            <p className="text-xs text-slate-500">Montant attendu</p>
                            <p className="text-xl font-bold text-slate-800">{formatFCFA(expectedRate)}</p>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Montant versé *</label>
                          <input
                            type="number"
                            required
                            placeholder="0"
                            value={formMontantVerse}
                            onChange={(e) => setFormMontantVerse(e.target.value !== "" ? Number(e.target.value) : "")}
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-emerald-600 text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          />
                        </div>

                        {computedEcart > 0 && (
                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-amber-800">Écart détecté</p>
                                <p className="text-sm font-bold text-amber-700">{formatFCFA(computedEcart)} de moins que l'attendu</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-slate-500 mt-0.5" />
                        <p className="text-xs text-slate-600">
                          En validant, vous confirmez avoir reçu ce montant. Le versement sera soumis à validation.
                        </p>
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
                        className="px-8 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
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
      {/* MODAL: DETAILS VERSEMENT - SANS ID */}
      {/* ========================================================== */}
      {selectedPaymentForDetail && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-down">
            
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />
              
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 p-2 rounded-xl">
                      <Wallet className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Détail du versement</h2>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPaymentForDetail(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase">Date</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPaymentForDetail.date}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase">Statut</p>
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    selectedPaymentForDetail.statut === "Validé" ? 'bg-emerald-100 text-emerald-700' :
                    selectedPaymentForDetail.statut === "Refusé" ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedPaymentForDetail.statut}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Véhicule</span>
                  <span className="font-bold text-slate-800">{selectedPaymentForDetail.matricule}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Chauffeur</span>
                  <span className="font-bold text-slate-800">{selectedPaymentForDetail.nomChauffeur}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Montant attendu</span>
                  <span className="font-mono text-slate-600">{formatFCFA(selectedPaymentForDetail.montantAttendu)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                  <span className="text-sm font-bold text-emerald-800">Montant versé</span>
                  <span className="font-mono font-bold text-emerald-600 text-lg">{formatFCFA(selectedPaymentForDetail.montantVerse)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Moyen de paiement</span>
                  <span className="text-sm text-slate-700">{selectedPaymentForDetail.moyenPaiement}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">Provenance</span>
                  <span className="text-sm text-slate-700">{selectedPaymentForDetail.provenance}</span>
                </div>
              </div>

              {selectedPaymentForDetail.statut === "Refusé" && selectedPaymentForDetail.motifRefus && (
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <p className="text-[10px] font-bold text-rose-800 uppercase">Motif du rejet</p>
                  <p className="text-sm text-rose-700 mt-1">{selectedPaymentForDetail.motifRefus}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
              <button
                onClick={() => setSelectedPaymentForDetail(null)}
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
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />
              
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 p-2 rounded-xl">
                    <RefreshCw className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Validation du versement</h2>
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
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
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