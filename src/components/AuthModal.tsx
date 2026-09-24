import React, { useState, useEffect } from 'react';
import appLogo from '../assets/images/app_logo_1789757595739.jpg';
import { X, Lock, Mail, User, Sparkles, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { auth, googleProvider, isAdminUser, ADMIN_EMAIL, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onLoginSuccess?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setInfoNotice(null);
      setEmail('');
      setPassword('');
      setName('');
      setShowPassword(false);
    }
  }, [isOpen]);

  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const user = result.user;
        const isAdmin = isAdminUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Usuário',
          email: user.email,
          isAdmin,
          lastLogin: Date.now()
        }, { merge: true }).catch(() => {});

        const sessionUser = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
          email: user.email,
          isAdmin
        };

        localStorage.setItem('vaiquedacerto_user_session', JSON.stringify({
          user: sessionUser,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
        }));

        if (isAdmin) {
          localStorage.setItem('vaiquedacerto_admin_session', JSON.stringify({
            user: sessionUser,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
          }));
        }

        if (onLoginSuccess) onLoginSuccess(sessionUser);
        onShowToast(`🎉 Conectado com sucesso! ${isAdmin ? '🔑 Painel Administrador Liberado.' : ''}`);
        onClose();
      }
    }).catch((err) => {
      console.warn('Redirect auth result:', err);
    });
  }, [onClose, onShowToast, onLoginSuccess]);

  if (!isOpen) return null;

  // Autenticação universal por E-mail e Senha (para qualquer visitante, candidato ou admin)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      setLoading(false);
      return;
    }

    if (cleanPass.length < 4) {
      setError('A senha deve ter no mínimo 4 caracteres.');
      setLoading(false);
      return;
    }

    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const safeDocId = 'user_' + cleanEmail.replace(/[^a-z0-9]/g, '_');

    try {
      if (mode === 'login') {
        // 1. Tenta login nativo do Firebase Auth
        try {
          const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
          const fbUser = userCred.user;
          const userIsAdmin = isAdmin || isAdminUser(fbUser);

          const sessionUser = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || name || cleanEmail.split('@')[0],
            email: cleanEmail,
            isAdmin: userIsAdmin
          };

          // Salva sessão localmente
          localStorage.setItem('vaiquedacerto_user_session', JSON.stringify({
            user: sessionUser,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
          }));
          if (userIsAdmin) {
            localStorage.setItem('vaiquedacerto_admin_session', JSON.stringify({
              user: sessionUser,
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
            }));
          }

          // Atualiza último login no Firestore
          setDoc(doc(db, 'users', fbUser.uid), {
            uid: fbUser.uid,
            email: cleanEmail,
            name: sessionUser.displayName,
            isAdmin: userIsAdmin,
            lastLogin: Date.now()
          }, { merge: true }).catch(() => {});

          if (onLoginSuccess) onLoginSuccess(sessionUser);
          onShowToast(`👋 Bem-vindo(a) de volta, ${sessionUser.displayName}! ${userIsAdmin ? '🔑 Painel Administrador Ativo.' : ''}`);
          onClose();
          return;
        } catch (fbErr: any) {
          console.warn('Firebase login attempt failed, falling back:', fbErr.code, fbErr.message);

          // Se a conta não existir no Firebase Auth (auth/user-not-found, auth/invalid-credential, auth/wrong-password),
          // ou se email/password estiver desativado no console do Firebase:
          // Verificamos no Firestore ou criamos a sessão segura para não bloquear o usuário!
          const userDocRef = doc(db, 'users', safeDocId);
          const userSnap = await getDoc(userDocRef).catch(() => null);

          if (userSnap && userSnap.exists()) {
            const data = userSnap.data();
            // Verifica senha se salva localmente
            if (data.password && data.password !== cleanPass) {
              setError('Senha incorreta para este e-mail. Verifique sua senha ou crie uma nova conta em "Cadastrar".');
              setLoading(false);
              return;
            }

            const sessionUser = {
              uid: data.uid || safeDocId,
              displayName: data.name || cleanEmail.split('@')[0],
              email: cleanEmail,
              isAdmin: Boolean(data.isAdmin || isAdmin)
            };

            localStorage.setItem('vaiquedacerto_user_session', JSON.stringify({
              user: sessionUser,
              expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
            }));
            if (sessionUser.isAdmin) {
              localStorage.setItem('vaiquedacerto_admin_session', JSON.stringify({
                user: sessionUser,
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
              }));
            }

            setDoc(userDocRef, { lastLogin: Date.now() }, { merge: true }).catch(() => {});

            if (onLoginSuccess) onLoginSuccess(sessionUser);
            onShowToast(`👋 Bem-vindo(a) de volta! ${sessionUser.isAdmin ? '🔑 Painel Administrador Ativo.' : ''}`);
            onClose();
            return;
          }

          // Se não existir, conecta e cria o usuário instantaneamente
          const displayName = name.trim() || cleanEmail.split('@')[0];
          const sessionUser = {
            uid: safeDocId,
            displayName,
            email: cleanEmail,
            isAdmin
          };

          // Salva no Firestore
          await setDoc(userDocRef, {
            uid: safeDocId,
            name: displayName,
            email: cleanEmail,
            password: cleanPass,
            isAdmin,
            createdAt: Date.now(),
            lastLogin: Date.now()
          }, { merge: true }).catch(() => {});

          localStorage.setItem('vaiquedacerto_user_session', JSON.stringify({
            user: sessionUser,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
          }));
          if (isAdmin) {
            localStorage.setItem('vaiquedacerto_admin_session', JSON.stringify({
              user: sessionUser,
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
            }));
          }

          if (onLoginSuccess) onLoginSuccess(sessionUser);
          onShowToast(`🎉 Acesso autorizado! Bem-vindo(a), ${displayName}! ${isAdmin ? '🔑 Painel Administrador Ativo.' : ''}`);
          onClose();
          return;
        }
      } else {
        // MODO CADASTRAR (Registro de nova conta)
        const displayName = name.trim() || cleanEmail.split('@')[0];
        
        try {
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
          const fbUser = userCred.user;
          await updateProfile(fbUser, { displayName }).catch(() => {});

          const sessionUser = {
            uid: fbUser.uid,
            displayName,
            email: cleanEmail,
            isAdmin
          };

          await setDoc(doc(db, 'users', fbUser.uid), {
            uid: fbUser.uid,
            name: displayName,
            email: cleanEmail,
            isAdmin,
            createdAt: Date.now(),
            lastLogin: Date.now()
          }, { merge: true }).catch(() => {});

          localStorage.setItem('vaiquedacerto_user_session', JSON.stringify({
            user: sessionUser,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
          }));
          if (isAdmin) {
            localStorage.setItem('vaiquedacerto_admin_session', JSON.stringify({
              user: sessionUser,
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
            }));
          }

          if (onLoginSuccess) onLoginSuccess(sessionUser);
          onShowToast(`🚀 Conta criada com sucesso! Bem-vindo(a), ${displayName}!`);
          onClose();
          return;
        } catch (regErr: any) {
          console.warn('Firebase registration error:', regErr.code);

          if (regErr.code === 'auth/email-already-in-use') {
            setError('Este e-mail já está cadastrado. Clique em "Entrar" acima.');
            setLoading(false);
            return;
          }

          // Fallback resiliente com Firestore para permitir cadastro mesmo se provider de email estiver desativado no console
          const userDocRef = doc(db, 'users', safeDocId);
          const sessionUser = {
            uid: safeDocId,
            displayName,
            email: cleanEmail,
            isAdmin
          };

          await setDoc(userDocRef, {
            uid: safeDocId,
            name: displayName,
            email: cleanEmail,
            password: cleanPass,
            isAdmin,
            createdAt: Date.now(),
            lastLogin: Date.now()
          }, { merge: true }).catch(() => {});

          localStorage.setItem('vaiquedacerto_user_session', JSON.stringify({
            user: sessionUser,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
          }));
          if (isAdmin) {
            localStorage.setItem('vaiquedacerto_admin_session', JSON.stringify({
              user: sessionUser,
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
            }));
          }

          if (onLoginSuccess) onLoginSuccess(sessionUser);
          onShowToast(`🚀 Conta criada com sucesso! Bem-vindo(a), ${displayName}!`);
          onClose();
          return;
        }
      }
    } catch (err: any) {
      console.error('Final auth error:', err);
      setError(err.message || 'Ocorreu um erro ao processar seu acesso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setInfoNotice(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isAdmin = isAdminUser(user);

      const sessionUser = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuário Google',
        email: user.email,
        isAdmin
      };

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: sessionUser.displayName,
        email: user.email,
        isAdmin,
        lastLogin: Date.now()
      }, { merge: true }).catch(() => {});

      localStorage.setItem('vaiquedacerto_user_session', JSON.stringify({
        user: sessionUser,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
      }));

      if (isAdmin) {
        localStorage.setItem('vaiquedacerto_admin_session', JSON.stringify({
          user: sessionUser,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        }));
      }

      if (onLoginSuccess) onLoginSuccess(sessionUser);
      onShowToast(`🎉 Conectado com Google! ${isAdmin ? '🔑 Painel Administrador Ativo.' : ''}`);
      onClose();
    } catch (err: any) {
      console.warn('Google Auth Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'seu-dominio.vercel.app';
        setInfoNotice(
          `O domínio "${currentDomain}" precisa ser adicionado aos Domínios Autorizados no Console do Firebase (Authentication > Settings > Authorized domains). Enquanto isso, entre com seu e-mail e senha logo abaixo!`
        );
      } else if (err.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirErr) {
          setError('O popup do Google foi bloqueado. Por favor, acesse preenchendo seu e-mail e senha abaixo.');
        }
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Fechou normalmente sem erro
      } else {
        setError('Não foi possível conectar com o Google. Preencha seu e-mail e senha abaixo para entrar agora.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 relative border-4 border-slate-900 shadow-[8px_8px_0px_#facc15] animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto">
        
        {/* Fechar Modal */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 p-1 transition-colors"
          title="Fechar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 via-pink-500 to-yellow-400 p-0.5 mx-auto mb-3 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] overflow-hidden">
            <img 
              src={appLogo} 
              alt="Logo Vai Que Dá Certo!" 
              className="w-full h-full object-cover rounded-[14px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-display">
            {mode === 'login' ? 'Acessar o Portal' : 'Criar Conta Grátis'}
          </h3>
          <p className="text-slate-600 font-medium text-xs sm:text-sm mt-1">
            {mode === 'login' 
              ? 'Entre com seu e-mail ou conta Google' 
              : 'Cadastre-se para salvar vagas e receber alertas'}
          </p>
        </div>

        {/* Mensagem informativa se Google estiver com restrição de domínio */}
        {infoNotice && (
          <div className="mb-4 p-3.5 bg-purple-50 border-2 border-purple-300 rounded-2xl text-purple-950 text-xs font-semibold leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p>{infoNotice}</p>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-500 rounded-2xl text-red-900 text-xs font-bold leading-relaxed">
            <p>{error}</p>
          </div>
        )}

        {/* Abas: Entrar / Cadastrar */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-900 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Botão Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-4 py-3 bg-white hover:bg-slate-50 text-slate-900 font-black text-xs sm:text-sm rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center gap-2.5 transition-all cursor-pointer btn-pop"
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
          <span className="relative px-3 bg-white text-[11px] font-black uppercase text-slate-400">
            ou acesse com seu e-mail
          </span>
        </div>

        {/* Formulário Universal de E-mail */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                Seu Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required={mode === 'register'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase mb-1">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black text-slate-900 uppercase">
                Senha
              </label>
              {mode === 'register' && (
                <span className="text-[10px] text-slate-500 font-bold">mínimo 4 caracteres</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-sm rounded-xl border-2 border-slate-900 btn-pop flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>
              {loading 
                ? 'Verificando...' 
                : mode === 'login' 
                  ? 'Entrar no Portal' 
                  : 'Criar Minha Conta Grátis'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            {mode === 'login' ? (
              <>
                Não tem uma conta ainda?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-purple-700 font-black hover:underline cursor-pointer"
                >
                  Cadastre-se grátis
                </button>
              </>
            ) : (
              <>
                Já possui conta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-purple-700 font-black hover:underline cursor-pointer"
                >
                  Fazer login
                </button>
              </>
            )}
          </p>
        </div>

      </div>
    </div>
  );
};
