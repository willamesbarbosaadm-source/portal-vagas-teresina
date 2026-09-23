import React, { useState } from 'react';
import { Building2, Send, ShieldCheck, Zap, Target, Users, CheckCircle2, Sparkles } from 'lucide-react';

interface B2BSectionProps {
  onShowToast: (msg: string) => void;
}

export const B2BSection: React.FC<B2BSectionProps> = ({ onShowToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    service: 'Divulgação de Vaga',
    vacanciesCount: '1 vaga',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onShowToast('🎉 Solicitação Recebida com Sucesso! Nossa equipe de recrutamento corporativo entrará em contato em até 1 hora.');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        service: 'Divulgação de Vaga',
        vacanciesCount: '1 vaga',
        description: '',
      });
    }, 600);
  };

  return (
    <section id="para-empresas" className="py-24 bg-slate-900 text-white relative border-b-2 border-slate-900 overflow-hidden">
      
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* B2B Left Info */}
          <div className="lg:col-span-6 space-y-6">
            <span className="px-3.5 py-1.5 rounded-xl bg-yellow-400 text-slate-900 font-black text-xs uppercase tracking-wider border-2 border-slate-900 inline-block badge-fun font-display">
              🏢 Área do Recrutador & RH
            </span>
            
            <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight font-display">
              Precisa fechar vagas sem complicação? <br />
              <span className="text-yellow-400">Vai que dá certo!</span>
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Anuncie suas vagas para mais de 500 mil profissionais ativos ou deixe nosso time de especialistas realizar o recrutamento completo da sua equipe com triagem inteligente e o <strong>Selo Oficial VAI DÁ CERTO</strong>.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 font-black text-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                  🎯
                </div>
                <div>
                  <h3 className="font-black text-lg text-white font-display">Triagem Ultra Rápida</h3>
                  <p className="text-slate-400 text-sm">
                    Filtramos candidatos incompatíveis e entregamos os perfis mais qualificados com rapidez e precisão técnica.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-pink-500 text-white flex items-center justify-center shrink-0 font-black text-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                  🚀
                </div>
                <div>
                  <h3 className="font-black text-lg text-white font-display">Divulgação de Alto Impacto</h3>
                  <p className="text-slate-400 text-sm">
                    Sua vaga ganha o banner com Selo Oficial VAI DÁ CERTO, alcance em redes sociais, WhatsApp e banco de talentos exclusivo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-cyan-400 text-slate-900 flex items-center justify-center shrink-0 font-black text-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                  🛡️
                </div>
                <div>
                  <h3 className="font-black text-lg text-white font-display">Garantia de Reposição</h3>
                  <p className="text-slate-400 text-sm">
                    Garantimos a reposição ágil do talento em caso de incompatibilidade nos planos corporativos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* B2B Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 border-4 border-slate-900 shadow-[8px_8px_0px_#facc15]">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-900 font-display">
                  Solicitar Divulgação ou Recrutamento
                </h3>
                <p className="text-slate-600 text-sm mt-1 font-medium">
                  Preencha os dados abaixo. Nossa equipe entra em contato em até 1 hora!
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Ana Silva"
                      className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                      E-mail Corporativo *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ana@empresa.com"
                      className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Sua Empresa S.A."
                      className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(86) 99999-8888"
                      className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                      Serviço Desejado
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white cursor-pointer"
                    >
                      <option value="Divulgação de Vaga">Publicar Vaga no Portal (Grátis)</option>
                      <option value="Recrutamento Completo">Recrutamento & Seleção (End-to-End)</option>
                      <option value="Headhunting Executivo">Headhunting para Líderes</option>
                      <option value="Banco de Talentos">Acesso ao Banco de Talentos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                      Quantidade de Vagas
                    </label>
                    <select
                      value={formData.vacanciesCount}
                      onChange={(e) => setFormData({ ...formData, vacanciesCount: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white cursor-pointer"
                    >
                      <option value="1 vaga">1 Vaga</option>
                      <option value="2 a 5 vagas">2 a 5 Vagas</option>
                      <option value="Mais de 5 vagas">Mais de 5 Vagas (Volume)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                    Descrição da Vaga ou Necessidade
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Resuma o perfil que você precisa contratar ou cole o link da vaga..."
                    className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white font-black text-base rounded-xl border-2 border-slate-900 btn-pop flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span>{isSubmitting ? 'Enviando dados...' : 'Solicitar Atendimento Corporativo'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
