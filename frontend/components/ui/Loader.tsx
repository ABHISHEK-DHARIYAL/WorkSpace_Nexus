import React from 'react';
import { motion } from 'motion/react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'lg', 
  message = "Loading your workspace...", 
  className = "" 
}) => {
  // Sizing definitions for different viewport contexts
  const sizes = {
    sm: {
      container: 'w-10 h-10',
      loaderSize: 40,
      ringWidth: 2,
      logoSize: 13,
      textSize: 'text-[10px]',
      particleSize: 3,
    },
    md: {
      container: 'w-20 h-20',
      loaderSize: 80,
      ringWidth: 3.5,
      logoSize: 24,
      textSize: 'text-xs',
      particleSize: 4,
    },
    lg: {
      container: 'w-36 h-36',
      loaderSize: 136,
      ringWidth: 4.5,
      logoSize: 36,
      textSize: 'text-sm',
      particleSize: 5,
    },
  };

  const config = sizes[size] || sizes.lg;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center p-8 rounded-[24px] ${
        size === 'lg' 
          ? 'min-h-[350px] bg-white/45 dark:bg-[#0c0e12]/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/20 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.06)]' 
          : 'min-h-[160px]'
      } ${className}`}
    >
      <div 
        className="relative flex items-center justify-center" 
        style={{ width: config.loaderSize, height: config.loaderSize }}
      >
        {/* Breathing backdrop radial glow representing the dynamic aura of Workspace Nexus */}
        {size !== 'sm' && (
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.12, 0.28, 0.12]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute rounded-full pointer-events-none filter blur-xl"
            style={{
              width: config.loaderSize * 1.2,
              height: config.loaderSize * 1.2,
              background: 'radial-gradient(circle, rgba(91,61,245,0.45) 0%, rgba(59,130,246,0.18) 50%, rgba(6,182,212,0.0) 100%)',
            }}
          />
        )}

        {/* The Premium Multi-Layer Vector Loader SVG */}
        <svg 
          width={config.loaderSize} 
          height={config.loaderSize} 
          viewBox={`0 0 ${config.loaderSize} ${config.loaderSize}`} 
          className="absolute overflow-visible select-none"
        >
          <defs>
            {/* SaaS Color Gradients */}
            <linearGradient id="cyberOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5B3DF5" />
              <stop offset="35%" stopColor="#3B82F6" />
              <stop offset="70%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            
            <linearGradient id="cyberInnerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="1" />
              <stop offset="100%" stopColor="#5B3DF5" stopOpacity="0.75" />
            </linearGradient>

            <filter id="loaderGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="softPulseGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track circle */}
          <circle
            cx={config.loaderSize / 2}
            cy={config.loaderSize / 2}
            r={config.loaderSize / 2 - config.ringWidth * 1.5}
            fill="none"
            stroke="currentColor"
            className="text-slate-100/90 dark:text-slate-900/40"
            strokeWidth={config.ringWidth - 0.5}
          />

          {/* Layer 1: Premium Outer Rotating Multi-Gradient Ring */}
          <motion.circle
            cx={config.loaderSize / 2}
            cy={config.loaderSize / 2}
            r={config.loaderSize / 2 - config.ringWidth * 1.5}
            fill="none"
            stroke="url(#cyberOuterGrad)"
            strokeWidth={config.ringWidth}
            strokeLinecap="round"
            strokeDasharray={`${(config.loaderSize * Math.PI) / 3.4} ${(config.loaderSize * Math.PI) / 7.5}`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ originX: `${config.loaderSize / 2}px`, originY: `${config.loaderSize / 2}px` }}
          />

          {/* Layer 2: Secondary Opposite Orbiting Dotted Track for technical aesthetic */}
          {size !== 'sm' && (
            <motion.circle
              cx={config.loaderSize / 2}
              cy={config.loaderSize / 2}
              r={config.loaderSize / 2 - config.ringWidth * 3.5}
              fill="none"
              stroke="#06B6D4"
              strokeWidth={1}
              strokeDasharray="4, 10"
              animate={{ rotate: -360 }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ 
                originX: `${config.loaderSize / 2}px`, 
                originY: `${config.loaderSize / 2}px`, 
                opacity: 0.45 
              }}
            />
          )}

          {/* Layer 3: Inner Breathing Glowing Circle */}
          <motion.circle
            cx={config.loaderSize / 2}
            cy={config.loaderSize / 2}
            r={config.loaderSize / 3.3}
            fill="none"
            stroke="url(#cyberInnerGrad)"
            strokeWidth={config.ringWidth * 0.8}
            filter={size !== 'sm' ? "url(#softPulseGlow)" : undefined}
            animate={{ 
              scale: [0.96, 1.04, 0.96],
              opacity: [0.65, 1, 0.65]
            }}
            transition={{
              duration: 2.0,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ originX: `${config.loaderSize / 2}px`, originY: `${config.loaderSize / 2}px` }}
          />
        </svg>

        {/* Layer 4: Cyan Orbiting Particle */}
        {size !== 'sm' && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: config.loaderSize,
              height: config.loaderSize,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div 
              className="absolute rounded-full bg-cyan-400 shadow-[0_0_10px_#06B6D4]"
              style={{
                width: config.particleSize,
                height: config.particleSize,
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </motion.div>
        )}

        {/* Layer 5: Gold Orbiting Particle (Counter-directional) */}
        {size === 'lg' && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: config.loaderSize - 20,
              height: config.loaderSize - 20,
            }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 4.0,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div 
              className="absolute rounded-full bg-amber-400 shadow-[0_0_10px_#F59E0B]"
              style={{
                width: config.particleSize * 0.8,
                height: config.particleSize * 0.8,
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </motion.div>
        )}

        {/* Layer 6: Center App Icon / Monogram */}
        <div className="absolute flex items-center justify-center select-none pointer-events-none">
          <motion.div
            animate={{
              scale: [0.96, 1.04, 0.96],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{
              duration: 2.0,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center justify-center"
          >
            <span 
              className="font-black tracking-tight font-sans"
              style={{
                fontSize: config.logoSize,
                background: 'linear-gradient(135deg, #F59E0B 0%, #5B3DF5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 8px rgba(91,61,245,0.3))'
              }}
            >
              N
            </span>
          </motion.div>
        </div>
      </div>

      {/* Modern Status Message & Dynamic Bouncing Dots */}
      {size !== 'sm' && message && (
        <div className="mt-8 flex flex-col items-center gap-2 select-none shrink-0">
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 ${config.textSize}`}
          >
            {message}
          </motion.p>
          
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Loader;
