import React, { useState } from 'react';
import { X, Sparkles, Plus, CheckCircle, Briefcase, Building2, MapPin, DollarSign, Share2, MessageCircle, Copy, Check } from 'lucide-react';
import { Job, WorkMode, ContractType, ExperienceLevel } from '../types';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (newJob: Job) => void;
  onShowToast: (msg: string) => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({
  isOpen,
  onClose,
  onAddJob,
  onShowToast,
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('Remoto');
  const [contractType, setContractType] = useState<ContractType>('CLT');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Pleno');
  const [category, setCategory] = useState('Tecnologia');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [benefitsInput, setBenefitsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Post success state showing share links
  const [publishedJob, setPublishedJob] = useState<Job | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim()) {
      onShowToast('Por favor, preencha pelo menos o título, a empresa e a descrição!');
      return;
    }

    const initials = company
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'VG';

    const gradients = [
      'from-pink-500 to-rose-600',
      'from-fuchsia-600 to-pink-500',
      'from-pink-600 to-purple-600',
      'from-rose-500 to-pink-500',
      'from-pink-500 to-amber-500'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    const requirements = requirementsInput
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const benefits = benefitsInput
      .split('\n')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newJob: Job = {
      id: `job-custom-${Date.now()}`,
      title: title.trim(),
      company: company.trim(),
      companyInitials: initials,
      companyColor: randomGradient,
      location: location.trim() || 'Brasil',
      workMode: workMode === 'Todos' ? 'Remoto' : (workMode as any),
      contractType: contractType === 'Todos' ? 'CLT' : (contractType as any),
      experienceLevel: experienceLevel === 'Todos' ? 'Pleno' : (experienceLevel as any),
      category,
      salary: salary.trim() || 'A combinar',
      description: description.trim(),
      requirements: requirements.length > 0 ? requirements : ['Disponibilidade para início imediato', 'Boa comunicação'],
      benefits: benefits.length > 0 ? benefits : ['Benefícios padrão de mercado'],
      tags: tags.length > 0 ? tags : [category, workMode],
      postedAt: 'Agora mesmo',
      timestamp: Date.now(),
      applicationUrl: applicationUrl.trim() || 'https://pinkjobs.app',
      contactEmail: contactEmail.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      isNew: true,
      isFeatured: true,
      viewsCount: 1,
      source: 'Direto',
      sourceUrl: 'https://pinkjobs.app',
    };

    onAddJob(newJob);
    setPublishedJob(newJob);
    onShowToast('🎉 Vaga divulgada com sucesso! Link pronto para compartilhar.');
  };

  const handleCopyShareLink = () => {
    if (!publishedJob) return;
    const url = `${window.location.origin}?vaga=${publishedJob.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    onShowToast('Link da vaga copiado com sucesso!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!publishedJob) return;
    const text = `📢 *NOVA OPORTUNIDADE OFICIAL NO VAI DÁ CERTO!*
💼 *Cargo:* ${publishedJob.title}
🏢 *Empresa:* ${publishedJob.company}
📍 *Modalidade:* ${publishedJob.workMode} (${publishedJob.location || 'Brasil'})
💰 *Remuneração:* ${publishedJob.salary || 'A combinar'}

Confira todos os detalhes com o Selo Oficial VAI DÁ CERTO e candidate-se:
${window.location.origin}?vaga=${publishedJob.id}`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl my-8 bg-zinc-900 border border-pink-500/40 rounded-3xl shadow-2xl shadow-pink-500/10 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient */}
        <div className="h-2 bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-500 w-full" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {publishedJob ? (
          /* Success Screen with easy sharing links */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center mx-auto text-pink-400">
              <CheckCircle className="w-8 h-8 text-pink-400 animate-bounce" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">
                Vaga Publicada com Sucesso! 🚀
              </h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
                Sua vaga de <strong className="text-pink-300">{publishedJob.title}</strong> na{' '}
                <strong className="text-white">{publishedJob.company}</strong> já está visível para milhares de candidatos.
              </p>
            </div>

            {/* Share Box */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-pink-500/30 text-left space-y-3">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block">
                Divulgue em 1 clique
              </span>
              <p className="text-xs text-zinc-400">
                Compartilhe o link nos seus grupos de WhatsApp, LinkedIn e redes para atrair os melhores talentos rapidamente.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyShareLink}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-700 transition-all active:scale-95"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-pink-400" />}
                  <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-500/30 transition-all"
              >
                Concluir e Ver no Feed
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 uppercase tracking-wider">
                  Divulgação 100% Grátis
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">
                Divulgar Nova Vaga de Emprego
              </h2>
              <p className="text-xs text-zinc-400">
                Publique sua oportunidade em segundos e encontre profissionais qualificados de todo o Brasil.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Job Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Título do Cargo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Desenvolvedor Front-end, Designer..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Sua Startup, Agência..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none"
                />
              </div>

              {/* Work Mode */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Modalidade
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="Remoto">🌐 100% Remoto</option>
                  <option value="Híbrido">🏢 Híbrido</option>
                  <option value="Presencial">📍 Presencial</option>
                </select>
              </div>

              {/* Contract */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Regime de Contratação
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="CLT">CLT (Carteira assinada)</option>
                  <option value="PJ">PJ (Pessoa Jurídica)</option>
                  <option value="Estágio">Estágio</option>
                  <option value="Freelance">Freelance / Temporário</option>
                </select>
              </div>

              {/* Salary */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Faixa Salarial
                </label>
                <input
                  type="text"
                  placeholder="Ex: R$ 6.000 - R$ 8.500 ou 'A combinar'"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Localidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo, SP ou 'Todo o Brasil'"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none"
                />
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Nível de Experiência
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="Sem Experiência">Sem Experiência / Estágio</option>
                  <option value="Júnior">Júnior</option>
                  <option value="Pleno">Pleno</option>
                  <option value="Sênior">Sênior</option>
                  <option value="Especialista">Especialista / Lead</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Área / Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="Tecnologia">Tecnologia & Programação</option>
                  <option value="Design & UX">Design & UX/UI</option>
                  <option value="Atendimento">Atendimento & Suporte</option>
                  <option value="Marketing">Marketing & Vendas</option>
                  <option value="Administrativo">Administrativo & Financeiro</option>
                </select>
              </div>

            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Descrição da Vaga *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Fale um pouco sobre a oportunidade, missão do time e cultura..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 outline-none"
              />
            </div>

            {/* Requirements & Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Requisitos (1 por linha)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: React 18&#10;TypeScript avançado&#10;Boa comunicação"
                  value={requirementsInput}
                  onChange={(e) => setRequirementsInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Benefícios (1 por linha)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Vale Refeição R$ 1.000&#10;Plano de Saúde&#10;Gympass"
                  value={benefitsInput}
                  onChange={(e) => setBenefitsInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none"
                />
              </div>
            </div>

            {/* Tags & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="React, Figma, Node..."
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  WhatsApp para Contato
                </label>
                <input
                  type="text"
                  placeholder="Ex: 11999998888"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Link para Candidatura
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-all"
              >
                Cancelar
              </button>

              <button
                id="btn-submit-job"
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publicar e Divulgar Agora</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
