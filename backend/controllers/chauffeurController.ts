import { Request, Response } from "express";
import { readDB, writeDB } from "../models/db";
import { Chauffeur, AffectationHistory } from "../../src/types";

export const addOrUpdateChauffeur = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const form = req.body as Chauffeur;

    if (!form.nom || !form.prenom || !form.telephone || !form.numPermis) {
      return res.status(400).json({ error: "Champs de chauffeur obligatoires manquants." });
    }

    const existingIndex = db.chauffeurs.findIndex(c => c.id === form.id);
    if (existingIndex >= 0) {
      const oldVehiculeId = db.chauffeurs[existingIndex].vehiculeId;
      db.chauffeurs[existingIndex] = { ...db.chauffeurs[existingIndex], ...form };
      
      // Handle vehicle assignment changes if any
      if (oldVehiculeId !== form.vehiculeId) {
        if (form.vehiculeId) {
          // Create an affectation history item
          const vehicle = db.vehicles.find(v => v.id === form.vehiculeId);
          const nextHist: AffectationHistory = {
            id: "a-" + Math.random().toString(36).substring(2, 9),
            vehiculeId: form.vehiculeId,
            matricule: vehicle?.immatriculation || "Inconnue",
            modeleVehicule: vehicle ? `${vehicle.marque} ${vehicle.modele}` : "Inconnu",
            chauffeurId: form.id,
            nomChauffeur: `${form.nom} ${form.prenom}`,
            dateDebut: new Date().toISOString().split("T")[0],
            statut: "En cours"
          };
          db.assignments.push(nextHist);
        }
      }
    } else {
      const chauffeurId = "ch-" + Math.random().toString(36).substring(2, 9);
      const newChauffeur: Chauffeur = {
        ...form,
        id: chauffeurId,
        photo: form.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
        isActive: form.isActive !== undefined ? form.isActive : true
      };
      db.chauffeurs.push(newChauffeur);

      // If initial vehicle assignment exists
      if (form.vehiculeId) {
        const vehicle = db.vehicles.find(v => v.id === form.vehiculeId);
        const nextHist: AffectationHistory = {
          id: "a-" + Math.random().toString(36).substring(2, 9),
          vehiculeId: form.vehiculeId,
          matricule: vehicle?.immatriculation || "Inconnue",
          modeleVehicule: vehicle ? `${vehicle.marque} ${vehicle.modele}` : "Inconnu",
          chauffeurId,
          nomChauffeur: `${form.nom} ${form.prenom}`,
          dateDebut: new Date().toISOString().split("T")[0],
          statut: "En cours"
        };
        db.assignments.push(nextHist);
      }
    }

    await writeDB(db);
    res.json({ success: true, chauffeurs: db.chauffeurs });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'enregistrement du chauffeur." });
  }
};

export const deleteChauffeur = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const { id } = req.params;
    db.chauffeurs = db.chauffeurs.filter(c => c.id !== id);
    await writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression du chauffeur." });
  }
};

export const assignVehicle = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const { vehiculeId, chauffeurId, remarque } = req.body;

    if (!chauffeurId) {
      return res.status(400).json({ error: "Sélectionnez un chauffeur." });
    }

    const chauffeur = db.chauffeurs.find(c => c.id === chauffeurId);
    if (!chauffeur) {
      return res.status(404).json({ error: "Chauffeur introuvable." });
    }

    // 1. Mark previous active assignment for this chauffeur as closed
    db.assignments = db.assignments.map(a => {
      if (a.chauffeurId === chauffeurId && a.statut === 'En cours') {
        return { ...a, dateFin: new Date().toISOString().split("T")[0], statut: "Historique" as const };
      }
      return a;
    });

    // 2. Mark previous active assignment for the newly targeted vehicle as closed
    if (vehiculeId) {
      db.assignments = db.assignments.map(a => {
        if (a.vehiculeId === vehiculeId && a.statut === 'En cours') {
          const affectedChauffeur = db.chauffeurs.find(c => c.id === a.chauffeurId);
          if (affectedChauffeur) {
            affectedChauffeur.vehiculeId = undefined;
          }
          return { ...a, dateFin: new Date().toISOString().split("T")[0], statut: "Historique" as const, remarque: "Désaffecté" };
        }
        return a;
      });
    }

    // 3. Update chauffeur vehicle reference
    chauffeur.vehiculeId = vehiculeId || undefined;

    // 4. Create new Active Assignment
    if (vehiculeId) {
      const vehicle = db.vehicles.find(v => v.id === vehiculeId);
      const newAssign: AffectationHistory = {
        id: "a-" + Math.random().toString(36).substring(2, 9),
        vehiculeId,
        matricule: vehicle?.immatriculation || "Inconnue",
        modeleVehicule: vehicle ? `${vehicle.marque} ${vehicle.modele}` : "Inconnue",
        chauffeurId,
        nomChauffeur: `${chauffeur.nom} ${chauffeur.prenom}`,
        dateDebut: new Date().toISOString().split("T")[0],
        statut: "En cours",
        remarque: remarque || "Affectation standard de service"
      };
      db.assignments.push(newAssign);
    }

    await writeDB(db);
    res.json({ success: true, chauffeurs: db.chauffeurs, assignments: db.assignments });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'affectation du véhicule." });
  }
};
