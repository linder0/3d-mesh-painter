import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LabelClass, BrushSettings, MeshData } from '../types';
import { loadMeshFromFile, initializeVertexColors, hexToRgb, getVerticesInRadius, calculateBrushStrength } from '../utils/meshUtils';

interface MeshPainterProps {
  meshData: ArrayBuffer;
  fileName: string;
  isPainting: boolean;
  activeClass: LabelClass | null;
  brushSettings: BrushSettings;
  labelClasses: LabelClass[];
  onMeshDataChange: (meshData: MeshData) => void;
  isErasing?: boolean;
}

const MeshPainter: React.FC<MeshPainterProps> = ({
  meshData,
  fileName,
  isPainting,
  activeClass,
  brushSettings,
  labelClasses,
  onMeshDataChange,
  isErasing = false
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, gl } = useThree();
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [vertexColors, setVertexColors] = useState<Float32Array | null>(null);
  const [originalColors, setOriginalColors] = useState<Float32Array | null>(null);
  const [paintedVertices, setPaintedVertices] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);
  const mouseRef = useRef(new THREE.Vector2());
  const lastPaintPoint = useRef<THREE.Vector3 | null>(null);

  // Load mesh
  useEffect(() => {
    if (!meshData) return;

    setIsLoading(true);
    const loadMesh = async () => {
      try {
        const loadedGeometry = await loadMeshFromFile(meshData, fileName);
        const colors = initializeVertexColors(loadedGeometry);
        
        setGeometry(loadedGeometry);
        setVertexColors(colors);
        setOriginalColors(new Float32Array(colors));
        setPaintedVertices(new Map());
        setIsLoading(false);

        // Notify parent of mesh data
        onMeshDataChange({
          geometry: loadedGeometry,
          vertexColors: colors,
          originalColors: new Float32Array(colors),
          paintedVertices: new Map()
        });
      } catch (error) {
        console.error('Error loading mesh:', error);
        setIsLoading(false);
      }
    };

    loadMesh();
  }, [meshData, fileName, onMeshDataChange]);

  // Update vertex colors when classes change
  useEffect(() => {
    if (!geometry || !vertexColors || !originalColors) return;

    const newColors = new Float32Array(originalColors);
    
    paintedVertices.forEach((classId, vertexIndex) => {
      const labelClass = labelClasses.find(cls => cls.id === classId);
      if (labelClass && labelClass.visible) {
        const rgb = hexToRgb(labelClass.color);
        const colorIndex = vertexIndex * 3;
        newColors[colorIndex] = rgb.r;
        newColors[colorIndex + 1] = rgb.g;
        newColors[colorIndex + 2] = rgb.b;
      }
    });

    setVertexColors(newColors);
    
    if (meshRef.current) {
      const colorAttribute = meshRef.current.geometry.attributes.color;
      if (colorAttribute) {
        colorAttribute.array = newColors;
        colorAttribute.needsUpdate = true;
      }
    }
  }, [labelClasses, paintedVertices, geometry, originalColors]);

  // Mouse tracking with right-click detection
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) { // Left mouse button
        setIsMouseDown(true);
      } else if (event.button === 2) { // Right mouse button
        setIsRightMouseDown(true);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) { // Left mouse button
        setIsMouseDown(false);
        lastPaintPoint.current = null;
      } else if (event.button === 2) { // Right mouse button
        setIsRightMouseDown(false);
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (isPainting) {
        event.preventDefault(); // Prevent context menu when painting
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl, isPainting]);

  // Painting/Erasing logic
  const paintAtPoint = useCallback((intersectionPoint: THREE.Vector3, shouldErase: boolean = false) => {
    if (!geometry || !vertexColors || !originalColors) return;
    if (!shouldErase && !activeClass) return;

    const affectedVertices = getVerticesInRadius(geometry, intersectionPoint, brushSettings.size);
    const newPaintedVertices = new Map(paintedVertices);
    const newColors = new Float32Array(vertexColors);

    affectedVertices.forEach(vertexIndex => {
      const positions = geometry.attributes.position;
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(positions, vertexIndex);
      
      const distance = vertex.distanceTo(intersectionPoint);
      const strength = calculateBrushStrength(distance, brushSettings.size, brushSettings.falloff, brushSettings.strength);
      
      if (strength > 0) {
        const colorIndex = vertexIndex * 3;
        
        if (shouldErase) {
          // Erase: remove from painted vertices and restore original color
          newPaintedVertices.delete(vertexIndex);
          
          // Blend back to original color
          const originalR = originalColors[colorIndex];
          const originalG = originalColors[colorIndex + 1];
          const originalB = originalColors[colorIndex + 2];
          const currentR = newColors[colorIndex];
          const currentG = newColors[colorIndex + 1];
          const currentB = newColors[colorIndex + 2];
          
          newColors[colorIndex] = currentR + (originalR - currentR) * strength;
          newColors[colorIndex + 1] = currentG + (originalG - currentG) * strength;
          newColors[colorIndex + 2] = currentB + (originalB - currentB) * strength;
        } else if (activeClass) {
          // Paint: add to painted vertices and apply class color
          newPaintedVertices.set(vertexIndex, activeClass.id);
          
          const rgb = hexToRgb(activeClass.color);
          const currentR = newColors[colorIndex];
          const currentG = newColors[colorIndex + 1];
          const currentB = newColors[colorIndex + 2];
          
          newColors[colorIndex] = currentR + (rgb.r - currentR) * strength;
          newColors[colorIndex + 1] = currentG + (rgb.g - currentG) * strength;
          newColors[colorIndex + 2] = currentB + (rgb.b - currentB) * strength;
        }
      }
    });

    setPaintedVertices(newPaintedVertices);
    setVertexColors(newColors);

    // Update mesh colors
    if (meshRef.current) {
      const colorAttribute = meshRef.current.geometry.attributes.color;
      if (colorAttribute) {
        colorAttribute.array = newColors;
        colorAttribute.needsUpdate = true;
      }
    }

    // Update parent
    onMeshDataChange({
      geometry,
      vertexColors: newColors,
      originalColors: originalColors!,
      paintedVertices: newPaintedVertices
    });
  }, [geometry, vertexColors, originalColors, activeClass, brushSettings, paintedVertices, onMeshDataChange]);

  // Handle painting/erasing on mouse move
  useFrame(() => {
    if (!isPainting || (!isMouseDown && !isRightMouseDown) || !meshRef.current) return;

    raycaster.setFromCamera(mouseRef.current, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    
    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point;
      
      // Continuous painting/erasing - only paint if we've moved enough
      if (!lastPaintPoint.current || lastPaintPoint.current.distanceTo(intersectionPoint) > brushSettings.size * 0.1) {
        const shouldErase = isRightMouseDown || isErasing;
        paintAtPoint(intersectionPoint, shouldErase);
        lastPaintPoint.current = intersectionPoint.clone();
      }
    }
  });

  // Update cursor
  useEffect(() => {
    const canvas = gl.domElement;
    if (isPainting) {
      if (isErasing) {
        canvas.style.cursor = 'not-allowed';
      } else if (activeClass) {
        canvas.style.cursor = 'crosshair';
      } else {
        canvas.style.cursor = 'default';
      }
    } else {
      canvas.style.cursor = 'default';
    }
    
    return () => {
      canvas.style.cursor = 'default';
    };
  }, [isPainting, activeClass, isErasing, gl]);

  // Add vertex colors to geometry
  useEffect(() => {
    if (geometry && vertexColors && meshRef.current) {
      geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
      meshRef.current.geometry = geometry;
    }
  }, [geometry, vertexColors]);

  return (
    <>
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enabled={!isPainting || isRightMouseDown} // Allow rotation when right mouse is down
        makeDefault
      />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      
      {isLoading && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#666666" />
        </mesh>
      )}
      
      {geometry && (
        <mesh
          ref={meshRef}
          geometry={geometry}
        >
          <meshStandardMaterial
            vertexColors={true}
            roughness={0.4}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Brush preview */}
      {isPainting && (activeClass || isErasing) && (
        <mesh position={[0, 2.5, 0]}>
          <ringGeometry args={[brushSettings.size * 0.9, brushSettings.size, 32]} />
          <meshBasicMaterial 
            color={isErasing ? "#EF4444" : (activeClass?.color || "#666666")} 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  );
};

export default MeshPainter;