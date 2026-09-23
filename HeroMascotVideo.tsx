import React, { useRef, useEffect } from 'react';
import { TATU_VIDEO_DATA } from '../data/tatuVideoData';

interface HeroMascotVideoProps {
  onScrollToJobs: () => void;
}

export const HeroMascotVideo: React.FC<HeroMascotVideoProps> = ({ onScrollToJobs }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.defaultMuted = true;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay fallback: tenta tocar quando o usuário interagir
          const handleFirstClick = () => {
            video.play().catch(() => {});
            window.removeEventListener('click', handleFirstClick);
            window.removeEventListener('touchstart', handleFirstClick);
          };
          window.addEventListener('click', handleFirstClick);
          window.addEventListener('touchstart', handleFirstClick);
        });
      }
    }
  }, []);

  return (
    <div 
      onClick={onScrollToJobs}
      className="flex items-center justify-center lg:justify-end cursor-pointer select-none group transition-transform active:scale-95"
      title="Clique para ver as vagas de hoje!"
    >
      <div className="relative shrink-0">
        {/* Efeito Glow Dourado em volta */}
        <div className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-2xl pointer-events-none group-hover:bg-yellow-400/50 transition-colors" />

        {/* Tag de Vídeo com suporte a Data URI embutido (à prova de falhas em qualquer CDN/Vercel) e fallback para arquivo direto */}
        <div className="w-48 sm:w-56 md:w-64 aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-3 border-yellow-400/90 bg-[#1e1338] relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            preload="auto"
            poster="/tatu-poster.jpg"
            className="w-full h-full object-cover block"
          >
            <source src={TATU_VIDEO_DATA} type="video/mp4" />
            <source src="/TATU.mp4" type="video/mp4" />
            <source src="/tatu-animado.mp4" type="video/mp4" />
            {/* Fallback de imagem caso o navegador desative reprodução de vídeo */}
            <img 
              src="/tatu-poster.jpg" 
              alt="Mascote Tatu Vai Que Dá Certo" 
              className="w-full h-full object-cover" 
            />
          </video>
        </div>
      </div>
    </div>
  );
};
