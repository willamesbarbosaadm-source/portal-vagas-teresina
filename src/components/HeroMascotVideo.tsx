import React, { useRef, useEffect, useState } from 'react';
import armadilloPoster from '../assets/images/armadillo_transparent_clean_1790170398950.jpg';

interface HeroMascotVideoProps {
  onScrollToJobs: () => void;
}

const MASCOT_VIDEO = 'https://raw.githubusercontent.com/willamesbarbosaadm-source/portal-vagas-teresina/main/tatu-animado.mp4';

export const HeroMascotVideo: React.FC<HeroMascotVideoProps> = ({ onScrollToJobs }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const onReady = () => {
      setVideoReady(true);
      video.play().catch(() => {});
    };

    video.addEventListener('canplay', onReady);
    video.load();

    return () => video.removeEventListener('canplay', onReady);
  }, []);

  return (
    <div
      onClick={onScrollToJobs}
      className="flex items-center justify-center lg:justify-end cursor-pointer select-none group transition-transform active:scale-95"
      title="Clique para ver as vagas de hoje!"
    >
      <div className="relative shrink-0 w-48 sm:w-56 md:w-64 max-h-[420px]">
        <div className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-2xl pointer-events-none group-hover:bg-yellow-400/50 transition-colors" />

        {/* A imagem fica SEMPRE visível. Assim o mascote aparece mesmo se o MP4 do GitHub falhar. */}
        <img
          src={armadilloPoster}
          alt="Mascote Tatu do Vai Que Dá Certo"
          className="relative z-10 w-full h-auto max-h-[420px] object-contain rounded-2xl shadow-2xl border-2 sm:border-3 border-yellow-400/90 bg-[#1e1338] block group-hover:scale-105 transition-transform duration-300"
        />

        {videoReady && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute inset-0 z-20 w-full h-full object-contain rounded-2xl pointer-events-none"
          >
            <source src={MASCOT_VIDEO} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
};
