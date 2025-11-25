import React, { useState, Suspense, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AsciiRenderer, useProgress, useGLTF } from '@react-three/drei';
import { MODELS, DEFAULT_SETTINGS } from './constants';
import { AsciiSettings } from './types';
import SceneModel from './components/SceneModel';
import ControlPanel from './components/ControlPanel';

function Loader() {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <div className="text-center">
         <div className="text-6xl font-bold text-neutral-800 opacity-20 animate-pulse">{progress.toFixed(0)}%</div>
         <div className="text-xs text-neutral-500 mt-2 font-mono">LOADING GEOMETRY...</div>
      </div>
    </div>
  );
}

export default function App() {
  // 1. Parse URL Parameters for Initial State
  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
      embed: params.get('embed') === 'true',
      modelName: params.get('model'),
      resolution: params.get('res') ? parseFloat(params.get('res')!) : null,
      chars: params.get('chars'),
      fg: params.get('fg') ? decodeURIComponent(params.get('fg')!) : null,
      bg: params.get('bg') ? decodeURIComponent(params.get('bg')!) : null,
      inv: params.get('inv') !== null ? params.get('inv') === 'true' : null,
      scale: params.get('scale') ? parseFloat(params.get('scale')!) : null,
      posX: params.get('posX') ? parseFloat(params.get('posX')!) : 0,
      posY: params.get('posY') ? parseFloat(params.get('posY')!) : 0,
    };
  }, []);

  // 2. Initialize State based on URL or Defaults
  const [selectedModelUrl, setSelectedModelUrl] = useState(() => {
    const found = MODELS.find(m => m.name === initialParams.modelName);
    return found ? found.url : MODELS[0].url;
  });
  
  const [userScale, setUserScale] = useState(initialParams.scale || 1);
  const [userPosition, setUserPosition] = useState({ x: initialParams.posX, y: initialParams.posY });
  
  const [asciiSettings, setAsciiSettings] = useState<AsciiSettings>({
    resolution: initialParams.resolution || DEFAULT_SETTINGS.resolution,
    characters: initialParams.chars || DEFAULT_SETTINGS.characters,
    fgColor: initialParams.fg || DEFAULT_SETTINGS.fgColor,
    bgColor: initialParams.bg || DEFAULT_SETTINGS.bgColor,
    invert: initialParams.inv !== null ? initialParams.inv : DEFAULT_SETTINGS.invert,
  });

  const [isPanelOpen, setIsPanelOpen] = useState(!initialParams.embed);

  // Sync Body Background/Color to prevent white flashes or CSS overrides
  useEffect(() => {
    document.body.style.backgroundColor = asciiSettings.bgColor;
    document.body.style.color = asciiSettings.fgColor;
  }, [asciiSettings.bgColor, asciiSettings.fgColor]);

  // Derive current model data object (handle custom URLs not in the list)
  const currentModel = useMemo(() => {
    const found = MODELS.find((m) => m.url === selectedModelUrl);
    if (found) return found;
    
    // Fallback for custom URL
    return {
      name: "Custom Model",
      url: selectedModelUrl,
      baseScale: 1,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number]
    };
  }, [selectedModelUrl]);

  const handleModelChange = (url: string) => {
    if (selectedModelUrl && selectedModelUrl !== url) {
      try {
        useGLTF.clear(selectedModelUrl);
      } catch (e) {
        console.warn("Could not clear GLTF cache", e);
      }
    }
    setSelectedModelUrl(url);
  };

  const handleReset = () => {
    setAsciiSettings(DEFAULT_SETTINGS);
    setUserScale(1);
    setUserPosition({ x: 0, y: 0 });
    setSelectedModelUrl(MODELS[0].url);
  };

  // Create a key for the AsciiRenderer to force re-instantiation on setting changes
  const asciiKey = `${asciiSettings.resolution}-${asciiSettings.characters}-${asciiSettings.fgColor}-${asciiSettings.bgColor}-${asciiSettings.invert}`;
  
  // Check if we are in embed mode
  const isEmbedMode = initialParams.embed;

  return (
    <div 
      className="relative w-full h-screen overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200"
      style={{ backgroundColor: asciiSettings.bgColor }}
    >
      
      {/* Loading Indicator Overlay */}
      <Suspense fallback={<Loader />}>
         {/* Invisible Suspense wrapper to trigger the loader */}
      </Suspense>

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          // alpha: false ensures we have a solid background color for the ASCII effect to read
          gl={{ preserveDrawingBuffer: true, alpha: false, antialias: true }}
          onCreated={({ gl }) => {
            const width = Math.floor(gl.domElement.clientWidth);
            const height = Math.floor(gl.domElement.clientHeight);
            gl.setSize(width, height);
            gl.setPixelRatio(window.devicePixelRatio);
          }}
        >
          <color attach="background" args={[asciiSettings.bgColor]} />
          
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Suspense fallback={null}>
            <SceneModel 
              key={selectedModelUrl} 
              modelData={currentModel} 
              scaleMultiplier={userScale} 
              positionOffset={userPosition}
            />
          </Suspense>

          <OrbitControls 
            enableZoom={true} 
            enablePan={false}
            autoRotate={true}
            autoRotateSpeed={1.5}
            minDistance={2}
            maxDistance={10}
          />

          <Suspense fallback={null}>
            <AsciiRenderer
              key={asciiKey}
              fgColor={asciiSettings.fgColor}
              bgColor={asciiSettings.bgColor}
              resolution={asciiSettings.resolution}
              characters={asciiSettings.characters}
              invert={asciiSettings.invert}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Controls Overlay - Completely hide in embed mode */}
      {!isEmbedMode && (
        <ControlPanel 
          currentModelUrl={selectedModelUrl}
          onModelChange={handleModelChange}
          settings={asciiSettings}
          onSettingsChange={setAsciiSettings}
          userScale={userScale}
          onUserScaleChange={setUserScale}
          userPosition={userPosition}
          onUserPositionChange={setUserPosition}
          onReset={handleReset}
          isOpen={isPanelOpen}
          toggleOpen={() => setIsPanelOpen(!isPanelOpen)}
        />
      )}
    </div>
  );
}