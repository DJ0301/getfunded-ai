import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';

const LazyLoad = ({ 
  children, 
  fallback = null, 
  className = '',
  threshold = 0.1 
}) => {
  const LoadingSpinner = () => (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );

  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
};

export default LazyLoad;
