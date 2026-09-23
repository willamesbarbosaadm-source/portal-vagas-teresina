import React, { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, X, Sparkles, Flame, DollarSign, Eye, Laptop, Briefcase, Filter } from 'lucide-react';
import { FilterState, WorkMode, ContractType, ExperienceLevel, JobSource } from '../types';

interface JobFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalJobs: number;
  filteredJobsCount: number;
  onResetFilters: () => void;
}

const CATEGORY_MAP = [
  { id: 'Todas', label: '🔥 Todas', cat: 'Todas' },
  { id: 'TI', label: '💻 Tech & Dev', cat: 'Tecnologia' },
  { id: 'Design', label: '🎨 UX/UI & Design', cat: 'Design & UX' },
  { id: 'Vendas', label: '🚀 Vendas & Mkt', cat: 'Marketing' },
  { id: 'RH', label: '🤝 Pessoas & RH', cat: 'Atendimento' },
  { id: 'Admin', label: '📋 Administrativo', cat: 'Administrativo' },
];

const WORK_MODES: WorkMode[] = ['Todos', 'Remoto', 'Híbrido', 'Presencial'];
const CONTRACT_TYPES: ContractType[] = ['Todos', 'CLT', 'PJ', 'Estágio', 'Freelance'];
const LEVELS: ExperienceLevel[] = ['Todos', 'Júnior', 'Pleno', 'Sênior', 'Especialista', 'Sem Experiência'];
const SOURCES: JobSource[] = ['Todos', 'Talentbrand', 'Gupy', 'Direto', 'Themos Vagas'];

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  setFilters,
  totalJobs,
  filteredJobsCount,
  onResetFilters,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters =
    filters.query !== '' ||
    filters.location !== '' ||
    filters.workMode !== 'Todos' ||
    filters.contractType !== 'Todos' ||
    filters.category !== 'Todas' ||
    filters.experienceLevel !== 'Todos' ||
    filters.source !== 'Todos' ||
    filters.onlyNew;

  return (
    <div className="w-full space-y-4">
      
      {/* Category Pills Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_MAP.map((cat) => {
            const isActive = filters.category === cat.cat;
            return (
              <button
                key={cat.id}
                id={`filter-cat-${cat.id.toLowerCase()}`}
                onClick={() => setFilters((prev) => ({ ...prev, category: cat.cat }))}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-slate-900 transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white btn-pop'
                    : 'bg-white text-slate-800 hover:bg-slate-100 btn-pop'
                }`}
              >
                {cat.label}
              </button>
            );
          })}

          <button
            onClick={() => setFilters((prev) => ({ ...prev, last3DaysOnly: !prev.last3DaysOnly }))}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-slate-900 transition-all flex items-center gap-1.5 ${
              filters.last3DaysOnly
                ? 'bg-rose-600 text-white btn-pop shadow-[2px_2px_0px_#000]'
                : 'bg-amber-100 text-amber-950 hover:bg-amber-200 btn-pop'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600 fill-amber-400" />
            <span>🔥 Últimos 3 Dias</span>
          </button>

          <button
            onClick={() => setFilters((prev) => ({ ...prev, source: filters.source === 'Gupy' ? 'Todos' : 'Gupy' }))}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-slate-900 transition-all flex items-center gap-1.5 ${
              filters.source === 'Gupy'
                ? 'bg-blue-600 text-white btn-pop'
                : 'bg-blue-50 text-blue-950 hover:bg-blue-100 btn-pop'
            }`}
          >
            <span>💙 Portal Gupy</span>
          </button>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-slate-900 btn-pop flex items-center gap-2 self-start sm:self-auto ${
            showAdvanced ? 'bg-yellow-400 text-slate-900' : 'bg-white text-slate-800 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtros Avançados</span>
          {hasActiveFilters && (
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvanced && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Work Mode */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-1.5">
                Modalidade
              </label>
              <select
                value={filters.workMode}
                onChange={(e) => setFilters((prev) => ({ ...prev, workMode: e.target.value as WorkMode }))}
                className="w-full px-3.5 py-2.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:bg-white cursor-pointer"
              >
                {WORK_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode === 'Remoto' ? '🌐 100% Remoto' : mode === 'Híbrido' ? '🏢 Híbrido' : mode === 'Presencial' ? '📍 Presencial' : 'Todas Modalidades'}
                  </option>
                ))}
              </select>
            </div>

            {/* Contract Type */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-1.5">
                Tipo de Contrato
              </label>
              <select
                value={filters.contractType}
                onChange={(e) => setFilters((prev) => ({ ...prev, contractType: e.target.value as ContractType }))}
                className="w-full px-3.5 py-2.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:bg-white cursor-pointer"
              >
                {CONTRACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === 'Todos' ? 'Todos os Contratos' : `Contrato ${type}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-1.5">
                Nível de Experiência
              </label>
              <select
                value={filters.experienceLevel}
                onChange={(e) => setFilters((prev) => ({ ...prev, experienceLevel: e.target.value as ExperienceLevel }))}
                className="w-full px-3.5 py-2.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:bg-white cursor-pointer"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level === 'Todos' ? 'Todos os Níveis' : level}
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-1.5">
                Origem da Vaga
              </label>
              <select
                value={filters.source}
                onChange={(e) => setFilters((prev) => ({ ...prev, source: e.target.value as JobSource }))}
                className="w-full px-3.5 py-2.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:bg-white cursor-pointer"
              >
                {SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src === 'Todos' ? 'Todas as Fontes' : src}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-1.5">
                Ordenar Vagas Por
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full px-3.5 py-2.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="recent">⏱️ Mais Recentes Primeiro</option>
                <option value="salary">💰 Maior Remuneração</option>
                <option value="views">🔥 Mais Acessadas</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-black text-slate-900">
                <input
                  type="checkbox"
                  checked={Boolean(filters.last3DaysOnly)}
                  onChange={(e) => setFilters((prev) => ({ ...prev, last3DaysOnly: e.target.checked }))}
                  className="w-4 h-4 rounded border-2 border-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span>🔥 Apenas vagas dos últimos 3 dias</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-black text-slate-900">
                <input
                  type="checkbox"
                  checked={filters.onlyNew}
                  onChange={(e) => setFilters((prev) => ({ ...prev, onlyNew: e.target.checked }))}
                  className="w-4 h-4 rounded border-2 border-slate-900 text-pink-500 focus:ring-pink-500"
                />
                <span>Apenas vagas publicadas hoje</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-black text-slate-900">
                <input
                  type="checkbox"
                  checked={Boolean(filters.onlyWithEmail)}
                  onChange={(e) => setFilters((prev) => ({ ...prev, onlyWithEmail: e.target.checked }))}
                  className="w-4 h-4 rounded border-2 border-slate-900 text-purple-600 focus:ring-purple-600"
                />
                <span>✉️ Com E-mail Direto da Empresa</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-black text-slate-900">
                <input
                  type="checkbox"
                  checked={Boolean(filters.onlyWithLink)}
                  onChange={(e) => setFilters((prev) => ({ ...prev, onlyWithLink: e.target.checked }))}
                  className="w-4 h-4 rounded border-2 border-slate-900 text-pink-500 focus:ring-pink-500"
                />
                <span>🔗 Com Link de Cadastro / Inscrição</span>
              </label>
            </div>

            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar Filtros ({filteredJobsCount} de {totalJobs} vagas)</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
