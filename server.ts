import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { syncSineJobs } from "./server/sineProvider";
import { syncThemosJobs } from "./server/themosProvider";
import { syncGupyJobs, fetchGupyTeresinaJobs } from "./server/gupyProvider";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Protected SINE-PI Cron Endpoint
  app.get("/api/cron/sine-pi", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret_vaiquedacerto";
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized. Invalid or missing CRON_SECRET." });
    }

    try {
      const syncResult = await syncSineJobs();
      res.json(syncResult);
    } catch (error: any) {
      console.error("SINE-PI sync error:", error);
      res.status(500).json({
        success: false,
        error: "Não foi possível atualizar as vagas do SINE-PI neste momento.",
        details: error.message
      });
    }
  });

  // Manual admin SINE-PI sync trigger
  app.post("/api/sine/sync", async (req, res) => {
    try {
      const syncResult = await syncSineJobs();
      res.json(syncResult);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Protected Themos Vagas Cron Endpoint
  app.get("/api/cron/themos", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret_vaiquedacerto";
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized. Invalid or missing CRON_SECRET." });
    }

    try {
      const syncResult = await syncThemosJobs();
      res.json(syncResult);
    } catch (error: any) {
      console.error("Themos Vagas sync error:", error);
      res.status(500).json({
        success: false,
        error: "Não foi possível atualizar as vagas do Themos Vagas neste momento.",
        details: error.message
      });
    }
  });

  // Manual admin Themos Vagas sync trigger
  app.post("/api/themos/sync", async (req, res) => {
    try {
      const syncResult = await syncThemosJobs();
      res.json(syncResult);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Gupy Teresina Jobs Endpoint (Live fetch)
  app.get("/api/gupy/jobs", async (req, res) => {
    try {
      const jobs = await fetchGupyTeresinaJobs();
      res.json({ success: true, count: jobs.length, jobs });
    } catch (error: any) {
      console.error("Gupy fetch error:", error);
      res.status(500).json({ success: false, error: "Erro ao buscar vagas do Gupy Teresina." });
    }
  });

  // Protected Gupy Cron Endpoint
  app.get("/api/cron/gupy", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret_vaiquedacerto";
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized. Invalid or missing CRON_SECRET." });
    }

    try {
      const syncResult = await syncGupyJobs();
      res.json(syncResult);
    } catch (error: any) {
      console.error("Gupy sync error:", error);
      res.status(500).json({ success: false, error: "Erro ao sincronizar vagas do Gupy Teresina." });
    }
  });

  // Manual admin Gupy sync trigger
  app.post("/api/gupy/sync", async (req, res) => {
    try {
      const syncResult = await syncGupyJobs();
      res.json(syncResult);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development or static serving in production
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
