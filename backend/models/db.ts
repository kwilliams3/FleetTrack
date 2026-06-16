import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleAuth } from "google-auth-library";
import { 
  Vehicle, Chauffeur, Versement, Charge, ActivityLog, AffectationHistory, User, DocumentInfo, UserRole 
} from "../../src/types";

// Load local environment variables
dotenv.config();

// MySQL Configuration
const dbConfig = {
  host: process.env.DB_HOST || process.env.DB_SERVER || "KING-WILLIAMS",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "AZERTY123",
  database: process.env.DB_DATABASE || "FleetTrack",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 4000
};

let mysqlPool: mysql.Pool | null = null;
let mysqlConnected = false;

// Safely initialize Firebase Admin
let firestoreDb: any = null;
let firestoreEnabled = false;

async function initFirestore() {
  try {
    // Proactively verify if we have access to Google Application Default Credentials
    const auth = new GoogleAuth();
    await auth.getApplicationDefault();

    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const app = getApps().length === 0 ? initializeApp({
        projectId: configData.projectId
      }) : getApp();
      firestoreDb = getFirestore(app, configData.firestoreDatabaseId || "(default)");
      console.log("Firebase Admin initialisé avec succès pour la base:", configData.firestoreDatabaseId);
    } else {
      console.warn("Fichier firebase-applet-config.json non trouvé. Initialisation Firebase Admin par défaut.");
      const app = getApps().length === 0 ? initializeApp() : getApp();
      firestoreDb = getFirestore(app);
    }

    // Run a dry run query to verify it works
    if (firestoreDb) {
      await firestoreDb.collection("fleet_data").limit(1).get();
      firestoreEnabled = true;
      console.log("📡 Firestore Status: ENABLED & READY ✅");
    }
  } catch (error: any) {
    console.warn("⚠️  Les identifiants Google Cloud n'ont pas pu être chargés (Normal en local hors bac à sable).");
    console.warn("🔄 La synchronisation avec Firestore a été désactivée. Utilisation exclusive de MySQL local.");
    firestoreDb = null;
    firestoreEnabled = false;
  }
}

// Call asynchronous Firestore initialization
initFirestore();

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
  ],
  vehicles: [],
  chauffeurs: [],
  assignments: [],
  activities: [],
  payments: [],
  expenses: []
};

/**
 * Connects to MySQL or returns the active connection pool.
 * If connection is unreachable, returns null.
 */
export async function getMysqlPool(): Promise<mysql.Pool | null> {
  if (mysqlConnected && mysqlPool) {
    return mysqlPool;
  }
  
  try {
    const host = dbConfig.host;
    const port = dbConfig.port;
    console.log(`En cours de connexion à MySQL à l'adresse ${host}:${port}...`);
    
    // Auto-ensure database exists
    try {
      const conn = await mysql.createConnection({
        host,
        port,
        user: dbConfig.user,
        password: dbConfig.password,
        connectTimeout: 4000
      });
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
      await conn.end();
    } catch (dbErr: any) {
      console.warn(`[MySQL Auto-DB Creation Warning] ${dbErr.message}`);
    }

    const pool = mysql.createPool(dbConfig);
    // Test connection
    const connection = await pool.getConnection();
    connection.release();
    
    console.log("⚡ Connecté avec succès à MySQL !");
    await ensureDatabaseSchema(pool);
    mysqlPool = pool;
    mysqlConnected = true;
    return mysqlPool;
  } catch (error: any) {
    console.warn(`[MySQL Connection Warning] Impossible de se connecter à la base MySQL. Message: ${error?.message}`);
    console.log("👉 L'application bascule automatiquement sur la base cloud Firestore pour assurer une prévisualisation de l'application fluide.");
    mysqlConnected = false;
    mysqlPool = null;
    return null;
  }
}

/**
 * Automatically set up schemas and default rows on MySQL
 */
