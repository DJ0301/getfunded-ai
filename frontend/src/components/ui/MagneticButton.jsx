import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const MagneticButton = ({ 
  children, 
  className = '', 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...props 
}) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(springY, [-50, 50], [5, -5]);
  const rotateY = useTransform(springX, [-50, 50], [-5, 5]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e) => {
      if (disabled) return;
      
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 100;
      
      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance;
        x.set(deltaX * strength * 0.3);
        y.set(deltaY * strength * 0.3);
      }
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [x, y, disabled]);

  const variants = {
    primary: 'magnetic-btn',
    secondary: 'glass glass-interactive rounded-full font-semibold',
    ghost: 'glass-interactive rounded-full font-semibold border border-glass-border',
    accent: 'glass glass-accent rounded-full font-semibold'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  return (
    <motion.button
      ref={ref}
      style={{
        x: springX,
        y: springY,
        rotateX,
        rotateY,
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        relative overflow-hidden transform-gpu
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50
      `}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* Ripple effect overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-violet-400/20 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
};

export default MagneticButton;
