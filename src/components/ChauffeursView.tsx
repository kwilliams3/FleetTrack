import React, { useState } from "react";
import { Chauffeur, Vehicle, User } from "../types";
import { 
  Plus, Edit2, Trash2, Phone, MapPin, Award, ShieldAlert, CheckCircle2, XCircle, 
  Car, Eye, HelpCircle, X 
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

  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 })
      .format(val)
      .replace("XAF", "FCFA");
  };

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  // Local Form state
  const [formNom, setFormNom] = useState("");
  const [formPrenom, setFormPrenom] = useState("");
  const [formTelephone, setFormTelephone] = useState("");
  const [formAdresse, setFormAdresse] = useState("");
  const [formNumPermis, setFormNumPermis] = useState("");
  const [formExpPermis, setFormExpPermis] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formVehiculeId, setFormVehiculeId] = useState("");

  const handleOpenAdd = () => {
    setEditingChauffeur(null);
    setFormNom("");
    setFormPrenom("");
    setFormTelephone("");
    setFormAdresse("");
    setFormNumPermis("");
    
    // Set default licence expiration five years from now
    const fiveYears = new Date();
    fiveYears.setFullYear(fiveYears.getFullYear() + 5);
    setFormExpPermis(fiveYears.toISOString().split("T")[0]);

    // Random avatar
    const randomId = Math.floor(Math.random() * 70) + 10;
    setFormPhoto(`https://i.pravatar.cc/150?img=${randomId}`);
    setFormIsActive(true);
    setFormVehiculeId("");

    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Chauffeur) => {
    setEditingChauffeur(c);
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

  // Check if driving license is expired relative to current date 2026-06-12
  const checkPermisExpired = (expDateStr: string) => {
    const expDate = new Date(expDateStr);
    const now = new Date("2026-06-12");
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: "expired" as const, text: "LICENCE EXPIRÉE" };
    if (diffDays <= 30) return { status: "warning" as const, text: `Expire dans ${diffDays} jours` };
    return { status: "valid" as const, text: "Licence Valide" };
  };

  // Chauffeurs filtering
  const filteredChauffeurs = chauffeurs.filter(c => {
    // Hide inactive drivers from specific roles or display based on filter
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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search Bar / Menu */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            placeholder="Rechercher nom, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full sm:max-w-xs font-sans"
          />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer text-slate-600 font-sans"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="bg-slate-900 hover:bg-slate-800 text-amber-500 font-sans text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 border border-slate-850"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Chauffeur</span>
          </button>
        )}
      </div>

      {/* Grid of drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChauffeurs.map((c) => {
          const checkLic = checkPermisExpired(c.expPermis);
          const currentVehicle = c.vehiculeId ? vehicles.find(v => v.id === c.vehiculeId) : null;

          return (
            <div 
              key={c.id} 
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                !c.isActive ? 'border-slate-100 bg-slate-50/40 opacity-75' : 'border-slate-200/85 hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                
                {/* Photo and Status header */}
                <div className="flex items-center space-x-4">
                  <img 
                    src={c.photo} 
                    alt={`${c.prenom} ${c.nom}`} 
                    className="h-14 w-14 rounded-full object-cover border-2 border-amber-500 shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 font-sans">{c.prenom} {c.nom}</h3>
                    
                    <div className="flex items-center space-x-1.5">
                      {c.isActive ? (
                        <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          ACTIF
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          <XCircle className="h-2.5 w-2.5 mr-0.5" />
                          INACTIF
                        </span>
                      )}
                      
                      <span className="text-[10px] text-slate-400 font-mono">ID: {c.id}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Contacts details */}
                <div className="space-y-2 text-xs text-slate-600 font-sans">
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{c.telephone}</span>
                  </div>

                  <div className="flex items-start space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="leading-tight">{c.adresse}</span>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Award className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 font-mono block">Permis {c.numPermis}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">Expire le {c.expPermis}</span>
                    </div>
                  </div>

                </div>

                {/* Driving licence alert */}
                {checkLic.status === 'expired' && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 p-2 rounded-lg flex items-center space-x-1.5 text-[10px] font-semibold">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span>PERMIS EXPIRÉ ! Interdiction légale de circuler.</span>
                  </div>
                )}
                
                {checkLic.status === 'warning' && (
                  <div className="bg-amber-50 border border-amber-100 text-amber-800 p-2 rounded-lg flex items-center space-x-1.5 text-[10px] font-semibold">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>ALERTE PERMIS : expire sous peu ({checkLic.text})</span>
                  </div>
                )}

              </div>

              {/* Assigned vehicle info & Edit tools */}
              <div className="space-y-4 pt-4">
                
                {/* Vehicle card */}
                {currentVehicle ? (
                  <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center justify-between text-xs font-sans">
                    <div className="flex items-center space-x-1.5 text-slate-800">
                      <Car className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-semibold block">{currentVehicle.marque} {currentVehicle.modele}</span>
                        <span className="text-[10px] text-slate-400 block -mt-0.5">Assigned Vehicle</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                      {currentVehicle.immatriculation}
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-xs text-rose-600 font-semibold italic text-center">
                    Aucun véhicule assigné
                  </div>
                )}

                {/* Edit Controls */}
                {isManager && (
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100/60">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Edit2 className="h-3 w-3 text-blue-500" />
                      <span>Modifier Profil</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Voulez-vous vraiment désactiver ou supprimer définitivement le chauffeur de la flotte (${c.prenom} ${c.nom}) ?`)) {
                          onDeleteChauffeur(c.id);
                        }
                      }}
                      className="bg-slate-50 border border-slate-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="h-3 w-3 text-rose-500" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {filteredChauffeurs.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-200 p-12 text-center rounded-2xl">
            <XCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-sans font-medium">Aucun chauffeur trouvé.</p>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Vérifiez les paramètres de filtres ou créez-en un nouveau profil.</p>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL: ADD / EDIT CHAUFFEUR FORM                           */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 font-sans">
                {editingChauffeur ? `Modifier Chauffeur : ${editingChauffeur.prenom} ${editingChauffeur.nom}` : "Fiche d'Inscription Chauffeur"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium font-sans">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Eto'o"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Prénom(s) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Samuel"
                    value={formPrenom}
                    onChange={(e) => setFormPrenom(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Téléphone de contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: +237 670 XXX XXX"
                    value={formTelephone}
                    onChange={(e) => setFormTelephone(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Adresse de résidence</label>
                  <input
                    type="text"
                    placeholder="Ex: Akwa, Douala"
                    value={formAdresse}
                    onChange={(e) => setFormAdresse(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200/55">
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-bold">N° permis conduire *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PE-2015-882A"
                    value={formNumPermis}
                    onChange={(e) => setFormNumPermis(e.target.value)}
                    className="border border-slate-200 bg-white rounded px-2.5 py-1 text-[11px] font-mono focus:outline-none w-full font-bold uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-bold font-sans">Date Expiration *</label>
                  <input
                    type="date"
                    required
                    value={formExpPermis}
                    onChange={(e) => setFormExpPermis(e.target.value)}
                    className="border border-slate-200 bg-white rounded px-2.5 py-1 text-[11px] font-mono focus:outline-none w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Lien / URL Photo de Profil (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500/50 focus:outline-none w-full text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Affecter immédiatement à un véhicule</label>
                  <select
                    value={formVehiculeId}
                    onChange={(e) => setFormVehiculeId(e.target.value)}
                    disabled={editingChauffeur !== null} // Handle vehicle assignment from active view for precision
                    className="border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none text-xs w-full font-sans text-slate-600 cursor-pointer disabled:bg-slate-50"
                  >
                    <option value="">-- Aucun véhicule rattaché --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} - {v.marque} {v.modele} ({formatFCFA(v.montantJournalier)}/j)
                      </option>
                    ))}
                  </select>
                  {editingChauffeur && (
                    <span className="text-[9px] text-slate-400 font-sans block leading-none mt-0.5">
                      Pour modifier l'affectation en cours, utilisez le bouton "Affecter" sur la page Véhicules.
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-600 font-medium block">Statut d'activité</label>
                  <div className="flex items-center space-x-4 pt-1">
                    <label className="inline-flex items-center text-xs font-sans font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        checked={formIsActive}
                        onChange={() => setFormIsActive(true)}
                        className="h-3.5 w-3.5 text-amber-500 mr-1.5"
                      />
                      <span>Opérationnel / Actif</span>
                    </label>
                    <label className="inline-flex items-center text-xs font-sans font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        checked={!formIsActive}
                        onChange={() => setFormIsActive(false)}
                        className="h-3.5 w-3.5 text-slate-500 mr-1.5"
                      />
                      <span>Inactif</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
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
                  {editingChauffeur ? "Sauvegarder le profil" : "Inscrire le chauffeur"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
