import { Request, Response } from "express";
import { readDB, writeDB } from "../models/db";
import { Chauffeur, AffectationHistory } from "../../src/types";
import fs from "fs";
import path from "path";

// Helper function to decode and save a base64 chauffeur profile photo to the uploads/chauffeurs folder
const saveChauffeurPhoto = (chauffeurId: string, photoStr: string): string => {
  if (!photoStr) return "";
  if (!photoStr.startsWith("data:image/")) {
    // If it's already a URL, return it as-is
    return photoStr;
  }

  try {
    const matches = photoStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return photoStr; // fallback if regex fails
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Determine secure file extension
    let extension = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      extension = "jpg";
    } else if (mimeType.includes("gif")) {
      extension = "gif";
    } else if (mimeType.includes("webp")) {
      extension = "webp";
    }

    const filename = `chauffeur-${chauffeurId}-${Date.now()}.${extension}`;
    const targetDir = path.join(process.cwd(), "uploads", "chauffeurs");
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(path.join(targetDir, filename), buffer);
    return `/uploads/chauffeurs/${filename}`;
  } catch (err) {
    console.error("Erreur lors de la sauvegarde de la photo du chauffeur:", err);
    return "";
  }
};

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
      const processedPhoto = saveChauffeurPhoto(form.id, form.photo || "");
      
      db.chauffeurs[existingIndex] = { 
        ...db.chauffeurs[existingIndex], 
        ...form,
        photo: processedPhoto
      };
      
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
      const processedPhoto = saveChauffeurPhoto(chauffeurId, form.photo || "");
      
      const newChauffeur: Chauffeur = {
        ...form,
        id: chauffeurId,
        photo: processedPhoto,
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
