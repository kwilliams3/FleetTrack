/* =====================================================================
   SCRIPT DE CREATION ET DE REMPLISSAGE - MYSQL / MARIADB
   CIBLE SGBD : MySQL (moteur InnoDB)
   Base de Données : FleetTrack
======================================================================== */

CREATE DATABASE IF NOT EXISTS `FleetTrack` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `FleetTrack`;

-- Désactivation temporaire des contraintes pour permettre une réinitialisation propre
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `ChargesEtDepenses`;
DROP TABLE IF EXISTS `VersementsJournaliers`;
DROP TABLE IF EXISTS `ActivitesJournalieres`;
DROP TABLE IF EXISTS `AffectationsChauffeurVehicule`;
DROP TABLE IF EXISTS `DocumentsVehicules`;
DROP TABLE IF EXISTS `Utilisateurs`;
DROP TABLE IF EXISTS `Chauffeurs`;
DROP TABLE IF EXISTS `Vehicules`;

SET FOREIGN_KEY_CHECKS = 1;


-- 1. Table Utilisateurs (Profils d'accès de l'administration)
CREATE TABLE `Utilisateurs` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `NomComplet` VARCHAR(150) NOT NULL,
    `Identifiant` VARCHAR(50) NOT NULL UNIQUE,
    `Role` VARCHAR(20) NOT NULL CHECK (`Role` IN ('ADMIN', 'MANAGER')),
    `EstActif` TINYINT(1) NOT NULL DEFAULT 1,
    `Telephone` VARCHAR(30) NULL,
    `ChauffeurAssocieId` VARCHAR(50) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. Table Chauffeurs
CREATE TABLE `Chauffeurs` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `Nom` VARCHAR(100) NOT NULL,
    `Prenom` VARCHAR(100) NOT NULL,
    `Telephone` VARCHAR(30) NOT NULL,
    `Adresse` VARCHAR(250) NOT NULL,
    `NumeroPermis` VARCHAR(50) NOT NULL,
    `ExpirationPermis` DATE NOT NULL,
    `PhotoUrl` VARCHAR(250) NULL,
    `EstActif` TINYINT(1) NOT NULL DEFAULT 1,
    `VehiculeAttribueId` VARCHAR(50) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. Table Véhicules (Spécifications de la flotte)
CREATE TABLE `Vehicules` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `Immatriculation` VARCHAR(30) NOT NULL UNIQUE,
    `Marque` VARCHAR(50) NOT NULL,
    `Modele` VARCHAR(50) NOT NULL,
    `Annee` INT NULL,
    `Couleur` VARCHAR(30) NULL,
    `NumeroChassis` VARCHAR(80) NULL,
    `Etat` VARCHAR(20) NOT NULL CHECK (`Etat` IN ('excellent', 'bon', 'moyen', 'en_panne', 'en_reparation')),
    `DateAcquisition` DATE NULL,
    `MontantJournalier` DECIMAL(18, 2) NOT NULL DEFAULT 10000.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 4. Table Documents Véhicules (Assurances, Cartes Grises, Contrôles)
CREATE TABLE `DocumentsVehicules` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `VehiculeId` VARCHAR(50) NOT NULL,
    `TypeDocument` VARCHAR(50) NOT NULL CHECK (`TypeDocument` IN ('Carte Grise', 'Assurance', 'Visite Technique', 'Licence Transport')),
    `NumeroDocument` VARCHAR(50) NOT NULL,
    `DateExpiration` DATE NOT NULL,
    `FichierNom` VARCHAR(150) NULL,
    CONSTRAINT `fk_documents_vehicle` FOREIGN KEY (`VehiculeId`) REFERENCES `Vehicules` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 5. Table Affectations Chauffeur-Véhicule
CREATE TABLE `AffectationsChauffeurVehicule` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `VehiculeId` VARCHAR(50) NOT NULL,
    `ChauffeurId` VARCHAR(50) NOT NULL,
    `DateDebut` DATE NOT NULL,
    `DateFin` DATE NULL,
    `Statut` VARCHAR(20) NOT NULL CHECK (`Statut` IN ('En cours', 'Historique')),
    `Remarque` VARCHAR(500) NULL,
    CONSTRAINT `fk_affectations_vehicle` FOREIGN KEY (`VehiculeId`) REFERENCES `Vehicules` (`Id`),
    CONSTRAINT `fk_affectations_chauffeur` FOREIGN KEY (`ChauffeurId`) REFERENCES `Chauffeurs` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 6. Table Activités Journalières (Présences & Observations)
