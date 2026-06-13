import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./routes/index";
import sql from 'mssql';

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes mounted on /api
app.use("/api", apiRouter);

// Configuration SQL Server
const dbConfig = {
  server: 'KING-WILLIAMS',
  port: 1433,
  database: 'FleetTrack',
  user: 'sa',
  password: 'AZERTY123',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// Pool de connexion global
let poolConnection = null;

// Fonction pour initialiser la connexion DB
async function initDatabaseConnection() {
  try {
    poolConnection = await sql.connect(dbConfig);
    console.log('✅ SUCCÈS: Connecté à SQL Server!');
    const result = await poolConnection.request().query('SELECT DB_NAME() as databaseName, GETDATE() as serverTime');
    console.log(`📊 Base de données: ${result.recordset[0].databaseName}`);
    console.log(`⏰ Heure serveur: ${result.recordset[0].serverTime}`);
    return true;
  } catch (error) {
    console.error('❌ ÉCHEC: Base de données non connectée');
    console.error(`Erreur: ${error.message}`);
    return false;
  }
}

/* =========================================
   VITE & STATIC ASSET SERVER ENVIRONMENT
========================================= */
async function startServer() {
  // Tester la connexion DB au démarrage
  console.log('🔄 Test de connexion à SQL Server...');
  const dbConnected = await initDatabaseConnection();
  
  if (!dbConnected) {
    console.warn('⚠️  Le serveur va démarrer mais sans accès à la base de données');
  }

  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    // Development mode with Vite Dev Server Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded successfully.");
  } else {
    // Production static builds serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets from :", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================================`);
    console.log(`🚀 FleetTrack Backend Server booted successfully!`);
    console.log(`👉 Running live open access at: http://localhost:${PORT}`);
    console.log(`📡 DB Status: ${dbConnected ? 'CONNECTED ✅' : 'DISCONNECTED ❌'}`);
    console.log(`================================================================`);
  });
}

startServer();

// Exporter le pool pour l'utiliser dans les routes
export { poolConnection };