import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const FloatingGeometry = ({ position = [0, 0, 0], scale = 1, color = '#00E5FF', geometry = 'sphere' }) => {
  const meshRef = useRef();
  const materialRef = useRef();

  // Create geometry based on type
  const geometryComponent = useMemo(() => {
    switch (geometry) {
      case 'sphere':
        return <sphereGeometry args={[1, 32, 32]} />;
      case 'torus':
        return <torusGeometry args={[1, 0.4, 16, 100]} />;
      case 'octahedron':
        return <octahedronGeometry args={[1, 0]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[1, 0]} />;
      case 'tetrahedron':
        return <tetrahedronGeometry args={[1, 0]} />;
      default:
        return <sphereGeometry args={[1, 32, 32]} />;
    }
  }, [geometry]);

  // Animate the geometry
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
    }
    
    if (materialRef.current) {
      materialRef.current.distort = 0.1 + Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.5}
      floatingRange={[-0.5, 0.5]}
    >
      <mesh ref={meshRef} position={position} scale={scale}>
        {geometryComponent}
        <MeshDistortMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={0.6}
          distort={0.1}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
};

export default FloatingGeometry;
