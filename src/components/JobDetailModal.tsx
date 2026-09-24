import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Share2, 
  ExternalLink, 
  Mail, 
  MessageCircle, 
  CheckCircle2, 
  Gift, 
  Bookmark, 
  Sparkles,
  Copy,
  Check,
  Award,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { Job } from '../types';
import { JobBanner } from './JobBanner';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (jobId: string) => void;
  onShareJob: (job: Job) => void;
  onShowToast: (msg: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onShareJob,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'banner' | 'details'>('banner');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen || !job) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}?vaga=${job.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    onShowToast('Link da vaga copiado com sucesso! Pronto para divulgar.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyEmail = () => {
    if (!job.contactEmail) return;
    navigator.clipboard.writeText(job.contactEmail);
    setCopiedEmail(true);
    onShowToast('E-mail de RH copiado com sucesso!');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleDirectWhatsAppShare = () => {
    const text = `⭐ *VAGA VERIFICADA - PORTAL VAI DÁ CERTO* ⭐
📢 *Cargo:* ${job.title}
🏢 *Empresa:* ${job.company}
📍 *Local:* ${job.location} (${job.workMode})
💰 *Salário:* ${job.salary}
📝 *Regime:* ${job.contractType}

✉️ *CANDIDATURA DIRETA:*
${job.contactEmail ? `Envie seu currículo para: ${job.contactEmail}` : ''}
${job.whatsapp ? `WhatsApp do RH: ${job.whatsapp}` : ''}

👉 *Veja o Banner Oficial com Selo no site:*
${window.location.origin}?vaga=${job.id}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl my-8 bg-zinc-900 border border-pink-500/40 rounded-3xl shadow-2xl shadow-pink-500/20 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-pink-600 to-rose-500 w-full" />

        {/* Close Button */}
        <button
          id="btn-close-job-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors z-20 shadow-md border border-zinc-700"
          title="Fechar janela"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header with Brand & Navigation Tabs */}
        <div className="p-5 sm:p-7 border-b border-zinc-800/90 bg-zinc-950/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3.5">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${job.companyColor} flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-pink-500/30 shrink-0`}>
                {job.companyInitials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-300">
                    {job.company}
                  </span>
                  
                  {/* SELO OFICIAL VAI DÁ CERTO */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-pink-500/25 border border-amber-400/60 text-amber-300 shadow-sm">
                    ⭐ SELO VAI DÁ CERTO
                  </span>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Auditada
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
                  {job.title}
                </h2>
              </div>
            </div>

            {/* Quick Actions (Save & Share) */}
            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
              <button
                onClick={() => onToggleSave(job.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isSaved
                    ? 'bg-pink-600/30 text-pink-300 border-pink-500'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-pink-400 text-pink-400' : ''}`} />
                <span>{isSaved ? 'Salva' : 'Salvar'}</span>
              </button>

              <button
                onClick={() => onShareJob(job)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 hover:border-pink-500/50 transition-all"
              >
                <Share2 className="w-4 h-4 text-pink-400" />
                <span>Divulgar</span>
              </button>
            </div>

          </div>

          {/* View Mode Selector Tabs: Banner vs Detalhes */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-zinc-800/80">
            <button
              onClick={() => setActiveTab('banner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'banner'
                  ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-zinc-950 shadow-md shadow-pink-500/25'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⭐ Banner com Selo VAI DÁ CERTO</span>
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'details'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-500/25'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Texto Completo da Vaga</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[62vh] overflow-y-auto space-y-6">
          
          {/* TAB 1: BANNER COM O SELO DO SITE "VAI DÁ CERTO" */}
          {activeTab === 'banner' && (
            <JobBanner job={job} onClose={onClose} />
          )}

          {/* TAB 2: DETALHES EM TEXTO */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              
              {/* Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-pink-500/30">
                  <span className="text-zinc-400 block mb-1 font-semibold">Remuneração</span>
                  <strong className="text-sm font-extrabold text-pink-400">{job.salary}</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-400 block mb-1 font-semibold">Modalidade</span>
                  <strong className="text-sm font-extrabold text-white flex items-center gap-1">
                    {job.workMode === 'Remoto' ? '🌐 100% Remoto' : job.workMode}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-400 block mb-1 font-semibold">Localização</span>
                  <strong className="text-sm font-extrabold text-white truncate block">
                    {job.location}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-400 block mb-1 font-semibold">Contrato / Nível</span>
                  <strong className="text-sm font-extrabold text-white">
                    {job.contractType} • {job.experienceLevel}
                  </strong>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-pink-400 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Descrição da Vaga
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
                  {job.description}
                </p>
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-pink-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Requisitos e Habilidades
                  </h3>
                  <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800 space-y-2">
                    {job.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2 shrink-0" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Benefícios Oferecidos
                  </h3>
                  <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800 space-y-2">
                    {job.benefits.map((ben, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <span>{ben}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Palavras-chave
                </span>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-pink-500/10 text-pink-300 border border-pink-500/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Candidatura Direta Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-zinc-900 to-amber-950/20 border border-pink-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Candidatura Direta pelo Portal VAI DÁ CERTO
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Sem intermediários: envie currículo direto ao recrutador por e-mail ou WhatsApp!
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDirectWhatsAppShare}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95 transition-all"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-pink-400" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 bg-zinc-950 border-t border-zinc-800/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            <span className="font-extrabold text-amber-400">{job.source === 'Gupy' ? 'Fonte: Gupy' : 'Portal VAI DÁ CERTO'}</span> • {job.postedAt}
            {job.contactEmail && (
              <span className="block text-zinc-400 font-mono text-[11px] mt-0.5">
                E-mail de Contato: {job.contactEmail}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {job.contactEmail && (
              <>
                <button
                  onClick={handleCopyEmail}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95 transition-all"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-pink-400" />}
                  <span>{copiedEmail ? 'E-mail Copiado!' : 'Copiar E-mail'}</span>
                </button>

                {job.applicationUrl ? (
                  <button
                    disabled
                    title="Esta vaga possui link de cadastro oficial. O envio por e-mail foi desativado."
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-zinc-800 text-zinc-400 border border-zinc-700/60 cursor-not-allowed opacity-60"
                  >
                    <Mail className="w-4 h-4 opacity-40" />
                    <span>E-mail Desativado (Use o Link)</span>
                  </button>
                ) : (
                  <a
                    id="btn-apply-email-now"
                    href={`mailto:${job.contactEmail}?subject=${encodeURIComponent(`Candidatura: ${job.title} - VAI DÁ CERTO`)}&body=${encodeURIComponent(`Olá equipe de Recursos Humanos da ${job.company},\n\nGostaria de submeter meu currículo para a oportunidade de ${job.title}, verificada no portal VAI DÁ CERTO.\n\nSeguem meus dados para contato:\nNome:\nTelefone / WhatsApp:\n\nAtenciosamente!`)}`}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-pink-600 via-rose-600 to-pink-500 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Enviar Currículo (E-mail)</span>
                  </a>
                )}
              </>
            )}

            {job.whatsapp && (
              <a
                href={`https://wa.me/${job.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi a vaga de ${job.title} (${job.company}) no Portal VAI DÁ CERTO e gostaria de me candidatar.`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>WhatsApp</span>
              </a>
            )}

            {job.sourceUrl && job.sourceUrl.includes('linkedin.com') && (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noreferrer"
                title="Ver publicação e auditoria no LinkedIn oficial"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#0A66C2] hover:bg-[#004182] text-white shadow-md active:scale-95 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Post no LinkedIn</span>
              </a>
            )}

            {job.applicationUrl && (
              <a
                id="btn-apply-direct-link"
                href={job.applicationUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md active:scale-95 transition-all ${
                  job.source === 'Gupy'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500'
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                <span>{job.source === 'Gupy' ? 'Acessar Vaga no Gupy (Oficial)' : 'Link de Cadastro Oficial'}</span>
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
