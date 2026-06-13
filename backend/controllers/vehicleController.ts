import { Request, Response } from "express";
import { readDB, writeDB } from "../models/db";
import { Vehicle } from "../../src/types";

export const addOrUpdateVehicle = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const form = req.body as Vehicle;

    if (!form.immatriculation || !form.marque || !form.modele) {
      return res.status(400).json({ error: "Champs obligatoires manquants : immatriculation, marque ou modèle." });
    }

    const existingIndex = db.vehicles.findIndex(v => v.id === form.id);
    if (existingIndex >= 0) {
      db.vehicles[existingIndex] = { ...db.vehicles[existingIndex], ...form };
    } else {
      const newVehicle: Vehicle = {
        ...form,
        id: form.id || "v-" + Math.random().toString(36).substring(2, 9),
        etat: form.etat || "bon",
        montantJournalier: Number(form.montantJournalier) || 10000,
        documents: {
          carteGrise: form.documents?.carteGrise || { numero: "CG-NEW", dateExpiration: "2027-01-01", statut: "valide" },
          assurance: form.documents?.assurance || { numero: "ASS-NEW", dateExpiration: "2027-01-01", statut: "valide" },
          visiteTechnique: form.documents?.visiteTechnique || { numero: "VT-NEW", dateExpiration: "2027-01-01", statut: "valide" },
          licenceTransport: form.documents?.licenceTransport
        }
      };
      db.vehicles.push(newVehicle);
    }

    await writeDB(db);
    res.json({ success: true, vehicles: db.vehicles });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'enregistrement du véhicule." });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const { id } = req.params;
    
    db.vehicles = db.vehicles.filter(v => v.id !== id);
    
    // Remove assignment reference
    db.chauffeurs = db.chauffeurs.map(c => {
      if (c.vehiculeId === id) {
        return { ...c, vehiculeId: undefined };
      }
      return c;
    });

    await writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression du véhicule." });
  }
};
