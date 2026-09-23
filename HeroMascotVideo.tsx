import React, { useRef, useEffect, useState } from 'react';
import { TATU_POSTER_DATA } from '../data/tatuPosterData';
import { TATU_GIF_DATA } from '../data/tatuGifData';
import { TATU_VIDEO_DATA } from '../data/tatuVideoData';

interface HeroMascotVideoProps {
  onScrollToJobs: () => void;
}

export const HeroMascotVideo: React.FC<HeroMascotVideoProps> = ({ onScrollToJobs }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.defaultMuted = true;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay fallback: toca no primeiro clique/touch
          const handleFirstClick = () => {
            video.play().catch(() => setVideoFailed(true));
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

        {/* Card do Mascote com Imagem/GIF/Vídeo 100% à prova de falhas em qualquer CDN/Vercel */}
        <div className="w-48 sm:w-56 md:w-64 aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-3 border-yellow-400/90 bg-[#1e1338] relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          {!videoFailed ? (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              preload="auto"
              poster={TATU_POSTER_DATA}
              onError={() => setVideoFailed(true)}
              className="w-full h-full object-cover block"
            >
              <source src={TATU_VIDEO_DATA} type="video/mp4" />
              <source src="/tatu-animado.mp4" type="video/mp4" />
              <source src="/TATU.mp4" type="video/mp4" />
              {/* Fallback de Imagem com Data URI embutido se a tag video falhar */}
              <img 
                src={TATU_GIF_DATA || TATU_POSTER_DATA} 
                alt="Mascote Tatu Vai Que Dá Certo" 
                className="w-full h-full object-cover block" 
              />
            </video>
          ) : (
            <img 
              src={TATU_GIF_DATA || TATU_POSTER_DATA} 
              alt="Mascote Tatu Vai Que Dá Certo" 
              className="w-full h-full object-cover block" 
            />
          )}

          {/* Badge flutuante interativa */}
          <div className="absolute bottom-2 inset-x-2 py-1 px-2 bg-slate-900/85 backdrop-blur-sm border border-yellow-400/60 rounded-xl text-center shadow-md">
            <span className="text-[10px] sm:text-xs font-black text-yellow-300 uppercase tracking-wider flex items-center justify-center gap-1">
              ✨ Mascote Oficial • Ver Vagas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
