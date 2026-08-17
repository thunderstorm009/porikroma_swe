import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import LogoIcon from '../components/LogoIcon';
import ThemeToggle from '../components/ThemeToggle';
import { supabase } from '../services/supabase';
export default function AuthPage({ onNavigate, initialTab = 'login', theme, onToggleTheme }) {
  const [authTab, setAuthTab] = useState(initialTab);
  const shouldReduceMotion = useReducedMotion();

  // Form states
  const [loginFields, setLoginFields] = useState({ email: '', password: '' });
  const [loginTouched, setLoginTouched] = useState({ email: false, password: false });
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [signupFields, setSignupFields] = useState({ name: '', email: '', password: '', confirmPassword: '', requested_role: 'Traveler' });
  const [signupTouched, setSignupTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearForm = () => {
    setLoginFields({ email: '', password: '' });
    setLoginTouched({ email: false, password: false });
    setLoginSuccess(false);
    setShowPassword(false);

    setSignupFields({ name: '', email: '', password: '', confirmPassword: '', requested_role: 'Traveler' });
    setSignupTouched({ name: false, email: false, password: false, confirmPassword: false });
    setSignupSuccess(false);
    setShowConfirmPassword(false);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginBlur = (e) => {
    const { name } = e.target;
    setLoginTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupBlur = (e) => {
    const { name } = e.target;
    setSignupTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Validation Checkers
  const getLoginErrors = () => {
    const errors = {};
    if (!loginFields.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginFields.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!loginFields.password) {
      errors.password = "Password is required";
    } else if (loginFields.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    return errors;
  };

  const getSignupErrors = () => {
    const errors = {};
    if (!signupFields.name.trim()) {
      errors.name = "Full name is required";
    }
    if (!signupFields.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupFields.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!signupFields.password) {
      errors.password = "Password is required";
    } else if (signupFields.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (!signupFields.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (signupFields.confirmPassword !== signupFields.password) {
      errors.confirmPassword = "Passwords do not match";
    }
    return errors;
  };

  const loginErrors = getLoginErrors();
  const signupErrors = getSignupErrors();

  const [loginErrorMsg, setLoginErrorMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginTouched({ email: true, password: true });
    setLoginErrorMsg('');
    
    if (Object.keys(loginErrors).length === 0) {
      setLoginSubmitting(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginFields.email,
        password: loginFields.password
      });

      if (error) {
        setLoginSubmitting(false);
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setLoginErrorMsg('Please confirm your email before logging in.');
        } else {
          setLoginErrorMsg(error.message);
        }
        return;
      }

      setLoginSuccess(true);
      // Wait a moment for AuthContext state to settle before navigating
      setTimeout(() => {
        setLoginSuccess(false);
        setLoginSubmitting(false);
        clearForm();
        onNavigate('dashboard');
      }, 500);
    }
  };

  const [signupErrorMsg, setSignupErrorMsg] = useState('');

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupTouched({ name: true, email: true, password: true, confirmPassword: true });
    setSignupErrorMsg('');

    if (Object.keys(signupErrors).length === 0) {
      setSignupSubmitting(true);

      const { data, error } = await supabase.auth.signUp({
        email: signupFields.email,
        password: signupFields.password,
        options: {
          data: {
            full_name: signupFields.name,
            requested_role: signupFields.requested_role === 'Travel Planner' ? 'provider' : 'user'
          }
        }
      });

      if (error) {
        setSignupSubmitting(false);
        setSignupErrorMsg(error.message);
        return;
      }

      setSignupSuccess(true);
      
      // If a session exists, email confirmation is disabled and the user is logged in
      if (data.session) {
        setTimeout(() => {
          setSignupSuccess(false);
          setSignupSubmitting(false);
          clearForm();
          onNavigate('dashboard');
        }, 1500);
      } else {
        // Otherwise, email confirmation is required
        setTimeout(() => {
          setSignupSuccess(false);
          setSignupSubmitting(false);
          clearForm();
          setAuthTab('login');
          setLoginErrorMsg('Account created. Please confirm your email before logging in.');
        }, 2500);
      }
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white relative">
      
      {/* Close button to return home */}
      <button
        onClick={() => { clearForm(); onNavigate('landing'); }} 
        className="absolute top-6 right-6 p-2 text-navy/60 hover:text-navy rounded-full hover:bg-fog focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary z-50 transition-colors"
        aria-label="Back to home"
      >
        <X size={20} />
      </button>
      {theme && <div className="absolute top-6 right-16 z-50"><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>}

      {/* Left Panel */}
      <div className="lg:col-span-5 bg-fog px-8 py-16 sm:px-12 lg:py-24 flex flex-col justify-between min-h-[320px] lg:min-h-screen">
        <button 
          onClick={() => { clearForm(); onNavigate('landing'); }} 
          className="flex items-center gap-2.5 font-serif text-2xl font-semibold tracking-tight text-navy rounded focus-visible:outline-2 focus-visible:outline-teal-primary self-start hover:opacity-85 transition-opacity"
        >
          <LogoIcon />
          <span><span className="text-teal-primary font-bold">P</span>orikroma</span>
        </button>

        <div className="space-y-10 my-auto py-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-navy leading-tight max-w-md">
            Travel is a series of decisions. Make them in one place.
          </h2>
          
          <div className="relative pl-8 space-y-12 border-l border-dashed border-border-custom max-w-sm" aria-hidden="true">
            <div className="relative">
              <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-teal-primary flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-primary"></div>
              </div>
              <h3 className="font-serif text-base font-semibold text-navy leading-none">Map</h3>
              <p className="text-xs text-navy/60 mt-1.5">Organize your travel corridors and schedules.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-border-custom flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-border-custom"></div>
              </div>
              <h3 className="font-serif text-base font-semibold text-navy leading-none">Invite</h3>
              <p className="text-xs text-navy/60 mt-1.5">Coordinate dates with friends or match solo.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-border-custom flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-border-custom"></div>
              </div>
              <h3 className="font-serif text-base font-semibold text-navy leading-none">Settle</h3>
              <p className="text-xs text-navy/60 mt-1.5">Track and split expenses on a shared ledger.</p>
            </div>
          </div>
        </div>

        <div className="font-mono text-[9px] uppercase tracking-widest text-navy/40">
          Porikroma Navigation System 2.0
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-7 bg-white flex items-center justify-center px-6 py-16 lg:py-24 min-h-[500px]">
        <div className="w-full max-w-[400px] flex flex-col space-y-6">
          
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white border border-border-custom rounded-xl p-6 sm:p-8 shadow-none w-full"
          >
            {/* Tabs */}
            <div className="flex border-b border-border-custom mb-8 relative">
              <button 
                onClick={() => { setAuthTab('login'); clearForm(); }}
                className={`flex-1 pb-3 text-sm font-semibold tracking-wide text-center relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded transition-colors ${authTab === 'login' ? 'text-teal-primary' : 'text-navy/60 hover:text-navy'}`}
              >
                Log in
                {authTab === 'login' && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-primary"
                    transition={{ duration: 0.25 }}
                  />
                )}
              </button>
              <button 
                onClick={() => { setAuthTab('signup'); clearForm(); }}
                className={`flex-1 pb-3 text-sm font-semibold tracking-wide text-center relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded transition-colors ${authTab === 'signup' ? 'text-teal-primary' : 'text-navy/60 hover:text-navy'}`}
              >
                Sign up
                {authTab === 'signup' && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-primary"
                    transition={{ duration: 0.25 }}
                  />
                )}
              </button>
            </div>

            {/* Simulated Status */}
            {loginSuccess && (
              <div className="mb-6 p-3 bg-teal-primary/10 border border-teal-primary/20 text-teal-primary text-sm rounded-lg text-center font-medium flex items-center justify-center gap-2">
                <Check size={16} /> Login successful. Entering workspace...
              </div>
            )}
            {loginErrorMsg && authTab === 'login' && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center font-medium flex items-center justify-center gap-2">
                <X size={16} /> {loginErrorMsg}
              </div>
            )}
            {signupSuccess && (
              <div className="mb-6 p-3 bg-teal-primary/10 border border-teal-primary/20 text-teal-primary text-sm rounded-lg text-center font-medium flex items-center justify-center gap-2">
                <Check size={16} /> Account created. Please check your email to confirm.
              </div>
            )}
            {signupErrorMsg && authTab === 'signup' && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center font-medium flex items-center justify-center gap-2">
                <X size={16} /> {signupErrorMsg}
              </div>
            )}

            {/* Forms */}
            <AnimatePresence mode="wait">
              {authTab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  onSubmit={handleLoginSubmit}
                  className="space-y-5"
                  noValidate
                >
                  <div className="space-y-1.5">
                    <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                      Email address
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      value={loginFields.email}
                      onChange={handleLoginChange}
                      onBlur={handleLoginBlur}
                      placeholder="name@domain.com"
                      disabled={loginSubmitting || loginSuccess}
                      className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-white text-navy focus:outline-none transition-all ${
                        loginTouched.email
                          ? !loginErrors.email
                            ? 'border-teal-primary focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                            : 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                          : 'border-border-custom focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                      }`}
                    />
                    {loginTouched.email && loginErrors.email && (
                      <p className="text-xs text-red-600 font-medium">{loginErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={loginFields.password}
                        onChange={handleLoginChange}
                        onBlur={handleLoginBlur}
                        placeholder="••••••••"
                        disabled={loginSubmitting || loginSuccess}
                        className={`w-full pl-3.5 pr-10 py-2 border rounded-lg text-sm bg-white text-navy focus:outline-none transition-all ${
                          loginTouched.password
                            ? !loginErrors.password
                              ? 'border-teal-primary focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                              : 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                            : 'border-border-custom focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded-full p-0.5"
                        tabIndex={0}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {loginTouched.password && loginErrors.password && (
                      <p className="text-xs text-red-600 font-medium">{loginErrors.password}</p>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <a href="#forgot" className="text-xs font-medium text-navy/60 hover:text-teal-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded px-0.5">
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={loginSubmitting || loginSuccess}
                    className="w-full inline-flex items-center justify-center bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2"
                  >
                    {loginSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        Logging in...
                      </span>
                    ) : (
                      "Log in"
                    )}
                  </button>

                  <p className="text-[10px] text-center text-navy/50 leading-relaxed max-w-[280px] mx-auto pt-2">
                    By continuing you agree to our terms of service and privacy parameters.
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  onSubmit={handleSignupSubmit}
                  className="space-y-4"
                  noValidate
                >
                  <div className="space-y-1.5">
                    <label htmlFor="signup-name" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      name="name"
                      value={signupFields.name}
                      onChange={handleSignupChange}
                      onBlur={handleSignupBlur}
                      placeholder="Sarah Jenkins"
                      disabled={signupSubmitting || signupSuccess}
                      className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-white text-navy focus:outline-none transition-all ${
                        signupTouched.name
                          ? !signupErrors.name
                            ? 'border-teal-primary focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                            : 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                          : 'border-border-custom focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                      }`}
                    />
                    {signupTouched.name && signupErrors.name && (
                      <p className="text-xs text-red-600 font-medium">{signupErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="signup-email" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                      Email address
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      name="email"
                      value={signupFields.email}
                      onChange={handleSignupChange}
                      onBlur={handleSignupBlur}
                      placeholder="name@domain.com"
                      disabled={signupSubmitting || signupSuccess}
                      className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-white text-navy focus:outline-none transition-all ${
                        signupTouched.email
                          ? !signupErrors.email
                            ? 'border-teal-primary focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                            : 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                          : 'border-border-custom focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                      }`}
                    />
                    {signupTouched.email && signupErrors.email && (
                      <p className="text-xs text-red-600 font-medium">{signupErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="signup-password" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={signupFields.password}
                        onChange={handleSignupChange}
                        onBlur={handleSignupBlur}
                        placeholder="Minimum 6 characters"
                        disabled={signupSubmitting || signupSuccess}
                        className={`w-full pl-3.5 pr-10 py-2 border rounded-lg text-sm bg-white text-navy focus:outline-none transition-all ${
                          signupTouched.password
                            ? !signupErrors.password
                              ? 'border-teal-primary focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                              : 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                            : 'border-border-custom focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded-full p-0.5"
                        tabIndex={0}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {signupTouched.password && signupErrors.password && (
                      <p className="text-xs text-red-600 font-medium">{signupErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="signup-confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={signupFields.confirmPassword}
                        onChange={handleSignupChange}
                        onBlur={handleSignupBlur}
                        placeholder="Re-enter password"
                        disabled={signupSubmitting || signupSuccess}
                        className={`w-full pl-3.5 pr-10 py-2 border rounded-lg text-sm bg-white text-navy focus:outline-none transition-all ${
                          signupTouched.confirmPassword
                            ? !signupErrors.confirmPassword
                              ? 'border-teal-primary focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                              : 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                            : 'border-border-custom focus:border-teal-primary focus:ring-1 focus:ring-teal-primary'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded-full p-0.5"
                        tabIndex={0}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {signupTouched.confirmPassword && signupErrors.confirmPassword && (
                      <p className="text-xs text-red-600 font-medium">{signupErrors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="signup-role" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                      Account Type
                    </label>
                    <select
                      id="signup-role"
                      name="requested_role"
                      value={signupFields.requested_role}
                      onChange={handleSignupChange}
                      disabled={signupSubmitting || signupSuccess}
                      className="w-full px-3.5 py-2 border border-border-custom rounded-lg text-sm bg-white text-navy focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary transition-all"
                    >
                      <option value="Traveler">Traveler</option>
                      <option value="Travel Planner">Travel Planner</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={signupSubmitting || signupSuccess}
                    className="w-full inline-flex items-center justify-center bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 mt-2"
                  >
                    {signupSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        Creating account...
                      </span>
                    ) : (
                      "Create account"
                    )}
                  </button>

                  <p className="text-[10px] text-center text-navy/50 leading-relaxed max-w-[280px] mx-auto pt-2">
                    By continuing you agree to our terms of service and privacy parameters.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      </div>
      
    </div>
  );
}
