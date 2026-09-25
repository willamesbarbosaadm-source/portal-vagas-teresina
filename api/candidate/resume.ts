import multer from 'multer';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { extractCandidateProfileFromPdf } from '../../server/resumeExtractor.ts';
import { validateFirebaseToken } from '../../server/firebaseAuthHelper.ts';
import { getServerFirestore, REAL_FIREBASE_CONFIG } from '../../server/firebaseDb.ts';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido. Use POST.'
    });
  }

  upload.single('resume')(req, res, async (uploadErr: any) => {
    if (uploadErr) {
      return res.status(400).json({
        success: false,
        error: uploadErr.message || 'Erro no upload do arquivo PDF.'
      });
    }

    try {
      const file = req.file;
      if (!file || !file.buffer) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo PDF foi enviado.'
        });
      }

      const isPdf =
        file.mimetype === 'application/pdf' ||
        String(file.originalname || '').toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        return res.status(400).json({
          success: false,
          error: 'Apenas arquivos PDF são aceitos.'
        });
      }

      let uid: string | null = null;
      const authHeader = req.headers?.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.replace(/^Bearer\s+/i, '').trim();
          const validation = await validateFirebaseToken(token);
          if (validation.ok && validation.user?.id) {
            uid = validation.user.id;
          }
        } catch (authErr) {
          console.warn('[VERCEL_RESUME] Token não validado; seguindo sem persistência:', authErr);
        }
      }

      const extraction = await extractCandidateProfileFromPdf(
        file.buffer,
        file.originalname || 'curriculo.pdf'
      );

      let extracted = extraction.extracted;
      let verifiedInFirestore = false;

      if (uid) {
        try {
          const db = getServerFirestore();
          const userRef = doc(db, 'users', uid);
          const before = await getDoc(userRef);
          const existingProfile = before.exists() ? (before.data()?.profile || {}) : {};

          const mergedProfile = {
            ...existingProfile,
            ...extracted,
            updatedAt: new Date().toISOString()
          };

          await setDoc(userRef, { profile: mergedProfile }, { merge: true });

          const after = await getDoc(userRef);
          if (after.exists() && after.data()?.profile) {
            extracted = after.data().profile;
            verifiedInFirestore = true;
          } else {
            extracted = mergedProfile;
          }
        } catch (dbErr) {
          console.warn('[VERCEL_RESUME] Falha ao salvar Firestore:', dbErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Currículo processado com sucesso.',
        extracted,
        warning: extraction.warning,
        diagnostics: {
          pdfReceived: true,
          sizeKb: Math.round(file.size / 1024),
          rawTextLength: extraction.rawTextLength,
          filledFieldsCount: extraction.filledFieldsCount,
          filledFieldsList: extraction.filledFieldsList,
          projectId: REAL_FIREBASE_CONFIG.projectId,
          verifiedInFirestore
        }
      });
    } catch (err: any) {
      console.error('[VERCEL_RESUME] Erro:', err);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao processar o currículo PDF.',
        details: err?.message || String(err)
      });
    }
  });
}
