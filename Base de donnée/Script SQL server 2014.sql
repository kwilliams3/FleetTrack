/* =====================================================================
   SCRIPT DE CRÉATION ET D'INITIALISATION VIERGE - MICROSOFT SQL SERVER 2014
   Cible : Base de Données "FleetTrack"
   Utilisateur d'origine : Franck Administrateur (admin) uniquement
======================================================================== */

USE master;
GO

-- 1. Réinitialisation sécurisée de la Base de Données
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

-- =====================================================================
-- 2. CRÉATION DES TABLES RELATIONNELLES & CONTRAINTES
-- =====================================================================

-- Table [Utilisateurs] : Gestion des comptes système (Admin / Manager)
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

-- Table [Chauffeurs] : fiches d'identité des conducteurs de taxi / minibus
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

-- Table [Vehicules] : Répertoire de la flotte automobile
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

-- Table [DocumentsVehicules] : Suivi des assurances, cartes grises et visites techniques
CREATE TABLE [DocumentsVehicules] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [VehiculeId] NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES [Vehicules]([Id]) ON DELETE CASCADE,
    [TypeDocument] NVARCHAR(50) NOT NULL CHECK ([TypeDocument] IN ('Carte Grise', 'Assurance', 'Visite Technique', 'Licence Transport')),
    [NumeroDocument] NVARCHAR(50) NOT NULL,
    [DateExpiration] DATE NOT NULL,
    [FichierNom] NVARCHAR(150) NULL
);
GO

-- Table [AffectationsChauffeurVehicule] : Historique de qui conduit quoi
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

-- Table [ActivitesJournalieres] : Feuilles de route quotidiennes
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

-- Table [VersementsJournaliers] : Recettes journalières (Caisse)
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

-- Table [ChargesEtDepenses] : Pannes, carburants, vidanges, etc.
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

-- =====================================================================
-- 3. INITIALISATION DE L'ADMINISTRATEUR UNIQUE (Identifiant : admin)
-- =====================================================================
PRINT 'Insertion du compte Administrateur principal...';

INSERT INTO [Utilisateurs] ([Id], [NomComplet], [Identifiant], [Role], [EstActif], [Telephone], [ChauffeurAssocieId]) 
VALUES ('u-1', N'Franck Administrateur', 'admin', 'ADMIN', 1, N'+237 670 112 233', NULL);
GO

PRINT 'Base de Données FleetTrack initialisée avec succès !';