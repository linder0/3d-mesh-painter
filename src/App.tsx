import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Upload, Play, Square, RotateCcw, Eraser } from 'lucide-react';
import MeshPainter from './components/MeshPainter';
import BrushSettingsPanel from './components/BrushSettings';
import LabelClasses from './components/LabelClasses';
import ExportPanel from './components/ExportPanel';
import { LabelClass, BrushSettings, MeshData } from './types';

function App() {
  const [meshData, setMeshData] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isPainting, setIsPainting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [meshDataState, setMeshDataState] = useState<MeshData | null>(null);
  
  // Label classes
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>([
    { id: '1', name: 'Region 1', color: '#EF4444', visible: true },
    { id: '2', name: 'Region 2', color: '#3B82F6', visible: true },
    { id: '3', name: 'Region 3', color: '#10B981', visible: true }
  ]);
  const [activeClassId, setActiveClassId] = useState<string | null>('1');
  
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

  const activeClass = labelClasses.find(cls => cls.id === activeClassId) || null;

  const resetAll = () => {
    setMeshData(null);
    setFileName('');
    setIsPainting(false);
    setIsErasing(false);
    setMeshDataState(null);
    setActiveClassId('1');
  };

  const clearLabels = () => {
    if (meshDataState) {
      const clearedMeshData = {
        ...meshDataState,
        vertexColors: new Float32Array(meshDataState.originalColors),
        paintedVertices: new Map()
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
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mesh Painter</h1>
          <p className="text-sm text-gray-600">Upload a mesh and paint labels with your brush</p>
        </div>

        {/* File Upload */}
        <div className="p-6 border-b border-gray-200">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span>
              </p>
              <p className="text-xs text-gray-500">STL or OBJ files</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".stl,.obj"
              onChange={handleFileUpload}
            />
          </label>
          {fileName && (
            <p className="mt-2 text-sm text-gray-700 truncate">
              <strong>File:</strong> {fileName}
            </p>
          )}
        </div>

        {/* Painting Controls */}
        {meshData && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tools</h3>
              <span className="text-sm text-gray-500">
                {meshDataState?.paintedVertices.size || 0} vertices painted
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={togglePaintMode}
                disabled={!activeClass && !isPainting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isPainting && !isErasing
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:text-gray-500'
                }`}
              >
                {isPainting && !isErasing ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop Paint
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Paint
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
                onClick={clearLabels}
                disabled={!meshDataState?.paintedVertices.size}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Clear Labels
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
              <p className="text-sm text-blue-800 font-medium mb-1">Controls:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Left click: Paint/Erase</li>
                <li>• Right click + drag: Rotate view</li>
                <li>• Scroll: Zoom in/out</li>
                <li>• Middle click + drag: Pan view</li>
              </ul>
            </div>

            {isPainting && !activeClass && !isErasing && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Select a label class to start painting
                </p>
              </div>
            )}
          </div>
        )}

        {/* Label Classes */}
        {meshData && (
          <LabelClasses
            classes={labelClasses}
            activeClassId={activeClassId}
            onClassesChange={setLabelClasses}
            onActiveClassChange={setActiveClassId}
          />
        )}

        {/* Brush Settings */}
        {meshData && (
          <BrushSettingsPanel
            settings={brushSettings}
            onSettingsChange={setBrushSettings}
          />
        )}

        {/* Export Panel */}
        {meshData && (
          <ExportPanel
            meshData={meshDataState}
            labelClasses={labelClasses}
            fileName={fileName}
          />
        )}
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 relative">
        {meshData ? (
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            className="bg-gradient-to-br from-gray-100 to-gray-200"
          >
            <MeshPainter
              meshData={meshData}
              fileName={fileName}
              isPainting={isPainting || isErasing}
              activeClass={activeClass}
              brushSettings={brushSettings}
              labelClasses={labelClasses}
              onMeshDataChange={setMeshDataState}
              isErasing={isErasing}
            />
          </Canvas>
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">No Mesh Loaded</h2>
              <p className="text-gray-500">Upload an STL or OBJ file to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;