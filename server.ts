import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { createServer as createViteServer } from "vite";
import { syncSineJobs } from "./server/sineProvider.ts";
import { syncThemosJobs } from "./server/themosProvider.ts";
import { syncGupyJobs, fetchGupyTeresinaJobs } from "./server/gupyProvider.ts";
import { requireFirebaseAdmin, requireAuthenticatedUser, validateFirebaseToken } from "./server/firebaseAuthHelper.ts";
import { getServerFirestore, REAL_FIREBASE_CONFIG } from "./server/firebaseDb.ts";
import { extractCandidateProfileFromPdf } from "./server/resumeExtractor.ts";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Habilita CORS e responde requisições preflight OPTIONS para todas as rotas da API
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-cron-secret");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json());

  // API Routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Candidate Resume Parsing & Profile Persistence Endpoint
  app.options(["/api/candidate/resume", "/api/candidate/resume/"], (req, res) => res.sendStatus(204));
  app.post(
    ["/api/candidate/resume", "/api/candidate/resume/"],
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      upload.single("resume")(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            return res.status(400).json({
              success: false,
              error: `Erro no upload do arquivo: ${err.message}`
            });
          }
          return res.status(400).json({
            success: false,
            error: err.message || "Erro no upload do arquivo PDF."
          });
        }
        next();
      });
    },
    async (req: express.Request, res: express.Response) => {
      try {
        const file = req.file || (req as any).files?.[0];
        if (!file || !file.buffer) {
          return res.status(400).json({
            success: false,
            error: "Nenhum arquivo PDF enviado ou formato inválido."
          });
        }

        // Identifica se há token Bearer na requisição
        let uid: string | null = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.replace(/^Bearer\s+/, "").trim();
          if (token) {
            try {
              const validation = await validateFirebaseToken(token);
              if (validation.ok && validation.user?.id) {
                uid = validation.user.id;
              }
            } catch (tokErr) {
              console.warn("[RESUME_UPLOAD] Token de autorização não validado:", tokErr);
            }
          }
        }

        // Extrai perfil do PDF via Gemini 2.5 Flash
        const extraction = await extractCandidateProfileFromPdf(file.buffer, file.originalname);

        let verifiedProfile = extraction.extracted;
        let maskedUid = uid ? (uid.length > 8 ? `${uid.substring(0, 4)}...${uid.substring(uid.length - 4)}` : uid) : "guest_candidate";
        let verifiedInFirestore = false;

        // Se houver usuário autenticado, persiste e verifica no Firestore
        if (uid) {
          try {
            const db = getServerFirestore();
            const userDocRef = doc(db, "users", uid);

            let existingProfile = {};
            const snapBefore = await getDoc(userDocRef);
            if (snapBefore.exists()) {
              existingProfile = snapBefore.data()?.profile || {};
            }

            const mergedProfile = {
              ...existingProfile,
              ...extraction.extracted,
              updatedAt: new Date().toISOString()
            };

            await setDoc(userDocRef, { profile: mergedProfile }, { merge: true });

            const savedSnap = await getDoc(userDocRef);
            if (savedSnap.exists()) {
              verifiedProfile = savedSnap.data()?.profile || mergedProfile;
              verifiedInFirestore = true;
            }
          } catch (dbErr) {
            console.warn("[RESUME_UPLOAD] Falha na persistência Firestore:", dbErr);
          }
        }

        console.log("==========================================");
        console.log("📊 DIAGNÓSTICO DE PROCESSAMENTO DE CURRÍCULO");
        console.log("==========================================");
        console.log(`PDF recebido: SIM`);
        console.log(`Tamanho: ${(file.size / 1024).toFixed(1)} KB`);
        console.log(`MIME type: ${file.mimetype}`);
        console.log(`Texto extraído: ${extraction.rawTextLength} caracteres`);
        console.log(`Quantidade de campos preenchidos: ${extraction.filledFieldsCount}`);
        console.log(`Campos preenchidos: ${extraction.filledFieldsList.join(", ")}`);
        console.log(`UID: ${maskedUid}`);
        console.log("==========================================");

        return res.json({
          success: true,
          message: "Dados extraídos com sucesso • PDF processado com IA",
          extracted: verifiedProfile,
          warning: extraction.warning,
          diagnostics: {
            pdfReceived: true,
            sizeKb: Math.round(file.size / 1024),
            rawTextLength: extraction.rawTextLength,
            filledFieldsCount: extraction.filledFieldsCount,
            filledFieldsList: extraction.filledFieldsList,
            maskedUid,
            projectId: REAL_FIREBASE_CONFIG.projectId,
            firestorePath: uid ? `users/${maskedUid}` : "guest_memory",
            verifiedInFirestore
          }
        });
      } catch (err: any) {
        console.error("Erro no processamento do currículo:", err);
        return res.status(500).json({
          success: false,
          error: "Erro interno ao processar o currículo PDF.",
          details: err?.message
        });
      }
    }
  );

  // Candidate Profile Get/Save Endpoints
  app.get("/api/candidate/profile", requireAuthenticatedUser(), async (req, res) => {
    try {
      const uid = req.firebaseUser?.id;
      if (!uid) return res.status(401).json({ success: false, error: "Não autenticado" });

      const db = getServerFirestore();
      const userDocRef = doc(db, "users", uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists() && snap.data()?.profile) {
        return res.json({ success: true, profile: snap.data().profile });
      }

      return res.json({ success: true, profile: null });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/candidate/profile", requireAuthenticatedUser(), async (req, res) => {
    try {
      const uid = req.firebaseUser?.id;
      if (!uid) return res.status(401).json({ success: false, error: "Não autenticado" });

      const { profile } = req.body;
      if (!profile || typeof profile !== "object") {
        return res.status(400).json({ success: false, error: "Dados do perfil ausentes." });
      }

      const db = getServerFirestore();
      const userDocRef = doc(db, "users", uid);

      const profileWithTimestamp = {
        ...profile,
        updatedAt: new Date().toISOString()
      };

      await setDoc(userDocRef, { profile: profileWithTimestamp }, { merge: true });

      return res.json({
        success: true,
        message: "Perfil atualizado com sucesso!",
        profile: profileWithTimestamp
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
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

  // Middleware global de tratamento de erros da API para evitar respostas HTML ou vazias
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[API_ERROR]", err);
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || "Erro no servidor ao processar a requisição."
    });
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
