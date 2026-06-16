import React, { useState } from "react";
import { Vehicle, Chauffeur, AffectationHistory, User } from "../types";
import { 
  Plus, Edit2, Trash2, Calendar, ShieldCheck, FileText, AlertTriangle, 
  HelpCircle, UserCheck, X, Check, ArrowRightLeft, Shield, Clock, Eye,
  Search, Filter, Truck, Fuel, Gauge, CalendarDays, Award, Wrench,
  ChevronRight, ChevronLeft, CheckCircle, Info, Upload, Save, Car
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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedVehForAssign, setSelectedVehForAssign] = useState<Vehicle | null>(null);
  const [assignChauffeurId, setAssignChauffeurId] = useState("");
  const [assignRemark, setAssignRemark] = useState("");

  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterEtat, setFilterEtat] = useState("all");

  const [formImmatriculation, setFormImmatriculation] = useState("");
  const [formMarque, setFormMarque] = useState("");
  const [formModele, setFormModele] = useState("");
  const [formAnnee, setFormAnnee] = useState<number | "">("");
  const [formCouleur, setFormCouleur] = useState("");
  const [formChassis, setFormChassis] = useState("");
  const [formEtat, setFormEtat] = useState<'excellent' | 'bon' | 'moyen' | 'en_panne' | 'en_reparation'>("bon");
  const [formDateAcquisition, setFormDateAcquisition] = useState("");
  const [formMontantJournalier, setFormMontantJournalier] = useState(10000);

  const [formDocCarteNumero, setFormDocCarteNumero] = useState("");
  const [formDocCarteExp, setFormDocCarteExp] = useState("");
  
  const [formDocAssuranceNumero, setFormDocAssuranceNumero] = useState("");
  const [formDocAssuranceExp, setFormDocAssuranceExp] = useState("");

  const [formDocVisiteNumero, setFormDocVisiteNumero] = useState("");
  const [formDocVisiteExp, setFormDocVisiteExp] = useState("");

  const [formDocLicenceNumero, setFormDocLicenceNumero] = useState("");
  const [formDocLicenceExp, setFormDocLicenceExp] = useState("");
  const [hasLicence, setHasLicence] = useState(false);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setCurrentStep(1);
    setFormImmatriculation("");
    setFormMarque("");
    setFormModele("");
    setFormAnnee("");
    setFormCouleur("");
    setFormChassis("");
    setFormEtat("bon");
    setFormDateAcquisition("");
    setFormMontantJournalier(10000);
    
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

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setCurrentStep(1);
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

  const handleOpenAssign = (v: Vehicle) => {
    setSelectedVehForAssign(v);
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

  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  const filteredVehicles = vehicles.filter(v => {
    const textMatch = 
      v.immatriculation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.marque.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.modele.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = filterEtat === "all" || v.etat === filterEtat;

    return textMatch && statusMatch;
  });

  const getEtatColor = (etat: string) => {
    switch(etat) {
      case 'excellent': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'bon': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'moyen': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'en_panne': return 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse';
      case 'en_reparation': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getEtatLabel = (etat: string) => {
    switch(etat) {
      case 'excellent': return 'Excellent';
      case 'bon': return 'Bon';
      case 'moyen': return 'Moyen';
      case 'en_panne': return 'En Panne';
      case 'en_reparation': return 'En Réparation';
      default: return etat;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const validateStep1 = () => {
    if (!formImmatriculation || !formMarque || !formModele || !formMontantJournalier) {
      alert("Veuillez remplir tous les champs obligatoires");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formDocCarteNumero || !formDocCarteExp || !formDocAssuranceNumero || !formDocAssuranceExp || !formDocVisiteNumero || !formDocVisiteExp) {
      alert("Veuillez remplir tous les documents obligatoires");
      return false;
    }
    if (hasLicence && (!formDocLicenceNumero || !formDocLicenceExp)) {
      alert("Veuillez remplir les informations de la Licence de Transport");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) nextStep();
    else if (currentStep === 2 && validateStep2()) nextStep();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
            <Truck className="h-7 w-7 text-amber-500" />
            <span>Gestion des Véhicules</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gérez votre flotte, suivez les documents et affectez les chauffeurs</p>
        </div>
        
        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="group bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Nouveau Véhicule</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Total véhicules</p>
            <h3 className="text-2xl font-bold text-slate-800">{vehicles.length}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Chauffeurs affectés</p>
            <h3 className="text-2xl font-bold text-emerald-600">{assignments.filter(a => a.statut === "En cours").length}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Véhicules en panne</p>
            <h3 className="text-2xl font-bold text-amber-600">{vehicles.filter(v => v.etat === "en_panne").length}</h3>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Docs expirés</p>
            <h3 className="text-2xl font-bold text-rose-600">
              {vehicles.filter(v => 
                v.documents.carteGrise.statut === "expire" || 
                v.documents.assurance.statut === "expire" || 
                v.documents.visiteTechnique.statut === "expire"
              ).length}
            </h3>
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
              placeholder="Rechercher par immatriculation, marque ou modèle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all duration-200"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterEtat}
              onChange={(e) => setFilterEtat(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-slate-600 min-w-[160px]"
            >
              <option value="all">Tous les états</option>
              <option value="excellent">Excellent</option>
              <option value="bon">Bon</option>
              <option value="moyen">Moyen</option>
              <option value="en_panne">En panne</option>
              <option value="en_reparation">En réparation</option>
            </select>
          </div>
          
          <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
            {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((v, index) => {
          const currentAssignment = assignments.find(a => a.vehiculeId === v.id && a.statut === "En cours");
          const assignedDriver = currentAssignment ? chauffeurs.find(c => c.id === currentAssignment.chauffeurId) : null;

          const docsArr = [v.documents.carteGrise, v.documents.assurance, v.documents.visiteTechnique, v.documents.licenceTransport].filter(Boolean);
          const hasExpiredDoc = docsArr.some(d => d?.statut === "expire");
          const hasExpiringDoc = docsArr.some(d => d?.statut === "expirant");

          return (
            <div 
              key={v.id} 
              className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-5 pb-3 border-b border-slate-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-1.5 rounded-lg">
                        <Truck className="h-4 w-4 text-amber-500" />
                      </div>
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                        {v.immatriculation}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{v.marque} {v.modele}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {v.couleur || "Couleur non définie"} {v.annee ? `• ${v.annee}` : ""}
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide border ${getEtatColor(v.etat)}`}>
                    {getEtatLabel(v.etat)}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documents Administratifs</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-600">Carte Grise</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        v.documents.carteGrise.statut === 'expire' ? 'bg-rose-500 text-white' :
                        v.documents.carteGrise.statut === 'expirant' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {v.documents.carteGrise.statut === 'expire' ? 'EXPIRÉ' : v.documents.carteGrise.statut === 'expirant' ? 'BIENTÔT' : 'VALIDE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-600">Assurance</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        v.documents.assurance.statut === 'expire' ? 'bg-rose-500 text-white' :
                        v.documents.assurance.statut === 'expirant' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {v.documents.assurance.statut === 'expire' ? 'EXPIRÉ' : v.documents.assurance.statut === 'expirant' ? 'BIENTÔT' : 'VALIDE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-600">Visite Tech.</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        v.documents.visiteTechnique.statut === 'expire' ? 'bg-rose-500 text-white' :
                        v.documents.visiteTechnique.statut === 'expirant' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {v.documents.visiteTechnique.statut === 'expire' ? 'EXPIRÉ' : v.documents.visiteTechnique.statut === 'expirant' ? 'BIENTÔT' : 'VALIDE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-600">Licence Trans.</span>
                      {v.documents.licenceTransport ? (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          v.documents.licenceTransport.statut === 'expire' ? 'bg-rose-500 text-white' :
                          v.documents.licenceTransport.statut === 'expirant' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          {v.documents.licenceTransport.statut === 'expire' ? 'EXPIRÉ' : v.documents.licenceTransport.statut === 'expirant' ? 'BIENTÔT' : 'VALIDE'}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400">N/A</span>
                      )}
                    </div>
                  </div>

                  {hasExpiredDoc && (
                    <div className="mt-2 bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center space-x-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      <span className="text-[10px] text-rose-700 font-medium">Document(s) expiré(s) !</span>
                    </div>
                  )}
                  {!hasExpiredDoc && hasExpiringDoc && (
                    <div className="mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center space-x-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-[10px] text-amber-700 font-medium">Expiration imminente !</span>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-slate-50 to-white p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Chauffeur Affecté</p>
                  {assignedDriver ? (
                    <div className="flex items-center space-x-3">
                      {assignedDriver.photo ? (
                        <img 
                          src={assignedDriver.photo} 
                          alt="photo" 
                          className="h-10 w-10 rounded-full object-cover border-2 border-amber-400"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {assignedDriver.prenom?.[0]}{assignedDriver.nom?.[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-sm text-slate-800 block">{assignedDriver.prenom} {assignedDriver.nom}</span>
                        <span className="text-[10px] text-slate-500">{assignedDriver.telephone}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">Aucun chauffeur rattaché</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-slate-500">Versement journalier</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{formatFCFA(v.montantJournalier)}</span>
                </div>

                <div className="pt-2">
                  {isManager ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleOpenAssign(v)}
                        className="flex items-center justify-center space-x-1.5 px-2 py-2 bg-slate-100 hover:bg-amber-100 rounded-lg transition-all duration-200 group"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-[11px] font-semibold text-slate-700">Affecter</span>
                      </button>
                      <button
                        onClick={() => setSelectedVehicleForDetail(v)}
                        className="flex items-center justify-center space-x-1.5 px-2 py-2 bg-slate-100 hover:bg-indigo-100 rounded-lg transition-all duration-200"
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="text-[11px] font-semibold text-slate-700">Détails</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="flex items-center justify-center space-x-1.5 px-2 py-2 bg-slate-100 hover:bg-blue-100 rounded-lg transition-all duration-200"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-[11px] font-semibold text-slate-700">Modifier</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Confirmez-vous la suppression du véhicule ${v.immatriculation} ?`)) {
                            onDeleteVehicle(v.id);
                          }
                        }}
                        className="col-span-3 flex items-center justify-center space-x-1.5 px-2 py-2 bg-slate-100 hover:bg-rose-100 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        <span className="text-[11px] font-semibold text-slate-700">Supprimer</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedVehicleForDetail(v)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-300"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Voir les détails</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700">Aucun véhicule trouvé</p>
            <p className="text-sm text-slate-500 mt-1">Aucun véhicule ne correspond à vos critères de recherche.</p>
            {isManager && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-semibold text-sm hover:bg-amber-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter un véhicule</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL: NOUVEAU VÉHICULE AVEC ÉTAPES */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-down relative">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />
            
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-8 pt-6 pb-4 border-b border-slate-100 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-2xl shadow-lg">
                    {editingVehicle ? <Edit2 className="h-6 w-6 text-white" /> : <Truck className="h-6 w-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {editingVehicle ? `Modifier : ${editingVehicle.immatriculation}` : "Nouveau Véhicule"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {editingVehicle ? "Modifiez les informations du véhicule" : "Ajoutez un nouveau véhicule à la flotte"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between max-w-md mx-auto">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          currentStep >= step ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {currentStep > step ? <Check className="h-5 w-5" /> : step}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${currentStep >= step ? 'text-amber-600' : 'text-slate-400'}`}>
                          {step === 1 ? 'Informations' : step === 2 ? 'Documents' : 'Confirmation'}
                        </span>
                      </div>
                      {step < 3 && (
                        <div className={`absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 transition-all duration-300 ${
                          currentStep > step ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-slate-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSubmit}>
              <div className="p-8">
                {/* Step 1: Vehicle Information */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="bg-blue-500 p-1.5 rounded-lg"><Info className="h-4 w-4 text-white" /></div>
                        <h3 className="text-lg font-bold text-slate-700">Informations générales</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div><label className="text-sm font-semibold text-slate-700">Immatriculation *</label>
                          <input type="text" required placeholder="LT-452-XY" value={formImmatriculation} onChange={(e) => setFormImmatriculation(e.target.value.toUpperCase())} className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all font-mono uppercase" />
                        </div>
                        <div><label className="text-sm font-semibold text-slate-700">Marque *</label>
                          <input type="text" required placeholder="Toyota" value={formMarque} onChange={(e) => setFormMarque(e.target.value)} className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all" />
                        </div>
                        <div><label className="text-sm font-semibold text-slate-700">Modèle *</label>
                          <input type="text" required placeholder="Carina E" value={formModele} onChange={(e) => setFormModele(e.target.value)} className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all" />
                        </div>
                        <div><label className="text-sm font-semibold text-slate-700">Année</label>
                          <input type="number" placeholder="2015" value={formAnnee} onChange={(e) => setFormAnnee(e.target.value ? Number(e.target.value) : "")} className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all" />
                        </div>
                        <div><label className="text-sm font-semibold text-slate-700">Couleur</label>
                          <div className="flex items-center space-x-2 mt-1.5">
                            <input type="color" value="#000000" onChange={(e) => setFormCouleur(e.target.value)} className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer" />
                            <input type="text" placeholder="Jaune" value={formCouleur} onChange={(e) => setFormCouleur(e.target.value)} className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all" />
                          </div>
                        </div>
                        <div><label className="text-sm font-semibold text-slate-700">État général</label>
                          <select value={formEtat} onChange={(e) => setFormEtat(e.target.value as any)} className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all">
                            <option value="excellent">✨ Excellent</option><option value="bon">👍 Bon</option><option value="moyen">⚠️ Moyen</option>
                            <option value="en_panne">🔧 En panne</option><option value="en_reparation">🛠️ En réparation</option>
                          </select>
                        </div>
                        <div><label className="text-sm font-semibold text-slate-700">Versement journalier (FCFA) *</label>
                          <input type="number" required value={formMontantJournalier} onChange={(e) => setFormMontantJournalier(Number(e.target.value))} className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald-600 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all" />
                        </div>
                        <div><label className="text-sm font-semibold text-slate-700">Date d'acquisition</label>
                          <input type="date" value={formDateAcquisition} onChange={(e) => setFormDateAcquisition(e.target.value)} className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all" />
                        </div>
                        <div><label className="text-sm font-semibold text-slate-700">Numéro châssis</label>
                          <input type="text" placeholder="VF1..." value={formChassis} onChange={(e) => setFormChassis(e.target.value.toUpperCase())} className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Documents */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="bg-emerald-500 p-1.5 rounded-lg"><FileText className="h-4 w-4 text-white" /></div>
                        <h3 className="text-lg font-bold text-slate-700">Documents administratifs</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white p-4 rounded-xl border-2 border-emerald-200">
                          <div className="flex items-center space-x-2 mb-3"><div className="bg-emerald-100 p-2 rounded-lg"><FileText className="h-4 w-4 text-emerald-600" /></div><label className="font-bold text-emerald-700">Carte Grise</label><span className="text-rose-500 text-xs">*</span></div>
                          <div className="space-y-3">
                            <input type="text" required placeholder="Numéro" value={formDocCarteNumero} onChange={(e) => setFormDocCarteNumero(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                            <input type="date" required value={formDocCarteExp} onChange={(e) => setFormDocCarteExp(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border-2 border-emerald-200">
                          <div className="flex items-center space-x-2 mb-3"><div className="bg-emerald-100 p-2 rounded-lg"><Shield className="h-4 w-4 text-emerald-600" /></div><label className="font-bold text-emerald-700">Assurance</label><span className="text-rose-500 text-xs">*</span></div>
                          <div className="space-y-3">
                            <input type="text" required placeholder="Numéro" value={formDocAssuranceNumero} onChange={(e) => setFormDocAssuranceNumero(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                            <input type="date" required value={formDocAssuranceExp} onChange={(e) => setFormDocAssuranceExp(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border-2 border-emerald-200">
                          <div className="flex items-center space-x-2 mb-3"><div className="bg-emerald-100 p-2 rounded-lg"><Check className="h-4 w-4 text-emerald-600" /></div><label className="font-bold text-emerald-700">Visite Technique</label><span className="text-rose-500 text-xs">*</span></div>
                          <div className="space-y-3">
                            <input type="text" required placeholder="Numéro" value={formDocVisiteNumero} onChange={(e) => setFormDocVisiteNumero(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                            <input type="date" required value={formDocVisiteExp} onChange={(e) => setFormDocVisiteExp(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border-2 border-emerald-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2"><div className="bg-emerald-100 p-2 rounded-lg"><Award className="h-4 w-4 text-emerald-600" /></div><label className="font-bold text-emerald-700">Licence Transport</label></div>
                            <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={hasLicence} onChange={(e) => setHasLicence(e.target.checked)} className="w-4 h-4 rounded border-emerald-300 text-emerald-600" /><span className="text-xs text-slate-600">Activer</span></label>
                          </div>
                          {hasLicence && (
                            <div className="space-y-3">
                              <input type="text" placeholder="Numéro" value={formDocLicenceNumero} onChange={(e) => setFormDocLicenceNumero(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                              <input type="date" value={formDocLicenceExp} onChange={(e) => setFormDocLicenceExp(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                            </div>
                          )}
                          {!hasLicence && <p className="text-sm text-slate-400 italic mt-2">Non requis pour ce véhicule</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-4"><div className="bg-amber-500 p-1.5 rounded-lg"><CheckCircle className="h-4 w-4 text-white" /></div><h3 className="text-lg font-bold text-slate-700">Vérification finale</h3></div>
                      <div className="bg-white rounded-xl p-5 space-y-4">
                        <h4 className="font-bold text-slate-800 border-b pb-2">Récapitulatif du véhicule</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-slate-500">Immatriculation:</div><div className="font-semibold text-slate-800 font-mono">{formImmatriculation || "—"}</div>
                          <div className="text-slate-500">Marque / Modèle:</div><div className="font-semibold text-slate-800">{formMarque} {formModele}</div>
                          <div className="text-slate-500">Année / Couleur:</div><div className="font-semibold text-slate-800">{formAnnee || "—"} / {formCouleur || "—"}</div>
                          <div className="text-slate-500">État:</div><div className="font-semibold text-slate-800">{getEtatLabel(formEtat)}</div>
                          <div className="text-slate-500">Versement journalier:</div><div className="font-bold text-emerald-600">{formatFCFA(formMontantJournalier)}</div>
                          <div className="text-slate-500">Documents:</div><div className="text-emerald-600">{formDocCarteNumero && formDocAssuranceNumero && formDocVisiteNumero ? <span className="flex items-center space-x-1"><Check className="h-3 w-3" /> Complets</span> : "Incomplets"}</div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <div className="flex items-start space-x-2"><Info className="h-4 w-4 text-amber-600 mt-0.5" /><p className="text-xs text-amber-800">Vérifiez attentivement toutes les informations avant de valider l'enregistrement.</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-8 py-4 border-t border-slate-100 rounded-b-3xl">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button>
                  <div className="flex items-center space-x-3">
                    {currentStep > 1 && (<button type="button" onClick={prevStep} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center space-x-1"><ChevronLeft className="h-4 w-4" /><span>Précédent</span></button>)}
                    {currentStep < totalSteps ? (<button type="button" onClick={handleNextStep} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md hover:shadow-lg transition-all flex items-center space-x-2"><span>Continuer</span><ChevronRight className="h-4 w-4" /></button>) : (<button type="submit" className="px-8 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center space-x-2"><Save className="h-4 w-4" /><span>{editingVehicle ? "Mettre à jour" : "Enregistrer"}</span></button>)}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assign Vehicle */}
      {isAssignModalOpen && selectedVehForAssign && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-down">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3"><div className="bg-amber-100 p-2 rounded-xl"><ArrowRightLeft className="h-5 w-5 text-amber-600" /></div><div><h2 className="text-lg font-bold text-slate-800">Affecter un chauffeur</h2><p className="text-xs text-slate-500">{selectedVehForAssign.immatriculation}</p></div></div>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
              </div>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
              <div><label className="text-xs font-semibold text-slate-700 block mb-1">Véhicule</label><div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><p className="text-sm font-semibold text-slate-800">{selectedVehForAssign.marque} {selectedVehForAssign.modele}</p><p className="text-xs text-slate-500 font-mono">{selectedVehForAssign.immatriculation}</p></div></div>
              <div><label className="text-xs font-semibold text-slate-700 block mb-1">Chauffeur *</label><select required value={assignChauffeurId} onChange={(e) => setAssignChauffeurId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"><option value="">-- Sélectionner un chauffeur --</option>{chauffeurs.map((c) => (<option key={c.id} value={c.id}>{c.prenom} {c.nom} - {c.telephone} {c.vehiculeId ? '(Occupé)' : '(Disponible)'}</option>))}</select></div>
              <div><label className="text-xs font-semibold text-slate-700 block mb-1">Notes et consignes</label><textarea placeholder="Ex: Prise de service quotidienne à 7h..." value={assignRemark} onChange={(e) => setAssignRemark(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all resize-none" /></div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100"><button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button><button type="submit" className="px-5 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md hover:shadow-lg transition-all">Valider l'affectation</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: DÉTAILS DU VÉHICULE - SANS ID */}
      {/* ========================================================== */}
      {selectedVehicleForDetail && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-slide-down">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 rounded-xl shadow-lg"><Car className="h-5 w-5 text-white" /></div><h2 className="text-xl font-bold text-slate-800">Fiche Technique du Véhicule</h2></div>
                  <button onClick={() => setSelectedVehicleForDetail(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl text-white"><div><p className="text-xs text-slate-400">Immatriculation</p><p className="text-2xl font-bold font-mono">{selectedVehicleForDetail.immatriculation}</p></div><div className="text-right"><p className="text-xs text-slate-400">Versement journalier</p><p className="text-xl font-bold text-emerald-400">{formatFCFA(selectedVehicleForDetail.montantJournalier)}</p></div></div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl"><div className="flex items-center space-x-2 mb-3"><Truck className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-bold text-slate-700">Caractéristiques techniques</h3></div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-blue-100"><span className="text-slate-500">Marque / Modèle:</span><span className="font-semibold text-slate-800">{selectedVehicleForDetail.marque} {selectedVehicleForDetail.modele}</span></div>
                  <div className="flex justify-between py-2 border-b border-blue-100"><span className="text-slate-500">Année:</span><span className="font-semibold text-slate-800">{selectedVehicleForDetail.annee || "—"}</span></div>
                  <div className="flex justify-between py-2 border-b border-blue-100"><span className="text-slate-500">Couleur:</span><span className="font-semibold text-slate-800">{selectedVehicleForDetail.couleur || "—"}</span></div>
                  <div className="flex justify-between py-2 border-b border-blue-100"><span className="text-slate-500">État général:</span><span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${getEtatColor(selectedVehicleForDetail.etat)}`}>{getEtatLabel(selectedVehicleForDetail.etat)}</span></div>
                  <div className="flex justify-between py-2 border-b border-blue-100"><span className="text-slate-500">Numéro châssis:</span><span className="font-mono text-xs text-slate-800">{selectedVehicleForDetail.chassis || "—"}</span></div>
                  <div className="flex justify-between py-2 border-b border-blue-100"><span className="text-slate-500">Date acquisition:</span><span className="font-semibold text-slate-800">{selectedVehicleForDetail.dateAcquisition || "—"}</span></div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-2xl"><div className="flex items-center space-x-2 mb-3"><FileText className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold text-slate-700">Documents administratifs</h3></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg"><span className="text-sm text-slate-600">Carte Grise</span><div className="text-right"><p className="text-xs font-mono text-slate-500">{selectedVehicleForDetail.documents.carteGrise.numero}</p><p className="text-[10px] text-slate-400">Expire le {selectedVehicleForDetail.documents.carteGrise.dateExpiration}</p></div></div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg"><span className="text-sm text-slate-600">Assurance</span><div className="text-right"><p className="text-xs font-mono text-slate-500">{selectedVehicleForDetail.documents.assurance.numero}</p><p className="text-[10px] text-slate-400">Expire le {selectedVehicleForDetail.documents.assurance.dateExpiration}</p></div></div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg"><span className="text-sm text-slate-600">Visite Technique</span><div className="text-right"><p className="text-xs font-mono text-slate-500">{selectedVehicleForDetail.documents.visiteTechnique.numero}</p><p className="text-[10px] text-slate-400">Expire le {selectedVehicleForDetail.documents.visiteTechnique.dateExpiration}</p></div></div>
                  {selectedVehicleForDetail.documents.licenceTransport && (<div className="flex items-center justify-between p-2 bg-white rounded-lg"><span className="text-sm text-slate-600">Licence Transport</span><div className="text-right"><p className="text-xs font-mono text-slate-500">{selectedVehicleForDetail.documents.licenceTransport.numero}</p><p className="text-[10px] text-slate-400">Expire le {selectedVehicleForDetail.documents.licenceTransport.dateExpiration}</p></div></div>)}
                </div>
              </div>

              {(() => { const currentAssignment = assignments.find(a => a.vehiculeId === selectedVehicleForDetail.id && a.statut === "En cours"); const assignedDriver = currentAssignment ? chauffeurs.find(c => c.id === currentAssignment.chauffeurId) : null; return assignedDriver ? (<div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl"><div className="flex items-center space-x-2 mb-3"><UserCheck className="h-4 w-4 text-amber-600" /><h3 className="text-sm font-bold text-slate-700">Chauffeur assigné</h3></div><div className="flex items-center space-x-4">{assignedDriver.photo ? (<img src={assignedDriver.photo} alt="Chauffeur" className="h-14 w-14 rounded-full object-cover border-2 border-amber-400" referrerPolicy="no-referrer" />) : (<div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center"><span className="text-white font-bold text-lg">{assignedDriver.prenom?.[0]}{assignedDriver.nom?.[0]}</span></div>)}<div><p className="font-bold text-slate-800">{assignedDriver.prenom} {assignedDriver.nom}</p><p className="text-xs text-slate-500">{assignedDriver.telephone}</p><p className="text-[10px] text-slate-400 font-mono">Permis: {assignedDriver.numPermis}</p></div></div></div>) : (<div className="bg-slate-100 p-4 rounded-xl text-center"><AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" /><p className="text-sm text-slate-500">Aucun chauffeur actuellement assigné à ce véhicule</p></div>); })()}
            </div>
            <div className="sticky bottom-0 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl"><button onClick={() => setSelectedVehicleForDetail(null)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl transition-all">Fermer</button></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out; }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-fade-in { animation: fade-in-up 0.3s ease-out; }
      `}</style>

    </div>
  );
}