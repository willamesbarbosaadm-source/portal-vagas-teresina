import React, { useRef, useEffect, useState } from 'react';
import armadilloCalling from '../assets/images/armadillo_calling_1790169038271.jpg';
import armadilloClean from '../assets/images/armadillo_transparent_clean_1790170398950.jpg';

interface HeroMascotVideoProps {
  onScrollToJobs: () => void;
}

export const HeroMascotVideo: React.FC<HeroMascotVideoProps> = ({ onScrollToJobs }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageSrc, setImageSrc] = useState(armadilloCalling);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    let isMounted = true;

    // Autoplay silencioso obrigatório para navegadores modernos
    video.muted = true;
    video.defaultMuted = true;

    const handlePlaying = () => {
      if (isMounted) {
        setIsVideoPlaying(true);
      }
    };

    const handleError = () => {
      if (isMounted) {
        setIsVideoPlaying(false);
        setVideoError(true);
      }
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (isMounted) setIsVideoPlaying(true);
        })
        .catch(() => {
          // Autoplay foi bloqueado pelo navegador: a imagem estática continuará visível normalmente.
          // Tenta reproduzir na primeira interação do usuário sem travar ou deixar vazio.
          const handleFirstInteraction = () => {
            if (video && !videoError) {
              video.play().catch(() => {});
            }
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
          };
          window.addEventListener('click', handleFirstInteraction, { once: true });
          window.addEventListener('touchstart', handleFirstInteraction, { once: true });
        });
    }

    return () => {
      isMounted = false;
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
    };
  }, [videoError]);

  return (
    <div 
      onClick={onScrollToJobs}
      className="flex items-center justify-center lg:justify-end cursor-pointer select-none group transition-transform active:scale-95"
      title="Clique para ver as vagas de hoje!"
    >
      <div className="relative shrink-0">
        {/* Efeito Glow Dourado e Roxo em volta */}
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/40 via-purple-600/30 to-amber-300/40 blur-2xl rounded-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

        {/* Card do Mascote Oficial - Visibilidade Imediata e Confiável */}
        <div className="w-48 sm:w-56 md:w-64 aspect-square rounded-3xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.4)] border-3 border-yellow-400 bg-gradient-to-b from-[#2b124c] to-[#120726] relative flex items-center justify-center group-hover:scale-105 transition-all duration-300">
          
          {/* 1. CAMADA PRINCIPAL: Imagem estática do Tatu SEMPRE visível imediatamente */}
          <img 
            src={imageSrc} 
            alt="Mascote Tatu do Vai Que Dá Certo" 
            className="w-full h-full object-cover block select-none pointer-events-none"
            loading="eager"
            onError={() => {
              // Se por algum motivo o primeiro arquivo falhar, utiliza a imagem alternativa limpa
              if (imageSrc !== armadilloClean) {
                setImageSrc(armadilloClean);
              }
            }}
          />

          {/* 2. CAMADA DE VÍDEO (OPCIONAL): Só é exibida após confirmação real de reprodução */}
          {!videoError && (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              preload="metadata"
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${
                isVideoPlaying ? 'opacity-100' : 'opacity-0'
              }`}
              onPlaying={() => setIsVideoPlaying(true)}
              onError={() => {
                setIsVideoPlaying(false);
                setVideoError(true);
              }}
            >
              <source src="/MASCOTE%2002.mp4" type="video/mp4" onError={() => setVideoError(true)} />
            </video>
          )}

          {/* Badge flutuante interativa */}
          <div className="absolute bottom-2 inset-x-2 py-1.5 px-2.5 bg-slate-950/90 backdrop-blur-md border border-yellow-400/80 rounded-2xl text-center shadow-lg z-10">
            <span className="text-[10px] sm:text-xs font-black text-yellow-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>🐾 Mascote Oficial</span>
              <span className="text-white">•</span>
              <span className="text-white">Ver Vagas</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
