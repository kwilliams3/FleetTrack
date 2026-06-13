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
  ],
  vehicles: [],
  chauffeurs: [],
  assignments: [],
  activities: [],
  payments: [],
  expenses: []
};

export function readDB(): AppDatabase {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }

    const payload = fs.readFileSync(DB_FILE, "utf-8");
    if (!payload.trim()) {
      return INITIAL_DATABASE;
    }

    const dbInstance: AppDatabase = JSON.parse(payload);
    
    // Ensure all tables exist as arrays
    if (!dbInstance.users) dbInstance.users = [];
    if (!dbInstance.vehicles) dbInstance.vehicles = [];
    if (!dbInstance.chauffeurs) dbInstance.chauffeurs = [];
    if (!dbInstance.assignments) dbInstance.assignments = [];
    if (!dbInstance.activities) dbInstance.activities = [];
    if (!dbInstance.payments) dbInstance.payments = [];
    if (!dbInstance.expenses) dbInstance.expenses = [];

    const now = new Date("2026-06-12");
    
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

    return dbInstance;
  } catch (err) {
    console.error("Erreur de lecture de la base JSON :", err);
    return INITIAL_DATABASE;
  }
}

export function writeDB(data: AppDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur lors de l'écriture en base JSON :", err);
  }
}
