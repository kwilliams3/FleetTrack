import { AppDatabase } from "./db";

export function generateSQLServerScript(db: AppDatabase): string {
  let script = `/* =====================================================================
   SCRIPT DE CREATION ET DE REMPLISSAGE DE SECURITE - MICROSOFT SQL SERVER 2014
   Généré le : 2026-06-12 (Date Système de la Flotte)
   Cible : Base de Données "FleetTrack"
======================================================================== */

USE master;
GO

-- 1. Création de la Base de Données
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'FleetTrack')
BEGIN
    ALTER DATABASE FleetTrack SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE FleetTrack;
END
GO

CREATE DATABASE FleetTrack;
GO

USE FleetTrack;
GO

-- 2. Création des Tables Relationnelles (Conforme SQL Server 2014)

-- Table [Utilisateurs]
CREATE TABLE [Utilisateurs] (
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [NomComplet] NVARCHAR(150) NOT NULL,
    [Identifiant] NVARCHAR(50) NOT NULL UNIQUE,
    [Role] NVARCHAR(20) NOT NULL CHECK ([Role] IN ('ADMIN', 'MANAGER')),
    [EstActif] BIT NOT NULL DEFAULT 1,
    [Telephone] NVARCHAR(30) NULL,
    [ChauffeurAssocieId] NVARCHAR(50) NULL
);
GO

-- Table [Chauffeurs]
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
GO

-- Table [Vehicules]
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
GO

-- Table [DocumentsVehicules]
CREATE TABLE [DocumentsVehicules] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [VehiculeId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Vehicules]([Id]) ON DELETE CASCADE,
    [TypeDocument] NVARCHAR(50) NOT NULL CHECK ([TypeDocument] IN ('Carte Grise', 'Assurance', 'Visite Technique', 'Licence Transport')),
    [NumeroDocument] NVARCHAR(50) NOT NULL,
    [DateExpiration] DATE NOT NULL,
    [FichierNom] NVARCHAR(150) NULL
);
GO

-- Table [AffectationsChauffeurVehicule]
CREATE TABLE [AffectationsChauffeurVehicule] (
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [VehiculeId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Vehicules]([Id]),
    [ChauffeurId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Chauffeurs]([Id]),
    [DateDebut] DATE NOT NULL,
    [DateFin] DATE NULL,
    [Statut] NVARCHAR(20) NOT NULL CHECK ([Statut] IN ('En cours', 'Historique')),
    [Remarque] NVARCHAR(500) NULL
);
GO

-- Table [ActivitesJournalieres]
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
GO

-- Table [VersementsJournaliers]
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
GO

-- Table [ChargesEtDepenses]
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
GO

-- 3. Insertion des Données Réelles de l'Application (T-SQL)
PRINT 'Remplissage des tables...';

`;

  // Insert users
  db.users.forEach(u => {
    script += `INSERT INTO [Utilisateurs] ([Id], [NomComplet], [Identifiant], [Role], [EstActif], [Telephone], [ChauffeurAssocieId]) VALUES ('${u.id}', N'${u.name.replace(/'/g, "''")}', '${u.username}', '${u.role}', ${u.isActive ? 1 : 0}, ${u.phone ? "N'" + u.phone + "'" : "NULL"}, NULL);\n`;
  });
  script += "GO\n\n";

  // Insert chauffeurs
  db.chauffeurs.forEach(c => {
    script += `INSERT INTO [Chauffeurs] ([Id], [Nom], [Prenom], [Telephone], [Adresse], [NumeroPermis], [ExpirationPermis], [PhotoUrl], [EstActif], [VehiculeAttribueId]) VALUES ('${c.id}', N'${c.nom.replace(/'/g, "''")}', N'${c.prenom.replace(/'/g, "''")}', '${c.telephone}', N'${c.adresse.replace(/'/g, "''")}', '${c.numPermis}', '${c.expPermis}', '${c.photo}', ${c.isActive ? 1 : 0}, ${c.vehiculeId ? "'" + c.vehiculeId + "'" : "NULL"});\n`;
  });
  script += "GO\n\n";

  // Insert vehicles
  db.vehicles.forEach(v => {
    script += `INSERT INTO [Vehicules] ([Id], [Immatriculation], [Marque], [Modele], [Annee], [Couleur], [NumeroChassis], [Etat], [DateAcquisition], [MontantJournalier]) VALUES ('${v.id}', '${v.immatriculation}', N'${v.marque.replace(/'/g, "''")}', N'${v.modele.replace(/'/g, "''")}', ${v.annee || "NULL"}, ${v.couleur ? "N'" + v.couleur.replace(/'/g, "''") + "'" : "NULL"}, ${v.chassis ? "'" + v.chassis + "'" : "NULL"}, '${v.etat}', ${v.dateAcquisition ? "'" + v.dateAcquisition + "'" : "NULL"}, ${v.montantJournalier});\n`;
  });
  script += "GO\n\n";

  // Insert vehicle documents
  db.vehicles.forEach(v => {
    const docKeys = ['carteGrise', 'assurance', 'visiteTechnique', 'licenceTransport'];
    docKeys.forEach(k => {
      const doc = (v.documents as any)[k];
      if (doc) {
        const typeLabel = k === 'carteGrise' ? 'Carte Grise' : k === 'assurance' ? 'Assurance' : k === 'visiteTechnique' ? 'Visite Technique' : 'Licence Transport';
        script += `INSERT INTO [DocumentsVehicules] ([VehiculeId], [TypeDocument], [NumeroDocument], [DateExpiration], [FichierNom]) VALUES ('${v.id}', N'${typeLabel}', '${doc.numero}', '${doc.dateExpiration}', ${doc.nomFichier ? "N'" + doc.nomFichier.replace(/'/g, "''") + "'" : "NULL"});\n`;
      }
    });
  });
  script += "GO\n\n";

  // Insert assignments
  db.assignments.forEach(a => {
    script += `INSERT INTO [AffectationsChauffeurVehicule] ([Id], [VehiculeId], [ChauffeurId], [DateDebut], [DateFin], [Statut], [Remarque]) VALUES ('${a.id}', '${a.vehiculeId}', '${a.chauffeurId}', '${a.dateDebut}', ${a.dateFin ? "'" + a.dateFin + "'" : "NULL"}, '${a.statut}', ${a.remarque ? "N'" + a.remarque.replace(/'/g, "''") + "'" : "NULL"});\n`;
  });
  script += "GO\n\n";

  // Insert activities
  db.activities.forEach(ac => {
    script += `INSERT INTO [ActivitesJournalieres] ([Id], [DateActivite], [ChauffeurId], [VehiculeId], [Present], [HeureDebut], [HeureFin], [KilometrageJournalier], [EtatVehicule], [Observations]) VALUES ('${ac.id}', '${ac.date}', '${ac.chauffeurId}', '${ac.vehiculeId}', ${ac.present ? 1 : 0}, ${ac.heureDebut ? "'" + ac.heureDebut + "'" : "NULL"}, ${ac.heureFin ? "'" + ac.heureFin + "'" : "NULL"}, ${ac.kilometrageJournalier || "NULL"}, ${ac.etatVehicule ? "N'" + ac.etatVehicule.replace(/'/g, "''") + "'" : "NULL"}, ${ac.observations ? "N'" + ac.observations.replace(/'/g, "''") + "'" : "NULL"});\n`;
  });
  script += "GO\n\n";

  // Insert payments
  db.payments.forEach(p => {
    script += `INSERT INTO [VersementsJournaliers] ([Id], [DateVersement], [VehiculeId], [ChauffeurId], [MontantAttendu], [MontantVerse], [Ecart], [MoyenPaiement], [StatutValidation], [Provenance], [MotifRefus]) VALUES ('${p.id}', '${p.date}', '${p.vehiculeId}', '${p.chauffeurId}', ${p.montantAttendu}, ${p.montantVerse}, ${p.ecart}, N'${p.moyenPaiement}', '${p.statut}', '${p.provenance}', ${p.motifRefus ? "N'" + p.motifRefus.replace(/'/g, "''") + "'" : "NULL"});\n`;
  });
  script += "GO\n\n";

  // Insert expenses
  db.expenses.forEach(c => {
    script += `INSERT INTO [ChargesEtDepenses] ([Id], [DateDepense], [VehiculeId], [ChauffeurId], [TypeCharge], [Description], [Montant], [JustificatifNom], [StatutValidation], [MotifRefus]) VALUES ('${c.id}', '${c.date}', '${c.vehiculeId}', '${c.chauffeurId}', N'${c.typeCharge}', N'${c.description.replace(/'/g, "''")}', ${c.montant}, ${c.justificatif ? "N'" + c.justificatif.replace(/'/g, "''") + "'" : "NULL"}, '${c.statut}', ${c.motifRefus ? "N'" + c.motifRefus.replace(/'/g, "''") + "'" : "NULL"});\n`;
  });
  script += "GO\n\n";

  // Add some simple audit queries at the bottom
  script += `/* =====================================================================
   REQUETES DE SYNTHESE ET DE RENTABILITE (SQL SERVER 2014)
======================================================================== */

-- 1. Calcul de la rentabilité globale par véhicule
SELECT 
    v.Immatriculation,
    v.Marque,
    v.Modele,
    v.MontantJournalier AS [Taux Journalier],
    ISNULL(SUM(p.MontantVerse), 0) AS [Total Versements (FCFA)],
    ISNULL(SUM(e.Montant), 0) AS [Total Dépenses (FCFA)],
    (ISNULL(SUM(p.MontantVerse), 0) - ISNULL(SUM(e.Montant), 0)) AS [Rentabilité Net (FCFA)]
FROM [Vehicules] v
LEFT JOIN [VersementsJournaliers] p ON v.Id = p.VehiculeId AND p.StatutValidation = 'Validé'
LEFT JOIN [ChargesEtDepenses] e ON v.Id = e.VehiculeId AND e.StatutValidation = 'Validé'
GROUP BY v.Id, v.Immatriculation, v.Marque, v.Modele, v.MontantJournalier
ORDER BY [Rentabilité Net (FCFA)] DESC;
GO
`;

  return script;
}
