import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { BibleCrossIcon } from '../ui/BibleCrossIcon';
import { Mail, Lock, User, Users, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [groupAffiliation, setGroupAffiliation] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [authAlert, setAuthAlert] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setErrors({});
    setAuthAlert(null);
    setForgotSuccess(false);
    setIsLoading(false);
  };

  const handleSwitchMode = (newMode: 'signin' | 'register' | 'forgot') => {
    setMode(newMode);
    resetForm();
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthAlert(null);
    const newErrors: { [key: string]: string } = {};

    if (mode === 'signin') {
      if (!email.trim()) newErrors.email = 'Please enter your email address.';
      else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email.';

      if (!password) newErrors.password = 'Please enter your password.';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsLoading(true);
      const success = await login(email, password);
      setIsLoading(false);
      if (success) {
        onClose();
      } else {
        setAuthAlert('Sign in was unsuccessful. If you just registered, make sure "Confirm email" is turned off in Supabase, or check your password.');
      }
    } else if (mode === 'register') {
      if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
      if (!email.trim()) newErrors.email = 'Email address is required.';
      else if (!validateEmail(email)) newErrors.email = 'Please provide a valid email format.';

      if (!password) newErrors.password = 'Password is required.';
      else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';

      if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
      if (!agreeTerms) newErrors.agreeTerms = 'Please agree to the community guidelines.';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsLoading(true);
      const success = await register(fullName, email, password, groupAffiliation || undefined);
      setIsLoading(false);
      if (success) {
        onClose();
      } else {
        setAuthAlert('Notice: If you see "email rate limit exceeded", turn OFF "Confirm email" in your Supabase Dashboard under Authentication -> Providers -> Email for instant player sign-up without email limits.');
      }
    } else if (mode === 'forgot') {
      if (!email.trim() || !validateEmail(email)) {
        setErrors({ email: 'Please enter a valid email address.' });
        return;
      }
      setIsLoading(true);
      const success = await resetPassword(email);
      setIsLoading(false);
      if (success) {
        setForgotSuccess(true);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-[#14213D]">
          <div className="p-1.5 rounded-lg bg-[#EAF1FA] text-[#234E91]">
            <BibleCrossIcon className="w-5 h-5" />
          </div>
          <span>
            {mode === 'signin' && 'Member Sign In'}
            {mode === 'register' && 'Join BibleArena Fellowship'}
            {mode === 'forgot' && 'Reset Your Password'}
          </span>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {authAlert && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900">Notice</p>
              <p className="text-amber-800 leading-relaxed">{authAlert}</p>
            </div>
          </div>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-[#64748B]">
              Welcome back! Sign in to track your personal Scripture scores, save drafts, and join fellowship competitions.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">Church Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. emmanuel@church.org"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-200' : 'border-[#CBD5E1] focus:ring-[#234E91]/20'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#1E293B]">Password</label>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('forgot')}
                  className="text-xs text-[#234E91] hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    errors.password ? 'border-red-500 focus:ring-red-200' : 'border-[#CBD5E1] focus:ring-[#234E91]/20'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In to BibleArena'}
            </Button>

            <div className="pt-2 text-center text-xs text-[#64748B] border-t border-[#F1F5F9]">
              Don’t have an account yet?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className="text-[#234E91] font-bold hover:underline cursor-pointer"
              >
                Create Member Account
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <p className="text-xs text-[#64748B]">
              Register to participate in live competitions, host your own arenas, track your spiritual growth, and earn scripture badges.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Grace Mwangi"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-[#CBD5E1] focus:ring-[#234E91]/20'
                  }`}
                />
              </div>
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-200' : 'border-[#CBD5E1] focus:ring-[#234E91]/20'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">Group, Church, or Community (Optional)</label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="text"
                  value={groupAffiliation}
                  onChange={(e) => setGroupAffiliation(e.target.value)}
                  placeholder="e.g. Grace Fellowship, Smith Family, Youth Study Group"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#CBD5E1] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#234E91]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    errors.password ? 'border-red-500 focus:ring-red-200' : 'border-[#CBD5E1] focus:ring-[#234E91]/20'
                  }`}
                />
                {errors.password && <p className="text-[11px] text-red-600 mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-[#CBD5E1] focus:ring-[#234E91]/20'
                  }`}
                />
                {errors.confirmPassword && <p className="text-[11px] text-red-600 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded text-[#234E91] focus:ring-[#234E91]"
              />
              <label htmlFor="agreeTerms" className="text-xs text-[#64748B] leading-tight cursor-pointer">
                I agree to uphold an encouraging, respectful Christian community in BibleArena.
              </label>
            </div>
            {errors.agreeTerms && <p className="text-xs text-red-600">{errors.agreeTerms}</p>}

            <Button type="submit" variant="primary" fullWidth size="md" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </Button>

            <div className="pt-2 text-center text-xs text-[#64748B] border-t border-[#F1F5F9]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('signin')}
                className="text-[#234E91] font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <div className="space-y-4">
            {forgotSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#14213D]">Password Reset Link Sent!</h4>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                  We have sent instructions to <strong>{email}</strong>. Check your inbox and follow the link to create a new password.
                </p>
                <Button variant="secondary" size="md" onClick={() => handleSwitchMode('signin')}>
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-[#64748B]">
                  Enter your registered email address. We will send a secure password reset link to your inbox.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-[#1E293B] mb-1">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                        errors.email ? 'border-red-500 focus:ring-red-200' : 'border-[#CBD5E1] focus:ring-[#234E91]/20'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <Button type="submit" variant="primary" fullWidth size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Send Reset Link
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signin')}
                    className="text-xs text-[#234E91] font-semibold hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="pt-2 text-center border-t border-[#F1F5F9]">
          <p className="text-[11px] text-[#94A3B8]">
            Phase 1 Preview: Profiles are saved locally in your browser. Central cloud authentication connects in Phase 2.
          </p>
        </div>
      </div>
    </Modal>
  );
};
