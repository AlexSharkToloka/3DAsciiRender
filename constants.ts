import { ModelData, AsciiSettings } from './types';

// Updated with high-availability GitHub Raw URLs from Khronos Group
export const MODELS: ModelData[] = [
  {
    name: "Fox",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb",
    baseScale: 0.025,
    position: [0, -0.7, 0],
    rotation: [0, 0.5, 0]
  },
  {
    name: "Avocado",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
    baseScale: 30,
    position: [0, -0.5, 0],
  },
  {
    name: "BoomBox",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb",
    baseScale: 80,
    position: [0, 0.2, 0],
    rotation: [0, Math.PI, 0]
  },
  {
    name: "Duck",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
    baseScale: 3,
    position: [0, -0.8, 0],
  },
];

export const DEFAULT_SETTINGS: AsciiSettings = {
  resolution: 0.2,
  characters: " .:-=+*#%@",
  // Default: Black Text on White Background (Inverted)
  fgColor: "#000000",
  bgColor: "#ffffff",
  invert: true,
};

export const PRESET_CHARSETS = {
  standard: " .:-=+*#%@",
  binary: " 01",
  blocks: " ░▒▓█",
  minimal: " .",
  slashes: " /\\|",
};