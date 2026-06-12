export type UserRole = 'ADMIN' | 'MANAGER';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  password?: string;
  mustChangePassword?: boolean;
}

export interface DocumentInfo {
  numero: string;
  dateExpiration: string;
  copieUrl?: string; // Dummy photo or name
  nomFichier?: string;
  statut: 'valide' | 'expirant' | 'expire';
}

export interface Vehicle {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee?: number;
  couleur?: string;
  chassis?: string;
  etat: 'excellent' | 'bon' | 'moyen' | 'en_panne' | 'en_reparation';
  dateAcquisition?: string;
  montantJournalier: number; // in FCFA
  documents: {
    carteGrise: DocumentInfo;
    assurance: DocumentInfo;
    visiteTechnique: DocumentInfo;
    licenceTransport?: DocumentInfo;
  };
}

export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  numPermis: string;
  expPermis: string; // date YYYY-MM-DD
  photo: string; // Avatar/URL
  isActive: boolean;
  vehiculeId?: string; // currently assigned vehicle
}

export interface AffectationHistory {
  id: string;
  vehiculeId: string;
  matricule: string;
  modeleVehicule: string;
  chauffeurId: string;
  nomChauffeur: string;
  dateDebut: string;
  dateFin?: string;
  statut: 'En cours' | 'Historique';
  remarque?: string;
}

export interface ActivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  chauffeurId: string;
  nomChauffeur: string;
  vehiculeId: string;
  matricule: string;
  present: boolean;
  heureDebut?: string;
  heureFin?: string;
  kilometrageJournalier?: number;
  etatVehicule?: string;
  observations?: string;
}

export interface Versement {
  id: string;
  date: string; // YYYY-MM-DD
  vehiculeId: string;
  matricule: string;
  chauffeurId: string;
  nomChauffeur: string;
  montantAttendu: number;
  montantVerse: number;
  ecart: number; // attendu - verse (if > 0, unpaid)
  moyenPaiement: 'MTN Mobile Money' | 'Orange Money' | 'Espèces (Cash)';
  statut: 'En attente' | 'Validé' | 'Refusé';
  provenance: 'Chauffeur' | 'Administration';
  motifRefus?: string;
}

export interface Charge {
  id: string;
  date: string; // YYYY-MM-DD
  vehiculeId: string;
  matricule: string;
  chauffeurId: string;
  nomChauffeur: string;
  typeCharge: 'Panne mécanique' | 'Réparation' | 'Entretien' | 'Carburant' | 'Pneus' | 'Vidange' | 'Pièces de rechange' | 'Autre';
  description: string;
  montant: number;
  justificatif?: string; // filename or mockup URL
  statut: 'En attente' | 'Validé' | 'Refusé';
  motifRefus?: string;
}

export interface DashboardStats {
  totalVehicles: number;
  activeDrivers: number;
  expectedToday: number;
  collectedToday: number;
  unpaidToday: number;
  expensesToday: number;
  vehiclesInPanne: number;
  expiredDocsCount: number;
}
