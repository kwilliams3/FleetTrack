import React, { useState } from "react";
import { Vehicle, Chauffeur, AffectationHistory, User } from "../types";
import { 
  Plus, Edit2, Trash2, Calendar, ShieldCheck, FileText, AlertTriangle, 
  HelpCircle, UserCheck, X, Check, ArrowRightLeft, Shield, Clock, Eye 
} from "lucide-react";

interface VehiclesViewProps {
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  assignments: AffectationHistory[];
  currentUser: User;
  onSaveVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onAssignChauffeur: (vehId: string, chauffeurId: string, remark: string) => void;
}

export default function VehiclesView({
  vehicles,
  chauffeurs,
  assignments,
  currentUser,
  onSaveVehicle,
  onDeleteVehicle,
  onAssignChauffeur
}: VehiclesViewProps) {
  const isManager = currentUser.role === "MANAGER";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  // Assignment modal settings
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedVehForAssign, setSelectedVehForAssign] = useState<Vehicle | null>(null);
  const [assignChauffeurId, setAssignChauffeurId] = useState("");
  const [assignRemark, setAssignRemark] = useState("");

  // Vehicle detailed view state
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEtat, setFilterEtat] = useState("all");

  // Local Form state for Add/Edit
  const [formImmatriculation, setFormImmatriculation] = useState("");
  const [formMarque, setFormMarque] = useState("");
  const [formModele, setFormModele] = useState("");
  const [formAnnee, setFormAnnee] = useState<number | "">("");
  const [formCouleur, setFormCouleur] = useState("");
  const [formChassis, setFormChassis] = useState("");
  const [formEtat, setFormEtat] = useState<'excellent' | 'bon' | 'moyen' | 'en_panne' | 'en_reparation'>("bon");
  const [formDateAcquisition, setFormDateAcquisition] = useState("");
  const [formMontantJournalier, setFormMontantJournalier] = useState(10000);

  // Documents Local Forms
  const [formDocCarteNumero, setFormDocCarteNumero] = useState("");
  const [formDocCarteExp, setFormDocCarteExp] = useState("");
  
  const [formDocAssuranceNumero, setFormDocAssuranceNumero] = useState("");
  const [formDocAssuranceExp, setFormDocAssuranceExp] = useState("");

  const [formDocVisiteNumero, setFormDocVisiteNumero] = useState("");
  const [formDocVisiteExp, setFormDocVisiteExp] = useState("");

  const [formDocLicenceNumero, setFormDocLicenceNumero] = useState("");
  const [formDocLicenceExp, setFormDocLicenceExp] = useState("");
  const [hasLicence, setHasLicence] = useState(false);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormImmatriculation("");
    setFormMarque("");
    setFormModele("");
    setFormAnnee("");
    setFormCouleur("");
    setFormChassis("");
    setFormEtat("bon");
    setFormDateAcquisition("");
    setFormMontantJournalier(10000);
    
    // Default document expirations 1 year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split("T")[0];

    setFormDocCarteNumero("CG-" + Math.floor(100000 + Math.random() * 900000));
    setFormDocCarteExp(nextYearStr);

    setFormDocAssuranceNumero("ASS-" + Math.floor(100000 + Math.random() * 900000));
    setFormDocAssuranceExp(nextYearStr);

    setFormDocVisiteNumero("VT-" + Math.floor(100000 + Math.random() * 900000));
    setFormDocVisiteExp(nextYearStr);

    setFormDocLicenceNumero("");
    setFormDocLicenceExp("");
    setHasLicence(false);

    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormImmatriculation(v.immatriculation);
    setFormMarque(v.marque);
    setFormModele(v.modele);
    setFormAnnee(v.annee || "");
    setFormCouleur(v.couleur || "");
    setFormChassis(v.chassis || "");
    setFormEtat(v.etat);
    setFormDateAcquisition(v.dateAcquisition || "");
    setFormMontantJournalier(v.montantJournalier);

    setFormDocCarteNumero(v.documents.carteGrise.numero);
    setFormDocCarteExp(v.documents.carteGrise.dateExpiration);

    setFormDocAssuranceNumero(v.documents.assurance.numero);
    setFormDocAssuranceExp(v.documents.assurance.dateExpiration);

    setFormDocVisiteNumero(v.documents.visiteTechnique.numero);
    setFormDocVisiteExp(v.documents.visiteTechnique.dateExpiration);

    if (v.documents.licenceTransport) {
      setFormDocLicenceNumero(v.documents.licenceTransport.numero);
      setFormDocLicenceExp(v.documents.licenceTransport.dateExpiration);
      setHasLicence(true);
    } else {
      setFormDocLicenceNumero("");
      setFormDocLicenceExp("");
      setHasLicence(false);
    }

    setIsModalOpen(true);
  };

  // Save changes
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImmatriculation || !formMarque || !formModele) {
      alert("Veuillez remplir l'immatriculation, la marque et le modèle.");
      return;
    }

    const payload: Vehicle = {
      id: editingVehicle?.id || "v-" + Math.random().toString(36).substring(2, 9),
      immatriculation: formImmatriculation,
      marque: formMarque,
      modele: formModele,
      annee: formAnnee ? Number(formAnnee) : undefined,
      couleur: formCouleur || undefined,
      chassis: formChassis || undefined,
      etat: formEtat,
      dateAcquisition: formDateAcquisition || undefined,
      montantJournalier: Number(formMontantJournalier),
      documents: {
        carteGrise: {
          numero: formDocCarteNumero || "CG-DEFAULT",
          dateExpiration: formDocCarteExp || "2027-01-01",
          nomFichier: editingVehicle?.documents?.carteGrise?.nomFichier || "carte_grise_upload.pdf",
          statut: "valide"
        },
        assurance: {
          numero: formDocAssuranceNumero || "ASS-DEFAULT",
          dateExpiration: formDocAssuranceExp || "2027-01-01",
          nomFichier: editingVehicle?.documents?.assurance?.nomFichier || "assurance_upload.pdf",
          statut: "valide"
        },
        visiteTechnique: {
          numero: formDocVisiteNumero || "VT-DEFAULT",
          dateExpiration: formDocVisiteExp || "2027-01-01",
          nomFichier: editingVehicle?.documents?.visiteTechnique?.nomFichier || "visite_technique_upload.pdf",
          statut: "valide"
        },
        licenceTransport: hasLicence ? {
          numero: formDocLicenceNumero || "LIC-DEFAULT",
          dateExpiration: formDocLicenceExp || "2027-01-01",
          nomFichier: editingVehicle?.documents?.licenceTransport?.nomFichier || "licence_upload.pdf",
          statut: "valide"
        } : undefined
      }
    };

    onSaveVehicle(payload);
    setIsModalOpen(false);
  };

  // Trigger Assignment
  const handleOpenAssign = (v: Vehicle) => {
    setSelectedVehForAssign(v);
    
    // Pre-select current assigned driver if any
    const activeAssign = assignments.find(a => a.vehiculeId === v.id && a.statut === "En cours");
    setAssignChauffeurId(activeAssign?.chauffeurId || "");
    setAssignRemark("");
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehForAssign) return;
    
    onAssignChauffeur(selectedVehForAssign.id, assignChauffeurId, assignRemark);
    setIsAssignModalOpen(false);
  };



  // Currency Converter helper
  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  // Filters logic
  const filteredVehicles = vehicles.filter(v => {
    const textMatch = 
      v.immatriculation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.marque.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.modele.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = filterEtat === "all" || v.etat === filterEtat;

    return textMatch && statusMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            placeholder="Rechercher immatriculation, marque..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full sm:max-w-xs font-sans"
          />
          <select
            value={filterEtat}
            onChange={(e) => setFilterEtat(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer text-slate-600 font-sans"
          >
            <option value="all">Tous les états</option>
            <option value="excellent">Excellent</option>
            <option value="bon">Bon</option>
            <option value="moyen">Moyen</option>
            <option value="en_panne">En panne</option>
            <option value="en_reparation">En réparation</option>
          </select>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="bg-slate-900 hover:bg-slate-800 text-amber-500 font-sans text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 border border-slate-800"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Véhicule</span>
          </button>
        )}
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((v) => {
          // Get currently assigned chauffeur
          const currentAssignment = assignments.find(a => a.vehiculeId === v.id && a.statut === "En cours");
          const assignedDriver = currentAssignment ? chauffeurs.find(c => c.id === currentAssignment.chauffeurId) : null;

          // Check if any document is expired/expiring soon
          const docsArr = [v.documents.carteGrise, v.documents.assurance, v.documents.visiteTechnique, v.documents.licenceTransport].filter(Boolean);
          const hasExpiredDoc = docsArr.some(d => d?.statut === "expire");
          const hasExpiringDoc = docsArr.some(d => d?.statut === "expirant");

          return (
            <div 
              key={v.id} 
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                v.etat === 'en_panne' ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[11px] bg-slate-950 text-white font-bold px-2 py-0.5 rounded border border-slate-800">
                      {v.immatriculation}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2 font-sans">{v.marque} {v.modele}</h3>
                    <p className="text-xs text-slate-400 font-sans">
                      {v.couleur || "Couleur non définie"} {v.annee ? `• ${v.annee}` : ""}
                    </p>
                  </div>

                  <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider font-mono ${
                    v.etat === 'excellent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    v.etat === 'bon' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                    v.etat === 'moyen' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                  }`}>
                    {v.etat === 'en_panne' ? 'En Panne' : v.etat === 'en_reparation' ? 'Au garage' : v.etat}
                  </span>
                </div>

                <hr className="border-slate-100" />

                {/* Administration document checker status */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                    Suivi Documents Administratifs
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    
                    {/* Carte Grise */}
                    <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">C. Grise</span>
                      <span className={`font-bold font-mono px-1 rounded text-[9px] ${
                        v.documents.carteGrise.statut === 'expire' ? 'text-rose-600 bg-rose-50' :
                        v.documents.carteGrise.statut === 'expirant' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                      }`} title={`Expire le : ${v.documents.carteGrise.dateExpiration}`}>
                        {v.documents.carteGrise.statut === 'expire' ? 'EXP' : 'VAL'}
                      </span>
                    </div>

                    {/* Assurance */}
                    <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">Assurance</span>
                      <span className={`font-bold font-mono px-1 rounded text-[9px] ${
                        v.documents.assurance.statut === 'expire' ? 'text-rose-600 bg-rose-50 animate-pulse' :
                        v.documents.assurance.statut === 'expirant' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                      }`} title={`Expire le : ${v.documents.assurance.dateExpiration}`}>
                        {v.documents.assurance.statut === 'expire' ? 'EXP' : v.documents.assurance.statut === 'expirant' ? 'Bientôt' : 'VAL'}
                      </span>
                    </div>

                    {/* Visite Technique */}
                    <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">V. Tech</span>
                      <span className={`font-bold font-mono px-1 rounded text-[9px] ${
                        v.documents.visiteTechnique.statut === 'expire' ? 'text-rose-600 bg-rose-50 animate-pulse' :
                        v.documents.visiteTechnique.statut === 'expirant' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                      }`} title={`Expire le : ${v.documents.visiteTechnique.dateExpiration}`}>
                        {v.documents.visiteTechnique.statut === 'expire' ? 'EXP' : 'VAL'}
                      </span>
                    </div>

                    {/* Licence de Transport */}
                    <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">Licence T.</span>
                      {v.documents.licenceTransport ? (
                        <span className={`font-bold font-mono px-1 rounded text-[9px] ${
                          v.documents.licenceTransport.statut === 'expire' ? 'text-rose-600 bg-rose-50' :
                          v.documents.licenceTransport.statut === 'expirant' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                        }`} title={`Expire le : ${v.documents.licenceTransport.dateExpiration}`}>
                          {v.documents.licenceTransport.statut === 'expire' ? 'EXP' : 'VAL'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-sans">N/A</span>
                      )}
                    </div>

                  </div>

                  {/* Red flags warnings */}
                  {hasExpiredDoc && (
                    <div className="bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center space-x-1.5 text-[10px] text-rose-800 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span>Document(s) expiré(s) ! Risque d'amende administrative.</span>
                    </div>
                  )}

                  {!hasExpiredDoc && hasExpiringDoc && (
                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center space-x-1.5 text-[10px] text-amber-800 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Alerte : expiration imminente sous 30 jours !</span>
                    </div>
                  )}
                </div>

                {/* Assigned Chauffeur Details */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 space-y-1">
                  <p className="text-[9px] text-slate-400 font-bold font-mono uppercase tracking-wider">Directeur responsable</p>
                  {assignedDriver ? (
                    <div className="flex items-center space-x-2 text-xs font-sans text-slate-800">
                      {assignedDriver.photo ? (
                        <img 
                          src={assignedDriver.photo} 
                          alt="photo" 
                          className="h-6 w-6 rounded-full object-cover border border-amber-400 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-amber-100 border border-amber-400 text-amber-800 font-bold text-[9px] flex items-center justify-center shrink-0 font-sans uppercase">
                          {(assignedDriver.prenom?.[0] || "")}{(assignedDriver.nom?.[0] || "")}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold block">{assignedDriver.prenom} {assignedDriver.nom}</span>
                        <span className="text-[10px] text-slate-400 block -mt-0.5">{assignedDriver.telephone}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-500 font-semibold font-sans">Aucun chauffeur rattaché</p>
                  )}
                </div>
              </div>

              {/* Bottom specs and actions */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs text-slate-400">Versement Attendu</span>
                  <span className="text-sm font-bold text-slate-900">{formatFCFA(v.montantJournalier)} / jour</span>
                </div>

                <div className="pt-1 font-sans">
                  {isManager ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenAssign(v)}
                        className="bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 text-slate-700 text-[10.5px] font-bold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        title="Affecter Chauffeur"
                        id={`btn-asg-veh-${v.id}`}
                      >
                        <ArrowRightLeft className="h-3 w-3 text-amber-500 shrink-0" />
                        <span>Affecter</span>
                      </button>

                      <button
                        onClick={() => setSelectedVehicleForDetail(v)}
                        className="bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 text-slate-700 text-[10.5px] font-bold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                        title="Voir les détails complets"
                        id={`btn-det-veh-${v.id}`}
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>Détails</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 text-slate-700 text-[10.5px] font-bold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        title="Modifier Véhicule"
                        id={`btn-edit-veh-${v.id}`}
                      >
                        <Edit2 className="h-3 w-3 text-blue-500 shrink-0" />
                        <span>Modifier</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Confirmez-vous la suppression définitive du véhicule ${v.immatriculation} ?`)) {
                            onDeleteVehicle(v.id);
                          }
                        }}
                        className="bg-slate-50 border border-slate-200/80 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-[10.5px] font-bold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        title="Supprimer Véhicule"
                        id={`btn-del-veh-${v.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-rose-500 shrink-0" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedVehicleForDetail(v)}
                      className="w-full bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 text-slate-705 text-[10.5px] font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer text-center"
                      id={`btn-det-veh-user-${v.id}`}
                    >
                      <Eye className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>Détails du Véhicule</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-200 p-12 text-center rounded-2xl">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-sans font-medium">Aucun véhicule trouvé.</p>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Essayez de modifier vos termes de recherche ou créez-en un nouveau.</p>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL 1: ADD / EDIT VEHICLE & CORRESPONDING DOCUMENTS      */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 font-sans">
                {editingVehicle ? `Modifier le véhicule : ${editingVehicle.immatriculation}` : "Enregistrer un Nouveau Véhicule"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSubmit} className="p-6 space-y-6">
              
              {/* Section 1: Vehicle Specifications */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">1. Spécifications du véhicule</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Numéro d'immatriculation *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: LT-452-XY"
                      value={formImmatriculation}
                      onChange={(e) => setFormImmatriculation(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Marque constructeur *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Toyota"
                      value={formMarque}
                      onChange={(e) => setFormMarque(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Modèle de véhicule *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carina E"
                      value={formModele}
                      onChange={(e) => setFormModele(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Année de mise en circulation</label>
                    <input
                      type="number"
                      placeholder="Ex: 2015"
                      value={formAnnee}
                      onChange={(e) => setFormAnnee(e.target.value ? Number(e.target.value) : "")}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Couleur dominante</label>
                    <input
                      type="text"
                      placeholder="Ex: Jaune Taxi"
                      value={formCouleur}
                      onChange={(e) => setFormCouleur(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Numéro de châssis</label>
                    <input
                      type="text"
                      placeholder="Châssis ID"
                      value={formChassis}
                      onChange={(e) => setFormChassis(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium font-sans">État de service</label>
                    <select
                      value={formEtat}
                      onChange={(e) => setFormEtat(e.target.value as any)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none text-slate-700 w-full text-xs font-sans"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="bon">Bon</option>
                      <option value="moyen">Moyen</option>
                      <option value="en_panne">En panne mécanique</option>
                      <option value="en_reparation">En réparation au garage</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Date d'Acquisition</label>
                    <input
                      type="date"
                      value={formDateAcquisition}
                      onChange={(e) => setFormDateAcquisition(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs text-slate-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-indigo-700 font-bold font-sans">Versement Journalier Requis (FCFA) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 10000"
                      value={formMontantJournalier}
                      onChange={(e) => setFormMontantJournalier(Number(e.target.value))}
                      className="border border-slate-200 bg-indigo-50/20 rounded-lg px-3 py-1.5 font-mono text-[13px] font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none w-full"
                    />
                  </div>

                </div>
              </div>

              <hr className="border-slate-105" />

              {/* Section 2: Administrateur Documents */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">2. Documents administratifs & Alerte Expiration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Carte Grise Column */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                    <div className="flex items-center space-x-1.5 text-slate-900">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span className="text-xs font-bold">Carte Grise</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Numéro de Carte *</label>
                        <input
                          type="text"
                          required
                          placeholder="CG-XXXX"
                          value={formDocCarteNumero}
                          onChange={(e) => setFormDocCarteNumero(e.target.value)}
                          className="border border-slate-200 bg-white rounded px-2 py-1 text-[11px] font-mono focus:outline-none w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Expiration *</label>
                        <input
                          type="date"
                          required
                          value={formDocCarteExp}
                          onChange={(e) => setFormDocCarteExp(e.target.value)}
                          className="border border-slate-200 bg-white rounded px-2 py-1 text-[11px] font-mono focus:outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Assurance Column */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                    <div className="flex items-center space-x-1.5 text-slate-900">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-bold">Assurance Automobile</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Numéro de Police *</label>
                        <input
                          type="text"
                          required
                          placeholder="ASS-XXXX"
                          value={formDocAssuranceNumero}
                          onChange={(e) => setFormDocAssuranceNumero(e.target.value)}
                          className="border border-slate-200 bg-white rounded px-2 py-1 text-[11px] font-mono focus:outline-none w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-medium text-amber-700">Expiration *</label>
                        <input
                          type="date"
                          required
                          value={formDocAssuranceExp}
                          onChange={(e) => setFormDocAssuranceExp(e.target.value)}
                          className="border border-slate-200 bg-white rounded px-2 py-1 text-[11px] font-mono focus:outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visite Technique Column */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                    <div className="flex items-center space-x-1.5 text-slate-900">
                      <Check className="h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-bold">Visite Technique</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Numéro de Vignette *</label>
                        <input
                          type="text"
                          required
                          placeholder="VT-XXXX"
                          value={formDocVisiteNumero}
                          onChange={(e) => setFormDocVisiteNumero(e.target.value)}
                          className="border border-slate-200 bg-white rounded px-2 py-1 text-[11px] font-mono focus:outline-none w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Expiration *</label>
                        <input
                          type="date"
                          required
                          value={formDocVisiteExp}
                          onChange={(e) => setFormDocVisiteExp(e.target.value)}
                          className="border border-slate-200 bg-white rounded px-2 py-1 text-[11px] font-mono focus:outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Licence de Transport Column */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-slate-900">
                        <FileText className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-bold">Licence de Transport</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="checkbox"
                          id="check-has-licence"
                          checked={hasLicence}
                          onChange={(e) => setHasLicence(e.target.checked)}
                          className="h-3.5 w-3.5 checked:bg-amber-500 cursor-pointer"
                        />
                        <label htmlFor="check-has-licence" className="text-[10px] text-slate-500 font-semibold cursor-pointer select-none">
                          Inscrire
                        </label>
                      </div>
                    </div>
                    
                    {hasLicence ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-semibold">Numéro Licence</label>
                          <input
                            type="text"
                            required={hasLicence}
                            placeholder="LIC-XXXX"
                            value={formDocLicenceNumero}
                            onChange={(e) => setFormDocLicenceNumero(e.target.value)}
                            className="border border-slate-200 bg-white rounded px-2 py-1 text-[11px] font-mono focus:outline-none w-full"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-semibold font-sans">Expiration</label>
                          <input
                            type="date"
                            required={hasLicence}
                            value={formDocLicenceExp}
                            onChange={(e) => setFormDocLicenceExp(e.target.value)}
                            className="border border-slate-200 bg-white rounded px-2 py-1 text-[11px] font-mono focus:outline-none w-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic py-2">Ce véhicule n'est pas assujetti à une licence de transport.</p>
                    )}
                  </div>

                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-amber-500 text-xs font-bold px-5 py-2 rounded-xl transition-all border border-slate-800"
                >
                  {editingVehicle ? "Sauvegarder les modifications" : "Créer le véhicule"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* ========================================================== */}
      {/* MODAL 2: AFFECT / ASSIGN VEHICLE TO CHAUFFEUR              */}
      {/* ========================================================== */}
      {isAssignModalOpen && selectedVehForAssign && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Affecter un chauffeur à : {selectedVehForAssign.immatriculation}
              </h2>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium font-sans">Véhicule concerné</label>
                <p className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800">
                  {selectedVehForAssign.marque} {selectedVehForAssign.modele} ({selectedVehForAssign.immatriculation})
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Chauffeur responsable *</label>
                <select
                  required
                  value={assignChauffeurId}
                  onChange={(e) => setAssignChauffeurId(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none text-xs w-full font-sans text-slate-800"
                >
                  <option value="">-- Choisir un chauffeur disponible --</option>
                  {chauffeurs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.prenom} {c.nom} ({c.telephone}) 
                      {c.vehiculeId ? ` - [Déjà rattaché à d'autres véhicules]` : " - Disponible"}
                    </option>
                  ))}
                  <option value="">Séparer le chauffeur actuel (Désaffecter)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Notes d'affectation / Consignes</label>
                <textarea
                  placeholder="Ex: Prise de service régulière à Douala. Pression de pneus et vérification vidange quotidiennes complétées."
                  value={assignRemark}
                  onChange={(e) => setAssignRemark(e.target.value)}
                  rows={3}
                  className="border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-amber-500 text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-slate-800"
                >
                  Valider l'affectation
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
