import React from 'react';
import { X, ExternalLink, MapPin, Building2, CheckCircle2, ShieldCheck, Calendar, Briefcase, Award } from 'lucide-react';
import { SineJob } from '../types/sine';

interface SineJobModalProps {
  job: SineJob | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const SineJobModal: React.FC<SineJobModalProps> = ({
  job,
  isOpen,
  onClose,
  onShowToast,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative border-4 border-slate-900 shadow-[10px_10px_0px_#facc15] animate-in fade-in zoom-in-95 duration-150 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 p-1 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Badge */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-purple-100 border-2 border-slate-900 text-purple-700 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Fonte: SINE-PI
          </span>
          {job.pcd && (
            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-yellow-300 border-2 border-slate-900 text-slate-900 uppercase">
              Vaga PCD
            </span>
          )}
          {job.isNew && (
            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-pink-100 border-2 border-slate-900 text-pink-700 uppercase">
              🆕 Nova
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display mb-2">
          {job.titulo}
        </h2>

        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 mb-6 pb-4 border-b-2 border-slate-100">
          <span className="flex items-center gap-1">
            <Building2 className="w-4 h-4 text-purple-700" />
            Empresa: <strong className="text-slate-900">Não informado pelo SINE-PI</strong>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-pink-600" />
            Local: <strong className="text-slate-900">{job.cidade} - {job.estado}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-yellow-600" />
            Publicada em: <strong className="text-slate-900">{job.data_publicacao}</strong>
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a]">
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Quantidade de Vagas</span>
            <span className="text-lg font-black text-slate-900">{job.quantidade} vaga(s)</span>
          </div>
          <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a]">
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Salário Informado</span>
            <span className="text-lg font-black text-purple-700">{job.salario}</span>
          </div>
          <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a]">
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Escolaridade Exigida</span>
            <span className="text-sm font-bold text-slate-900">{job.escolaridade}</span>
          </div>
          <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a]">
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Experiência</span>
            <span className="text-sm font-bold text-slate-900">{job.experiencia}</span>
          </div>
        </div>

        {/* Requisitos */}
        {job.requisitos && job.requisitos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-700" />
              <span>Requisitos e Observações</span>
            </h3>
            <div className="space-y-2 p-4 bg-purple-50/50 border-2 border-slate-900 rounded-2xl">
              {job.requisitos.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </div>
              ))}
              {job.observacoes && (
                <p className="text-xs text-slate-700 font-medium mt-2 pt-2 border-t border-purple-200">
                  {job.observacoes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* How to Apply Section */}
        <div className="p-5 bg-yellow-50 border-2 border-slate-900 rounded-2xl mb-6 shadow-[4px_4px_0px_#0f172a]">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
            📌 Como se Candidatar pelo SINE-PI
          </h4>
          <ol className="text-xs text-slate-800 font-medium space-y-1.5 list-decimal list-inside">
            <li>Consulte os requisitos oficiais acima.</li>
            <li>Mantenha seu cadastro atualizado no SINE-PI.</li>
            <li>Acesse a publicação oficial no portal do governo para orientações.</li>
            <li>Compareça a um posto do SINE em Teresina se necessário.</li>
          </ol>
        </div>

        {/* Transparency Notice */}
        <p className="text-[11px] text-slate-500 font-medium mb-6 italic text-center">
          "Esta oportunidade foi identificada em uma publicação oficial do SINE-PI. Consulte a publicação oficial antes de se candidatar, pois as oportunidades podem ser alteradas ou preenchidas."
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t-2 border-slate-200">
          <a
            href={job.url_fonte || "https://portal.pi.gov.br/sine/vagas-de-emprego/"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onShowToast('Redirecionando para a publicação oficial do SINE-PI...')}
            className="w-full sm:flex-1 py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] btn-pop flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4 text-yellow-400" />
            <span>VER PUBLICAÇÃO OFICIAL NO SINE-PI</span>
          </a>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl border-2 border-slate-900 btn-pop"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
