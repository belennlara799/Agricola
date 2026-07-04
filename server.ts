/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Ensure DB file exists
  const dbPath = path.join(process.cwd(), "db.json");
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ entries: [], products: [] }, null, 2));
  }

  // API Route to Load Data
  app.get("/api/data", (req, res) => {
    try {
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, "utf-8");
        const parsed = JSON.parse(fileContent);
        res.json({
          entries: parsed.entries || [],
          products: parsed.products || []
        });
      } else {
        res.json({ entries: [], products: [] });
      }
    } catch (e) {
      console.error("Error reading db.json", e);
      res.status(500).json({ error: "No se pudo leer la base de datos del servidor." });
    }
  });

  // API Route to Save Data
  app.post("/api/data", (req, res) => {
    try {
      const { entries, products } = req.body;
      const dataToSave = {
        entries: entries || [],
        products: products || []
      };
      fs.writeFileSync(dbPath, JSON.stringify(dataToSave, null, 2));
      res.json({ success: true, message: "Datos guardados exitosamente en el servidor." });
    } catch (e) {
      console.error("Error writing db.json", e);
      res.status(500).json({ error: "No se pudo guardar la información en el servidor." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
