import { Request, Response } from "express";
import { readDB, writeDB } from "../models/db";
import { Versement } from "../../src/types";

export const declarePayment = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const paymentInput = req.body as Partial<Versement>;

    if (!paymentInput.vehiculeId || !paymentInput.chauffeurId || paymentInput.montantVerse === undefined) {
      return res.status(400).json({ error: "Véhicule, chauffeur, et montant versé sont requis." });
    }

    const vehicle = db.vehicles.find(v => v.id === paymentInput.vehiculeId);
    const chauffeur = db.chauffeurs.find(c => c.id === paymentInput.chauffeurId);

    if (!vehicle || !chauffeur) {
      return res.status(404).json({ error: "Véhicule ou chauffeur associé introuvable." });
    }

    const montantAttendu = vehicle.montantJournalier;
    const montantVerse = Number(paymentInput.montantVerse);
    const ecart = montantAttendu - montantVerse;

    const newVersement: Versement = {
      id: "p-" + Math.random().toString(36).substring(2, 9),
      date: paymentInput.date || new Date().toISOString().split("T")[0],
      vehiculeId: vehicle.id,
      matricule: vehicle.immatriculation,
      chauffeurId: chauffeur.id,
      nomChauffeur: `${chauffeur.nom} ${chauffeur.prenom}`,
      montantAttendu,
      montantVerse,
      ecart,
      moyenPaiement: paymentInput.moyenPaiement || "Espèces (Cash)",
      statut: "En attente",
      provenance: paymentInput.provenance || "Chauffeur"
    };

    db.payments.unshift(newVersement);
    await writeDB(db);
    res.json({ success: true, payment: newVersement });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'enregistrement du versement." });
  }
};

export const validatePayment = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const { id, action, motifRefus } = req.body; // action: 'APPROVE' | 'REJECT'

    const valIndex = db.payments.findIndex(p => p.id === id);
    if (valIndex < 0) {
      return res.status(404).json({ error: "Versement introuvable." });
    }

    if (action === 'APPROVE') {
      db.payments[valIndex].statut = 'Validé';
      db.payments[valIndex].motifRefus = undefined;
    } else if (action === 'REJECT') {
      db.payments[valIndex].statut = 'Refusé';
      db.payments[valIndex].motifRefus = motifRefus || "Refusé par l'administration";
    }

    await writeDB(db);
    res.json({ success: true, payments: db.payments });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la validation du versement." });
  }
};
