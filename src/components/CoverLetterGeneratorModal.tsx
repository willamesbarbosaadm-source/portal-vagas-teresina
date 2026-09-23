import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, MessageSquare, Send, ArrowRight } from 'lucide-react';
import { Job } from '../types';

interface CoverLetterGeneratorModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const CoverLetterGeneratorModal: React.FC<CoverLetterGeneratorModalProps> = ({
  job,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [candidateName, setCandidateName] = useState('');
  const [candidateExperience, setCandidateExperience] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [tone, setTone] = useState<'direto' | 'entusiasta' | 'formal'>('direto');
  const [generatedPitch, setGeneratedPitch] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !job) return null;

  const handleGeneratePitch = () => {
    const name = candidateName.trim() || 'Candidato(a)';
    const exp = candidateExperience.trim() || 'experiência prática na área';
    const skills = keySkills.trim() || job.tags.slice(0, 3).join(', ');

    let message = '';

    if (tone === 'direto') {
      message = `Olá! Tudo bem? Me chamo ${name} e vi a oportunidade aberta para ${job.title} na ${job.company}.
Tenho ${exp} e domínio em ferramentas como ${skills}.
Acredito que meu perfil está alinhado com o que vocês buscam e adoraria bater um papo para apresentar meus projetos e resultados.
Seguem meu currículo e portfólio em anexo! Obrigado pelo tempo e atenção.`;
    } else if (tone === 'entusiasta') {
      message = `Olá, equipe da ${job.company}! Sou ${name} e fiquei muito entusiasmado(a) com a vaga de ${job.title}!
Acompanho o crescimento de vocês e adoraria somar ao time com meu background em ${skills}, além da minha bagagem com ${exp}.
Estou à disposição para uma conversa rápida para demonstrar como posso gerar valor desde o primeiro dia.
Um grande abraço e parabéns pela cultura da empresa!`;
    } else {
      message = `Prezada equipe de recrutamento da ${job.company},
Venho por meio desta apresentar minha candidatura à posição de ${job.title}.
Possuo sólida atuação com ${skills} e ${exp}.
Estou seguro(a) de que minhas qualificações técnicas e comportamentais atendem com excelência às exigências da vaga.
Agradeço desde já pela atenção dispensada e coloco-me à inteira disposição para eventuais esclarecimentos ou entrevista.
Atenciosamente,
${name}`;
    }

    setGeneratedPitch(message);
    onShowToast('Mensagem personalizada gerada com sucesso!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPitch);
    setCopied(true);
    onShowToast('Mensagem copiada! Cole no WhatsApp, LinkedIn ou e-mail.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl my-8 bg-zinc-900 border border-pink-500/40 rounded-3xl shadow-2xl shadow-pink-500/10 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-2 bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-500 w-full" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-400" />
                Assistente de Candidatura
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Gerar Mensagem para o Recrutador
            </h3>
            <p className="text-xs text-zinc-400">
              Vaga selecionada: <strong className="text-pink-300">{job.title}</strong> na <strong className="text-white">{job.company}</strong>
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Seu Nome
              </label>
              <input
                type="text"
                placeholder="Ex: João Victor"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Resumo da sua experiência
              </label>
              <input
                type="text"
                placeholder="Ex: 2 anos construindo interfaces web responsivas..."
                value={candidateExperience}
                onChange={(e) => setCandidateExperience(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Principais Habilidades
                </label>
                <input
                  type="text"
                  placeholder="Ex: React, Figma, Comunicação..."
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Tom da Mensagem
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="direto">Direto e Prático (WhatsApp)</option>
                  <option value="entusiasta">Entusiasta e Moderno</option>
                  <option value="formal">Corporativo / Formal</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGeneratePitch}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm shadow-md shadow-pink-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Mensagem de Apresentação</span>
            </button>
          </div>

          {generatedPitch && (
            <div className="space-y-3 pt-3 border-t border-zinc-800 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                  Mensagem Pronta
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={5}
                value={generatedPitch}
                className="w-full bg-zinc-950 border border-pink-500/30 rounded-2xl p-4 text-xs sm:text-sm text-zinc-200 leading-relaxed outline-none"
              />

              <p className="text-[11px] text-zinc-500 text-center">
                Dica: você pode colar essa mensagem diretamente no chat do recrutador ou no corpo do e-mail junto ao seu currículo!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