async function ensureDatabaseSchema(pool: mysql.Pool): Promise<void> {
  try {
    const [rows]: any = await pool.query("SHOW TABLES LIKE 'Utilisateurs'");
    if (rows.length === 0) {
      console.log("Schéma MySQL vide. Exécution de l'initialisation du schéma pour MySQL...");
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`Utilisateurs\` (
            \`Id\` VARCHAR(50) NOT NULL PRIMARY KEY,
            \`NomComplet\` VARCHAR(150) NOT NULL,
            \`Identifiant\` VARCHAR(50) NOT NULL UNIQUE,
            \`Role\` VARCHAR(20) NOT NULL CHECK (\`Role\` IN ('ADMIN', 'MANAGER')),
            \`EstActif\` TINYINT(1) NOT NULL DEFAULT 1,
            \`Telephone\` VARCHAR(30) NULL,
            \`ChauffeurAssocieId\` VARCHAR(50) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`Chauffeurs\` (
            \`Id\` VARCHAR(50) NOT NULL PRIMARY KEY,
            \`Nom\` VARCHAR(100) NOT NULL,
            \`Prenom\` VARCHAR(100) NOT NULL,
            \`Telephone\` VARCHAR(30) NOT NULL,
            \`Adresse\` VARCHAR(250) NOT NULL,
            \`NumeroPermis\` VARCHAR(50) NOT NULL,
            \`ExpirationPermis\` DATE NOT NULL,
            \`PhotoUrl\` VARCHAR(250) NULL,
            \`EstActif\` TINYINT(1) NOT NULL DEFAULT 1,
            \`VehiculeAttribueId\` VARCHAR(50) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`Vehicules\` (
            \`Id\` VARCHAR(50) NOT NULL PRIMARY KEY,
            \`Immatriculation\` VARCHAR(30) NOT NULL UNIQUE,
            \`Marque\` VARCHAR(50) NOT NULL,
            \`Modele\` VARCHAR(50) NOT NULL,
            \`Annee\` INT NULL,
            \`Couleur\` VARCHAR(30) NULL,
            \`NumeroChassis\` VARCHAR(80) NULL,
            \`Etat\` VARCHAR(20) NOT NULL CHECK (\`Etat\` IN ('excellent', 'bon', 'moyen', 'en_panne', 'en_reparation')),
            \`DateAcquisition\` DATE NULL,
            \`MontantJournalier\` DECIMAL(18, 2) NOT NULL DEFAULT 10000.00
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`DocumentsVehicules\` (
            \`Id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`VehiculeId\` VARCHAR(50) NOT NULL,
            \`TypeDocument\` VARCHAR(50) NOT NULL CHECK (\`TypeDocument\` IN ('Carte Grise', 'Assurance', 'Visite Technique', 'Licence Transport')),
            \`NumeroDocument\` VARCHAR(50) NOT NULL,
            \`DateExpiration\` DATE NOT NULL,
            \`FichierNom\` VARCHAR(150) NULL,
            CONSTRAINT \`fk_documents_vehicle\` FOREIGN KEY (\`VehiculeId\`) REFERENCES \`Vehicules\` (\`Id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`AffectationsChauffeurVehicule\` (
            \`Id\` VARCHAR(50) NOT NULL PRIMARY KEY,
            \`VehiculeId\` VARCHAR(50) NOT NULL,
            \`ChauffeurId\` VARCHAR(50) NOT NULL,
            \`DateDebut\` DATE NOT NULL,
            \`DateFin\` DATE NULL,
            \`Statut\` VARCHAR(20) NOT NULL CHECK (\`Statut\` IN ('En cours', 'Historique')),
            \`Remarque\` VARCHAR(500) NULL,
            CONSTRAINT \`fk_affectations_vehicle\` FOREIGN KEY (\`VehiculeId\`) REFERENCES \`Vehicules\` (\`Id\`),
            CONSTRAINT \`fk_affectations_chauffeur\` FOREIGN KEY (\`ChauffeurId\`) REFERENCES \`Chauffeurs\` (\`Id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`ActivitesJournalieres\` (
            \`Id\` VARCHAR(50) NOT NULL PRIMARY KEY,
            \`DateActivite\` DATE NOT NULL,
            \`ChauffeurId\` VARCHAR(50) NOT NULL,
            \`VehiculeId\` VARCHAR(50) NOT NULL,
            \`Present\` TINYINT(1) NOT NULL DEFAULT 1,
            \`HeureDebut\` VARCHAR(10) NULL,
            \`HeureFin\` VARCHAR(10) NULL,
            \`KilometrageJournalier\` INT NULL,
            \`EtatVehicule\` VARCHAR(100) NULL,
            \`Observations\` VARCHAR(500) NULL,
            CONSTRAINT \`fk_activites_chauffeur\` FOREIGN KEY (\`ChauffeurId\`) REFERENCES \`Chauffeurs\` (\`Id\`),
            CONSTRAINT \`fk_activites_vehicle\` FOREIGN KEY (\`VehiculeId\`) REFERENCES \`Vehicules\` (\`Id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`VersementsJournaliers\` (
            \`Id\` VARCHAR(50) NOT NULL PRIMARY KEY,
            \`DateVersement\` DATE NOT NULL,
            \`VehiculeId\` VARCHAR(50) NOT NULL,
            \`ChauffeurId\` VARCHAR(50) NOT NULL,
            \`MontantAttendu\` DECIMAL(18, 2) NOT NULL,
            \`MontantVerse\` DECIMAL(18, 2) NOT NULL,
            \`Ecart\` DECIMAL(18, 2) NOT NULL,
            \`MoyenPaiement\` VARCHAR(50) NOT NULL CHECK (\`MoyenPaiement\` IN ('MTN Mobile Money', 'Orange Money', 'Espèces (Cash)')),
            \`StatutValidation\` VARCHAR(25) NOT NULL CHECK (\`StatutValidation\` IN ('En attente', 'Validé', 'Refusé')),
            \`Provenance\` VARCHAR(20) NOT NULL CHECK (\`Provenance\` IN ('Chauffeur', 'Administration')),
            \`MotifRefus\` VARCHAR(250) NULL,
            CONSTRAINT \`fk_versements_vehicle\` FOREIGN KEY (\`VehiculeId\`) REFERENCES \`Vehicules\` (\`Id\`),
            CONSTRAINT \`fk_versements_chauffeur\` FOREIGN KEY (\`ChauffeurId\`) REFERENCES \`Chauffeurs\` (\`Id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`ChargesEtDepenses\` (
            \`Id\` VARCHAR(50) NOT NULL PRIMARY KEY,
            \`DateDepense\` DATE NOT NULL,
            \`VehiculeId\` VARCHAR(50) NOT NULL,
            \`ChauffeurId\` VARCHAR(50) NOT NULL,
            \`TypeCharge\` VARCHAR(100) NOT NULL CHECK (\`TypeCharge\` IN ('Panne mécanique', 'Réparation', 'Entretien', 'Carburant', 'Pneus', 'Vidange', 'Pièces de rechange', 'Autre')),
            \`Description\` VARCHAR(500) NOT NULL,
            \`Montant\` DECIMAL(18, 2) NOT NULL,
            \`JustificatifNom\` VARCHAR(150) NULL,
            \`StatutValidation\` VARCHAR(25) NOT NULL CHECK (\`StatutValidation\` IN ('En attente', 'Validé', 'Refusé')),
            \`MotifRefus\` VARCHAR(250) NULL,
            CONSTRAINT \`fk_charges_vehicle\` FOREIGN KEY (\`VehiculeId\`) REFERENCES \`Vehicules\` (\`Id\`),
            CONSTRAINT \`fk_charges_chauffeur\` FOREIGN KEY (\`ChauffeurId\`) REFERENCES \`Chauffeurs\` (\`Id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Seed default user
      console.log("Seeding d'un compte administrateur par défaut dans MySQL...");
      await pool.query(`
        INSERT INTO \`Utilisateurs\` (\`Id\`, \`NomComplet\`, \`Identifiant\`, \`Role\`, \`EstActif\`, \`Telephone\`, \`ChauffeurAssocieId\`)
        VALUES ('u-1', 'Franck Administrateur', 'admin', 'ADMIN', 1, '+237 670 112 233', NULL);
      `);
      console.log("Schéma MySQL configuré et initialisé avec succès !");
    }
  } catch (error) {
    console.error("Erreur d'initialisation du schéma MySQL :", error);
  }
}

