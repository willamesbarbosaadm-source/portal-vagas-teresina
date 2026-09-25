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

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Nome (Geralmente primeira linha relevante com letras)
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 50 && !/curr[ií]culo|resumo|email|telefone|contato/i.test(line)) {
      profile.name = line;
      break;
    }
  }

  // 2. WhatsApp / Telefone
  const phoneMatch = text.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s]?\d{4}/);
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
  const eduMatch = text.match(/(?:formação|escolaridade|graduação|ensino|curso)[^\n]*\n([\s\S]{1,250}?)(?=\n\n|\n[A-Z\s]{4,}:|$)/i);
  if (eduMatch) {
    profile.education = eduMatch[1].trim();
  }

  // 6. Experiência
  const expMatch = text.match(/(?:experiência|histórico profissional|atuacao)[^\n]*\n([\s\S]{1,400}?)(?=\n\n|\n[A-Z\s]{4,}:|$)/i);
  if (expMatch) {
    profile.experience = expMatch[1].trim();
  }

  // 7. Competências
  const skillsMatch = text.match(/(?:competências|habilidades|conhecimentos|skills)[^\n]*\n?([^\n]{1,200})/i);
  if (skillsMatch) {
    profile.skills = skillsMatch[1].trim();
  }

  // 8. Cargo Desejado
  const roleMatch = text.match(/(?:cargo|objetivo|função|vaga de interesse):\s*([^\n]+)/i);
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
 * Processa o PDF e extrai os campos do currículo estruturados usando Gemini AI (Multimodal PDF InlineData)
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
    try {
      const ai = new GoogleGenAI({ apiKey });
      const pdfBase64 = pdfBuffer.toString('base64');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
                text: `Analise com atenção o arquivo PDF de currículo em anexo e extraia todas as informações profissionais do candidato em formato JSON estrito.

A resposta DEVE ser exclusivamente um JSON válido com as seguintes chaves:
{
  "name": "Nome completo do candidato",
  "phone": "Telefone ou WhatsApp de contato",
  "city": "Cidade e estado (ex: Teresina - PI)",
  "address": "Bairro ou endereço",
  "desiredRole": "Cargo ou área profissional pretendida",
  "education": "Resumo da formação acadêmica e cursos",
  "experience": "Principais experiências de trabalho e funções anteriores",
  "salaryExpectation": "Pretensão salarial se informada ou 'A combinar'",
  "linkedin": "Link do perfil do LinkedIn se houver",
  "modality": "Presencial, Remoto ou Híbrido",
  "contractType": "CLT, PJ ou Estágio",
  "skills": "Competências e habilidades principais separadas por vírgula",
  "summary": "Resumo do perfil profissional do candidato"
}

Regras:
1. Se algum campo não estiver presente no documento, deixe como string vazia "".
2. Se o PDF for uma imagem ou escaneado, leia todo o texto visual do currículo.
3. Não invente informações fictícias, use apenas o conteúdo do documento.`
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const jsonText = response.text?.trim() || '';
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        extracted = {
          name: parsed.name || '',
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
      }
    } catch (llmErr: any) {
      console.warn('[GEMINI_EXTRACTOR] Erro na extração multimodal do Gemini. Usando fallback regex:', llmErr?.message || llmErr);
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
