/**
 * FleetTrack - Modular Server Entrypoint (JavaScript version)
 * This file is prepared for standalone NodeJS environments.
 */
import express from "express";
import path from "path";
import dotenv from 'dotenv';
import sql from 'mssql';
import apiRouter from "./routes/index.js";

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Configuration SQL Server depuis .env
const dbConfig = {
  server: process.env.DB_SERVER || 'KING-WILLIAMS',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'FleetTrack',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'AZERTY123',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

// Fonction de test de connexion DB
async function testDatabaseConnection() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ SUCCÈS: Connecté à SQL Server!');
    const result = await pool.request().query('SELECT DB_NAME() as databaseName, GETDATE() as serverTime');
    console.log(`📊 Base de données: ${result.recordset[0].databaseName}`);
    console.log(`⏰ Heure serveur: ${result.recordset[0].serverTime}`);
    await sql.close();
    return true;
  } catch (error) {
    console.error('❌ ÉCHEC: Base de données non connectée');
    console.error(`Erreur: ${error.message}`);
    return false;
  }
}

// Mount the API Router
app.use("/api", apiRouter);

// Set up simple static server response
const isProd = process.env.NODE_ENV === "production";

// Endpoint de test DB
app.get("/api/db-status", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT DB_NAME() as db, GETDATE() as time');
    await sql.close();
    res.json({ 
      status: 'connected', 
      database: result.recordset[0].db,
      serverTime: result.recordset[0].time 
    });
  } catch (error) {
    res.status(500).json({ status: 'disconnected', error: error.message });
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
  console.log('🔄 Test de connexion à SQL Server...');
  const dbConnected = await testDatabaseConnection();
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================================`);
    console.log(`🚀 Standalone FleetTrack JS Server running on port ${PORT}`);
    console.log(`📡 DB Status: ${dbConnected ? 'CONNECTED ✅' : 'DISCONNECTED ❌'}`);
    console.log(`================================================================`);
  });
}

startServer();