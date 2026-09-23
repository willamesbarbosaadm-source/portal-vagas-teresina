import React from 'react';
import { X, MapPin, ExternalLink, Building2, Phone, ShieldCheck } from 'lucide-react';

interface SinePostosViewProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const SinePostosView: React.FC<SinePostosViewProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const postos = [
    {
      nome: 'Sine Central',
      endereco: 'Rua Álvaro Mendes, 2090 — Centro, Teresina - PI',
      horario: 'Segunda a Sexta, 07h30 às 13h30',
      servicos: 'Emissão de RG, Seguro-Desemprego, Intermediação de Mão de Obra'
    },
    {
      nome: 'Sine Parque Piauí',
      endereco: 'Avenida Marechal Rondon, 138 — Parque Piauí, Teresina - PI',
      horario: 'Segunda a Sexta, 08h00 às 13h00',
      servicos: 'Intermediação de vagas e cadastro profissional'
    },
    {
      nome: 'Sine Teresina Shopping',
      endereco: 'Avenida Raul Lopes — Espaço da Cidadania, Teresina - PI',
      horario: 'Segunda a Sexta, 08h00 às 17h00',
      servicos: 'Atendimento integrado e vagas oficiais'
    },
    {
      nome: 'Sine Dirceu',
      endereco: 'Grand Dirceu Shopping, Avenida Deputado Paulo Ferraz — Teresina - PI',
      horario: 'Segunda a Sexta, 08h00 às 13h00',
      servicos: 'Atendimento à região sudeste de Teresina'
    }
  ];

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
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 border-2 border-slate-900 text-emerald-800 uppercase tracking-wider">
              Postos Oficiais SINE-PI
            </span>
            <h2 className="text-2xl font-black text-slate-900 font-display">
              Unidades de Atendimento em Teresina
            </h2>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border-2 border-slate-900 rounded-2xl mb-6 shadow-[3px_3px_0px_#0f172a]">
          <p className="text-xs font-bold text-slate-800 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <span>
              O SINE-PI realiza a intermediação gratuita de mão de obra através de seus postos físicos em Teresina. Confira abaixo os endereços oficiais cadastrados.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {postos.map((p, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-700" />
                  <span>{p.nome}</span>
                </h3>
                <p className="text-xs text-slate-700 font-semibold mb-2">{p.endereco}</p>
                <p className="text-[11px] text-slate-500 font-medium mb-1">🕒 {p.horario}</p>
                <p className="text-[11px] text-purple-800 font-bold">💼 {p.servicos}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t-2 border-slate-200">
          <a
            href="https://portal.pi.gov.br/sine/postos/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onShowToast('Abrindo portal oficial de postos do SINE-PI...')}
            className="w-full sm:w-auto px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] btn-pop flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>VER INFORMAÇÕES OFICIAIS NO SINE-PI</span>
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