/**
 * Safe timezone-independent date formatter to YYYY-MM-DD
 */
function formatDateSafe(dateVal: any): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    
    // If it's a string in YYYY-MM-DD format (like '2026-06-16' or with time '2026-06-16T...'), parse it
    if (typeof dateVal === "string") {
      const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      }
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/**
 * Fetch and construct DB from MySQL
 */
export async function readDBFromMysql(): Promise<AppDatabase> {
  const pool = await getMysqlPool();
  if (!pool) {
    throw new Error("Base MySQL non connectée.");
  }

  // 1. Fetch users
  const [usersRows]: any = await pool.query("SELECT * FROM `Utilisateurs`");
  const users: User[] = usersRows.map((row: any) => ({
    id: row.Id,
    name: row.NomComplet,
    username: row.Identifiant,
    role: row.Role as UserRole,
    isActive: row.EstActif === 1 || row.EstActif === true,
    phone: row.Telephone || undefined
  }));

  // 2. Fetch chauffeurs
  const [chauffeursRows]: any = await pool.query("SELECT * FROM `Chauffeurs`");
  const chauffeurs: Chauffeur[] = chauffeursRows.map((row: any) => ({
    id: row.Id,
    nom: row.Nom,
    prenom: row.Prenom,
    telephone: row.Telephone,
    adresse: row.Adresse,
    numPermis: row.NumeroPermis,
    expPermis: row.ExpirationPermis ? formatDateSafe(row.ExpirationPermis) : "",
    photo: row.PhotoUrl || "",
    isActive: row.EstActif === 1 || row.EstActif === true,
    vehiculeId: row.VehiculeAttribueId || undefined
  }));

  // 3. Fetch documents of vehicles
  const [docsRows]: any = await pool.query("SELECT * FROM `DocumentsVehicules`");

  // 4. Fetch vehicles
  const [vehiclesRows]: any = await pool.query("SELECT * FROM `Vehicules`");
  const vehicles: Vehicle[] = vehiclesRows.map((row: any) => {
    const vDocs = docsRows.filter((d: any) => d.VehiculeId === row.Id);
    
    const getDocInfo = (type: string) => {
      const d = vDocs.find((x: any) => x.TypeDocument === type);
      if (!d) return { numero: "", dateExpiration: "", statut: "valide" as const };
      return {
        numero: d.NumeroDocument,
        dateExpiration: d.DateExpiration ? formatDateSafe(d.DateExpiration) : "",
        nomFichier: d.FichierNom || undefined,
        statut: "valide" as const
      };
    };

    return {
      id: row.Id,
      immatriculation: row.Immatriculation,
      marque: row.Marque,
      modele: row.Modele,
      annee: row.Annee || undefined,
      couleur: row.Couleur || undefined,
      chassis: row.NumeroChassis || undefined,
      etat: row.Etat as any,
      dateAcquisition: row.DateAcquisition ? formatDateSafe(row.DateAcquisition) : undefined,
      montantJournalier: Number(row.MontantJournalier) || 10000,
      documents: {
        carteGrise: getDocInfo("Carte Grise"),
        assurance: getDocInfo("Assurance"),
        visiteTechnique: getDocInfo("Visite Technique"),
        licenceTransport: getDocInfo("Licence Transport")
      }
    };
  });

  // 5. Fetch assignments
  const [assignmentsRows]: any = await pool.query("SELECT * FROM `AffectationsChauffeurVehicule`");
  const assignments: AffectationHistory[] = assignmentsRows.map((row: any) => {
    const vehicle = vehicles.find(v => v.id === row.VehiculeId);
    const chauffeur = chauffeurs.find(c => c.id === row.ChauffeurId);
    return {
      id: row.Id,
      vehiculeId: row.VehiculeId,
      matricule: vehicle?.immatriculation || "Inconnue",
      modeleVehicule: vehicle ? `${vehicle.marque} ${vehicle.modele}` : "Inconnu",
      chauffeurId: row.ChauffeurId,
      nomChauffeur: chauffeur ? `${chauffeur.nom} ${chauffeur.prenom}` : "Inconnu",
      dateDebut: row.DateDebut ? formatDateSafe(row.DateDebut) : "",
      dateFin: row.DateFin ? formatDateSafe(row.DateFin) : undefined,
      statut: row.Statut as any,
      remarque: row.Remarque || undefined
    };
  });

  // 6. Fetch activities
  const [activitiesRows]: any = await pool.query("SELECT * FROM `ActivitesJournalieres`");
  const activities: ActivityLog[] = activitiesRows.map((row: any) => {
    const vehicle = vehicles.find(v => v.id === row.VehiculeId);
    const chauffeur = chauffeurs.find(c => c.id === row.ChauffeurId);
    return {
      id: row.Id,
      date: row.DateActivite ? formatDateSafe(row.DateActivite) : "",
      chauffeurId: row.ChauffeurId,
      nomChauffeur: chauffeur ? `${chauffeur.nom} ${chauffeur.prenom}` : "Inconnu",
      vehiculeId: row.VehiculeId,
      matricule: vehicle?.immatriculation || "Aucun véhicule",
      present: row.Present === 1 || row.Present === true,
      heureDebut: row.HeureDebut || undefined,
      heureFin: row.HeureFin || undefined,
      kilometrageJournalier: row.KilometrageJournalier !== null ? Number(row.KilometrageJournalier) : undefined,
      etatVehicule: row.EtatVehicule || undefined,
      observations: row.Observations || undefined
    };
  });

  // 7. Fetch payments
  const [paymentsRows]: any = await pool.query("SELECT * FROM `VersementsJournaliers`");
  const payments: Versement[] = paymentsRows.map((row: any) => {
    const vehicle = vehicles.find(v => v.id === row.VehiculeId);
    const chauffeur = chauffeurs.find(c => c.id === row.ChauffeurId);
    return {
      id: row.Id,
      date: row.DateVersement ? formatDateSafe(row.DateVersement) : "",
      vehiculeId: row.VehiculeId,
      matricule: vehicle?.immatriculation || "Inconnue",
      chauffeurId: row.ChauffeurId,
      nomChauffeur: chauffeur ? `${chauffeur.nom} ${chauffeur.prenom}` : "Inconnu",
      montantAttendu: Number(row.MontantAttendu),
      montantVerse: Number(row.MontantVerse),
      ecart: Number(row.Ecart),
      moyenPaiement: row.MoyenPaiement as any,
      statut: row.StatutValidation as any,
      provenance: row.Provenance as any,
      motifRefus: row.MotifRefus || undefined
    };
  });

  // 8. Fetch expenses
  const [expensesRows]: any = await pool.query("SELECT * FROM `ChargesEtDepenses`");
  const expenses: Charge[] = expensesRows.map((row: any) => {
    const vehicle = vehicles.find(v => v.id === row.VehiculeId);
    const chauffeur = chauffeurs.find(c => c.id === row.ChauffeurId);
    return {
      id: row.Id,
      date: row.DateDepense ? formatDateSafe(row.DateDepense) : "",
      vehiculeId: row.VehiculeId,
      matricule: vehicle?.immatriculation || "Inconnue",
      chauffeurId: row.ChauffeurId,
      nomChauffeur: chauffeur ? `${chauffeur.nom} ${chauffeur.prenom}` : "Administration",
      typeCharge: row.TypeCharge as any,
      description: row.Description,
      montant: Number(row.Montant),
      justificatif: row.JustificatifNom || undefined,
      statut: row.StatutValidation as any,
      motifRefus: row.MotifRefus || undefined
    };
  });

  return {
    users,
    vehicles,
    chauffeurs,
    assignments,
    activities,
    payments,
    expenses
  };
}

