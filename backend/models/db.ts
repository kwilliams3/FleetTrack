import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import mssql from "mssql";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { 
  Vehicle, Chauffeur, Versement, Charge, ActivityLog, AffectationHistory, User, DocumentInfo, UserRole 
} from "../../src/types";

// Load local environment variables
dotenv.config();

// SQL Server 2014 Configuration
const dbConfig = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "AZERTY123",
  server: process.env.DB_SERVER || "KING-WILLIAMS",
  port: parseInt(process.env.DB_PORT || "1433"),
  database: process.env.DB_DATABASE || "FleetTrack",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    connectTimeout: 4000 // 4 seconds timeout to fail fast inside container environment
  }
};

let mssqlPool: mssql.ConnectionPool | null = null;
let mssqlConnected = false;

// Safely initialize Firebase Admin
let firestoreDb: any = null;

try {
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
} catch (error) {
  console.error("Erreur de configuration Firebase Admin:", error);
}

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
 * Connects to Microsoft SQL Server 2014 or returns the active connection pool.
 * If connection is unreachable, returns null.
 */
export async function getMssqlPool(): Promise<mssql.ConnectionPool | null> {
  if (mssqlConnected && mssqlPool) {
    return mssqlPool;
  }
  
  try {
    console.log(`Connecting to SQL Server 2014 at ${dbConfig.server}:${dbConfig.port}...`);
    const pool = await mssql.connect(dbConfig);
    console.log("⚡ Connecté avec succès à Microsoft SQL Server 2014 !");
    await ensureDatabaseSchema(pool);
    mssqlPool = pool;
    mssqlConnected = true;
    return mssqlPool;
  } catch (error: any) {
    console.warn(`[SQL Server Connection Warning] Impossible de se connecter à la base SQL Server 2014 de King-Williams. Message: ${error?.message}`);
    console.log("👉 L'application bascule automatiquement sur la base cloud Firestore pour assurer une prévisualisation de l'application fluide.");
    mssqlConnected = false;
    mssqlPool = null;
    return null;
  }
}

/**
 * Automatically set up schemas and default rows on Microsoft SQL Server 2014
 */
