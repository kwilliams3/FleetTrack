import React, { useState } from "react";
import { Charge, Vehicle, Chauffeur, User } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Plus, Check, X, ShieldAlert, AlertTriangle, Calendar, Filter, 
  Wrench, Fuel, Image, AlertCircle, FileText
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
  
  // Local UI Filter States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchVeh, setSearchVeh] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");

  // Rejection states
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [motifRefus, setMotifRefus] = useState("");

  // Charge Form State
  const [formVehiculeId, setFormVehiculeId] = useState("");
  const [formTypeCharge, setFormTypeCharge] = useState<Charge['typeCharge']>("Carburant");
  const [formDescription, setFormDescription] = useState("");
  const [formMontant, setFormMontant] = useState<number | "">("");
  const [formJustificatif, setFormJustificatif] = useState("recu_frais_scanne.jpg");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  // Format currency helpers
  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  const handleOpenDeclare = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormMontant("");
    setFormDescription("");
    setFormTypeCharge("Carburant");
    setFormJustificatif("Ticket_recu_" + Math.floor(1000 + Math.random() * 9000) + ".jpg");

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
      justificatif: formJustificatif
    });

    setIsModalOpen(false);
  };

  const handleRejectSubmit = (id: string) => {
    if (!motifRefus.trim()) {
      alert("Spécifiez une explication pour le refus.");
      return;
    }
    onValidateCharge(id, 'REJECT', motifRefus);
    setRejectingId(null);
    setMotifRefus("");
  };

  // Filter computation
  const filteredExpenses = expenses.filter(e => {
    // If Chauffeur role, only see personal submitted expenses
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
    // 1. Get last 5 dates of data
    const last5Dates = Array.from(new Set(filteredExpenses.map(e => e.date)))
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
    doc.text("RAPPORT MENSUEL DES DÉPENSES - LES 5 DERNIERS JOURS", 14, 15);
    
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
      const dayExpenses = filteredExpenses.filter(e => e.date === date);
      const totalAmount = dayExpenses.reduce((sum, e) => sum + e.montant, 0);
      const totalApproved = dayExpenses.filter(e => e.statut === "Validé").reduce((sum, e) => sum + e.montant, 0);
      const totalPending = dayExpenses.filter(e => e.statut === "En attente").reduce((sum, e) => sum + e.montant, 0);
      const count = dayExpenses.length;

      return [
        date,
        `${count} dépense(s)`,
        `${totalApproved.toLocaleString("fr-FR")} FCFA`,
        `${totalPending.toLocaleString("fr-FR")} FCFA`,
        `${totalAmount.toLocaleString("fr-FR")} FCFA`
      ];
    });

    // Draw Summary table
    autoTable(doc, {
      startY: 50,
      head: [['Date d\'activité', 'Opérations', 'Total Validé', 'Total En Attente', 'Total Cumulé']],
      body: summaryRows,
      theme: 'striped',
      headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255] }, // Rose primary header
      styles: { fontSize: 9, font: 'Helvetica' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
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
    doc.text("2. Détails des Dépenses sur la Période", 14, finalY);

    const detailedExpenses = filteredExpenses.filter(e => last5Dates.includes(e.date))
      .sort((a, b) => b.date.localeCompare(a.date));

    const detailedRows = detailedExpenses.map(e => [
      e.date,
      e.matricule,
      e.typeCharge,
      e.description.length > 35 ? `${e.description.substring(0, 35)}...` : e.description,
      e.nomChauffeur,
      `${e.montant.toLocaleString("fr-FR")} FCFA`,
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

    // Save report
    doc.save(`Rapport_Depenses_5Jours_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Quick summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="bg-rose-50 text-rose-600 p-2.5 rounded-lg">
            <Fuel className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none font-sans">Total Frais Validés Remboursés</p>
            <h3 className="text-lg font-bold font-mono text-slate-900 mt-1">{formatFCFA(totalValidatedCosts)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="bg-amber-50 text-amber-500 p-2.5 rounded-lg">
            <AlertCircle className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none font-sans">Frais opérationnels en attente de validation</p>
            <h3 className="text-lg font-bold font-mono text-amber-600 mt-1">{formatFCFA(totalPendingCosts)}</h3>
          </div>
        </div>

      </div>

      {/* Control filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="flex flex-wrap flex-1 gap-2 items-center">
          
          <input
            type="text"
            placeholder="Rechercher véhicule, description..."
            value={searchVeh}
            onChange={(e) => setSearchVeh(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none w-full sm:max-w-xs font-sans"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer font-sans"
          >
            <option value="all">Toutes les catégories de Charge</option>
            <option value="Panne mécanique">Pannes mécaniques</option>
            <option value="Réparation">Réparations au garage</option>
            <option value="Entretien">Entretien régulier</option>
            <option value="Carburant">Achat de Carburant</option>
            <option value="Pneus">Changement de Pneus</option>
            <option value="Vidange">Vidange moteur</option>
            <option value="Pièces de rechange">Pièces détachées</option>
            <option value="Autre">Autres débours</option>
          </select>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer font-sans"
          >
            <option value="all">Tous les Statuts</option>
            <option value="Validé">Validé</option>
            <option value="En attente">En attente admin</option>
            <option value="Refusé">Refusé</option>
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
              <span>Déclarer une Dépense</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-sans font-bold text-xs text-slate-800">
            Registre des dépenses et validations de la flotte
          </h3>
          <span className="text-[10px] text-slate-400 font-mono italic">Devise : FCFA</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-5">Date / ID</th>
                <th className="py-3 px-3">Véhicule</th>
                <th className="py-3 px-3">Type & Description</th>
                <th className="py-3 px-3">Auteur déclaration</th>
                <th className="py-3 px-3 text-right">Montant</th>
                <th className="py-3 px-3">Pièce jointe</th>
                <th className="py-3 px-5 text-right">Actions / Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {filteredExpenses.map((e) => {
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    
                    {/* Date / ID */}
                    <td className="py-3.5 px-5 space-y-0.5">
                      <span className="font-mono text-[9px] text-slate-400 block">{e.id}</span>
                      <span className="font-mono block">{e.date}</span>
                    </td>

                    {/* Vehicle */}
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[10px]">
                        {e.matricule}
                      </span>
                    </td>

                    {/* Type & Description */}
                    <td className="py-3.5 px-3 space-y-0.5 max-w-xs">
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-semibold rounded text-[10px] font-sans inline-block">
                        {e.typeCharge}
                      </span>
                      <p className="text-slate-700 font-medium truncate leading-tight" title={e.description}>
                        {e.description}
                      </p>
                    </td>

                    {/* Author chauffeur */}
                    <td className="py-3.5 px-3 font-medium text-slate-600">
                      {e.nomChauffeur}
                    </td>

                    {/* Cost amount */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-rose-600">
                      {formatFCFA(e.montant)}
                    </td>

                    {/* Digital copy receipt link */}
                    <td className="py-3.5 px-3 text-slate-500">
                      <span className="inline-flex items-center text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500 leading-none">
                        <Image className="h-3 w-3 mr-1 text-slate-400" />
                        {e.justificatif || "justificatif.jpg"}
                      </span>
                    </td>

                    {/* Administration approval workflow */}
                    <td className="py-3.5 px-5 text-right">
                      
                      {e.statut === "En attente" && isManager ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          {rejectingId === e.id ? (
                            <div className="flex items-center space-x-1.5 animate-fade-in w-full max-w-[200px]">
                              <input
                                  type="text"
                                  placeholder="Justification refus..."
                                  value={motifRefus}
                                  onChange={(e) => setMotifRefus(e.target.value)}
                                  className="border border-rose-300 rounded px-1.5 py-1 text-[10px] w-full focus:outline-none"
                              />
                              <button
                                onClick={() => handleRejectSubmit(e.id)}
                                className="bg-rose-500 text-white rounded p-1 hover:bg-rose-600"
                                title="Valider Refus"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setRejectingId(null)}
                                className="bg-slate-100 text-slate-400 rounded p-1 hover:bg-slate-200"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => onValidateCharge(e.id, 'APPROVE')}
                                className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-0.5"
                                id={`btn-appr-ch-${e.id}`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Valider</span>
                              </button>
                              <button
                                onClick={() => setRejectingId(e.id)}
                                className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-0.5"
                                id={`btn-rej-ch-${e.id}`}
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Rejeter</span>
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            e.statut === "Validé" ? "bg-emerald-50 text-emerald-700 font-bold" :
                            e.statut === "Refusé" ? "bg-rose-50 text-rose-700 font-bold" : "bg-amber-50 text-amber-700"
                          }`}>
                            {e.statut}
                          </span>
                          {e.statut === "Refusé" && e.motifRefus && (
                            <span className="text-[10px] text-rose-500 italic block leading-none opacity-80" title={e.motifRefus}>
                              Explication: "{e.motifRefus.substring(0, 24)}..."
                            </span>
                          )}
                        </div>
                      )}

                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Aucune charge ou note de panne enregistrée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL: SUBMIT NEW EXPENSE (CHARGE DECLARATION)             */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                {isDriver ? "Déclarer une dépense d'exploitation" : "Saisir une Note de Dépense Flotte"}
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
                <label className="text-xs text-slate-600 font-medium">Date de l'opération</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none w-full text-xs font-mono text-slate-700"
                />
              </div>

              {isDriver && associatedDriver ? (
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Véhicule de service d'affectation</label>
                  <p className="bg-slate-50 border border-slate-105 px-3 py-2 rounded-lg text-xs font-mono text-slate-800">
                    {associatedDriver.vehiculeId ? vehicles.find(v => v.id === associatedDriver.vehiculeId)?.immatriculation : "Aucun"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Sélectionner Véhicule *</label>
                  <select
                    required
                    value={formVehiculeId}
                    onChange={(e) => setFormVehiculeId(e.target.value)}
                    className="border border-slate-350 rounded-lg px-3 py-2 text-xs w-full font-sans text-slate-850"
                  >
                    <option value="">-- Choisir véhicule --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} - {v.marque} {v.modele}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Type de charge opérationnelle *</label>
                <select
                  required
                  value={formTypeCharge}
                  onChange={(e) => setFormTypeCharge(e.target.value as any)}
                  className="border border-slate-305 rounded-lg px-3 py-2 text-xs w-full font-sans text-slate-850"
                >
                  <option value="Carburant">Achat de Carburant (Gasoil/Super)</option>
                  <option value="Panne mécanique">Déclaration de Panne Mécanique</option>
                  <option value="Réparation">Réparation de secours (Garage)</option>
                  <option value="Entretien">Entretien programmatique (Essuie-glace, phares...)</option>
                  <option value="Pneus">Achat / Montage de Pneus</option>
                  <option value="Vidange">Vidange moteur complète & filtres</option>
                  <option value="Pièces de rechange">Pièces de rechange neuves/occasion</option>
                  <option value="Autre">Autres débours imprévus</option>
                </select>
              </div>

              {formTypeCharge === "Panne mécanique" && (
                <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-start space-x-1.5 text-[11px] text-rose-800 font-sans">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Débrayage d'urgence :</span>
                    <p className="mt-0.5">Déclarer cette panier mécanique mettra automatiquement le statut général de ce véhicule en "En panne" dans la flotte de gestion.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Description détaillée de la dépense *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Achat de 20 litres Gasoil à la station Total pour trajets interurbains Douala - Yaoundé..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-indigo-700 font-bold font-sans">Montant Payé (FCFA) *</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 25000"
                  value={formMontant}
                  onChange={(e) => setFormMontant(e.target.value !== "" ? Number(e.target.value) : "")}
                  className="border border-slate-300 rounded-lg px-3 py-2 font-mono text-[14px] font-bold text-slate-900 focus:outline-none w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Justificatif numérique (ex: Facture scan, Photo ticket)</label>
                <input
                  type="text"
                  placeholder="Justificatif d'opération"
                  value={formJustificatif}
                  onChange={(e) => setFormJustificatif(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none w-full text-xs font-mono"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-amber-500 text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-slate-800"
                >
                  Valider et Soumettre
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
