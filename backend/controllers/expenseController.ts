import { Request, Response } from "express";
import { readDB, writeDB } from "../models/db";
import { Charge } from "../../src/types";

export const declareExpense = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const chargeInput = req.body as Partial<Charge>;

    if (!chargeInput.vehiculeId || !chargeInput.typeCharge || !chargeInput.montant || !chargeInput.description) {
      return res.status(400).json({ error: "Véhicule, type de charge, description et montant sont requis." });
    }

    const vehicle = db.vehicles.find(v => v.id === chargeInput.vehiculeId);
    
    let chauffeurId = chargeInput.chauffeurId || "";
    let nomChauffeur = chargeInput.nomChauffeur || "Administration";

    if (chauffeurId) {
      const chauffeur = db.chauffeurs.find(c => c.id === chauffeurId);
      if (chauffeur) {
        nomChauffeur = `${chauffeur.nom} ${chauffeur.prenom}`;
      }
    } else {
      // Pick the currently active chauffeur assigned to this vehicle if any
      const activeAssign = db.assignments.find(a => a.vehiculeId === vehicle?.id && a.statut === "En cours");
      if (activeAssign) {
        chauffeurId = activeAssign.chauffeurId;
        nomChauffeur = activeAssign.nomChauffeur;
      }
    }

    const newCharge: Charge = {
      id: "c-" + Math.random().toString(36).substring(2, 9),
      date: chargeInput.date || new Date().toISOString().split("T")[0],
      vehiculeId: vehicle?.id || "v-unknown",
      matricule: vehicle?.immatriculation || "Inconnue",
      chauffeurId,
      nomChauffeur,
      typeCharge: chargeInput.typeCharge as any,
      description: chargeInput.description,
      montant: Number(chargeInput.montant) || 0,
      justificatif: chargeInput.justificatif || "Ticket_Depense_Fictif.jpg",
      statut: "En attente"
    };

    if (vehicle && (newCharge.typeCharge === "Panne mécanique")) {
      vehicle.etat = "en_panne";
    }

    db.expenses.unshift(newCharge);
    await writeDB(db);
    res.json({ success: true, charge: newCharge });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'enregistrement de la charge." });
  }
};

export const validateExpense = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const { id, action, motifRefus } = req.body; // action: 'APPROVE' | 'REJECT'

    const chIndex = db.expenses.findIndex(e => e.id === id);
    if (chIndex < 0) {
      return res.status(404).json({ error: "Dépense introuvable." });
    }

    if (action === 'APPROVE') {
      db.expenses[chIndex].statut = 'Validé';
      db.expenses[chIndex].motifRefus = undefined;

      const vehicle = db.vehicles.find(v => v.id === db.expenses[chIndex].vehiculeId);
      if (vehicle && vehicle.etat === "en_panne" && db.expenses[chIndex].typeCharge === "Réparation") {
        vehicle.etat = "bon";
      }
    } else if (action === 'REJECT') {
      db.expenses[chIndex].statut = 'Refusé';
      db.expenses[chIndex].motifRefus = motifRefus || "Dépense non justifiable.";
    }

    await writeDB(db);
    res.json({ success: true, expenses: db.expenses });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la validation de la charge." });
  }
};
