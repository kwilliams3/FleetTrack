import { Request, Response } from "express";
import { readDB, writeDB } from "../models/db";
import { User } from "../../src/types";

export const addOrUpdateUser = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const form = req.body as Partial<User>;

    if (!form.name || !form.username || !form.role) {
      return res.status(400).json({ error: "Champs obligatoires manquants : nom complet, identifiant ou rôle." });
    }

    const existingIndex = db.users.findIndex(u => u.id === form.id);
    if (existingIndex >= 0) {
      db.users[existingIndex] = {
        ...db.users[existingIndex],
        name: form.name,
        username: form.username,
        role: form.role,
        isActive: form.isActive !== undefined ? form.isActive : db.users[existingIndex].isActive,
        phone: form.phone
      };
    } else {
      // Generate simple ID
      const newUser: User = {
        id: "u-" + Math.random().toString(36).substring(2, 9),
        name: form.name,
        username: form.username,
        role: form.role,
        isActive: form.isActive !== undefined ? form.isActive : true,
        phone: form.phone,
        password: "Pass12345", // default temporary password
        mustChangePassword: true
      };
      db.users.push(newUser);
    }

    await writeDB(db);
    res.json({ success: true, users: db.users });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'enregistrement de l'utilisateur." });
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: "L'identifiant de l'utilisateur et le nouveau mot de passe sont obligatoires." });
    }

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex < 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    db.users[userIndex].password = newPassword;
    db.users[userIndex].mustChangePassword = true;

    await writeDB(db);
    res.json({ success: true, users: db.users });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la réinitialisation du mot de passe." });
  }
};

export const changeUserPassword = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: "L'identifiant de l'utilisateur et le nouveau mot de passe sont obligatoires." });
    }

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex < 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    db.users[userIndex].password = newPassword;
    db.users[userIndex].mustChangePassword = false;

    await writeDB(db);
    res.json({ success: true, users: db.users });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du changement de mot de passe." });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const { id } = req.params;

    // We should prevent deleting the last admin to avoid lockouts
    const userToDelete = db.users.find(u => u.id === id);
    if (userToDelete?.role === "ADMIN") {
      const adminCount = db.users.filter(u => u.role === "ADMIN").length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Impossible de supprimer le dernier compte administrateur." });
      }
    }

    db.users = db.users.filter(u => u.id !== id);
    await writeDB(db);
    res.json({ success: true, users: db.users });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur." });
  }
};
