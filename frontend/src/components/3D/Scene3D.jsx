import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import FloatingGeometry from './FloatingGeometry';
import ParticleField from './ParticleField';
import FinancialSymbols from './FinancialSymbols';

const Scene3D = ({ className = '', interactive = false }) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ background: 'transparent' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />
        
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#00E5FF" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6C63FF" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          color="#FFD700"
          castShadow
        />

        <Suspense fallback={null}>
          {/* Particle Field Background */}
          <ParticleField count={800} radius={12} />
          
          {/* Floating Geometries */}
          <FloatingGeometry 
            position={[-4, 2, -2]} 
            scale={0.8} 
            color="#00E5FF" 
            geometry="icosahedron" 
          />
          <FloatingGeometry 
            position={[4, -1, -3]} 
            scale={1.2} 
            color="#6C63FF" 
            geometry="octahedron" 
          />
          <FloatingGeometry 
            position={[0, 3, -4]} 
            scale={0.6} 
            color="#FFD700" 
            geometry="torus" 
          />
          <FloatingGeometry 
            position={[-2, -3, -1]} 
            scale={0.9} 
            color="#00E5FF" 
            geometry="tetrahedron" 
          />
          <FloatingGeometry 
            position={[3, 1, -5]} 
            scale={0.7} 
            color="#6C63FF" 
            geometry="sphere" 
          />
          
          {/* Financial Symbols */}
          <FinancialSymbols />
          
          {/* Environment */}
          <Environment preset="night" />
        </Suspense>

        {/* Controls - only if interactive */}
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
        )}
      </Canvas>
    </div>
  );
};

export default Scene3D;
