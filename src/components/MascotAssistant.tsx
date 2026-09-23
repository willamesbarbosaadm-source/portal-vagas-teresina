import React from 'react';
import armadilloImg from '../assets/images/armadillo_transparent_clean_1790170398950.jpg';

interface HeroMascotProps {
  onScrollToJobs: () => void;
}

export const MascotAssistant: React.FC<HeroMascotProps> = ({ onScrollToJobs }) => {
  return (
    <div 
      onClick={onScrollToJobs}
      className="flex items-center justify-center lg:justify-end cursor-pointer select-none group transition-transform active:scale-95 relative"
      title="Clique para ver as vagas de hoje!"
    >
      {/* Brilho quente suave e dourado sob o mascote */}
      <div className="absolute inset-0 -bottom-4 bg-gradient-to-t from-yellow-500/25 via-purple-500/20 to-transparent blur-3xl rounded-full scale-125 pointer-events-none group-hover:from-yellow-400/40 transition-all duration-500" />

      {/* Mascote LIVRE sem borda, sem quadrado e sem caixa */}
      <div className="relative shrink-0 flex items-center justify-center">
        <div className="w-56 h-56 sm:w-68 sm:h-68 md:w-80 md:h-80 lg:w-96 lg:h-96 xl:w-[410px] xl:h-[410px] relative flex items-center justify-center animate-character-life mix-blend-lighten">
          <img
            src={armadilloImg}
            alt="Tatu mascote do Vai Que Dá Certo chamando com a mão"
            className="w-full h-full object-contain filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </div>
  );
};
