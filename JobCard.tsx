import React, { useState } from 'react';
import { 
  MapPin, 
  Bookmark, 
  Share2, 
  Sparkles, 
  Clock, 
  Eye, 
  ArrowUpRight, 
  Flame, 
  CheckCircle,
  Award,
  Mail,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  isSaved: boolean;
  onToggleSave: (jobId: string) => void;
  onSelectJob: (job: Job) => void;
  onShareJob: (job: Job) => void;
  onQuickApply?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSaved,
  onToggleSave,
  onSelectJob,
  onShareJob,
  onQuickApply,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (job.contactEmail) {
      navigator.clipboard.writeText(job.contactEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div 
      id={`job-card-${job.id}`}
      className="bg-white rounded-3xl p-6 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:-translate-y-1.5 transition-all flex flex-col justify-between group text-slate-900 relative"
    >
      <div>
        {/* Top Header Card */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Company Logo / Avatar */}
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${job.companyColor} flex items-center justify-center text-white font-black text-base border-2 border-slate-900 shadow-sm shrink-0`}>
              {job.companyInitials}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-black text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                  {job.company}
                </h4>
                <CheckCircle className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              </div>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span>{job.location}</span>
              </p>
            </div>
          </div>

          {/* Modality Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`px-3 py-1 text-xs font-black rounded-xl border-2 border-slate-900 ${
              job.workMode === 'Remoto' ? 'bg-emerald-300 text-slate-900' :
              job.workMode === 'Híbrido' ? 'bg-amber-300 text-slate-900' :
              'bg-slate-200 text-slate-900'
            }`}>
              {job.workMode}
            </span>

            <button
              id={`save-job-${job.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(job.id);
              }}
              title={isSaved ? "Remover dos salvos" : "Salvar esta vaga"}
              className={`p-1.5 rounded-xl border-2 border-slate-900 transition-all ${
                isSaved
                  ? 'bg-yellow-400 text-slate-900'
                  : 'bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-slate-900' : ''}`} />
            </button>
          </div>
        </div>

        {/* Source Badge (Talentbrand / Gupy / LinkedIn / Selo Oficial) */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {job.source === 'Talentbrand' && (
            <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 border border-teal-500 text-teal-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              🟢 Talentbrand Oficial (Servfaz)
            </span>
          )}
          {job.source === 'Gupy' && (
            <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 border border-blue-400 text-blue-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              💙 Portal Gupy Oficial
            </span>
          )}
          {job.source === 'LinkedIn' && (
            <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 border border-sky-300 text-sky-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              💼 LinkedIn RH Teresina
            </span>
          )}
          {job.source === 'Direto' && (
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              🏢 RH Direto
            </span>
          )}
          {job.source === 'Themos Vagas' && (
            <span className="px-2.5 py-0.5 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              ⭐ Selo VAI DÁ CERTO
            </span>
          )}
          {job.source === 'SINE-PI' && (
            <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 border border-purple-400 text-purple-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
              🏛️ SINE-PI Oficial
            </span>
          )}
          {job.isNew && (
            <span className="px-2 py-0.5 rounded-lg bg-pink-100 border border-pink-300 text-pink-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-pink-500 fill-pink-500" />
              Hoje
            </span>
          )}
        </div>

        {/* Job Title */}
        <h3 
          onClick={() => onSelectJob(job)}
          className="text-lg font-black text-slate-900 mb-2.5 leading-snug group-hover:text-purple-700 cursor-pointer transition-colors font-display line-clamp-2"
        >
          {job.title}
        </h3>

        {/* Info Badges (Regime & Salary) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-800 mb-3">
          <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
            📄 {job.contractType}
          </span>
          <span className="bg-yellow-400/35 text-slate-900 px-2.5 py-1 rounded-lg border border-yellow-400">
            💰 {job.salary}
          </span>
          <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600">
            {job.experienceLevel}
          </span>
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-600 font-medium line-clamp-2 mb-4 leading-relaxed">
          {job.description}
        </p>

        {/* Direct Email or Official Registration Link Box */}
        {job.contactEmail ? (
          <div className="mb-4 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Mail className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="font-bold text-slate-800 truncate" title={job.contactEmail}>
                {job.contactEmail}
              </span>
            </div>
            <button
              onClick={handleCopyEmail}
              title="Copiar e-mail do RH"
              className="px-2 py-0.5 rounded-md bg-white hover:bg-purple-100 text-purple-900 font-extrabold text-[10px] border border-purple-300 shrink-0 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-purple-600" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        ) : job.applicationUrl ? (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <ExternalLink className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              <span className="font-bold text-slate-800 truncate">
                Link Direto de Inscrição Oficial
              </span>
            </div>
            <span className="text-[10px] font-black bg-pink-100 text-pink-800 px-2 py-0.5 rounded-md shrink-0 border border-pink-200">
              Link Direto
            </span>
          </div>
        ) : null}

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {job.tags.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-200"
            >
              #{tag}
            </span>
          ))}
          {job.tags.length > 4 && (
            <span className="px-2 py-1 text-slate-500 text-[11px] font-bold">
              +{job.tags.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {job.postedAt}
        </span>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShareJob(job);
            }}
            title="Compartilhar vaga"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border-2 border-slate-900 btn-pop"
          >
            <Share2 className="w-4 h-4 text-pink-500" />
          </button>

          {/* Candidatar-se / Ver Banner e Acessos */}
          <button
            id={`btn-apply-${job.id}`}
            onClick={() => {
              onSelectJob(job);
            }}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs sm:text-sm rounded-xl border-2 border-slate-900 btn-pop flex items-center gap-1.5 shadow-sm"
          >
            <span>Candidatar-se 🔥</span>
          </button>
        </div>
      </div>
    </div>
  );
};
