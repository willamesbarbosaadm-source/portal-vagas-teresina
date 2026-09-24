// server.ts
import express from "express";
import path4 from "path";
import fs4 from "fs";
import { initializeApp as initializeApp4, getApps as getApps4, getApp as getApp4 } from "firebase/app";
import { getFirestore as getFirestore4, collection as collection4, getDocs as getDocs4 } from "firebase/firestore";
import { createServer as createViteServer } from "vite";

// server/sineProvider.ts
import * as cheerio from "cheerio";
import * as pdfParseModule from "pdf-parse";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";
var pdfParseAny = pdfParseModule;
function getSineDb() {
  try {
    let firebaseConfigData = null;
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      firebaseConfigData = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } else if (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_CONFIG) {
      firebaseConfigData = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {
        apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
      };
    }
    if (!firebaseConfigData) {
      console.warn("Configura\xE7\xE3o do Firebase n\xE3o encontrada para SINE");
      return null;
    }
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigData);
    const dbId = process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413";
    return getFirestore(app, dbId);
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
import fs2 from "fs";
import path2 from "path";
import { initializeApp as initializeApp2, getApps as getApps2, getApp as getApp2 } from "firebase/app";
import { getFirestore as getFirestore2, collection as collection2, doc as doc2, setDoc as setDoc2, getDocs as getDocs2 } from "firebase/firestore";
function getDb() {
  try {
    let firebaseConfigData = null;
    const configPath = path2.join(process.cwd(), "firebase-applet-config.json");
    if (fs2.existsSync(configPath)) {
      firebaseConfigData = JSON.parse(fs2.readFileSync(configPath, "utf8"));
    } else if (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_CONFIG) {
      firebaseConfigData = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {
        apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
      };
    }
    if (!firebaseConfigData) {
      console.warn("Configura\xE7\xE3o do Firebase n\xE3o encontrada para Themos");
      return null;
    }
    const app = getApps2().length > 0 ? getApp2() : initializeApp2(firebaseConfigData);
    const dbId = process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413";
    return getFirestore2(app, dbId);
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
import fs3 from "fs";
import path3 from "path";
import { initializeApp as initializeApp3, getApps as getApps3, getApp as getApp3 } from "firebase/app";
import { getFirestore as getFirestore3, collection as collection3, doc as doc3, setDoc as setDoc3 } from "firebase/firestore";
function getFirebaseDb() {
  try {
    let firebaseConfigData = null;
    const configPath = path3.join(process.cwd(), "firebase-applet-config.json");
    if (fs3.existsSync(configPath)) {
      firebaseConfigData = JSON.parse(fs3.readFileSync(configPath, "utf8"));
    } else if (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_CONFIG) {
      firebaseConfigData = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {
        apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
      };
    }
    if (!firebaseConfigData) {
      console.warn("Configura\xE7\xE3o do Firebase n\xE3o encontrada para Gupy");
      return null;
    }
    const app = getApps3().length > 0 ? getApp3() : initializeApp3(firebaseConfigData);
    const dbId = process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413";
    return getFirestore3(app, dbId);
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

// src/data/sineInitialJobs.ts
var INITIAL_SINE_JOBS = [
  {
    "id": "sine-0-1790174577385",
    "titulo": "Atendente de lojas",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Atendimento de clientes; realizar or\xE7amento de servi\xE7os; realizar levantamento e pre\xE7os e servi\xE7os; entre outros. Conhecimentos em inform\xE1tica/tecnologia",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577385,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_atendente_de_lojas_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-1-1790174577423",
    "titulo": "Atendente de mesa",
    "quantidade": "10 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Medio incompleto",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Medio incompleto",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Atendente de restaurante: realizar o atendimento e auxiliar na escolha do card\xE1pio; registrar os pedidos e encaminh\xE1-los \xE0 cozinha.auxiliar na montagem e organiza\xE7\xE3o das mesas. Manter a limpeza e organiza\xE7\xE3o do restaurante internamente e externamente; entre outras atribui\xE7\xF5es correlatas a fun\xE7\xE3o",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_atendente_de_mesa_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-2-1790174577423",
    "titulo": "Auxiliar de cozinha",
    "quantidade": "17 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental Incompleto",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental Incompleto",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Auxiliar nos servi\xE7os de pr\xE9-preparo, preparo, processamento de alimentos, montagem de pratos e embalagens; realizar a manuten\xE7\xE3o, organiza\xE7\xE3o e limpeza dos ambientes internos e externos, incluindo a c\xE2mara congelada, estoques e equipamentos; apoio no descarregamento de produtos, entre outras atriui\xE7\xF5es correlatas a fun\xE7\xE3o.",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_auxiliar_de_cozinha_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-3-1790174577423",
    "titulo": "Auxiliar de linha de produ\xE7\xE3o",
    "quantidade": "5 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Vaga para carregar peso",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_auxiliar_de_linha_de_produ\xE7\xE3o_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-4-1790174577423",
    "titulo": "Auxiliar t\xE9cnico de montagem",
    "quantidade": "5 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Auxiliar de fibra optica",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_auxiliar_t\xE9cnico_de_montagem_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-5-1790174577423",
    "titulo": "Bombeiro hidr\xE1ulico",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "03 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 03 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_bombeiro_hidr\xE1ulico_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-6-1790174577423",
    "titulo": "Carpinteiro",
    "quantidade": "4 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "03 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 03 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_carpinteiro_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-7-1790174577423",
    "titulo": "Caseiro",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "03 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 03 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_caseiro_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-8-1790174577423",
    "titulo": "Encarregado de obras",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida 2",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_encarregado_de_obras_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-9-1790174577423",
    "titulo": "Jardineiro",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Ensino fundamental completo, desej\xE1vel transporte, experi\xEAncia comprovada, conhecimento em jardinagem e paisagismo, manejo de ferramentas (ro\xE7adeiro trator de pequeno porte).",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_jardineiro_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-10-1790174577423",
    "titulo": "Jardineiro",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Manuten\xE7\xE3o de jardins e \xE1reas externas; poda de plantas e gramas; irriga\xE7\xE3o e cuidados gerais com plantas; limpeza e conserva\xE7\xE3o dos espa\xE7os verdes; outras atividades correlatas a fun\xE7\xE3o",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_jardineiro_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-11-1790174577423",
    "titulo": "Lavador de ve\xEDculos",
    "quantidade": "7 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "N\xE3o exigida",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "N\xE3o exigida",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Higienizador de ve\xEDculos, precisa saber dirigir.",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_lavador_de_ve\xEDculos_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-12-1790174577423",
    "titulo": "Marceneiro",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "N\xE3o exigida",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "N\xE3o exigida",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_marceneiro_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-13-1790174577423",
    "titulo": "Motofretista",
    "quantidade": "6 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Realizar servi\xE7os de coleta e entrega de acordo com a demanda do cliente.",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_motofretista_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-14-1790174577423",
    "titulo": "Motorista de ambul\xE2ncia",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Cnh categoria d -com ear, ter curso de condutor de veiculo de emergencia v\xE1lido e atualizado",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_motorista_de_ambul\xE2ncia_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-15-1790174577423",
    "titulo": "Motorista de caminh\xE3o",
    "quantidade": "6 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Cnh d, ensino medio completo, disponibilidade para viagens,eperiencia comprovada,experiencia com rotas pi/ma",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_motorista_de_caminh\xE3o_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-16-1790174577423",
    "titulo": "Motorista de caminh\xE3o",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "03 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 03 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_motorista_de_caminh\xE3o_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-17-1790174577423",
    "titulo": "Oficial de manuten\xE7\xE3o predial",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_oficial_de_manuten\xE7\xE3o_predial_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-18-1790174577423",
    "titulo": "Pedreiro",
    "quantidade": "5 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "03 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 03 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_pedreiro_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-19-1790174577423",
    "titulo": "Pintor de obras",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_pintor_de_obras_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-20-1790174577423",
    "titulo": "Pizzaiolo",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_pizzaiolo_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-21-1790174577423",
    "titulo": "Pizzaiolo",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "03 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 03 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Fabrica\xE7\xE3o das massas, abertura de mesas, montagem das pizzas e demais atribui\xE7\xF5es correlatas a fun\xE7\xE3o",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_pizzaiolo_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-22-1790174577423",
    "titulo": "Promotor de vendas",
    "quantidade": "15 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio Incompleto",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio Incompleto",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Vaga para jovem aprendiz sal\xE1rio R$761,55",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_promotor_de_vendas_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-23-1790174577423",
    "titulo": "Servente de obras",
    "quantidade": "6 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "03 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: 03 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida 3",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_servente_de_obras_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-24-1790174577423",
    "titulo": "Supervisor administrativo",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Superior completo",
    "experiencia": "06 Meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Superior completo",
      "Experi\xEAncia: 06 Meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Supervisionar todas as rotinas administrativas , garantindo que recuros financeiros humanos e materiais; controlar e monitorar todas as movimenta\xE7\xF5es financeiras, fiscais e de rh, entre outras atribui\xE7\xF5es correlatas a fun\xE7\xE3o",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_supervisor_administrativo_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-25-1790174577423",
    "titulo": "T\xE9cnico em fibras \xF3pticas",
    "quantidade": "17 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Ter veiculo, habilita\xE7\xE3o categoria bcomo t\xE9cnico em fibra \xF3ptica, voc\xEA ser\xE1 respons\xE1vel pela instala\xE7\xE3o, manuten\xE7\xE3o e solu\xE7\xE3o de problemas de redes de fibra \xF3ptica",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_t\xE9cnico_em_fibras_\xF3pticas_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-26-1790174577423",
    "titulo": "Vendedor interno",
    "quantidade": "20 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Realizar prospec\xE7\xE3o ativa de clientes por videoconfer\xEAncia, liga\xE7\xE3o, whatsapp e outros canais de atendimento;apresentar produtos, servi\xE7os, benef\xEDcios, condi\xE7\xF5es comerciais e diferenciais da empresa",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_vendedor_interno_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-27-1790174577423",
    "titulo": "Vendedor pracista",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Vendedor externo 4",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_vendedor_pracista_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-28-1790174577423",
    "titulo": "Agente operacional de esta\xE7\xE3o",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Informar sobre fraudes, vazamentos situa\xE7\xE3o da liga\xE7\xE3o de agua e esgoto, oferecer servi\xE7os, entregar fatura, realizar substitui\xE7\xE3o de hidr\xF4metro.",
    "pcd": true,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_agente_operacional_de_esta\xE7\xE3o_pcd",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-29-1790174577423",
    "titulo": "Atendente comercial (ag\xEAncia postal)",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Atuar no atendimento \xE1s equipes de negocia\xE7\xE3o porta a porta, realizar simula\xE7\xE3o e parcelamento de debitos",
    "pcd": true,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_atendente_comercial_(ag\xEAncia_postal)_pcd",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-30-1790174577423",
    "titulo": "Atendente de farm\xE1cia - balconista",
    "quantidade": "10 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Realizar atendimento ao cliente; operar o caixa; auxiliar na organiza\xE7\xE3o do ambiente de trabalho; apoiar na confer\xEAncia de produtos e precifica\xE7\xE3o; esclarecer d\xFAvidas de clientes e direcionar demandas ao setor respons\xE1vel;",
    "pcd": true,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_atendente_de_farm\xE1cia_-_balconista_pcd",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-31-1790174577423",
    "titulo": "Auxiliar de escrit\xF3rio",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": true,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_auxiliar_de_escrit\xF3rio_pcd",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-32-1790174577423",
    "titulo": "Operador de caixa",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": true,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577423,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_operador_de_caixa_pcd",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-33-1790174577424",
    "titulo": "Recepcionista atendente",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": true,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_recepcionista_atendente_pcd",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-34-1790174577424",
    "titulo": "Vendedor interno",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": true,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_vendedor_interno_pcd",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-35-1790174577424",
    "titulo": "Vendedor interno",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Atendimento direto ao cliente",
    "pcd": true,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_vendedor_interno_pcd",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-36-1790174577424",
    "titulo": "Auxiliar t\xE9cnico de refrigera\xE7\xE3o",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_auxiliar_t\xE9cnico_de_refrigera\xE7\xE3o_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-37-1790174577424",
    "titulo": "Bab\xE1",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_bab\xE1_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-38-1790174577424",
    "titulo": "Cozinheiro de restaurante",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_cozinheiro_de_restaurante_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-39-1790174577424",
    "titulo": "Empregado dom\xE9stico arrumador",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_empregado_dom\xE9stico_arrumador_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-40-1790174577424",
    "titulo": "Forneiro de padaria",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_forneiro_de_padaria_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-41-1790174577424",
    "titulo": "Gar\xE7om",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_gar\xE7om_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-42-1790174577424",
    "titulo": "Operador de caixa",
    "quantidade": "5 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_operador_de_caixa_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-43-1790174577424",
    "titulo": "Salgadeiro",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_salgadeiro_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-44-1790174577424",
    "titulo": "Vendedor - no com\xE9rcio de mercadorias",
    "quantidade": "10 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_vendedor_-_no_com\xE9rcio_de_mercadorias_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-45-1790174577424",
    "titulo": "Vendedor pracista",
    "quantidade": "2 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida VAGAS DISPON\xCDVEL SINE- ESPACO DA CIDADANIA 23/09/2026",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_vendedor_pracista_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-46-1790174577424",
    "titulo": "Consultor de vendas",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "N\xE3o exigida",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_consultor_de_vendas_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-47-1790174577424",
    "titulo": "Motorista de caminh\xE3o",
    "quantidade": "6 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "M\xE9dio completo",
    "experiencia": "06 meses",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "M\xE9dio completo",
      "Experi\xEAncia: 06 meses"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Cnh d, ensino medio completo, disponibilidade para viagens,eperiencia comprovada,experiencia com rotas pi/ma",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_motorista_de_caminh\xE3o_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-48-1790174577424",
    "titulo": "Ajudante de motorista",
    "quantidade": "4 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Auxiliar o motorista na entrega de mercadorias aos clientes: separar as quantidades conforme nota fiscal e levar at\xE9 o estoque do cliente: disciplina para cumprimento de rotina.",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_ajudante_de_motorista_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-49-1790174577424",
    "titulo": "Motorista entregador",
    "quantidade": "8 vagas",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Conduzir o ve\xEDculo com per\xEDcia e prud\xEAncia conforme a legisla\xE7\xE3o do tr\xE2nsito vigente: efetuar entregas de produto conforme padr\xE3o exigido pela empresa e clientes: cumprir rigorosamente todos os procedimentos e normas de seguran\xE7a.",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_motorista_entregador_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  },
  {
    "id": "sine-50-1790174577424",
    "titulo": "Operador de empilhadeira",
    "quantidade": "1 vaga",
    "cidade": "Teresina",
    "estado": "PI",
    "escolaridade": "Fundamental completo",
    "experiencia": "N\xE3o exigida",
    "salario": "Piso Salarial / A Combinar",
    "tipo_contrato": "CLT",
    "modalidade": "Presencial",
    "requisitos": [
      "Fundamental completo",
      "Experi\xEAncia: N\xE3o exigida"
    ],
    "cnh": "N\xE3o informado",
    "beneficios": [
      "Vale Transporte",
      "Benef\xEDcios Legais"
    ],
    "observacoes": "Curso de empilhador. Conduzir o equipamento com per\xEDcia e prud\xEAncia: garantir a conserva\xE7\xE3o do ve\xEDculo e a correta utiliza\xE7\xE3o dos equipamentos e acess\xF3rios: armazenar produtos no estoque conforme padr\xE3o de armazenagem. Prezado(a) Trabalhador(a): Para ser encaminhado a EMPREGOS faz-se necess\xE1rio ter Cadastro em um de nossos Postos SINEPI (Centro, Dirceu e Espa\xE7o Cidadania) registre-se em nosso Sistema/Banco de Dados, com isso pode pegar a CARTA DE ENCAMINHAMENTO a vaga dispon\xEDvel. Saiba que o SINE cadastra com TODOS OS DOCUMENTOS, pois s\xE3o devolvidos em seguida ao t\xE9rmino do atendimento. Todos os nossos servi\xE7os s\xE3o gratuitos! Hor\xE1rio de atendimento 08:00 h \xE1s 13:00 h, atrav\xE9s de agendamento diretamente pelo site: www.sine.pi.gov.br DOCUMENTOS NECESS\xC1RIOS PARA O CADASTRO: -CARTEIRA DE TRABALHO E PREVID\xCANCIA SOCIAL/CTPS (f\xEDsica ou a digital) -RG/CARTEIRA DE IDENTIDADE: -CPF/CADASTRO DE PESSOA F\xCDSICA: -PIS ou PASEP: -COMPROVANTE DE ESCOLARIDADE (Certificado ou Declara\xE7\xE3o da Escola): -COMPROVANTE DE RESID\xCANCIA/MORADIA: -CARTEIRA DE HABILITA\xC7\xC3O (Se dirigir moto ou ve\xEDculo): -CERTIFICADOS DE CURSOS DE QUALIFICA\xC7\xC3O PROFISSIONAL (Se Possuir) SINE/CENTRO \u2013RUA ALVARO MENDES 2090 CENTRO NORTE Vagas sujeitas aos crit\xE9rios de Perfil/Sele\xE7\xE3o exigidos pelo Empregador... Exemplos de crit\xE9rios: Escolaridade, estado civil, sexo: m/f, idade, bairro, Experi\xEAncia comprovada na CTPS, etc... Teresina-PI, SETEMBRO,2026",
    "pcd": false,
    "data_publicacao": "23/09/2026",
    "data_atualizacao": "23/09/2026",
    "data_importacao": 1790174577424,
    "fonte": "SINE-PI",
    "url_fonte": "https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf",
    "hash_vaga": "sine_operador_de_empilhadeira_geral",
    "status": "ATIVA",
    "ultima_verificacao": "23/09/2026 \xE0s 14:42:57",
    "isNew": true
  }
];

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
      const configPath = path4.join(process.cwd(), "firebase-applet-config.json");
      if (fs4.existsSync(configPath)) {
        const config = JSON.parse(fs4.readFileSync(configPath, "utf8"));
        const app2 = getApps4().length > 0 ? getApp4() : initializeApp4(config);
        const dbId = config.firestoreDatabaseId || "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413";
        const db = getFirestore4(app2, dbId);
        const snap = await getDocs4(collection4(db, "sine_vagas"));
        if (!snap.empty) {
          const firestoreJobs = [];
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
  app.get("/api/cron/sine-pi", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret_vaiquedacerto";
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
  app.post("/api/sine/sync", async (req, res) => {
    try {
      const syncResult = await syncSineJobs();
      res.json(syncResult);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/cron/themos", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret_vaiquedacerto";
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
  app.post("/api/themos/sync", async (req, res) => {
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
        const configPath = path4.join(process.cwd(), "firebase-applet-config.json");
        if (fs4.existsSync(configPath)) {
          const config = JSON.parse(fs4.readFileSync(configPath, "utf8"));
          const app2 = getApps4().length > 0 ? getApp4() : initializeApp4(config);
          const dbId = config.firestoreDatabaseId || "ai-studio-vaiquedcertoempr-2c1e0223-76a1-4104-afc9-edc49ea74413";
          const db = getFirestore4(app2, dbId);
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
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || "default_cron_secret_vaiquedacerto";
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
  app.post("/api/gupy/sync", async (req, res) => {
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
    const distPath = path4.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path4.join(distPath, "index.html"));
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
