/**
 * FleetTrack - Modular Server Entrypoint (JavaScript version)
 * This file is prepared for standalone NodeJS environments.
 */
import express from "express";
import path from "path";
import apiRouter from "./routes/index.js"; // Standard relative resolution

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount the API Router
app.use("/api", apiRouter);

// Set up simple static server response
const isProd = process.env.NODE_ENV === "production";
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`================================================================`);
  console.log(`🚀 Standalone FleetTrack JS Server running on port ${PORT}`);
  console.log(`================================================================`);
});
