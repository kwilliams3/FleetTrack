import React, { useState } from "react";
import { Chauffeur, Vehicle, User } from "../types";
import { 
  Plus, Edit2, Trash2, Phone, MapPin, Award, ShieldAlert, CheckCircle2, XCircle, 
  Car, Eye, HelpCircle, X, Camera, Search, Filter, ChevronLeft, ChevronRight,
  Calendar, IdCard, UserCheck, Clock, AlertTriangle, Save, Check, Info
} from "lucide-react";

interface ChauffeursViewProps {
  chauffeurs: Chauffeur[];
  vehicles: Vehicle[];
  currentUser: User;
  onSaveChauffeur: (c: Chauffeur) => void;
  onDeleteChauffeur: (id: string) => void;
}

export default function ChauffeursView({
  chauffeurs,
  vehicles,
  currentUser,
  onSaveChauffeur,
  onDeleteChauffeur
}: ChauffeursViewProps) {
  const isManager = currentUser.role === "MANAGER";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChauffeur, setEditingChauffeur] = useState<Chauffeur | null>(null);
  const [selectedChauffeurForDetail, setSelectedChauffeurForDetail] = useState<Chauffeur | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  const [formNom, setFormNom] = useState("");
  const [formPrenom, setFormPrenom] = useState("");
  const [formTelephone, setFormTelephone] = useState("");
  const [formAdresse, setFormAdresse] = useState("");
  const [formNumPermis, setFormNumPermis] = useState("");
  const [formExpPermis, setFormExpPermis] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formVehiculeId, setFormVehiculeId] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La taille de l'image ne doit pas dépasser 5 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAdd = () => {
    setEditingChauffeur(null);
    setCurrentStep(1);
    setFormNom("");
    setFormPrenom("");
    setFormTelephone("");
    setFormAdresse("");
    setFormNumPermis("");
    
    const fiveYears = new Date();
    fiveYears.setFullYear(fiveYears.getFullYear() + 5);
    setFormExpPermis(fiveYears.toISOString().split("T")[0]);

    setFormPhoto("");
    setFormIsActive(true);
    setFormVehiculeId("");

    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Chauffeur) => {
    setEditingChauffeur(c);
    setCurrentStep(1);
    setFormNom(c.nom);
    setFormPrenom(c.prenom);
    setFormTelephone(c.telephone);
    setFormAdresse(c.adresse);
    setFormNumPermis(c.numPermis);
    setFormExpPermis(c.expPermis);
    setFormPhoto(c.photo);
    setFormIsActive(c.isActive);
    setFormVehiculeId(c.vehiculeId || "");

    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom || !formPrenom || !formTelephone || !formNumPermis) {
      alert("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    const payload: Chauffeur = {
      id: editingChauffeur?.id || "ch-" + Math.random().toString(36).substring(2, 9),
      nom: formNom,
      prenom: formPrenom,
      telephone: formTelephone,
      adresse: formAdresse,
      numPermis: formNumPermis,
      expPermis: formExpPermis,
      photo: formPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      isActive: formIsActive,
      vehiculeId: formVehiculeId || undefined
    };

    onSaveChauffeur(payload);
    setIsModalOpen(false);
  };

  const checkPermisExpired = (expDateStr: string) => {
    const expDate = new Date(expDateStr);
    const now = new Date("2026-06-12");
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: "expired" as const, text: "LICENCE EXPIRÉE" };
    if (diffDays <= 30) return { status: "warning" as const, text: `Expire dans ${diffDays} jours` };
    return { status: "valid" as const, text: "Licence Valide" };
  };

  const filteredChauffeurs = chauffeurs.filter(c => {
    const nameMatch = 
      c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.telephone.toLowerCase().includes(searchQuery.toLowerCase());

    const activeMatch = 
      filterActive === "all" ||
      (filterActive === "active" && c.isActive) ||
      (filterActive === "inactive" && !c.isActive);

    return nameMatch && activeMatch;
  });

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const validateStep1 = () => {
    if (!formNom || !formPrenom || !formTelephone) {
      alert("Veuillez remplir tous les champs obligatoires : Nom, Prénom et Téléphone");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formNumPermis || !formExpPermis) {
      alert("Veuillez remplir les informations du permis de conduire");
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
            <UserCheck className="h-7 w-7 text-amber-500" />
            <span>Gestion des Chauffeurs</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gérez votre équipe de chauffeurs, suivez les permis et affectez les véhicules</p>
        </div>
        
        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="group bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Nouveau Chauffeur</span>
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all duration-200"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-slate-600 min-w-[160px]"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
          
          <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
            {filteredChauffeurs.length} chauffeur{filteredChauffeurs.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Grid of drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChauffeurs.map((c, index) => {
          const checkLic = checkPermisExpired(c.expPermis);
          const currentVehicle = c.vehiculeId ? vehicles.find(v => v.id === c.vehiculeId) : null;

          return (
            <div 
              key={c.id} 
              className="group bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-5 pb-3 border-b border-slate-100">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img 
                      src={c.photo} 
                      alt={`${c.prenom} ${c.nom}`} 
                      className="h-16 w-16 rounded-full object-cover border-3 border-amber-400 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${c.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">{c.prenom} {c.nom}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.isActive 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.isActive ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {c.isActive ? 'ACTIF' : 'INACTIF'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {c.id.slice(-6)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-amber-500" />
                    <span>{c.telephone}</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-amber-500 mt-0.5" />
                    <span>{c.adresse || "Adresse non renseignée"}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800">Permis de conduire</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-bold text-slate-700">{c.numPermis}</span>
                    <span className="text-xs text-slate-500">Expire le {c.expPermis}</span>
                  </div>
                  {checkLic.status === 'expired' && (
                    <div className="mt-2 bg-rose-500 text-white p-1.5 rounded-lg flex items-center space-x-1.5 text-[10px] font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>PERMIS EXPIRÉ !</span>
                    </div>
                  )}
                  {checkLic.status === 'warning' && (
                    <div className="mt-2 bg-amber-500 text-white p-1.5 rounded-lg flex items-center space-x-1.5 text-[10px] font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{checkLic.text}</span>
                    </div>
                  )}
                </div>

                {currentVehicle ? (
                  <div className="bg-slate-800 text-white p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-amber-400" />
                      <div>
                        <p className="text-sm font-bold">{currentVehicle.marque} {currentVehicle.modele}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{currentVehicle.immatriculation}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                      Assigné
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-dashed border-slate-300 p-3 rounded-xl text-center">
                    <span className="text-xs text-amber-600 font-medium">Aucun véhicule assigné</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 gap-2">
                  <button
                    onClick={() => setSelectedChauffeurForDetail(c)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all duration-200"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Détails</span>
                  </button>

                  {isManager && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">Modifier</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Voulez-vous vraiment supprimer le chauffeur ${c.prenom} ${c.nom} ?`)) {
                            onDeleteChauffeur(c.id);
                          }
                        }}
                        className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">Supprimer</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredChauffeurs.length === 0 && (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700">Aucun chauffeur trouvé</p>
            <p className="text-sm text-slate-500 mt-1">Aucun chauffeur ne correspond à vos critères de recherche.</p>
            {isManager && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-semibold text-sm hover:bg-amber-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter un chauffeur</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL ULTRA PREMIUM : NOUVEAU CHAUFFEUR AVEC ÉTAPES */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-down relative">
            
            {/* Decorative top bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />
            
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-8 pt-6 pb-4 border-b border-slate-100 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-2xl shadow-lg">
                    {editingChauffeur ? (
                      <Edit2 className="h-6 w-6 text-white" />
                    ) : (
                      <UserCheck className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {editingChauffeur ? `Modifier : ${editingChauffeur.prenom} ${editingChauffeur.nom}` : "Nouveau Chauffeur"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {editingChauffeur ? "Modifiez les informations du chauffeur" : "Ajoutez un nouveau chauffeur à l'équipe"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
                >
                  <X className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="mt-6">
                <div className="flex items-center justify-between max-w-md mx-auto">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                            currentStep >= step 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg' 
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {currentStep > step ? <Check className="h-5 w-5" /> : step}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${
                          currentStep >= step ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {step === 1 ? 'Identité' : step === 2 ? 'Permis' : 'Confirmation'}
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

            <form onSubmit={handleFormSubmit}>
              <div className="p-8">
                {/* Step 1: Identity */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="bg-blue-500 p-1.5 rounded-lg">
                          <IdCard className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Identité du chauffeur</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 flex items-center space-x-1">
                            <span>Nom</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Eto'o"
                            value={formNom}
                            onChange={(e) => setFormNom(e.target.value)}
                            className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 flex items-center space-x-1">
                            <span>Prénom</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Samuel"
                            value={formPrenom}
                            onChange={(e) => setFormPrenom(e.target.value)}
                            className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 flex items-center space-x-1">
                            <span>Téléphone</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="+237 6XX XXX XXX"
                            value={formTelephone}
                            onChange={(e) => setFormTelephone(e.target.value)}
                            className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Adresse</label>
                          <input
                            type="text"
                            placeholder="Douala, Cameroun"
                            value={formAdresse}
                            onChange={(e) => setFormAdresse(e.target.value)}
                            className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-semibold text-slate-700">Photo de profil</label>
                          <div className="mt-1.5 flex items-center space-x-4">
                            {formPhoto ? (
                              <div className="relative">
                                <img src={formPhoto} alt="Profil" className="h-16 w-16 rounded-full object-cover border-2 border-amber-400" />
                                <button
                                  type="button"
                                  onClick={() => setFormPhoto("")}
                                  className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center">
                                <Camera className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                              Choisir une photo
                              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            </label>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">PNG, JPG max 5 Mo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Driver License */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="bg-amber-500 p-1.5 rounded-lg">
                          <Award className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Permis de conduire</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 flex items-center space-x-1">
                            <span>Numéro de permis</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="PE-2015-882A"
                            value={formNumPermis}
                            onChange={(e) => setFormNumPermis(e.target.value.toUpperCase())}
                            className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all uppercase"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 flex items-center space-x-1">
                            <span>Date d'expiration</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={formExpPermis}
                            onChange={(e) => setFormExpPermis(e.target.value)}
                            className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="mt-4 bg-white/50 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-xs text-amber-800">
                            Le permis de conduire doit être valide. Une alerte sera affichée 30 jours avant l'expiration.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="bg-emerald-500 p-1.5 rounded-lg">
                          <Car className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Affectation véhicule</h3>
                      </div>
                      <div className="space-y-3">
                        <select
                          value={formVehiculeId}
                          onChange={(e) => setFormVehiculeId(e.target.value)}
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                        >
                          <option value="">-- Aucun véhicule --</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.immatriculation} - {v.marque} {v.modele} ({formatFCFA(v.montantJournalier)}/j)
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={formIsActive}
                              onChange={() => setFormIsActive(true)}
                              className="w-4 h-4 text-amber-500"
                            />
                            <span className="text-sm text-slate-700">Actif</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={!formIsActive}
                              onChange={() => setFormIsActive(false)}
                              className="w-4 h-4 text-slate-500"
                            />
                            <span className="text-sm text-slate-700">Inactif</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="bg-indigo-500 p-1.5 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Vérification finale</h3>
                      </div>
                      
                      <div className="bg-white rounded-xl p-5 space-y-4">
                        <h4 className="font-bold text-slate-800 border-b pb-2">Récapitulatif du chauffeur</h4>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-slate-500">Nom complet:</div>
                          <div className="font-semibold text-slate-800">{formPrenom} {formNom}</div>
                          
                          <div className="text-slate-500">Téléphone:</div>
                          <div className="font-semibold text-slate-800">{formTelephone || "—"}</div>
                          
                          <div className="text-slate-500">Adresse:</div>
                          <div className="font-semibold text-slate-800">{formAdresse || "—"}</div>
                          
                          <div className="text-slate-500">N° Permis:</div>
                          <div className="font-semibold text-slate-800 font-mono">{formNumPermis || "—"}</div>
                          
                          <div className="text-slate-500">Expiration permis:</div>
                          <div className="font-semibold text-slate-800">{formExpPermis || "—"}</div>
                          
                          <div className="text-slate-500">Statut:</div>
                          <div className={`font-semibold ${formIsActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {formIsActive ? 'Actif' : 'Inactif'}
                          </div>
                          
                          <div className="text-slate-500">Véhicule:</div>
                          <div className="font-semibold text-slate-800">
                            {formVehiculeId ? vehicles.find(v => v.id === formVehiculeId)?.immatriculation || "Assigné" : "Non assigné"}
                          </div>
                        </div>
                        
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                            <p className="text-xs text-amber-800">
                              Vérifiez attentivement toutes les informations avant de valider l'enregistrement.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with navigation buttons */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-8 py-4 border-t border-slate-100 rounded-b-3xl">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all duration-200"
                  >
                    Annuler
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all duration-200 flex items-center space-x-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Précédent</span>
                      </button>
                    )}
                    
                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                      >
                        <span>Continuer</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-8 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{editingChauffeur ? "Mettre à jour" : "Enregistrer"}</span>
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
      {/* MODAL: DETAILS CHAUFFEUR - VERSION PREMIUM */}
      {/* ========================================================== */}
      {selectedChauffeurForDetail && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-down">
            
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />
              
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 p-2 rounded-xl">
                      <UserCheck className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Fiche Chauffeur</h2>
                      <p className="text-xs text-slate-500 font-mono">ID: {selectedChauffeurForDetail.id.slice(-8)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedChauffeurForDetail(null)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center space-x-4 bg-gradient-to-r from-slate-50 to-white p-4 rounded-2xl">
                <div className="relative">
                  <img 
                    src={selectedChauffeurForDetail.photo} 
                    alt="Chauffeur" 
                    className="h-20 w-20 rounded-full object-cover border-3 border-amber-400 shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${selectedChauffeurForDetail.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {selectedChauffeurForDetail.prenom} {selectedChauffeurForDetail.nom}
                  </h3>
                  <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${
                    selectedChauffeurForDetail.isActive 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {selectedChauffeurForDetail.isActive ? 'En service' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Téléphone</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-sm font-semibold text-slate-700">{selectedChauffeurForDetail.telephone}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Adresse</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-sm text-slate-700 truncate">{selectedChauffeurForDetail.adresse || "Non renseignée"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-3">
                  <Award className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">Permis de conduire</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500">Numéro</p>
                    <p className="font-mono font-bold text-slate-800">{selectedChauffeurForDetail.numPermis}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Expiration</p>
                    <p className="font-mono font-bold text-slate-800">{selectedChauffeurForDetail.expPermis}</p>
                  </div>
                </div>
                {(() => {
                  const lic = checkPermisExpired(selectedChauffeurForDetail.expPermis);
                  if (lic.status === 'expired') {
                    return (
                      <div className="mt-3 bg-rose-500 text-white p-2 rounded-lg flex items-center space-x-2 text-xs font-bold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>PERMIS EXPIRÉ - Action immédiate requise</span>
                      </div>
                    );
                  }
                  if (lic.status === 'warning') {
                    return (
                      <div className="mt-3 bg-amber-500 text-white p-2 rounded-lg flex items-center space-x-2 text-xs font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{lic.text}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="bg-slate-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Car className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Véhicule assigné</span>
                </div>
                {(() => {
                  const vehicle = selectedChauffeurForDetail.vehiculeId 
                    ? vehicles.find(v => v.id === selectedChauffeurForDetail.vehiculeId) 
                    : null;
                  return vehicle ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{vehicle.marque} {vehicle.modele}</p>
                        <p className="text-xs text-slate-400 font-mono">{vehicle.immatriculation}</p>
                      </div>
                      <span className="text-xs font-bold bg-amber-500 text-slate-950 px-2 py-1 rounded-full">
                        Actif
                      </span>
                    </div>
                  ) : (
                    <p className="text-amber-400 text-sm">Aucun véhicule assigné</p>
                  );
                })()}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
              <button
                onClick={() => setSelectedChauffeurForDetail(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
              >
                Fermer
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