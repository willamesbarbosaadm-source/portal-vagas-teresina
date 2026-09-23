import React, { useRef, useEffect } from 'react';

interface FloatingMascotProps {
  onClick?: () => void;
}

export const FloatingMascot: React.FC<FloatingMascotProps> = ({ onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Garante que o vídeo inicie automaticamente e sem som de forma fluida (60fps)
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback silencioso
      });
    }
  }, []);

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
      onClick={onClick}
      title="Vagas abertas hoje! Clique para ver."
    >
      {/* Brilho pulsante suave ao redor do vídeo */}
      <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-2xl pointer-events-none group-hover:bg-yellow-400/50 transition-colors" />

      {/* Tag de vídeo MP4 contínuo e ultra fluido a 60fps */}
      <video
        ref={videoRef}
        src="/TATU.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-40 h-auto rounded-xl shadow-lg border-2 border-yellow-400/80 bg-[#1e1338] relative block object-cover"
      />
    </div>
  );
};
