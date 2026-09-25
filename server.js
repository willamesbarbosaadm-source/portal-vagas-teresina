// server.ts
import express from "express";
import path2 from "path";
import multer from "multer";
import { collection as collection4, getDocs as getDocs4, doc as doc4, getDoc, setDoc as setDoc4 } from "firebase/firestore";
import { createServer as createViteServer } from "vite";

// server/sineProvider.ts
import * as cheerio from "cheerio";
import * as pdfParseModule from "pdf-parse";
import crypto from "crypto";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";

// server/firebaseDb.ts
import fs from "fs";
import path from "path";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
var isPlaceholder = (val) => !val || ["apikey", "projectid", "authdomain", "storagebucket", "messagingsenderid", "appid", "undefined", "null", ""].includes(
  val.trim().toLowerCase()
);
var REAL_FIREBASE_CONFIG = {
  projectId: !isPlaceholder(process.env.VITE_FIREBASE_PROJECT_ID) ? process.env.VITE_FIREBASE_PROJECT_ID.trim() : "studious-rig-bxhgq",
  appId: !isPlaceholder(process.env.VITE_FIREBASE_APP_ID) ? process.env.VITE_FIREBASE_APP_ID.trim() : "1:474330043803:web:a1b15dff9020cbded3bd3e",
  apiKey: !isPlaceholder(process.env.VITE_FIREBASE_API_KEY) ? process.env.VITE_FIREBASE_API_KEY.trim() : "AIzaSyC0b0I5OEIj8dIJ719hFfhN_Z2VPlGrvKw",
  authDomain: !isPlaceholder(process.env.VITE_FIREBASE_AUTH_DOMAIN) ? process.env.VITE_FIREBASE_AUTH_DOMAIN.trim() : "studious-rig-bxhgq.firebaseapp.com",
  firestoreDatabaseId: !isPlaceholder(process.env.VITE_FIREBASE_DATABASE_ID) ? process.env.VITE_FIREBASE_DATABASE_ID.trim() : "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413",
  storageBucket: !isPlaceholder(process.env.VITE_FIREBASE_STORAGE_BUCKET) ? process.env.VITE_FIREBASE_STORAGE_BUCKET.trim() : "studious-rig-bxhgq.firebasestorage.app",
  messagingSenderId: !isPlaceholder(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID.trim() : "474330043803"
};
function getServerFirestore() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : REAL_FIREBASE_CONFIG;
  const apps = getApps();
  let app = apps.find((a) => a.name === "[DEFAULT]");
  if (!app) {
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(config);
    }
  }
  const dbId = config.firestoreDatabaseId || REAL_FIREBASE_CONFIG.firestoreDatabaseId;
  return getFirestore(app, dbId);
}

