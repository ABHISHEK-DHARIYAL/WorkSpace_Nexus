import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FileText, LogOut, LayoutDashboard, User as UserIcon, Shield, Lock, CheckCircle2, Loader2, X, Sun, Moon, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { authService } from '../../services/api/auth';
import { useDevice } from '../../context/DeviceContext';

const Navbar: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useDevice();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  
  // Edit Username State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user ? (user.name || user.email?.split('@')[0] || 'Member') : '');

  // Synchronize tempName when user changes
  React.useEffect(() => {
    if (user) {
      setTempName(user.name || user.email?.split('@')[0] || 'Member');
    }
  }, [user]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateUser({ name: tempName.trim() });
    }
    setIsEditingName(false);
  };

  // Security Form State
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: 'error', msg: 'Password must be at least 6 characters' });
      return;
    }
    setUpdatingPassword(true);
    setPasswordStatus(null);
    try {
      await authService.updatePassword({ password: newPassword });
      setPasswordStatus({ type: 'success', msg: 'Password successfully updated!' });
      updateUser({ isSocial: false });
      setNewPassword('');
      setTimeout(() => setShowSecurityModal(false), 2000);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setPasswordStatus(null);
    try {
      await authService.deleteAccount();
      setShowSecurityModal(false);
      setDeleteConfirm(false);
      logout();
      navigate('/login');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', msg: err?.response?.data?.message || 'Failed to delete account' });
      setDeleteConfirm(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <>
      <nav className="bg-[#fdf6e3] border-b border-[#eee1ba] dark:bg-[#15181e] dark:border-[#2d323f] fixed w-full z-50 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex items-center space-x-1 sm:space-x-2">
              {user && (
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="md:hidden p-1 rounded-lg hover:bg-[#f4ecd8] dark:hover:bg-[#1e232e] text-[#5b4636] dark:text-[#eee1ba] transition-all"
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <Link to="/" className="flex items-center space-x-1 sm:space-x-2 group">
                <div className="w-7 h-7 sm:w-9 sm:h-9 bg-[#5b4636] dark:bg-[#eee1ba] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-md border border-white/10 dark:border-none">
                  <FileText className="text-white dark:text-black w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <span className="font-black text-sm xs:text-base sm:text-xl tracking-tight text-[#5b4636] dark:text-[#eee1ba]">WorkSpace Nexus</span>
              </Link>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-[#f4ecd8] dark:hover:bg-[#1e232e] text-[#5b4636] dark:text-[#eee1ba] transition-all relative overflow-hidden"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" /> : <Moon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />}
                </motion.div>
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => setShowSecurityModal(true)}
                    className="flex items-center space-x-1 sm:space-x-2 px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-md hover:bg-[#f4ecd8] dark:hover:bg-[#1e232e] transition-colors text-[#5b4636] dark:text-[#eee1ba] font-bold text-xs sm:text-sm"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#5b4636] dark:text-[#eee1ba]" />
                    <span className="hidden sm:inline">Security</span>
                  </button>
                  <Link
                    to="/dashboard"
                    className={`flex items-center space-x-1 sm:space-x-2 px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-md transition-all font-bold text-xs sm:text-sm ${
                      location.pathname === '/dashboard' || location.pathname.startsWith('/workspace')
                        ? 'bg-[#eee1ba] dark:bg-[#eee1ba] text-[#5b4636] dark:text-[#0f1115] shadow-sm'
                        : 'hover:bg-[#f4ecd8] dark:hover:bg-[#1e232e] text-[#5b4636]/80 dark:text-[#eee1ba]/80 hover:text-[#5b4636] dark:hover:text-[#eee1ba]'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Workspace Hub</span>
                  </Link>
                  <Link
                    to="/document"
                    className={`flex items-center space-x-1 sm:space-x-2 px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-md transition-all font-bold text-xs sm:text-sm ${
                      location.pathname === '/document'
                        ? 'bg-[#eee1ba] dark:bg-[#eee1ba] text-[#5b4636] dark:text-[#0f1115] shadow-sm'
                        : 'hover:bg-[#f4ecd8] dark:hover:bg-[#1e232e] text-[#5b4636]/80 dark:text-[#eee1ba]/80 hover:text-[#5b4636] dark:hover:text-[#eee1ba]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Document Nexus</span>
                  </Link>
                  <div className="flex items-center space-x-1.5 sm:space-x-3 pl-2 sm:pl-4 border-l border-[#eee1ba] dark:border-[#2d323f]">
                    <div className="hidden sm:block text-right">
                      {isEditingName ? (
                        <div className="flex items-center justify-end">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveName();
                              else if (e.key === 'Escape') {
                                setIsEditingName(false);
                                setTempName(user.name || user.email?.split('@')[0] || 'Member');
                              }
                            }}
                            className="bg-white dark:bg-[#1e232e] text-[#5b4636] dark:text-[#eee1ba] text-xs font-black uppercase text-right px-2 py-1 max-w-[120px] rounded border border-[#eee1ba] dark:border-[#2d323f] focus:ring-1 focus:ring-[#5b4636] focus:outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div 
                          onClick={() => setIsEditingName(true)}
                          className="group flex items-center justify-end gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                          title="Click to change your username"
                        >
                          <p className="text-xs font-black text-[#5b4636] dark:text-[#eee1ba] leading-none uppercase tracking-tighter">
                            {user.name || user.email?.split('@')[0] || 'Member'}
                          </p>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-[#5b4636]/40 dark:text-[#eee1ba]/40 group-hover:text-[#5b4636] dark:group-hover:text-[#eee1ba] transition-colors">
                            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474L13.488 2.513ZM12.427 3.573l1.06 1.06a.25.25 0 0 1 0 .354l-.56.56-1.414-1.414.56-.56a.25.25 0 0 1 .354 0ZM11.013 5.17l1.414 1.414-3.666 3.666a1.25 1.25 0 0 1-.405.271l-1.275.527.527-1.275c.068-.166.16-.32.271-.405L11.013 5.17Z" />
                          </svg>
                        </div>
                      )}
                      <p className="text-[9px] text-[#5b4636]/40 dark:text-[#eee1ba]/40 uppercase tracking-widest font-black mt-1">{user.role}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#f4ecd8] dark:bg-[#1e232e] flex items-center justify-center border border-[#eee1ba] dark:border-[#2d323f] shadow-inner">
                      <UserIcon className="w-4 h-4 text-[#5b4636] dark:text-[#eee1ba]" />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-[#5b4636]/40 dark:text-[#eee1ba]/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-bold text-[#5b4636] dark:text-[#eee1ba] hover:text-black dark:hover:text-white transition-colors">Login</Link>
                  <Link
                    to="/signup"
                    className="bg-[#5b4636] dark:bg-[#eee1ba] text-white dark:text-black px-5 py-2 rounded-lg text-sm font-black uppercase tracking-wider hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all shadow-lg border border-white/10 dark:border-none"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showSecurityModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSecurityModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#15181e] border dark:border-[#2d323f] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-slate-100 dark:border-[#2d323f] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-50 dark:bg-[#1f242e] border border-slate-100 dark:border-[#2d323f] rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-indigo-600 dark:text-[#eee1ba]" />
                  </div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Security Settings</h2>
                </div>
                <button 
                  onClick={() => setShowSecurityModal(false)}
                  className="p-2 hover:bg-slate-50 dark:hover:bg-[#1f242e] rounded-full transition-colors text-slate-400 dark:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Change Password
                      </label>
                      <div className="flex items-center space-x-2">
                        <button 
                          type="button"
                          onClick={(e) => {
                            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                            let pass = "";
                            for (let i = 0; i < 16; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                            setNewPassword(pass);
                            setShowPassword(true);
                            navigator.clipboard.writeText(pass);
                            
                            const originalText = e.currentTarget.innerText;
                            e.currentTarget.innerText = "Copied!";
                            e.currentTarget.classList.add("text-green-600");
                            setTimeout(() => {
                              e.currentTarget.innerText = originalText;
                              e.currentTarget.classList.remove("text-green-600");
                            }, 2000);
                          }}
                          className="text-[9px] font-bold text-indigo-600 dark:text-[#eee1ba] hover:underline uppercase tracking-tight transition-colors"
                        >
                          Generate & Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[9px] font-bold text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#eee1ba] uppercase tracking-tight"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#1f242e] border border-slate-200 dark:border-[#2d323f] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[#eee1ba] transition-all font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {passwordStatus && (
                    <div className={`p-4 rounded-xl text-xs font-bold flex items-center space-x-3 ${passwordStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'}`}>
                      {passwordStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>{passwordStatus.msg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full py-3 bg-slate-50 dark:bg-[#1f242e] border border-slate-200 dark:border-[#2d323f] text-indigo-600 dark:text-[#eee1ba] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-[#252b37] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
                  >
                    {updatingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>
                  
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 text-center leading-relaxed">
                    Update to a new manually-handled login password. Setting a password allows you to login without third-party services.
                  </p>

                  <div className="border-t border-slate-100 dark:border-[#2d323f] my-4 pt-4" />

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">
                      Danger Zone
                    </label>
                    <div className="p-4 bg-red-50/25 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-xl space-y-3">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                        Once you delete your account, there is no going back. All listings and assets associated with this profile will be permanently deleted.
                      </p>
                      {deleteConfirm ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={deletingAccount}
                            className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
                          >
                            {deletingAccount ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <span>Yes, Delete</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(false)}
                            disabled={deletingAccount}
                            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#1f242e] dark:hover:bg-[#252b37] text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs uppercase tracking-wider transition-colors text-center"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(true)}
                          className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center"
                        >
                          <span>Delete Account</span>
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
