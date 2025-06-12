import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { loadMeshFromFile } from '../utils/meshUtils';
import { LabeledPoint } from '../types';

interface MeshViewerProps {
  meshData: ArrayBuffer;
  fileName: string;
  isLabeling: boolean;
  onAddPoint: (point: LabeledPoint) => void;
  labeledPoints: LabeledPoint[];
}

const MeshViewer: React.FC<MeshViewerProps> = ({
  meshData,
  fileName,
  isLabeling,
  onAddPoint,
  labeledPoints
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, gl } = useThree();
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mouseRef = useRef(new THREE.Vector2());

  useEffect(() => {
    if (!meshData) return;

    setIsLoading(true);
    setError(null);
    
    const loadMesh = async () => {
      try {
        const loadedGeometry = await loadMeshFromFile(meshData, fileName);
        setGeometry(loadedGeometry);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading mesh:', error);
        setError(error instanceof Error ? error.message : 'Unknown error loading mesh');
        setIsLoading(false);
      }
    };

    loadMesh();
  }, [meshData, fileName]);

  // Handle mouse move to track position
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const canvas = gl.domElement;
    canvas.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl]);

  // Handle click events for labeling
  useEffect(() => {
    if (!isLabeling) return;

    const handleClick = (event: MouseEvent) => {
      if (!meshRef.current) return;

      // Prevent default behavior
      event.preventDefault();
      event.stopPropagation();

      // Update raycaster with current mouse position
      raycaster.setFromCamera(mouseRef.current, camera);
      
      const mesh = meshRef.current;
      const intersects = raycaster.intersectObject(mesh);
      
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const point = intersection.point;
        
        const newPoint: LabeledPoint = {
          id: Date.now().toString(),
          label: `Point ${labeledPoints.length + 1}`,
          position: { x: point.x, y: point.y, z: point.z },
          normal: intersection.face?.normal ? {
            x: intersection.face.normal.x,
            y: intersection.face.normal.y,
            z: intersection.face.normal.z
          } : { x: 0, y: 0, z: 1 }
        };
        
        onAddPoint(newPoint);
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick, { capture: true });
    
    return () => {
      canvas.removeEventListener('click', handleClick, { capture: true });
    };
  }, [isLabeling, camera, raycaster, gl, onAddPoint, labeledPoints.length]);

  // Update cursor style
  useEffect(() => {
    const canvas = gl.domElement;
    if (isLabeling) {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = 'default';
    }
    
    return () => {
      canvas.style.cursor = 'default';
    };
  }, [isLabeling, gl]);

  const handleMeshClick = (event: any) => {
    if (!isLabeling) return;
    
    event.stopPropagation();
    
    const point = event.point;
    const newPoint: LabeledPoint = {
      id: Date.now().toString(),
      label: `Point ${labeledPoints.length + 1}`,
      position: { x: point.x, y: point.y, z: point.z },
      normal: event.face?.normal ? {
        x: event.face.normal.x,
        y: event.face.normal.y,
        z: event.face.normal.z
      } : { x: 0, y: 0, z: 1 }
    };
    
    onAddPoint(newPoint);
  };

  return (
    <>
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enabled={!isLabeling}
        makeDefault
      />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      
      {isLoading && (
        <Text
          position={[0, 0, 0]}
          fontSize={0.2}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          Loading mesh...
        </Text>
      )}
      
      {error && (
        <Text
          position={[0, 0, 0]}
          fontSize={0.15}
          color="#EF4444"
          anchorX="center"
          anchorY="middle"
        >
          Error: {error}
        </Text>
      )}
      
      {geometry && !error && (
        <mesh
          ref={meshRef}
          geometry={geometry}
          onClick={isLabeling ? handleMeshClick : undefined}
        >
          <meshStandardMaterial
            color="#8B8B8B"
            roughness={0.3}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Render labeled points */}
      {labeledPoints.map((point, index) => (
        <group key={point.id} position={[point.position.x, point.position.y, point.position.z]}>
          <mesh>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshStandardMaterial
              color={`hsl(${(index * 137.508) % 360}, 70%, 50%)`}
              emissive={`hsl(${(index * 137.508) % 360}, 70%, 30%)`}
            />
          </mesh>
          <Text
            position={[0, 0.1, 0]}
            fontSize={0.05}
            color={`hsl(${(index * 137.508) % 360}, 70%, 40%)`}
            anchorX="center"
            anchorY="bottom"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.woff"
          >
            {point.label}
          </Text>
        </group>
      ))}
      
      {/* Labeling cursor indicator */}
      {isLabeling && (
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.1}
          color="#3B82F6"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.woff"
        >
          Click on the mesh to label points
        </Text>
      )}
    </>
  );
};

export default MeshViewer;