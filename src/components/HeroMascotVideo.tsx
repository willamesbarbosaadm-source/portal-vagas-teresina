import React, { useRef, useEffect } from 'react';
import armadilloPoster from '../assets/images/armadillo_transparent_clean_1790170398950.jpg';

interface HeroMascotVideoProps {
  onScrollToJobs: () => void;
}

const MASCOT_VIDEO = 'https://raw.githubusercontent.com/willamesbarbosaadm-source/portal-vagas-teresina/main/tatu-animado.mp4';

export const HeroMascotVideo: React.FC<HeroMascotVideoProps> = ({ onScrollToJobs }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;

    const play = () => {
      video.play().catch(() => {
        // Alguns navegadores bloqueiam autoplay; o poster continua visível.
      });
    };

    video.addEventListener('canplay', play);
    play();

    return () => video.removeEventListener('canplay', play);
  }, []);

  return (
    <div
      onClick={onScrollToJobs}
      className="flex items-center justify-center lg:justify-end cursor-pointer select-none group transition-transform active:scale-95"
      title="Clique para ver as vagas de hoje!"
    >
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-2xl pointer-events-none group-hover:bg-yellow-400/50 transition-colors" />

        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={armadilloPoster}
          className="w-48 sm:w-56 md:w-64 h-auto max-h-[420px] rounded-2xl shadow-2xl border-2 sm:border-3 border-yellow-400/90 bg-[#1e1338] relative block object-contain group-hover:scale-105 transition-transform duration-300"
        >
          <source src={MASCOT_VIDEO} type="video/mp4" />
          <img
            src={armadilloPoster}
            alt="Mascote Tatu do Vai Que Dá Certo"
            className="w-full h-full object-contain rounded-2xl"
          />
        </video>

        {/* Fallback visual independente do carregamento do vídeo */}
        <img
          src={armadilloPoster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain rounded-2xl pointer-events-none opacity-0"
        />
      </div>
    </div>
  );
};
