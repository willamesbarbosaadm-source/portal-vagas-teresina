import express from "express";
import path from "path";
import fs from "fs";
import { collection, getDocs } from "firebase/firestore";
import { createServer as createViteServer } from "vite";
import { syncSineJobs } from "./server/sineProvider.ts";
import { syncThemosJobs } from "./server/themosProvider.ts";
import { syncGupyJobs, fetchGupyTeresinaJobs } from "./server/gupyProvider.ts";
import { requireFirebaseAdmin } from "./server/firebaseAuthHelper.ts";
import { getServerFirestore, REAL_FIREBASE_CONFIG } from "./server/firebaseDb.ts";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // SINE-PI Jobs List (Firestore Real - studious-rig-bxhgq)
  app.get("/api/sine/jobs", async (req, res) => {
    try {
      const db = getServerFirestore();
      const snap = await getDocs(collection(db, "sine_vagas"));
      if (!snap.empty) {
        const firestoreJobs: any[] = [];
        let dataPublicacao = "23/09/2026";
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && (data.data_publicacao || data.dataAtualizacao)) {
            dataPublicacao = data.data_publicacao || data.dataAtualizacao || dataPublicacao;
          }
          firestoreJobs.push({ id: docSnap.id, ...data });
        });
        if (firestoreJobs.length > 0) {
          return res.json({
            success: true,
            total: firestoreJobs.length,
            data_publicacao: dataPublicacao,
            fonte: "SINE-PI (Firestore)",
            jobs: firestoreJobs
          });
        }
      }
      return res.status(503).json({
        success: false,
        error: "Nenhuma vaga encontrada no Firestore."
      });
    } catch (e: any) {
      console.error("Erro ao ler sine_vagas do Firestore:", e);
      return res.status(503).json({
        success: false,
        error: "Firestore indisponível"
      });
    }
  });

  // Protected SINE-PI Cron Endpoint
  app.get("/api/cron/sine-pi", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(503).json({ error: "Serviço indisponível. CRON_SECRET não configurado no servidor." });
    }

    const authHeader = req.headers.authorization;
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

  // Manual admin SINE-PI sync trigger (Protegido por Firebase Admin / Cron Secret)
  app.post("/api/sine/sync", requireFirebaseAdmin, async (req, res) => {
    try {
      const syncResult = await syncSineJobs();
      res.json(syncResult);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Protected Themos Vagas Cron Endpoint
  app.get("/api/cron/themos", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(503).json({ error: "Serviço indisponível. CRON_SECRET não configurado no servidor." });
    }

    const authHeader = req.headers.authorization;
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

  // Manual admin Themos Vagas sync trigger (Protegido por Firebase Admin / Cron Secret)
  app.post("/api/themos/sync", requireFirebaseAdmin, async (req, res) => {
    try {
      const syncResult = await syncThemosJobs();
      res.json(syncResult);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Gupy Teresina Jobs Endpoint (Live fetch com fallback para dados previamente sincronizados reais)
  app.get("/api/gupy/jobs", async (req, res) => {
    try {
      const jobs = await fetchGupyTeresinaJobs();
      if (jobs.length > 0) {
        return res.json({ success: true, count: jobs.length, jobs, source: 'live' });
      }

      // Se API externa não retornou vagas, tenta o último catálogo real persistido no Firestore
      try {
        const db = getServerFirestore();
        const snap = await getDocs(collection(db, "gupy_jobs"));
          if (!snap.empty) {
            const storedJobs: any[] = [];
            snap.forEach((docSnap) => {
              const d = docSnap.data();
              if (d && d.id && d.publishedDate) {
                storedJobs.push({ id: docSnap.id, ...d });
              }
            });
            if (storedJobs.length > 0) {
              return res.json({
                success: true,
                count: storedJobs.length,
                jobs: storedJobs,
                source: 'stored_catalog',
                notice: 'Vagas do catálogo previamente sincronizado da Gupy'
              });
            }
          }
      } catch (firestoreErr) {
        console.warn("Fallback Firestore gupy_jobs error:", firestoreErr);
      }

      // Se nenhum dado real estiver disponível, informa indisponibilidade sem inventar dados
      res.status(200).json({
        success: false,
        count: 0,
        jobs: [],
        message: "Vagas Gupy temporariamente indisponíveis."
      });
    } catch (error: any) {
      console.error("Gupy fetch error:", error);
      res.status(500).json({
        success: false,
        count: 0,
        jobs: [],
        error: "Vagas Gupy temporariamente indisponíveis."
      });
    }
  });

  // Protected Gupy Cron Endpoint
  app.get("/api/cron/gupy", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(503).json({ error: "Serviço indisponível. CRON_SECRET não configurado no servidor." });
    }

    const authHeader = req.headers.authorization;
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

  // Manual admin Gupy sync trigger (Protegido por Firebase Admin / Cron Secret)
  app.post("/api/gupy/sync", requireFirebaseAdmin, async (req, res) => {
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