CREATE TABLE `ActivitesJournalieres` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `DateActivite` DATE NOT NULL,
    `ChauffeurId` VARCHAR(50) NOT NULL,
    `VehiculeId` VARCHAR(50) NOT NULL,
    `Present` TINYINT(1) NOT NULL DEFAULT 1,
    `HeureDebut` VARCHAR(10) NULL,
    `HeureFin` VARCHAR(10) NULL,
    `KilometrageJournalier` INT NULL,
    `EtatVehicule` VARCHAR(100) NULL,
    `Observations` VARCHAR(500) NULL,
    CONSTRAINT `fk_activites_chauffeur` FOREIGN KEY (`ChauffeurId`) REFERENCES `Chauffeurs` (`Id`),
    CONSTRAINT `fk_activites_vehicle` FOREIGN KEY (`VehiculeId`) REFERENCES `Vehicules` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 7. Table Versements Journaliers (Suivi de recette & Écarts)
CREATE TABLE `VersementsJournaliers` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `DateVersement` DATE NOT NULL,
    `VehiculeId` VARCHAR(50) NOT NULL,
    `ChauffeurId` VARCHAR(50) NOT NULL,
    `MontantAttendu` DECIMAL(18, 2) NOT NULL,
    `MontantVerse` DECIMAL(18, 2) NOT NULL,
    `Ecart` DECIMAL(18, 2) NOT NULL,
    `MoyenPaiement` VARCHAR(50) NOT NULL CHECK (`MoyenPaiement` IN ('MTN Mobile Money', 'Orange Money', 'Espèces (Cash)')),
    `StatutValidation` VARCHAR(25) NOT NULL CHECK (`StatutValidation` IN ('En attente', 'Validé', 'Refusé')),
    `Provenance` VARCHAR(20) NOT NULL CHECK (`Provenance` IN ('Chauffeur', 'Administration')),
    `MotifRefus` VARCHAR(250) NULL,
    CONSTRAINT `fk_versements_vehicle` FOREIGN KEY (`VehiculeId`) REFERENCES `Vehicules` (`Id`),
    CONSTRAINT `fk_versements_chauffeur` FOREIGN KEY (`ChauffeurId`) REFERENCES `Chauffeurs` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 8. Table Charges et Dépenses (Entretien, Carburant, Réparation)
CREATE TABLE `ChargesEtDepenses` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `DateDepense` DATE NOT NULL,
    `VehiculeId` VARCHAR(50) NOT NULL,
    `ChauffeurId` VARCHAR(50) NOT NULL,
    `TypeCharge` VARCHAR(100) NOT NULL CHECK (`TypeCharge` IN ('Panne mécanique', 'Réparation', 'Entretien', 'Carburant', 'Pneus', 'Vidange', 'Pièces de rechange', 'Autre')),
    `Description` VARCHAR(500) NOT NULL,
    `Montant` DECIMAL(18, 2) NOT NULL,
    `JustificatifNom` VARCHAR(150) NULL,
    `StatutValidation` VARCHAR(25) NOT NULL CHECK (`StatutValidation` IN ('En attente', 'Validé', 'Refusé')),
    `MotifRefus` VARCHAR(250) NULL,
    CONSTRAINT `fk_charges_vehicle` FOREIGN KEY (`VehiculeId`) REFERENCES `Vehicules` (`Id`),
    CONSTRAINT `fk_charges_chauffeur` FOREIGN KEY (`ChauffeurId`) REFERENCES `Chauffeurs` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =====================================================================
-- SEED : COMPTE ADMINISTRATEUR PAR DÉFAUT
-- =====================================================================
INSERT INTO `Utilisateurs` (`Id`, `NomComplet`, `Identifiant`, `Role`, `EstActif`, `Telephone`, `ChauffeurAssocieId`) 
VALUES ('u-1', 'Franck Administrateur', 'admin', 'ADMIN', 1, '+237 670 112 233', NULL);