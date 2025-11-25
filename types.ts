export interface ModelData {
  name: string;
  url: string;
  baseScale: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}

export interface AsciiSettings {
  resolution: number;
  characters: string;
  fgColor: string;
  bgColor: string;
  invert: boolean;
}
