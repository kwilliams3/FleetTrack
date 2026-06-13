import React, { useState } from "react";
import { Versement, Vehicle, Chauffeur, User } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Plus, Check, X, Wallet, ShieldAlert, AlertTriangle, Calendar, Filter, 
  Clock, Download, RefreshCw, FileText, Eye
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

  // Rejection state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [motifRefus, setMotifRefus] = useState("");

  // Payment Form State
  const [formVehiculeId, setFormVehiculeId] = useState("");
  const [formChauffeurId, setFormChauffeurId] = useState("");
  const [formMontantVerse, setFormMontantVerse] = useState<number | "">("");
  const [formPayMethod, setFormPayMethod] = useState<'MTN Mobile Money' | 'Orange Money' | 'Espèces (Cash)'>("MTN Mobile Money");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  // Format currency helpers
  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  // Open direct declaration
  const handleOpenDeclare = () => {
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

  // Auto rate calculation when user picks vehicle in modal
  const selectedVehicle = vehicles.find(v => v.id === formVehiculeId);
  const expectedRate = selectedVehicle ? selectedVehicle.montantJournalier : 0;
  const computedEcart = expectedRate && formMontantVerse !== "" ? Math.max(0, expectedRate - Number(formMontantVerse)) : 0;

  // Submit payment declaration
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

  // Reject confirmation
  const handleRejectSubmit = (id: string) => {
    if (!motifRefus.trim()) {
      alert("Spécifiez un motif de refus.");
      return;
    }
    onValidatePayment(id, 'REJECT', motifRefus);
    setRejectingId(null);
    setMotifRefus("");
  };

  // Filter computation
  const filteredPayments = payments.filter(p => {
    // If user is DRIVER, they should ONLY see their personal payments!
    if (isDriver && associatedDriver) {
      if (p.chauffeurId !== associatedDriver.id) return false;
    }

    const driverMatch = p.nomChauffeur.toLowerCase().includes(searchChauffeur.toLowerCase()) || 
                        p.matricule.toLowerCase().includes(searchChauffeur.toLowerCase());

    const statusMatch = filterStatut === "all" || p.statut === filterStatut;
    const methodMatch = filterPayMethod === "all" || p.moyenPaiement === filterPayMethod;

    return driverMatch && statusMatch && methodMatch;
  });

  // Totals calculations based on visibility
  const visibleApproved = filteredPayments.filter(p => p.statut === "Validé");
  const visiblePending = filteredPayments.filter(p => p.statut === "En attente");

  const totalCollectedAmount = visibleApproved.reduce((sum, p) => sum + p.montantVerse, 0);
  const totalPendingAmount = visiblePending.reduce((sum, p) => sum + p.montantVerse, 0);
  const totalLateOutstanding = filteredPayments.filter(p => p.statut === "Validé").reduce((sum, p) => sum + p.ecart, 0);

  const exportPDF5Days = () => {
    // 1. Get last 5 days of data
    const last5Dates = Array.from(new Set(filteredPayments.map(p => p.date)))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 5);

    if (last5Dates.length === 0) {
      alert("Aucune donnée disponible pour l'export.");
      return;
    }

    // 2. Create jsPDF instance
    const doc = new jsPDF();

    // 3. Header styling
    doc.setFillColor(15, 23, 42); // slate-900 background for top header
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

    // Section 1: Daily Summary
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("1. Tableau Récapitulatif par Jour", 14, 45);

    // Build summary rows
    const summaryRows = last5Dates.map(date => {
      const dayPayments = filteredPayments.filter(p => p.date === date);
      const totalExpected = dayPayments.reduce((sum, p) => sum + p.montantAttendu, 0);
      const totalPaid = dayPayments.reduce((sum, p) => sum + p.montantVerse, 0);
      const totalEcart = dayPayments.reduce((sum, p) => sum + p.ecart, 0);
      const count = dayPayments.length;
      const rate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 100;

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

    // Draw Summary table
    autoTable(doc, {
      startY: 50,
      head: [['Date d\'activité', 'Transactions', 'Montant Attendu', 'Montant Versé', 'Écart', 'Taux']],
      body: summaryRows,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42] }, // Amber primary header
      styles: { fontSize: 9, font: 'Helvetica' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center' }
      }
    });

    // Section 2: Detailed logs
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

    // Save report
    doc.save(`Rapport_Versements_5Jours_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Quick stats panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none font-sans">Total Encaissé & Validé</p>
            <h3 className="text-lg font-bold font-mono text-slate-900 mt-1">{formatFCFA(totalCollectedAmount)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none font-sans">Montants en Attente de Validation</p>
            <h3 className="text-lg font-bold font-mono text-amber-600 mt-1">{formatFCFA(totalPendingAmount)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="bg-rose-50 text-rose-600 p-2.5 rounded-lg animate-fade-in">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none font-sans">Arriérés / Soldes Impayés Cumulés</p>
            <h3 className="text-lg font-bold font-mono text-rose-600 mt-1">{formatFCFA(totalLateOutstanding)}</h3>
          </div>
        </div>

      </div>

      {/* Verification queues & Action triggers */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="flex flex-wrap flex-1 gap-2 items-center">
          
          {!isDriver && (
            <input
              type="text"
              placeholder="Rechercher chauffeur, matricule..."
              value={searchChauffeur}
              onChange={(e) => setSearchChauffeur(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none w-full sm:max-w-xs font-sans"
            />
          )}

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer font-sans"
          >
            <option value="all">Tous les Statuts</option>
            <option value="Validé">Validé</option>
            <option value="En attente">En attente de vérification</option>
            <option value="Refusé">Refusé</option>
          </select>

          <select
            value={filterPayMethod}
            onChange={(e) => setFilterPayMethod(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer font-sans"
          >
            <option value="all">Tous les Moyens de règlement</option>
            <option value="MTN Mobile Money">MTN MoMo</option>
            <option value="Orange Money">Orange Money</option>
            <option value="Espèces (Cash)">Espèces (Cash)</option>
          </select>

        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportPDF5Days}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-sans text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            title="Exporter le rapport des 5 derniers jours"
          >
            <FileText className="h-4 w-4 text-rose-500" />
            <span>Exporter PDF (5J)</span>
          </button>

          {isManager && (
            <button
              onClick={handleOpenDeclare}
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-amber-500 font-sans text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Encaisser un Versement</span>
            </button>
          )}
        </div>
      </div>

      {/* Main logs list */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-sans font-bold text-xs text-slate-800">
            Journal des Versements de la Flotte
          </h3>
          <span className="text-[10px] text-slate-400 font-mono italic">Montants en FCFA</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-5">ID / Date</th>
                <th className="py-3 px-3">Véhicule</th>
                {!isDriver && <th className="py-3 px-3">Chauffeur responsable</th>}
                <th className="py-3 px-3 text-right">Montant Attendu</th>
                <th className="py-3 px-3 text-right">Montant Versé</th>
                <th className="py-3 px-3 text-right">Reste / Écart</th>
                <th className="py-3 px-3">Moyen & Provenance</th>
                <th className="py-3 px-5 text-right">Actions / Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {filteredPayments.map((p) => {
                const hasEcart = p.ecart > 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    
                    {/* ID / Date */}
                    <td className="py-3.5 px-5 space-y-0.5">
                      <span className="font-mono text-[9px] font-bold text-slate-400 block">{p.id}</span>
                      <span className="font-mono text-xs block">{p.date}</span>
                    </td>

                    {/* Vehicle */}
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded text-[10px]">
                        {p.matricule}
                      </span>
                    </td>

                    {/* Chauffeur (Admin view only) */}
                    {!isDriver && (
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {p.nomChauffeur}
                      </td>
                    )}

                    {/* Expected */}
                    <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                      {formatFCFA(p.montantAttendu)}
                    </td>

                    {/* Paid */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">
                      {formatFCFA(p.montantVerse)}
                    </td>

                    {/* Ecart/Outstanding */}
                    <td className={`py-3.5 px-3 text-right font-mono ${hasEcart ? 'font-bold text-orange-600' : 'text-slate-400'}`}>
                      {hasEcart ? `-${formatFCFA(p.ecart)}` : "En règle"}
                    </td>

                    {/* Mode & Provenance */}
                    <td className="py-3.5 px-3 space-y-0.5">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded block w-fit font-mono">
                        {p.moyenPaiement}
                      </span>
                      <span className="text-[9px] text-slate-400 font-sans block">
                        Par: {p.provenance}
                      </span>
                    </td>

                    {/* Status / Administration action blocks */}
                    <td className="py-3.5 px-5 text-right font-sans">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedPaymentForDetail(p)}
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-205 text-slate-700 hover:text-slate-950 font-sans text-[10px] font-bold py-1 px-2.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Voir le détail complet"
                          id={`btn-det-pym-${p.id}`}
                        >
                          <Eye className="h-3 w-3 text-indigo-500" />
                          <span>Détails</span>
                        </button>

                        {/* If status is "Pending" and current user is MANAGER, show verification queue */}
                        {p.statut === "En attente" && isManager ? (
                          <div className="flex items-center justify-end space-x-1.5 font-sans">
                            {rejectingId === p.id ? (
                              <div className="flex items-center space-x-1.5 animate-fade-in w-full max-w-[200px]">
                                <input
                                  type="text"
                                  placeholder="Motif de refus..."
                                  value={motifRefus}
                                  onChange={(e) => setMotifRefus(e.target.value)}
                                  className="border border-rose-300 rounded px-1.5 py-1 text-[10px] font-sans w-full focus:outline-none bg-white text-slate-900"
                                />
                                <button
                                  onClick={() => handleRejectSubmit(p.id)}
                                  className="bg-rose-500 text-white rounded p-1 hover:bg-rose-600 cursor-pointer"
                                  title="Valider Refus"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setRejectingId(null)}
                                  className="bg-slate-100 text-slate-400 rounded p-1 hover:bg-slate-200 cursor-pointer"
                                  title="Annuler"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => onValidatePayment(p.id, 'APPROVE')}
                                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer"
                                  id={`btn-approve-${p.id}`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approuver</span>
                                </button>
                                <button
                                  onClick={() => setRejectingId(p.id)}
                                  className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer"
                                  id={`btn-reject-${p.id}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Refuser</span>
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              p.statut === "Validé" ? "bg-emerald-50 text-emerald-700" :
                              p.statut === "Refusé" ? "bg-rose-50 text-rose-700 font-bold" : "bg-amber-50 text-amber-700"
                            }`}>
                              {p.statut}
                            </span>
                            {p.statut === "Refusé" && p.motifRefus && (
                              <span className="text-[10px] text-rose-500 italic block leading-none opacity-80" title={p.motifRefus}>
                                Refusé: "{p.motifRefus.substring(0, 24)}..."
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={isDriver ? 7 : 8} className="py-8 text-center text-slate-400 italic">
                    Aucun versement enregistré correspond aux filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL: REGISTER PAYMENT (VERSEMENT DECLARATION)            */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                {isDriver ? "Déclarer un Versement Journalier" : "Enregistrer un Encaissage Administratif"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium font-sans">Date de Versement</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none w-full text-xs font-mono text-slate-700"
                />
              </div>

              {isDriver && associatedDriver ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium font-sans">Véhicule Assigné d'exploitation</label>
                    <p className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-xs font-mono text-slate-800">
                      {selectedVehicle?.immatriculation || "N/A"} - {selectedVehicle?.marque} {selectedVehicle?.modele}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Chauffeur responsable *</label>
                    <select
                      required
                      value={formChauffeurId}
                      onChange={(e) => {
                        setFormChauffeurId(e.target.value);
                        // Auto populate vehicle ID associated with this chauffeur
                        const targetChauff = chauffeurs.find(c => c.id === e.target.value);
                        if (targetChauff?.vehiculeId) {
                          setFormVehiculeId(targetChauff.vehiculeId);
                        } else {
                          setFormVehiculeId("");
                        }
                      }}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs w-full font-sans text-slate-800"
                    >
                      <option value="">-- Choisir le chauffeur --</option>
                      {chauffeurs.filter(c => c.isActive).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.prenom} {c.nom} ({c.telephone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Véhicule concerné *</label>
                    <select
                      required
                      value={formVehiculeId}
                      onChange={(e) => setFormVehiculeId(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs w-full font-sans text-slate-800"
                    >
                      <option value="">-- Choisir l'immatriculation --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.immatriculation} - {v.marque} {v.modele} ({formatFCFA(v.montantJournalier)}/jour)
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {expectedRate > 0 && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Versement Journalier Attendu :</span>
                    <span className="font-bold text-slate-900">{formatFCFA(expectedRate)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-indigo-700 font-bold font-sans">Montant Réellement Versé (CFA) *</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 10000"
                  value={formMontantVerse}
                  onChange={(e) => setFormMontantVerse(e.target.value !== "" ? Number(e.target.value) : "")}
                  className="border border-slate-300 rounded-lg px-3 py-2 font-mono text-[14px] font-bold text-slate-900 focus:outline-none w-full"
                />
              </div>

              {computedEcart > 0 && (
                <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-start space-x-1.5 text-[11px] text-rose-800">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Alerte d'écart de caisse (Arriérés négatifs) :</span>
                    <p className="font-mono mt-0.5">Le montant déclaré présente un manque de <strong className="font-bold">{formatFCFA(computedEcart)}</strong> par rapport aux {formatFCFA(expectedRate)} attendus.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Canal / Moyen de Paiement *</label>
                <select
                  required
                  value={formPayMethod}
                  onChange={(e) => setFormPayMethod(e.target.value as any)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-xs w-full font-sans text-slate-800"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money (MoMo)</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Espèces (Cash)">Espèces (Cash) / Cash direct</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-amber-500 text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-slate-800"
                >
                  Déclarer et Transmettre
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: COMPREHENSIVE TRANSACTION ROW DETAILS              */}
      {/* ========================================================== */}
      {selectedPaymentForDetail && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-scale-up text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-indigo-500" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Fiche Détail du Versement
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Transaction ID : {selectedPaymentForDetail.id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPaymentForDetail(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full cursor-pointer"
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Date d'enregistrement</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedPaymentForDetail.date}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Statut de validation</span>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      selectedPaymentForDetail.statut === "Validé" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      selectedPaymentForDetail.statut === "Refusé" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {selectedPaymentForDetail.statut}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                <div className="p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Véhicule (Matricule)</span>
                  <span className="font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[10px]">
                    {selectedPaymentForDetail.matricule}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Chauffeur Declarant</span>
                  <span className="font-bold text-slate-800">{selectedPaymentForDetail.nomChauffeur}</span>
                </div>
                <div className="p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Montant Attendu</span>
                  <span className="font-mono text-slate-600">{formatFCFA(selectedPaymentForDetail.montantAttendu)}</span>
                </div>
                <div className="p-3 flex justify-between items-center text-xs bg-emerald-50/10">
                  <span className="text-slate-500 font-bold">Montant Réellement Versé</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">{formatFCFA(selectedPaymentForDetail.montantVerse)}</span>
                </div>
                <div className="p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Écart de caisse / Arriéré</span>
                  <span className={`font-mono font-bold ${selectedPaymentForDetail.ecart > 0 ? "text-rose-600" : "text-slate-400"}`}>
                    {selectedPaymentForDetail.ecart > 0 ? `-${formatFCFA(selectedPaymentForDetail.ecart)}` : "En règle"}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Canal de règlement</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                    {selectedPaymentForDetail.moyenPaiement}
                  </span>
                </div>
                <div className="p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Provenance déclaration</span>
                  <span className="font-medium text-slate-700">{selectedPaymentForDetail.provenance}</span>
                </div>
              </div>

              {selectedPaymentForDetail.statut === "Refusé" && selectedPaymentForDetail.motifRefus && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                  <span className="text-[10px] text-rose-800 font-bold uppercase block">Motif de Rejet administratif :</span>
                  <p className="text-xs text-rose-700 italic mt-0.5">"{selectedPaymentForDetail.motifRefus}"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPaymentForDetail(null)}
                className="bg-slate-900 hover:bg-slate-800 text-amber-500 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors border border-slate-800"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
