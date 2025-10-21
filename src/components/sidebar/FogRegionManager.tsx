import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useFogRegions } from '../../hooks/useFogRegions';

const FogRegionManager: React.FC = () => {
  const {
    fogRegions,
    revealedRegions,
  } = useAppContext();
  
  const { toggleRegionReveal, deleteFogRegion } = useFogRegions();

  return (
    <div className="mb-4 p-3 bg-gray-700 rounded">
      <h3 className="font-bold mb-2 text-yellow-300">Fog Regions ({fogRegions.length}):</h3>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {fogRegions.map((region, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span>Region {index + 1}</span>
            <div className="flex gap-1">
              <button
                onClick={() => toggleRegionReveal(index)}
                className={`px-2 py-0.5 text-xs rounded ${revealedRegions.has(index) ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                {revealedRegions.has(index) ? 'Revealed' : 'Hidden'}
              </button>
              <button
                onClick={() => deleteFogRegion(index)}
                className="px-2 py-0.5 bg-red-600 text-xs rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {fogRegions.length === 0 && (
          <p className="text-sm text-gray-400">No fog regions defined</p>
        )}
      </div>
    </div>
  );
};

export default FogRegionManager;
