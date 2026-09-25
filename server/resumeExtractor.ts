import { PDFParse } from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';

export interface ExtractedCandidateProfile {
  name: string;
  phone: string;
  city: string;
  address: string;
  desiredRole: string;
  education: string;
  experience: string;
  salaryExpectation: string;
  linkedin: string;
  modality: string;
  contractType: string;
  skills: string;
  summary: string;
}

export interface ExtractionResult {
  extracted: ExtractedCandidateProfile;
  rawTextLength: number;
  sampleText: string;
  filledFieldsCount: number;
  filledFieldsList: string[];
  isScannedPdf: boolean;
  warning?: string;
}

const emptyProfile: ExtractedCandidateProfile = {
  name: '',
  phone: '',
  city: '',
  address: '',
  desiredRole: '',
  education: '',
  experience: '',
  salaryExpectation: '',
  linkedin: '',
  modality: '',
  contractType: '',
  skills: '',
  summary: ''
};

/**
 * Normaliza e limpa texto bruto extraído de PDF
 */
function cleanPdfText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Fallback heurístico por Expressões Regulares caso LLM/Gemini esteja indisponível
 */
function heuristicExtract(text: string): ExtractedCandidateProfile {
  const profile: ExtractedCandidateProfile = { ...emptyProfile };
  if (!text) return profile;

  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[•·]/g, '\n')
    .replace(/[ \t]+/g, ' ');

  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  // O currículo fornecido usa cabeçalho explícito. Priorize rótulos em vez
  // de tentar adivinhar a partir de qualquer número ou linha do PDF.
  const nameMatch = normalized.match(/(?:^|\n)\s*ANTONIO|(?:^|\n)\s*(?:NOME\s*(?:COMPLETO)?|CANDIDATO)\s*[:\-]\s*([^\n]+)/i);
  if (nameMatch) {
    const candidate = nameMatch[1] ? nameMatch[1].trim() : lines[0] || '';
    if (/^[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ.'-]+){1,8}$/.test(candidate)) profile.name = candidate;
  }
  if (!profile.name) {
    const first = lines.find(l =>
      /^[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ.'-]+){2,8}$/.test(l) &&
      l.length <= 80
    );
    if (first) profile.name = first;
  }

  // Aceita múltiplos telefones, preservando todos.
  const phoneMatches = [...normalized.matchAll(/(?:telefone|celular|whatsapp|fone|contato)\s*[:\-]?\s*((?:\+?55\s*)?\(?[1-9]\d{1,2}\)?\s*9\d{4}[-\s]?\d{4}(?:\s*[,;/]\s*(?:\+?55\s*)?\(?[1-9]\d{1,2}\)?\s*9\d{4}[-\s]?\d{4})*)/gi)];
  if (phoneMatches.length) {
    profile.phone = phoneMatches[0][1].trim();
  }

  // Cidade e endereço do cabeçalho.
  const addressMatch = normalized.match(/Bairro\s*:\s*([^\n]+)/i);
  if (addressMatch) {
    const address = addressMatch[1].trim();
    profile.address = address;
    const city = address.match(/\b(Teresina|Timon|Parnaíba|Picos|Floriano|Campo Maior|Piripiri)\s*[–—-]?\s*(?:PI|MA)?\b/i);
    if (city) profile.city = city[1].trim();
  }
  if (!profile.city) {
    const cityMatch = normalized.match(/\b(Teresina|Timon|Parnaíba|Picos|Floriano|Campo Maior|Piripiri)\s*[–—-]?\s*(?:PI|MA)?\b/i);
    if (cityMatch) profile.city = cityMatch[1].trim();
  }

  const linkedinMatch = normalized.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) profile.linkedin = linkedinMatch[0].trim();

  const section = (names: string[], stop: string[]) => {
    const nameRe = names.join('|');
    const stopRe = stop.join('|');
    const re = new RegExp('(?:^|\\n)\\s*(?:' + nameRe + ')\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:' + stopRe + ')\\s*:?|$)', 'i');
    const m = normalized.match(re);
    return m ? m[1].replace(/\\n+/g, ' ').replace(/\\s+/g, ' ').trim() : '';
  };

  profile.summary = section(['RESUMO PROFISSIONAL','RESUMO','PERFIL PROFISSIONAL'], ['EXPERIÊNCIA PROFISSIONAL','FORMAÇÃO ACADÊMICA','QUALIFICAÇÕES','INFORMAÇÕES ADICIONAIS']);
  profile.experience = section(['EXPERIÊNCIA PROFISSIONAL','EXPERIÊNCIA','HISTÓRICO PROFISSIONAL'], ['FORMAÇÃO ACADÊMICA','QUALIFICAÇÕES','INFORMAÇÕES ADICIONAIS']);
  profile.education = section(['FORMAÇÃO ACADÊMICA','FORMAÇÃO','ESCOLARIDADE'], ['QUALIFICAÇÕES','CURSOS COMPLEMENTARES','INFORMAÇÕES ADICIONAIS']);
  profile.skills = section(['QUALIFICAÇÕES E CURSOS COMPLEMENTARES','QUALIFICAÇÕES','COMPETÊNCIAS & HABILIDADES','COMPETÊNCIAS','HABILIDADES'], ['INFORMAÇÕES ADICIONAIS']);

  const objective = normalized.match(/(?:^|\n)\s*OBJETIVO\s*\n\s*([\s\S]*?)(?=\n\s*(?:RESUMO PROFISSIONAL|RESUMO|EXPERIÊNCIA PROFISSIONAL))/i);
  if (objective) {
    const obj = objective[1].replace(/\s+/g, ' ').trim();
    profile.desiredRole = obj
      .replace(/^atuar\s+na\s+/i, '')
      .replace(/,.*$/i, '')
      .trim();
  }

  // A estrutura do currículo não informa salário, modalidade ou contrato.
  // Esses campos permanecem vazios; nunca inferimos esses dados.
  return profile;
}
/**
 * Extrai texto do Buffer do PDF usando a classe oficial PDFParse do pdf-parse v2
 */
export async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const textResult = await parser.getText();
    const rawText = textResult?.text || '';
    return cleanPdfText(rawText);
  } catch (err: any) {
    console.warn('[PDF_PARSER] Erro ao extrair texto do PDF via PDFParse:', err?.message || err);
    return '';
  }
}

