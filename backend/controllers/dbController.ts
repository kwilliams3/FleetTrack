import { Request, Response } from "express";
import { readDB, writeDB, INITIAL_DATABASE } from "../models/db";
import { generateSQLServerScript } from "../models/sqlScriptGenerator";

export const getDBData = (req: Request, res: Response) => {
  const db = readDB();
  res.json(db);
};

export const exportSQL = (req: Request, res: Response) => {
  const db = readDB();
  const scriptContent = generateSQLServerScript(db);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=fleettrack_sqlserver2014.sql');
  res.send(scriptContent);
};

export const resetDB = (req: Request, res: Response) => {
  writeDB(INITIAL_DATABASE);
  res.json({ success: true, message: "Base de données réinitialisée aux valeurs de démonstration." });
};
