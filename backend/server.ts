import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./routes/index";
import sql from 'mssql';

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies with a larger limit for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Routes mounted on /api
app.use("/api", apiRouter);

// Serve uploads statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Configuration SQL Server
const dbConfig = {
  server: 'KING-WILLIAMS',
  port: 1433,
  database: 'FleetTrack',
  user: 'sa',
  password: 'AZERTY123',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 4000 // 4 seconds timeout to avoid blocking container previews if local SQL is down
  }
};

// Pool de connexion global
let poolConnection: sql.ConnectionPool | null = null;

// Fonction pour initialiser la connexion DB
async function initDatabaseConnection() {
  try {
    console.log(`🔌 Connexion à SQL Server à l'adresse ${dbConfig.server}:${dbConfig.port}...`);
    poolConnection = await sql.connect(dbConfig);
    console.log('✅ SUCCÈS: Connecté à SQL Server!');
    const result = await poolConnection.request().query('SELECT DB_NAME() as databaseName, GETDATE() as serverTime');
    console.log(`📊 Base de données active: ${result.recordset[0].databaseName}`);
    console.log(`⏰ Heure serveur: ${result.recordset[0].serverTime}`);
    return true;
  } catch (error: any) {
    console.warn('❌ ÉCHEC: SQL Server non connecté.');
    console.warn(`Erreur: ${error.message}`);
    console.warn('👉 Le serveur utilise la base cloud Firestore de secours pour la prévisualisation.');
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
    console.warn('⚠️  Le serveur va démarrer mais sans accès direct à la base de données locale KING-WILLIAMS.');
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
