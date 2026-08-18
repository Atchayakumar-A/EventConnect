import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Calendar, ArrowRight, UserPlus, LogIn, User, Mail, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AuthPage = ({ onComplete }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        if (name.length < 2) throw new Error('Please enter your full name');
        await signup(name, email, password, role);
      } else {
        await login(email, password);
      }
      onComplete();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = async (type) => {
    setError('');
    setLoading(true);
    try {
      if (type === 'attendee') {
        await login('attendee@eventconnect.com', 'password123');
      } else {
        await login('organizer@eventconnect.com', 'password123');
      }
      onComplete();
    } catch (err) {
      setError('Demo login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans selection:bg-[#5F8670]/20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#5F8670] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#3A7CA5] blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {/* Brand Logo */}
        <div className="mb-8 text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-[22px] bg-white border border-[#E6E4DC] shadow-calm-sm">
            <div className="w-12 h-12 rounded-[16px] bg-[#5F8670] text-white flex items-center justify-center shadow-inner">
              <Calendar className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1A202C]">
            Event<span className="text-[#5F8670]">Connect</span>
          </h1>
          <p className="text-sm text-[#718096] font-medium max-w-[240px] mx-auto leading-relaxed">
            {isSignup
              ? 'Join the community and discover amazing experiences.'
              : 'Welcome back! Your next adventure awaits.'}
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-[400px] bg-white rounded-[32px] border border-[#E6E4DC] shadow-calm-xl overflow-hidden">

          {/* Custom Tabs */}
          <div className="flex p-2 bg-[#F4F3ED] m-4 rounded-[24px]">
            <button
              onClick={() => setIsSignup(false)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-[18px] text-[13px] font-bold transition-all duration-300 ${
                !isSignup
                  ? 'bg-white text-[#1A202C] shadow-sm ring-1 ring-black/5'
                  : 'text-[#718096] hover:text-[#4A5568]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-[18px] text-[13px] font-bold transition-all duration-300 ${
                isSignup
                  ? 'bg-white text-[#1A202C] shadow-sm ring-1 ring-black/5'
                  : 'text-[#718096] hover:text-[#4A5568]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
          </div>

          <div className="px-8 pb-8 pt-2 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in zoom-in duration-300">
                <p className="text-[12px] text-red-600 font-semibold text-center flex items-center justify-center">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#4A5568] ml-1 uppercase tracking-wider">Full Name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#5F8670] transition-colors">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#5F8670]/20 focus:border-[#5F8670] outline-none bg-[#F8FAFC] transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#4A5568] ml-1 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#5F8670] transition-colors">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#5F8670]/20 focus:border-[#5F8670] outline-none bg-[#F8FAFC] transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#4A5568] ml-1 uppercase tracking-wider flex justify-between">
                  <span>Password</span>
                  {!isSignup && <button type="button" className="text-[#5F8670] hover:underline normal-case">Forgot?</button>}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#5F8670] transition-colors">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#5F8670]/20 focus:border-[#5F8670] outline-none bg-[#F8FAFC] transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {isSignup && (
                <div className="space-y-2 pt-2">
                  <label className="text-[12px] font-bold text-[#4A5568] ml-1 uppercase tracking-wider block">I am an:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('attendee')}
                      className={`relative flex flex-col items-center p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                        role === 'attendee'
                          ? 'border-[#5F8670] bg-[#E8EFEA] text-[#2D3748]'
                          : 'border-[#EDF2F7] bg-white text-[#718096] hover:border-[#CBD5E0]'
                      }`}
                    >
                      <User className={`w-5 h-5 mb-1 ${role === 'attendee' ? 'text-[#5F8670]' : ''}`} />
                      <span className="text-[11px] font-bold uppercase tracking-tight">Attendee</span>
                      {role === 'attendee' && <CheckCircle2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-[#5F8670]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('organizer')}
                      className={`relative flex flex-col items-center p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                        role === 'organizer'
                          ? 'border-[#3A7CA5] bg-[#E8F2F8] text-[#2D3748]'
                          : 'border-[#EDF2F7] bg-white text-[#718096] hover:border-[#CBD5E0]'
                      }`}
                    >
                      <ShieldCheck className={`w-5 h-5 mb-1 ${role === 'organizer' ? 'text-[#3A7CA5]' : ''}`} />
                      <span className="text-[11px] font-bold uppercase tracking-tight">Organizer</span>
                      {role === 'organizer' && <CheckCircle2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-[#3A7CA5]" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5F8670] hover:bg-[#486856] disabled:bg-[#A0AEC0] text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-[#5F8670]/20 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-3 mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignup ? 'Create Free Account' : 'Sign In to Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E6E4DC]"></div>
              </div>
              <span className="relative px-4 bg-white text-[10px] font-bold text-[#A0AEC0] uppercase tracking-widest">Or try a demo</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fillDemo('attendee')}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[11px] font-bold text-[#4A5568] hover:bg-[#F7FAFC] transition-colors"
              >
                <span>Attendee</span>
              </button>
              <button
                onClick={() => fillDemo('organizer')}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[11px] font-bold text-[#4A5568] hover:bg-[#F7FAFC] transition-colors"
              >
                <span>Organizer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-[11px] text-[#A0AEC0] font-medium text-center max-w-[280px]">
          By continuing, you agree to EventConnect's <span className="text-[#718096] underline">Terms of Service</span> and <span className="text-[#718096] underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};