async function ensureDatabaseSchema(pool: mssql.ConnectionPool): Promise<void> {
  try {
    const request = pool.request();
    
    // Check if table [Utilisateurs] exists
    const checkTable = await request.query(`SELECT * FROM sys.tables WHERE name = 'Utilisateurs'`);
    if (checkTable.recordset.length === 0) {
      console.log("Schéma MSSQL vide. Exécution de l'initialisation du schéma pour SQL Server 2014...");
      
      await request.query(`
        CREATE TABLE [Utilisateurs] (
            [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
            [NomComplet] NVARCHAR(150) NOT NULL,
            [Identifiant] NVARCHAR(50) NOT NULL UNIQUE,
            [Role] NVARCHAR(20) NOT NULL CHECK ([Role] IN ('ADMIN', 'MANAGER')),
            [EstActif] BIT NOT NULL DEFAULT 1,
            [Telephone] NVARCHAR(30) NULL,
            [ChauffeurAssocieId] NVARCHAR(50) NULL
        );
      `);
      
      await request.query(`
        CREATE TABLE [Chauffeurs] (
            [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
            [Nom] NVARCHAR(100) NOT NULL,
            [Prenom] NVARCHAR(100) NOT NULL,
            [Telephone] NVARCHAR(30) NOT NULL,
            [Adresse] NVARCHAR(250) NOT NULL,
            [NumeroPermis] NVARCHAR(50) NOT NULL,
            [ExpirationPermis] DATE NOT NULL,
            [PhotoUrl] NVARCHAR(250) NULL,
            [EstActif] BIT NOT NULL DEFAULT 1,
            [VehiculeAttribueId] NVARCHAR(50) NULL
        );
      `);

      await request.query(`
        CREATE TABLE [Vehicules] (
            [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
            [Immatriculation] NVARCHAR(30) NOT NULL UNIQUE,
            [Marque] NVARCHAR(50) NOT NULL,
            [Modele] NVARCHAR(50) NOT NULL,
            [Annee] INT NULL,
            [Couleur] NVARCHAR(30) NULL,
            [NumeroChassis] NVARCHAR(80) NULL,
            [Etat] NVARCHAR(20) NOT NULL CHECK ([Etat] IN ('excellent', 'bon', 'moyen', 'en_panne', 'en_reparation')),
            [DateAcquisition] DATE NULL,
            [MontantJournalier] DECIMAL(18, 2) NOT NULL DEFAULT 10000.00
        );
      `);

      await request.query(`
        CREATE TABLE [DocumentsVehicules] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [VehiculeId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Vehicules]([Id]) ON DELETE CASCADE,
            [TypeDocument] NVARCHAR(50) NOT NULL CHECK ([TypeDocument] IN ('Carte Grise', 'Assurance', 'Visite Technique', 'Licence Transport')),
            [NumeroDocument] NVARCHAR(50) NOT NULL,
            [DateExpiration] DATE NOT NULL,
            [FichierNom] NVARCHAR(150) NULL
        );
      `);

      await request.query(`
        CREATE TABLE [AffectationsChauffeurVehicule] (
            [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
            [VehiculeId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Vehicules]([Id]),
            [ChauffeurId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Chauffeurs]([Id]),
            [DateDebut] DATE NOT NULL,
            [DateFin] DATE NULL,
            [Statut] NVARCHAR(20) NOT NULL CHECK ([Statut] IN ('En cours', 'Historique')),
            [Remarque] NVARCHAR(500) NULL
        );
      `);

      await request.query(`
        CREATE TABLE [ActivitesJournalieres] (
            [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
            [DateActivite] DATE NOT NULL,
            [ChauffeurId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Chauffeurs]([Id]),
            [VehiculeId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Vehicules]([Id]),
            [Present] BIT NOT NULL DEFAULT 1,
            [HeureDebut] NVARCHAR(10) NULL,
            [HeureFin] NVARCHAR(10) NULL,
            [KilometrageJournalier] INT NULL,
            [EtatVehicule] NVARCHAR(100) NULL,
            [Observations] NVARCHAR(500) NULL
        );
      `);

      await request.query(`
        CREATE TABLE [VersementsJournaliers] (
            [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
            [DateVersement] DATE NOT NULL,
            [VehiculeId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Vehicules]([Id]),
            [ChauffeurId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Chauffeurs]([Id]),
            [MontantAttendu] DECIMAL(18, 2) NOT NULL,
            [MontantVerse] DECIMAL(18, 2) NOT NULL,
            [Ecart] DECIMAL(18, 2) NOT NULL,
            [MoyenPaiement] NVARCHAR(50) NOT NULL CHECK ([MoyenPaiement] IN ('MTN Mobile Money', 'Orange Money', 'Espèces (Cash)')),
            [StatutValidation] NVARCHAR(25) NOT NULL CHECK ([StatutValidation] IN ('En attente', 'Validé', 'Refusé')),
            [Provenance] NVARCHAR(20) NOT NULL CHECK ([Provenance] IN ('Chauffeur', 'Administration')),
            [MotifRefus] NVARCHAR(250) NULL
        );
      `);

      await request.query(`
        CREATE TABLE [ChargesEtDepenses] (
            [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
            [DateDepense] DATE NOT NULL,
            [VehiculeId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Vehicules]([Id]),
            [ChauffeurId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Chauffeurs]([Id]),
            [TypeCharge] NVARCHAR(100) NOT NULL CHECK ([TypeCharge] IN ('Panne mécanique', 'Réparation', 'Entretien', 'Carburant', 'Pneus', 'Vidange', 'Pièces de rechange', 'Autre')),
            [Description] NVARCHAR(500) NOT NULL,
            [Montant] DECIMAL(18, 2) NOT NULL,
            [JustificatifNom] NVARCHAR(150) NULL,
            [StatutValidation] NVARCHAR(25) NOT NULL CHECK ([StatutValidation] IN ('En attente', 'Validé', 'Refusé')),
            [MotifRefus] NVARCHAR(250) NULL
        );
      `);

      // Seed default user
      console.log("Seeding d'un compte administrateur par défaut dans SQL Server 2014...");
      await request.query(`
        INSERT INTO [Utilisateurs] ([Id], [NomComplet], [Identifiant], [Role], [EstActif], [Telephone], [ChauffeurAssocieId])
        VALUES ('u-1', N'Franck Administrateur', 'admin', 'ADMIN', 1, '+237 670 112 233', NULL);
      `);
      console.log("Schéma MSSQL configuré et initialisé avec succès !");
    }
  } catch (error) {
    console.error("Erreur d'initialisation du schéma SQL Server :", error);
  }
}

/**
 * Fetch and construct DB from MSSQL
 */
