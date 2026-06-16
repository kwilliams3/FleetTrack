import { useState } from "react";
import { 
  Database, Copy, Check, Download, Info, Server, Terminal, AlertCircle 
} from "lucide-react";

export default function SqlExportView() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"mssql" | "mysql">("mysql");

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
GO`;

  // Standard creation schema for MySQL
  const mysqlStringSource = `/* =====================================================================
   SCHEMA DE CREATION DE BASE DE DONNEES - MYSQL
   Conforme Standard SQL & InnoDB engine
======================================================================== */

CREATE DATABASE IF NOT EXISTS \`FleetTrack\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`FleetTrack\`;

-- Table \`Utilisateurs\`
CREATE TABLE \`Utilisateurs\` (
    \`Id\` VARCHAR(50) NOT NULL PRIMARY KEY,
    \`NomComplet\` VARCHAR(150) NOT NULL,
    \`Identifiant\` VARCHAR(50) NOT NULL UNIQUE,
    \`Role\` VARCHAR(20) NOT NULL CHECK (\`Role\` IN ('ADMIN', 'MANAGER')),
    \`EstActif\` TINYINT(1) NOT NULL DEFAULT 1,
    \`Telephone\` VARCHAR(30) NULL,
    \`ChauffeurAssocieId\` VARCHAR(50) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table \`Chauffeurs\`
CREATE TABLE \`Chauffeurs\` (
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

-- Table \`Vehicules\`
CREATE TABLE \`Vehicules\` (
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

-- Table \`DocumentsVehicules\`
CREATE TABLE \`DocumentsVehicules\` (
    \`Id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`VehiculeId\` VARCHAR(50) NOT NULL,
    \`TypeDocument\` VARCHAR(50) NOT NULL CHECK (\`TypeDocument\` IN ('Carte Grise', 'Assurance', 'Visite Technique', 'Licence Transport')),
    \`NumeroDocument\` VARCHAR(50) NOT NULL,
    \`DateExpiration\` DATE NOT NULL,
    \`FichierNom\` VARCHAR(150) NULL,
    CONSTRAINT \`fk_documents_vehicle\` FOREIGN KEY (\`VehiculeId\`) REFERENCES \`Vehicules\` (\`Id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table \`AffectationsChauffeurVehicule\`
CREATE TABLE \`AffectationsChauffeurVehicule\` (
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

-- Table \`ActivitesJournalieres\`
CREATE TABLE \`ActivitesJournalieres\` (
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

-- Table \`VersementsJournaliers\`
CREATE TABLE \`VersementsJournaliers\` (
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

-- Table \`ChargesEtDepenses\`
CREATE TABLE \`ChargesEtDepenses\` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  const activeSource = activeTab === "mysql" ? mysqlStringSource : sqlStringSource;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(activeSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Intro info box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-500/20">
            <Server className="h-3.5 w-3.5" />
            <span>Spécification Bases de Données</span>
          </div>
          <h2 className="text-xl font-bold font-sans tracking-tight">
            Structure & Export Relational Database
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed font-sans">
            Pour installer l'application en milieu d'entreprise local avec votre propre serveur, exécutez le script ci-dessous.
            Il crée automatiquement l'ensemble des contraintes d'intégrité, contraintes de vérification (<strong className="text-white">CHECK</strong>) 
            et génère les tables prêtes à recevoir les données opérationnelles.
          </p>
        </div>

        <div className="flex flex-row md:flex-col gap-2 shrink-0">
          <a
            href={activeTab === "mysql" ? "/api/export-mysql" : "/api/export-sql"}
            className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-sans text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5"
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
                <span>Copier le Code {activeTab === "mysql" ? "MySQL" : "T-SQL"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs bar selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("mysql")}
          className={`px-5 py-2.5 font-semibold text-xs transition-all border-b-2 font-sans ${
            activeTab === "mysql" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          🔑 Schéma MySQL (Recommandé)
        </button>
        <button
          onClick={() => setActiveTab("mssql")}
          className={`px-5 py-2.5 font-semibold text-xs transition-all border-b-2 font-sans ${
            activeTab === "mssql" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          🗄️ Schéma Microsoft SQL Server 2014
        </button>
      </div>

      {/* SQL Warning / Note information */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start space-x-3 text-xs leading-normal text-slate-600 font-sans">
        <Info className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900">Notes d'intégration SGBD :</span>
          <p>
            Les relations de clés étrangères (<strong className="font-semibold text-slate-800">FOREIGN KEY</strong>) sont configurées pour garantir la cohérence d'intégrité référentielle en cascade ou en limitation.
            {activeTab === "mysql" ? (
              <span> Le moteur configuré est bien <strong className="font-semibold text-slate-850">InnoDB</strong> avec encodage universel <strong className="font-semibold text-slate-850">utf8mb4</strong>.</span>
            ) : (
              <span> Le script est parfaitement compatible avec l'ancienne syntaxe Microsoft T-SQL de la version 2014.</span>
            )}
          </p>
        </div>
      </div>

      {/* Code window */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
        <div className="px-5 py-3 border-b border-slate-850 flex items-center justify-between bg-slate-900/60 font-mono text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-indigo-400" />
            <span>{activeTab === "mysql" ? "fleettrack_mysql.sql" : "fleettrack_sqlserver2014.sql"}</span>
          </div>
          <button 
            onClick={handleCopyToClipboard}
            className="hover:text-white transition-colors"
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
        <div className="p-5 overflow-x-auto max-h-[450px]">
          <pre className="font-mono text-indigo-50/90 text-xs leading-relaxed whitespace-pre font-medium pr-4 select-text">
            {activeSource}
          </pre>
        </div>
      </div>

    </div>
  );
}
