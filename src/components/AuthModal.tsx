import React, { useEffect, useState } from 'react';
import appLogo from '../assets/images/app_logo_1789757595739.jpg';
import { X, Lock, Mail, User, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { auth, googleProvider, isAdminUser } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, updateProfile, User as FirebaseUser } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onLoginSuccess?: (user: FirebaseUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onShowToast, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setEmail('');
      setPassword('');
      setName('');
      setShowPassword(false);
    }
  }, [isOpen]);

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        onLoginSuccess?.(result.user);
        onShowToast('🎉 Conectado com Google!');
        onClose();
      }
    }).catch((err: any) => {
      if (err?.code && err.code !== 'auth/no-auth-event') console.warn('Redirect auth result:', err);
    });
  }, [onClose, onShowToast, onLoginSuccess]);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      setLoading(false);
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        onLoginSuccess?.(credential.user);
        onShowToast('👋 Login realizado com sucesso!');
      } else {
        const displayName = name.trim() || cleanEmail.split('@')[0];
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(credential.user, { displayName });
        onLoginSuccess?.(credential.user);
        onShowToast('🎉 Conta criada com sucesso!');
      }
      onClose();
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/user-not-found': 'E-mail ou senha incorretos.',
        'auth/wrong-password': 'E-mail ou senha incorretos.',
        'auth/email-already-in-use': 'Este e-mail já está cadastrado. Clique em "Entrar".',
        'auth/weak-password': 'A senha deve ter no mínimo 6 caracteres.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'auth/invalid-email': 'Informe um e-mail válido.'
      };
      setError(messages[err?.code] || 'Não foi possível autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLoginSuccess?.(result.user);
      onShowToast('🎉 Conectado com Google!');
      onClose();
    } catch (err: any) {
      console.warn('Google Auth Error:', err);
      if (err?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          setError('Não foi possível abrir o login do Google.');
        }
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('Este domínio ainda não está autorizado no Firebase Authentication.');
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Não foi possível conectar com o Google. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 relative border-4 border-slate-900 shadow-[8px_8px_0px_#facc15] max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 p-1" title="Fechar"><X className="w-6 h-6" /></button>
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 via-pink-500 to-yellow-400 p-0.5 mx-auto mb-3 border-2 border-slate-900 overflow-hidden">
            <img src={appLogo} alt="Logo Vai Que Dá Certo!" className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{mode === 'login' ? 'Acessar o Portal' : 'Criar Conta Grátis'}</h3>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">{mode === 'login' ? 'Entre com seu e-mail ou conta Google' : 'Cadastre-se para salvar vagas e receber alertas'}</p>
        </div>
        {error && <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-500 rounded-2xl text-red-900 text-xs font-bold">{error}</div>}
        <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-900 mb-4">
          <button type="button" onClick={() => { setMode('login'); setError(null); }} className={`flex-1 py-2 text-xs font-black rounded-xl ${mode === 'login' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Entrar</button>
          <button type="button" onClick={() => { setMode('register'); setError(null); }} className={`flex-1 py-2 text-xs font-black rounded-xl ${mode === 'register' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Cadastrar</button>
        </div>
        <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full mb-4 py-3 bg-white text-slate-900 font-black text-xs sm:text-sm rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center gap-2.5 disabled:opacity-50">
          <span>🔵</span><span>Continuar com Google</span>
        </button>
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <span className="relative px-3 bg-white text-[11px] font-black uppercase text-slate-400">ou acesse com seu e-mail</span>
        </div>
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'register' && <div><label className="block text-xs font-black text-slate-900 uppercase mb-1">Seu Nome Completo</label><div className="relative"><User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" /><input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João da Silva" className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold" /></div></div>}
          <div><label className="block text-xs font-black text-slate-900 uppercase mb-1">Endereço de E-mail</label><div className="relative"><Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@gmail.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold" /></div></div>
          <div><label className="block text-xs font-black text-slate-900 uppercase mb-1">Senha</label><div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" /><input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-purple-700 text-white font-black text-sm rounded-xl border-2 border-slate-900 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"><Sparkles className="w-4 h-4 text-yellow-400" /><span>{loading ? 'Verificando...' : mode === 'login' ? 'Entrar no Portal' : 'Criar Minha Conta Grátis'}</span><ArrowRight className="w-4 h-4" /></button>
        </form>
        <div className="mt-4 text-center"><p className="text-[11px] text-slate-500 font-medium">{mode === 'login' ? <>Não tem uma conta ainda? <button type="button" onClick={() => setMode('register')} className="text-purple-700 font-black">Cadastre-se grátis</button></> : <>Já possui conta? <button type="button" onClick={() => setMode('login')} className="text-purple-700 font-black">Fazer login</button></>}</p></div>
      </div>
    </div>
  );
};
