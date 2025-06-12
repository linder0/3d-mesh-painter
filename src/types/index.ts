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

// Pain Assessment Types
export interface PainArea {
  index: number;
  painLevelId: string;
  position: Vector3;
  timestamp: Date;
}

export interface PainAssessment {
  id: string;
  patientName?: string;
  date: Date;
  meshFileName: string;
  painAreas: PainArea[];
  notes?: string;
  overallPainScore: number;
}

export interface LabeledPoint {
  id: string;
  label: string;
  position: Vector3;
  normal?: Vector3;
}

// Application Mode
export type AppMode = 'mesh-labeling' | 'pain-assessment';