import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LabelClass, BrushSettings, MeshData, AppMode } from '../types';
import { loadMeshFromFile, initializeVertexColors, hexToRgb, getVerticesInRadius, calculateBrushStrength } from '../utils/meshUtils';

interface MeshPainterProps {
  meshData: ArrayBuffer;
  fileName: string;
  isPaintModeActive: boolean;
  activeClass: LabelClass | null;
  brushSettings: BrushSettings;
  labelClasses: LabelClass[];
  onMeshDataChange: (meshData: MeshData) => void;
  isEraseModeActive: boolean;
  appMode: AppMode;
  painClass?: LabelClass;
}

const MeshPainter: React.FC<MeshPainterProps> = ({
  meshData,
  fileName,
  isPaintModeActive,
  activeClass,
  brushSettings,
  labelClasses,
  onMeshDataChange,
  isEraseModeActive,
  appMode,
  painClass
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, gl } = useThree();
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [vertexColors, setVertexColors] = useState<Float32Array | null>(null);
  const [originalColors, setOriginalColors] = useState<Float32Array | null>(null);
  const [meshLabelVertices, setMeshLabelVertices] = useState<Map<number, string>>(new Map());
  const [painAreaVertices, setPainAreaVertices] = useState<Map<number, string>>(new Map());
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
        setMeshLabelVertices(new Map());
        setPainAreaVertices(new Map());
        setIsLoading(false);

        // Notify parent of mesh data
        onMeshDataChange({
          geometry: loadedGeometry,
          vertexColors: colors,
          originalColors: new Float32Array(colors),
          meshLabelVertices: new Map(),
          painAreaVertices: new Map()
        });
      } catch (error) {
        console.error('Error loading mesh:', error);
        setIsLoading(false);
      }
    };

    loadMesh();
  }, [meshData, fileName, onMeshDataChange]);

  // Update vertex colors when classes change or vertices are painted
  useEffect(() => {
    if (!geometry || !vertexColors || !originalColors) return;

    const newColors = new Float32Array(originalColors);
    
    // First apply mesh label colors
    meshLabelVertices.forEach((classId, vertexIndex) => {
      const labelClass = labelClasses.find(cls => cls.id === classId);
      if (labelClass && labelClass.visible) {
        const rgb = hexToRgb(labelClass.color);
        const colorIndex = vertexIndex * 3;
        newColors[colorIndex] = rgb.r;
        newColors[colorIndex + 1] = rgb.g;
        newColors[colorIndex + 2] = rgb.b;
      }
    });

    // Then apply pain area colors (with precedence over mesh labels)
    painAreaVertices.forEach((classId, vertexIndex) => {
      if (painClass && painClass.visible) {
        const rgb = hexToRgb(painClass.color);
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
  }, [labelClasses, meshLabelVertices, painAreaVertices, geometry, originalColors, painClass]);

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
      if (isPaintModeActive || isEraseModeActive) {
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
  }, [gl, isPaintModeActive, isEraseModeActive]);

  // Painting/Erasing logic
  const paintAtPoint = useCallback((intersectionPoint: THREE.Vector3, shouldErase: boolean = false) => {
    if (!geometry || !vertexColors || !originalColors) return;
    if (!shouldErase && !activeClass) return;

    const affectedVertices = getVerticesInRadius(geometry, intersectionPoint, brushSettings.size);
    
    // Determine which map to modify based on app mode
    const currentMeshLabelVertices = new Map(meshLabelVertices);
    const currentPainAreaVertices = new Map(painAreaVertices);
    
    affectedVertices.forEach(vertexIndex => {
      const positions = geometry.attributes.position;
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(positions, vertexIndex);
      
      const distance = vertex.distanceTo(intersectionPoint);
      const strength = calculateBrushStrength(distance, brushSettings.size, brushSettings.falloff, brushSettings.strength);
      
      if (strength > 0) {
        if (shouldErase) {
          // Erase: remove from the appropriate map based on app mode
          if (appMode === 'mesh-labeling') {
            currentMeshLabelVertices.delete(vertexIndex);
          } else {
            currentPainAreaVertices.delete(vertexIndex);
          }
        } else if (activeClass) {
          // Paint: add to the appropriate map based on app mode
          if (appMode === 'mesh-labeling') {
            currentMeshLabelVertices.set(vertexIndex, activeClass.id);
          } else {
            currentPainAreaVertices.set(vertexIndex, activeClass.id);
          }
        }
      }
    });

    // Update the state
    setMeshLabelVertices(currentMeshLabelVertices);
    setPainAreaVertices(currentPainAreaVertices);

    // Update parent with the new mesh data
    onMeshDataChange({
      geometry,
      vertexColors: vertexColors!,
      originalColors: originalColors!,
      meshLabelVertices: currentMeshLabelVertices,
      painAreaVertices: currentPainAreaVertices
    });
  }, [geometry, vertexColors, originalColors, activeClass, brushSettings, meshLabelVertices, painAreaVertices, appMode, onMeshDataChange]);

  // Handle painting/erasing on mouse move
  useFrame(() => {
    if (!(isPaintModeActive || isEraseModeActive) || !meshRef.current) return;
    if (!isMouseDown || isRightMouseDown) return; // Don't paint when right mouse is down

    raycaster.setFromCamera(mouseRef.current, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    
    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point;
      
      // Continuous painting/erasing - only paint if we've moved enough
      if (!lastPaintPoint.current || lastPaintPoint.current.distanceTo(intersectionPoint) > brushSettings.size * 0.1) {
        const shouldErase = isEraseModeActive;
        paintAtPoint(intersectionPoint, shouldErase);
        lastPaintPoint.current = intersectionPoint.clone();
      }
    }
  });

  // Update cursor
  useEffect(() => {
    const canvas = gl.domElement;
    if (isPaintModeActive || isEraseModeActive) {
      if (isEraseModeActive) {
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
  }, [isPaintModeActive, isEraseModeActive, activeClass, gl]);

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
        enabled={!isPaintModeActive && !isEraseModeActive || isRightMouseDown} // Allow rotation when right mouse is down or not painting
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
      {(isPaintModeActive || isEraseModeActive) && (activeClass || isEraseModeActive) && (
        <mesh position={[0, 2.5, 0]}>
          <ringGeometry args={[brushSettings.size * 0.9, brushSettings.size, 32]} />
          <meshBasicMaterial 
            color={isEraseModeActive ? "#EF4444" : (activeClass?.color || "#666666")} 
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