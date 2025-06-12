import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Upload, Play, Square, RotateCcw, Eraser, MapPin, Heart } from 'lucide-react';
import MeshPainter from './components/MeshPainter';
import BrushSettingsPanel from './components/BrushSettings';
import PainAssessmentPanel from './components/PainAssessmentPanel';
import { BrushSettings, MeshData } from './types';

function App() {
  const [meshData, setMeshData] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isPainting, setIsPainting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [meshDataState, setMeshDataState] = useState<MeshData | null>(null);
  
  // Brush settings
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 0.1,
    strength: 0.8,
    falloff: 'smooth'
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as ArrayBuffer;
        setMeshData(result);
        setMeshDataState(null);
        setIsPainting(false);
        setIsErasing(false);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const resetAll = () => {
    setMeshData(null);
    setFileName('');
    setIsPainting(false);
    setIsErasing(false);
    setMeshDataState(null);
  };

  const clearProblemAreas = () => {
    if (meshDataState) {
      const clearedMeshData = {
        ...meshDataState,
        vertexColors: new Float32Array(meshDataState.originalColors),
        paintedVertices: new Set()
      };
      setMeshDataState(clearedMeshData);
    }
  };

  const togglePaintMode = () => {
    if (isErasing) {
      setIsErasing(false);
      setIsPainting(true);
    } else if (isPainting) {
      setIsPainting(false);
    } else {
      setIsPainting(true);
    }
  };

  const toggleEraseMode = () => {
    if (isPainting) {
      setIsPainting(false);
      setIsErasing(true);
    } else if (isErasing) {
      setIsErasing(false);
    } else {
      setIsErasing(true);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-red-50 flex">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-xl border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-500 to-pink-600 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Problem Area Mapper</h1>
              <p className="text-red-100 text-sm">Medical Assessment Tool</p>
            </div>
          </div>
          <p className="text-sm text-red-100">Upload anatomical models and mark areas that are bothering you</p>
        </div>

        {/* File Upload */}
        <div className="p-6 border-b border-gray-200">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-red-300 rounded-lg cursor-pointer bg-red-50 hover:bg-red-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-red-400" />
              <p className="mb-2 text-sm text-red-600">
                <span className="font-semibold">Click to upload anatomical model</span>
              </p>
              <p className="text-xs text-red-500">STL or OBJ files supported</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".stl,.obj"
              onChange={handleFileUpload}
            />
          </label>
          {fileName && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 truncate">
                <strong>Model:</strong> {fileName}
              </p>
            </div>
          )}
        </div>

        {/* Painting Controls */}
        {meshData && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Problem Area Tools
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {meshDataState?.paintedVertices.size || 0} areas marked
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={togglePaintMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isPainting && !isErasing
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPainting && !isErasing ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop Marking
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Mark Areas
                  </>
                )}
              </button>

              <button
                onClick={toggleEraseMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isErasing
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                {isErasing ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop Erase
                  </>
                ) : (
                  <>
                    <Eraser className="w-4 h-4" />
                    Erase
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearProblemAreas}
                disabled={!meshDataState?.paintedVertices.size}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={resetAll}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">How to use:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Click "Mark Areas" to start painting</li>
                <li>• Left click: Mark problem areas</li>
                <li>• Right click + drag: Rotate view</li>
                <li>• Scroll: Zoom in/out</li>
                <li>• Use "Erase" to remove marked areas</li>
              </ul>
            </div>
          </div>
        )}

        {/* Brush Settings */}
        {meshData && (
          <BrushSettingsPanel
            settings={brushSettings}
            onSettingsChange={setBrushSettings}
          />
        )}

        {/* Assessment Panel */}
        {meshData && (
          <PainAssessmentPanel
            meshData={meshDataState}
            fileName={fileName}
          />
        )}
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 relative">
        {meshData ? (
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            className="bg-gradient-to-br from-gray-100 to-blue-100"
          >
            <MeshPainter
              meshData={meshData}
              fileName={fileName}
              isPainting={isPainting || isErasing}
              brushSettings={brushSettings}
              onMeshDataChange={setMeshDataState}
              isErasing={isErasing}
            />
          </Canvas>
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-blue-100">
            <div className="text-center">
              <div className="mb-6 p-4 bg-white/80 rounded-full">
                <MapPin className="w-16 h-16 text-red-400 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Problem Area Assessment</h2>
              <p className="text-gray-600 mb-4">Upload an anatomical model to begin marking problem areas</p>
              <div className="text-sm text-gray-500 bg-white/60 p-3 rounded-lg max-w-md mx-auto">
                <p className="font-medium mb-1">Supported formats:</p>
                <p>• STL files (3D models)</p>
                <p>• OBJ files (3D models)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;