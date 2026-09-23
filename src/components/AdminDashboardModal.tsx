import React from 'react';
import { X, TrendingUp, Calendar, Users, Briefcase, ShieldCheck, Trash2 } from 'lucide-react';
import { Job, GratitudeComment } from '../types';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  gratitudeComments: GratitudeComment[];
  onDeleteJob: (jobId: string) => void;
  onShowToast: (msg: string) => void;
  siteStats: {
    today: number;
    month: number;
    total: number;
  };
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  jobs,
  gratitudeComments,
  onDeleteJob,
  onShowToast,
  siteStats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 relative border-4 border-slate-900 shadow-[10px_10px_0px_#facc15] animate-in fade-in zoom-in-95 duration-150 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 p-1 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400 border-2 border-slate-900 flex items-center justify-center shadow-[3px_3px_0px_#0f172a] text-slate-900">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 border-2 border-slate-900 text-purple-700 uppercase tracking-wider">
              Painel Exclusivo Admin (Tempo Real)
            </span>
            <h2 className="text-2xl font-black text-slate-900 font-display">
              Estatísticas & Gestão do Portal
            </h2>
          </div>
        </div>

        {/* Stats Grid - Real Data from Firestore / Session */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 bg-purple-50 border-3 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0f172a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-purple-900 uppercase">Acessos Hoje</span>
              <Users className="w-5 h-5 text-purple-700" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-display">
              {siteStats.today.toLocaleString('pt-BR')}
            </div>
            <p className="text-[11px] text-purple-700 font-bold mt-1">
              🟢 Dado real em tempo real
            </p>
          </div>

          <div className="p-5 bg-pink-50 border-3 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0f172a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-pink-900 uppercase">Acessos no Mês</span>
              <Calendar className="w-5 h-5 text-pink-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-display">
              {siteStats.month.toLocaleString('pt-BR')}
            </div>
            <p className="text-[11px] text-pink-700 font-bold mt-1">
              🔥 Acumulado mensal
            </p>
          </div>

          <div className="p-5 bg-yellow-50 border-3 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0f172a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-yellow-900 uppercase">Total Acumulado</span>
              <TrendingUp className="w-5 h-5 text-yellow-700" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-display">
              {siteStats.total.toLocaleString('pt-BR')}
            </div>
            <p className="text-[11px] text-yellow-800 font-bold mt-1">
              🌟 Desde o lançamento
            </p>
          </div>
        </div>

        {/* Quick Summary / Moderate Jobs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-700" />
              <span>Gerenciamento de Vagas Ativas ({jobs.length})</span>
            </h3>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 border-2 border-slate-900 rounded-2xl p-3 bg-slate-50">
            {jobs.map((job) => (
              <div 
                key={job.id}
                className="flex items-center justify-between p-3 bg-white rounded-xl border-2 border-slate-200 hover:border-slate-900 transition-all"
              >
                <div>
                  <h4 className="text-sm font-black text-slate-900 line-clamp-1">{job.title}</h4>
                  <p className="text-xs text-slate-600 font-medium">{job.company} • {job.location}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Ativa
                  </span>
                  <button
                    onClick={() => {
                      onDeleteJob(job.id);
                      onShowToast(`Vaga "${job.title}" removida com sucesso.`);
                    }}
                    title="Excluir Vaga"
                    className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl border-2 border-slate-900 btn-pop"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
