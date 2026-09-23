import React from 'react';
import { Star, Sparkles, HeartHandshake, ArrowRight } from 'lucide-react';

interface TestimonialsSectionProps {
  onOpenGratitudeTab: () => void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ onOpenGratitudeTab }) => {
  return (
    <section id="depoimentos" className="py-20 mesh-light border-b-2 border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1.5 bg-cyan-400 text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 badge-fun inline-block mb-3 font-display">
            Histórias de Sucesso & Conquistas
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
            Quem tentou, aprovou! 🎉
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg mt-3">
            Confira depoimentos reais de quem encontrou sua vaga dos sonhos com o portal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] flex flex-col justify-between hover:-translate-y-1.5 transition-transform">
            <div>
              <div className="flex text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-800 font-semibold text-sm sm:text-base italic leading-relaxed">
                "Pensei: 'Vai que dá certo...' e deu! Vi a vaga no radar do LinkedIn em Teresina, chamei no WhatsApp do RH e em 10 dias fui contratado como Dev React!"
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t-2 border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-black text-lg flex items-center justify-center border-2 border-slate-900 shadow-sm shrink-0">
                LO
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm font-display">Lucas Oliveira</p>
                <p className="text-xs font-bold text-purple-700">Desenvolvedor Frontend • Teresina (PI)</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] flex flex-col justify-between hover:-translate-y-1.5 transition-transform">
            <div>
              <div className="flex text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-800 font-semibold text-sm sm:text-base italic leading-relaxed">
                "Para a nossa startup em Teresina foi um divisor de águas. Anunciamos duas vagas com o Selo Oficial VAI DÁ CERTO e recebemos candidatos super qualificados direto no e-mail."
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t-2 border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 to-pink-500 text-slate-900 font-black text-lg flex items-center justify-center border-2 border-slate-900 shadow-sm shrink-0">
                JM
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm font-display">Juliana Mendes</p>
                <p className="text-xs font-bold text-pink-600">COO na TechNordeste</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] flex flex-col justify-between hover:-translate-y-1.5 transition-transform">
            <div>
              <div className="flex text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-800 font-semibold text-sm sm:text-base italic leading-relaxed">
                "Interface leve, sem pegadinhas e com vagas reais auditadas. Salvei minhas vagas favoritas e consegui minha recolocação com salário excelente!"
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t-2 border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-900 font-black text-lg flex items-center justify-center border-2 border-slate-900 shadow-sm shrink-0">
                BL
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm font-display">Beatriz Lima</p>
                <p className="text-xs font-bold text-cyan-700">UX Designer • Remoto</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={onOpenGratitudeTab}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl border-2 border-slate-900 btn-pop inline-flex items-center gap-2"
          >
            <HeartHandshake className="w-5 h-5 text-pink-400" />
            <span>Ver Mural Completo de Conquistas & Deixar Depoimento</span>
            <ArrowRight className="w-4 h-4 text-yellow-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
