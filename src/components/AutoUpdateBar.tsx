import React from 'react';
import { RefreshCw, Zap, Flame, Pause, Play, Sparkles } from 'lucide-react';

interface AutoUpdateBarProps {
  isAutoUpdating: boolean;
  setIsAutoUpdating: (active: boolean) => void;
  countdown: number;
  maxCountdown: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  newJobsCount: number;
  lastUpdated: string;
}

export const AutoUpdateBar: React.FC<AutoUpdateBarProps> = ({
  isAutoUpdating,
  setIsAutoUpdating,
  countdown,
  maxCountdown,
  onManualRefresh,
  isRefreshing,
  newJobsCount,
  lastUpdated,
}) => {
  const progressPercent = ((maxCountdown - countdown) / maxCountdown) * 100;

  return (
    <div className="w-full bg-slate-900 border-b-2 border-slate-900 text-white py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
        
        {/* Left Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-900 flex items-center justify-center font-black text-sm border-2 border-slate-900 shadow-sm shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-white text-xs sm:text-sm font-display flex items-center gap-1.5">
                  Radar Automático em Tempo Real (Teresina)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-500 text-white border border-slate-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Portal Gupy
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-400 text-slate-900 border border-slate-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                  SINE-PI
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-sky-400 text-slate-900 border border-slate-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                  LinkedIn RHs
                </span>
                {newJobsCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-pink-500 text-white border border-slate-900 animate-bounce">
                    <Flame className="w-3 h-3 fill-white" />
                    +{newJobsCount} nova(s)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {isAutoUpdating ? (
                  <>Radar ativo a cada {maxCountdown}s • Vagas auditadas com Selo Oficial • Última checagem: {lastUpdated}</>
                ) : (
                  <>Radar em pausa • Clique para reativar sincronização contínua</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Center Progress Countdown */}
        {isAutoUpdating && (
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-xs text-slate-300 font-bold">Próxima vaga:</span>
            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
              <div 
                className="h-full bg-yellow-400 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-black text-yellow-400 min-w-[24px]">
              {countdown}s
            </span>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            id="toggle-auto-update"
            onClick={() => setIsAutoUpdating(!isAutoUpdating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-slate-900 transition-all ${
              isAutoUpdating
                ? 'bg-slate-800 text-slate-300 hover:text-white'
                : 'bg-yellow-400 text-slate-900'
            }`}
          >
            {isAutoUpdating ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-900" />
                <span>Ativar Radar</span>
              </>
            )}
          </button>

          <button
            id="btn-manual-refresh"
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-2 border-slate-900 btn-pop disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Puxando do LinkedIn...' : 'Puxar do LinkedIn RH'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