/**
 * Write full database structure to MySQL
 */
export async function writeDBToMysql(data: AppDatabase): Promise<void> {
  const pool = await getMysqlPool();
  if (!pool) {
    throw new Error("Base MySQL non connectée.");
  }

  // Use simple deletions in foreign key order to overwrite safely
  await pool.query("DELETE FROM `DocumentsVehicules`");
  await pool.query("DELETE FROM `ActivitesJournalieres`");
  await pool.query("DELETE FROM `VersementsJournaliers`");
  await pool.query("DELETE FROM `ChargesEtDepenses`");
  await pool.query("DELETE FROM `AffectationsChauffeurVehicule`");
  await pool.query("DELETE FROM `Utilisateurs`");
  await pool.query("DELETE FROM `Chauffeurs`");
  await pool.query("DELETE FROM `Vehicules`");

  // Insert Users
  for (const u of data.users) {
    await pool.query(
      "INSERT INTO `Utilisateurs` (`Id`, `NomComplet`, `Identifiant`, `Role`, `EstActif`, `Telephone`, `ChauffeurAssocieId`) VALUES (?, ?, ?, ?, ?, ?, NULL)",
      [u.id, u.name, u.username, u.role, u.isActive ? 1 : 0, u.phone || null]
    );
  }

  // Insert Vehicles
  for (const v of data.vehicles) {
    await pool.query(
      "INSERT INTO `Vehicules` (`Id`, `Immatriculation`, `Marque`, `Modele`, `Annee`, `Couleur`, `NumeroChassis`, `Etat`, `DateAcquisition`, `MontantJournalier`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [v.id, v.immatriculation, v.marque, v.modele, v.annee || null, v.couleur || null, v.chassis || null, v.etat, v.dateAcquisition || null, v.montantJournalier]
    );

    // Insert Documents
    const docKeys = ['carteGrise', 'assurance', 'visiteTechnique', 'licenceTransport'];
    for (const key of docKeys) {
      const doc = (v.documents as any)[key];
      if (doc && doc.numero) {
        const typeLabel = key === 'carteGrise' ? 'Carte Grise' : key === 'assurance' ? 'Assurance' : key === 'visiteTechnique' ? 'Visite Technique' : 'Licence Transport';
        await pool.query(
          "INSERT INTO `DocumentsVehicules` (`VehiculeId`, `TypeDocument`, `NumeroDocument`, `DateExpiration`, `FichierNom`) VALUES (?, ?, ?, ?, ?)",
          [v.id, typeLabel, doc.numero, doc.dateExpiration, doc.nomFichier || null]
        );
      }
    }
  }

  // Insert Chauffeurs
  for (const c of data.chauffeurs) {
    await pool.query(
      "INSERT INTO `Chauffeurs` (`Id`, `Nom`, `Prenom`, `Telephone`, `Adresse`, `NumeroPermis`, `ExpirationPermis`, `PhotoUrl`, `EstActif`, `VehiculeAttribueId`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [c.id, c.nom, c.prenom, c.telephone, c.adresse, c.numPermis, c.expPermis, c.photo, c.isActive ? 1 : 0, c.vehiculeId || null]
    );
  }

  // Insert Assignments
  for (const a of data.assignments) {
    await pool.query(
      "INSERT INTO `AffectationsChauffeurVehicule` (`Id`, `VehiculeId`, `ChauffeurId`, `DateDebut`, `DateFin`, `Statut`, `Remarque`) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [a.id, a.vehiculeId, a.chauffeurId, a.dateDebut, a.dateFin || null, a.statut, a.remarque || null]
    );
  }

  // Insert Activities
  for (const ac of data.activities) {
    await pool.query(
      "INSERT INTO `ActivitesJournalieres` (`Id`, `DateActivite`, `ChauffeurId`, `VehiculeId`, `Present`, \`HeureDebut\`, \`HeureFin\`, `KilometrageJournalier`, `EtatVehicule`, `Observations`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [ac.id, ac.date, ac.chauffeurId, ac.vehiculeId, ac.present ? 1 : 0, ac.heureDebut || null, ac.heureFin || null, ac.kilometrageJournalier !== undefined ? ac.kilometrageJournalier : null, ac.etatVehicule || null, ac.observations || null]
    );
  }

  // Insert Payments
  for (const p of data.payments) {
    await pool.query(
      "INSERT INTO `VersementsJournaliers` (`Id`, `DateVersement`, `VehiculeId`, `ChauffeurId`, `MontantAttendu`, `MontantVerse`, `Ecart`, `MoyenPaiement`, `StatutValidation`, `Provenance`, `MotifRefus`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [p.id, p.date, p.vehiculeId, p.chauffeurId, p.montantAttendu, p.montantVerse, p.ecart, p.moyenPaiement, p.statut, p.provenance, p.motifRefus || null]
    );
  }

  // Insert Expenses
  for (const e of data.expenses) {
    await pool.query(
      "INSERT INTO `ChargesEtDepenses` (`Id`, `DateDepense`, `VehiculeId`, `ChauffeurId`, `TypeCharge`, `Description`, `Montant`, `JustificatifNom`, `StatutValidation`, `MotifRefus`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [e.id, e.date, e.vehiculeId, e.chauffeurId, e.typeCharge, e.description, e.montant, e.justificatif || null, e.statut, e.motifRefus || null]
    );
  }
}

