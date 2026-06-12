import path from "path";
import fs from "fs";
import { 
  Vehicle, Chauffeur, Versement, Charge, ActivityLog, AffectationHistory, User, DocumentInfo 
} from "../../src/types";

export const DB_FILE = path.join(process.cwd(), "fleet_db.json");

export interface AppDatabase {
  users: User[];
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  assignments: AffectationHistory[];
  activities: ActivityLog[];
  payments: Versement[];
  expenses: Charge[];
}

export const INITIAL_DATABASE: AppDatabase = {
  users: [
    { id: "u-1", name: "Franck Administrateur", username: "admin", role: "ADMIN", isActive: true, phone: "+237 670 112 233" },
    { id: "u-2", name: "Alain Gestionnaire", username: "manager", role: "MANAGER", isActive: true, phone: "+237 699 445 566" },
  ],
  vehicles: [
    {
      id: "v-1",
      immatriculation: "LT-891-EF",
      marque: "Toyota",
      modele: "Carina E",
      annee: 2012,
      couleur: "Jaune (Taxi)",
      chassis: "JT111L000676442",
      etat: "bon",
      dateAcquisition: "2022-04-15",
      montantJournalier: 10000,
      documents: {
        carteGrise: { numero: "CG-891002", dateExpiration: "2027-10-14", nomFichier: "carte_grise_lt_891.pdf", statut: "valide" },
        assurance: { numero: "ASS-91223", dateExpiration: "2026-06-18", nomFichier: "assurance_chanas.pdf", statut: "expirant" },
        visiteTechnique: { numero: "VT-09923", dateExpiration: "2026-09-30", nomFichier: "visite_tech_sahel.pdf", statut: "valide" },
      }
    },
    {
      id: "v-2",
      immatriculation: "LT-452-XY",
      marque: "Hyundai",
      modele: "Elantra",
      annee: 2016,
      couleur: "Gris Métallisé",
      chassis: "KMHCP41B7GG22912",
      etat: "excellent",
      dateAcquisition: "2024-01-20",
      montantJournalier: 12000,
      documents: {
        carteGrise: { numero: "CG-452099", dateExpiration: "2028-02-19", nomFichier: "carte_grise_elantra.pdf", statut: "valide" },
         assurance: { numero: "ASS-45091", dateExpiration: "2026-12-31", nomFichier: "assurance_activa.pdf", statut: "valide" },
        visiteTechnique: { numero: "VT-45228", dateExpiration: "2026-05-10", nomFichier: "visite_tech_act.pdf", statut: "expire" },
      }
    },
    {
      id: "v-3",
      immatriculation: "OU-123-AA",
      marque: "Toyota",
      modele: "Hiace (Mini-Bus)",
      annee: 2018,
      couleur: "Blanc et Bleu",
      chassis: "JT144M0002241512",
      etat: "bon",
      dateAcquisition: "2023-11-05",
      montantJournalier: 25000,
      documents: {
        carteGrise: { numero: "CG-123772", dateExpiration: "2029-01-11", nomFichier: "cg_hiace.pdf", statut: "valide" },
        assurance: { numero: "ASS-330412", dateExpiration: "2026-11-20", nomFichier: "assurance_allianz.pdf", statut: "valide" },
        visiteTechnique: { numero: "VT-12304", dateExpiration: "2026-07-15", nomFichier: "vt_hiace.pdf", statut: "valide" },
        licenceTransport: { numero: "LIC-00441", dateExpiration: "2026-06-25", nomFichier: "licence_minitrans.pdf", statut: "expirant" }
      }
    },
    {
      id: "v-4",
      immatriculation: "DK-902-ZZ",
      marque: "Suzuki",
      modele: "Super Carry (Cargot)",
      annee: 2015,
      couleur: "Bleu nuit",
      chassis: "SZK882M1192023",
      etat: "en_panne",
      dateAcquisition: "2021-08-30",
      montantJournalier: 8000,
      documents: {
        carteGrise: { numero: "CG-902041", dateExpiration: "2026-04-01", nomFichier: "cg_suzuki.pdf", statut: "expire" },
        assurance: { numero: "ASS-90882", dateExpiration: "2026-08-15", nomFichier: "ass_suzuki.pdf", statut: "valide" },
        visiteTechnique: { numero: "VT-90212", dateExpiration: "2026-04-10", nomFichier: "vt_suzuki.pdf", statut: "expire" }
      }
    }
  ],
  chauffeurs: [
    {
      id: "ch-1",
      nom: "Eto'o",
      prenom: "Samuel",
      telephone: "+237 655 001 122",
      adresse: "Bonapriso, Douala",
      numPermis: "PE-2015-8890A",
      expPermis: "2028-11-12",
      photo: "https://images.unsplash.com/photo-1542156822-6924d1a71ace?auto=format&fit=crop&q=80&w=200",
      isActive: true,
      vehiculeId: "v-1"
    },
    {
      id: "ch-2",
      nom: "Milla",
      prenom: "Roger",
      telephone: "+237 655 334 455",
      adresse: "Bastos, Yaoundé",
      numPermis: "PE-2010-0045B",
      expPermis: "2026-06-30",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      isActive: true,
      vehiculeId: "v-2"
    },
    {
      id: "ch-3",
      nom: "Song",
      prenom: "Rigobert",
      telephone: "+237 655 889 900",
      adresse: "Akwa, Douala",
      numPermis: "PE-2018-4411C",
      expPermis: "2026-05-15",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
      isActive: true,
      vehiculeId: "v-3"
    },
    {
      id: "ch-4",
      nom: "Mbappe",
      prenom: "Kylian",
      telephone: "+237 699 112 233",
      adresse: "Kribi",
      numPermis: "PE-2023-7722F",
      expPermis: "2033-04-05",
      photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
      isActive: false,
    }
  ],
  assignments: [
    { id: "a-1", vehiculeId: "v-1", matricule: "LT-891-EF", modeleVehicule: "Toyota Carina E", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", dateDebut: "2024-01-01", statut: "En cours" },
    { id: "a-2", vehiculeId: "v-2", matricule: "LT-452-XY", modeleVehicule: "Hyundai Elantra", chauffeurId: "ch-2", nomChauffeur: "Milla Roger", dateDebut: "2024-03-10", statut: "En cours" },
    { id: "a-3", vehiculeId: "v-3", matricule: "OU-123-AA", modeleVehicule: "Toyota Hiace (Mini-Bus)", chauffeurId: "ch-3", nomChauffeur: "Song Rigobert", dateDebut: "2025-02-01", statut: "En cours" },
    { id: "a-4", vehiculeId: "v-4", matricule: "DK-902-ZZ", modeleVehicule: "Suzuki Super Carry", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", dateDebut: "2023-05-01", dateFin: "2023-12-31", statut: "Historique", remarque: "Véhicule mis en panne" }
  ],
  activities: [
    { id: "ac-1", date: "2026-06-12", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", vehiculeId: "v-1", matricule: "LT-891-EF", present: true, heureDebut: "06:30", kilometrageJournalier: 120, etatVehicule: "Très bon état", observations: "Journée pluvieuse à Douala" },
    { id: "ac-2", date: "2026-06-12", chauffeurId: "ch-2", nomChauffeur: "Milla Roger", vehiculeId: "v-2", matricule: "LT-452-XY", present: true, heureDebut: "07:00", kilometrageJournalier: 145, etatVehicule: "Nettoyé la carrosserie", observations: "Embouteillages à Yaoundé" },
    { id: "ac-3", date: "2026-06-12", chauffeurId: "ch-3", nomChauffeur: "Song Rigobert", vehiculeId: "v-3", matricule: "OU-123-AA", present: true, heureDebut: "05:45", kilometrageJournalier: 280, etatVehicule: "Pression des pneus faite", observations: "Fréquentation moyenne pour le minibus" },
    { id: "ac-4", date: "2026-06-11", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", vehiculeId: "v-1", matricule: "LT-891-EF", present: true, heureDebut: "06:15", heureFin: "18:00", kilometrageJournalier: 110, etatVehicule: "Parfait", observations: "Aucun incident" },
    { id: "ac-5", date: "2026-06-11", chauffeurId: "ch-2", nomChauffeur: "Milla Roger", vehiculeId: "v-2", matricule: "LT-452-XY", present: true, heureDebut: "07:30", heureFin: "19:15", kilometrageJournalier: 160, etatVehicule: "Bon", observations: "Courses de l'après-midi très intenses" },
    { id: "ac-6", date: "2026-06-11", chauffeurId: "ch-3", nomChauffeur: "Song Rigobert", vehiculeId: "v-3", matricule: "OU-123-AA", present: true, heureDebut: "06:00", heureFin: "20:00", kilometrageJournalier: 310, etatVehicule: "Fumée légère échappement", observations: "À surveiller lors du prochain trajet" }
  ],
  payments: [
    { id: "p-1", date: "2026-06-12", vehiculeId: "v-1", matricule: "LT-891-EF", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", montantAttendu: 10000, montantVerse: 10000, ecart: 0, moyenPaiement: "MTN Mobile Money", statut: "En attente", provenance: "Chauffeur" },
    { id: "p-2", date: "2026-06-12", vehiculeId: "v-2", matricule: "LT-452-XY", chauffeurId: "ch-2", nomChauffeur: "Milla Roger", montantAttendu: 12000, montantVerse: 10000, ecart: 2000, moyenPaiement: "Espèces (Cash)", statut: "En attente", provenance: "Chauffeur" },
    { id: "p-3", date: "2026-06-12", vehiculeId: "v-3", matricule: "OU-123-AA", chauffeurId: "ch-3", nomChauffeur: "Song Rigobert", montantAttendu: 25000, montantVerse: 25000, ecart: 0, moyenPaiement: "Orange Money", statut: "En attente", provenance: "Chauffeur" },
    { id: "p-4", date: "2026-06-11", vehiculeId: "v-1", matricule: "LT-891-EF", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", montantAttendu: 10000, montantVerse: 10000, ecart: 0, moyenPaiement: "MTN Mobile Money", statut: "Validé", provenance: "Chauffeur" },
    { id: "p-5", date: "2026-06-11", vehiculeId: "v-2", matricule: "LT-452-XY", chauffeurId: "ch-2", nomChauffeur: "Milla Roger", montantAttendu: 12000, montantVerse: 12000, ecart: 0, moyenPaiement: "Orange Money", statut: "Validé", provenance: "Chauffeur" },
    { id: "p-6", date: "2026-06-11", vehiculeId: "v-3", matricule: "OU-123-AA", chauffeurId: "ch-3", nomChauffeur: "Song Rigobert", montantAttendu: 25000, montantVerse: 20000, ecart: 5000, moyenPaiement: "Espèces (Cash)", statut: "Validé", provenance: "Chauffeur" },
    { id: "p-7", date: "2026-06-10", vehiculeId: "v-1", matricule: "LT-891-EF", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", montantAttendu: 10000, montantVerse: 10000, ecart: 0, moyenPaiement: "MTN Mobile Money", statut: "Validé", provenance: "Chauffeur" },
    { id: "p-8", date: "2026-06-10", vehiculeId: "v-2", matricule: "LT-452-XY", chauffeurId: "ch-2", nomChauffeur: "Milla Roger", montantAttendu: 12000, montantVerse: 12000, ecart: 0, moyenPaiement: "Orange Money", statut: "Validé", provenance: "Chauffeur" },
    { id: "p-9", date: "2026-06-10", vehiculeId: "v-3", matricule: "OU-123-AA", chauffeurId: "ch-3", nomChauffeur: "Song Rigobert", montantAttendu: 25000, montantVerse: 25000, ecart: 0, moyenPaiement: "MTN Mobile Money", statut: "Validé", provenance: "Chauffeur" },
    { id: "p-10", date: "2026-06-09", vehiculeId: "v-1", matricule: "LT-891-EF", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", montantAttendu: 10000, montantVerse: 8000, ecart: 2000, moyenPaiement: "Espèces (Cash)", statut: "Validé", provenance: "Chauffeur" },
    { id: "p-11", date: "2026-06-09", vehiculeId: "v-2", matricule: "LT-452-XY", chauffeurId: "ch-2", nomChauffeur: "Milla Roger", montantAttendu: 12000, montantVerse: 12000, ecart: 0, moyenPaiement: "Orange Money", statut: "Validé", provenance: "Chauffeur" },
    { id: "p-12", date: "2026-06-09", vehiculeId: "v-3", matricule: "OU-123-AA", chauffeurId: "ch-3", nomChauffeur: "Song Rigobert", montantAttendu: 25000, montantVerse: 25000, ecart: 0, moyenPaiement: "MTN Mobile Money", statut: "Validé", provenance: "Chauffeur" }
  ],
  expenses: [
    { id: "c-1", date: "2026-06-12", vehiculeId: "v-2", matricule: "LT-452-XY", chauffeurId: "ch-2", nomChauffeur: "Milla Roger", typeCharge: "Carburant", description: "Plein de Gasoil station total", montant: 25000, statut: "Validé" },
    { id: "c-2", date: "2026-06-12", vehiculeId: "v-1", matricule: "LT-891-EF", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", typeCharge: "Panne mécanique", description: "Changement de rotule de direction", montant: 18000, statut: "En attente" },
    { id: "c-3", date: "2026-06-11", vehiculeId: "v-3", matricule: "OU-123-AA", chauffeurId: "ch-3", nomChauffeur: "Song Rigobert", typeCharge: "Vidange", description: "Filtre et huile moteur 10W40", montant: 35000, statut: "Validé" },
    { id: "c-4", date: "2026-06-10", vehiculeId: "v-1", matricule: "LT-891-EF", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", typeCharge: "Pneus", description: "Achat d'un pneu avant occasion de secours", montant: 22000, statut: "Validé" },
    { id: "c-5", date: "2026-06-08", vehiculeId: "v-4", matricule: "DK-902-ZZ", chauffeurId: "ch-1", nomChauffeur: "Eto'o Samuel", typeCharge: "Réparation", description: "Achat de carburateur et kit joints", montant: 85000, statut: "Validé" }
  ]
};

export function readDB(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const payload = fs.readFileSync(DB_FILE, "utf-8");
      const dbInstance: AppDatabase = JSON.parse(payload);
      
      const now = new Date("2026-06-12");
      dbInstance.vehicles.forEach(vehicle => {
        Object.keys(vehicle.documents).forEach((key) => {
          const doc = (vehicle.documents as any)[key] as DocumentInfo;
          if (doc) {
            const expDate = new Date(doc.dateExpiration);
            const diffTime = expDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
              doc.statut = 'expire';
            } else if (diffDays <= 30) {
              doc.statut = 'expirant';
            } else {
              doc.statut = 'valide';
            }
          }
        });
      });
      return dbInstance;
    }
  } catch (err) {
    console.error("Erreur de lecture de la base JSON, utilisation de l'init :", err);
  }
  
  writeDB(INITIAL_DATABASE);
  return INITIAL_DATABASE;
}

export function writeDB(data: AppDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur lors de l'écriture en base JSON :", err);
  }
}
