export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface LabelClass {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface PaintedVertex {
  index: number;
  classId: string;
  position: Vector3;
}

export interface MeshData {
  geometry: THREE.BufferGeometry;
  vertexColors: Float32Array;
  originalColors: Float32Array;
  paintedVertices: Map<number, string>; // vertex index -> class id
}

export interface BrushSettings {
  size: number;
  strength: number;
  falloff: 'linear' | 'smooth' | 'constant';
}