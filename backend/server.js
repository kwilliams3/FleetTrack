/**
 * FleetTrack - Modular Server Entrypoint (JavaScript version)
 * This file is prepared for standalone NodeJS environments.
 */
import express from "express";
import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import apiRouter from "./routes/index.js";

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Configuration MySQL depuis .env
const dbConfig = {
  host: process.env.DB_HOST || process.env.DB_SERVER || "KING-WILLIAMS",
  port: parseInt(process.env.DB_PORT || "3306"),
  database: process.env.DB_DATABASE || "FleetTrack",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "AZERTY123",
  connectTimeout: 4000
};

// Fonction de test de connexion DB
async function testDatabaseConnection() {
  try {
    const host = dbConfig.host;
    // S'assurer de l'existence de la base
    try {
      const conn = await mysql.createConnection({
        host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        connectTimeout: 4000
      });
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
      await conn.end();
    } catch (_) {}

    const pool = mysql.createPool(dbConfig);
    const [rows] = await pool.query("SELECT DATABASE() as databaseName, NOW() as serverTime");
    console.log("✅ SUCCÈS: Connecté à MySQL!");
    console.log(`📊 Base de données: ${rows[0].databaseName}`);
    console.log(`⏰ Heure serveur: ${rows[0].serverTime}`);
    await pool.end();
    return true;
  } catch (error) {
    console.error("❌ ÉCHEC: Base de données non connectée");
    console.error(`Erreur: ${error.message}`);
    return false;
  }
}

// Mount the API Router
app.use("/api", apiRouter);

// Serve uploads statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Set up simple static server response
const isProd = process.env.NODE_ENV === "production";

// Endpoint de test DB
app.get("/api/db-status", async (req, res) => {
  try {
    const pool = mysql.createPool(dbConfig);
    const [rows] = await pool.query("SELECT DATABASE() as db, NOW() as time");
    await pool.end();
    res.json({
      status: "connected",
      database: rows[0].db,
      serverTime: rows[0].time,
    });
  } catch (error) {
    res.status(500).json({ status: "disconnected", error: error.message });
  }
});

if (isProd) {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("FleetTrack Backend is running (Development Standalone Mode). Run with Vite for front-end integration.");
  });
}

// Démarrer le serveur avec test DB
async function startServer() {
  console.log("🔄 Test de connexion à MySQL...");
  const dbConnected = await testDatabaseConnection();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================================`);
    console.log(`🚀 Standalone FleetTrack JS Server running on port ${PORT}`);
    console.log(`📡 DB Status: ${dbConnected ? "CONNECTED ✅" : "DISCONNECTED ❌"}`);
    console.log(`================================================================`);
  });
}

startServer();
