import { useState } from "react";
import { 
  Database, Copy, Check, Download, Info, Server, Terminal, AlertCircle 
} from "lucide-react";

export default function SqlExportView() {
  const [copied, setCopied] = useState(false);

  // T-SQL Schema compatible with SQL Server 2014
  const sqlStringSource = `/* =====================================================================
   SCHEMA DE CREATION DE BASE DE DONNEES - MICROSOFT SQL SERVER 2014
   Conforme T-SQL (Transact-SQL)
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
`;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(sqlStringSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Intro info box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/20">
            <Server className="h-3.5 w-3.5" />
            <span>Spécification Relational Database</span>
          </div>
          <h2 className="text-xl font-bold font-sans tracking-tight">
            Compatibilité Microsoft SQL Server 2014
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed font-sans">
            Pour installer l'application en milieu d'entreprise local avec le système <strong className="text-white">MS SQL Server 2014</strong>, 
            exécutez le script SQL ci-dessous dans <strong className="text-white font-mono">SQL Server Management Studio (SSMS)</strong>. 
            Il crée automatiquement la base <strong className="text-amber-500 font-mono">"FleetTrack"</strong>, injecte les contraintes intégrités de clés primaires/étrangères 
            et génère les tables prêtes à recevoir les données opérationnelles.
          </p>
        </div>

        <div className="flex flex-row md:flex-col gap-2 shrink-0">
          <a
            href="/api/export-sql"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger script (.sql)</span>
          </a>
          <button
            onClick={handleCopyToClipboard}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-sans text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Copié avec succès !</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copier le Code T-SQL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SQL Warning / Note information */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start space-x-3 text-xs leading-normal text-slate-600 font-sans">
        <Info className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900">Notes d'intégration SQL Server 2014 :</span>
          <p>
            Les relations de clés étrangères (<strong className="font-semibold text-slate-800">FOREIGN KEY</strong>) sont configurées pour garantir la cohérence d'intégrité référentielle en cascade ou en limitation.
            Le script inclut également des validations intégrées (<strong className="font-semibold text-slate-800">CHECK Constraints</strong>) pour restreindre les types de charges (carburant, panne, réparation, pneus) 
            et les profils utilisateurs (ADMIN, MANAGER) au niveau même du SGBDR pour une sécurité accrue.
          </p>
        </div>
      </div>

      {/* Code window */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
        <div className="px-5 py-3 border-b border-slate-850 flex items-center justify-between bg-slate-900/60 font-mono text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-amber-500" />
            <span>fleettrack_sqlserver2014.sql</span>
          </div>
          <button 
            onClick={handleCopyToClipboard}
            className="hover:text-white transition-colors"
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
        <div className="p-5 overflow-x-auto max-h-[450px]">
          <pre className="font-mono text-amber-50/90 text-xs leading-relaxed whitespace-pre font-medium pr-4 select-text">
            {sqlStringSource}
          </pre>
        </div>
      </div>

    </div>
  );
}
