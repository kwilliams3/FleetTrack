import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import apiRouter from "./routes/index";
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies with a larger limit for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Routes mounted on /api
app.use("/api", apiRouter);

// Serve uploads statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Configuration MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'KING-WILLIAMS',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_DATABASE || 'FleetTrack',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AZERTY123',
  connectTimeout: 4000
};

// Pool de connexion global
let poolConnection: mysql.Pool | null = null;

// Fonction pour initialiser la connexion DB
async function initDatabaseConnection() {
  try {
    const host = dbConfig.host;
    console.log(`🔌 Connexion à MySQL à l'adresse ${host}:${dbConfig.port}...`);
    
    // Auto-create DB if not exists
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
    } catch (e: any) {
      console.warn("⚠️ Impossible de s'assurer de l'existence de la base :", e.message);
    }

    poolConnection = mysql.createPool(dbConfig);
    const [rows]: any = await poolConnection.query('SELECT DATABASE() as databaseName, NOW() as serverTime');
    console.log('✅ SUCCÈS: Connecté à MySQL!');
    console.log(`📊 Base de données active: ${rows[0].databaseName}`);
    console.log(`⏰ Heure serveur: ${rows[0].serverTime}`);
    return true;
  } catch (error: any) {
    console.warn('❌ ÉCHEC: MySQL non connecté.');
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
  console.log('🔄 Test de connexion à MySQL...');
  const dbConnected = await initDatabaseConnection();
  
  if (!dbConnected) {
    console.warn('⚠️  Le serveur va démarrer mais sans accès direct à la base de données locale KING-WILLIAMS.');
  }

  const distPath = path.join(process.cwd(), "dist");
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
    console.log("Serving compiled static assets from:", distPath);
    
    // Serve static files with headers to prevent aggressive caching of index.html
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (path.basename(filePath) === 'index.html') {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        }
      }
    }));
    
    // Catch-all route for Single Page Application routing
    app.get("*", (req, res) => {
      // If the request contains a file extension (e.g. .ts, .tsx, .js, .css, etc.), and was not served by express.static,
      // it is a missing asset. Return 404 instead of serving index.html as text/html to avoid MIME type block errors.
      const ext = path.extname(req.path).toLowerCase();
      if (ext && ext !== '.html') {
        res.status(404).send(`Asset not found: ${req.path}`);
        return;
      }
      
      res.sendFile(path.join(distPath, "index.html"), {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        }
      });
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