export async function readDBFromMssql(): Promise<AppDatabase> {
  const pool = await getMssqlPool();
  if (!pool) {
    throw new Error("Base MSSQL non connectée.");
  }

  const transaction = pool.request();
  
  // 1. Fetch users
  const usersRes = await transaction.query(`SELECT * FROM [Utilisateurs]`);
  const users: User[] = usersRes.recordset.map(row => ({
    id: row.Id,
    name: row.NomComplet,
    username: row.Identifiant,
    role: row.Role as UserRole,
    isActive: row.EstActif === true || row.EstActif === 1,
    phone: row.Telephone || undefined
  }));

  // 2. Fetch chauffeurs
  const chauffeursRes = await transaction.query(`SELECT * FROM [Chauffeurs]`);
  const chauffeurs: Chauffeur[] = chauffeursRes.recordset.map(row => ({
    id: row.Id,
    nom: row.Nom,
    prenom: row.Prenom,
    telephone: row.Telephone,
    adresse: row.Adresse,
    numPermis: row.NumeroPermis,
    expPermis: row.ExpirationPermis ? new Date(row.ExpirationPermis).toISOString().split('T')[0] : "",
    photo: row.PhotoUrl || "",
    isActive: row.EstActif === true || row.EstActif === 1,
    vehiculeId: row.VehiculeAttribueId || undefined
  }));

  // 3. Fetch documents of vehicles
  const docsRes = await transaction.query(`SELECT * FROM [DocumentsVehicules]`);
  const allDocs = docsRes.recordset;

  // 4. Fetch vehicles
  const vehiclesRes = await transaction.query(`SELECT * FROM [Vehicules]`);
  const vehicles: Vehicle[] = vehiclesRes.recordset.map(row => {
    const vDocs = allDocs.filter(d => d.VehiculeId === row.Id);
    
    const getDocInfo = (type: string) => {
      const d = vDocs.find(x => x.TypeDocument === type);
      if (!d) return { numero: "", dateExpiration: "", statut: "valide" as const };
      return {
        numero: d.NumeroDocument,
        dateExpiration: d.DateExpiration ? new Date(d.DateExpiration).toISOString().split('T')[0] : "",
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
      dateAcquisition: row.DateAcquisition ? new Date(row.DateAcquisition).toISOString().split('T')[0] : undefined,
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
  const assignmentsRes = await transaction.query(`SELECT * FROM [AffectationsChauffeurVehicule]`);
  const assignments: AffectationHistory[] = assignmentsRes.recordset.map(row => {
    const vehicle = vehicles.find(v => v.id === row.VehiculeId);
    const chauffeur = chauffeurs.find(c => c.id === row.ChauffeurId);
    return {
      id: row.Id,
      vehiculeId: row.VehiculeId,
      matricule: vehicle?.immatriculation || "Inconnue",
      modeleVehicule: vehicle ? `${vehicle.marque} ${vehicle.modele}` : "Inconnu",
      chauffeurId: row.ChauffeurId,
      nomChauffeur: chauffeur ? `${chauffeur.nom} ${chauffeur.prenom}` : "Inconnu",
      dateDebut: row.DateDebut ? new Date(row.DateDebut).toISOString().split('T')[0] : "",
      dateFin: row.DateFin ? new Date(row.DateFin).toISOString().split('T')[0] : undefined,
      statut: row.Statut as any,
      remarque: row.Remarque || undefined
    };
  });

  // 6. Fetch activities
  const activitiesRes = await transaction.query(`SELECT * FROM [ActivitesJournalieres]`);
  const activities: ActivityLog[] = activitiesRes.recordset.map(row => {
    const vehicle = vehicles.find(v => v.id === row.VehiculeId);
    const chauffeur = chauffeurs.find(c => c.id === row.ChauffeurId);
    return {
      id: row.Id,
      date: row.DateActivite ? new Date(row.DateActivite).toISOString().split('T')[0] : "",
      chauffeurId: row.ChauffeurId,
      nomChauffeur: chauffeur ? `${chauffeur.nom} ${chauffeur.prenom}` : "Inconnu",
      vehiculeId: row.VehiculeId,
      matricule: vehicle?.immatriculation || "Aucun véhicule",
      present: row.Present === true || row.Present === 1,
      heureDebut: row.HeureDebut || undefined,
      heureFin: row.HeureFin || undefined,
      kilometrageJournalier: row.KilometrageJournalier !== null ? Number(row.KilometrageJournalier) : undefined,
      etatVehicule: row.EtatVehicule || undefined,
      observations: row.Observations || undefined
    };
  });

  // 7. Fetch payments
  const paymentsRes = await transaction.query(`SELECT * FROM [VersementsJournaliers]`);
  const payments: Versement[] = paymentsRes.recordset.map(row => {
    const vehicle = vehicles.find(v => v.id === row.VehiculeId);
    const chauffeur = chauffeurs.find(c => c.id === row.ChauffeurId);
    return {
      id: row.Id,
      date: row.DateVersement ? new Date(row.DateVersement).toISOString().split('T')[0] : "",
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
  const expensesRes = await transaction.query(`SELECT * FROM [ChargesEtDepenses]`);
  const expenses: Charge[] = expensesRes.recordset.map(row => {
    const vehicle = vehicles.find(v => v.id === row.VehiculeId);
    const chauffeur = chauffeurs.find(c => c.id === row.ChauffeurId);
    return {
      id: row.Id,
      date: row.DateDepense ? new Date(row.DateDepense).toISOString().split('T')[0] : "",
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
 * Write full database structure to MSSQL
 */
export async function writeDBToMssql(data: AppDatabase): Promise<void> {
  const pool = await getMssqlPool();
  if (!pool) {
    throw new Error("Base MSSQL non connectée.");
  }

  // Use a transaction scope or simple request deletions for simplicity & speed in SQL Server
  const request = pool.request();
  
  // Clean all records safely in foreign key sequence
  await request.query(`
    DELETE FROM [DocumentsVehicules];
    DELETE FROM [ActivitesJournalieres];
    DELETE FROM [VersementsJournaliers];
    DELETE FROM [ChargesEtDepenses];
    DELETE FROM [AffectationsChauffeurVehicule];
    DELETE FROM [Utilisateurs];
    DELETE FROM [Chauffeurs];
    DELETE FROM [Vehicules];
  `);

  // Insert Users
  for (const u of data.users) {
    const req = pool.request();
    req.input("id", mssql.NVarChar(50), u.id);
    req.input("name", mssql.NVarChar(150), u.name);
    req.input("username", mssql.NVarChar(50), u.username);
    req.input("role", mssql.NVarChar(20), u.role);
    req.input("isActive", mssql.Bit, u.isActive ? 1 : 0);
    req.input("phone", mssql.NVarChar(30), u.phone || null);
    await req.query(`
      INSERT INTO [Utilisateurs] ([Id], [NomComplet], [Identifiant], [Role], [EstActif], [Telephone], [ChauffeurAssocieId])
      VALUES (@id, @name, @username, @role, @isActive, @phone, NULL)
    `);
  }

  // Insert Vehicles
  for (const v of data.vehicles) {
    const req = pool.request();
    req.input("id", mssql.NVarChar(50), v.id);
    req.input("immatriculation", mssql.NVarChar(30), v.immatriculation);
    req.input("marque", mssql.NVarChar(50), v.marque);
    req.input("modele", mssql.NVarChar(50), v.modele);
    req.input("annee", mssql.Int, v.annee || null);
    req.input("couleur", mssql.NVarChar(30), v.couleur || null);
    req.input("chassis", mssql.NVarChar(80), v.chassis || null);
    req.input("etat", mssql.NVarChar(20), v.etat);
    req.input("dateAcquisition", mssql.Date, v.dateAcquisition || null);
    req.input("montantJournalier", mssql.Decimal(18, 2), v.montantJournalier);
    await req.query(`
      INSERT INTO [Vehicules] ([Id], [Immatriculation], [Marque], [Modele], [Annee], [Couleur], [NumeroChassis], [Etat], [DateAcquisition], [MontantJournalier])
      VALUES (@id, @immatriculation, @marque, @modele, @annee, @couleur, @chassis, @etat, @dateAcquisition, @montantJournalier)
    `);

    // Insert Documents
    const docKeys = ['carteGrise', 'assurance', 'visiteTechnique', 'licenceTransport'];
    for (const key of docKeys) {
      const doc = (v.documents as any)[key];
      if (doc && doc.numero) {
        const typeLabel = key === 'carteGrise' ? 'Carte Grise' : key === 'assurance' ? 'Assurance' : key === 'visiteTechnique' ? 'Visite Technique' : 'Licence Transport';
        const dReq = pool.request();
        dReq.input("vehiculeId", mssql.NVarChar(50), v.id);
        dReq.input("typeDocument", mssql.NVarChar(50), typeLabel);
        dReq.input("numeroDocument", mssql.NVarChar(50), doc.numero);
        dReq.input("dateExpiration", mssql.Date, doc.dateExpiration);
        dReq.input("fichierNom", mssql.NVarChar(150), doc.nomFichier || null);
        await dReq.query(`
          INSERT INTO [DocumentsVehicules] ([VehiculeId], [TypeDocument], [NumeroDocument], [DateExpiration], [FichierNom])
          VALUES (@vehiculeId, @typeDocument, @numeroDocument, @dateExpiration, @fichierNom)
        `);
      }
    }
  }

  // Insert Chauffeurs
  for (const c of data.chauffeurs) {
    const req = pool.request();
    req.input("id", mssql.NVarChar(50), c.id);
    req.input("nom", mssql.NVarChar(100), c.nom);
    req.input("prenom", mssql.NVarChar(100), c.prenom);
    req.input("telephone", mssql.NVarChar(30), c.telephone);
    req.input("adresse", mssql.NVarChar(250), c.adresse);
    req.input("numPermis", mssql.NVarChar(50), c.numPermis);
    req.input("expPermis", mssql.Date, c.expPermis);
    req.input("photo", mssql.NVarChar(250), c.photo);
    req.input("isActive", mssql.Bit, c.isActive ? 1 : 0);
    req.input("vehiculeId", mssql.NVarChar(50), c.vehiculeId || null);
    await req.query(`
      INSERT INTO [Chauffeurs] ([Id], [Nom], [Prenom], [Telephone], [Adresse], [NumeroPermis], [ExpirationPermis], [PhotoUrl], [EstActif], [VehiculeAttribueId])
      VALUES (@id, @nom, @prenom, @telephone, @adresse, @numPermis, @expPermis, @photo, @isActive, @vehiculeId)
    `);
  }

  // Insert Assignments
  for (const a of data.assignments) {
    const req = pool.request();
    req.input("id", mssql.NVarChar(50), a.id);
    req.input("vehiculeId", mssql.NVarChar(50), a.vehiculeId);
    req.input("chauffeurId", mssql.NVarChar(50), a.chauffeurId);
    req.input("dateDebut", mssql.Date, a.dateDebut);
    req.input("dateFin", mssql.Date, a.dateFin || null);
    req.input("statut", mssql.NVarChar(20), a.statut);
    req.input("remarque", mssql.NVarChar(500), a.remarque || null);
    await req.query(`
      INSERT INTO [AffectationsChauffeurVehicule] ([Id], [VehiculeId], [ChauffeurId], [DateDebut], [DateFin], [Statut], [Remarque])
      VALUES (@id, @vehiculeId, @chauffeurId, @dateDebut, @dateFin, @statut, @remarque)
    `);
  }

  // Insert Activities
  for (const ac of data.activities) {
    const req = pool.request();
    req.input("id", mssql.NVarChar(50), ac.id);
    req.input("date", mssql.Date, ac.date);
    req.input("chauffeurId", mssql.NVarChar(50), ac.chauffeurId);
    req.input("vehiculeId", mssql.NVarChar(50), ac.vehiculeId);
    req.input("present", mssql.Bit, ac.present ? 1 : 0);
    req.input("heureDebut", mssql.NVarChar(10), ac.heureDebut || null);
    req.input("heureFin", mssql.NVarChar(10), ac.heureFin || null);
    req.input("kilometrage", mssql.Int, ac.kilometrageJournalier !== undefined ? ac.kilometrageJournalier : null);
    req.input("etatVehicule", mssql.NVarChar(100), ac.etatVehicule || null);
    req.input("observations", mssql.NVarChar(500), ac.observations || null);
    await req.query(`
      INSERT INTO [ActivitesJournalieres] ([Id], [DateActivite], [ChauffeurId], [VehiculeId], [Present], [HeureDebut], [HeureFin], [KilometrageJournalier], [EtatVehicule], [Observations])
      VALUES (@id, @date, @chauffeurId, @vehiculeId, @present, @heureDebut, @heureFin, @kilometrage, @etatVehicule, @observations)
    `);
  }

  // Insert Payments
  for (const p of data.payments) {
    const req = pool.request();
    req.input("id", mssql.NVarChar(50), p.id);
    req.input("date", mssql.Date, p.date);
    req.input("vehiculeId", mssql.NVarChar(50), p.vehiculeId);
    req.input("chauffeurId", mssql.NVarChar(50), p.chauffeurId);
    req.input("montantAttendu", mssql.Decimal(18, 2), p.montantAttendu);
    req.input("montantVerse", mssql.Decimal(18, 2), p.montantVerse);
    req.input("ecart", mssql.Decimal(18, 2), p.ecart);
    req.input("moyenPaiement", mssql.NVarChar(50), p.moyenPaiement);
    req.input("statut", mssql.NVarChar(25), p.statut);
    req.input("provenance", mssql.NVarChar(20), p.provenance);
    req.input("motifRefus", mssql.NVarChar(250), p.motifRefus || null);
    await req.query(`
      INSERT INTO [VersementsJournaliers] ([Id], [DateVersement], [VehiculeId], [ChauffeurId], [MontantAttendu], [MontantVerse], [Ecart], [MoyenPaiement], [StatutValidation], [Provenance], [MotifRefus])
      VALUES (@id, @date, @vehiculeId, @chauffeurId, @montantAttendu, @montantVerse, @ecart, @moyenPaiement, @statut, @provenance, @motifRefus)
    `);
  }

  // Insert Expenses
  for (const e of data.expenses) {
    const req = pool.request();
    req.input("id", mssql.NVarChar(50), e.id);
    req.input("date", mssql.Date, e.date);
    req.input("vehiculeId", mssql.NVarChar(50), e.vehiculeId);
    req.input("chauffeurId", mssql.NVarChar(50), e.chauffeurId);
    req.input("typeCharge", mssql.NVarChar(100), e.typeCharge);
    req.input("description", mssql.NVarChar(500), e.description);
    req.input("montant", mssql.Decimal(18, 2), e.montant);
    req.input("justificatif", mssql.NVarChar(150), e.justificatif || null);
    req.input("statut", mssql.NVarChar(25), e.statut);
    req.input("motifRefus", mssql.NVarChar(250), e.motifRefus || null);
    await req.query(`
      INSERT INTO [ChargesEtDepenses] ([Id], [DateDepense], [VehiculeId], [ChauffeurId], [TypeCharge], [Description], [Montant], [JustificatifNom], [StatutValidation], [MotifRefus])
      VALUES (@id, @date, @vehiculeId, @chauffeurId, @typeCharge, @description, @montant, @justificatif, @statut, @motifRefus)
    `);
  }
}

/**
 * Backup / Fallback helper to write to Firestore
 */
async function writeDBToFirestore(data: AppDatabase): Promise<void> {
  if (!firestoreDb) {
    return;
  }
  const listKeys = ["users", "vehicles", "chauffeurs", "assignments", "activities", "payments", "expenses"];
  await Promise.all(
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
  // 1. Try SQL Server 2014 first
  try {
    const pool = await getMssqlPool();
    if (pool) {
      console.log("📂 Lecture des données depuis SQL Server 2014...");
      const data = await readDBFromMssql();
      return processDocumentValidity(data);
    }
  } catch (err: any) {
    console.error("⚠️ SQL Server 2014: Échec de lecture, repli sur Firestore.", err?.message);
  }

  // 2. Fall back to Cloud Firestore
  try {
    console.log("📂 Lecture des données de repli depuis Cloud Firestore...");
    if (!firestoreDb) {
      console.error("Base de données Firestore non initialisée. Retour de la DB par défaut.");
      return INITIAL_DATABASE;
    }

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
  let mssqlSuccess = false;

  // 1. Try to sync to MS SQL Server
  try {
    const pool = await getMssqlPool();
    if (pool) {
      console.log("💾 Sauvegarde en cours sur SQL Server 2014...");
      await writeDBToMssql(data);
      mssqlSuccess = true;
      console.log("⚡ Succès de la sauvegarde sur SQL Server 2014.");
    }
  } catch (err: any) {
    console.error("⚠️ Erreur lors de la sauvegarde sur SQL Server 2014 :", err?.message);
  }

  // 2. Always backup to Cloud Firestore as a warm-standby clone for real-time web previews!
  try {
    console.log("💾 Synchronisation de sauvegarde en cours sur Cloud Firestore...");
    await writeDBToFirestore(data);
    if (!mssqlSuccess) {
      console.log("⚡ Succès de la sauvegarde de repli sur Cloud Firestore.");
    }
  } catch (err) {
    console.error("Erreur de synchronisation Firestore :", err);
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
