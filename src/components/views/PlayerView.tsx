import React from 'react';
import { useAppContext } from '../../context/AppContext';

const PlayerView: React.FC = () => {
  const { 
    revealedRegions,
    fogRegions
  } = useAppContext();

  return (
    <div className="bg-gray-700 p-4 rounded">
      <h3 className="font-bold mb-2 text-yellow-300">Exploration:</h3>
      <p className="text-sm mb-3">
        Click on dark areas to explore and reveal the map.
      </p>
      <h3 className="font-bold mb-2 text-yellow-300">Revealed Areas:</h3>
      <div className="space-y-1">
        {Array.from(revealedRegions).map(index => (
          <div key={index} className="text-sm">
            • Region {index + 1}
          </div>
        ))}
        {revealedRegions.size === 0 && (
          <p className="text-sm text-gray-400">No areas explored yet</p>
        )}
      </div>
      <div className="mt-4 p-3 bg-gray-600 rounded">
        <p className="text-xs text-yellow-200">
          Tip: The DM has defined {fogRegions.length} explorable regions
        </p>
      </div>
    </div>
  );
};

export default PlayerView;