/**
 * Backup / Fallback helper to write to Firestore
 */
async function writeDBToFirestore(data: AppDatabase): Promise<void> {
  if (!firestoreDb || !firestoreEnabled) {
    return;
  }
  const listKeys = ["users", "vehicles", "chauffeurs", "assignments", "activities", "payments", "expenses"];
  await Promise.allSettled(
    listKeys.map(key => {
      const list = (data as any)[key] || [];
      return firestoreDb.collection("fleet_data").doc(key).set({ list });
    })
  );
}

/**
 * Global database read orchestrator with automatic fallback
 */
export async function readDB(): Promise<AppDatabase> {
  // 1. Try MySQL first
  try {
    const pool = await getMysqlPool();
    if (pool) {
      console.log("📂 Lecture des données depuis MySQL...");
      const data = await readDBFromMysql();
      return processDocumentValidity(data);
    }
  } catch (err: any) {
    console.error("⚠️ MySQL: Échec de lecture, repli sur Firestore.", err?.message);
  }

  // 2. Fall back to Cloud Firestore
  try {
    if (!firestoreDb || !firestoreEnabled) {
      console.warn("Base de données Firestore désactivée/non disponible. Retour d'une DB par défaut.");
      return INITIAL_DATABASE;
    }

    console.log("📂 Lecture des données de repli depuis Cloud Firestore...");
    const listKeys = ["users", "vehicles", "chauffeurs", "assignments", "activities", "payments", "expenses"];
    const results: Partial<AppDatabase> = {};

    const docs = await Promise.all(
      listKeys.map(key => firestoreDb.collection("fleet_data").doc(key).get())
    );

    let docFound = false;
    for (let i = 0; i < listKeys.length; i++) {
      const key = listKeys[i];
      const doc = docs[i];
      if (doc.exists) {
        docFound = true;
        const data = doc.data();
        (results as any)[key] = data?.list || [];
      } else {
        (results as any)[key] = (INITIAL_DATABASE as any)[key] || [];
      }
    }

    if (!docFound) {
      console.log("Aucune donnée Firestore existante. Initialisation de la base de démonstration.");
      await writeDBToFirestore(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }

    return processDocumentValidity(results as AppDatabase);
  } catch (err) {
    console.error("Erreur critique lors de la lecture Firestore :", err);
    return INITIAL_DATABASE;
  }
}

/**
 * Global database write orchestrator with dual sync
 */
export async function writeDB(data: AppDatabase): Promise<void> {
  let mysqlSuccess = false;

  // 1. Try to sync to MySQL
  try {
    const pool = await getMysqlPool();
    if (pool) {
      console.log("💾 Sauvegarde en cours sur MySQL...");
      await writeDBToMysql(data);
      mysqlSuccess = true;
      console.log("⚡ Succès de la sauvegarde sur MySQL.");
    }
  } catch (err: any) {
    console.error("⚠️ Erreur lors de la sauvegarde sur MySQL :", err?.message);
  }

  // 2. Backup to Cloud Firestore as a warm-standby clone if enabled
  if (firestoreDb && firestoreEnabled) {
    try {
      console.log("💾 Synchronisation de sauvegarde en cours sur Cloud Firestore...");
      await writeDBToFirestore(data);
      if (!mysqlSuccess) {
        console.log("⚡ Succès de la sauvegarde de repli sur Cloud Firestore.");
      }
    } catch (err) {
      console.error("Erreur de synchronisation Firestore :", err);
    }
  }
}

/**
 * Utility to enrich and control validity states of driving forms and vehicle reports
 */
function processDocumentValidity(dbInstance: AppDatabase): AppDatabase {
  const now = new Date("2026-06-12");
  
  if (dbInstance.vehicles && Array.isArray(dbInstance.vehicles)) {
    dbInstance.vehicles.forEach(vehicle => {
      try {
        if (vehicle && vehicle.documents) {
          Object.keys(vehicle.documents).forEach((key) => {
            const doc = (vehicle.documents as any)[key] as DocumentInfo;
            if (doc && doc.dateExpiration) {
              const expDate = new Date(doc.dateExpiration);
              if (!isNaN(expDate.getTime())) {
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
            }
          });
        }
      } catch (innerErr) {
        console.error("Erreur d'analyse des documents d'un véhicule :", innerErr);
      }
    });
  }
  return dbInstance;
}
