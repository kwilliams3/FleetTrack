# FleetTrack - Gestion Pro de Flotte de Taxis et Mini-Bus

Application de gestion opérationnelle complète pour une flotte de transports urbains au Cameroun (Taxis jaunes, Elantras, Mini-Bus Hiace).

## 📁 Architecture du Projet

Le projet a été réorganisé selon une structure modulaire stricte, séparant proprement la logique du serveur backend du client frontend.

```
.
├── backend/                  # Partie Serveur Express
│   ├── controllers/          # Contrôleurs contenant la logique métier
│   │   ├── activityController.ts   # Registre de présence et kilométrage
│   │   ├── chauffeurController.ts  # Gestion des chauffeurs et affectations
│   │   ├── dbController.ts         # Actions générales de base de données
│   │   ├── expenseController.ts    # Déclarations & validation des charges
│   │   └── vehicleController.ts    # Cycle de vie des véhicules
│   │
│   ├── models/               # Modèles de données & persistance
│   │   ├── db.ts                   # Couche d'accès à fleet_db.json
│   │   └── sqlScriptGenerator.ts   # Générateur de script de sauvegarde SQL Server 2014
│   │
│   ├── routes/               # Points d'accès d'API REST
│   │   └── index.ts                # Routeur centralisé montant toutes les fonctionnalités
│   │
│   ├── server.ts             # Serveur d'entrée principal (TypeScript)
│   ├── server.js             # Serveur d'entrée autonome (JavaScript)
│   └── package.json          # Descripteur et dépendances de la partie backend
│
├── src/                      # Partie Client React (Vite & Tailwind CSS)
│   ├── components/           # Composants visuels de l'interface
│   ├── main.tsx              # Point d'entrée de l'application cliente
│   ├── App.tsx               # Composant principal d'affichage réactif
│   └── types.ts              # Déclaration des types partagés (TypeScript)
│
├── fleet_db.json             # Base de données locale fichier JSON
├── package.json              # Dépendances globales et scripts de compilation
└── README.md                 # Ce fichier de documentation
```

## 🚀 Fonctionnalités Clés

- **Tableau de Bord Administratif** : Vision globale des revenus, dépenses, répartition opérationnelle et alertes sur les documents expirants.
- **Gestion des Véhicules** : Enregistrement, suivi technique et gestion intelligente de la validité de la Carte Grise, Assurance, Visite Technique et Licence de transport.
- **Gestion des Chauffeurs** : Fiches d'identité, coordonnées téléphoniques, validité du permis de conduire et attributions actives de véhicules.
- **Rapports de Versements Journaliers** : Suivi des versements attendus (selon contrat journalier) vs reçus (Espèces, ORANGE Money, MTN Mobile Money) avec calcul d'écarts automatiques et processus de double validation administrative.
- **Registre des Charges et Dépenses** : Centralisation des coûts d'exploitation (Vidange, Carburant, Pneus, Réparations) avec téléversement factice des justificatifs et circuit de validation.
- **Sauvegarde SQL Server 2014** : Exportation directe en un clic d'un script T-SQL complet de création de tables de base de données relationnelles pré-peuplées avec vos données de flotte actives, prêt à être exécuté dans Microsoft SQL Server Management Studio.

## 🛠️ Lancer l'Application

### Environnement de Développement (Vite + Express)
Pour démarrer le serveur de développement intégrant le backend Express et l'interface réactive React :
```bash
npm run dev
```

### Build et Production
Pour exécuter une compilation optimisée pour la mise en production :
```bash
npm run build
npm start
```
La commande `build` génère les fichiers statiques du client dans le dossier `dist/` et compile le backend Express en un seul fichier optimisé `dist/server.cjs` à l'aide d'Esbuild.
