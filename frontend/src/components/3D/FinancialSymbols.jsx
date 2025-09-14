import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Float, Center } from '@react-three/drei';
import * as THREE from 'three';

const FinancialSymbol = ({ symbol, position, color, scale = 1 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
      <Center ref={meshRef} position={position} scale={scale}>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
        >
          {symbol}
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.8}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.8}
            roughness={0.2}
          />
        </Text3D>
      </Center>
    </Float>
  );
};

const FinancialSymbols = () => {
  const symbols = useMemo(() => [
    { symbol: '$', position: [-3, 2, -2], color: '#FFD700' },
    { symbol: '€', position: [3, -1, -3], color: '#6C63FF' },
    { symbol: '₿', position: [-2, -2, -1], color: '#00E5FF' },
    { symbol: '¥', position: [2, 3, -2], color: '#FFD700' },
    { symbol: '£', position: [0, 1, -4], color: '#6C63FF' },
  ], []);

  return (
    <group>
      {symbols.map((item, index) => (
        <FinancialSymbol
          key={index}
          symbol={item.symbol}
          position={item.position}
          color={item.color}
          scale={0.8}
        />
      ))}
    </group>
  );
};

export default FinancialSymbols;
