import React from 'react';
import { Send, Zap, Award, Sparkles, CheckCircle } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="como-funciona" className="py-20 bg-white border-b-2 border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1.5 bg-yellow-400 text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 badge-fun inline-block mb-3 font-display">
            Passo a Passo Descomplicado
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
            Por que o "Vai Que Dá Certo" funciona?
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg mt-3">
            Eliminamos testes infinitos e processos demorados. Foco no contato direto e nas informações claras!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-slate-50 p-8 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:-translate-y-2 transition-transform relative">
            <div className="w-14 h-14 rounded-2xl bg-pink-500 text-white flex items-center justify-center font-black text-2xl border-2 border-slate-900 mb-6 badge-fun">
              1
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 font-display">
              Candidatura Descomplicada
            </h3>
            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              Veja remuneração, benefícios e requisitos na tela. Envie seu currículo diretamente por WhatsApp ou E-mail sem formulários intermináveis.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 p-8 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:-translate-y-2 transition-transform relative">
            <div className="w-14 h-14 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-black text-2xl border-2 border-slate-900 mb-6 badge-fun">
              2
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 font-display">
              Selo Oficial & Radar Ao Vivo
            </h3>
            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              Nosso radar puxa vagas reais do LinkedIn e dos principais RHs de Teresina e do Brasil, com selo de verificação e banners exclusivos.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 p-8 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:-translate-y-2 transition-transform relative">
            <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-slate-900 flex items-center justify-center font-black text-2xl border-2 border-slate-900 mb-6 badge-fun">
              3
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 font-display">
              Feedback & Contratação Real
            </h3>
            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              Contato direto com quem decide a contratação. Compartilhe sua conquista no Mural de Gratidão e inspire outros profissionais!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
