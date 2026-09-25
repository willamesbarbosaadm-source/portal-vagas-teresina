import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  DollarSign, 
  Linkedin, 
  Sparkles, 
  Loader2, 
  Save, 
  Trash2,
  Activity,
  Check
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface CandidateProfile {
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
  updatedAt?: string;
}

const emptyProfile: CandidateProfile = {
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

interface CandidateDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  setToastMessage: (msg: string) => void;
}

export function CandidateDashboardModal({
  isOpen,
  onClose,
  currentUser,
  setToastMessage
}: CandidateDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'upload' | 'diagnostics'>('profile');
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string>('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string>('');
  const [warningMsg, setWarningMsg] = useState<string>('');
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);

  // Carrega o perfil do candidato no Firestore
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    let isMounted = true;
    setLoading(true);

    const loadProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists() && docSnap.data()?.profile) {
          const loaded = docSnap.data().profile;
          if (isMounted) {
            setProfile({ ...emptyProfile, ...loaded });
          }
        } else {
          // Se não existir Firestore cliente, tenta via API do servidor
          const token = await currentUser.getIdToken?.().catch(() => null);
          if (token) {
            const res = await fetch('/api/candidate/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.profile && isMounted) {
                setProfile({ ...emptyProfile, ...data.profile });
              }
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Cálculo da Porcentagem de Conclusão do Perfil
  const profileFields = [
    profile.name,
    profile.phone,
    profile.city,
    profile.address,
    profile.desiredRole,
    profile.education,
    profile.experience,
    profile.salaryExpectation,
    profile.linkedin,
    profile.modality,
    profile.contractType,
    profile.skills,
    profile.summary
  ];

  const filledCount = profileFields.filter(val => val && val.trim().length > 0).length;
  const totalFields = profileFields.length;
  const completionPercentage = Math.round((filledCount / totalFields) * 100);

  const handleInputChange = (field: keyof CandidateProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Upload e Processamento do Currículo PDF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setUploadErrorMsg('Apenas arquivos no formato PDF são suportados.');
      return;
    }

    setUploading(true);
    setUploadErrorMsg('');
    setUploadSuccessMsg('');
    setWarningMsg('');

    try {
      const token = await currentUser?.getIdToken?.().catch(() => null);

      const formData = new FormData();
      formData.append('resume', file);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/candidate/resume', {
        method: 'POST',
        headers,
        body: formData
      });

      const responseText = await response.text().catch(() => '');
      let data: any = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseErr) {
        data = null;
      }

      if (!response.ok || !data || !data.success) {
        throw new Error(data?.error || `Falha ao processar o arquivo PDF (Servidor retornou status ${response.status}).`);
      }

      // Atualiza o perfil imediatamente no estado
      if (data.extracted) {
        const newProfile = { ...emptyProfile, ...data.extracted };
        setProfile(newProfile);

        // Salva cliente-side Firestore por garantia se estiver autenticado
        if (currentUser?.uid) {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { profile: newProfile }, { merge: true });
          } catch (fErr) {
            console.warn('Atualização local de apoio no Firestore:', fErr);
          }
        }
      }

      setUploadSuccessMsg('Dados extraídos com sucesso • PDF excluído após o processamento');
      if (data.warning) setWarningMsg(data.warning);
      setDiagnosticsData(data.diagnostics);
      setToastMessage('✨ Perfil preenchido com os dados do seu currículo PDF!');

      // Transiciona imediatamente para a aba de Perfil para o candidato visualizar os campos preenchidos
      setActiveTab('profile');

    } catch (err: any) {
      console.error('Erro de upload:', err);
      setUploadErrorMsg(err?.message || 'Erro ao processar o arquivo PDF.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Salvar Alterações Manuais
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = await currentUser.getIdToken?.();
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString()
      };

      // 1. Tenta via Firestore Cliente
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { profile: updatedProfile }, { merge: true });
      } catch (e) {
        console.warn('Salvar via client Firestore indisponível, tentando servidor:', e);
      }

      // 2. Tenta via Servidor
      if (token) {
        await fetch('/api/candidate/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ profile: updatedProfile })
        });
      }

      setToastMessage('✅ Perfil salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setToastMessage('❌ Erro ao salvar dados do perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border-4 border-slate-900 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        
        {/* Header do Modal */}
        <div className="p-6 bg-amber-400 border-b-4 border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_#000]">
              VQ
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-wide">
                Painel do Candidato
              </h2>
              <p className="text-sm font-semibold text-slate-800">
                Gerencie seus dados profissionais e importe seu currículo PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-[2px_2px_0px_#000] active:translate-y-0.5"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Barra de Progresso do Perfil */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b-4 border-slate-900">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <User className="w-6 h-6 text-amber-400" />
            <div>
              <span className="font-bold text-sm block">Status do Perfil</span>
              <span className="text-xs text-slate-300">
                {filledCount} de {totalFields} campos preenchidos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-64">
            <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden border border-slate-600">
              <div 
                className="bg-amber-400 h-full transition-all duration-500 ease-out" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="font-extrabold text-amber-400 text-lg whitespace-nowrap">
              {completionPercentage}%
            </span>
          </div>
        </div>

        {/* Abas do Modal */}
        <div className="flex border-b-2 border-slate-200 bg-slate-100 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 font-bold rounded-t-xl transition-all flex items-center gap-2 text-sm ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 border-2 border-b-0 border-slate-900 shadow-[2px_-2px_0px_#000]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            👤 Perfil
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-2.5 font-bold rounded-t-xl transition-all flex items-center gap-2 text-sm ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 border-2 border-b-0 border-slate-900 shadow-[2px_-2px_0px_#000]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            📄 Enviar Currículo (PDF)
          </button>

          {diagnosticsData && (
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-5 py-2.5 font-bold rounded-t-xl transition-all flex items-center gap-2 text-sm ${
                activeTab === 'diagnostics'
                  ? 'bg-white text-slate-900 border-2 border-b-0 border-slate-900 shadow-[2px_-2px_0px_#000]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              📊 Diagnóstico PDF
            </button>
          )}
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-600">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="font-semibold">Carregando perfil do candidato...</p>
            </div>
          ) : activeTab === 'upload' ? (
            /* TAB: ENVIAR CURRÍCULO (PDF) */
            <div className="space-y-6">
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-slate-800 text-sm flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Preenchimento Automático Inteligente</h4>
                  <p className="mt-1">
                    Anexe seu currículo em formato PDF. Nosso sistema extrai automaticamente seus dados
                    profissionais e preenche os campos do seu perfil. O arquivo PDF é descartado imediatamente
                    após o processamento para sua segurança.
                  </p>
                </div>
              </div>

              {/* Box de Drop / Seleção de Arquivo */}
              <div className="border-4 border-dashed border-slate-300 hover:border-slate-900 rounded-2xl p-8 text-center transition-all bg-slate-50 hover:bg-amber-50/50 group cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                <div className="flex flex-col items-center justify-center gap-3">
                  {uploading ? (
                    <>
                      <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                      <p className="font-bold text-slate-800 text-lg">
                        Extraindo dados do currículo...
                      </p>
                      <p className="text-xs text-slate-500">
                        Processando PDF e organizando campos do seu perfil
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[2px_2px_0px_#000]">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-lg">
                          Clique aqui para selecionar seu currículo PDF
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Suporta arquivos PDF de até 10 MB
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mensagem de Sucesso */}
              {uploadSuccessMsg && (
                <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">{uploadSuccessMsg}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Seus dados já estão disponíveis na aba "Perfil".
                    </p>
                  </div>
                </div>
              )}

              {/* Mensagem de Aviso */}
              {warningMsg && (
                <div className="bg-amber-50 border-2 border-amber-400 text-amber-900 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Aviso do Leitor PDF</p>
                    <p className="text-xs text-amber-800 mt-0.5">{warningMsg}</p>
                  </div>
                </div>
              )}

              {/* Mensagem de Erro */}
              {uploadErrorMsg && (
                <div className="bg-rose-50 border-2 border-rose-500 text-rose-900 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  <p className="font-bold">{uploadErrorMsg}</p>
                </div>
              )}
            </div>
          ) : activeTab === 'diagnostics' ? (
            /* TAB: DIAGNÓSTICO DO SISTEMA */
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Relatório de Diagnóstico do Processamento
              </h3>

              {diagnosticsData ? (
                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border-2 border-slate-900 font-mono text-xs space-y-2">
                  <p className="text-amber-400 font-bold border-b border-slate-700 pb-2">
                    ✓ STATUS: PROCESSADO E PERSISTIDO COM SUCESSO
                  </p>
                  <p><span className="text-slate-400">PDF Recebido:</span> {diagnosticsData.pdfReceived ? 'SIM' : 'NÃO'}</p>
                  <p><span className="text-slate-400">Tamanho:</span> {diagnosticsData.sizeKb} KB</p>
                  <p><span className="text-slate-400">Caracteres Brutos Extraídos:</span> {diagnosticsData.rawTextLength}</p>
                  <p><span className="text-slate-400">Campos Preenchidos:</span> {diagnosticsData.filledFieldsCount} de 13</p>
                  <p><span className="text-slate-400">Lista de Campos:</span> {diagnosticsData.filledFieldsList?.join(', ')}</p>
                  <p><span className="text-slate-400">UID do Candidato:</span> {diagnosticsData.maskedUid}</p>
                  <p><span className="text-slate-400">Projeto Firestore:</span> {diagnosticsData.projectId}</p>
                  <p><span className="text-slate-400">Caminho do Documento:</span> {diagnosticsData.firestorePath}</p>
                  <p><span className="text-slate-400">Verificação de Leitura Firestore:</span> {diagnosticsData.verifiedInFirestore ? 'SUCESSO' : 'FALHA'}</p>
                </div>
              ) : (
                <p className="text-slate-500 italic">Nenhum diagnóstico registrado nesta sessão.</p>
              )}
            </div>
          ) : (
            /* TAB: FORMULÁRIO DO PERFIL (13 CAMPOS) */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Nome Completo */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 2. WhatsApp / Telefone */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder="Ex: (86) 99999-8888"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 3. Cidade */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Cidade *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={profile.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                      placeholder="Ex: Teresina - PI"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 4. Endereço / Bairro */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Bairro / Endereço
                  </label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Ex: Centro / Zona Leste"
                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                  />
                </div>

                {/* 5. Cargo Desejado */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Cargo Desejado *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={profile.desiredRole}
                      onChange={e => handleInputChange('desiredRole', e.target.value)}
                      placeholder="Ex: Auxiliar Administrativo, Dev React..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 6. Pretensão Salarial */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Pretensão Salarial
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={profile.salaryExpectation}
                      onChange={e => handleInputChange('salaryExpectation', e.target.value)}
                      placeholder="Ex: R$ 2.500 ou A combinar"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 7. Modalidade Pretendida */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Modalidade Pretendida
                  </label>
                  <select
                    value={profile.modality}
                    onChange={e => handleInputChange('modality', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                  >
                    <option value="">Selecione...</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">Remoto</option>
                  </select>
                </div>

                {/* 8. Tipo de Contrato */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Tipo de Contrato
                  </label>
                  <select
                    value={profile.contractType}
                    onChange={e => handleInputChange('contractType', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                  >
                    <option value="">Selecione...</option>
                    <option value="CLT">CLT</option>
                    <option value="PJ">PJ</option>
                    <option value="Estágio">Estágio</option>
                  </select>
                </div>

                {/* 9. LinkedIn */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Perfil do LinkedIn
                  </label>
                  <div className="relative">
                    <Linkedin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="url"
                      value={profile.linkedin}
                      onChange={e => handleInputChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/seu-perfil"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 10. Formação Acadêmica */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Formação Acadêmica
                  </label>
                  <textarea
                    rows={2}
                    value={profile.education}
                    onChange={e => handleInputChange('education', e.target.value)}
                    placeholder="Ex: Ensino Médio Completo / Ensino Superior em Administração..."
                    className="w-full p-3 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium custom-scrollbar"
                  />
                </div>

                {/* 11. Experiência Profissional */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Experiência Profissional
                  </label>
                  <textarea
                    rows={3}
                    value={profile.experience}
                    onChange={e => handleInputChange('experience', e.target.value)}
                    placeholder="Descreva suas experiências profissionais anteriores, cargos e principais atividades..."
                    className="w-full p-3 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium custom-scrollbar"
                  />
                </div>

                {/* 12. Competências / Palavras-chave */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Competências & Habilidades
                  </label>
                  <input
                    type="text"
                    value={profile.skills}
                    onChange={e => handleInputChange('skills', e.target.value)}
                    placeholder="Ex: Excel Avançado, Atendimento ao Cliente, Vendas, Pacote Office..."
                    className="w-full p-3 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                  />
                </div>

                {/* 13. Resumo Profissional */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Resumo Profissional
                  </label>
                  <textarea
                    rows={3}
                    value={profile.summary}
                    onChange={e => handleInputChange('summary', e.target.value)}
                    placeholder="Um breve resumo sobre sua trajetória e seus objetivos..."
                    className="w-full p-3 bg-white border-2 border-slate-900 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm font-medium custom-scrollbar"
                  />
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-slate-100 border-t-2 border-slate-200 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">
            {profile.updatedAt ? `Última atualização: ${new Date(profile.updatedAt).toLocaleString('pt-BR')}` : 'Dados sincronizados via Firebase Firestore'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition-colors"
            >
              Fechar
            </button>

            {activeTab === 'profile' && (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-xl text-sm transition-all shadow-[2px_2px_0px_#000] active:translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Perfil
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
