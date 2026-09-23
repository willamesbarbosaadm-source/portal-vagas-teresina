import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Sparkles, 
  PartyPopper, 
  Heart, 
  ThumbsUp, 
  Send, 
  CheckCircle2, 
  Lightbulb, 
  X,
  PlusCircle,
  Award
} from 'lucide-react';
import { GratitudeComment } from '../types';

interface GratitudeWallProps {
  comments: GratitudeComment[];
  onAddComment: (comment: GratitudeComment) => void;
  onReactComment: (commentId: string, reactionType: 'celebration' | 'love' | 'clap') => void;
  onShowToast: (msg: string) => void;
  isOpenModal: boolean;
  setIsOpenModal: (open: boolean) => void;
}

const EMOJI_OPTIONS = ['👩‍💻', '🚀', '🎉', '🎨', '💼', '🌟', '☕', '🎯', '💪', '🏆'];

export const GratitudeWall: React.FC<GratitudeWallProps> = ({
  comments,
  onAddComment,
  onReactComment,
  onShowToast,
  isOpenModal,
  setIsOpenModal,
}) => {
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [companyFound, setCompanyFound] = useState('');
  const [testimony, setTestimony] = useState('');
  const [tips, setTips] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎉');
  const [sortBy, setSortBy] = useState<'recent' | 'reactions'>('recent');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !authorRole.trim() || !testimony.trim()) {
      onShowToast('Por favor, preencha seu nome, o cargo conquistado e seu depoimento!');
      return;
    }

    const newComment: GratitudeComment = {
      id: `gratitude-${Date.now()}`,
      authorName: authorName.trim(),
      authorRole: authorRole.trim(),
      companyFound: companyFound.trim() || 'Empresa Confidencial',
      testimony: testimony.trim(),
      avatarEmoji: selectedEmoji,
      avatarBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      reactions: {
        celebration: 1,
        love: 1,
        clap: 1,
      },
      date: 'Agora mesmo',
      timestamp: Date.now(),
      tips: tips.trim() || undefined,
    };

    onAddComment(newComment);
    setIsOpenModal(false);
    onShowToast('🎉 Seu agradecimento foi publicado no Mural de Conquistas! Parabéns pela vaga!');
    
    // Reset form
    setAuthorName('');
    setAuthorRole('');
    setCompanyFound('');
    setTestimony('');
    setTips('');
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'reactions') {
      const totalA = a.reactions.celebration + a.reactions.love + a.reactions.clap;
      const totalB = b.reactions.celebration + b.reactions.love + b.reactions.clap;
      return totalB - totalA;
    }
    return b.timestamp - a.timestamp;
  });

  return (
    <div className="w-full space-y-8 pb-12">
      
      {/* Hero Banner for Gratitude Wall */}
      <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-pink-500/30 p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Glow blur in background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-wider mb-4">
            <PartyPopper className="w-3.5 h-3.5 text-pink-400" />
            Mural de Conquistas & Gratidão
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Conseguiu um Emprego?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300">
              Comemore e Inspire!
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            Este espaço é dedicado a todos que encontraram sua vaga através do portal <strong>VAI DÁ CERTO</strong>. 
            Deixe seu depoimento, agradeça e compartilhe uma dica valiosa para motivar quem ainda está na busca!
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="btn-open-gratitude-modal"
              onClick={() => setIsOpenModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-pink-500/30 active:scale-95 transition-all duration-200"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Deixar Meu Agradecimento 🎉</span>
            </button>

            <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400">
              <div>
                <strong className="text-pink-400 font-bold block text-sm">{comments.length}</strong>
                Relatos Publicados
              </div>
              <div className="w-px h-6 bg-zinc-800" />
              <div>
                <strong className="text-white font-bold block text-sm">100%</strong>
                Gratuito & Aberto
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Histórias Reais de Sucesso</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
              {comments.length} relatos
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Reaja e celebre a conquista de cada pessoa!
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Ordenar relatos:</span>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              sortBy === 'recent'
                ? 'bg-pink-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Mais Recentes
          </button>
          <button
            onClick={() => setSortBy('reactions')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              sortBy === 'reactions'
                ? 'bg-pink-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Mais Celebrados
          </button>
        </div>
      </div>

      {/* Testimonials Grid */}
      {sortedComments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedComments.map((comment) => (
            <div
              key={comment.id}
              id={`gratitude-card-${comment.id}`}
              className="group relative flex flex-col justify-between bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/90 hover:border-pink-500/40 rounded-3xl p-6 transition-all duration-300 shadow-lg hover:shadow-pink-500/10"
            >
              <div>
                {/* Card Header: Author Info */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${comment.avatarBg} shadow-inner shrink-0`}>
                      {comment.avatarEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-base leading-tight">
                          {comment.authorName}
                        </h4>
                        <span title="Contratação Confirmada">
                          <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                        </span>
                      </div>
                      <p className="text-xs text-pink-300 font-semibold mt-0.5">
                        {comment.authorRole}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Contratado(a) na <strong className="text-zinc-300">{comment.companyFound}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-zinc-500 font-medium shrink-0">
                    {comment.date}
                  </span>
                </div>

                {/* Heartfelt testimony text */}
                <p className="text-sm text-zinc-300 leading-relaxed mb-4 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/80">
                  "{comment.testimony}"
                </p>

                {/* Helpful tip for others */}
                {comment.tips && (
                  <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent border border-pink-500/20 text-xs text-zinc-300 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-pink-300 block mb-0.5">Dica de Ouro:</span>
                      <span>{comment.tips}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Reactions Footer */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500 font-medium">
                  Deixe uma reação para apoiar:
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    id={`react-celebrate-${comment.id}`}
                    onClick={() => onReactComment(comment.id, 'celebration')}
                    title="Parabéns!"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-pink-500/20 text-zinc-300 hover:text-pink-300 border border-zinc-800 hover:border-pink-500/40 active:scale-95 transition-all"
                  >
                    <span>🎉</span>
                    <span>{comment.reactions.celebration}</span>
                  </button>

                  <button
                    id={`react-love-${comment.id}`}
                    onClick={() => onReactComment(comment.id, 'love')}
                    title="Inspirador!"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 border border-zinc-800 hover:border-rose-500/40 active:scale-95 transition-all"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span>{comment.reactions.love}</span>
                  </button>

                  <button
                    id={`react-clap-${comment.id}`}
                    onClick={() => onReactComment(comment.id, 'clap')}
                    title="Palmas!"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 active:scale-95 transition-all"
                  >
                    <span>👏</span>
                    <span>{comment.reactions.clap}</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="p-10 sm:p-14 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/90 space-y-4 max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-400 flex items-center justify-center mx-auto text-white shadow-lg shadow-pink-500/20">
            <HeartHandshake className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/35 text-pink-300 uppercase tracking-wider">
              Mural Pronto para Conquistas
            </span>
            <h3 className="text-2xl font-black text-white pt-1">
              Nenhum relato publicado ainda
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed pt-1">
              Conquistou uma oportunidade através do portal <strong>VAI DÁ CERTO</strong>? Compartilhe sua conquista, agradeça e inspire centenas de profissionais que continuam na busca!
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsOpenModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Publicar Primeiro Relato 🎉</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal to Post New Gratitude */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div 
            className="relative w-full max-w-xl my-8 bg-zinc-900 border border-pink-500/40 rounded-3xl shadow-2xl shadow-pink-500/10 overflow-hidden text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2 bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-500 w-full" />

            <button
              onClick={() => setIsOpenModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
              
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 uppercase tracking-wider">
                  Mural da Gratidão
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  Conte sua Conquista 🎉
                </h3>
                <p className="text-xs text-zinc-400">
                  Compartilhe sua alegria ao ser contratado(a) e dê aquele gás de esperança para quem está procurando!
                </p>
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Escolha um Avatar Celebratório
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-pink-600 text-white ring-2 ring-pink-400 scale-110'
                          : 'bg-zinc-950 border border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Author & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mariana Silva"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Novo Cargo Conquistado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dev Front-end Jr, Designer..."
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Empresa Contratante
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Tech Corp ou 'Startup Remota'..."
                  value={companyFound}
                  onChange={(e) => setCompanyFound(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              {/* Testimony */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Seu Agradecimento / Depoimento *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Conte como foi sua jornada, como o portal te ajudou e deixe seu agradecimento..."
                  value={testimony}
                  onChange={(e) => setTestimony(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl p-3 text-sm text-white outline-none"
                />
              </div>

              {/* Tips for other seekers */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Dica de Ouro para outros candidatos (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ajustem o portfólio no GitHub, pratiquem soft skills..."
                  value={tips}
                  onChange={(e) => setTips(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-all"
                >
                  Cancelar
                </button>

                <button
                  id="btn-submit-gratitude"
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Publicar Gratidão 🎉</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
