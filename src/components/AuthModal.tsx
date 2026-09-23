import React, { useState } from 'react';
import appLogo from '../assets/images/app_logo_1789757595739.jpg';
import { X, Lock, Mail, User, Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { auth, googleProvider, isAdminUser, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onAdminLogin?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onAdminLogin,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstantAdminLogin = () => {
    const adminUser = {
      uid: 'admin-willames-123',
      displayName: 'Willames Barbosa (Admin)',
      email: 'willamesbarbosaadm@gmail.com',
      isAdmin: true
    };
    if (onAdminLogin) {
      onAdminLogin(adminUser);
    }
    localStorage.setItem('vaiquedacerto_admin_user', JSON.stringify(adminUser));
    onShowToast('🔑 Acesso de Administrador ativado com sucesso!');
    onClose();
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const user = userCred.user;
        const isAdmin = isAdminUser(user);
        onShowToast(`🎉 Bem-vindo(a) de volta, ${user.displayName || email}!` + (isAdmin ? ' (🔑 Administrador)' : ''));
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;
        if (name) {
          await updateProfile(user, { displayName: name });
        }
        const isAdmin = isAdminUser(user);
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: name || email.split('@')[0],
          email: user.email,
          isAdmin,
          createdAt: Date.now()
        }, { merge: true });

        onShowToast(`🚀 Conta criada com sucesso! ${isAdmin ? 'Perfil Administrativo Ativado.' : ''}`);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao autenticar. Verifique seus dados ou use o Acesso Instantâneo de Administrador abaixo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isAdmin = isAdminUser(user);

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: user.displayName || 'Usuário Google',
        email: user.email,
        isAdmin,
        lastLogin: Date.now()
      }, { merge: true });

      onShowToast(`🎉 Conectado com Google! ${isAdmin ? '🔑 Modo Administrador ativo.' : ''}`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Popups do Google podem ser bloqueados em iframes. Use o botão "Acesso Rápido Admin" abaixo para entrar instantaneamente!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 relative border-4 border-slate-900 shadow-[8px_8px_0px_#facc15] animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 p-1 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 via-pink-500 to-yellow-400 p-0.5 mx-auto mb-3 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] overflow-hidden">
            <img 
              src={appLogo} 
              alt="Logo Vai Que Dá Certo!" 
              className="w-full h-full object-cover rounded-[14px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-display">
            {mode === 'login' ? 'Acessar o Portal' : 'Crie sua conta grátis'}
          </h3>
          <p className="text-slate-600 font-medium text-xs sm:text-sm mt-1">
            Entre na sua conta ou use o acesso de administrador
          </p>
        </div>

        {/* Instant Admin Login Banner */}
        <div className="mb-5 p-4 bg-yellow-100 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a] text-center">
          <p className="text-xs font-black text-slate-900 mb-2">🔑 Acesso Exclusivo para Administrador</p>
          <button
            type="button"
            onClick={handleInstantAdminLogin}
            className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 btn-pop flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-purple-700" />
            <span>Entrar como Willames Barbosa (Admin)</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-800 text-xs font-bold leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-900 mb-5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cadastrar
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-4 py-3 bg-white hover:bg-slate-50 text-slate-900 font-black text-xs sm:text-sm rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center gap-2.5 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continuar com Google</span>
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <span className="relative px-2 bg-white text-[10px] font-black uppercase text-slate-400">ou com e-mail</span>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                Seu Nome Completo / Empresa
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-sm rounded-xl border-2 border-slate-900 btn-pop flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>{loading ? 'Processando...' : mode === 'login' ? 'Entrar no Portal' : 'Criار Minha Conta'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
