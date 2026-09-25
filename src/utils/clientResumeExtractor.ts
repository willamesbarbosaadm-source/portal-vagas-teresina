import { GoogleGenAI } from '@google/genai';

export interface ExtractedProfile {
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

const emptyProfile: ExtractedProfile = {
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

function decodeArrayBufferText(buffer: ArrayBuffer): string {
  try {
    const uint8 = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8');
    const rawStr = decoder.decode(uint8);
    // Extrai sequências de texto legível de dentro do PDF (Tj, TJ, e texto puro)
    const textMatches = rawStr.match(/\(([^()]{3,100})\)\s*T[jJ]/g) || [];
    if (textMatches.length > 0) {
      return textMatches
        .map(m => m.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, '').trim())
        .filter(Boolean)
        .join(' ');
    }
    // Fallback limpa caracteres de controle
    return rawStr.replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, ' ').replace(/\s+/g, ' ');
  } catch {
    return '';
  }
}

export function heuristicExtractClient(text: string, filename: string): ExtractedProfile {
  const profile: ExtractedProfile = { ...emptyProfile };
  
  // Nome a partir do arquivo
  if (filename) {
    const cleanFileName = filename
      .replace(/\.pdf$/i, '')
      .replace(/curr[ií]culo|cv|resume| - /gi, ' ')
      .replace(/[_-]+/g, ' ')
      .trim();
    if (cleanFileName.length >= 3 && cleanFileName.length < 50) {
      profile.name = cleanFileName;
    }
  }

  if (!text) return profile;

  // Telefone / WhatsApp
  const phoneMatch = text.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s]?\d{4}/);
  if (phoneMatch) profile.phone = phoneMatch[0].trim();

  // Cidade Teresina / Piauí
  const cityMatch = text.match(/(Teresina|Timon|Parnaíba|Picos|Floriano|Campo Maior|Piripiri)[^,\n]*/i);
  if (cityMatch) {
    profile.city = cityMatch[0].trim();
  }

  // LinkedIn
  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) profile.linkedin = linkedinMatch[0].trim();

  return profile;
}

export async function extractResumeClientSide(file: File): Promise<ExtractedProfile> {
  const arrayBuffer = await file.arrayBuffer();
  const rawText = decodeArrayBufferText(arrayBuffer);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;

  if (apiKey) {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1] || res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ai = new GoogleGenAI({ apiKey });
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: base64
                    }
                  },
                  {
                    text: `Analise o PDF de currículo e extraia em JSON estrito:
{
  "name": "Nome completo",
  "phone": "Telefone/WhatsApp",
  "city": "Cidade",
  "address": "Bairro/Endereço",
  "desiredRole": "Cargo pretendido",
  "education": "Formação",
  "experience": "Experiência",
  "salaryExpectation": "Pretensão salarial",
  "linkedin": "LinkedIn",
  "modality": "Modalidade",
  "contractType": "Tipo contrato",
  "skills": "Competências",
  "summary": "Resumo"
}`
                  }
                ]
              }
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          });

          const jsonStr = response.text?.trim() || '';
          if (jsonStr) {
            const parsed = JSON.parse(jsonStr);
            return {
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
        } catch (mErr) {
          console.warn(`[CLIENT_EXTRACTOR] Falha com modelo ${modelName}:`, mErr);
        }
      }
    } catch (llmErr) {
      console.warn('[CLIENT_EXTRACTOR] Falha Gemini no cliente:', llmErr);
    }
  }

  return heuristicExtractClient(rawText, file.name);
}
