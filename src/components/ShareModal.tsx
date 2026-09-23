import React, { useState } from 'react';
import { X, MessageCircle, Linkedin, Twitter, Send, Copy, Check, QrCode, Share2, Globe, Sparkles } from 'lucide-react';
import { Job } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job | null;
  onShowToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  job,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const currentUrl = job
    ? `${window.location.origin}?vaga=${job.id}`
    : window.location.origin;

  const title = job
    ? `Vaga com Selo Oficial: ${job.title} na ${job.company} - Portal VAI DÁ CERTO`
    : 'VAI DÁ CERTO - Portal de Empregos & Oportunidades Auditadas';

  const shareText = job
    ? `⭐ *VAGA VERIFICADA - PORTAL VAI DÁ CERTO* ⭐
💼 *Cargo:* ${job.title}
🏢 *Empresa:* ${job.company}
📍 *Modalidade:* ${job.workMode} (${job.location})
💰 *Salário:* ${job.salary}

👉 *Acesse o Banner Oficial com Selo e candidate-se direto no site:*
${currentUrl}`
    : `🚀 *VAI DÁ CERTO - Portal de Empregos & Conquistas!*
Pronto para sair da pindaíba? O portal VAI DÁ CERTO chegou para salvar o seu boleto e dar aquele empurrãozinho na sua carreira! 🚀 Garimpamos as vagas mais quentes do LinkedIn dos RHs e empresas de Teresina. Chega de "salário a combinar": aqui você vê remuneração, benefícios, contatos diretos (e-mail e Zap) e o Selo Oficial VAI DÁ CERTO sem burocracia. E se você é empresa, divulgue sua vaga e ache o talento ideal antes do café esfriar. Acesse agora, porque VAI DÁ CERTO! 😎💼

👉 Acesse agora:
${currentUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    onShowToast('Link copiado para a área de transferência! Pronto para colar e divulgar.');
    setTimeout(() => setCopied(false), 2500);
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg my-8 bg-zinc-900 border border-pink-500/40 rounded-3xl shadow-2xl shadow-pink-500/10 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-2 bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-500 w-full" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 uppercase tracking-wider">
                Fácil Divulgação
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Share2 className="w-6 h-6 text-pink-400" />
              <span>{job ? 'Divulgar Esta Vaga' : 'Divulgar o VAI DÁ CERTO'}</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {job
                ? `Espalhe a oportunidade para ${job.title} e ajude um amigo a conquistar o emprego!`
                : 'Compartilhe o portal de vagas nos grupos de WhatsApp, LinkedIn e redes para ajudar mais pessoas a conseguirem trabalho!'}
            </p>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareToWhatsApp}
              className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold text-sm transition-all active:scale-95 group"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={shareToLinkedIn}
              className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/40 font-bold text-sm transition-all active:scale-95 group"
            >
              <Linkedin className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>LinkedIn</span>
            </button>

            <button
              onClick={shareToTelegram}
              className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 font-bold text-sm transition-all active:scale-95 group"
            >
              <Send className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Telegram</span>
            </button>

            <button
              onClick={shareToTwitter}
              className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-sm transition-all active:scale-95 group"
            >
              <Twitter className="w-5 h-5 text-zinc-300 group-hover:scale-110 transition-transform" />
              <span>Twitter / X</span>
            </button>
          </div>

          {/* Copy Link Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Link Direto para Compartilhar
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 outline-none select-all font-mono"
              />
              <button
                id="btn-copy-share-url"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-xs shrink-0 shadow-md shadow-pink-500/20 active:scale-95 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Embed Code Section for Websites */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="block text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>Código para Colocar no seu Site (iframe)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`<iframe src="${currentUrl}" width="100%" height="900px" style="border:none; border-radius:16px;"></iframe>`}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-[11px] text-zinc-400 outline-none select-all font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe src="${currentUrl}" width="100%" height="900px" style="border:none; border-radius:16px;"></iframe>`);
                  onShowToast('Código Iframe copiado! Cole no HTML do seu site.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs shrink-0 border border-zinc-700 active:scale-95 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar HTML</span>
              </button>
            </div>
          </div>

          {/* QR Code Toggle for Mobile Easy Access */}
          <div className="pt-2 border-t border-zinc-800">
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-pink-400" />
                <span>{showQr ? 'Ocultar QR Code para celular' : 'Mostrar QR Code para escanear no celular'}</span>
              </span>
              <span className="text-pink-400 text-xs">{showQr ? 'Fechar' : 'Abrir'}</span>
            </button>

            {showQr && (
              <div className="mt-4 p-5 rounded-2xl bg-white text-zinc-900 text-center mx-auto max-w-[240px] shadow-lg">
                <div className="w-40 h-40 mx-auto bg-zinc-900 rounded-xl p-3 flex flex-col items-center justify-center border-4 border-pink-500">
                  <div className="grid grid-cols-4 gap-1.5 w-full h-full p-1 bg-white rounded-lg">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-sm ${i % 2 === 0 || i === 5 || i === 10 ? 'bg-zinc-950' : 'bg-pink-600'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] font-bold text-zinc-700 mt-2">
                  Aponte a câmera do celular para abrir
                </p>
                <p className="text-[10px] text-pink-600 font-semibold truncate mt-0.5">
                  pinkjobs.app
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
