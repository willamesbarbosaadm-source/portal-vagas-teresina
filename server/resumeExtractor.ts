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

  const cleanLines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !/^-- \d+ of \d+ --$/.test(l));

  // 1. Nome (primeira linha válida que não seja rótulo de documento)
  for (const line of cleanLines.slice(0, 8)) {
    if (
      line.length >= 3 &&
      line.length < 60 &&
      !/curr[ií]culo|resumo|email|telefone|contato|perfil|página/i.test(line) &&
      !/^nome:/i.test(line)
    ) {
      profile.name = line.replace(/^nome[:\s]*/i, '').trim();
      break;
    } else if (/^nome:/i.test(line)) {
      profile.name = line.replace(/^nome[:\s]*/i, '').trim();
      break;
    }
  }

  // 2. WhatsApp / Telefone (valida DDD e padrão nacional)
  const phoneMatch = text.match(/(?:\+?55\s*)?(?:\(?([1-9]{2})\)?\s*)?(?:9[6-9]\d{3}[-\s]?\d{4}|[2-5]\d{3}[-\s]?\d{4})/);
  if (phoneMatch) {
    profile.phone = phoneMatch[0].trim();
  }

  // 3. Cidade (foco em Teresina e Piauí / Maranhão)
  const cityMatch = text.match(/(Teresina|Timon|Parnaíba|Picos|Floriano|Campo Maior|Piripiri)[^,\n]*/i);
  if (cityMatch) {
    profile.city = cityMatch[0].trim();
  } else {
    const genCityMatch = text.match(/(?:cidade|localidade|endereço):\s*([^\n]+)/i);
    if (genCityMatch) profile.city = genCityMatch[1].trim();
  }

  // 4. LinkedIn
  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) {
    profile.linkedin = linkedinMatch[0].trim();
  }

  // 5. Formação Acadêmica
  const eduMatch = text.match(/(?:formação|escolaridade|graduação|ensino|curso)[^\n]*[\n:]+([\s\S]{1,300}?)(?=\n\s*\n|\n[A-Z\s]{4,}:|$)/i);
  if (eduMatch) {
    profile.education = eduMatch[1].trim();
  }

  // 6. Experiência
  const expMatch = text.match(/(?:experiência|histórico profissional|atuação|empresas)[^\n]*[\n:]+([\s\S]{1,500}?)(?=\n\s*\n|\n[A-Z\s]{4,}:|$)/i);
  if (expMatch) {
    profile.experience = expMatch[1].trim();
  }

  // 7. Competências
  const skillsMatch = text.match(/(?:competências|habilidades|conhecimentos|skills|tecnologias)[^\n]*[\n:]+([^\n]{1,250})/i);
  if (skillsMatch) {
    profile.skills = skillsMatch[1].trim();
  }

  // 8. Cargo Desejado
  const roleMatch = text.match(/(?:cargo|objetivo|função|vaga de interesse|área de atuação):\s*([^\n]+)/i);
  if (roleMatch) {
    profile.desiredRole = roleMatch[1].trim();
  }

  // 9. Resumo
  const summaryMatch = text.match(/(?:resumo|perfil profissional|sobre mim):\s*([^\n]+(?:\n[^\n]+){0,3})/i);
  if (summaryMatch) {
    profile.summary = summaryMatch[1].trim();
  }

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
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let jsonText = '';

    // ESTRATÉGIA 1: Se já temos o texto extraído do PDF, envia como prompt de texto leve para Gemini (evita erro 503 de PDF binário)
    if (rawTextLength >= 30) {
      for (const modelName of modelsToTry) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: modelName,
            contents: `Analise este texto de currículo e extraia em JSON estrito com as chaves:
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

  // Preenche o nome caso continue vazio a partir do nome do arquivo
  if (!extracted.name && filename) {
    const cleanFileName = filename
      .replace(/\.pdf$/i, '')
      .replace(/curr[ií]culo|cv|resume| - /gi, ' ')
      .replace(/[_-]+/g, ' ')
      .trim();
    if (cleanFileName.length >= 3 && cleanFileName.length < 40) {
      extracted.name = cleanFileName;
    }
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
