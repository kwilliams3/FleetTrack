import { Request, Response } from "express";
import { readDB, writeDB } from "../models/db";
import { ActivityLog } from "../../src/types";

export const logActivity = (req: Request, res: Response) => {
  const db = readDB();
  const actInput = req.body as Partial<ActivityLog>;

  if (!actInput.chauffeurId || actInput.present === undefined) {
    return res.status(400).json({ error: "Chauffeur et présence requis." });
  }

  const chauffeur = db.chauffeurs.find(c => c.id === actInput.chauffeurId);
  if (!chauffeur) {
    return res.status(404).json({ error: "Chauffeur introuvable." });
  }

  const vehicleId = chauffeur.vehiculeId || "";
  const vehicle = db.vehicles.find(v => v.id === vehicleId);

  const newLog: ActivityLog = {
    id: "ac-" + Math.random().toString(36).substring(2, 9),
    date: actInput.date || new Date().toISOString().split("T")[0],
    chauffeurId: chauffeur.id,
    nomChauffeur: `${chauffeur.nom} ${chauffeur.prenom}`,
    vehiculeId: vehicleId,
    matricule: vehicle?.immatriculation || "Aucun véhicule",
    present: !!actInput.present,
    heureDebut: actInput.heureDebut || "07:00",
    heureFin: actInput.heureFin || "18:00",
    kilometrageJournalier: Number(actInput.kilometrageJournalier) || 0,
    etatVehicule: actInput.etatVehicule || "Bon état de marche",
    observations: actInput.observations || ""
  };

  db.activities.unshift(newLog);
  writeDB(db);
  res.json({ success: true, activities: db.activities });
};
