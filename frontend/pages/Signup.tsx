import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api/client';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    try {
      const { data } = await api.post('/auth/signup', { email, password });
      if (data && data.token && data.user) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      console.error(err);
      setSignupError(err?.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <h2 className="text-3xl font-black mb-6 text-slate-900">Sign Up</h2>
        
        {signupError && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
            {signupError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            id="signup-email" 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
            required 
          />
          <div className="relative">
            <input 
              id="signup-password"
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-3 pr-10 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
              required 
            />
            <button
              id="signup-password-toggle"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <button 
            id="signup-submit" 
            type="submit" 
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
