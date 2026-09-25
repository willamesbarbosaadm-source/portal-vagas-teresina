import React, { useState, useEffect } from 'react';
import appLogo from '../assets/images/app_logo_1789757595739.jpg';
import { X, Lock, Mail, User, Sparkles, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { supabaseAuth, isSupabaseConfigured } from '../services/auth';

export type AuthModalMode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onLoginSuccess?: (user: any) => void;
  initialMode?: AuthModalMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMessage(null);
    } else {
      setError(null);
      setSuccessMessage(null);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setLoading(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured) {
      setError('Serviço de autenticação Supabase não está configurado.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanConfirmPass = confirmPassword.trim();
    const cleanName = name.trim();

    // 1. FLUXO: CRIAR CONTA (REGISTER)
    if (mode === 'register') {
      if (!cleanName) {
        setError('Por favor, informe seu nome completo.');
        return;
      }
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setError('Por favor, informe um endereço de e-mail válido.');
        return;
      }
      if (cleanPass.length < 6) {
        setError('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (cleanPass !== cleanConfirmPass) {
        setError('A confirmação de senha não confere com a senha informada.');
        return;
      }

      setLoading(true);
      try {
        const authUser = await supabaseAuth.signUp({
          name: cleanName,
          email: cleanEmail,
          password: cleanPass
        });

        if (onLoginSuccess) onLoginSuccess(authUser);
        onShowToast(`🚀 Conta criada com sucesso! Bem-vindo(a), ${authUser.displayName || cleanName}!`);
        onClose();
      } catch (err: any) {
        console.error('Supabase SignUp error:', err);
        let msg = err.message || 'Erro ao criar conta. Tente novamente.';
        if (msg.includes('User already registered') || msg.includes('already registered')) {
          msg = 'Este e-mail já está cadastrado. Clique em "Fazer login" para entrar ou recupere sua senha.';
        } else if (msg.includes('Password should be at least')) {
          msg = 'A senha deve conter no mínimo 6 caracteres.';
        } else if (msg.includes('valid email')) {
          msg = 'Por favor, informe um e-mail válido.';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. FLUXO: ENTRAR (LOGIN)
    if (mode === 'login') {
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setError('Por favor, informe seu endereço de e-mail.');
        return;
      }
      if (!cleanPass) {
        setError('Por favor, informe sua senha.');
        return;
      }

      setLoading(true);
      try {
        const authUser = await supabaseAuth.signIn({
          email: cleanEmail,
          password: cleanPass
        });

        if (onLoginSuccess) onLoginSuccess(authUser);
        const isAdmin = authUser.isAdmin;
        onShowToast(`👋 Bem-vindo(a) de volta, ${authUser.displayName || cleanEmail.split('@')[0]}! ${isAdmin ? '🔑 Painel Admin Ativo.' : ''}`);
        onClose();
      } catch (err: any) {
        console.error('Supabase SignIn error:', err);
        let msg = err.message || 'Erro ao realizar login. Tente novamente.';
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          msg = 'E-mail ou senha incorretos. Verifique seus dados ou crie uma conta em "Cadastre-se grátis".';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Por favor, confirme seu e-mail através do link enviado no momento do cadastro.';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. FLUXO: RECUPERAR SENHA (FORGOT)
    if (mode === 'forgot') {
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setError('Por favor, informe o e-mail da sua conta para receber o link de recuperação.');
        return;
      }

      setLoading(true);
      try {
        await supabaseAuth.resetPassword(cleanEmail);
        setSuccessMessage(`Enviamos um link de recuperação para ${cleanEmail}. Verifique sua caixa de entrada e spam para redefinir sua senha.`);
        onShowToast(`📧 Link de recuperação enviado para ${cleanEmail}!`);
      } catch (err: any) {
        console.error('Supabase ResetPassword error:', err);
        let msg = err.message || 'Erro ao enviar e-mail de recuperação.';
        if (msg.includes('rate limit')) {
          msg = 'Muitas tentativas recentes. Por favor, aguarde alguns minutos antes de tentar novamente.';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 4. FLUXO: REDEFINIR SENHA (RESET)
    if (mode === 'reset') {
      if (cleanPass.length < 6) {
        setError('A nova senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (cleanPass !== cleanConfirmPass) {
        setError('A confirmação da nova senha não confere.');
        return;
      }

      setLoading(true);
      try {
        await supabaseAuth.updatePassword(cleanPass);
        setSuccessMessage('Sua senha foi redefinida com sucesso! Você já pode entrar com sua nova senha.');
        onShowToast('✅ Senha redefinida com sucesso!');
        setPassword('');
        setConfirmPassword('');
        setMode('login');
      } catch (err: any) {
        console.error('Supabase UpdatePassword error:', err);
        setError(err.message || 'Erro ao redefinir senha. O link pode ter expirado.');
      } finally {
        setLoading(false);
      }
      return;
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
            {mode === 'login' && 'Entrar na Conta'}
            {mode === 'register' && 'Criar Conta Grátis'}
            {mode === 'forgot' && 'Recuperar Senha'}
            {mode === 'reset' && 'Redefinir Senha'}
          </h3>
          <p className="text-slate-600 font-medium text-xs sm:text-sm mt-1">
            {mode === 'login' && 'Entre com seu e-mail e senha cadastrados'}
            {mode === 'register' && 'Cadastre-se para se candidatar e salvar vagas'}
            {mode === 'forgot' && 'Informe seu e-mail para receber as instruções de recuperação'}
            {mode === 'reset' && 'Digite sua nova senha de acesso'}
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-500 rounded-2xl text-red-900 text-xs font-bold leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Mensagem de Sucesso */}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-green-50 border-2 border-green-600 rounded-2xl text-green-900 text-xs font-bold leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Abas: Entrar / Cadastrar (apenas visíveis em login e register) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-900 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
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
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Formulário Supabase Auth */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Campo: Nome Completo (Apenas Cadastro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Maria dos Santos"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          )}

          {/* Campo: E-mail (Login, Register e Forgot) */}
          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                Endereço de E-mail *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          )}

          {/* Campo: Senha (Login, Register e Reset) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-slate-900 uppercase">
                  {mode === 'reset' ? 'Nova Senha *' : 'Senha *'}
                </label>
                {(mode === 'register' || mode === 'reset') && (
                  <span className="text-[10px] text-slate-500 font-bold">mínimo 6 caracteres</span>
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
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Campo: Confirmar Senha (Register e Reset) */}
          {(mode === 'register' || mode === 'reset') && (
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-1">
                {mode === 'reset' ? 'Confirmar Nova Senha *' : 'Confirmar Senha *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Link: Esqueci Minha Senha (Apenas Login) */}
          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {/* Botão de Ação */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-sm rounded-xl border-2 border-slate-900 btn-pop flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer shadow-[3px_3px_0px_#0f172a]"
          >
            {loading ? (
              <span>Processando...</span>
            ) : (
              <>
                {mode === 'login' && (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>Entrar no Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
                {mode === 'register' && (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>Criar Minha Conta Grátis</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
                {mode === 'forgot' && (
                  <>
                    <KeyRound className="w-4 h-4 text-yellow-400" />
                    <span>Enviar Link de Recuperação</span>
                  </>
                )}
                {mode === 'reset' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Salvar Nova Senha</span>
                  </>
                )}
              </>
            )}
          </button>
        </form>

        {/* Links de Rodapé */}
        <div className="mt-5 text-center pt-3 border-t border-slate-200">
          {mode === 'login' && (
            <p className="text-xs text-slate-600 font-medium">
              Não tem uma conta ainda?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-purple-700 font-black hover:underline cursor-pointer"
              >
                Criar uma conta
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p className="text-xs text-slate-600 font-medium">
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-purple-700 font-black hover:underline cursor-pointer"
              >
                Fazer login
              </button>
            </p>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para o login</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
