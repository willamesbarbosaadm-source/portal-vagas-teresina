import React, { useState } from 'react';
import { X, Send, FileUp, Sparkles, Phone, Mail, User, Globe, CheckCircle } from 'lucide-react';
import { Job } from '../types';

interface QuickApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const QuickApplyModal: React.FC<QuickApplyModalProps> = ({
  job,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidatePortfolio, setCandidatePortfolio] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !job) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      onShowToast(`🚀 Vai Que Dá Certo! Sua candidatura para "${job.title}" na ${job.company} foi enviada direto para o RH!`);
      // Reset
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePhone('');
      setCandidatePortfolio('');
      setFileName(null);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 relative border-4 border-slate-900 shadow-[8px_8px_0px_#ec4899] animate-in fade-in zoom-in-95 duration-150 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 p-1 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-black px-3 py-1 bg-purple-700 text-white rounded-xl border-2 border-slate-900 badge-fun">
              {job.workMode}
            </span>
            <span className="text-xs font-black px-3 py-1 bg-yellow-400 text-slate-900 rounded-xl border-2 border-slate-900 badge-fun">
              ⭐ Selo VAI DÁ CERTO
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-display leading-tight">
            {job.title}
          </h3>
          <p className="text-slate-600 font-bold text-sm mt-0.5">
            {job.company} • {job.location}
          </p>
          <div className="mt-2 text-xs font-extrabold text-pink-600">
            💰 {job.salary} • {job.contractType}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase mb-1">
              Seu Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Ex: Gabriel Santos"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                Seu E-mail *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="gabriel@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  placeholder="(86) 99999-8888"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase mb-1">
              LinkedIn ou Portfólio (Opcional)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="url"
                value={candidatePortfolio}
                onChange={(e) => setCandidatePortfolio(e.target.value)}
                placeholder="https://linkedin.com/in/perfil"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase mb-1">
              Anexar Currículo (PDF)
            </label>
            <label className="relative border-2 border-dashed border-slate-900 rounded-2xl p-4 text-center bg-slate-50 hover:bg-pink-50 cursor-pointer transition-colors block">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileUp className="w-7 h-7 text-pink-500 mx-auto mb-1" />
              {fileName ? (
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{fileName} selecionado</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-700">
                    Clique para selecionar seu currículo em PDF
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Até 5MB</p>
                </>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-black text-base rounded-xl border-2 border-slate-900 btn-pop flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <span>Enviando candidatura...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span>🚀 Confirmar e Enviar Candidatura!</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