// server/sineProvider.ts
var pdfParseAny = pdfParseModule;
function getSineDb() {
  try {
    return getServerFirestore();
  } catch (err) {
    console.error("Erro ao inicializar Firestore em SineProvider:", err);
    return null;
  }
}
function parsePublicationTimestamp(pubDateStr) {
  try {
    const parsed = Date.parse(`${pubDateStr}T00:00:00-03:00`);
    if (!isNaN(parsed)) return parsed;
  } catch (e) {
  }
  return Date.now();
}
function isJobExpired(publicationDateTime) {
  const TWENTY_DAYS_MS = 20 * 24 * 60 * 60 * 1e3;
  return Date.now() - publicationDateTime > TWENTY_DAYS_MS;
}
async function fetchSineJobsPage() {
  const url = "https://portal.pi.gov.br/sine/vagas-de-emprego/";
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch SINE-PI page: ${response.statusText}`);
  }
  return await response.text();
}
async function findLatestPdf(html) {
  const $ = cheerio.load(html);
  let latestPdf = {
    pdfUrl: "",
    pdfTitle: "",
    publicationDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  };
  const monthsMap = {
    "janeiro": "01",
    "fevereiro": "02",
    "mar\xE7o": "03",
    "abril": "04",
    "maio": "05",
    "junho": "06",
    "julho": "07",
    "agosto": "08",
    "setembro": "09",
    "outubro": "10",
    "novembro": "11",
    "dezembro": "12"
  };
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (href.toLowerCase().includes(".pdf") || text.toLowerCase().includes("ofertas de vagas")) {
      const match = text.match(/ofertas\s+de\s+vagas\s+em\s+(\d{1,2})\s+de\s+([a-záéíóúãõç]+)\s+de\s+(\d{4})/i);
      if (match) {
        const day = match[1].padStart(2, "0");
        const monthName = match[2].toLowerCase();
        const year = match[3];
        const month = monthsMap[monthName] || "09";
        const pubDate = `${year}-${month}-${day}`;
        if (!latestPdf.pdfUrl || pubDate >= latestPdf.publicationDate) {
          latestPdf = {
            pdfUrl: href.startsWith("http") ? href : `https://portal.pi.gov.br${href}`,
            pdfTitle: text,
            publicationDate: pubDate
          };
        }
      }
    }
  });
  if (!latestPdf.pdfUrl) {
    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.toLowerCase().includes(".pdf")) {
        latestPdf = {
          pdfUrl: href.startsWith("http") ? href : `https://portal.pi.gov.br${href}`,
          pdfTitle: $(el).text().trim() || "Ofertas de vagas SINE-PI",
          publicationDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        };
        return false;
      }
    });
  }
  return latestPdf;
}
async function downloadPdf(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to download PDF from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
async function extractPdfText(buffer) {
  try {
    if (typeof pdfParseAny === "function") {
      const data = await pdfParseAny(buffer);
      return data.text || "";
    } else if (pdfParseAny.PDFParse) {
      const parser = new pdfParseAny.PDFParse({ data: buffer });
      const data = await parser.getText();
      return data.text || "";
    } else if (typeof pdfParseAny.default === "function") {
      const data = await pdfParseAny.default(buffer);
      return data.text || "";
    }
    return "";
  } catch (err) {
    console.error("Erro na extra\xE7\xE3o de texto do PDF SINE:", err);
    throw err;
  }
}
function parseTeresinaJobs(text, publicationDate, pdfUrl) {
  const jobs = [];
  const lines = text.split("\n");
  const jobStartRegex = /^(\d{1,3})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç\s\/\-\(\)]+?)\s+(Médio completo|Médio incompleto|Medio incompleto|Medio completo|Fundamental completo|Fundamental Incompleto|Fundamental incompleto|Superior completo|Superior incompleto|Superior Incompleto|Não exigida|Nao exigida)\s+(Não exigida|Nao exigida|\d{1,2}\s+[Mm]eses|\d{1,2}\s+[Aa]nos)\s*(.*)$/i;
  let currentSection = "TERESINA";
  let isPcd = false;
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;
    if (rawLine.includes("VAGAS DISPON\xCDVEIS") || rawLine.includes("TERESINA-PI")) {
      currentSection = "TERESINA";
      isPcd = false;
      continue;
    }
    if (rawLine.includes("PESSOAS COM DEFICI\xCANCIA") || rawLine.includes("PCD")) {
      isPcd = true;
      continue;
    }
    if (rawLine.includes("FLORIANO") || rawLine.includes("PARNA\xCDBA") || rawLine.includes("PICOS") || rawLine.includes("PIRIPIRI")) {
      currentSection = "OUTRO";
      continue;
    }
    if (currentSection !== "TERESINA") continue;
    const match = rawLine.match(jobStartRegex);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const title = match[2].trim();
      const education = match[3].trim();
      const experience = match[4].trim();
      const details = match[5].trim() || "N\xE3o informado na publica\xE7\xE3o oficial";
      jobs.push(normalizeJob({
        title,
        quantity,
        education,
        experience,
        details
      }, publicationDate, pdfUrl, isPcd));
    } else if (jobs.length > 0) {
      if (!rawLine.startsWith("--") && !rawLine.startsWith("Qt.")) {
        jobs[jobs.length - 1].descricao_requisitos += " " + rawLine;
        jobs[jobs.length - 1].details += " " + rawLine;
        jobs[jobs.length - 1].observacoes += " " + rawLine;
      }
    }
  }
  return jobs;
}
function normalizeJob(partial, publicationDate, pdfUrl, pcd) {
  const title = partial.title?.trim() || partial.titulo?.trim() || "Oportunidade SINE-PI";
  const city = "Teresina";
  const state = "PI";
  const quantity = partial.quantity || partial.quantidade || 1;
  const education = partial.education?.trim() || partial.escolaridade?.trim() || "N\xE3o informado na publica\xE7\xE3o oficial";
  const experience = partial.experience?.trim() || partial.experiencia?.trim() || "N\xE3o informado na publica\xE7\xE3o oficial";
  const details = partial.details?.trim() || partial.descricao_requisitos?.trim() || "N\xE3o informado na publica\xE7\xE3o oficial";
  const company = partial.empresa?.trim() || "Empresa confidencial (Intermedia\xE7\xE3o SINE-PI)";
  const publicationDateTime = parsePublicationTimestamp(publicationDate);
  const status = isJobExpired(publicationDateTime) ? "EXPIRADA" : "ATIVA";
  const rawHashString = `SINE-PI_${publicationDate}_${city}_${title}_${quantity}_${pcd}_${company}`;
  const contentHash = crypto.createHash("sha256").update(rawHashString).digest("hex");
  const now = Date.now();
  return {
    titulo: title,
    empresa: company,
    cidade: city,
    estado: state,
    quantidade: quantity,
    escolaridade: education,
    experiencia: experience,
    descricao_requisitos: details,
    tipo_vaga: pcd ? "PCD" : "Geral",
    pcd,
    data_publicacao: publicationDate,
    fonte: "SINE-PI",
    pdf_url: pdfUrl,
    source_reference: "https://portal.pi.gov.br/sine/vagas-de-emprego/",
    imported_at: now,
    hash_vaga: contentHash,
    status,
    updated_at: now,
    // Compatibilidade reversa
    id: `sine_${contentHash.substring(0, 12)}`,
    source: "SINE-PI",
    title,
    education,
    experience,
    details,
    publicationDate,
    publicationDateTime,
    importedAt: now,
    sourcePdfUrl: pdfUrl,
    sourceUrl: "https://portal.pi.gov.br/sine/vagas-de-emprego/",
    contentHash,
    updatedAt: now,
    salario: "Piso Salarial / A Combinar",
    tipo_contrato: "CLT",
    modalidade: "Presencial",
    beneficios: ["Vale Transporte", "Benef\xEDcios Legais"],
    observacoes: details,
    requisitos: [education, `Experi\xEAncia: ${experience}`],
    cnh: "N\xE3o informado",
    ultima_verificacao: (/* @__PURE__ */ new Date()).toLocaleString("pt-BR"),
    isNew: true
  };
}
async function syncSineJobs() {
  const errors = [];
  let tJobsCount = 0;
  let pJobsCount = 0;
  let newJobsCount = 0;
  let updatedJobsCount = 0;
  let duplicatesCount = 0;
  const startedAt = Date.now();
  let pdfUrl = "https://portal.pi.gov.br/sine/vagas-de-emprego/";
  let pdfTitle = "Ofertas de vagas em 23 de Setembro de 2026";
  let publicationDate = "2026-09-23";
  try {
    const html = await fetchSineJobsPage();
    const latest = await findLatestPdf(html);
    pdfUrl = latest.pdfUrl;
    pdfTitle = latest.pdfTitle;
    publicationDate = latest.publicationDate;
    const pdfBuffer = await downloadPdf(pdfUrl);
    const pdfText = await extractPdfText(pdfBuffer);
    const allExtracted = parseTeresinaJobs(pdfText, publicationDate, pdfUrl);
    tJobsCount = allExtracted.filter((j) => !j.pcd).length;
    pJobsCount = allExtracted.filter((j) => j.pcd).length;
    const db = getSineDb();
    if (db) {
      const sineVagasRef = collection(db, "sine_vagas");
      const snapshot = await getDocs(sineVagasRef);
      const existingMap = /* @__PURE__ */ new Map();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const hash = data.hash_vaga || data.contentHash;
        if (hash) {
          existingMap.set(hash, { id: docSnap.id, ...data });
        }
      });
      for (const job of allExtracted) {
        if (existingMap.has(job.hash_vaga)) {
          const existing = existingMap.get(job.hash_vaga);
          const docRef = doc(db, "sine_vagas", existing.id);
          await setDoc(docRef, {
            ...job,
            updated_at: Date.now(),
            updatedAt: Date.now()
          }, { merge: true });
          duplicatesCount++;
          updatedJobsCount++;
        } else {
          const newDocRef = doc(sineVagasRef, job.hash_vaga);
          await setDoc(newDocRef, job);
          newJobsCount++;
        }
      }
      const logRef = collection(db, "sine_sync_logs");
      await setDoc(doc(logRef), {
        startedAt,
        finishedAt: Date.now(),
        status: errors.length === 0 ? "success" : "partial",
        publicationDate,
        pdfUrl,
        pdfTitle,
        foundJobs: allExtracted.length,
        teresinaJobs: tJobsCount,
        pcdJobs: pJobsCount,
        newJobs: newJobsCount,
        updatedJobs: updatedJobsCount,
        duplicateJobs: duplicatesCount,
        errorCount: errors.length,
        errors,
        timestamp: Date.now(),
        dataHora: (/* @__PURE__ */ new Date()).toLocaleString("pt-BR"),
        publicacaoEncontrada: pdfTitle,
        url: pdfUrl,
        vagasIdentificadas: allExtracted.length,
        vagasNovas: newJobsCount,
        vagasAtualizadas: updatedJobsCount,
        vagasDuplicadas: duplicatesCount,
        erro: false
      });
    }
  } catch (err) {
    errors.push(err.message);
    try {
      const db = getSineDb();
      if (db) {
        const logRef = collection(db, "sine_sync_logs");
        await setDoc(doc(logRef), {
          startedAt,
          finishedAt: Date.now(),
          status: "error",
          publicationDate,
          pdfUrl,
          pdfTitle,
          foundJobs: 0,
          newJobs: 0,
          updatedJobs: 0,
          duplicateJobs: 0,
          errorCount: errors.length,
          errors,
          timestamp: Date.now(),
          dataHora: (/* @__PURE__ */ new Date()).toLocaleString("pt-BR"),
          publicacaoEncontrada: pdfTitle,
          url: pdfUrl,
          vagasIdentificadas: 0,
          vagasNovas: 0,
          vagasAtualizadas: 0,
          vagasDuplicadas: 0,
          erro: true,
          mensagemErro: err.message
        });
      }
    } catch (e) {
    }
  }
  return {
    success: errors.length === 0,
    source: "SINE-PI",
    publicationDate,
    pdfUrl,
    pdfTitle,
    teresinaJobs: tJobsCount,
    pcdJobs: pJobsCount,
    newJobs: newJobsCount,
    updatedJobs: updatedJobsCount,
    duplicates: duplicatesCount,
    errors
  };
}

