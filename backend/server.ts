import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./routes/index";

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes mounted on /api
app.use("/api", apiRouter);

/* =========================================
   VITE & STATIC ASSET SERVER ENVIRONMENT
========================================= */
async function startServer() {
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
    console.log(`================================================================`);
  });
}

startServer();
