import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export const loadMeshFromFile = async (meshData: ArrayBuffer, fileName: string): Promise<THREE.BufferGeometry> => {
  let geometry: THREE.BufferGeometry;
  
  if (fileName.toLowerCase().endsWith('.stl')) {
    const loader = new STLLoader();
    geometry = loader.parse(meshData);
  } else if (fileName.toLowerCase().endsWith('.obj')) {
    const loader = new OBJLoader();
    const text = new TextDecoder().decode(meshData);
    const object = loader.parse(text);
    
    // Find the first valid mesh geometry in the OBJ object
    let foundGeometry: THREE.BufferGeometry | null = null;
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry && !foundGeometry) {
        const childGeometry = child.geometry;
        // Validate that the geometry has valid position data
        if (childGeometry.attributes.position && 
            childGeometry.attributes.position.count > 0 &&
            childGeometry.attributes.position.array.length > 0) {
          
          // Check for NaN values in position array
          const positions = childGeometry.attributes.position.array;
          let hasValidData = true;
          for (let i = 0; i < positions.length; i++) {
            if (isNaN(positions[i]) || !isFinite(positions[i])) {
              hasValidData = false;
              break;
            }
          }
          
          if (hasValidData) {
            foundGeometry = childGeometry;
          }
        }
      }
    });
    
    if (!foundGeometry) {
      throw new Error('No valid mesh geometry found in OBJ file');
    }
    
    geometry = foundGeometry;
  } else {
    throw new Error('Unsupported file format');
  }

  // Validate geometry before processing
  if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
    throw new Error('Invalid geometry: no position data');
  }

  // Check for NaN values in the geometry
  const positions = geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i++) {
    if (isNaN(positions[i]) || !isFinite(positions[i])) {
      throw new Error('Invalid geometry: contains NaN or infinite values');
    }
  }

  // Center and scale the geometry
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  
  // Prevent division by zero
  if (maxDim === 0) {
    throw new Error('Invalid geometry: zero-sized bounding box');
  }
  
  const scale = 2 / maxDim;

  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(scale, scale, scale);
  geometry.computeVertexNormals();

  return geometry;
};

export const initializeVertexColors = (geometry: THREE.BufferGeometry): Float32Array => {
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  
  // Initialize all vertices to white
  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = 0.7;     // R
    colors[i + 1] = 0.7; // G
    colors[i + 2] = 0.7; // B
  }
  
  return colors;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
};

export const getVerticesInRadius = (
  geometry: THREE.BufferGeometry,
  centerPoint: THREE.Vector3,
  radius: number
): number[] => {
  const positions = geometry.attributes.position;
  const vertices: number[] = [];
  const vertex = new THREE.Vector3();
  
  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    const distance = vertex.distanceTo(centerPoint);
    
    if (distance <= radius) {
      vertices.push(i);
    }
  }
  
  return vertices;
};

export const calculateBrushStrength = (
  distance: number,
  radius: number,
  falloff: 'linear' | 'smooth' | 'constant',
  baseStrength: number
): number => {
  if (distance > radius) return 0;
  
  const normalizedDistance = distance / radius;
  
  switch (falloff) {
    case 'constant':
      return baseStrength;
    case 'linear':
      return baseStrength * (1 - normalizedDistance);
    case 'smooth':
      return baseStrength * (1 - normalizedDistance * normalizedDistance);
    default:
      return baseStrength;
  }
};