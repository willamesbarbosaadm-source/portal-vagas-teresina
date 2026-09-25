// server.ts
import express from "express";
import path2 from "path";
import { collection as collection4, getDocs as getDocs4 } from "firebase/firestore";
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

// server/supabaseAuthHelper.ts
var ADMIN_EMAIL = "willamesbarbosaadm@gmail.com";
var REAL_SUPABASE_CONFIG = {
  url: "https://devkpsjwgvefikxbdsry.supabase.co",
  anonKey: "sb_publishable_LsczW5EBxyg99ChAsnsegw_QeLhEt0d"
};
var isPlaceholder2 = (val) => !val || ["", "undefined", "null", "your_supabase_url", "your_supabase_anon_key", "1sdcfds"].includes(
  val.trim().toLowerCase()
) || !val.trim().startsWith("http");
var isKeyPlaceholder = (val) => !val || ["", "undefined", "null", "your_supabase_anon_key", "placeholder-anon-key"].includes(
  val.trim().toLowerCase()
) || val.trim().length < 10;
function getSupabaseServerConfig() {
  const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const envAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const url = !isPlaceholder2(envUrl) ? envUrl.trim() : REAL_SUPABASE_CONFIG.url;
  const anonKey = !isKeyPlaceholder(envAnonKey) ? envAnonKey.trim() : REAL_SUPABASE_CONFIG.anonKey;
  const isConfigured = Boolean(
    url.startsWith("http") && anonKey.length > 10
  );
  return {
    url: isConfigured ? url : null,
    anonKey: isConfigured ? anonKey : null,
    isConfigured
  };
}
function isAuthorizedAdmin(email) {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}
async function validateSupabaseToken(token) {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return { ok: false, status: 401, error: "Token ausente ou inv\xE1lido." };
  }
  const parts = token.trim().split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return { ok: false, status: 401, error: "Formato de token JWT inv\xE1lido." };
  }
  try {
    const headerStr = Buffer.from(parts[0], "base64url").toString("utf8");
    const header = JSON.parse(headerStr);
    if (!header || typeof header !== "object") {
      return { ok: false, status: 401, error: "Cabe\xE7alho JWT inv\xE1lido." };
    }
    const alg = String(header.alg || "").toLowerCase().trim();
    if (!alg || alg === "none" || alg === "null") {
      return { ok: false, status: 401, error: "Algoritmo de assinatura n\xE3o permitido (alg: none)." };
    }
  } catch {
    return { ok: false, status: 401, error: "Falha ao decodificar cabe\xE7alho do token." };
  }
  if (parts[2] === "fake_signature" || parts[2].trim().length < 10) {
    return { ok: false, status: 401, error: "Assinatura criptogr\xE1fica do token forjada ou ausente." };
  }
  try {
    const payloadStr = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);
    if (payload && payload.exp && typeof payload.exp === "number") {
      if (payload.exp * 1e3 < Date.now()) {
        return { ok: false, status: 401, error: "Token de autentica\xE7\xE3o expirado." };
      }
    }
  } catch {
    return { ok: false, status: 401, error: "Payload do token corrompido." };
  }
  const { url, anonKey, isConfigured } = getSupabaseServerConfig();
  if (!isConfigured || !url || !anonKey) {
    return {
      ok: false,
      status: 503,
      error: "Servi\xE7o de autentica\xE7\xE3o Supabase n\xE3o configurado no servidor."
    };
  }
  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey
      }
    });
    if (!response.ok) {
      return {
        ok: false,
        status: 401,
        error: "Token rejeitado pelo provedor Supabase Auth."
      };
    }
    const userData = await response.json();
    const email = userData?.email ? String(userData.email).trim().toLowerCase() : "";
    if (!email) {
      return {
        ok: false,
        status: 401,
        error: "Usu\xE1rio sem e-mail retornado pelo provedor Supabase."
      };
    }
    const isAdmin = isAuthorizedAdmin(email);
    return {
      ok: true,
      status: 200,
      user: {
        id: String(userData.id || ""),
        email,
        isAdmin,
        role: userData.role
      }
    };
  } catch (networkErr) {
    return {
      ok: false,
      status: 503,
      error: "Falha de comunica\xE7\xE3o de rede com o servi\xE7o Supabase Auth."
    };
  }
}
async function requireSupabaseAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return next();
  }
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "Autentica\xE7\xE3o necess\xE1ria. Cabe\xE7alho Authorization ausente."
    });
  }
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Formato de autentica\xE7\xE3o inv\xE1lido. Utilize Bearer <token>."
    });
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token Bearer ausente."
    });
  }
  const result = await validateSupabaseToken(token);
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      error: result.error
    });
  }
  if (!result.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: "Acesso negado. Apenas o administrador possui permiss\xE3o para esta opera\xE7\xE3o."
    });
  }
  req.supabaseUser = result.user;
  return next();
}

// server.ts
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(express.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
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
  app.post("/api/sine/sync", requireSupabaseAdmin, async (req, res) => {
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
  app.post("/api/themos/sync", requireSupabaseAdmin, async (req, res) => {
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
  app.post("/api/gupy/sync", requireSupabaseAdmin, async (req, res) => {
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
