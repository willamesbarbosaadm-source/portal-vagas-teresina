import React, { useRef, useEffect, useState } from 'react';
import armadilloCalling from '../assets/images/armadillo_calling_1790169038271.jpg';
import armadilloClean from '../assets/images/armadillo_transparent_clean_1790170398950.jpg';

interface FloatingMascotProps {
  onClick?: () => void;
}

export const FloatingMascot: React.FC<FloatingMascotProps> = ({ onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageSrc, setImageSrc] = useState(armadilloCalling);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    video.defaultMuted = true;
    video.muted = true;
    
    video.play()
      .then(() => setIsVideoPlaying(true))
      .catch(() => {
        // Autoplay bloqueado: imagem estática permanece visível
      });
  }, [videoError]);

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
      onClick={onClick}
      title="Vagas abertas hoje! Clique para ver."
    >
      {/* Brilho pulsante suave ao redor */}
      <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-2xl pointer-events-none group-hover:bg-yellow-400/50 transition-colors" />

      <div className="w-36 sm:w-40 aspect-square rounded-2xl shadow-2xl border-2 border-yellow-400/90 bg-[#1e1338] relative overflow-hidden flex items-center justify-center">
        {/* Camada 1: Imagem estática sempre visível */}
        <img 
          src={imageSrc} 
          alt="Mascote Tatu" 
          className="w-full h-full object-cover rounded-2xl block"
          loading="eager"
          onError={() => {
            if (imageSrc !== armadilloClean) setImageSrc(armadilloClean);
          }}
        />

        {/* Camada 2: Vídeo progressivo sobreposto somente se tocar */}
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className={`absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none transition-opacity duration-500 ${
              isVideoPlaying ? 'opacity-100' : 'opacity-0'
            }`}
            onPlaying={() => setIsVideoPlaying(true)}
            onError={() => {
              setIsVideoPlaying(false);
              setVideoError(true);
            }}
          >
            <source src="/tatu-animado.mp4" type="video/mp4" onError={() => setVideoError(true)} />
            <source src="/TATU.mp4" type="video/mp4" />
            <source src="/tatu.mp4" type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
};
