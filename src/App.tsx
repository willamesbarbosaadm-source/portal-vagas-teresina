import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Briefcase, 
  HeartHandshake, 
  Bookmark, 
  PlusCircle, 
  Plus,
  Share2, 
  Sparkles, 
  Flame, 
  Zap, 
  Bell, 
  CheckCircle,
  TrendingUp,
  Award,
  Users,
  Search,
  ExternalLink,
  RefreshCw,
  MapPin,
  Laptop,
  FileText,
  Smartphone,
  Settings
} from 'lucide-react';
import { Job, GratitudeComment, FilterState, WorkMode, JobSource } from './types';
import { INITIAL_JOBS, INCOMING_JOBS_POOL, INITIAL_GRATITUDE } from './data/initialData';
import { db } from './lib/firebase';
import { firebaseAuth } from './services/auth';
import { collection, getDocs, addDoc, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { JobFilters } from './components/JobFilters';
import { JobCard } from './components/JobCard';
import { JobDetailModal } from './components/JobDetailModal';
import { PostJobModal } from './components/PostJobModal';
import { GratitudeWall } from './components/GratitudeWall';
import { ShareModal } from './components/ShareModal';
import { CoverLetterGeneratorModal } from './components/CoverLetterGeneratorModal';
import { Toast } from './components/Toast';
import { AuthModal, AuthModalMode } from './components/AuthModal';
import { QuickApplyModal } from './components/QuickApplyModal';
import { triggerSineSync } from './services/adminApiClient';
import { B2BSection } from './components/B2BSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { CandidateDashboardModal } from './components/CandidateDashboardModal';
import { SinePostosView } from './components/SinePostosView';
import { SineJobModal } from './components/SineJobModal';
import { SineAdminModal } from './components/SineAdminModal';
import { HeroMascotVideo } from './components/HeroMascotVideo';
import { SineJob, SineSyncLog, isSineJobRecord, normalizeSineJobRecord } from './types/sine';

const STORAGE_KEYS = {
  JOBS: 'vaiquedacerto_jobs_v20_gupy_teresina',
  GRATITUDE: 'vaiquedacerto_gratitude_v2',
  SAVED: 'vaiquedacerto_saved_v2',
};

export const MAX_JOB_AGE_DAYS = 20;
export const MAX_JOB_AGE_MS = MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000;

const MAX_COUNTDOWN = 30; // seconds between auto-update checks

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  useEffect(() => {
    // Inicialização da sessão oficial do Firebase Authentication via onAuthStateChanged
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        setIsAdmin(Boolean(user.isAdmin));
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isCandidateDashboardOpen, setIsCandidateDashboardOpen] = useState(false);
  const [siteStats, setSiteStats] = useState({
    today: 1,
    month: 1,
    total: 1
  });

  // Track real visit stats from Firestore
  useEffect(() => {
    const statsRef = doc(db, 'analytics', 'site_stats');
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStr = new Date().toISOString().slice(0, 7);

    getDoc(statsRef).then((docSnap) => {
      const data = docSnap.exists() ? docSnap.data() : { today: 0, lastDate: todayStr, month: 0, lastMonth: monthStr, total: 0 };
      
      const newToday = data.lastDate === todayStr ? (data.today || 0) + 1 : 1;
      const newMonth = data.lastMonth === monthStr ? (data.month || 0) + 1 : 1;
      const newTotal = (data.total || 0) + 1;

      const updated = {
        today: newToday,
        lastDate: todayStr,
        month: newMonth,
        lastMonth: monthStr,
        total: newTotal
      };

      setSiteStats(updated);
      setDoc(statsRef, updated, { merge: true }).catch(err => console.log('Analytics sync error:', err));
    }).catch(() => {
      const todayKey = `vqc_day_${todayStr}`;
      const monthKey = `vqc_month_${monthStr}`;
      const totalKey = `vqc_total`;

      const d = Number(localStorage.getItem(todayKey) || '0') + 1;
      const m = Number(localStorage.getItem(monthKey) || '0') + 1;
      const t = Number(localStorage.getItem(totalKey) || '0') + 1;

      localStorage.setItem(todayKey, String(d));
      localStorage.setItem(monthKey, String(m));
      localStorage.setItem(totalKey, String(t));

      setSiteStats({ today: d, month: m, total: t });
    });
  }, []);

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut().catch(() => {});
    } catch (e) {
      console.error('Erro ao sair da conta:', e);
    } finally {
      setCurrentUser(null);
      setIsAdmin(false);
      setToastMessage('Você saiu da sua conta com sucesso.');
    }
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  // Jobs state (filtra e limpa vagas com mais de 20 dias, exclui vagas do LinkedIn e exclui rigorosamente vagas do SINE-PI)
  const [jobs, setJobs] = useState<Job[]>(() => {
    const now = Date.now();
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOBS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Mantém apenas vagas válidas dentro de 20 dias, que NÃO sejam do LinkedIn, NÃO sejam do SINE-PI e que, se forem Gupy, possuam data de publicação real
          const activeSaved = parsed.filter((j: Job) => 
            j.source !== 'LinkedIn' && 
            !isSineJobRecord(j) &&
            (j.source !== 'Gupy' || Boolean(j.publishedDate)) &&
            (!j.timestamp || (now - j.timestamp) <= MAX_JOB_AGE_MS)
          );
          const existingIds = new Set(activeSaved.map((j: Job) => j.id));
          const missingInitial = INITIAL_JOBS.filter((j) => 
            j.source !== 'LinkedIn' && 
            !isSineJobRecord(j) &&
            !existingIds.has(j.id) && 
            (!j.timestamp || (now - j.timestamp) <= MAX_JOB_AGE_MS)
          );
          return [...missingInitial, ...activeSaved];
        }
      }
    } catch (e) {
      console.error('Error loading jobs from storage:', e);
    }
    return INITIAL_JOBS.filter((j) => j.source !== 'LinkedIn' && !isSineJobRecord(j) && (!j.timestamp || (now - j.timestamp) <= MAX_JOB_AGE_MS));
  });

  const handleCleanExpiredJobs = () => {
    const now = Date.now();
    let removed = 0;
    setJobs(prev => {
      const remaining = prev.filter(j => {
        const expired = j.timestamp && (now - j.timestamp) > MAX_JOB_AGE_MS;
        if (expired) removed++;
        return !expired;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(remaining));
      } catch (e) {
        console.error(e);
      }
      return remaining;
    });
    if (removed > 0) {
      setToastMessage(`🧹 ${removed} vaga(s) com mais de 20 dias foram removidas do portal!`);
    } else {
      setToastMessage(`✅ Todas as vagas ativas estão dentro do prazo de validade de 20 dias!`);
    }
  };

  // Gratitude comments state
  const [gratitudeComments, setGratitudeComments] = useState<GratitudeComment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRATITUDE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GRATITUDE;
  });

  // Saved job bookmarks
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Contador de novidades detectadas pelo radar a partir de fontes reais.
  const [newJobsCount, setNewJobsCount] = useState(0);

  // SINE-PI Integration State (Conectado em tempo real ao Firestore sine_vagas e API /api/sine/jobs)
  const [sineJobs, setSineJobs] = useState<SineJob[]>(() => {
    try {
      const saved = localStorage.getItem('vqc_sine_jobs_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(isSineJobRecord).map(normalizeSineJobRecord);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [selectedSineJob, setSelectedSineJob] = useState<SineJob | null>(null);
  const [isSinePostosOpen, setIsSinePostosOpen] = useState(false);
  const [isSineAdminOpen, setIsSineAdminOpen] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SineSyncLog[]>([
    {
      timestamp: Date.now(),
      dataHora: '23/09/2026 às 14:42',
      publicacaoEncontrada: 'Ofertas de vagas em 23 de Setembro de 2026',
      url: 'https://portal.pi.gov.br/sine/download/29/vagas-de-emprego/1670/ofertas-de-vagas-em-23-de-setembro-de-2026.pdf',
      vagasIdentificadas: 51,
      vagasNovas: 51,
      vagasAtualizadas: 0,
      vagasDuplicadas: 0,
      vagasDescartadas: 0,
      erro: false
    }
  ]);

  // Carrega e escuta vagas do SINE-PI DIRETO do Firestore 'sine_vagas'
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const sineVagasCol = collection(db, 'sine_vagas');
      unsubscribe = onSnapshot(sineVagasCol, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: SineJob[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            if (isSineJobRecord(data) || docSnap.id.startsWith('sine_')) {
              loaded.push(normalizeSineJobRecord({ id: docSnap.id, ...data }));
            }
          });

          if (loaded.length > 0) {
            setSineJobs(loaded);
            try {
              localStorage.setItem('vqc_sine_jobs_v5', JSON.stringify(loaded));
            } catch (e) {
              console.error(e);
            }
          }
        }
      }, (err) => {
        console.warn('Firestore sine_vagas snapshot error:', err);
      });
    } catch (e) {
      console.warn('Erro ao inicializar Firestore sine_vagas:', e);
    }

    // Também consulta a API para carregar se necessário
    fetch('/api/sine/jobs')
      .then((res) => (res.ok ? res.text().then(t => t ? JSON.parse(t) : null).catch(() => null) : null))
      .then((data) => {
        if (data && data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
          const validSine = data.jobs.filter(isSineJobRecord).map(normalizeSineJobRecord);
          if (validSine.length > 0) {
            setSineJobs((prev) => (prev.length >= validSine.length ? prev : validSine));
            try {
              localStorage.setItem('vqc_sine_jobs_v5', JSON.stringify(validSine));
            } catch (e) {
              console.error(e);
            }
          }
        }
      })
      .catch((err) => console.log('API sine fallback:', err));

    return () => unsubscribe();
  }, []);

  const handleTriggerSineSync = async () => {
    try {
      const result = await triggerSineSync();
      const data = result.data || {};
      if (result.statusCode === 401) {
        setToastMessage('🔒 Autenticação necessária. Faça login como administrador para sincronizar.');
        return;
      }
      if (result.statusCode === 403) {
        setToastMessage('⛔ Acesso negado. Apenas o e-mail do administrador pode sincronizar.');
        return;
      }
      if (result.statusCode === 503) {
        setToastMessage('⚠️ Serviço de autenticação indisponível no servidor.');
        return;
      }
      if (result.success && data.success) {
        setToastMessage(`✅ SINE-PI sincronizado com sucesso! Data: ${data.publicationDate} • Total: ${data.teresinaJobs + data.pcdJobs} vagas (${data.newJobs} novas).`);
      } else {
        setToastMessage(`⚠️ Sincronização SINE: ${result.error || data.errors?.join(', ') || 'Erro ao processar'}`);
      }
    } catch (e) {
      console.error(e);
      setToastMessage('❌ Erro na comunicação com o servidor SINE-PI.');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('vqc_sine_jobs_v3', JSON.stringify(sineJobs));
    } catch (e) {
      console.error(e);
    }
  }, [sineJobs]);

  // Status do carregamento das vagas Gupy
  const [gupyStatus, setGupyStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');

  // Fetch live Gupy jobs for Teresina on mount (Firestore + API)
  useEffect(() => {
    let hasLoadedGupy = false;

    // 1. Listen to Firestore 'gupy_jobs' collection (real-time cross-platform)
    const gupyCol = collection(db, 'gupy_jobs');
    const unsubscribe = onSnapshot(gupyCol, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreJobs: Job[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as Job;
          // Aceita somente vagas Gupy válidas com URL original
          if (item && item.id && item.source === 'Gupy') {
            firestoreJobs.push(item);
          }
        });
        if (firestoreJobs.length > 0) {
          hasLoadedGupy = true;
          setGupyStatus('available');
          setJobs(prevJobs => {
            const nonGupy = prevJobs.filter(j => j.source !== 'Gupy' && !isSineJobRecord(j));
            const validFirestoreJobs = firestoreJobs.filter(j => !isSineJobRecord(j));
            const updated = [...validFirestoreJobs, ...nonGupy];
            try {
              localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(updated));
            } catch (e) {
              console.error(e);
            }
            return updated;
          });
        }
      }
    }, (err) => {
      console.warn('Firestore gupy_jobs snapshot:', err);
    });

    // 2. Fetch from backend API (vagas reais diretas da fonte)
    fetch('/api/gupy/jobs')
      .then(res => res.ok ? res.text().then(t => t ? JSON.parse(t) : null).catch(() => null) : null)
      .then(data => {
        if (data && data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
          hasLoadedGupy = true;
          setGupyStatus('available');
          setJobs(prevJobs => {
            const nonGupy = prevJobs.filter(j => j.source !== 'Gupy' && !isSineJobRecord(j));
            const validApiJobs = data.jobs.filter((j: any) => !isSineJobRecord(j));
            const updated = [...validApiJobs, ...nonGupy];
            try {
              localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(updated));
            } catch (e) {
              console.error(e);
            }
            return updated;
          });
        } else {
          if (!hasLoadedGupy) {
            setGupyStatus('unavailable');
          }
        }
      })
      .catch(err => {
        console.warn('Gupy live fetch error:', err);
        if (!hasLoadedGupy) {
          setGupyStatus('unavailable');
        }
      });

    return () => unsubscribe();
  }, []);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'jobs' | 'gratitude' | 'saved'>('jobs');

  // Modals state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [quickApplyJob, setQuickApplyJob] = useState<Job | null>(null);
  const [selectedJobForPitch, setSelectedJobForPitch] = useState<Job | null>(null);
  const [jobToShare, setJobToShare] = useState<Job | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isGratitudeModalOpen, setIsGratitudeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    location: '',
    workMode: 'Todos',
    contractType: 'Todos',
    category: 'Todas',
    experienceLevel: 'Todos',
    source: 'Todos',
    onlyNew: false,
    sortBy: 'recent',
  });

  // Automatic Updates Engine State
  const [isAutoUpdating, setIsAutoUpdating] = useState(true);
  const [countdown, setCountdown] = useState(MAX_COUNTDOWN);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('há instantes');

  // Persist jobs & gratitude to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    } catch (e) {
      console.error(e);
    }
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GRATITUDE, JSON.stringify(gratitudeComments));
    } catch (e) {
      console.error(e);
    }
  }, [gratitudeComments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(savedJobIds));
    } catch (e) {
      console.error(e);
    }
  }, [savedJobIds]);

  // Rotina contínua: remove automaticamente vagas com mais de 20 dias a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setJobs((prevJobs) => {
        const active = prevJobs.filter((j) => !j.timestamp || (now - j.timestamp) <= MAX_JOB_AGE_MS);
        if (active.length !== prevJobs.length) {
          try {
            localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(active));
          } catch (e) {
            console.error(e);
          }
          return active;
        }
        return prevJobs;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check URL query parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vagaId = params.get('vaga');
    const tabParam = params.get('tab');

    if (tabParam === 'gratidao' || tabParam === 'gratitude') {
      setActiveTab('gratitude');
    }

    if (vagaId) {
      const found = jobs.find((j) => j.id === vagaId);
      if (found) {
        setSelectedJob(found);
      }
    }
  }, []);

  // Radar de vagas: consulta somente fontes reais e nunca injeta vagas de demonstração.
  const pullNextLinkedInJob = useCallback(async () => {
    try {
      const [gupyResponse, sineResponse] = await Promise.all([
        fetch('/api/gupy/jobs'),
        fetch('/api/sine/jobs')
      ]);

      const gupyData = gupyResponse.ok
        ? await gupyResponse.json().catch(() => null)
        : null;
      const sineData = sineResponse.ok
        ? await sineResponse.json().catch(() => null)
        : null;

      const realGupyJobs: Job[] =
        gupyData?.success && Array.isArray(gupyData.jobs)
          ? gupyData.jobs.filter((j: any) => j?.id && j?.source === 'Gupy' && j?.applicationUrl)
          : [];

      const realSineJobs: Job[] =
        sineData?.success && Array.isArray(sineData.jobs)
          ? sineData.jobs.filter((j: any) => j?.id && (isSineJobRecord(j) || j?.source === 'SINE-PI'))
          : [];

      if (realGupyJobs.length === 0 && realSineJobs.length === 0) {
        setLastUpdatedTime(new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }));
        return;
      }

      setJobs(prevJobs => {
        const existingIds = new Set(prevJobs.map(j => j.id));
        const incomingRealJobs = [...realGupyJobs, ...realSineJobs]
          .filter(j => !existingIds.has(j.id))
          .map(j => ({ ...j, isNew: Boolean(j.isNew) }));

        if (incomingRealJobs.length > 0) {
          setNewJobsCount(count => count + incomingRealJobs.length);
          setToastMessage(
            `⚡ Radar Ativo: +${incomingRealJobs.length} nova(s) vaga(s) detectada(s) em fontes oficiais.`
          );
        }

        const merged = [...incomingRealJobs, ...prevJobs];
        return merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });

      setLastUpdatedTime(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }));
    } catch (err) {
      console.warn('Radar de vagas: erro na consulta das fontes reais:', err);
    }
  }, []);

  // Automatic update ticker countdown
  useEffect(() => {
    if (!isAutoUpdating) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          void pullNextLinkedInJob();
          return MAX_COUNTDOWN;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoUpdating, pullNextLinkedInJob]);

  // Manual refresh trigger (Executa POST /api/sine/sync real e atualiza vagas)
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setToastMessage('Sincronizando com SINE-PI...');
    try {
      // 1. Executa sincronização real no backend com o PDF do SINE-PI com autenticação segura
      const result = await triggerSineSync();
      const sineData = result.data || {};

      // 2. Atualiza o Radar consultando as fontes reais
      void pullNextLinkedInJob();

      setCountdown(MAX_COUNTDOWN);
      setIsRefreshing(false);

      if (result.statusCode === 401) {
        setToastMessage('🔒 Sincronização SINE: Faça login como administrador para disparar a atualização.');
        return;
      }

      if (result.statusCode === 403) {
        setToastMessage('⛔ Sincronização SINE: Apenas o e-mail do administrador pode disparar a sincronização.');
        return;
      }

      if (result.statusCode === 503) {
        setToastMessage('⚠️ Serviço de autenticação indisponível no servidor.');
        return;
      }

      if (result.success && sineData.success) {
        const totalVagas = (sineData.teresinaJobs || 0) + (sineData.pcdJobs || 0);
        setToastMessage(
          `Sincronização concluída.\n📄 PDF: ${sineData.publicationDate} | Total: ${totalVagas} vagas | Novas: ${sineData.newJobs} | Atualizadas: ${sineData.updatedJobs} | Duplicadas: ${sineData.duplicates}`
        );
      } else {
        setToastMessage(`Sincronização SINE: ${result.error || sineData.errors?.join(', ') || 'Processo finalizado com avisos'}`);
      }
    } catch (e: any) {
      console.error(e);
      setIsRefreshing(false);
      setToastMessage('Sincronização concluída (modo offline/cache ativo).');
    }
  };

  // Toggle saved job bookmark
  const handleToggleSave = (jobId: string) => {
    setSavedJobIds((prev) => {
      if (prev.includes(jobId)) {
        setToastMessage('Vaga removida da sua lista de salvas.');
        return prev.filter((id) => id !== jobId);
      } else {
        setToastMessage('⭐ Vaga salva! Acesse na aba "Salvas" a qualquer momento.');
        return [...prev, jobId];
      }
    });
  };

  // Add new job posted by user
  const handleAddJob = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
    setNewJobsCount((c) => c + 1);
  };

  // Add new gratitude comment
  const handleAddGratitude = (newComment: GratitudeComment) => {
    setGratitudeComments((prev) => [newComment, ...prev]);
  };

  // React to gratitude comment
  const handleReactGratitude = (commentId: string, reactionType: 'celebration' | 'love' | 'clap') => {
    setGratitudeComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            reactions: {
              ...comment.reactions,
              [reactionType]: comment.reactions[reactionType] + 1,
            },
          };
        }
        return comment;
      })
    );
    setToastMessage('Obrigado por celebrar e apoiar essa conquista! 🎉');
  };

  // Vagas do feed geral: absolutamente NENHUMA vaga do SINE-PI (source === 'SINE', 'SINE-PI', fonte === 'SINE-PI', etc.)
  const generalJobs = useMemo(() => {
    return jobs.filter((j) => !isSineJobRecord(j) && j.source !== 'LinkedIn');
  }, [jobs]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    // Exclui completamente vagas do LinkedIn e do SINE-PI
    let list = generalJobs;

    // If on saved tab, only show saved jobs
    if (activeTab === 'saved') {
      list = list.filter((j) => savedJobIds.includes(j.id));
    }

    // FILTRO RIGOROSO: Apenas vagas com E-mail informado pelo RH ou Link Oficial de Cadastro
    list = list.filter((j) => {
      const hasValidEmail = Boolean(j.contactEmail && j.contactEmail.trim().length > 0);
      const hasValidUrl = Boolean(j.applicationUrl && j.applicationUrl.trim().length > 0 && j.applicationUrl.startsWith('http'));
      return hasValidEmail || hasValidUrl;
    });

    // REGRA DE VALIDADE (20 DIAS): Vagas com mais de 20 dias expiram automaticamente
    const now = Date.now();
    list = list.filter((j) => !j.timestamp || (now - j.timestamp) <= MAX_JOB_AGE_MS);

    // Query filter
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          (j.contactEmail && j.contactEmail.toLowerCase().includes(q)) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Location filter
    if (filters.location.trim()) {
      const l = filters.location.toLowerCase();
      list = list.filter(
        (j) =>
          j.location.toLowerCase().includes(l) ||
          (l.includes('remoto') && j.workMode === 'Remoto')
      );
    }

    // Work Mode
    if (filters.workMode !== 'Todos') {
      list = list.filter((j) => j.workMode === filters.workMode);
    }

    // Contract Type
    if (filters.contractType !== 'Todos') {
      list = list.filter((j) => j.contractType === filters.contractType);
    }

    // Category
    if (filters.category !== 'Todas') {
      list = list.filter((j) => j.category === filters.category);
    }

    // Experience Level
    if (filters.experienceLevel !== 'Todos') {
      list = list.filter((j) => j.experienceLevel === filters.experienceLevel);
    }

    // Source Filter
    if (filters.source && filters.source !== 'Todos') {
      list = list.filter((j) => j.source === filters.source);
    }

    // Only New (published today)
    if (filters.onlyNew) {
      list = list.filter((j) => j.isNew);
    }

    // Last 3 Days Filter
    if (filters.last3DaysOnly) {
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      list = list.filter((j) => {
        if (j.timestamp && (now - j.timestamp) <= threeDaysMs) return true;
        const p = (j.postedAt || '').toLowerCase();
        return p.includes('hoje') || p.includes('ontem') || p.includes('2 dia') || p.includes('3 dia') || p.includes('agora');
      });
    }

    // Optional user toggles
    if (filters.onlyWithEmail) {
      list = list.filter((j) => Boolean(j.contactEmail && j.contactEmail.trim().length > 0));
    }

    if (filters.onlyWithLink) {
      list = list.filter((j) => Boolean(j.applicationUrl && j.applicationUrl.trim().length > 0 && j.applicationUrl.startsWith('http')));
    }

    // Sorting
    const sorted = [...list].sort((a, b) => {
      if (filters.sortBy === 'views') {
        return b.viewsCount - a.viewsCount;
      }
      if (filters.sortBy === 'salary') {
        const salA = parseInt(a.salary.replace(/\D/g, '')) || 0;
        const salB = parseInt(b.salary.replace(/\D/g, '')) || 0;
        return salB - salA;
      }
      return b.timestamp - a.timestamp;
    });

    // Deduplicação estrita de chaves por ID para evitar aviso de chaves duplicadas no React
    const seen = new Set<string>();
    const uniqueSorted: Job[] = [];
    for (const item of sorted) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        uniqueSorted.push(item);
      }
    }

    return uniqueSorted;
  }, [jobs, activeTab, savedJobIds, filters]);

  const handleResetFilters = () => {
    setFilters({
      query: '',
      location: '',
      workMode: 'Todos',
      contractType: 'Todos',
      category: 'Todas',
      experienceLevel: 'Todos',
      source: 'Todos',
      onlyNew: false,
      sortBy: 'recent',
    });
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== 'jobs') setActiveTab('jobs');
    const el = document.getElementById('vagas');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const quickFilter = (term: string, mode?: WorkMode) => {
    if (activeTab !== 'jobs') setActiveTab('jobs');
    setFilters({
      query: term,
      location: '',
      workMode: mode || 'Todos',
      contractType: 'Todos',
      category: 'Todas',
      experienceLevel: 'Todos',
      source: 'Todos',
      onlyNew: false,
      sortBy: 'recent',
    });
    const el = document.getElementById('vagas');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filterBySource = (src: JobSource) => {
    if (activeTab !== 'jobs') setActiveTab('jobs');
    setFilters({
      query: '',
      location: '',
      workMode: 'Todos',
      contractType: 'Todos',
      category: 'Todas',
      experienceLevel: 'Todos',
      source: src,
      onlyNew: false,
      sortBy: 'recent',
    });
    const el = document.getElementById('vagas');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenShareJob = (job: Job) => {
    setJobToShare(job);
    setIsShareModalOpen(true);
  };

  const handleOpenShareSite = () => {
    setJobToShare(null);
    setIsShareModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-[#ec4899] selection:text-white">
      
      {/* Toast Feedback */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        jobsCount={jobs.length}
        savedCount={savedJobIds.length}
        gratitudeCount={gratitudeComments.length}
        isAutoUpdating={isAutoUpdating}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenCandidateDashboard={() => setIsCandidateDashboardOpen(true)}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        onOpenShareModal={handleOpenShareSite}
        onOpenGratitudeModal={() => {
          setActiveTab('gratitude');
          setIsGratitudeModalOpen(true);
        }}
        onOpenAuthModal={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* HERO SECTION */}
      {activeTab === 'jobs' && (
        <section className="relative pt-14 pb-24 md:pt-20 md:pb-32 bg-gradient-to-br from-[#13072e] via-[#230a38] to-[#0d051c] text-white overflow-hidden border-b-2 border-slate-900">
          
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            {/* HERO TOP ROW: TITLE & FEATURES (LEFT/CENTER) + BONEQUINHO CHAMANDO (RIGHT) */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-10">
              
              {/* Left/Center: Headline & Features */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6 sm:mb-8">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display leading-tight mb-3">
                    Procurando emprego ou o <br className="hidden sm:inline" />
                    talento perfeito?
                  </h1>
                  <span className="block text-4xl sm:text-6xl lg:text-7xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent font-display drop-shadow-md">
                    Vai Que Dá Certo!
                  </span>
                </div>

                {/* 3 Feature Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl text-center lg:text-left">
                  {/* Feature 1 */}
                  <div className="flex flex-col items-center lg:items-start">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-amber-300/30 flex items-center justify-center mb-2.5 text-amber-300 shadow-inner">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-white font-black text-sm sm:text-base mb-1 font-display">
                      Remuneração Transparente
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      Diga adeus ao &apos;salário a combinar&apos;. Veja os detalhes.
                    </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex flex-col items-center lg:items-start">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-amber-300/30 flex items-center justify-center mb-2.5 text-amber-300 shadow-inner">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <h3 className="text-white font-black text-sm sm:text-base mb-1 font-display">
                      Contato Direto
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      Fale com o RH via e-mail ou Zap sem barreiras.
                    </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex flex-col items-center lg:items-start">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-amber-300/30 flex items-center justify-center mb-2.5 text-amber-300 shadow-inner">
                      <Zap className="w-5 h-5 text-amber-300" />
                    </div>
                    <h3 className="text-white font-black text-sm sm:text-base mb-1 font-display">
                      Contratação Rápida
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      Vagas quentes e reais em Teresina agora.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side: Vídeo MP4 do Mascote rodando fluido e sem travamentos */}
              <div className="shrink-0 flex justify-center lg:justify-end">
                <HeroMascotVideo
                  onScrollToJobs={() => {
                    if (activeTab !== 'jobs') setActiveTab('jobs');
                    const el = document.getElementById('vagas');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              </div>

            </div>

            {/* SEARCH BAR BOX */}
            <div className="max-w-5xl mx-auto bg-white p-3 sm:p-4 rounded-3xl shadow-2xl border-2 border-slate-200 text-slate-900 relative z-20">
              <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                
                {/* Keyword */}
                <div className="lg:col-span-4 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-purple-600 focus-within:bg-white transition-all">
                  <Search className="w-5 h-5 text-purple-700 shrink-0" />
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                    placeholder="Cargo, empresa ou skill (ex: React, Vendas)"
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                {/* Location */}
                <div className="lg:col-span-3 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-purple-600 focus-within:bg-white transition-all">
                  <MapPin className="w-5 h-5 text-pink-500 shrink-0" />
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Teresina, PI ou Brasil"
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                {/* Modality */}
                <div className="lg:col-span-3 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-purple-600 focus-within:bg-white transition-all">
                  <Laptop className="w-5 h-5 text-cyan-600 shrink-0" />
                  <select
                    value={filters.workMode}
                    onChange={(e) => setFilters((prev) => ({ ...prev, workMode: e.target.value as WorkMode }))}
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Todos">Todas Modalidades</option>
                    <option value="Remoto">100% Remoto</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-full py-3.5 px-6 bg-purple-700 hover:bg-purple-800 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-purple-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span>Buscar</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        </section>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full">
        
        {/* VIEW 1 & 3: Jobs List or Saved Jobs */}
        {(activeTab === 'jobs' || activeTab === 'saved') && (
          <section id="vagas" className="py-16 md:py-20 mesh-light border-b-2 border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              
              {/* Header Title for Jobs Section */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="px-3 py-1 bg-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-lg border-2 border-slate-900 badge-fun inline-block mb-3 font-display">
                    {activeTab === 'saved' ? '🔖 Vagas Selecionadas' : '🎈 Oportunidades em Alta'}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
                    {activeTab === 'saved'
                      ? `Minhas Vagas Salvas (${savedJobIds.length})`
                      : 'Explore as melhores vagas do mercado'}
                  </h2>
                </div>

                {activeTab === 'saved' && (
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs sm:text-sm border-2 border-slate-900 btn-pop self-start sm:self-auto"
                  >
                    Ver Todas as Vagas
                  </button>
                )}
              </div>

              {/* SINE-PI OFFICIAL JOBS SECTION */}
              <div id="sine-pi-section" className="mb-10 p-6 sm:p-8 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl border-4 border-slate-900 text-white shadow-[8px_8px_0px_#facc15]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-purple-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-3 py-1 rounded-full bg-yellow-400 text-slate-900 uppercase tracking-widest">
                        🏛️ Integração Oficial Governamental
                      </span>
                      <span className="text-xs bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                        {sineJobs.length} Vagas Hoje
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black font-display mt-2 flex items-center gap-2">
                      <span>Vagas Oficiais do SINE-PI em Teresina</span>
                    </h3>
                    <p className="text-xs text-slate-300 font-medium mt-1">
                      Todas as <strong>{sineJobs.length} vagas</strong> extraídas diretamente do boletim diário oficial do Governo do Estado do Piauí (SINE-PI).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSinePostosOpen(true)}
                      className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 btn-pop flex items-center gap-1.5 shadow-md"
                    >
                      <span>📍 Postos SINE-PI</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setIsSineAdminOpen(true)}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl border-2 border-slate-900 btn-pop flex items-center gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Painel SINE-PI</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* SINE Jobs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[640px] overflow-y-auto pr-2 custom-scrollbar">
                  {sineJobs.map((sineJob, idx) => (
                    <div 
                      key={`${sineJob.id}-${idx}`}
                      onClick={() => setSelectedSineJob(sineJob)}
                      className="p-5 bg-white text-slate-900 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_#facc15] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-slate-900 uppercase">
                            Fonte: SINE-PI
                          </span>
                          {sineJob.pcd ? (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-300 text-slate-900 border border-slate-900 uppercase font-black">
                              ♿ PCD
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                              Geral
                            </span>
                          )}
                        </div>
                        <h4 className="text-base sm:text-lg font-black font-display text-slate-900 mb-1.5 line-clamp-1">{sineJob.titulo}</h4>
                        <p className="text-xs text-slate-600 font-bold mb-3 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span>{sineJob.cidade} - {sineJob.estado} • <strong className="text-purple-700">{sineJob.quantidade}</strong></span>
                        </p>
                        <div className="space-y-1 mb-3 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <p className="line-clamp-1">💼 <strong>Escolaridade:</strong> {sineJob.escolaridade}</p>
                          <p className="line-clamp-1">⏳ <strong>Experiência:</strong> {sineJob.experiencia}</p>
                          <p>💰 <strong>Salário:</strong> <span className="text-purple-700 font-bold">{sineJob.salario}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs font-black text-purple-700">
                        <span className="text-[11px] text-slate-500">Publicada: {sineJob.data_publicacao}</span>
                        <span className="underline hover:text-purple-900 flex items-center gap-0.5">
                          Ver vaga →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters Bar & Categories */}
              <JobFilters
                filters={filters}
                setFilters={setFilters}
                totalJobs={generalJobs.length}
                filteredJobsCount={filteredJobs.length}
                onResetFilters={handleResetFilters}
              />

              {/* Jobs Cards Grid */}
              {generalJobs.length === 0 ? (
                <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] space-y-5 max-w-2xl mx-auto my-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-700 via-pink-500 to-yellow-400 flex items-center justify-center mx-auto text-white shadow-md border-2 border-slate-900">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-black px-3 py-1 rounded-xl bg-pink-100 border-2 border-slate-900 text-pink-700 uppercase tracking-wider">
                      Catálogo Pronto & Funcional
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 font-display">
                      Nenhuma vaga cadastrada no momento
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                      O portal está 100% ativo e pronto para receber oportunidades reais. Publique uma vaga agora mesmo para gerar o banner com o <strong>Selo Oficial VAI DÁ CERTO</strong> e receber candidaturas diretas!
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      id="btn-empty-state-post-job"
                      onClick={() => setIsPostJobOpen(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 border-2 border-slate-900 text-slate-900 text-xs sm:text-sm font-black btn-pop"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Nova Vaga</span>
                    </button>
                  </div>
                </div>
              ) : filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map((job, idx) => (
                    <JobCard
                      key={`${job.id}-${idx}`}
                      job={job}
                      isSaved={savedJobIds.includes(job.id)}
                      onToggleSave={handleToggleSave}
                      onSelectJob={(j) => setSelectedJob(j)}
                      onShareJob={handleOpenShareJob}
                      onQuickApply={(j) => setQuickApplyJob(j)}
                    />
                  ))}
                </div>
              ) : filters.source === 'Gupy' && gupyStatus === 'unavailable' ? (
                /* Gupy Indisponível State */
                <div className="p-12 text-center rounded-3xl bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4 max-w-xl mx-auto my-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 border-2 border-slate-900 flex items-center justify-center mx-auto text-blue-600 text-2xl font-black">
                    ⚠️
                  </div>
                  <h3 className="text-xl font-black text-slate-900 font-display">
                    Vagas Gupy temporariamente indisponíveis.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    A comunicação com os servidores da Gupy está indisponível no momento. Por favor, tente novamente mais tarde ou confira as vagas oficiais do SINE-PI.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-black border-2 border-slate-900 btn-pop"
                    >
                      Ver Vagas do SINE-PI Disponíveis
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="p-12 text-center rounded-3xl bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4 max-w-xl mx-auto my-8">
                  <div className="w-16 h-16 rounded-2xl bg-pink-100 border-2 border-slate-900 flex items-center justify-center mx-auto text-pink-600 text-2xl font-black">
                    🔍
                  </div>
                  <h3 className="text-xl font-black text-slate-900 font-display">
                    Nenhuma vaga encontrada com estes filtros
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    Tente remover alguns filtros ou busque por termos mais genéricos para visualizar outras oportunidades disponíveis.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-black border-2 border-slate-900 btn-pop"
                    >
                      Limpar Todos os Filtros
                    </button>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* B2B / PARA EMPRESAS SECTION */}
        {activeTab === 'jobs' && (
          <B2BSection onShowToast={(msg) => setToastMessage(msg)} />
        )}

        {/* COMO FUNCIONA SECTION */}
        {activeTab === 'jobs' && (
          <HowItWorksSection />
        )}

        {/* DEPOIMENTOS SECTION */}
        {activeTab === 'jobs' && (
          <TestimonialsSection onOpenGratitudeTab={() => setActiveTab('gratitude')} />
        )}

        {/* VIEW 2: Gratitude Wall (Mural de Gratidão & Conquistas) */}
        {activeTab === 'gratitude' && (
          <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <GratitudeWall
              comments={gratitudeComments}
              onAddComment={handleAddGratitude}
              onReactComment={handleReactGratitude}
              onShowToast={(msg) => setToastMessage(msg)}
              isOpenModal={isGratitudeModalOpen}
              setIsOpenModal={setIsGratitudeModalOpen}
            />
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-16 border-t-2 border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            
            {/* Col 1 & 2: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-900 font-black text-xl flex items-center justify-center border-2 border-slate-900">
                  🚀
                </div>
                <span className="font-display font-black text-2xl tracking-tight text-white">
                  Vai Que <span className="text-yellow-400">Dá Certo!</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm max-w-sm font-medium leading-relaxed">
                O portal de vagas e soluções de recrutamento com mais energia, simplicidade e resultado do Brasil. Vagas auditadas com Selo Oficial!
              </p>
            </div>

            {/* Col 3: Candidatos */}
            <div>
              <h4 className="font-black text-sm text-yellow-400 uppercase tracking-wider mb-4 font-display">
                Para Candidatos
              </h4>
              <ul className="space-y-2 text-sm text-slate-300 font-bold">
                <li>
                  <button onClick={() => { setActiveTab('jobs'); document.getElementById('vagas')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-yellow-400 transition-colors">
                    Buscar Vagas
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('saved')} className="hover:text-yellow-400 transition-colors">
                    Vagas Salvas
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('gratitude'); }} className="hover:text-yellow-400 transition-colors">
                    Mural de Conquistas 🎉
                  </button>
                </li>
                <li>
                  <button onClick={handleOpenShareSite} className="hover:text-yellow-400 transition-colors">
                    Compartilhar Portal
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Empresas */}
            <div>
              <h4 className="font-black text-sm text-yellow-400 uppercase tracking-wider mb-4 font-display">
                Para Empresas
              </h4>
              <ul className="space-y-2 text-sm text-slate-300 font-bold">
                <li>
                  <button onClick={() => setIsPostJobOpen(true)} className="hover:text-yellow-400 transition-colors">
                    Anunciar Vaga Grátis
                  </button>
                </li>
                <li>
                  <a href="#para-empresas" onClick={() => { if (activeTab !== 'jobs') setActiveTab('jobs'); }} className="hover:text-yellow-400 transition-colors">
                    Contratar Recrutamento
                  </a>
                </li>
                <li>
                  <a href="#para-empresas" onClick={() => { if (activeTab !== 'jobs') setActiveTab('jobs'); }} className="hover:text-yellow-400 transition-colors">
                    Área do RH & Headhunting
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 5: Social & Contato */}
            <div>
              <h4 className="font-black text-sm text-yellow-400 uppercase tracking-wider mb-4 font-display">
                Conecte-se
              </h4>
              <div className="flex gap-3 mb-4">
                <button 
                  onClick={handleOpenShareSite} 
                  className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-purple-700 transition-colors font-bold text-xs"
                >
                  💼
                </button>
                <button 
                  onClick={handleOpenShareSite} 
                  className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-pink-600 transition-colors font-bold text-xs"
                >
                  📸
                </button>
                <button 
                  onClick={handleOpenShareSite} 
                  className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-cyan-500 transition-colors font-bold text-xs"
                >
                  💬
                </button>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Teresina, PI & Todo o Brasil 🇧🇷
              </p>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-bold gap-4">
            <p>&copy; {new Date().getFullYear()} Vai Que Dá Certo Soluções Digitais. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1">
              Feito com <span className="text-pink-500">❤️</span> e muita energia positiva!
            </p>
          </div>
        </div>
      </footer>

      {/* ALL MODALS */}
      {/* 1. Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        isSaved={selectedJob ? savedJobIds.includes(selectedJob.id) : false}
        onToggleSave={handleToggleSave}
        onShareJob={handleOpenShareJob}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* 2. Quick Apply Modal */}
      <QuickApplyModal
        job={quickApplyJob}
        isOpen={!!quickApplyJob}
        onClose={() => setQuickApplyJob(null)}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* 3. Auth / Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onShowToast={(msg) => setToastMessage(msg)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAdmin(user?.email?.toLowerCase() === 'willamesbarbosaadm@gmail.com');
        }}
      />

      {/* 4. Post Job Modal (Anunciar Vaga) */}
      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onAddJob={handleAddJob}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* 5. Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        job={jobToShare}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* 6. Pitch Generator Modal */}
      <CoverLetterGeneratorModal
        job={selectedJobForPitch}
        isOpen={!!selectedJobForPitch}
        onClose={() => setSelectedJobForPitch(null)}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* 7. Admin Dashboard Modal */}
      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        jobs={jobs}
        gratitudeComments={gratitudeComments}
        onDeleteJob={handleDeleteJob}
        onCleanExpiredJobs={handleCleanExpiredJobs}
        onShowToast={(msg) => setToastMessage(msg)}
        siteStats={siteStats}
      />

      {/* 8. SINE-PI Postos View Modal */}
      <SinePostosView
        isOpen={isSinePostosOpen}
        onClose={() => setIsSinePostosOpen(false)}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* 9. SINE-PI Job Detail Modal */}
      <SineJobModal
        job={selectedSineJob}
        isOpen={!!selectedSineJob}
        onClose={() => setSelectedSineJob(null)}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* 10. SINE-PI Admin Sync Modal */}
      <SineAdminModal
        isOpen={isSineAdminOpen}
        onClose={() => setIsSineAdminOpen(false)}
        onShowToast={(msg) => setToastMessage(msg)}
        syncLogs={syncLogs}
        onTriggerSync={handleTriggerSineSync}
        importedCount={sineJobs.length}
      />

      {/* 11. Candidate Dashboard Modal */}
      <CandidateDashboardModal
        isOpen={isCandidateDashboardOpen}
        onClose={() => setIsCandidateDashboardOpen(false)}
        currentUser={currentUser}
        setToastMessage={(msg) => setToastMessage(msg)}
      />

    </div>
  );
}
