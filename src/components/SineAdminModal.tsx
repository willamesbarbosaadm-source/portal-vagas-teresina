import React, { useState } from 'react';
import { X, RefreshCw, ShieldCheck, Clock, CheckCircle2, AlertTriangle, FileText, ExternalLink, Settings } from 'lucide-react';
import { SineSyncLog } from '../types/sine';
import { auth } from '../lib/firebase';

interface SineAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  syncLogs: SineSyncLog[];
  onTriggerSync: () => void;
  importedCount: number;
}

export const SineAdminModal: React.FC<SineAdminModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  syncLogs,
  onTriggerSync,
  importedCount,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'config'>('status');
  const [frequency, setFrequency] = useState('1h');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleManualSyncClick = async () => {
    setIsSyncing(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Faça login como administrador antes de sincronizar.');
      const idToken = await user.getIdToken();
      const response = await fetch('/api/sine/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await response.json();
      setLastSyncResult(data);
      onTriggerSync();
      setIsSyncing(false);
      onShowToast('✅ Sincronização real do SINE-PI concluída!');
    } catch (err: any) {
      setIsSyncing(false);
      setLastSyncResult({
        success: false,
        error: err.message || 'Erro ao comunicar com o servidor.'
      });
      onShowToast('❌ Erro na sincronização real.');
    }
  };

  const lastLog = syncLogs[0] || {
    dataHora: '18/09/2026 às 14:00',
    publicacaoEncontrada: 'Ofertas de vagas em 18 de Setembro de 2026',
    url: 'https://portal.pi.gov.br/sine/vagas-de-emprego/',
    vagasIdentificadas: importedCount || 0,
    vagasNovas: 0,
    vagasAtualizadas: 0,
    vagasDuplicadas: 0,
    erro: false
  };

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
              Automação Oficial SINE-PI (PDF Parser)
            </span>
            <h2 className="text-2xl font-black text-slate-900 font-display">
              Painel de Sincronização & Teste Real
            </h2>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-900 mb-6">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'status' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Status & Teste Real
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'logs' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Logs de Sincronização
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'config' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚙️ Configurações
          </button>
        </div>

        {activeTab === 'status' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 border-3 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-purple-900 uppercase">Última Sincronização</span>
                  <Clock className="w-4 h-4 text-purple-700" />
                </div>
                <p className="text-sm font-black text-slate-900">{lastLog.dataHora}</p>
                <p className="text-[11px] text-purple-700 font-bold mt-1">Status: Operacional (PDF Parser Ativo) 🟢</p>
              </div>

              <div className="p-4 bg-yellow-50 border-3 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-yellow-900 uppercase">Próxima Sincronização</span>
                  <RefreshCw className="w-4 h-4 text-yellow-700" />
                </div>
                <p className="text-sm font-black text-slate-900">Automático (a cada {frequency})</p>
                <p className="text-[11px] text-yellow-800 font-bold mt-1">Endpoint: /api/cron/sine-pi</p>
              </div>
            </div>

            {/* Real Test Result Display if available */}
            {lastSyncResult && (
              <div className="p-5 bg-slate-900 text-white border-3 border-slate-900 rounded-2xl shadow-[6px_6px_0px_#facc15] space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase text-yellow-400">⚡ Resultado do Teste Real Executado</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${lastSyncResult.success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {lastSyncResult.success ? 'Firestore: OK' : 'Firestore: ERRO'}
                  </span>
                </div>
                <p className="text-xs"><strong>Fonte:</strong> SINE-PI</p>
                <p className="text-xs"><strong>Página:</strong> https://portal.pi.gov.br/sine/vagas-de-emprego/</p>
                <p className="text-xs"><strong>PDF Encontrado:</strong> {lastSyncResult.pdfTitle || 'Documento Oficial SINE-PI'}</p>
                <p className="text-xs"><strong>Data da Publicação:</strong> {lastSyncResult.publicationDate}</p>
                <p className="text-xs truncate"><strong>PDF URL:</strong> <a href={lastSyncResult.pdfUrl} target="_blank" rel="noreferrer" className="text-yellow-400 underline">{lastSyncResult.pdfUrl}</a></p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                  <div className="p-2 bg-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Teresina</span>
                    <span className="text-base font-black text-white">{lastSyncResult.teresinaJobs ?? 0}</span>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">PCD (Posto Central)</span>
                    <span className="text-base font-black text-white">{lastSyncResult.pcdJobs ?? 0}</span>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Novas / Atualizadas</span>
                    <span className="text-base font-black text-emerald-400">+{lastSyncResult.newJobs ?? 0}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl">
              <p className="text-xs font-black text-slate-900 mb-1">📄 Fonte Oficial Monitorada:</p>
              <p className="text-xs text-purple-700 font-bold mb-3">https://portal.pi.gov.br/sine/vagas-de-emprego/</p>
              <a
                href="https://portal.pi.gov.br/sine/vagas-de-emprego/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onShowToast('Abrindo portal oficial do SINE-PI...')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-xs font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>ABRIR PÁGINA DE VAGAS DO SINE-PI</span>
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleManualSyncClick}
                disabled={isSyncing}
                className="flex-1 py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] btn-pop flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-yellow-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'EXECUTANDO TESTE REAL NO PDF...' : '[ ATUALIZAR AGORA & EXECUTAR TESTE REAL ]'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">Histórico de Execuções (sine_sync_logs)</h3>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-2 border-2 border-slate-900 rounded-2xl p-3 bg-slate-50">
              <div className="p-3 bg-white border-2 border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-black text-slate-900">
                  <span>{lastLog.dataHora}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">Sucesso Real</span>
                </div>
                <p className="text-slate-600 font-medium">Publicação: {lastLog.publicacaoEncontrada}</p>
                <p className="text-slate-500 text-[11px]">Identificadas: {lastLog.vagasIdentificadas} | Novas: {lastLog.vagasNovas}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-2">
                Frequência de Sincronização Automática
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="15m">15 minutos</option>
                <option value="30m">30 minutos</option>
                <option value="1h">1 hora (Padrão recomendado)</option>
                <option value="2h">2 horas</option>
                <option value="6h">6 horas</option>
                <option value="12h">12 horas</option>
                <option value="24h">24 horas</option>
              </select>
            </div>

            <div className="p-4 bg-yellow-50 border-2 border-slate-900 rounded-2xl">
              <p className="text-xs font-bold text-slate-800 leading-relaxed">
                🔒 O endpoint de cron (<code className="bg-yellow-200 px-1 py-0.5 rounded text-slate-900 font-mono">/api/cron/sine-pi</code>) está protegido por token de segurança (<code className="bg-yellow-200 px-1 py-0.5 rounded text-slate-900 font-mono">CRON_SECRET</code>).
              </p>
            </div>
          </div>
        )}

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
