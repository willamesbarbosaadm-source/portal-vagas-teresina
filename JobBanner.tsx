import React, { useRef, useState } from 'react';
import { 
  Sparkles, 
  Mail, 
  MessageCircle, 
  MapPin, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  Briefcase, 
  ExternalLink,
  Calendar,
  FileText,
  Lightbulb,
  Award,
  Layers,
  CheckCheck
} from 'lucide-react';
import { Job } from '../types';

interface JobBannerProps {
  job: Job;
  onClose?: () => void;
}

export const JobBanner: React.FC<JobBannerProps> = ({ job }) => {
  const flyerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Copy Email
  const handleCopyEmail = () => {
    if (!job.contactEmail) return;
    navigator.clipboard.writeText(job.contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Copy Direct Link
  const handleCopyLink = () => {
    if (!job.applicationUrl) return;
    navigator.clipboard.writeText(job.applicationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy Formatted Text for WhatsApp
  const handleCopyFormattedMessage = () => {
    const text = `🤝 *VAI DÁ CERTO - OPORTUNIDADE PROFISSIONAL*

📌 *Vaga de:* ${job.title}
🏢 *Empresa:* ${job.company}
📍 *Local:* ${job.location} (${job.workMode})
💼 *Regime:* ${job.contractType} (${job.experienceLevel})
💰 *Remuneração / Benefícios:* ${job.salary}

📋 *REQUISITOS NECESSÁRIOS:*
${job.requirements.map(r => `• ${r}`).join('\n')}

${job.benefits && job.benefits.length > 0 ? `🎁 *BENEFÍCIOS:*\n${job.benefits.map(b => `• ${b}`).join('\n')}\n` : ''}
🔗 *CANAL DE CANDIDATURA:*
${job.contactEmail ? `✉️ E-mail: ${job.contactEmail} (Assunto: Candidatura ${job.title})` : ''}
${job.applicationUrl ? `🌐 Link Direto: ${job.applicationUrl}` : ''}
${job.whatsapp ? `📱 WhatsApp: ${job.whatsapp}` : ''}

⭐ *Portal de Oportunidades & Conexões Profissionais VAI DÁ CERTO*`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // High Resolution Canvas Generation for exact Flyer download
  const handleDownloadBannerImage = async () => {
    setDownloading(true);
    try {
      const width = 1080;
      const height = 1350;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas not available');

      // 1. Warm Editorial Background (#f4eee1)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#f9f6ef');
      bgGrad.addColorStop(0.5, '#f4eee0');
      bgGrad.addColorStop(1, '#ebe0cf');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Top decorative blueprint lines
      ctx.strokeStyle = '#d7c7b0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 40);
      ctx.lineTo(width - 80, 40);
      ctx.stroke();

      // Draw Header Geometric Logo & Brand
      ctx.fillStyle = '#1c3d5a'; // Deep blueprint navy
      ctx.font = '900 64px Plus Jakarta Sans, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('vai dá certo', width / 2, 170);

      // Subtitle
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 28px Plus Jakarta Sans, Arial, sans-serif';
      ctx.fillText('vaga de:', width / 2 - 240, 240);

      ctx.fillStyle = '#0f2942';
      ctx.font = '900 44px Plus Jakarta Sans, Arial, sans-serif';
      ctx.textAlign = 'left';
      
      // Wrap Title
      const wrapCenter = (text: string, x: number, y: number, maxW: number) => {
        const words = text.split(' ');
        let line = '';
        let currY = y;
        for (let i = 0; i < words.length; i++) {
          const test = line + words[i] + ' ';
          if (ctx.measureText(test).width > maxW && i > 0) {
            ctx.fillText(line.trim(), x, currY);
            line = words[i] + ' ';
            currY += 48;
          } else {
            line = test;
          }
        }
        ctx.fillText(line.trim(), x, currY);
        return currY + 50;
      };

      const titleY = wrapCenter(job.title, 340, 240, width - 380);

      // Section Dividers
      ctx.strokeStyle = '#cbb89e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, titleY);
      ctx.lineTo(width - 80, titleY);
      ctx.stroke();

      // Left Column (Details)
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 20px Plus Jakarta Sans, Arial, sans-serif';
      ctx.fillText('📅 PUBLICAÇÃO: ' + (job.postedAt || 'Recente'), 80, titleY + 40);
      ctx.fillText('📍 LOCAL: ' + job.location, 80, titleY + 75);
      ctx.fillText('💼 TIPO DE VAGA: ' + job.contractType + ' (' + job.workMode + ')', 80, titleY + 110);
      ctx.fillText('💰 REMUNERAÇÃO: ' + job.salary, 80, titleY + 145);

      // Right Column (Requisitos)
      ctx.font = '900 22px Plus Jakarta Sans, Arial, sans-serif';
      ctx.fillText('REQUISITOS NECESSÁRIOS:', 560, titleY + 40);
      ctx.font = '500 18px Plus Jakarta Sans, Arial, sans-serif';
      let reqY = titleY + 75;
      job.requirements.slice(0, 5).forEach((r) => {
        ctx.fillText('• ' + (r.length > 42 ? r.slice(0, 42) + '...' : r), 560, reqY);
        reqY += 32;
      });

      // Bottom Bar Application
      ctx.fillStyle = '#1b3854';
      ctx.fillRect(80, height - 200, width - 160, 120);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px Plus Jakarta Sans, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CANAL DE CANDIDATURA OFICIAL', width / 2, height - 155);

      ctx.font = '700 20px monospace';
      ctx.fillStyle = '#fde047';
      const contactText = job.contactEmail ? `E-mail: ${job.contactEmail}` : (job.applicationUrl || 'Acesse pelo portal');
      ctx.fillText(contactText.slice(0, 55), width / 2, height - 115);

      ctx.fillStyle = '#64748b';
      ctx.font = '700 18px Plus Jakarta Sans, Arial, sans-serif';
      ctx.fillText('Portal de Oportunidades & Conexões Profissionais', width / 2, height - 40);

      // Download
      const link = document.createElement('a');
      link.download = `banner-vaga-${job.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-200">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
            Banner Oficial de Divulgação
          </span>
          <span className="text-xs text-zinc-400 hidden md:inline">
            • Estilo editorial oficial com link e e-mail integrados
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadBannerImage}
            disabled={downloading}
            id="btn-download-flyer-png"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Gerando...' : 'Baixar Imagem (PNG)'}</span>
          </button>

          <button
            onClick={handleCopyFormattedMessage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 active:scale-95 transition-all"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>
      </div>

      {/* THE EDITORIAL BANNER (MATCHING THE USER'S PROVIDED IMAGE AESTHETIC) */}
      <div 
        ref={flyerRef}
        className="relative overflow-hidden rounded-3xl bg-[#f7f2e7] text-slate-900 border-4 border-[#dcd0bb] shadow-2xl p-6 sm:p-10 font-sans"
      >
        
        {/* Subtle Engineering Grid & Compass Blueprint Motif in the Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6 pt-2">
          
          {/* Compass / Handshake Icon Header */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#1c3d5a]/40 flex items-center justify-center bg-[#eae0cd]/50 shadow-inner">
              <span className="text-4xl">🤝</span>
            </div>
            <div className="absolute -top-1 -right-2 text-xs font-mono font-bold text-[#1c3d5a] bg-[#ded2bc] px-2 py-0.5 rounded border border-[#c4b59b]">
              AUDITADA
            </div>
          </div>

          {/* Logo "vai dá certo" Typography */}
          <div className="flex items-baseline gap-2 justify-center">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#1c3d5a] drop-shadow-sm font-sans">
              vai dá
            </h1>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#c6893f] drop-shadow-sm font-sans">
              certo
            </h1>
          </div>

          <div className="w-48 h-1 bg-[#1c3d5a]/20 mx-auto mt-2 rounded-full" />
        </div>

        {/* Vaga de: [Título Principal] */}
        <div className="mb-6 text-center sm:text-left bg-[#eee5d3] p-4 sm:p-5 rounded-2xl border border-[#d6c7ae]">
          <span className="text-base sm:text-xl font-bold text-slate-700 block">
            vaga de:
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0f2942] uppercase tracking-tight leading-tight mt-0.5">
            {job.title}
          </h2>
          <span className="text-xs sm:text-sm font-extrabold text-[#c6893f] block mt-1">
            Empresa: {job.company}
          </span>
        </div>

        {/* Date and Timeline Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 bg-[#eae0cc] p-3.5 rounded-xl border border-[#d3c2a6] text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1c3d5a] shrink-0" />
            <span><strong>DATA DE PUBLICAÇÃO:</strong> {job.postedAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span><strong>STATUS:</strong> Inscrições Abertas (Processo Ativo)</span>
          </div>
        </div>

        {/* 2-Column Core Information (matching user design flyer) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* Left Column: Principais Informações & Descrição */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Principais Informações */}
            <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#dfd4c0] shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1c3d5a] mb-2.5 flex items-center gap-1.5 border-b border-[#e2d7c5] pb-1.5">
                <MapPin className="w-4 h-4 text-[#c6893f]" />
                PRINCIPAIS INFORMAÇÕES
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-800">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-slate-950">📍 Local de trabalho:</span>
                  <span>{job.location}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-slate-950">📋 Tipo de vaga:</span>
                  <span>{job.contractType}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-slate-950">🏢 Modelo de Trabalho:</span>
                  <span className="px-2 py-0.5 rounded bg-[#eee5d3] font-black text-[#1c3d5a]">{job.workMode}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-slate-950">💰 Remuneração / Salário:</span>
                  <span className="font-black text-emerald-800">{job.salary}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-slate-950">🎓 Nível:</span>
                  <span>{job.experienceLevel}</span>
                </li>
              </ul>
            </div>

            {/* Descrição da Vaga e Propósito */}
            <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#dfd4c0] shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1c3d5a] mb-2 flex items-center gap-1.5 border-b border-[#e2d7c5] pb-1.5">
                <FileText className="w-4 h-4 text-[#c6893f]" />
                DESCRIÇÃO DA VAGA E PROPÓSITO
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {job.description}
              </p>
            </div>

          </div>

          {/* Right Column: Requisitos & Benefícios */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Requisitos Necessários */}
            <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#dfd4c0] shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1c3d5a] mb-2.5 flex items-center gap-1.5 border-b border-[#e2d7c5] pb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                REQUISITOS NECESSÁRIOS
              </h3>
              <ul className="space-y-2 text-xs text-slate-800">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-black text-[#c6893f] mt-0.5">•</span>
                    <span className="leading-snug">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Informações Adicionais (Benefícios) */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#dfd4c0] shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1c3d5a] mb-2 flex items-center gap-1.5 border-b border-[#e2d7c5] pb-1.5">
                  <Award className="w-4 h-4 text-[#c6893f]" />
                  INFORMAÇÕES ADICIONAIS (BENEFÍCIOS)
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-800">
                  {job.benefits.map((ben, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-black text-emerald-700 mt-0.5">✓</span>
                      <span>{ben}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

        </div>

        {/* Etapas do Processo Seletivo (Decorative Sequence) */}
        <div className="mb-6 p-4 rounded-2xl bg-[#ede3cf] border border-[#d6c7ae] text-xs">
          <h4 className="font-black uppercase tracking-wider text-[#1c3d5a] mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#c6893f]" />
            ETAPAS DO PROCESSO SELETIVO
          </h4>
          <p className="text-[11px] font-medium text-slate-700">
            1. Envio de Currículo / Inscrição → 2. Triagem de Perfil → 3. Entrevista RH & Gestor → 4. Avaliação Técnica → 5. Contratação
          </p>
        </div>

        {/* ========================================================= */}
        {/* EXPLICIT ACTIONABLE APPLICATION BOX (LINK OU EMAIL COPIÁVEL) */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-[#1c3d5a] text-white p-5 sm:p-7 shadow-xl border-2 border-[#132c42]">
          
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/15">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#e6b368] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#e6b368]" />
                CANAL OFICIAL DE CANDIDATURA
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Utilize o e-mail ou link oficial abaixo para enviar seu currículo diretamente:
              </p>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-emerald-500 text-slate-950 uppercase">
              Verificado
            </span>
          </div>

          <div className="space-y-3">
            
            {/* 1. SE TEM E-MAIL: MOSTRA E-MAIL COM STATUS ATIVO OU DESATIVADO */}
            {job.contactEmail && (
              <div className="p-4 rounded-2xl bg-[#102437] border border-[#2b5175] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                    job.applicationUrl ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-[#c6893f] text-slate-950'
                  }`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 block font-bold">
                        {job.applicationUrl ? 'E-mail do RH (Apenas Dúvidas):' : 'E-mail do RH para Envio de Currículo:'}
                      </span>
                      {job.applicationUrl && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Inscrição pelo Link do Site
                        </span>
                      )}
                    </div>
                    <span className="text-sm sm:text-base font-mono font-black text-amber-300 block truncate select-all">
                      {job.contactEmail}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {job.applicationUrl
                        ? '⚠️ Candidaturas desta vaga são aceitas exclusivamente pelo link oficial do site abaixo.'
                        : `Assunto sugerido: Candidatura ${job.title} - VAI DÁ CERTO`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleCopyEmail}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 transition-all"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#e6b368]" />}
                    <span>{copiedEmail ? 'E-mail Copiado!' : 'Copiar E-mail'}</span>
                  </button>

                  {job.applicationUrl ? (
                    <button
                      disabled
                      title="Esta vaga possui link de cadastro oficial. Envio de currículo por e-mail desativado."
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-zinc-800 text-zinc-400 border border-zinc-700/70 cursor-not-allowed opacity-60 shadow-none"
                    >
                      <Mail className="w-4 h-4 opacity-40" />
                      <span>E-mail Desativado (Use o Link)</span>
                    </button>
                  ) : (
                    <a
                      href={`mailto:${job.contactEmail}?subject=${encodeURIComponent(`Candidatura: ${job.title} - VAI DÁ CERTO`)}&body=${encodeURIComponent(`Olá equipe de RH da ${job.company},\n\nGostaria de me candidatar à vaga de ${job.title} divulgada no Portal VAI DÁ CERTO.\n\nEm anexo encaminho meu currículo atualizado.\n\nAtenciosamente,\n[Seu Nome]\n[Seu Telefone / WhatsApp]`)}`}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-[#c6893f] hover:bg-[#b57a32] text-slate-950 shadow-md active:scale-95 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Enviar E-mail</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 2. SE TEM LINK (GUPY, LINKEDIN OU SITE DA EMPRESA): LINK CLICÁVEL & COPIÁVEL */}
            {job.applicationUrl && (
              <div className="p-4 rounded-2xl bg-[#102437] border border-[#2b5175] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                    job.source === 'Talentbrand' ? 'bg-teal-600' : job.source === 'Gupy' ? 'bg-blue-600' : job.source === 'LinkedIn' ? 'bg-[#0A66C2]' : 'bg-[#c6893f] text-slate-950'
                  }`}>
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs text-slate-300 block font-bold">
                      {job.source === 'Talentbrand' ? 'Link Oficial no Portal Talentbrand (Servfaz):' : job.source === 'Gupy' ? 'Link Oficial da Vaga no Portal Gupy:' : job.source === 'LinkedIn' ? 'Link da Publicação no LinkedIn:' : 'Link Direto de Acesso / Inscrição:'}
                    </span>
                    <a
                      href={job.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs sm:text-sm font-mono font-bold text-amber-300 hover:text-white underline block truncate max-w-xs sm:max-w-md transition-colors"
                      title={job.applicationUrl}
                    >
                      {job.applicationUrl}
                    </a>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Clique para abrir diretamente a página de candidatura
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 transition-all"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#e6b368]" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                  </button>

                  <a
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white shadow-md active:scale-95 transition-all ${
                      job.source === 'Talentbrand'
                        ? 'bg-teal-600 hover:bg-teal-500'
                        : job.source === 'Gupy'
                        ? 'bg-blue-600 hover:bg-blue-500'
                        : job.source === 'LinkedIn'
                        ? 'bg-[#0A66C2] hover:bg-[#004182]'
                        : 'bg-[#c6893f] text-slate-950 hover:bg-[#b57a32]'
                    }`}
                  >
                    <span>{job.source === 'Talentbrand' ? 'Acessar no Talentbrand' : 'Acessar Vaga'}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* 3. SE TEM WHATSAPP DO RH */}
            {job.whatsapp && (
              <div className="p-4 rounded-2xl bg-[#102437] border border-[#2b5175] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-300 block font-bold">
                      WhatsApp Oficial do Recrutamento:
                    </span>
                    <span className="text-sm sm:text-base font-mono font-black text-emerald-300 block select-all">
                      {job.whatsapp}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${job.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi a vaga de ${job.title} (${job.company}) no Portal VAI DÁ CERTO e gostaria de me candidatar.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Conversar no WhatsApp</span>
                </a>
              </div>
            )}

          </div>

        </div>

        {/* Footer Brand Label (matching user graphic: "Portal de Oportunidades & Conexões Profissionais") */}
        <div className="mt-8 pt-4 border-t-2 border-[#d6c7ae] text-center">
          <p className="text-xs sm:text-sm font-black text-[#1c3d5a] tracking-wide uppercase">
            Portal de Oportunidades & Conexões Profissionais
          </p>
          <p className="text-[11px] font-bold text-[#c6893f] mt-0.5">
            ⭐ VAI DÁ CERTO • Teresina & Piauí
          </p>
        </div>

      </div>

    </div>
  );
};
