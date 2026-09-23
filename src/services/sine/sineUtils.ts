import { SineJob } from '../../types/sine';

export async function generateSineHash(job: {
  titulo: string;
  cidade: string;
  quantidade: string | number;
  data_publicacao: string;
  pcd: boolean;
}): Promise<string> {
  const rawString = `${job.titulo?.trim().toLowerCase()}_${job.cidade?.trim().toLowerCase()}_${job.quantidade}_${job.data_publicacao}_${job.pcd}`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(rawString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Simple fallback hash
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}_${rawString.length}`;
}
