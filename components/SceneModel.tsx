import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { ModelData } from '../types';

interface SceneModelProps {
  modelData: ModelData;
  scaleMultiplier: number;
  positionOffset: { x: number, y: number };
}

const SceneModel: React.FC<SceneModelProps> = ({ modelData, scaleMultiplier, positionOffset }) => {
  // Disable draco (second arg false/undefined) to avoid decoder path issues with generic URLs
  const { scene } = useGLTF(modelData.url);

  useEffect(() => {
    return () => {
      // Optional: Cleanup logic
    };
  }, [modelData.url]);

  const finalScale = modelData.baseScale * scaleMultiplier;
  
  // Combine the model's base position (fix for centering) with the user's manual offset
  const finalPosition: [number, number, number] = [
    modelData.position[0] + positionOffset.x,
    modelData.position[1] + positionOffset.y,
    modelData.position[2]
  ];

  return (
    <primitive
      object={scene}
      scale={[finalScale, finalScale, finalScale]}
      position={finalPosition}
      rotation={modelData.rotation || [0, 0, 0]}
    />
  );
};

export default SceneModel;