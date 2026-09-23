import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { syncSineJobs } from "./server/sineProvider.ts";
import { syncThemosJobs } from "./server/themosProvider.ts";
import { syncGupyJobs, fetchGupyTeresinaJobs } from "./server/gupyProvider.ts";
import { INITIAL_SINE_JOBS } from "./src/data/sineInitialJobs.ts";



const ADMIN_EMAIL = "willamesbarbosaadm@gmail.com";

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const apiKey = process.env.FIREBASE_API_KEY;

  if (!idToken || !apiKey) return res.status(401).json({ success: false, error: "Não autenticado." });

  try {
    const response = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (!response.ok) return res.status(401).json({ success: false, error: "Token Firebase inválido ou expirado." });
    const data = await response.json() as { users?: Array<{ email?: string }> };
    const user = data.users?.[0];
    if (!user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return res.status(403).json({ success: false, error: "Acesso restrito ao administrador." });
    next();
  } catch (error) {
    console.error("Admin token verification error:", error);
    return res.status(401).json({ success: false, error: "Não foi possível validar a autenticação." });
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // SINE-PI Jobs List (Firestore -> Fallback)
  app.get("/api/sine/jobs", async (req, res) => {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        const app = getApps().length > 0 ? getApp() : initializeApp(config);
        const dbId = config.firestoreDatabaseId || "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413";
        const db = getFirestore(app, dbId);
        const snap = await getDocs(collection(db, "sine_vagas"));
        if (!snap.empty) {
          const firestoreJobs: any[] = [];
          snap.forEach((docSnap) => {
            firestoreJobs.push({ id: docSnap.id, ...docSnap.data() });
          });
          if (firestoreJobs.length > 0) {
            return res.json({
              success: true,
              total: firestoreJobs.length,
              data_publicacao: "23/09/2026",
              fonte: "SINE-PI (Firestore)",
              jobs: firestoreJobs
            });
          }
        }
      }
    } catch (e) {
      console.warn("Erro ao ler sine_vagas do Firestore:", e);
    }

    res.json({
      success: true,
      total: INITIAL_SINE_JOBS.length,
      data_publicacao: "23/09/2026",
      fonte: "SINE-PI (Fallback Inicial)",
      jobs: INITIAL_SINE_JOBS
    });
  });

  // Protected SINE-PI Cron Endpoint
  app.get("/api/cron/sine-pi", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
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
  app.post("/api/sine/sync", requireAdmin, async (req, res) => {
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
  app.post("/api/themos/sync", requireAdmin, async (req, res) => {
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
  app.post("/api/gupy/sync", requireAdmin, async (req, res) => {
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (0.0.0.0:${PORT})`);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

startServer().catch((err) => {
  console.error("FATAL ERROR starting server:", err);
  process.exit(1);
});