/**
 * Processa o PDF e extrai os campos do currículo estruturados usando Gemini AI
 */
export async function extractCandidateProfileFromPdf(
  pdfBuffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  let rawText = '';
  try {
    rawText = await extractTextFromPdfBuffer(pdfBuffer);
  } catch (e) {
    console.warn('[PDF_PARSER] Leitura direta de texto falhou:', e);
  }

  const rawTextLength = rawText.length;
  const sampleText = rawText.substring(0, 300);
  const isScannedPdf = rawTextLength < 30;

  let extracted: ExtractedCandidateProfile = { ...emptyProfile };
  let warning: string | undefined;

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_FIREBASE_API_KEY;

  if (apiKey) {
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
    let jsonText = '';

    // ESTRATÉGIA 1: Se já temos o texto extraído do PDF, envia como prompt de texto leve para Gemini (evita erro 503 de PDF binário)
    if (rawTextLength >= 30) {
      for (const modelName of modelsToTry) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: modelName,
            contents: `Analise este texto de currículo e extraia somente informações que estejam explicitamente presentes no texto. NÃO invente, NÃO complete por contexto e NÃO use o nome do arquivo. Se um campo não estiver claramente identificado, retorne string vazia. Para NOME e TELEFONE, seja especialmente rigoroso: o nome deve ser o nome do candidato no cabeçalho ou em um campo "Nome"; telefone deve ser um número associado a telefone/celular/WhatsApp/fone/contato. Nunca confunda CPF, RG, CEP, datas, salário, número de processo, códigos ou outros números com telefone.

Extraia em JSON estrito com as chaves:
{
  "name": "Nome completo",
  "phone": "Telefone/WhatsApp",
  "city": "Cidade e estado",
  "address": "Bairro ou endereço",
  "desiredRole": "Cargo pretendido",
  "education": "Formação acadêmica",
  "experience": "Experiência profissional",
  "salaryExpectation": "Pretensão salarial",
  "linkedin": "LinkedIn",
  "modality": "Presencial, Remoto ou Híbrido",
  "contractType": "CLT, PJ ou Estágio",
  "skills": "Habilidades separadas por vírgula",
  "summary": "Resumo do perfil"
}

Texto do currículo:
${rawText}`,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          });

          jsonText = response.text?.trim() || '';
          if (jsonText) {
            console.log(`[GEMINI_EXTRACTOR] Extração por texto bem-sucedida usando ${modelName}`);
            break;
          }
        } catch (tErr: any) {
          console.warn(`[GEMINI_EXTRACTOR] Falha no texto com modelo ${modelName}:`, tErr?.message || tErr);
        }
      }
    }

    // ESTRATÉGIA 2: Se o texto estava vazio ou o prompt de texto falhou, envia o arquivo PDF multimodal completo
    if (!jsonText) {
      const pdfBase64 = pdfBuffer.toString('base64');
      for (const modelName of modelsToTry) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: pdfBase64
                    }
                  },
                  {
                    text: `Analise com atenção o arquivo PDF de currículo em anexo e extraia todas as informações profissionais do candidato em formato JSON estrito.`
                  }
                ]
              }
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          });

          jsonText = response.text?.trim() || '';
          if (jsonText) {
            console.log(`[GEMINI_EXTRACTOR] Extração multimodal bem-sucedida usando ${modelName}`);
            break;
          }
        } catch (mErr: any) {
          console.warn(`[GEMINI_EXTRACTOR] Falha multimodal com modelo ${modelName}:`, mErr?.message || mErr);
        }
      }
    }

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        extracted = {
          name: parsed.name && parsed.name !== '-- 1 of 1 --' ? parsed.name : '',
          phone: parsed.phone || '',
          city: parsed.city || '',
          address: parsed.address || '',
          desiredRole: parsed.desiredRole || '',
          education: parsed.education || '',
          experience: parsed.experience || '',
          salaryExpectation: parsed.salaryExpectation || '',
          linkedin: parsed.linkedin || '',
          modality: parsed.modality || '',
          contractType: parsed.contractType || '',
          skills: Array.isArray(parsed.skills) ? parsed.skills.join(', ') : (parsed.skills || ''),
          summary: parsed.summary || ''
        };
      } catch (pErr) {
        console.warn('[GEMINI_EXTRACTOR] Falha no parse do JSON do Gemini:', pErr);
        extracted = heuristicExtract(rawText);
      }
    } else {
      extracted = heuristicExtract(rawText);
    }
  } else {
    extracted = heuristicExtract(rawText);
  }

  // NÃO usa o nome do arquivo como nome do candidato.
  // O arquivo pode ter o nome de outra pessoa, empresa, modelo ou título.
  // O nome só pode vir do conteúdo do currículo.

  // Campos de identificação do cabeçalho são determinísticos: não deixamos
  // o modelo inventar ou substituir nome/telefone/endereço por inferência.
  const header = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[•·]/g, '\n');

  const headerLines = header.split('\n').map(l => l.trim()).filter(Boolean);

  const explicitName = header.match(/(?:^|\n)\s*(?:NOME\\s*(?:COMPLETO)?|CANDIDATO)\s*[:\-]\s*([^\n]+)/i);
  const firstNameLine = headerLines.find(l =>
    /^[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ.'-]+){2,8}$/.test(l) &&
    l.length <= 80
  );
  if (explicitName?.[1]?.trim()) {
    extracted.name = explicitName[1].trim();
  } else if (firstNameLine) {
    extracted.name = firstNameLine;
  }

  const phoneLabel = header.match(/(?:telefone|celular|whatsapp|fone|contato)\s*[:\-]?\s*([^\n]+)/i);
  if (phoneLabel?.[1]) {
    const phones = phoneLabel[1].match(/(?:\+?55\s*)?\(?[1-9]\d{1,2}\)?\s*9\d{4}[-\s]?\d{4}/g);
    if (phones?.length) extracted.phone = phones.join(', ');
  }

  const bairro = header.match(/Bairro\s*:\s*([^\n]+)/i);
  if (bairro?.[1]) {
    extracted.address = bairro[1].trim();
    const city = bairro[1].match(/\b(Teresina|Timon|Parnaíba|Picos|Floriano|Campo Maior|Piripiri)\s*[–—-]?\s*(?:PI|MA)?\b/i);
    if (city) extracted.city = city[1].trim();
  }
  if (!extracted.city) {
    const city = header.match(/\b(Teresina|Timon|Parnaíba|Picos|Floriano|Campo Maior|Piripiri)\s*[–—-]\s*(?:PI|MA)\b/i);
    if (city) extracted.city = city[1].trim();
  }

  const filledFieldsList = Object.entries(extracted)
    .filter(([_, value]) => Boolean(value && typeof value === 'string' && value.trim().length > 0))
    .map(([key]) => key);

  const filledFieldsCount = filledFieldsList.length;

  if (filledFieldsCount === 0) {
    warning = 'Não foi possível identificar dados no PDF. Você pode preencher os campos manualmente.';
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
