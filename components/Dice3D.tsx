'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface DiceProps {
  targetNumber: number;
  onComplete?: () => void;
}

function Dice({ targetNumber, onComplete }: DiceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isRolling, setIsRolling] = useState(true);
  const startTime = useRef<number | null>(null);
  
  useEffect(() => {
    startTime.current = Date.now();
  }, []);
  
  // Create textures for dice faces
  const textures = useMemo(() => {
    if (typeof document === 'undefined') return [];
    const createDiceFace = (num: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 256);
      
      // Border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, 246, 246);
      
      // Dots
      ctx.fillStyle = '#ff0055'; // Retro pink dots
      const dotSize = 35; // Larger dots
      const positions: Record<number, [number, number][]> = {
        1: [[128, 128]],
        2: [[64, 64], [192, 192]],
        3: [[64, 64], [128, 128], [192, 192]],
        4: [[64, 64], [192, 64], [64, 192], [192, 192]],
        5: [[64, 64], [192, 64], [128, 128], [64, 192], [192, 192]],
        6: [[64, 64], [192, 64], [64, 128], [192, 128], [64, 192], [192, 192]],
      };
      
      positions[num].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      });
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    // Order: +x, -x, +y, -y, +z, -z
    // Standard dice: 1 opposite 6, 2 opposite 5, 3 opposite 4
    return [
      createDiceFace(2), // +x
      createDiceFace(5), // -x
      createDiceFace(3), // +y
      createDiceFace(4), // -y
      createDiceFace(1), // +z
      createDiceFace(6), // -z
    ];
  }, []);

  const targetRotation = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    // Map target number to rotation to show it on top (+y)
    // Default faces: 0:+x(2), 1:-x(5), 2:+y(3), 3:-y(4), 4:+z(1), 5:-z(6)
    switch (targetNumber) {
      case 3: targetRotation.current = [0, 0, 0]; break;
      case 4: targetRotation.current = [Math.PI, 0, 0]; break;
      case 1: targetRotation.current = [-Math.PI / 2, 0, 0]; break;
      case 6: targetRotation.current = [Math.PI / 2, 0, 0]; break;
      case 2: targetRotation.current = [0, 0, -Math.PI / 2]; break;
      case 5: targetRotation.current = [0, 0, Math.PI / 2]; break;
    }
  }, [targetNumber]);

  useFrame((state, delta) => {
    if (!meshRef.current || startTime.current === null) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const duration = 3.5; // Much longer duration to see the roll

    if (elapsed < duration) {
      // Fast rotation that slows down more gradually
      const speedFactor = Math.pow(1 - elapsed / duration, 1.5);
      meshRef.current.rotation.x += delta * (8 + 25 * speedFactor);
      meshRef.current.rotation.y += delta * (6 + 20 * speedFactor);
      meshRef.current.rotation.z += delta * (5 + 15 * speedFactor);
      
      // Bounce effect with "gravity" - more pronounced and slower
      const bounceCount = 4;
      const bounceHeight = 0.8; // Smaller bounce for compact size
      const progress = elapsed / duration;
      const bounce = Math.abs(Math.cos(progress * Math.PI * bounceCount)) * bounceHeight * (1 - progress);
      
      meshRef.current.position.y = bounce;
      meshRef.current.position.x = Math.sin(elapsed * 2) * (1 - progress);
      meshRef.current.position.z = Math.cos(elapsed * 1.5) * (1 - progress);
    } else if (isRolling) {
      // Smoothly interpolate to target rotation - slower final settle
      const lerpFactor = 0.05;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotation.current[0], lerpFactor);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation.current[1], lerpFactor);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotation.current[2], lerpFactor);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, lerpFactor);
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, lerpFactor);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, 0, lerpFactor);

      // Check if close enough to stop
      const epsilon = 0.005;
      if (Math.abs(meshRef.current.rotation.x - targetRotation.current[0]) < epsilon &&
          Math.abs(meshRef.current.rotation.y - targetRotation.current[1]) < epsilon &&
          Math.abs(meshRef.current.rotation.z - targetRotation.current[2]) < epsilon) {
        setIsRolling(false);
        if (onComplete) onComplete();
      }
    }
  });

  return (
    <Box ref={meshRef} args={[0.75, 0.75, 0.75]} castShadow>
      {textures.map((tex, i) => (
        <meshStandardMaterial 
          key={i} 
          attach={`material-${i}`} 
          map={tex}
          roughness={0.3}
          metalness={0.1}
          emissive={!isRolling ? "#00ffff" : "#ff0055"}
          emissiveIntensity={!isRolling ? 0.5 : 0.2}
        />
      ))}
    </Box>
  );
}

export default function Dice3DContainer({ targetNumber, onComplete }: DiceProps) {
  return (
    <div className="w-32 h-32 md:w-40 md:h-40 -mt-16 -ml-16 md:-mt-20 md:-ml-20 pointer-events-none overflow-visible">
      <Canvas shadows gl={{ alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={30} />
        <ambientLight intensity={1.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        <Dice targetNumber={targetNumber} onComplete={onComplete} />
        <ContactShadows position={[0, -0.4, 0]} opacity={0.7} scale={10} blur={2.5} far={4} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
