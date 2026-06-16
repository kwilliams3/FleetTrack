import { Request, Response } from "express";
import { readDB, writeDB, INITIAL_DATABASE } from "../models/db";
import { generateSQLServerScript, generateMySQLScript } from "../models/sqlScriptGenerator";

export const getDBData = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    res.json(db);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du chargement des données." });
  }
};

export const exportSQL = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const scriptContent = generateSQLServerScript(db);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=fleettrack_sqlserver2014.sql');
    res.send(scriptContent);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'export SQL." });
  }
};

export const exportMySQL = async (req: Request, res: Response) => {
  try {
    const db = await readDB();
    const scriptContent = generateMySQLScript(db);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=fleettrack_mysql.sql');
    res.send(scriptContent);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'export MySQL." });
  }
};

export const resetDB = async (req: Request, res: Response) => {
  try {
    await writeDB(INITIAL_DATABASE);
    res.json({ success: true, message: "Base de données réinitialisée aux valeurs de démonstration." });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la réinitialisation de la base de données." });
  }
};
