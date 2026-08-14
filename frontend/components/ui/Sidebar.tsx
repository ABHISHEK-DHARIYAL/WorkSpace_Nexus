import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  LayoutDashboard, 
  Briefcase, 
  Globe, 
  Bookmark, 
  Settings, 
  Users, 
  Layers, 
  Network, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Info,
  Lock,
  X,
  CheckCircle2,
  Loader2,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../../services/api/auth';
import { useDevice } from '../../context/DeviceContext';

interface SidebarProps {
  onOpenSettings?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const { user, updateUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useDevice();
  const [collapsed, setCollapsed] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Security Form State
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

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
      setPasswordStatus({ type: 'error', msg: err?.message || err?.response?.data?.message || 'Failed to update password' });
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
      navigate('/');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', msg: err?.message || err?.response?.data?.message || 'Failed to delete account' });
      setDeleteConfirm(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setShowSecurityModal(true);
    }
  };

  const userItems = [
    {
      title: 'Home',
      icon: <Home className="w-5 h-5" />,
      path: '/'
    },
    {
      title: 'Workspace',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/dashboard'
    },
    {
      title: 'Document Nexus',
      icon: <Network className="w-5 h-5" />,
      path: '/document'
    },
    {
      title: 'Public Content',
      icon: <Globe className="w-5 h-5" />,
      path: '/public-content'
    },
    {
      title: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/analytics'
    },
    {
      title: 'Bookmarks',
      icon: <Bookmark className="w-5 h-5" />,
      path: '/bookmarks'
    },
    {
      title: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      path: '#settings',
      onClick: handleSettingsClick
    }
  ];

  const sidebarItems = userItems;

  const isItemActive = (item: typeof sidebarItems[0]) => {
    if (item.path.startsWith('#')) return false;
    const currentPath = location.pathname + location.search;
    if (item.path === '/') {
      return location.pathname === '/';
    }
    if (item.path.includes('?')) {
      return currentPath.includes(item.path);
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Mobile Drawer Navigation (md:hidden) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black"
            />
            
            {/* Side-sliding drawer component */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-[85vw] bg-[#fdf6e3] dark:bg-[#15181e] h-full flex flex-col justify-between p-6 shadow-2xl border-r border-[#eee1ba] dark:border-[#2d323f] z-50 overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#5b4636]/60 dark:text-[#eee1ba]/60">
                    Navigation Menu
                  </span>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[#f4ecd8] dark:hover:bg-[#1e232e] text-[#5b4636] dark:text-[#eee1ba]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {sidebarItems.map((item, index) => {
                    const active = isItemActive(item);
                    const content = (
                      <div
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all select-none ${
                          active
                            ? 'bg-[#eee1ba] text-[#5b4636] dark:bg-[#eee1ba] dark:text-[#0f1115] shadow-sm'
                            : 'text-[#5b4636]/80 dark:text-[#eee1ba]/80 hover:bg-[#f4ecd8] dark:hover:bg-[#1e232e]'
                        }`}
                      >
                        <div>{item.icon}</div>
                        <span>{item.title}</span>
                      </div>
                    );

                    if (item.onClick) {
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setMobileSidebarOpen(false);
                            item.onClick();
                          }}
                          className="w-full text-left focus:outline-none group block"
                        >
                          {content}
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={index}
                        to={item.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className="group block"
                      >
                        {content}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 bg-white/40 dark:bg-black/10 border border-[#eee1ba] dark:border-[#2d323f]/50 rounded-2xl mt-8">
                <div className="flex gap-2 text-[#5b4636]/60 dark:text-[#eee1ba]/60">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-normal font-semibold font-sans">
                    {isAdmin ? 'Operational Admin Mode active' : 'Explore public contents or manage project listings.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={{ width: collapsed ? 76 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col flex-shrink-0 border-r bg-[#fdf6e3] border-[#eee1ba] dark:bg-[#15181e] dark:border-[#2d323f] h-[calc(100vh-64px)] sticky top-16 z-40 transition-colors duration-300"
      >
        <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto">
          <div className="space-y-2">
            <div className={`flex items-center ${collapsed ? 'justify-center mb-6' : 'justify-between px-2 mb-6'}`}>
              {!collapsed && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5b4636]/40 dark:text-[#eee1ba]/40">
                  Navigation
                </span>
              )}
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-lg hover:bg-[#f4ecd8] dark:hover:bg-[#1e232e] text-[#5b4636] dark:text-[#eee1ba] transition-colors"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map((item, index) => {
                const active = isItemActive(item);
                const content = (
                  <div
                    className={`flex items-center space-x-3 px-3 py-3 rounded-xl font-bold text-sm transition-all select-none ${
                      active 
                        ? 'bg-[#eee1ba] text-[#5b4636] dark:bg-[#eee1ba] dark:text-[#0f1115] shadow-sm' 
                        : 'text-[#5b4636]/80 dark:text-[#eee1ba]/80 hover:bg-[#f4ecd8] dark:hover:bg-[#1e232e] hover:text-[#5b4636] dark:hover:text-[#eee1ba]'
                    }`}
                  >
                    <div className={`transition-transform duration-200 ${active ? 'scale-105' : 'group-hover:scale-105'}`}>
                      {item.icon}
                    </div>
                    {!collapsed && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="truncate"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </div>
                );

                if (item.onClick) {
                  return (
                    <button 
                      key={index} 
                      onClick={item.onClick}
                      className="w-full text-left focus:outline-none group block"
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link 
                    key={index} 
                    to={item.path} 
                    className="group block"
                  >
                    {content}
                  </Link>
                );
              })}
            </nav>
          </div>

          {!collapsed && (
            <div className="p-4 bg-white/40 dark:bg-black/10 border border-[#eee1ba] dark:border-[#2d323f]/50 rounded-2xl">
              <div className="flex gap-2 text-[#5b4636]/60 dark:text-[#eee1ba]/60">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] leading-normal font-semibold font-sans">
                  {isAdmin ? 'Operational Admin Mode active' : 'Explore public contents or manage project listings.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Embedded Security popup modal */}
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
                    <Shield className="w-4 h-4 text-black dark:text-[#eee1ba]" />
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
                          className="text-[9px] font-bold text-black dark:text-[#eee1ba] hover:underline uppercase tracking-tight transition-colors"
                        >
                          Generate & Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[9px] font-bold text-slate-400 dark:text-slate-300 hover:text-black dark:hover:text-[#eee1ba] uppercase tracking-tight"
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#1f242e] border border-slate-200 dark:border-[#2d323f] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#eee1ba] dark:focus:ring-[#eee1ba] transition-all font-mono text-slate-900 dark:text-white"
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
                    className="w-full py-3 bg-slate-50 dark:bg-[#1f242e] border border-slate-200 dark:border-[#2d323f] text-black dark:text-[#eee1ba] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-[#252b37] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
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

export default Sidebar;