// server/themosProvider.ts
import * as cheerio2 from "cheerio";
import crypto2 from "crypto";
import { collection as collection2, doc as doc2, setDoc as setDoc2, getDocs as getDocs2 } from "firebase/firestore";
function getDb() {
  try {
    return getServerFirestore();
  } catch (err) {
    console.error("Erro ao inicializar Firestore em ThemosProvider:", err);
    return null;
  }
}
function isJobExpired2(publicationDateTime) {
  const TWENTY_DAYS_MS = 20 * 24 * 60 * 60 * 1e3;
  return Date.now() - publicationDateTime > TWENTY_DAYS_MS;
}
async function syncThemosJobs() {
  const errors = [];
  let found = 0;
  let newJobs = 0;
  let updatedJobs = 0;
  try {
    const targetUrl = "https://themosvagas.com.br/regiao/teresina/";
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (!response.ok) {
      throw new Error(`Falha ao acessar Themos Vagas: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio2.load(html);
    const jobs = [];
    $(".post, article, .vaga-item, .entry-title").each((_, el) => {
      const title = $(el).find("a").first().text().trim() || $(el).text().trim();
      const href = $(el).find("a").first().attr("href") || targetUrl;
      if (title && title.length > 3 && !title.toLowerCase().includes("p\xE1gina")) {
        const now = Date.now();
        const rawHashString = `ThemosVagas_${title}_Teresina`;
        const contentHash = crypto2.createHash("sha256").update(rawHashString).digest("hex");
        jobs.push({
          source: "Themos Vagas",
          city: "Teresina",
          state: "PI",
          title: title.slice(0, 100),
          company: "N\xE3o informado na publica\xE7\xE3o oficial",
          publicationDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          publicationDateTime: now,
          importedAt: now,
          sourceUrl: href,
          status: "active",
          contentHash,
          details: "Vaga coletada do Themos Vagas Teresina"
        });
      }
    });
    found = jobs.length;
    const db = getDb();
    if (db) {
      const collRef = collection2(db, "themos_vagas");
      const snap = await getDocs2(collRef);
      const existingMap = /* @__PURE__ */ new Map();
      snap.forEach((d) => {
        const data = d.data();
        if (data.contentHash) existingMap.set(data.contentHash, d.id);
      });
      for (const job of jobs) {
        if (existingMap.has(job.contentHash)) {
          const existingId = existingMap.get(job.contentHash);
          await setDoc2(doc2(db, "themos_vagas", existingId), {
            ...job,
            status: isJobExpired2(job.publicationDateTime) ? "expired" : "active"
          }, { merge: true });
          updatedJobs++;
        } else {
          const newDocRef = doc2(collRef);
          await setDoc2(newDocRef, {
            ...job,
            status: isJobExpired2(job.publicationDateTime) ? "expired" : "active"
          });
          newJobs++;
        }
      }
    }
  } catch (err) {
    errors.push(err.message);
  }
  return {
    success: errors.length === 0,
    source: "Themos Vagas",
    found,
    newJobs,
    updatedJobs,
    errors
  };
}

// server/gupyProvider.ts
import { collection as collection3, doc as doc3, setDoc as setDoc3 } from "firebase/firestore";
function getFirebaseDb() {
  try {
    return getServerFirestore();
  } catch (err) {
    console.error("Erro ao inicializar Firestore em GupyProvider:", err);
    return null;
  }
}
function cleanCompanyName(raw) {
  if (!raw) return "N\xE3o informado pela fonte";
  return raw.split(" - ")[0].split(" #")[0].trim();
}
function getInitials(name) {
  if (!name || name === "N\xE3o informado pela fonte") return "GP";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
function getCompanyColor(company) {
  const colors = [
    "bg-purple-600",
    "bg-blue-600",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-indigo-600",
    "bg-cyan-600",
    "bg-pink-600"
  ];
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
function mapContractType(rawType) {
  switch (rawType) {
    case "vacancy_type_effective":
      return "Efetivo (CLT)";
    case "vacancy_type_internship":
      return "Est\xE1gio";
    case "vacancy_type_apprentice":
      return "Jovem Aprendiz";
    case "vacancy_type_temporary":
      return "Tempor\xE1rio";
    case "vacancy_type_talent_pool":
      return "Banco de Talentos";
    case "vacancy_type_autonomous":
      return "Aut\xF4nomo";
    case "vacancy_legal_entity":
      return "PJ (Pessoa Jur\xEDdica)";
    default:
      return "N\xE3o informado pela fonte";
  }
}
function mapWorkMode(wp) {
  if (wp === "remote") return "Remoto";
  if (wp === "hybrid") return "H\xEDbrido";
  if (wp === "on-site") return "Presencial";
  return "N\xE3o informado pela fonte";
}
function mapLocation(raw) {
  if (raw.workplaceType === "remote") {
    return "Remoto";
  }
  if (raw.city && raw.state) {
    return `${raw.city} - ${raw.state}`;
  }
  if (raw.city) {
    return raw.city;
  }
  return "N\xE3o informado pela fonte";
}
function inferCategory(title, desc) {
  const text = (title + " " + desc).toLowerCase();
  if (text.includes("vendedor") || text.includes("vendas") || text.includes("comercial") || text.includes("caixa")) return "Vendas";
  if (text.includes("atendimento") || text.includes("recepcionista") || text.includes("sac")) return "Atendimento";
  if (text.includes("auxiliar") || text.includes("assistente") || text.includes("faturamento") || text.includes("administrativo") || text.includes("secretaria")) return "Administrativo";
  if (text.includes("limpeza") || text.includes("conservacao") || text.includes("operacoes") || text.includes("estoque") || text.includes("mecanico") || text.includes("motorista")) return "Operacional";
  if (text.includes("desenvolvedor") || text.includes("software") || text.includes("ti") || text.includes("suporte") || text.includes("tecnologia")) return "Tecnologia";
  if (text.includes("enfermeiro") || text.includes("medico") || text.includes("saude") || text.includes("farmaceutico")) return "Sa\xFAde";
  if (text.includes("marketing") || text.includes("midia") || text.includes("designer")) return "Marketing";
  return "Geral";
}
function inferExperienceLevel(title) {
  const t = title.toLowerCase();
  if (t.includes("estagio") || t.includes("est\xE1gio")) return "Est\xE1gio";
  if (t.includes("trainee") || t.includes("jovem aprendiz") || t.includes("aprendiz")) return "Jovem Aprendiz";
  if (t.includes("junior") || t.includes("j\xFAnior") || t.includes("auxiliar") || t.includes("assistente")) return "J\xFAnior";
  if (t.includes("senior") || t.includes("s\xEAnior") || t.includes("gerente") || t.includes("coordenador") || t.includes("supervisor")) return "S\xEAnior";
  if (t.includes("pleno")) return "Pleno";
  return "Sem Experi\xEAncia";
}
function extractRequirementsAndBenefits(description) {
  const requirements = [];
  const benefits = [];
  if (!description) return { requirements, benefits };
  const plainText = description.replace(/<[^>]+>/g, "\n");
  const lines = plainText.split("\n").map((l) => l.trim()).filter(Boolean);
  let currentSection = "none";
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("requisito") || lower.includes("qualifica\xE7") || lower.includes("o que precisamos")) {
      currentSection = "req";
      continue;
    }
    if (lower.includes("benef\xEDcio") || lower.includes("informa\xE7\xF5es adicionais") || lower.includes("o que oferecemos")) {
      currentSection = "ben";
      continue;
    }
    if (line.startsWith("\u2022") || line.startsWith("-") || line.startsWith("*")) {
      const cleaned = line.replace(/^[•\-\*]\s*/, "").trim();
      if (cleaned.length > 3) {
        if (currentSection === "req") requirements.push(cleaned);
        else if (currentSection === "ben") benefits.push(cleaned);
      }
    }
  }
  return { requirements: requirements.slice(0, 6), benefits: benefits.slice(0, 6) };
}
function convertGupyJob(raw) {
  const company = cleanCompanyName(raw.careerPageName);
  const workMode = mapWorkMode(raw.workplaceType);
  const contractType = mapContractType(raw.type);
  const location = mapLocation(raw);
  const descClean = (raw.description || "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const { requirements, benefits } = extractRequirementsAndBenefits(raw.description || "");
  let postedAt = "Data de publica\xE7\xE3o n\xE3o informada pela fonte";
  let timestamp = 0;
  let publishedDate = void 0;
  let isNew = false;
  if (raw.publishedDate) {
    const pubDate = new Date(raw.publishedDate);
    if (!isNaN(pubDate.getTime())) {
      timestamp = pubDate.getTime();
      publishedDate = raw.publishedDate;
      postedAt = pubDate.toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" });
      isNew = Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1e3;
    }
  }
  return {
    id: `gupy-${raw.id}`,
    title: raw.name ? raw.name.trim() : "T\xEDtulo n\xE3o informado pela fonte",
    company,
    companyInitials: getInitials(company),
    companyColor: getCompanyColor(company),
    location,
    workMode,
    contractType,
    experienceLevel: inferExperienceLevel(raw.name || ""),
    category: inferCategory(raw.name || "", descClean),
    salary: "N\xE3o informado pela fonte",
    education: "N\xE3o informado pela fonte",
    description: descClean.length > 0 ? descClean.substring(0, 500) + "..." : "Descri\xE7\xE3o n\xE3o informada pela fonte",
    requirements: requirements.length > 0 ? requirements : ["Consulte os requisitos completos no link oficial da Gupy."],
    benefits: benefits.length > 0 ? benefits : ["Consulte os benef\xEDcios no link oficial da Gupy."],
    tags: ["Gupy Oficial", location.includes("Teresina") ? "Teresina" : location, workMode, contractType].filter(Boolean),
    postedAt,
    timestamp,
    publishedDate,
    applicationUrl: raw.jobUrl || "",
    isNew,
    isFeatured: false,
    viewsCount: 0,
    source: "Gupy",
    sourceUrl: raw.jobUrl || "",
    pcdOnly: Boolean(raw.disabilities)
  };
}
async function fetchGupyTeresinaJobs() {
  try {
    const url = "https://portal.gupy.io/api/job-search/jobs?city=Teresina&state=Piau%C3%AD&limit=100&offset=0&sortBy=publishedDate";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*"
      }
    });
    if (!response.ok) {
      throw new Error(`Falha ao buscar vagas na API da Gupy: Status ${response.status}`);
    }
    const json = await response.json();
    const rawJobs = json.data || [];
    const seenIds = /* @__PURE__ */ new Set();
    const seenUrls = /* @__PURE__ */ new Set();
    const uniqueJobs = [];
    for (const raw of rawJobs) {
      const isTeresina = raw.city && raw.city.toLowerCase() === "teresina" || !raw.city && raw.state && raw.state.toLowerCase() === "piau\xED";
      const isRemote = raw.workplaceType === "remote";
      if (!isTeresina && !isRemote) {
        continue;
      }
      const converted = convertGupyJob(raw);
      if (seenIds.has(converted.id)) continue;
      if (converted.applicationUrl && seenUrls.has(converted.applicationUrl)) continue;
      seenIds.add(converted.id);
      if (converted.applicationUrl) seenUrls.add(converted.applicationUrl);
      uniqueJobs.push(converted);
    }
    console.log(`[GupyProvider] ${uniqueJobs.length} vagas de Teresina/Remoto validadas do Portal Gupy.`);
    return uniqueJobs;
  } catch (err) {
    console.error("[GupyProvider] Erro ao buscar vagas do Gupy:", err.message);
    return [];
  }
}
async function syncGupyJobs() {
  const jobs = await fetchGupyTeresinaJobs();
  const db = getFirebaseDb();
  let savedCount = 0;
  if (db && jobs.length > 0) {
    const colRef = collection3(db, "gupy_jobs");
    for (const job of jobs) {
      try {
        const docRef = doc3(colRef, job.id);
        await setDoc3(docRef, { ...job, _syncedAt: Date.now() }, { merge: true });
        savedCount++;
      } catch (err) {
        console.error(`Erro ao salvar vaga Gupy ${job.id} no Firestore:`, err);
      }
    }
  }
  return {
    success: true,
    totalFetched: jobs.length,
    savedToFirestore: savedCount,
    jobs
  };
}

// server/firebaseAuthHelper.ts
import { initializeApp as initializeApp2, getApps as getApps2, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
var ADMIN_EMAIL = "willamesbarbosaadm@gmail.com";
var AUTH_PROJECT_ID = "equipamento-estudantis-bxhgq";
var AUTH_ADMIN_APP_NAME = "auth-admin-app";
function getAuthAdmin() {
  const existingApp = getApps2().find((a) => a.name === AUTH_ADMIN_APP_NAME);
  if (existingApp) {
    return getAuth(existingApp);
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_AUTH_PROJECT_ID || AUTH_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }
  const appOptions = {
    projectId
  };
  if (clientEmail && privateKey) {
    appOptions.credential = cert({
      projectId,
      clientEmail,
      privateKey
    });
  }
  const app = initializeApp2(appOptions, AUTH_ADMIN_APP_NAME);
  return getAuth(app);
}
function isAuthorizedAdmin(email) {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}
async function validateFirebaseToken(token, options) {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return { ok: false, status: 401, error: "Token ausente ou inv\xE1lido." };
  }
  const cleanToken = token.trim();
  const parts = cleanToken.split(".");
  if (parts.length !== 3) {
    return { ok: false, status: 401, error: "Formato de token JWT inv\xE1lido." };
  }
  try {
    const authAdmin = getAuthAdmin();
    const decodedToken = await authAdmin.verifyIdToken(cleanToken);
    const expectedProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_AUTH_PROJECT_ID || AUTH_PROJECT_ID;
    if (decodedToken.aud !== expectedProjectId) {
      return {
        ok: false,
        status: 401,
        error: `Token emitido para projeto n\xE3o autorizado (${decodedToken.aud}). Esperado: ${expectedProjectId}.`
      };
    }
    const email = (decodedToken.email || "").toLowerCase().trim();
    if (!email) {
      return {
        ok: false,
        status: 401,
        error: "Token n\xE3o cont\xE9m endere\xE7o de e-mail associado."
      };
    }
    const emailVerified = Boolean(decodedToken.email_verified);
    if (options?.requireEmailVerified && !emailVerified) {
      return {
        ok: false,
        status: 403,
        error: "E-mail n\xE3o verificado. Confirme seu e-mail antes de prosseguir."
      };
    }
    const isAdmin = isAuthorizedAdmin(email);
    return {
      ok: true,
      status: 200,
      user: {
        id: decodedToken.uid,
        email,
        isAdmin,
        emailVerified,
        displayName: decodedToken.name,
        decodedToken
      }
    };
  } catch (err) {
    const code = err?.code || "";
    const message = err?.message || "";
    if (code === "auth/id-token-expired") {
      return { ok: false, status: 401, error: "Token de autentica\xE7\xE3o expirado." };
    }
    if (code === "auth/id-token-revoked") {
      return { ok: false, status: 401, error: "Token de autentica\xE7\xE3o foi revogado." };
    }
    if (code === "auth/invalid-id-token" || code === "auth/argument-error") {
      return { ok: false, status: 401, error: "Assinatura ou formato do token Firebase inv\xE1lido." };
    }
    if (code === "auth/project-not-found") {
      return { ok: false, status: 503, error: "Projeto Firebase de autentica\xE7\xE3o n\xE3o encontrado." };
    }
    return {
      ok: false,
      status: 401,
      error: `Falha na verifica\xE7\xE3o criptogr\xE1fica do token: ${message || "Token rejeitado."}`
    };
  }
}
async function requireFirebaseAdmin(req, res, next) {
  const cronSecret = process.env.CRON_SECRET;
  const cronHeader = req.headers["x-cron-secret"];
  const authHeader = req.headers.authorization;
  if (cronSecret && cronSecret.length >= 8) {
    if (cronHeader && cronHeader === cronSecret) {
      return next();
    }
    if (authHeader && authHeader === `Bearer ${cronSecret}`) {
      return next();
    }
  }
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Autentica\xE7\xE3o necess\xE1ria. Cabe\xE7alho Authorization ausente ou inv\xE1lido."
    });
    return;
  }
  const token = authHeader.replace(/^Bearer\s+/, "").trim();
  const validation = await validateFirebaseToken(token);
  if (!validation.ok) {
    res.status(validation.status).json({
      success: false,
      error: validation.error
    });
    return;
  }
  if (!validation.user.isAdmin) {
    res.status(403).json({
      success: false,
      error: "Acesso negado. Apenas o administrador possui permiss\xE3o para esta opera\xE7\xE3o."
    });
    return;
  }
  req.firebaseUser = validation.user;
  next();
}
function requireAuthenticatedUser(options) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Autentica\xE7\xE3o necess\xE1ria. Cabe\xE7alho Authorization ausente ou inv\xE1lido."
      });
      return;
    }
    const token = authHeader.replace(/^Bearer\s+/, "").trim();
    const validation = await validateFirebaseToken(token, {
      requireEmailVerified: options?.requireEmailVerified ?? false
    });
    if (!validation.ok) {
      res.status(validation.status).json({
        success: false,
        error: validation.error
      });
      return;
    }
    req.firebaseUser = validation.user;
    next();
  };
}

// server/resumeExtractor.ts
import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";
var emptyProfile = {
  name: "",
  phone: "",
  city: "",
  address: "",
  desiredRole: "",
  education: "",
  experience: "",
  salaryExpectation: "",
  linkedin: "",
  modality: "",
  contractType: "",
  skills: "",
  summary: ""
};
function cleanPdfText(text) {
  if (!text) return "";
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function heuristicExtract(text) {
  const profile = { ...emptyProfile };
  if (!text) return profile;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 50 && !/curr[ií]culo|resumo|email|telefone|contato/i.test(line)) {
      profile.name = line;
      break;
    }
  }
  const phoneMatch = text.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s]?\d{4}/);
  if (phoneMatch) {
    profile.phone = phoneMatch[0].trim();
  }
  const cityMatch = text.match(/(Teresina|Timon|Parnaíba|Picos|Floriano|Campo Maior|Piripiri)[^,\n]*/i);
  if (cityMatch) {
    profile.city = cityMatch[0].trim();
  } else {
    const genCityMatch = text.match(/(?:cidade|localidade|endereço):\s*([^\n]+)/i);
    if (genCityMatch) profile.city = genCityMatch[1].trim();
  }
  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) {
    profile.linkedin = linkedinMatch[0].trim();
  }
  const eduMatch = text.match(/(?:formação|escolaridade|graduação|ensino|curso)[^\n]*\n([\s\S]{1,250}?)(?=\n\n|\n[A-Z\s]{4,}:|$)/i);
  if (eduMatch) {
    profile.education = eduMatch[1].trim();
  }
  const expMatch = text.match(/(?:experiência|histórico profissional|atuacao)[^\n]*\n([\s\S]{1,400}?)(?=\n\n|\n[A-Z\s]{4,}:|$)/i);
  if (expMatch) {
    profile.experience = expMatch[1].trim();
  }
  const skillsMatch = text.match(/(?:competências|habilidades|conhecimentos|skills)[^\n]*\n?([^\n]{1,200})/i);
  if (skillsMatch) {
    profile.skills = skillsMatch[1].trim();
  }
  const roleMatch = text.match(/(?:cargo|objetivo|função|vaga de interesse):\s*([^\n]+)/i);
  if (roleMatch) {
    profile.desiredRole = roleMatch[1].trim();
  }
  const summaryMatch = text.match(/(?:resumo|perfil profissional|sobre mim):\s*([^\n]+(?:\n[^\n]+){0,3})/i);
  if (summaryMatch) {
    profile.summary = summaryMatch[1].trim();
  }
  return profile;
}
async function extractTextFromPdfBuffer(pdfBuffer) {
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const textResult = await parser.getText();
    const rawText = textResult?.text || "";
    return cleanPdfText(rawText);
  } catch (err) {
    console.warn("[PDF_PARSER] Erro ao extrair texto do PDF via PDFParse:", err?.message || err);
    return "";
  }
}
async function extractCandidateProfileFromPdf(pdfBuffer, filename) {
  let rawText = "";
  try {
    rawText = await extractTextFromPdfBuffer(pdfBuffer);
  } catch (e) {
    console.warn("[PDF_PARSER] Leitura direta de texto falhou:", e);
  }
  const rawTextLength = rawText.length;
  const sampleText = rawText.substring(0, 300);
  const isScannedPdf = rawTextLength < 30;
  let extracted = { ...emptyProfile };
  let warning;
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const pdfBase64 = pdfBuffer.toString("base64");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: pdfBase64
                }
              },
              {
                text: `Analise com aten\xE7\xE3o o arquivo PDF de curr\xEDculo em anexo e extraia todas as informa\xE7\xF5es profissionais do candidato em formato JSON estrito.

A resposta DEVE ser exclusivamente um JSON v\xE1lido com as seguintes chaves:
{
  "name": "Nome completo do candidato",
  "phone": "Telefone ou WhatsApp de contato",
  "city": "Cidade e estado (ex: Teresina - PI)",
  "address": "Bairro ou endere\xE7o",
  "desiredRole": "Cargo ou \xE1rea profissional pretendida",
  "education": "Resumo da forma\xE7\xE3o acad\xEAmica e cursos",
  "experience": "Principais experi\xEAncias de trabalho e fun\xE7\xF5es anteriores",
  "salaryExpectation": "Pretens\xE3o salarial se informada ou 'A combinar'",
  "linkedin": "Link do perfil do LinkedIn se houver",
  "modality": "Presencial, Remoto ou H\xEDbrido",
  "contractType": "CLT, PJ ou Est\xE1gio",
  "skills": "Compet\xEAncias e habilidades principais separadas por v\xEDrgula",
  "summary": "Resumo do perfil profissional do candidato"
}

Regras:
1. Se algum campo n\xE3o estiver presente no documento, deixe como string vazia "".
2. Se o PDF for uma imagem ou escaneado, leia todo o texto visual do curr\xEDculo.
3. N\xE3o invente informa\xE7\xF5es fict\xEDcias, use apenas o conte\xFAdo do documento.`
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
      const jsonText = response.text?.trim() || "";
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        extracted = {
          name: parsed.name || "",
          phone: parsed.phone || "",
          city: parsed.city || "",
          address: parsed.address || "",
          desiredRole: parsed.desiredRole || "",
          education: parsed.education || "",
          experience: parsed.experience || "",
          salaryExpectation: parsed.salaryExpectation || "",
          linkedin: parsed.linkedin || "",
          modality: parsed.modality || "",
          contractType: parsed.contractType || "",
          skills: Array.isArray(parsed.skills) ? parsed.skills.join(", ") : parsed.skills || "",
          summary: parsed.summary || ""
        };
      }
    } catch (llmErr) {
      console.warn("[GEMINI_EXTRACTOR] Erro na extra\xE7\xE3o multimodal do Gemini. Usando fallback regex:", llmErr?.message || llmErr);
      extracted = heuristicExtract(rawText);
    }
  } else {
    extracted = heuristicExtract(rawText);
  }
  if (!extracted.name && filename) {
    const cleanFileName = filename.replace(/\.pdf$/i, "").replace(/curr[ií]culo|cv|resume| - /gi, " ").replace(/[_-]+/g, " ").trim();
    if (cleanFileName.length >= 3 && cleanFileName.length < 40) {
      extracted.name = cleanFileName;
    }
  }
  const filledFieldsList = Object.entries(extracted).filter(([_, value]) => Boolean(value && typeof value === "string" && value.trim().length > 0)).map(([key]) => key);
  const filledFieldsCount = filledFieldsList.length;
  if (filledFieldsCount === 0) {
    warning = "N\xE3o foi poss\xEDvel identificar dados no PDF. Voc\xEA pode preencher os campos manualmente.";
  }
  return {
    extracted,
    rawTextLength,
    sampleText,
    filledFieldsCount,
    filledFieldsList,
    isScannedPdf,
    warning
  };
}

// server.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB
});
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(express.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post(
    "/api/candidate/resume",
    requireAuthenticatedUser(),
    upload.single("resume"),
    async (req, res) => {
      try {
        const file = req.file || req.files?.[0];
        if (!file || !file.buffer) {
          return res.status(400).json({
            success: false,
            error: "Nenhum arquivo PDF enviado ou formato inv\xE1lido."
          });
        }
        const uid = req.firebaseUser?.id;
        if (!uid) {
          return res.status(401).json({
            success: false,
            error: "Usu\xE1rio n\xE3o autenticado."
          });
        }
        const extraction = await extractCandidateProfileFromPdf(file.buffer, file.originalname);
        const db = getServerFirestore();
        const userDocRef = doc4(db, "users", uid);
        let existingProfile = {};
        try {
          const snapBefore = await getDoc(userDocRef);
          if (snapBefore.exists()) {
            existingProfile = snapBefore.data()?.profile || {};
          }
        } catch (readErr) {
          console.warn("[RESUME_UPLOAD] Erro ao ler documento pr\xE9vio do usu\xE1rio:", readErr);
        }
        const mergedProfile = {
          ...existingProfile,
          ...extraction.extracted,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await setDoc4(userDocRef, { profile: mergedProfile }, { merge: true });
        const savedSnap = await getDoc(userDocRef);
        const savedData = savedSnap.exists() ? savedSnap.data() : null;
        const verifiedProfile = savedData?.profile || mergedProfile;
        const maskedUid = uid.length > 8 ? `${uid.substring(0, 4)}...${uid.substring(uid.length - 4)}` : uid;
        console.log("==========================================");
        console.log("\u{1F4CA} DIAGN\xD3STICO DE PROCESSAMENTO DE CURR\xCDCULO");
        console.log("==========================================");
        console.log(`PDF recebido: SIM`);
        console.log(`Tamanho: ${(file.size / 1024).toFixed(1)} KB`);
        console.log(`MIME type: ${file.mimetype}`);
        console.log(`Texto extra\xEDdo: ${extraction.rawTextLength} caracteres`);
        console.log(`Primeiros 300 caracteres: "${extraction.sampleText.substring(0, 150)}..."`);
        console.log(`Quantidade de campos preenchidos: ${extraction.filledFieldsCount}`);
        console.log(`Campos preenchidos: ${extraction.filledFieldsList.join(", ")}`);
        console.log(`UID: ${maskedUid}`);
        console.log(`Firestore Project: ${REAL_FIREBASE_CONFIG.projectId}`);
        console.log(`Firestore Database: ${REAL_FIREBASE_CONFIG.firestoreDatabaseId}`);
        console.log(`Documento Firestore: users/${maskedUid}`);
        console.log(`Verifica\xE7\xE3o de Leitura Firestore: ${savedSnap.exists() ? "SUCESSO" : "FALHA"}`);
        console.log("==========================================");
        return res.json({
          success: true,
          message: "Dados extra\xEDdos com sucesso \u2022 PDF exclu\xEDdo ap\xF3s o processamento",
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
            firestorePath: `users/${maskedUid}`,
            verifiedInFirestore: savedSnap.exists()
          }
        });
      } catch (err) {
        console.error("Erro no processamento do curr\xEDculo:", err);
        return res.status(500).json({
          success: false,
          error: "Erro interno ao processar o curr\xEDculo PDF.",
          details: err?.message
        });
      }
    }
  );
  app.get("/api/candidate/profile", requireAuthenticatedUser(), async (req, res) => {
    try {
      const uid = req.firebaseUser?.id;
      if (!uid) return res.status(401).json({ success: false, error: "N\xE3o autenticado" });
      const db = getServerFirestore();
      const userDocRef = doc4(db, "users", uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists() && snap.data()?.profile) {
        return res.json({ success: true, profile: snap.data().profile });
      }
      return res.json({ success: true, profile: null });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/candidate/profile", requireAuthenticatedUser(), async (req, res) => {
    try {
      const uid = req.firebaseUser?.id;
      if (!uid) return res.status(401).json({ success: false, error: "N\xE3o autenticado" });
      const { profile } = req.body;
      if (!profile || typeof profile !== "object") {
        return res.status(400).json({ success: false, error: "Dados do perfil ausentes." });
      }
      const db = getServerFirestore();
      const userDocRef = doc4(db, "users", uid);
      const profileWithTimestamp = {
        ...profile,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await setDoc4(userDocRef, { profile: profileWithTimestamp }, { merge: true });
      return res.json({
        success: true,
        message: "Perfil atualizado com sucesso!",
        profile: profileWithTimestamp
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/sine/jobs", async (req, res) => {
    try {
      const db = getServerFirestore();
      const snap = await getDocs4(collection4(db, "sine_vagas"));
      if (!snap.empty) {
        const firestoreJobs = [];
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
    } catch (e) {
      console.error("Erro ao ler sine_vagas do Firestore:", e);
      return res.status(503).json({
        success: false,
        error: "Firestore indispon\xEDvel"
      });
    }
  });
  app.get("/api/cron/sine-pi", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(503).json({ error: "Servi\xE7o indispon\xEDvel. CRON_SECRET n\xE3o configurado no servidor." });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized. Invalid or missing CRON_SECRET." });
    }
    try {
      const syncResult = await syncSineJobs();
      res.json(syncResult);
    } catch (error) {
      console.error("SINE-PI sync error:", error);
      res.status(500).json({
        success: false,
        error: "N\xE3o foi poss\xEDvel atualizar as vagas do SINE-PI neste momento.",
        details: error.message
      });
    }
  });
  app.post("/api/sine/sync", requireFirebaseAdmin, async (req, res) => {
    try {
      const syncResult = await syncSineJobs();
      res.json(syncResult);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/cron/themos", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(503).json({ error: "Servi\xE7o indispon\xEDvel. CRON_SECRET n\xE3o configurado no servidor." });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized. Invalid or missing CRON_SECRET." });
    }
    try {
      const syncResult = await syncThemosJobs();
      res.json(syncResult);
    } catch (error) {
      console.error("Themos Vagas sync error:", error);
      res.status(500).json({
        success: false,
        error: "N\xE3o foi poss\xEDvel atualizar as vagas do Themos Vagas neste momento.",
        details: error.message
      });
    }
  });
  app.post("/api/themos/sync", requireFirebaseAdmin, async (req, res) => {
    try {
      const syncResult = await syncThemosJobs();
      res.json(syncResult);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/gupy/jobs", async (req, res) => {
    try {
      const jobs = await fetchGupyTeresinaJobs();
      if (jobs.length > 0) {
        return res.json({ success: true, count: jobs.length, jobs, source: "live" });
      }
      try {
        const db = getServerFirestore();
        const snap = await getDocs4(collection4(db, "gupy_jobs"));
        if (!snap.empty) {
          const storedJobs = [];
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
              source: "stored_catalog",
              notice: "Vagas do cat\xE1logo previamente sincronizado da Gupy"
            });
          }
        }
      } catch (firestoreErr) {
        console.warn("Fallback Firestore gupy_jobs error:", firestoreErr);
      }
      res.status(200).json({
        success: false,
        count: 0,
        jobs: [],
        message: "Vagas Gupy temporariamente indispon\xEDveis."
      });
    } catch (error) {
      console.error("Gupy fetch error:", error);
      res.status(500).json({
        success: false,
        count: 0,
        jobs: [],
        error: "Vagas Gupy temporariamente indispon\xEDveis."
      });
    }
  });
  app.get("/api/cron/gupy", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(503).json({ error: "Servi\xE7o indispon\xEDvel. CRON_SECRET n\xE3o configurado no servidor." });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized. Invalid or missing CRON_SECRET." });
    }
    try {
      const syncResult = await syncGupyJobs();
      res.json(syncResult);
    } catch (error) {
      console.error("Gupy sync error:", error);
      res.status(500).json({ success: false, error: "Erro ao sincronizar vagas do Gupy Teresina." });
    }
  });
  app.post("/api/gupy/sync", requireFirebaseAdmin, async (req, res) => {
    try {
      const syncResult = await syncGupyJobs();
      res.json(syncResult);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (0.0.0.0:${PORT})`);
  });
  server.keepAliveTimeout = 65e3;
  server.headersTimeout = 66e3;
}
startServer().catch((err) => {
  console.error("FATAL ERROR starting server:", err);
  process.exit(1);
});
