import React, { useState } from 'react';
import { AsciiSettings } from '../types';
import { MODELS, PRESET_CHARSETS } from '../constants';
import { Monitor, Type, Palette, Move, RotateCcw, Share2, X, Copy, Check, Download, FileCode, Plus, Link as LinkIcon, Upload, ArrowRightLeft, ArrowUpDown } from 'lucide-react';

interface ControlPanelProps {
  currentModelUrl: string;
  onModelChange: (url: string) => void;
  settings: AsciiSettings;
  onSettingsChange: (settings: AsciiSettings) => void;
  userScale: number;
  onUserScaleChange: (scale: number) => void;
  userPosition: { x: number, y: number };
  onUserPositionChange: (pos: { x: number, y: number }) => void;
  onReset: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentModelUrl,
  onModelChange,
  settings,
  onSettingsChange,
  userScale,
  onUserScaleChange,
  userPosition,
  onUserPositionChange,
  onReset,
  isOpen,
  toggleOpen
}) => {
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const updateSetting = <K extends keyof AsciiSettings>(key: K, value: AsciiSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onModelChange(customUrl.trim());
    }
  };

  const getEmbedUrl = () => {
    const modelName = MODELS.find(m => m.url === currentModelUrl)?.name || 'Custom';
    const params = new URLSearchParams({
      embed: 'true',
      model: modelName,
      res: settings.resolution.toString(),
      chars: settings.characters,
      fg: encodeURIComponent(settings.fgColor),
      bg: encodeURIComponent(settings.bgColor),
      inv: settings.invert.toString(),
      scale: userScale.toString(),
      posX: userPosition.x.toString(),
      posY: userPosition.y.toString()
    });
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const getIframeCode = () => {
    const url = getEmbedUrl();
    return `<iframe src="${url}" width="100%" height="500px" frameborder="0" style="border-radius: 8px; background: ${settings.bgColor};"></iframe>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getIframeCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateStandaloneHtml = () => {
    const modelData = MODELS.find(m => m.url === currentModelUrl) || { 
      name: 'Custom', 
      url: currentModelUrl, 
      baseScale: 1, 
      position: [0,0,0], 
      rotation: [0,0,0] 
    };
    
    // Combine base position with user offset for the baked export
    const finalPosition = [
      modelData.position[0] + userPosition.x,
      modelData.position[1] + userPosition.y,
      modelData.position[2]
    ];
    
    const finalScale = modelData.baseScale * userScale;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ASCII 3D Standalone</title>
  <style>
    body { margin: 0; background: ${settings.bgColor}; color: ${settings.fgColor}; overflow: hidden; }
    #root { width: 100vw; height: 100vh; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18.2.0",
        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
        "three": "https://esm.sh/three@0.160.0",
        "@react-three/fiber": "https://esm.sh/@react-three/fiber@8.15.12?external=react,react-dom,three",
        "@react-three/drei": "https://esm.sh/@react-three/drei@9.99.0?external=react,react-dom,three,@react-three/fiber"
      }
    }
  </script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    import React, { Suspense } from 'react';
    import { createRoot } from 'react-dom/client';
    import { Canvas } from '@react-three/fiber';
    import { OrbitControls, AsciiRenderer, useGLTF } from '@react-three/drei';

    const MODEL_URL = "${currentModelUrl}";
    const SCALE = ${finalScale};
    const POSITION = ${JSON.stringify(finalPosition)};
    const ROTATION = ${JSON.stringify(modelData.rotation || [0,0,0])};
    
    const SETTINGS = {
      resolution: ${settings.resolution},
      characters: "${settings.characters.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",
      fgColor: "${settings.fgColor}",
      bgColor: "${settings.bgColor}",
      invert: ${settings.invert}
    };

    function Model() {
      const { scene } = useGLTF(MODEL_URL);
      return (
        <primitive 
          object={scene} 
          scale={[SCALE, SCALE, SCALE]} 
          position={POSITION}
          rotation={ROTATION}
        />
      );
    }

    function App() {
      return (
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }} gl={{ preserveDrawingBuffer: true, alpha: false }}>
          <color attach="background" args={[SETTINGS.bgColor]} />
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <Suspense fallback={null}>
            <Model />
          </Suspense>
          <AsciiRenderer 
            fgColor={SETTINGS.fgColor}
            bgColor={SETTINGS.bgColor}
            resolution={SETTINGS.resolution}
            characters={SETTINGS.characters}
            invert={SETTINGS.invert}
          />
          <OrbitControls autoRotate autoRotateSpeed={1.5} enableZoom minDistance={2} maxDistance={10} />
        </Canvas>
      );
    }

    const root = createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`;
  };

  const handleDownload = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ascii-3d-scene.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button 
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-40 p-4 bg-white text-black rounded-full shadow-lg md:hidden hover:scale-105 transition-transform"
      >
         <Monitor size={24} />
      </button>

      {showEmbedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Share2 size={18} className="text-emerald-400"/> 
                PUBLISH / EXPORT
              </h3>
              <button onClick={() => setShowEmbedModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                 <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode size={16} className="text-emerald-400"/> 
                    Standalone HTML File
                 </h4>
                 <p className="text-xs text-neutral-400">Download a single .html file with the current scene baked in.</p>
                 <button 
                    onClick={handleDownload}
                    className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                 >
                   <Download size={16} />
                   DOWNLOAD .HTML
                 </button>
              </div>
              <div className="border-t border-neutral-800"></div>
              <div className="space-y-2">
                 <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Share2 size={16} className="text-blue-400"/> 
                    Live Embed Code
                 </h4>
                 <div className="relative group">
                    <textarea 
                      readOnly 
                      value={getIframeCode()}
                      className="w-full h-24 bg-black border border-neutral-800 rounded-lg p-3 text-xs font-mono text-blue-400 focus:outline-none resize-none"
                    />
                    <button 
                      onClick={handleCopy}
                      className="absolute top-2 right-2 p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-white transition-colors"
                    >
                      {copied ? <Check size={16} className="text-green-400"/> : <Copy size={16} />}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`
        fixed top-0 right-0 h-full w-full md:w-80 bg-neutral-900/95 backdrop-blur-md border-l border-white/10
        transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 space-y-8 pb-20">
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
              <Monitor className="text-emerald-400" size={20} />
              SETTINGS
            </h2>
            <button onClick={toggleOpen} className="md:hidden text-neutral-400 hover:text-white">
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Select Model</label>
            <div className="grid grid-cols-1 gap-2">
              {MODELS.map((model) => (
                <button
                  key={model.url}
                  onClick={() => onModelChange(model.url)}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-sm
                    ${currentModelUrl === model.url 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white'}
                  `}
                >
                  <span>{model.name}</span>
                  {currentModelUrl === model.url && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-neutral-800">
             <label className="text-[10px] text-neutral-500 uppercase flex items-center gap-1">
               <LinkIcon size={10} /> Load Custom GLB URL
             </label>
             <form onSubmit={handleCustomUrlSubmit} className="flex gap-2">
               <input
                 type="url"
                 value={customUrl}
                 onChange={(e) => setCustomUrl(e.target.value)}
                 placeholder="https://example.com/model.glb"
                 className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
               />
               <button 
                 type="submit"
                 className="bg-neutral-800 hover:bg-neutral-700 text-white rounded px-3 transition-colors flex items-center justify-center"
                 title="Load Model"
               >
                 <Upload size={14} />
               </button>
             </form>
          </div>

          <hr className="border-neutral-800" />

          {/* Transform Controls */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Move size={14} /> Transform
              </label>
            </div>
            
            <div className="space-y-4">
              {/* Scale */}
              <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>SCALE</span>
                    <span className="font-mono text-emerald-400">x{userScale.toFixed(2)}</span>
                 </div>
                 <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={userScale}
                    onChange={(e) => onUserScaleChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                 />
              </div>

              {/* Position X */}
              <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1"><ArrowRightLeft size={10}/> POS X</span>
                    <span className="font-mono text-emerald-400">{userPosition.x.toFixed(2)}</span>
                 </div>
                 <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.05"
                    value={userPosition.x}
                    onChange={(e) => onUserPositionChange({ ...userPosition, x: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                 />
              </div>

              {/* Position Y */}
              <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1"><ArrowUpDown size={10}/> POS Y</span>
                    <span className="font-mono text-emerald-400">{userPosition.y.toFixed(2)}</span>
                 </div>
                 <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.05"
                    value={userPosition.y}
                    onChange={(e) => onUserPositionChange({ ...userPosition, y: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                 />
              </div>
            </div>
          </div>

          <hr className="border-neutral-800" />

          {/* Rendering Controls */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                 <Monitor size={14} /> Rendering
               </label>
               <span className="text-xs text-emerald-400 font-mono">{(settings.resolution * 100).toFixed(0)}%</span>
            </div>
            
            <div className="space-y-1">
               <span className="text-[10px] text-neutral-400">DENSITY</span>
               <input
                 type="range"
                 min="0.05"
                 max="0.4"
                 step="0.01"
                 value={settings.resolution}
                 onChange={(e) => updateSetting('resolution', parseFloat(e.target.value))}
                 className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
               />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} /> Character Set
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESET_CHARSETS).map(([name, chars]) => (
                <button
                  key={name}
                  onClick={() => updateSetting('characters', chars)}
                  className={`
                    px-2 py-1 text-xs rounded border transition-colors
                    ${settings.characters === chars
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-neutral-800 text-neutral-400 border-transparent hover:border-neutral-600'}
                  `}
                >
                  {name}
                </button>
              ))}
            </div>
            <input 
              type="text" 
              value={settings.characters}
              onChange={(e) => updateSetting('characters', e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} /> Colors
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase">Foreground</span>
                <div 
                   className="flex items-center gap-2 bg-neutral-950 p-2 rounded border border-neutral-800"
                   style={{ borderColor: settings.fgColor }}
                >
                   <input 
                      type="color" 
                      value={settings.fgColor}
                      onChange={(e) => updateSetting('fgColor', e.target.value)}
                      className="h-6 w-6 bg-transparent border-0 rounded cursor-pointer p-0"
                   />
                   <span className="text-xs font-mono text-neutral-400">{settings.fgColor}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase">Background</span>
                <div 
                   className="flex items-center gap-2 bg-neutral-950 p-2 rounded border border-neutral-800"
                   style={{ borderColor: settings.bgColor }}
                >
                   <input 
                      type="color" 
                      value={settings.bgColor}
                      onChange={(e) => updateSetting('bgColor', e.target.value)}
                      className="h-6 w-6 bg-transparent border-0 rounded cursor-pointer p-0"
                   />
                   <span className="text-xs font-mono text-neutral-400">{settings.bgColor}</span>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800 transition-colors">
              <input 
                type="checkbox"
                checked={settings.invert}
                onChange={(e) => updateSetting('invert', e.target.checked)}
                className="w-4 h-4 rounded border-neutral-600 text-emerald-500 focus:ring-emerald-500/50 bg-neutral-900"
              />
              <span className="text-sm text-white">Invert Luminance</span>
            </label>
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={() => setShowEmbedModal(true)}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
            >
              <Share2 size={16} />
              PUBLISH / EXPORT
            </button>
            <button
              onClick={onReset}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-neutral-400 hover:text-white border border-neutral-800 hover:border-white rounded-lg transition-all"
            >
              <RotateCcw size={16} />
              RESET DEFAULT
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;