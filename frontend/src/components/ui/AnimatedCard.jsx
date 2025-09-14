import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = '', 
  glowColor = 'cyan',
  tiltIntensity = 0.1,
  ...props 
}) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct * tiltIntensity);
    y.set(yPct * tiltIntensity);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const glowColors = {
    cyan: 'hover:shadow-[0_0_40px_rgba(0,229,255,0.3)]',
    violet: 'hover:shadow-[0_0_40px_rgba(108,99,255,0.3)]',
    gold: 'hover:shadow-[0_0_40px_rgba(255,215,0,0.3)]'
  };

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={`
        glass glass-interactive transform-gpu
        ${glowColors[glowColor]}
        transition-all duration-300 ease-out
        ${className}
      `}
      {...props}
    >
      <div style={{ transform: "translateZ(50px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

export default AnimatedCard;
