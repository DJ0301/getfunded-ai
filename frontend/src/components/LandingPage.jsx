import React, { useRef, Suspense } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, ArrowRight, Zap, TrendingUp, Shield, Users } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Powered Matching",
      description: "Advanced algorithms connect you with the perfect investors for your startup"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Real-time Analytics",
      description: "Track your fundraising progress with comprehensive insights and metrics"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Platform",
      description: "Enterprise-grade security protecting your sensitive business information"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Expert Network",
      description: "Access to thousands of verified investors and industry experts"
    }
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden" style={{ backgroundColor: '#0B0F1A' }}>
      {/* Background Animated Gradient */}
      <div className="fixed inset-0 z-0 animated-gradient" style={{ opacity: 0.35 }} />

      {/* Gradient Overlays */}
      <div className="fixed inset-0 z-10">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(11,15,26,1) 0%, rgba(11,15,26,0.2) 50%, rgba(11,15,26,1) 100%)',
          opacity: 0.8
        }} />
      </div>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ y, opacity }}
        className="relative z-20 min-h-screen flex items-center justify-center px-6"
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-bold leading-tight" style={{ color: '#FFFFFF' }}>
              <span className="block">Fund Your</span>
              <span className="block text-gradient">Future</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed"
            style={{ color: '#D1D5DB' }}
          >
            Connect with the right investors, accelerate your growth, and transform your startup vision into reality with AI-powered precision.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <button 
              onClick={onGetStarted}
              className="magnetic-btn group"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
            
            <button className="glass glass-interactive px-8 py-4 text-lg font-semibold rounded-full" style={{ color: '#FFFFFF' }}>
              Watch Demo
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="glass glass-accent p-6 rounded-2xl">
              <div className="text-3xl font-bold text-gradient mb-2">$2.5B+</div>
              <div style={{ color: '#9CA3AF' }}>Funding Raised</div>
            </div>
            <div className="glass glass-violet p-6 rounded-2xl">
              <div className="text-3xl font-bold text-gradient mb-2">10K+</div>
              <div style={{ color: '#9CA3AF' }}>Startups Funded</div>
            </div>
            <div className="glass glass-gold p-6 rounded-2xl">
              <div className="text-3xl font-bold text-gradient mb-2">500+</div>
              <div style={{ color: '#9CA3AF' }}>Active Investors</div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-[#9CA3AF] cursor-pointer"
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="relative z-20 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Why Choose <span className="text-gradient">GetFunded</span>
            </h2>
            <p className="text-xl text-[#D1D5DB] max-w-3xl mx-auto">
              Our platform combines cutting-edge AI technology with deep industry expertise to revolutionize how startups connect with investors.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass glass-interactive p-8 rounded-2xl group"
              >
                <div className="mb-4" style={{ color: '#00E5FF' }}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>
                  {feature.title}
                </h3>
                <p className="leading-relaxed" style={{ color: '#9CA3AF' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-20 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass glass-accent p-12 rounded-3xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#FFFFFF' }}>
              Ready to Transform Your Fundraising?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: '#D1D5DB' }}>
              Join thousands of successful startups who have raised funding through our platform. Your next investor is waiting.
            </p>
            <button 
              onClick={onGetStarted}
              className="magnetic-btn group text-xl"
            >
              <span className="relative z-10 flex items-center gap-3">
                Start Your Journey
                <ArrowRight className="w-6 h-6" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
