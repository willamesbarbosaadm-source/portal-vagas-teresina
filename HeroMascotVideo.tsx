import React, { useRef, useEffect } from 'react';

interface HeroMascotVideoProps {
  onScrollToJobs: () => void;
}

export const HeroMascotVideo: React.FC<HeroMascotVideoProps> = ({ onScrollToJobs }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div 
      onClick={onScrollToJobs}
      className="flex items-center justify-center lg:justify-end cursor-pointer select-none group transition-transform active:scale-95"
      title="Clique para ver as vagas de hoje!"
    >
      <div className="relative shrink-0">
        {/* Brilho pulsante suave ao redor do vídeo */}
        <div className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-2xl pointer-events-none group-hover:bg-yellow-400/50 transition-colors" />

        {/* Vídeo do Mascote exatamente com o estilo, borda amarela e formato solicitado */}
        <video
          ref={videoRef}
          src="/TATU.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-48 sm:w-56 md:w-64 h-auto rounded-2xl shadow-2xl border-2 sm:border-3 border-yellow-400/90 bg-[#1e1338] relative block object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    </div>
  );
};
