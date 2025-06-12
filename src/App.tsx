import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Upload, Play, Square, RotateCcw, Eraser, Palette, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import MeshPainter from './components/MeshPainter';
import BrushSettingsPanel from './components/BrushSettings';
import LabelClasses from './components/LabelClasses';
import ExportPanel from './components/ExportPanel';
import PainAssessmentPanel from './components/PainAssessmentPanel';
import { LabelClass, BrushSettings, MeshData, AppMode } from './types';

function App() {
  const [meshData, setMeshData] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isPainting, setIsPainting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [meshDataState, setMeshDataState] = useState<MeshData | null>(null);
  const [appMode, setAppMode] = useState<AppMode>('mesh-labeling');
  
  // Label classes for mesh labeling
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>([
    { id: '1', name: 'Region 1', color: '#EF4444', visible: true },
    { id: '2', name: 'Region 2', color: '#3B82F6', visible: true },
    { id: '3', name: 'Region 3', color: '#10B981', visible: true }
  ]);
  const [activeClassId, setActiveClassId] = useState<string | null>('1');
  
  // Pain assessment - single problem area class
  const painClass: LabelClass = { id: 'pain', name: 'Problem Area', color: '#EF4444', visible: true };
  
  // Brush settings
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 0.1,
    strength: 0.8,
    falloff: 'smooth'
  });

  // Keyboard event handler for P key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only toggle if we have mesh data and the key is 'p' or 'P'
      if (meshData && (event.key === 'p' || event.key === 'P')) {
        // Prevent default behavior and don't trigger if user is typing in an input
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        
        event.preventDefault();
        togglePaintMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [meshData, isPainting, isErasing]);

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
        setAppMode('mesh-labeling'); // Start with mesh labeling
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const activeClass = appMode === 'mesh-labeling' 
    ? labelClasses.find(cls => cls.id === activeClassId) || null
    : painClass;

  const currentLabelClasses = appMode === 'mesh-labeling' ? labelClasses : [painClass];

  // Get painted vertices count based on current mode
  const getPaintedVerticesCount = () => {
    if (!meshDataState) return 0;
    
    if (appMode === 'mesh-labeling') {
      return meshDataState.meshLabelVertices?.size || 0;
    } else {
      return meshDataState.painAreaVertices?.size || 0;
    }
  };

  const resetAll = () => {
    setMeshData(null);
    setFileName('');
    setIsPainting(false);
    setIsErasing(false);
    setMeshDataState(null);
    setActiveClassId('1');
    setAppMode('mesh-labeling');
  };

  const clearLabels = () => {
    if (meshDataState) {
      const clearedMeshData = {
        ...meshDataState,
        vertexColors: new Float32Array(meshDataState.originalColors),
      };

      // Clear the appropriate vertex map based on current mode
      if (appMode === 'mesh-labeling') {
        clearedMeshData.meshLabelVertices = new Map();
      } else {
        clearedMeshData.painAreaVertices = new Map();
      }

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

  const switchMode = (newMode: AppMode) => {
    setAppMode(newMode);
    setIsPainting(false);
    setIsErasing(false);
    if (newMode === 'pain-assessment') {
      setActiveClassId('pain');
    } else {
      setActiveClassId('1');
    }
  };

  const getModeTitle = () => {
    return appMode === 'mesh-labeling' ? 'Mesh Labeling' : 'Pain Assessment';
  };

  const getModeDescription = () => {
    return appMode === 'mesh-labeling' 
      ? 'Label different regions of your 3D mesh'
      : 'Mark areas that are causing discomfort or pain';
  };

  const getModeIcon = () => {
    return appMode === 'mesh-labeling' ? <Palette className="w-6 h-6" /> : <Heart className="w-6 h-6" />;
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Header with Mode Switcher */}
        <div className={`p-6 border-b border-gray-200 ${
          appMode === 'mesh-labeling' 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
            : 'bg-gradient-to-r from-red-500 to-pink-600'
        } text-white`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {getModeIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{getModeTitle()}</h1>
              <p className="text-sm opacity-90">{getModeDescription()}</p>
            </div>
          </div>
          
          {meshData && (
            <div className="flex gap-2">
              <button
                onClick={() => switchMode('mesh-labeling')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  appMode === 'mesh-labeling'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                <Palette className="w-4 h-4" />
                Mesh Labels
              </button>
              <button
                onClick={() => switchMode('pain-assessment')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  appMode === 'pain-assessment'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                <Heart className="w-4 h-4" />
                Pain Areas
              </button>
            </div>
          )}
        </div>

        {/* File Upload */}
        <div className="p-6 border-b border-gray-200">
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            appMode === 'mesh-labeling'
              ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
              : 'border-red-300 bg-red-50 hover:bg-red-100'
          }`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className={`w-8 h-8 mb-2 ${
                appMode === 'mesh-labeling' ? 'text-blue-400' : 'text-red-400'
              }`} />
              <p className={`mb-2 text-sm ${
                appMode === 'mesh-labeling' ? 'text-blue-600' : 'text-red-600'
              }`}>
                <span className="font-semibold">Click to upload 3D model</span>
              </p>
              <p className={`text-xs ${
                appMode === 'mesh-labeling' ? 'text-blue-500' : 'text-red-500'
              }`}>STL or OBJ files</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".stl,.obj"
              onChange={handleFileUpload}
            />
          </label>
          {fileName && (
            <div className={`mt-3 p-2 border rounded ${
              appMode === 'mesh-labeling'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm truncate ${
                appMode === 'mesh-labeling' ? 'text-blue-800' : 'text-red-800'
              }`}>
                <strong>File:</strong> {fileName}
              </p>
            </div>
          )}
        </div>

        {/* Painting Controls */}
        {meshData && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tools</h3>
              <span className="text-sm text-gray-500">
                {getPaintedVerticesCount()} {appMode === 'mesh-labeling' ? 'vertices painted' : 'areas marked'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={togglePaintMode}
                disabled={appMode === 'mesh-labeling' && !activeClass && !isPainting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isPainting && !isErasing
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : appMode === 'mesh-labeling'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isPainting && !isErasing ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop {appMode === 'mesh-labeling' ? 'Paint' : 'Marking'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    {appMode === 'mesh-labeling' ? 'Paint' : 'Mark Areas'}
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
                disabled={!getPaintedVerticesCount()}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Clear {appMode === 'mesh-labeling' ? 'Labels' : 'Areas'}
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
            <div className={`mt-4 p-3 border rounded-lg ${
              appMode === 'mesh-labeling'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                appMode === 'mesh-labeling' ? 'text-blue-800' : 'text-red-800'
              }`}>Controls:</p>
              <ul className={`text-xs space-y-1 ${
                appMode === 'mesh-labeling' ? 'text-blue-700' : 'text-red-700'
              }`}>
                <li>• <strong>P key:</strong> Toggle paint mode on/off</li>
                <li>• Left click: {appMode === 'mesh-labeling' ? 'Paint/Erase' : 'Mark/Erase areas'}</li>
                <li>• Right click + drag: Rotate view</li>
                <li>• Scroll: Zoom in/out</li>
                <li>• Middle click + drag: Pan view</li>
              </ul>
            </div>

            {appMode === 'mesh-labeling' && isPainting && !activeClass && !isErasing && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Select a label class to start painting
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mode-specific panels */}
        {meshData && appMode === 'mesh-labeling' && (
          <>
            <LabelClasses
              classes={labelClasses}
              activeClassId={activeClassId}
              onClassesChange={setLabelClasses}
              onActiveClassChange={setActiveClassId}
            />
            <BrushSettingsPanel
              settings={brushSettings}
              onSettingsChange={setBrushSettings}
            />
            <ExportPanel
              meshData={meshDataState}
              labelClasses={labelClasses}
              fileName={fileName}
            />
          </>
        )}

        {meshData && appMode === 'pain-assessment' && (
          <>
            <BrushSettingsPanel
              settings={brushSettings}
              onSettingsChange={setBrushSettings}
            />
            <PainAssessmentPanel
              meshData={meshDataState}
              fileName={fileName}
            />
          </>
        )}
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 relative">
        {meshData ? (
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            className={`${
              appMode === 'mesh-labeling'
                ? 'bg-gradient-to-br from-gray-100 to-blue-100'
                : 'bg-gradient-to-br from-gray-100 to-red-100'
            }`}
          >
            <MeshPainter
              meshData={meshData}
              fileName={fileName}
              isPainting={isPainting || isErasing}
              activeClass={activeClass}
              brushSettings={brushSettings}
              labelClasses={currentLabelClasses}
              onMeshDataChange={setMeshDataState}
              isErasing={isErasing}
              appMode={appMode}
              painClass={painClass}
            />
          </Canvas>
        ) : (
          <div className={`flex items-center justify-center h-full ${
            appMode === 'mesh-labeling'
              ? 'bg-gradient-to-br from-gray-100 to-blue-100'
              : 'bg-gradient-to-br from-gray-100 to-red-100'
          }`}>
            <div className="text-center">
              <div className="mb-6 p-4 bg-white/80 rounded-full">
                {getModeIcon()}
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                {appMode === 'mesh-labeling' ? '3D Mesh Labeling' : 'Pain Area Assessment'}
              </h2>
              <p className="text-gray-600 mb-4">
                {appMode === 'mesh-labeling' 
                  ? 'Upload a 3D model to start labeling different regions'
                  : 'Upload an anatomical model to begin marking problem areas'
                }
              </p>
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