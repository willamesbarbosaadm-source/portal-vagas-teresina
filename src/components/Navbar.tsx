import React, { useState } from 'react';
import appLogo from '../assets/images/app_logo_1789757595739.jpg';
import { 
  Sparkles, 
  Building2, 
  HelpCircle, 
  HeartHandshake, 
  Bookmark, 
  PlusCircle, 
  Share2, 
  Menu, 
  X, 
  LogIn,
  Search
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'jobs' | 'gratitude' | 'saved';
  setActiveTab: (tab: 'jobs' | 'gratitude' | 'saved') => void;
  jobsCount: number;
  savedCount: number;
  gratitudeCount: number;
  isAutoUpdating: boolean;
  currentUser: any;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenAdminDashboard: () => void;
  onOpenPostJob: () => void;
  onOpenShareModal: () => void;
  onOpenGratitudeModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  jobsCount,
  savedCount,
  gratitudeCount,
  isAutoUpdating,
  currentUser,
  isAdmin,
  onLogout,
  onOpenAdminDashboard,
  onOpenPostJob,
  onOpenShareModal,
  onOpenGratitudeModal,
  onOpenAuthModal,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tab?: 'jobs' | 'gratitude' | 'saved', anchor?: string) => {
    setIsMobileMenuOpen(false);
    if (tab) {
      setActiveTab(tab);
    }
    if (anchor) {
      setTimeout(() => {
        const el = document.querySelector(anchor);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-slate-900 bg-white/95 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('jobs')} 
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-700 via-pink-500 to-yellow-400 p-0.5 shadow-md group-hover:scale-105 transition-transform border-2 border-slate-900 overflow-hidden">
              <img 
                src={appLogo} 
                alt="Logo Vai Que Dá Certo!" 
                className="w-full h-full object-cover rounded-[14px]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                Vai Que{' '}
                <span className="bg-gradient-to-r from-purple-700 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                  Dá Certo!
                </span>
              </span>
              <p className="text-[10px] font-extrabold text-purple-700 tracking-wider uppercase flex items-center gap-1 whitespace-nowrap">
                <span>Empregos & Recrutamento</span>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-slate-700">
            <button 
              onClick={() => handleNavClick('jobs', '#vagas')}
              className={`hover:text-purple-700 transition-colors flex items-center gap-1.5 py-1 ${
                activeTab === 'jobs' ? 'text-purple-700 font-black' : ''
              }`}
            >
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>Buscar Vagas</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 font-black text-slate-800">
                {jobsCount}
              </span>
            </button>

            <a 
              href="#para-empresas" 
              onClick={() => {
                if (activeTab !== 'jobs') setActiveTab('jobs');
              }}
              className="hover:text-purple-700 transition-colors flex items-center gap-1.5 py-1"
            >
              <Building2 className="w-4 h-4 text-purple-700" />
              <span>Para Empresas</span>
            </a>

            <a 
              href="#como-funciona" 
              onClick={() => {
                if (activeTab !== 'jobs') setActiveTab('jobs');
              }}
              className="hover:text-purple-700 transition-colors flex items-center gap-1.5 py-1"
            >
              <span>Como Funciona</span>
            </a>

            <button 
              onClick={() => handleNavClick('gratitude', '#depoimentos')}
              className={`hover:text-purple-700 transition-colors flex items-center gap-1.5 py-1 ${
                activeTab === 'gratitude' ? 'text-purple-700 font-black' : ''
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-pink-500" />
              <span>Depoimentos & Gratidão</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 border border-pink-300 font-black text-pink-700">
                {gratitudeCount} 🎉
              </span>
            </button>

            <button 
              onClick={() => handleNavClick('saved')}
              className={`hover:text-purple-700 transition-colors flex items-center gap-1.5 py-1 ${
                activeTab === 'saved' ? 'text-purple-700 font-black' : ''
              }`}
            >
              <Bookmark className={`w-4 h-4 ${savedCount > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
              <span>Salvas</span>
              {savedCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 font-black text-yellow-900">
                  {savedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Actions on Top Right */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border-2 border-slate-900">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white font-black text-xs flex items-center justify-center">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-slate-900 truncate max-w-[120px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={onOpenAdminDashboard}
                      className="inline-block text-[9px] px-2 py-0.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded font-black uppercase tracking-wider border border-slate-900 transition-all btn-pop"
                      title="Abrir Painel Administrativo de Acessos"
                    >
                      🔑 Painel Admin
                    </button>
                  )}
                </div>
                <button
                  onClick={onLogout}
                  title="Sair"
                  className="ml-2 text-xs font-bold text-red-600 hover:text-red-800 p-1"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuthModal}
                className="px-4 py-2 text-sm font-black text-slate-800 hover:text-purple-700 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-purple-700" />
                <span>Entrar</span>
              </button>
            )}

            <button 
              id="btn-post-job"
              onClick={onOpenPostJob}
              className="px-4 sm:px-5 py-2.5 text-sm font-black text-slate-900 bg-yellow-400 hover:bg-yellow-300 rounded-xl border-2 border-slate-900 btn-pop flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Anunciar Vaga</span>
            </button>

            <button
              onClick={onOpenShareModal}
              title="Divulgar Portal"
              className="p-2.5 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <Share2 className="w-4 h-4 text-pink-500" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onOpenPostJob}
              className="sm:hidden px-3 py-1.5 text-xs font-black text-slate-900 bg-yellow-400 rounded-xl border-2 border-slate-900 btn-pop flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Anunciar</span>
            </button>

            <button 
              id="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-900 border-2 border-slate-900 bg-yellow-400"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-slate-900 bg-white px-5 py-6 space-y-4 shadow-xl">
          <button 
            onClick={() => handleNavClick('jobs', '#vagas')}
            className="w-full text-left font-black text-slate-800 text-base flex items-center justify-between py-2 border-b border-slate-100"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" /> Buscar Vagas
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold">{jobsCount}</span>
          </button>

          <a 
            href="#para-empresas" 
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (activeTab !== 'jobs') setActiveTab('jobs');
            }}
            className="block font-black text-slate-800 text-base py-2 border-b border-slate-100 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-purple-700" /> Para Empresas
          </a>

          <a 
            href="#como-funciona" 
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (activeTab !== 'jobs') setActiveTab('jobs');
            }}
            className="block font-black text-slate-800 text-base py-2 border-b border-slate-100"
          >
            💡 Como Funciona
          </a>

          <button 
            onClick={() => handleNavClick('gratitude', '#depoimentos')}
            className="w-full text-left font-black text-slate-800 text-base flex items-center justify-between py-2 border-b border-slate-100"
          >
            <span className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-pink-500" /> Mural de Gratidão
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">{gratitudeCount} 🎉</span>
          </button>

          <button 
            onClick={() => handleNavClick('saved')}
            className="w-full text-left font-black text-slate-800 text-base flex items-center justify-between py-2 border-b border-slate-100"
          >
            <span className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-yellow-500" /> Vagas Salvas
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-900 font-bold">{savedCount}</span>
          </button>

          <div className="pt-2 flex flex-col gap-3">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAuthModal();
              }}
              className="w-full py-3 font-black text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border-2 border-slate-900 text-sm"
            >
              Entrar na Conta
            </button>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenPostJob();
              }}
              className="w-full py-3 font-black text-slate-900 bg-yellow-400 hover:bg-yellow-300 rounded-xl border-2 border-slate-900 btn-pop text-sm flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Anunciar Vaga Grátis</span>
            </button>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenShareModal();
              }}
              className="w-full py-2.5 font-bold text-slate-600 hover:text-slate-900 text-xs text-center flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4 text-pink-500" />
              <span>Compartilhar Portal Vai Que Dá Certo</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
